import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  ScrollView, 
  TextInput, 
  Alert, 
  FlatList,
  Switch,
  Modal,
  Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ChecklistItemService, ChecklistItemData } from '../services/ChecklistItemService';
import { useChecklistState, checklistStateManager } from '../services/ChecklistStateManager';
import { synchronizationService } from '../services/SynchronizationService';
import { DatabaseFixService } from '../services/DatabaseFixService';

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;
const isTablet = width >= 768 && height >= 1024;

const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsiveFontSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsivePadding = () => {
  if (isSmallScreen) return 16;
  if (isMediumScreen) return 20;
  if (isTablet) return 32;
  return 24;
};

interface ViewEditDeleteChecklistScreenProps {
  onBack: () => void;
}

interface ChecklistSection {
  section: string;
  items: ChecklistItemData[];
}

interface EditItemModalProps {
  visible: boolean;
  item: ChecklistItemData | null;
  onSave: (item: ChecklistItemData) => void;
  onCancel: () => void;
  editingItem: ChecklistItemData | null;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ visible, item, onSave, onCancel, editingItem }) => {
  const [editedItem, setEditedItem] = useState<ChecklistItemData | null>(null);

  useEffect(() => {
    if (item) {
      setEditedItem({ ...item });
    }
  }, [item]);

  const handleSave = () => {
    if (editedItem && editedItem.item.trim()) {
      onSave(editedItem);
    } else {
      Alert.alert('Error', 'Item text cannot be empty');
    }
  };
  if (!visible || !editedItem) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>
              {editingItem?.id ? 'Edit Checklist Item' : 'Create New Item'}
            </Text>
            <TouchableOpacity onPress={onCancel} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Text</Text>
              <TextInput
                style={styles.textInput}
                value={editedItem.item}
                onChangeText={(text) => setEditedItem({ ...editedItem, item: text })}
                placeholder="Enter checklist item text"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Section</Text>
              <TextInput
                style={styles.textInput}
                value={editedItem.section}
                onChangeText={(text) => setEditedItem({ ...editedItem, section: text as any })}
                placeholder="Enter section name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Order Index</Text>
              <TextInput
                style={styles.textInput}
                value={editedItem.order_index?.toString() || ''}
                onChangeText={(text) => setEditedItem({ ...editedItem, order_index: parseInt(text) || 0 })}
                placeholder="Enter order index"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Compulsory Item</Text>
              <Switch
                value={editedItem.is_compulsory || false}
                onValueChange={(value) => setEditedItem({ ...editedItem, is_compulsory: value })}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={editedItem.is_compulsory ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>

          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <LinearGradient
                colors={['#4ecdc4', '#44a08d']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {editingItem?.id ? 'Save Changes' : 'Create Item'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ViewEditDeleteChecklistScreen({ onBack }: ViewEditDeleteChecklistScreenProps) {
  const [checklistTypes, setChecklistTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredSections, setFilteredSections] = useState<ChecklistSection[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItemData | null>(null);
  const [bulkActionMode, setBulkActionMode] = useState(false);

  // Use global state for checklist data
  const { data: checklistItems, refresh: refreshChecklistData, isLoading, isStale } = useChecklistState(selectedType);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    startAnimations();
    loadChecklistTypes();
  }, []);

  // Process global state data into sections
  const sections = React.useMemo(() => {
    if (!checklistItems || checklistItems.length === 0) return [];
    
    // Group items by section
    const groupedSections: { [key: string]: ChecklistItemData[] } = {};
    
    checklistItems.forEach(item => {
      const sectionKey = item.section as string;
      if (!groupedSections[sectionKey]) {
        groupedSections[sectionKey] = [];
      }
      groupedSections[sectionKey].push(item);
    });

    // Convert to array and sort
    return Object.entries(groupedSections).map(([section, items]) => ({
      section,
      items: items.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    }));
  }, [checklistItems]);

  useEffect(() => {
    if (selectedType) {
      loadChecklistItems(selectedType);
    }
  }, [selectedType]);

  useEffect(() => {
    filterItems();
  }, [sections, searchTerm]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadChecklistTypes = async () => {
    try {
      // Get available checklist types from the database
      const types = ['one man cpr', 'two man cpr', 'infant cpr', 'adult choking', 'infant choking'];
      setChecklistTypes(types);
      if (types.length > 0) {
        setSelectedType(types[0]);
      }
    } catch (error) {
      console.error('Error loading checklist types:', error);
    }
  };

  const loadChecklistItems = async (type: string) => {
    try {
      // Use global state refresh
      const result = await refreshChecklistData(() => ChecklistItemService.getChecklistItemsByType(type));
      
      if (result.success && result.items) {
      } else {
        console.error('❌ Failed to load items:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading checklist items:', error);
    }
  };

  const filterItems = () => {
    if (!searchTerm) {
      setFilteredSections(sections);
    } else {
      const filtered = sections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.section.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(section => section.items.length > 0);
      setFilteredSections(filtered);
    }
  };

  const toggleItemSelection = (itemId: string | undefined) => {
    if (!itemId) return;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleBulkActionMode = () => {
    setBulkActionMode(!bulkActionMode);
    setSelectedItems(new Set());
  };

  const handleEditItem = (item: ChecklistItemData) => {
    setEditingItem(item);
    setEditModalVisible(true);
  };

  const handleSaveItem = async (updatedItem: ChecklistItemData) => {
    try {
      if (updatedItem.id) {
        // Update existing item using synchronization service
        const result = await synchronizationService.saveAndSync(async () => {
          return await ChecklistItemService.updateChecklistItem(updatedItem.id!, {
            item: updatedItem.item,
            section: updatedItem.section,
            order_index: updatedItem.order_index,
            is_compulsory: updatedItem.is_compulsory
          });
        }, selectedType);

        if (result.success) {
          setEditModalVisible(false);
          setEditingItem(null);
          // Refresh only the current checklist type
          await refreshChecklistData(() => ChecklistItemService.getChecklistItemsByType(selectedType));
          Alert.alert('Success', 'Checklist item updated successfully');
        } else {
          Alert.alert('Error', result.error || 'Failed to update checklist item');
        }
      } else {
        // Create new item using synchronization service
        const result = await synchronizationService.saveAndSync(async () => {
          return await ChecklistItemService.createChecklistItem({
            checklist_type: updatedItem.checklist_type,
            section: updatedItem.section,
            item: updatedItem.item,
            order_index: updatedItem.order_index,
            is_compulsory: updatedItem.is_compulsory
          });
        }, selectedType);

        if (result.success && result.data) {
          setEditModalVisible(false);
          setEditingItem(null);
          Alert.alert('Success', 'Checklist item created successfully');
        } else {
          Alert.alert('Error', result.error || 'Failed to create checklist item');
        }
      }
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save checklist item');
    }
  };

  const handleDeleteItem = (itemId: string | undefined) => {
    if (!itemId) return;
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this checklist item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the item using synchronization service
              const result = await synchronizationService.saveAndSync(async () => {
                return await ChecklistItemService.deleteChecklistItem(itemId);
              }, selectedType);
              
              if (result.success) {
                Alert.alert('Success', 'Checklist item deleted successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete checklist item');
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete checklist item');
            }
          }
        }
      ]
    );
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Selection', 'Please select items to delete');
      return;
    }

    Alert.alert(
      'Bulk Delete',
      `Are you sure you want to delete ${selectedItems.size} selected items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the items from the database
              const itemIds = Array.from(selectedItems);
              const result = await ChecklistItemService.bulkDeleteChecklistItems(itemIds);
              
              if (result.success) {
                setSelectedItems(new Set());
                setBulkActionMode(false);
                // Refresh only the current checklist type
                await refreshChecklistData(() => ChecklistItemService.getChecklistItemsByType(selectedType));
                Alert.alert('Success', `${itemIds.length} items deleted successfully`);
              } else {
                Alert.alert('Error', result.error || 'Failed to delete selected items');
              }
            } catch (error) {
              console.error('Error bulk deleting items:', error);
              Alert.alert('Error', 'Failed to delete selected items');
            }
          }
        }
      ]
    );
  };

  const handleBulkToggleCompulsory = () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Selection', 'Please select items to modify');
      return;
    }

    Alert.alert(
      'Bulk Toggle Compulsory',
      `Toggle compulsory status for ${selectedItems.size} selected items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Toggle',
          onPress: async () => {
            try {
              // Prepare bulk updates
              const updates = Array.from(selectedItems).map(itemId => {
                const item = sections.flatMap(s => s.items).find(i => i.id === itemId);
                return {
                  id: itemId,
                  updates: {
                    is_compulsory: item ? !item.is_compulsory : false
                  }
                };
              });
              
              // Update the items in the database
              const result = await ChecklistItemService.bulkUpdateChecklistItems(updates);
              
              if (result.success) {
                setSelectedItems(new Set());
                setBulkActionMode(false);
                // Refresh only the current checklist type
                await refreshChecklistData(() => ChecklistItemService.getChecklistItemsByType(selectedType));
                Alert.alert('Success', `${updates.length} items updated successfully`);
              } else {
                Alert.alert('Error', result.error || 'Failed to update selected items');
              }
            } catch (error) {
              console.error('Error bulk updating items:', error);
              Alert.alert('Error', 'Failed to update selected items');
            }
          }
        }
      ]
    );
  };

  const renderChecklistItem = ({ item, section }: { item: ChecklistItemData, section: string }) => (
    <Animated.View
      style={[
        styles.checklistItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemText}>{item.item}</Text>
          <View style={styles.itemMeta}>
            <Text style={styles.sectionText}>{section}</Text>
            <Text style={styles.orderText}>Order: {item.order_index || 0}</Text>
            </View>
                </View>
        
        <View style={styles.itemActions}>
          {bulkActionMode && (
            <TouchableOpacity
              style={[
                styles.selectionButton,
                item.id && selectedItems.has(item.id) && styles.selectedButton
              ]}
              onPress={() => toggleItemSelection(item.id)}
            >
              <Ionicons 
                name={item.id && selectedItems.has(item.id) ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={item.id && selectedItems.has(item.id) ? "#4ecdc4" : "#999"} 
              />
            </TouchableOpacity>
          )}
          
            <TouchableOpacity
              style={styles.actionButton}
            onPress={() => handleEditItem(item)}
            >
            <Ionicons name="create" size={20} color="#667eea" />
            </TouchableOpacity>
          
            <TouchableOpacity
              style={styles.actionButton}
            onPress={() => handleDeleteItem(item.id)}
            >
            <Ionicons name="trash" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        </View>
      
      <View style={styles.itemFooter}>
        <View style={styles.statusBadges}>
            <View style={[
            styles.statusBadge,
            item.is_compulsory ? styles.compulsoryBadge : styles.optionalBadge
          ]}>
            <Text style={[
              styles.statusText,
              item.is_compulsory ? styles.compulsoryText : styles.optionalText
            ]}>
              {item.is_compulsory ? 'COMPULSORY' : 'OPTIONAL'}
            </Text>
          </View>
          
            </View>
        </View>
    </Animated.View>
  );

  const renderSection = ({ item: section }: { item: ChecklistSection }) => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.sectionGradient}
        >
          <Text style={styles.sectionTitle}>
            {section.section.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
          </Text>
          <Text style={styles.sectionCount}>
            {section.items.length} items
          </Text>
      </LinearGradient>
      </View>
      
      {section.items.map((item, index) => (
        <View key={item.id}>
          {renderChecklistItem({ item, section: section.section })}
          {index < section.items.length - 1 && <View style={styles.itemSeparator} />}
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]}
          style={styles.backgroundGradient}
        />
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingSpinner, { transform: [{ scale: scaleAnim }] }]}>
            <Ionicons name="refresh" size={40} color="#4ecdc4" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading checklist items...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
          style={styles.backgroundGradient}
        />

      {/* Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Checklists</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={async () => {
              try {
                const result = await ChecklistItemService.getChecklistItemsByType(selectedType);
                Alert.alert('Database Test', `Connection ${result.success ? 'SUCCESS' : 'FAILED'}\nItems: ${result.items?.length || 0}`);
              } catch (error) {
                console.error('🧪 Test error:', error);
                Alert.alert('Database Test', 'Connection FAILED');
              }
            }}
            style={styles.testButton}
          >
            <Ionicons name="flask" size={20} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={async () => {
              Alert.alert(
                'Database Fix',
                'This will fix choking checklist sections and compulsory status. Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Fix',
                    onPress: async () => {
                      try {
                        const result = await DatabaseFixService.quickFix();
                        if (result.success) {
                          Alert.alert('Success', 'Database fixes completed successfully!\n\n- Choking checklists now use correct sections\n- CPR checklists have correct compulsory status\n- All screens will sync properly');
                          // Refresh the current checklist
                          await refreshChecklistData(() => ChecklistItemService.getChecklistItemsByType(selectedType));
                        } else {
                          Alert.alert('Error', `Database fixes failed: ${result.error}`);
                        }
                      } catch (error) {
                        console.error('Database fix error:', error);
                        Alert.alert('Error', 'Failed to run database fixes');
                      }
                    }
                  }
                ]
              );
            }}
            style={styles.fixButton}
          >
            <Ionicons name="construct" size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              setEditingItem({
                checklist_type: selectedType as any,
                section: 'danger' as any,
                item: '',
                is_compulsory: false,
                order_index: 0
              });
              setEditModalVisible(true);
            }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={toggleBulkActionMode} 
            style={[styles.bulkActionButton, bulkActionMode && styles.bulkActionButtonActive]}
          >
            <Ionicons 
              name={bulkActionMode ? "checkmark" : "checkmark-circle-outline"} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Controls */}
      <Animated.View style={[
        styles.controlsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        {/* Checklist Type Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Checklist Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
            {checklistTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.typeButtonActive
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === type && styles.typeButtonTextActive
                ]}>
                  {type.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Debug Info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Type: {selectedType} | Sections: {sections.length} | Items: {sections.reduce((acc, s) => acc + s.items.length, 0)}
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
            placeholder="Search checklist items..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            placeholderTextColor="#999"
          />
        </View>

        {/* Bulk Actions */}
        {bulkActionMode && (
          <View style={styles.bulkActionsContainer}>
            <Text style={styles.bulkActionsTitle}>
              {selectedItems.size} items selected
            </Text>
            <View style={styles.bulkActions}>
            <TouchableOpacity 
                style={styles.bulkActionButtonInner}
                onPress={handleBulkToggleCompulsory}
              >
                <Ionicons name="swap-horizontal" size={20} color="#ffffff" />
                <Text style={styles.bulkActionText}>Toggle Compulsory</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.deleteBulkButton]}
              onPress={handleBulkDelete}
            >
                <Ionicons name="trash" size={20} color="#ffffff" />
                <Text style={styles.bulkActionText}>Delete Selected</Text>
            </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Content */}
      <Animated.View style={[
        styles.contentContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        {filteredSections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list" size={60} color="#999" />
            <Text style={styles.emptyTitle}>No Checklist Items</Text>
            <Text style={styles.emptyMessage}>
              {searchTerm ? 'No items match your search' : 'No items found for this checklist type'}
              </Text>
            </View>
        ) : (
          <FlatList
            data={filteredSections}
            renderItem={renderSection}
            keyExtractor={(item) => item.section}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </Animated.View>

      {/* Edit Modal */}
      <EditItemModal
        visible={editModalVisible}
        item={editingItem}
        editingItem={editingItem}
        onSave={handleSaveItem}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
    marginRight: 8,
  },
  fixButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffa726',
    marginRight: 8,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#4ecdc4',
    marginRight: 8,
  },
  bulkActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bulkActionButtonActive: {
    backgroundColor: '#4ecdc4',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#4ecdc4',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  bulkActionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bulkActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bulkActionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#667eea',
  },
  deleteBulkButton: {
    backgroundColor: '#ff6b6b',
  },
  bulkActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checklistItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#667eea',
  },
  orderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionButton: {
    padding: 4,
    marginRight: 8,
  },
  selectedButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 4,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statusBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compulsoryBadge: {
    backgroundColor: '#ff6b6b',
  },
  optionalBadge: {
    backgroundColor: '#4ecdc4',
  },
  activeBadge: {
    backgroundColor: '#00ff88',
  },
  inactiveBadge: {
    backgroundColor: '#999',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  compulsoryText: {
    color: '#ffffff',
  },
  optionalText: {
    color: '#ffffff',
  },
  activeText: {
    color: '#ffffff',
  },
  inactiveText: {
    color: '#ffffff',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4ecdc4',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 400,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
