import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';

interface SimpleViewParticipantsScreenProps {
  onBack: () => void;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  ic: string;
  phone: string;
  job: string;
  location: string;
}

export default function SimpleViewParticipantsScreen({ onBack }: SimpleViewParticipantsScreenProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Demo data
  useEffect(() => {
    setParticipants([
      {
        id: '1',
        name: 'MUHSINAH BINTI ABDUL SHOMAD',
        email: 'muhsinah92@gmail.com',
        ic: 'IC: 920408-08-5506',
        phone: 'No phone number',
        job: 'PEGAWAI PERGIGIAN UG 9 • Clinical',
        location: 'KLINIK PERGIGIAN LAWAS'
      },
      {
        id: '2',
        name: 'Ahmad Bin Hassan',
        email: 'ahmad.hassan@example.com',
        ic: 'IC: 901234-56-7890',
        phone: '+60123456789',
        job: 'NURSE • Emergency',
        location: 'HOSPITAL KUALA LUMPUR'
      },
      {
        id: '3',
        name: 'Siti Noor Aishah',
        email: 'siti.aishah@example.com',
        ic: 'IC: 890567-12-3456',
        phone: '+60198765432',
        job: 'DOCTOR • Cardiology',
        location: 'HOSPITAL SULTANAH AMINAH'
      }
    ]);
  }, []);

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleParticipantPress = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedParticipant(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>👥 View Participants</Text>
        <Text style={styles.subtitle}>View all participants with roles</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search participants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Participants List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredParticipants.map((participant) => (
          <TouchableOpacity
            key={participant.id}
            style={styles.participantCard}
            onPress={() => handleParticipantPress(participant)}
            activeOpacity={0.7}
          >
            <Text style={styles.participantName}>{participant.name}</Text>
            <Text style={styles.participantEmail}>📧 {participant.email}</Text>
            <Text style={styles.participantJob}>💼 {participant.job}</Text>
            <Text style={styles.participantLocation}>📍 {participant.location}</Text>
          </TouchableOpacity>
        ))}

        {filteredParticipants.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No participants found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
          </View>
        )}
      </ScrollView>

      {/* Participant Details Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participant Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            {selectedParticipant && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailName}>{selectedParticipant.name}</Text>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📧 Email:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.email}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>🆔 IC Number:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.ic}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📱 Phone:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.phone}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>💼 Job Position:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.job}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📍 Location:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.location}</Text>
                </View>
              </View>
            )}
          </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    fontSize: 16,
    color: '#7f8c8d',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  participantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  participantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  participantEmail: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 5,
  },
  participantJob: {
    fontSize: 14,
    color: '#e67e22',
    marginBottom: 5,
  },
  participantLocation: {
    fontSize: 14,
    color: '#27ae60',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalContent: {
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
});
