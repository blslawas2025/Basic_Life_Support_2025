import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useContainerMaxWidth } from "../utils/uiHooks";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from '../config/supabase';

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

interface ManageChecklistScreenProps {
  onBack: () => void;
  onNavigateToViewEditDelete?: () => void;
  onNavigateToChecklistSettings?: () => void;
  onNavigateToChecklistView?: (checklistType: string) => void;
  onNavigateToChecklistResults?: () => void;
}

export default function ManageChecklistScreen({ 
  onBack, 
  onNavigateToViewEditDelete, 
  onNavigateToChecklistSettings,
  onNavigateToChecklistView,
  onNavigateToChecklistResults 
}: ManageChecklistScreenProps) {
  const containerMaxWidth = useContainerMaxWidth();
  const [testState, setTestState] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showCreateButton, setShowCreateButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const showModal = (title: string, message: string, showCreate: boolean = false) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowCreateButton(showCreate);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setShowCreateButton(false);
  };

  const handleCreateChecklist = async (type: string) => {
    hideModal();
    showModal('Success', `${type.toUpperCase()} checklist is ready! Navigating to checklist view...`);
    setTimeout(() => {
      hideModal();
      if (onNavigateToChecklistView) {
        onNavigateToChecklistView(type);
      }
    }, 1500);
  };

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

    // Continuous animations
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleViewEditDelete = async () => {
    console.log('View/Edit/Delete button clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to the view/edit/delete management screen
    if (onNavigateToViewEditDelete) {
      console.log('Navigating to view/edit/delete management screen...');
      onNavigateToViewEditDelete();
    } else {
      showModal('Navigation Error', 'Unable to navigate to management screen');
    }
  };

  const handleDeleteChecklist = async () => {
    Alert.alert(
      'Delete One Man CPR Checklist',
      'Are you sure you want to delete the One Man CPR checklist? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Simplified version - just show confirmation
            Alert.alert('Success', 'One Man CPR checklist deleted successfully (demo)');
          }
        }
      ]
    );
  };

  const handleChecklistSettings = async () => {
    console.log('Checklist Settings button clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Show simplified checklist settings for the demo version
    const message = 'Checklist Settings & Statistics:\n\n' +
      'ONE MAN CPR:\n' +
      '- Total Items: 5\n' +
      '- Required: 5\n' +
      '- Optional: 0\n\n' +
      'Available Options:\n' +
      '- View/Edit items via "View, Edit, Delete"\n' +
      '- Create new checklists\n' +
      '- Reset progress';
    
    showModal('Checklist Settings', message);
  };

  const handleChecklistResults = async () => {
    console.log('Checklist Results button clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to the checklist results screen
    if (onNavigateToChecklistResults) {
      console.log('Navigating to checklist results screen...');
      onNavigateToChecklistResults();
    } else {
      showModal('Navigation Error', 'Unable to navigate to checklist results screen');
    }
  };

  const handleCreateAllChecklists = async () => {
    Alert.alert(
      'Create All Checklists',
      'This will create all available checklist types (One Man CPR, Two Man CPR, Infant CPR, Adult Choking, Infant Choking). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create All',
          onPress: async () => {
            // Simplified version - just show confirmation
            Alert.alert('Success', 'All checklists created successfully (demo)!');
          }
        }
      ]
    );
  };

  const handleResetAllChecklists = async () => {
    Alert.alert(
      'Reset All Checklists',
      'This will delete all checklist data. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            // Simplified version - just show confirmation
            Alert.alert('Success', 'All checklists have been reset (demo)');
          }
        }
      ]
    );
  };

  const handleOneManCPR = async () => {
    console.log('One Man CPR button clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Since we're using the simplified version with sample data, just navigate directly
    if (onNavigateToChecklistView) {
      console.log('Navigating to checklist view...');
      onNavigateToChecklistView('one man cpr');
    } else {
      console.log('onNavigateToChecklistView prop is missing');
    }
  };

  const handleTwoManCPR = async () => {
    console.log('Two Man CPR button clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Since we're using the simplified version with sample data, just navigate directly
    if (onNavigateToChecklistView) {
      console.log('Navigating to checklist view...');
      onNavigateToChecklistView('two man cpr');
    } else {
      console.log('onNavigateToChecklistView prop is missing');
    }
  };

  const handleInfantCPR = async () => {
    console.log('Infant CPR button clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (onNavigateToChecklistView) {
      console.log('Navigating to checklist view...');
      onNavigateToChecklistView('infant cpr');
    } else {
      console.log('onNavigateToChecklistView prop is missing');
    }
  };

  const handleAdultChoking = async () => {
    console.log('Adult Choking button clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (onNavigateToChecklistView) {
      console.log('Navigating to checklist view...');
      onNavigateToChecklistView('adult choking');
    } else {
      console.log('onNavigateToChecklistView prop is missing');
    }
  };

  const handleInfantChoking = async () => {
    console.log('Infant Choking button clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (onNavigateToChecklistView) {
      console.log('Navigating to checklist view...');
      onNavigateToChecklistView('infant choking');
    } else {
      console.log('onNavigateToChecklistView prop is missing');
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View style={[
          styles.animatedGradient,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0.3, 0.7, 0.4, 0.8, 0.3]
            }),
          }
        ]}>
          <LinearGradient 
            colors={["#00d4ff", "#5b73ff", "#00ff88", "#ff0080", "#ffaa00", "#00d4ff"]} 
            style={styles.backgroundGradient}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </Animated.View>

      {/* Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Animated.View style={[
            styles.headerIcon,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}>
            <LinearGradient 
              colors={["#ffaa00", "#ff0080", "#5b73ff"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="list" size={24} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Manage Checklist</Text>
            <Text style={styles.headerSubtitle}>View, edit and manage checklists</Text>
          </View>
          
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : null]}
      >

        {/* Action Cards */}
        <Animated.View style={[
          styles.actionCardsContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 0]
              }) }
            ]
          }
        ]}>
          <View style={styles.actionCardsGrid}>
            {/* Card 1: View, Edit, Delete Checklist */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewEditDelete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons name="list" size={24} color="#00d4ff" />
                  </View>
                  <Text style={styles.actionCardTitle}>View, Edit & Delete</Text>
                  <Text style={styles.actionCardSubtitle}>Manage existing checklists</Text>
                </View>
                <View style={styles.actionCardArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#00d4ff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Card 2: One Man CPR */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleOneManCPR}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 0, 128, 0.2)', 'rgba(255, 0, 128, 0.1)']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons name="heart" size={24} color="#ff0080" />
                  </View>
                  <Text style={styles.actionCardTitle}>One Man CPR</Text>
                  <Text style={styles.actionCardSubtitle}>View and manage CPR checklist</Text>
                </View>
                <View style={styles.actionCardArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#ff0080" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Card 3: Two Man CPR */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleTwoManCPR}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons name="people" size={24} color="#00ff88" />
                  </View>
                  <Text style={styles.actionCardTitle}>Two Man CPR</Text>
                  <Text style={styles.actionCardSubtitle}>View and manage two-person CPR checklist</Text>
                </View>
                <View style={styles.actionCardArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#00ff88" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Card 4: Infant CPR */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleInfantCPR}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 165, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons name="heart" size={24} color="#ffa500" />
                  </View>
                  <Text style={styles.actionCardTitle}>Infant CPR</Text>
                  <Text style={styles.actionCardSubtitle}>View and manage infant CPR checklist</Text>
                </View>
                <View style={styles.actionCardArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#ffa500" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Card 5: Adult Choking */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleAdultChoking}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 0.1)']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons name="person" size={24} color="#ff6384" />
                  </View>
                  <Text style={styles.actionCardTitle}>Adult Choking</Text>
                  <Text style={styles.actionCardSubtitle}>View and manage adult choking checklist</Text>
                </View>
                <View style={styles.actionCardArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#ff6384" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Card 6: Infant Choking */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleInfantChoking}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(156, 39, 176, 0.2)', 'rgba(156, 39, 176, 0.1)']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons name="heart" size={24} color="#9c27b0" />
                  </View>
                  <Text style={styles.actionCardTitle}>Infant Choking</Text>
                  <Text style={styles.actionCardSubtitle}>View and manage infant choking checklist</Text>
                </View>
                <View style={styles.actionCardArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#9c27b0" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Card 7: Checklist Settings */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleChecklistSettings}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons name="settings" size={24} color="#8b5cf6" />
                  </View>
                  <Text style={styles.actionCardTitle}>Checklist Settings</Text>
                  <Text style={styles.actionCardSubtitle}>Configure checklist options</Text>
                </View>
                <View style={styles.actionCardArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#8b5cf6" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Card 8: Checklist Results */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleChecklistResults}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Ionicons name="analytics" size={24} color="#22c55e" />
                  </View>
                  <Text style={styles.actionCardTitle}>Checklist Results</Text>
                  <Text style={styles.actionCardSubtitle}>View results from all 5 stations</Text>
                </View>
                <View style={styles.actionCardArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#22c55e" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </Animated.View>

        {/* Info Section */}
        <Animated.View style={[
          styles.infoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0]
              }) }
            ]
          }
        ]}>
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={24} color="#00d4ff" />
                <Text style={styles.infoTitle}>Checklist Management</Text>
              </View>
              <Text style={styles.infoText}>
                Use the options above to manage your checklists. View and edit One Man CPR and Two Man CPR checklists, 
                manage existing checklists, view results from all 5 stations, or configure settings and statistics for your checklist system.
              </Text>
              <View style={styles.infoFeatures}>
                <View style={styles.infoFeature}>
                  <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                  <Text style={styles.infoFeatureText}>View One Man CPR checklist</Text>
                </View>
                <View style={styles.infoFeature}>
                  <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                  <Text style={styles.infoFeatureText}>View Two Man CPR checklist</Text>
                </View>
                <View style={styles.infoFeature}>
                  <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                  <Text style={styles.infoFeatureText}>Edit and delete checklists</Text>
                </View>
                <View style={styles.infoFeature}>
                  <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                  <Text style={styles.infoFeatureText}>View results from all 5 stations</Text>
                </View>
                <View style={styles.infoFeature}>
                  <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                  <Text style={styles.infoFeatureText}>Checklist statistics and settings</Text>
                </View>
                <View style={styles.infoFeature}>
                  <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                  <Text style={styles.infoFeatureText}>Create and reset all checklists</Text>
                </View>
                <View style={styles.infoFeature}>
                  <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                  <Text style={styles.infoFeatureText}>Fix compulsory status for CPR checklists</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Custom Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            
            <View style={styles.modalButtons}>
              {showCreateButton ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={hideModal}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={() => handleCreateChecklist('checklist')}
                  >
                    <Text style={styles.modalButtonText}>Create</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={hideModal}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  animatedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(255, 170, 0, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 170, 0, 0.4)',
    shadowColor: '#ffaa00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  backButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
    shadowColor: '#ffaa00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  headerIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 24,
  },
  actionCardsContainer: {
    marginBottom: 24,
  },
  actionCardsGrid: {
    flexDirection: 'column',
    gap: 24,
  },
  actionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionCardGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  actionCardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  actionCardArrow: {
    marginLeft: 24,
  },
  infoContainer: {
    marginTop: 24,
  },
  infoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  infoCardGradient: {
    padding: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 24,
  },
  infoText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
    marginBottom: 24,
  },
  infoFeatures: {
    gap: 24,
  },
  infoFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  infoFeatureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  modalButtonPrimary: {
    backgroundColor: '#00d4ff',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonTextSecondary: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
