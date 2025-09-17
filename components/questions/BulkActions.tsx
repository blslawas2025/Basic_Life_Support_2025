import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../utils/colorScheme';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkExport: () => void;
  onBulkImport: () => void;
}

export default function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
  onBulkExport,
  onBulkImport,
}: BulkActionsProps) {
  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Questions',
      `Are you sure you want to delete ${selectedCount} question(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onBulkDelete },
      ]
    );
  };

  const handleBulkActivate = () => {
    Alert.alert(
      'Activate Questions',
      `Are you sure you want to activate ${selectedCount} question(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', onPress: onBulkActivate },
      ]
    );
  };

  const handleBulkDeactivate = () => {
    Alert.alert(
      'Deactivate Questions',
      `Are you sure you want to deactivate ${selectedCount} question(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', onPress: onBulkDeactivate },
      ]
    );
  };

  if (selectedCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {totalCount} question{totalCount !== 1 ? 's' : ''} available
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onSelectAll}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.neon.electric} />
            <Text style={styles.actionButtonText}>Select All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onBulkImport}>
            <Ionicons name="cloud-upload-outline" size={18} color={COLORS.neon.green} />
            <Text style={styles.actionButtonText}>Import</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onBulkExport}>
            <Ionicons name="download-outline" size={18} color={COLORS.neon.orange} />
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={COLORS.gradient.primary}
      style={styles.selectedContainer}
    >
      <View style={styles.selectedInfo}>
        <Ionicons name="checkmark-circle" size={20} color={COLORS.text.primary} />
        <Text style={styles.selectedText}>
          {selectedCount} of {totalCount} selected
        </Text>
      </View>
      
      <View style={styles.selectedActions}>
        <TouchableOpacity style={styles.selectedActionButton} onPress={onDeselectAll}>
          <Ionicons name="close-circle-outline" size={18} color={COLORS.text.primary} />
          <Text style={styles.selectedActionText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.selectedActionButton} onPress={handleBulkActivate}>
          <Ionicons name="play-circle-outline" size={18} color={COLORS.text.primary} />
          <Text style={styles.selectedActionText}>Activate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.selectedActionButton} onPress={handleBulkDeactivate}>
          <Ionicons name="pause-circle-outline" size={18} color={COLORS.text.primary} />
          <Text style={styles.selectedActionText}>Deactivate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.selectedActionButton} onPress={handleBulkDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.neon.red} />
          <Text style={[styles.selectedActionText, { color: COLORS.neon.red }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  selectionInfo: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectionText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  actionButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.primary,
    marginLeft: SPACING.xs,
  },
  selectedContainer: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: COLORS.shadow.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectedText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
    fontWeight: 'bold',
  },
  selectedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  selectedActionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.primary,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
});
