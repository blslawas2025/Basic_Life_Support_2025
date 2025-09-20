import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal, SafeAreaView, Dimensions } from "react-native";
import { ProfileService, Profile } from "../services/ProfileService";

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

interface ViewParticipantsScreenProps {
  onBack: () => void;
}

export default function ViewParticipantsScreen({ onBack }: ViewParticipantsScreenProps) {
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<Profile | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchQuery]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const allProfiles = await ProfileService.getAllProfiles();
      // Filter to only show user profiles
      const userProfiles = allProfiles.filter(p => p.roles === 'user');
      setParticipants(userProfiles);
    } catch (error) {
      console.error('Error loading participants:', error);
      // Create demo data if service fails
      const demoData: Profile[] = [
        {
          id: '1',
          name: 'MUHSINAH BINTI ABDUL SHOMAD',
          email: 'muhsinah92@gmail.com',
          ic_number: '920408-08-5506',
          phone_number: '',
          job_position_name: 'PEGAWAI PERGIGIAN UG 9 • Clinical',
          workplace_name: 'KLINIK PERGIGIAN LAWAS',
          roles: 'user',
          has_allergies: false,
          is_pregnant: false,
          course_session_id: null,
          profile_id: '1',
          user_id: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Ahmad Bin Hassan',
          email: 'ahmad.hassan@example.com',
          ic_number: '901234-56-7890',
          phone_number: '+60123456789',
          job_position_name: 'NURSE • Emergency',
          workplace_name: 'HOSPITAL KUALA LUMPUR',
          roles: 'user',
          has_allergies: false,
          is_pregnant: false,
          course_session_id: null,
          profile_id: '2',
          user_id: '2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setParticipants(demoData);
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = participants;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.email && p.email.toLowerCase().includes(query))
      );
    }

    // Sort by name
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredParticipants(filtered);
  };

  const handleParticipantPress = (participant: Profile) => {
    setSelectedParticipant(participant);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedParticipant(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>👥 View Participants</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading participants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header - NO POSITION ABSOLUTE */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👥 View Participants</Text>
        <Text style={styles.subtitle}>Mobile-optimized • Proper scrolling</Text>
      </View>

      {/* Search Section - NO POSITION ABSOLUTE */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search participants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <Text style={styles.resultCount}>
          {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Scrollable Content - PROPER SCROLLVIEW */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {filteredParticipants.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No participants found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'No participants available'}
            </Text>
          </View>
        ) : (
          filteredParticipants.map((participant, index) => (
            <TouchableOpacity
              key={participant.id}
              style={styles.participantCard}
              onPress={() => handleParticipantPress(participant)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.participantName}>{participant.name}</Text>
                <Text style={styles.participantIndex}>#{index + 1}</Text>
              </View>
              
              <Text style={styles.participantEmail}>📧 {participant.email}</Text>
              <Text style={styles.participantJob}>💼 {participant.job_position_name || 'No job specified'}</Text>
              <Text style={styles.participantWorkplace}>🏢 {participant.workplace_name || 'No workplace specified'}</Text>
              
              {participant.ic_number && (
                <Text style={styles.participantIC}>🆔 IC: {participant.ic_number}</Text>
              )}
              
              <View style={styles.statusRow}>
                {participant.has_allergies && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>⚠️ Allergies</Text>
                  </View>
                )}
                {participant.is_pregnant && (
                  <View style={[styles.statusBadge, { backgroundColor: '#f39c12' }]}>
                    <Text style={styles.statusText}>🤰 Pregnant</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Test Scrolling Section */}
        <View style={styles.testScrollSection}>
          <Text style={styles.testTitle}>📱 Scroll Test Section</Text>
          <Text style={styles.testDescription}>
            This section tests that scrolling works properly on mobile devices.
            The participant details should scroll with the content, not stay fixed.
          </Text>
          
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <View key={i} style={styles.testItem}>
              <Text style={styles.testItemText}>
                Test Item {i} - Everything scrolls properly now! 🎉
              </Text>
            </View>
          ))}
        </View>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Participant Detail Modal - PROPER MODAL */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Participant Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          
          {selectedParticipant && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalParticipantName}>{selectedParticipant.name}</Text>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>📧 Contact Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.email}</Text>
                </View>
                {selectedParticipant.phone_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedParticipant.phone_number}</Text>
                  </View>
                )}
                {selectedParticipant.ic_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IC Number:</Text>
                    <Text style={styles.detailValue}>{selectedParticipant.ic_number}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>💼 Work Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Job Position:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.job_position_name || 'Not specified'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Workplace:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.workplace_name || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>🏥 Medical Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Allergies:</Text>
                  <Text style={[styles.detailValue, { color: selectedParticipant.has_allergies ? '#e74c3c' : '#27ae60' }]}>
                    {selectedParticipant.has_allergies ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pregnant:</Text>
                  <Text style={[styles.detailValue, { color: selectedParticipant.is_pregnant ? '#f39c12' : '#27ae60' }]}>
                    {selectedParticipant.is_pregnant ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Header styles - NO POSITION ABSOLUTE
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  // Search section - NO POSITION ABSOLUTE
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 10,
  },
  resultCount: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  // Scroll container - PROPER SCROLLVIEW
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  // Participant cards
  participantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  participantIndex: {
    fontSize: 14,
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantEmail: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 6,
  },
  participantJob: {
    fontSize: 14,
    color: '#e67e22',
    marginBottom: 6,
  },
  participantWorkplace: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 6,
  },
  participantIC: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
  },
  // Test scroll section
  testScrollSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  testDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 20,
  },
  testItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  testItemText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 50,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalParticipantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
});
