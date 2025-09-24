import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ProfileService, Profile } from "../services/ProfileService";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const getResponsiveSize = (base: number) => {
  if (width < 375) return base * 0.9;
  if (width < 768) return base;
  return base * 1.1;
};

const getResponsiveFontSize = (base: number) => {
  if (width < 375) return base - 1;
  if (width < 768) return base;
  return base + 1;
};

interface ApproveParticipantsScreenProps {
  onBack: () => void;
}

export default function ApproveParticipantsScreen({ onBack }: ApproveParticipantsScreenProps) {
  const [pendingParticipants, setPendingParticipants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'paid' | 'bulk_approve';
    participant: Profile | null;
    bulkCount?: number;
  }>({ type: 'approve', participant: null });
  const [isBulkApproving, setIsBulkApproving] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    startAnimations();
    fetchPendingParticipants();
  }, []);

  const startAnimations = () => {
    Animated.stagger(150, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchPendingParticipants = async () => {
    try {
      setLoading(true);
      const participants = await ProfileService.getPendingParticipants();
      setPendingParticipants(participants);
    } catch (error) {
      console.error('Error fetching pending participants:', error);
      Alert.alert('Error', 'Failed to load pending participants');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (participantId: string) => {
    console.log('=== handleMarkAsPaid called ===');
    console.log('participantId:', participantId);
    console.log('pendingParticipants:', pendingParticipants);
    
    const participant = pendingParticipants.find(p => p.id === participantId);
    console.log('Found participant:', participant);
    
    if (!participant) {
      console.log('Participant not found, showing error alert');
      Alert.alert('Error', 'Participant not found');
      return;
    }
    
    console.log('About to show confirmation modal for participant:', participant.name);
    
    // Set the participant for the modal and show it
    setConfirmAction({
      type: 'paid',
      participant: participant
    });
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    const participant = confirmAction.participant;
    if (!participant) return;

    try {
      console.log('Starting payment update for participant:', participant.id);
      setProcessingIds(prev => new Set(prev).add(participant.id));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      console.log('Calling ProfileService.updateProfile...');
      const result = await ProfileService.updateProfile(participant.id, { 
        payment_status: 'paid'
      });
      console.log('ProfileService.updateProfile result:', result);
      
      // Update local state
      setPendingParticipants(prev => 
        prev.map(p => 
          p.id === participant.id 
            ? { ...p, payment_status: 'paid' }
            : p
        )
      );
      
      console.log('Payment status updated successfully');
      setShowPaymentModal(false);
      Alert.alert('Success', `${participant.name}'s payment has been marked as completed`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to update payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(participant.id);
        return newSet;
      });
    }
  };

  const handleApprove = async (participantId: string) => {
    const participant = pendingParticipants.find(p => p.id === participantId);
    if (!participant) {
      console.error('Participant not found!');
      Alert.alert('Error', 'Participant not found');
      return;
    }
    
    // Show custom modal instead of Alert.alert
    setConfirmAction({ type: 'approve', participant });
    setShowConfirmModal(true);
  };

  const handleReject = async (participantId: string) => {
    const participant = pendingParticipants.find(p => p.id === participantId);
    
    Alert.alert(
      'Confirm Rejection',
      `Are you sure you want to reject ${participant?.name}?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingIds(prev => new Set(prev).add(participantId));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              await ProfileService.updateProfile(participantId, { 
                status: 'rejected',
                approved_at: new Date().toISOString()
              });
              
              // Remove from pending list immediately
              setPendingParticipants(prev => prev.filter(p => p.id !== participantId));
              
              Alert.alert('Success', `${participant?.name} has been rejected`);
            } catch (error) {
              console.error('Error rejecting participant:', error);
              Alert.alert('Error', 'Failed to reject participant');
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(participantId);
                return newSet;
              });
            }
          }
        }
      ]
    );
  };

  const handleConfirmAction = async () => {
    if (confirmAction.type === 'bulk_approve') {
      setShowConfirmModal(false);
      
      const paidParticipants = pendingParticipants.filter(p => p.payment_status === 'paid');
      setIsBulkApproving(true);
      setBulkProgress({ current: 0, total: paidParticipants.length });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < paidParticipants.length; i++) {
        const participant = paidParticipants[i];
        setBulkProgress({ current: i + 1, total: paidParticipants.length });
        
        try {
          await ProfileService.updateProfile(participant.id, { 
            status: 'approved',
            approved_at: new Date().toISOString()
          });
          successCount++;
          
          // Remove from pending list
          setPendingParticipants(prev => prev.filter(p => p.id !== participant.id));
          
        } catch (error) {
          console.error(`Error approving ${participant.name}:`, error);
          errorCount++;
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setIsBulkApproving(false);
      setBulkProgress({ current: 0, total: 0 });
      
      if (errorCount === 0) {
        Alert.alert('Success', `Successfully approved ${successCount} participant${successCount > 1 ? 's' : ''}!`);
      } else {
        Alert.alert('Partial Success', `Approved ${successCount} participants. ${errorCount} failed.`);
      }
      return;
    }
    
    if (!confirmAction.participant) return;
    
    const participantId = confirmAction.participant.id;
    const participantName = confirmAction.participant.name;
    
    try {
      setProcessingIds(prev => new Set(prev).add(participantId));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (confirmAction.type === 'approve') {
        await ProfileService.updateProfile(participantId, { 
          status: 'approved',
          approved_at: new Date().toISOString()
        });
        
        // Remove from pending list immediately
        setPendingParticipants(prev => prev.filter(p => p.id !== participantId));
        
        Alert.alert('Success', `${participantName} has been approved successfully`);
      }
      
    } catch (error) {
      console.error('Error processing action:', error);
      Alert.alert('Error', 'Failed to process action');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
      setShowConfirmModal(false);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction({ type: 'approve', participant: null });
  };

  const handleApproveAllPaid = async () => {
    const paidParticipants = pendingParticipants.filter(p => p.payment_status === 'paid');
    if (paidParticipants.length === 0) {
      Alert.alert('No Paid Participants', 'No participants have been marked as paid yet.');
      return;
    }

    // Show custom modal for bulk approval
    setConfirmAction({ type: 'bulk_approve', participant: null, bulkCount: paidParticipants.length });
    setShowConfirmModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      default: return '#F44336';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'PAID';
      case 'pending': return 'PENDING';
      default: return 'UNPAID';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Elegant Header */}
      <LinearGradient
        colors={["#2C3E50", "#34495E"]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Participant Approval</Text>
          <Text style={styles.headerSubtitle}>
            {loading ? "Loading..." : 
             isBulkApproving ? `Approving ${bulkProgress.current}/${bulkProgress.total}...` :
             `${pendingParticipants.length} participants awaiting review`}
          </Text>
        </View>
        
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[
          styles.participantsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading participants...</Text>
            </View>
          ) : pendingParticipants.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySubtitle}>No participants pending approval</Text>
            </View>
          ) : (
            pendingParticipants.map((participant) => {
              return (
              <View key={participant.id} style={styles.participantCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.avatarText}>
                      {participant.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantMainInfo}>
                    <Text style={styles.participantName} numberOfLines={2}>
                      {participant.name}
                    </Text>
                    <Text style={styles.participantEmail} numberOfLines={1}>
                      {participant.email}
                    </Text>
                    <Text style={styles.participantJob} numberOfLines={2}>
                      {participant.job_position_name || 'No position specified'}
                    </Text>
                  </View>
                  <View style={styles.statusSection}>
                    <View style={[
                      styles.paymentBadge, 
                      { backgroundColor: getPaymentStatusColor(participant.payment_status || 'pending') }
                    ]}>
                      <Text style={styles.paymentBadgeText}>
                        {getPaymentStatusText(participant.payment_status || 'pending')}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {formatDate(participant.created_at)}
                    </Text>
                  </View>
                </View>

                {/* Detailed Information - Labeled Pattern */}
                <View style={styles.detailsSection}>
                  <View style={styles.detailField}>
                    <Ionicons name="card-outline" size={16} color="#3498DB" />
                    <Text style={styles.detailLabel}>IC Number</Text>
                    <Text style={styles.detailValue}>
                      {participant.ic_number || 'Not provided'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailField}>
                    <Ionicons name="call-outline" size={16} color="#3498DB" />
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>
                      {participant.phone_number || 'Not provided'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailField}>
                    <Ionicons name="business-outline" size={16} color="#3498DB" />
                    <Text style={styles.detailLabel}>Workplace</Text>
                    <Text style={styles.detailValue}>
                      {participant.tempat_bertugas || 'Not specified'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailField}>
                    <Ionicons name="school-outline" size={16} color="#3498DB" />
                    <Text style={styles.detailLabel}>Grade</Text>
                    <Text style={styles.detailValue}>
                      {participant.grade || 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.detailField}>
                    <Ionicons name="medical-outline" size={16} color="#3498DB" />
                    <Text style={styles.detailLabel}>Last BLS</Text>
                    <Text style={styles.detailValue}>
                      {participant.last_bls_attempt || 'Not specified'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailField}>
                    <Ionicons name="heart-outline" size={16} color="#3498DB" />
                    <Text style={styles.detailLabel}>Medical</Text>
                    <Text style={styles.detailValue}>
                      {participant.has_asthma || participant.has_allergies || participant.is_pregnant 
                        ? 'Conditions noted' 
                        : 'No conditions'}
                    </Text>
                  </View>

                  {/* Medical Details */}
                  {(participant.has_asthma || participant.has_allergies || participant.is_pregnant) && (
                    <View style={styles.medicalDetails}>
                      {participant.has_asthma && (
                        <View style={styles.medicalItem}>
                          <Ionicons name="warning-outline" size={14} color="#FF9800" />
                          <Text style={styles.medicalText}>Asthma</Text>
                        </View>
                      )}
                      {participant.has_allergies && (
                        <View style={styles.medicalItem}>
                          <Ionicons name="warning-outline" size={14} color="#FF9800" />
                          <Text style={styles.medicalText}>
                            Allergies: {participant.allergies_description || 'Not specified'}
                          </Text>
                        </View>
                      )}
                      {participant.is_pregnant && (
                        <View style={styles.medicalItem}>
                          <Ionicons name="warning-outline" size={14} color="#FF9800" />
                          <Text style={styles.medicalText}>
                            Pregnant: {participant.pregnancy_weeks ? `${participant.pregnancy_weeks} weeks` : 'Not specified'}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                
                {/* Action Buttons */}
                <View style={styles.actionSection}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.paidButton,
                      processingIds.has(participant.id) && styles.disabledButton,
                      participant.payment_status === 'paid' && styles.completedButton
                    ]}
                    onPress={() => {
                      handleMarkAsPaid(participant.id);
                    }}
                    disabled={processingIds.has(participant.id) || participant.payment_status === 'paid'}
                  >
                    <Ionicons 
                      name={participant.payment_status === 'paid' ? "checkmark-circle" : "card"} 
                      size={18} 
                      color="#ffffff" 
                    />
                    <Text style={styles.actionButtonText}>
                      {participant.payment_status === 'paid' ? 'Paid' : 'Mark Paid'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.rejectButton,
                      processingIds.has(participant.id) && styles.disabledButton
                    ]}
                    onPress={() => handleReject(participant.id)}
                    disabled={processingIds.has(participant.id)}
                  >
                    <Ionicons name="close-circle" size={18} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.approveButton,
                      processingIds.has(participant.id) && styles.disabledButton,
                      participant.payment_status !== 'paid' && styles.disabledButton
                    ]}
                    onPress={() => {
                      // Temporary test alert
                      Alert.alert('Debug', `Button clicked for ${participant.name}. Payment status: ${participant.payment_status}`);
                      
                      handleApprove(participant.id);
                    }}
                    disabled={processingIds.has(participant.id) || participant.payment_status !== 'paid'}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={styles.actionButtonText}>
                      {participant.payment_status !== 'paid' ? 'Pay First' : 'Approve'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>

      {/* Prominent Approve All Paid Button */}
      {pendingParticipants.filter(p => p.payment_status === 'paid').length > 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.floatingApproveButton,
              isBulkApproving && styles.disabledButton
            ]}
            onPress={() => {
              const paidParticipants = pendingParticipants.filter(p => p.payment_status === 'paid');
              if (paidParticipants.length === 0) {
                Alert.alert('No Paid Participants', 'No participants have been marked as paid yet.');
                return;
              }
              
              handleApproveAllPaid();
            }}
            disabled={isBulkApproving}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.floatingButtonGradient}
            >
              <Ionicons name="checkmark-done" size={28} color="#ffffff" />
              <View style={styles.floatingButtonText}>
                <Text style={styles.floatingButtonMainText}>
                  {isBulkApproving ? 'Approving...' : 'APPROVE ALL PAID'}
                </Text>
                <Text style={styles.floatingButtonSubText}>
                  {isBulkApproving 
                    ? `${bulkProgress.current}/${bulkProgress.total} participants`
                    : `${pendingParticipants.filter(p => p.payment_status === 'paid').length} participants ready`
                  }
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelAction}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name="warning-outline" 
                size={32} 
                color="#FF9800" 
              />
              <Text style={styles.modalTitle}>
                {confirmAction.type === 'bulk_approve' ? 'Confirm Bulk Approval' : 'Confirm Approval'}
              </Text>
            </View>
            
            <Text style={styles.modalMessage}>
              {confirmAction.type === 'bulk_approve' 
                ? `Are you sure you want to approve ${confirmAction.bulkCount} participant${confirmAction.bulkCount && confirmAction.bulkCount > 1 ? 's' : ''} who have paid?`
                : `Are you sure you want to approve ${confirmAction.participant?.name}?`
              }
            </Text>
            <Text style={styles.modalWarning}>
              This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelAction}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmAction}
              >
                <Text style={styles.confirmButtonText}>
                  {confirmAction.type === 'bulk_approve' ? 'Approve All' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name="card-outline" 
                size={32} 
                color="#FF9800" 
              />
              <Text style={styles.modalTitle}>Confirm Payment</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Mark {confirmAction.participant?.name}'s payment as completed?
            </Text>
            <Text style={styles.modalWarning}>
              This will enable the approve button for this participant.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmPayment}
                disabled={processingIds.has(confirmAction.participant?.id || '')}
              >
                <Text style={styles.confirmButtonText}>
                  {processingIds.has(confirmAction.participant?.id || '') ? 'Processing...' : 'Mark as Paid'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerRight: {
    width: 40,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  floatingApproveButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 16,
  },
  floatingButtonText: {
    flex: 1,
  },
  floatingButtonMainText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  floatingButtonSubText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for floating button
  },
  participantsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  participantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  participantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  participantMainInfo: {
    flex: 1,
    marginRight: 16,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
    lineHeight: 22,
  },
  participantEmail: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  participantJob: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
    lineHeight: 18,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dateText: {
    fontSize: 12,
    color: '#95A5A6',
  },
  detailsSection: {
    padding: 20,
    paddingTop: 0,
  },
  detailField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
    minWidth: 60,
  },
  detailValue: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
  },
  medicalDetails: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  medicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  medicalText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  paidButton: {
    backgroundColor: '#FF9800',
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  completedButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  modalWarning: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
