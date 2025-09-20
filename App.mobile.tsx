// App.mobile.tsx - Complete Mobile-First Version
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Types
interface UserData {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  userName: string;
  roles: 'admin' | 'staff' | 'user';
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

interface TestResult {
  id: string;
  participantName: string;
  testType: string;
  score: number;
  percentage: number;
  status: 'Pass' | 'Fail' | 'Pending';
  date: string;
  duration: string;
}

type Screen = 'login' | 'dashboard' | 'participants' | 'results' | 'staff' | 'settings';

export default function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    id: 'demo-user',
    email: 'demo@example.com',
    isSuperAdmin: true,
    userName: 'Demo User',
    roles: 'admin'
  });

  // Demo data
  const [participants] = useState<Participant[]>([
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
    }
  ]);

  const [testResults] = useState<TestResult[]>([
    {
      id: '1',
      participantName: 'MUHSINAH BINTI ABDUL SHOMAD',
      testType: 'Pre-Test',
      score: 85,
      percentage: 85,
      status: 'Pass',
      date: '2024-01-15',
      duration: '25 minutes'
    },
    {
      id: '2',
      participantName: 'Ahmad Bin Hassan',
      testType: 'Post-Test',
      score: 92,
      percentage: 92,
      status: 'Pass',
      date: '2024-01-16',
      duration: '22 minutes'
    }
  ]);

  // Navigation
  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => setIsLoggedIn(false) }
    ]);
  };

  // Login Screen
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
      if (email && password) {
        setIsLoggedIn(true);
        setCurrentScreen('dashboard');
      } else {
        Alert.alert('Error', 'Please enter email and password');
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginTitle}>🏥 Basic Life Support</Text>
            <Text style={styles.loginSubtitle}>Training Platform Login</Text>
          </View>

          <View style={styles.loginForm}>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginFooter}>
            <Text style={styles.footerText}>Mobile Optimized Platform</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Dashboard Screen
  const DashboardScreen = () => {
    const menuItems = [
      { title: "👥 Participants", subtitle: "Manage participants", screen: 'participants' as Screen, color: "#3498db" },
      { title: "📊 Results", subtitle: "View test results", screen: 'results' as Screen, color: "#27ae60" },
      { title: "👨‍💼 Staff", subtitle: "Manage staff", screen: 'staff' as Screen, color: "#e74c3c" },
      { title: "⚙️ Settings", subtitle: "App settings", screen: 'settings' as Screen, color: "#9b59b6" }
    ];

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.dashboardContent}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userData.userName}</Text>
            <Text style={styles.subtitle}>Basic Life Support Training</Text>
          </View>

          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: item.color }]}
                onPress={() => navigateToScreen(item.screen)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Participants Screen
  const ParticipantsScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [showModal, setShowModal] = useState(false);

    const filteredParticipants = participants.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleParticipantPress = (participant: Participant) => {
      setSelectedParticipant(participant);
      setShowModal(true);
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigateToScreen('dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>👥 Participants</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search participants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView style={styles.listContainer}>
          {filteredParticipants.map(participant => (
            <TouchableOpacity
              key={participant.id}
              style={styles.listItem}
              onPress={() => handleParticipantPress(participant)}
            >
              <Text style={styles.itemTitle}>{participant.name}</Text>
              <Text style={styles.itemSubtitle}>📧 {participant.email}</Text>
              <Text style={styles.itemDetail}>💼 {participant.job}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participant Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            {selectedParticipant && (
              <ScrollView style={styles.modalContent}>
                <Text style={styles.detailName}>{selectedParticipant.name}</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📧 Email:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.email}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>🆔 IC:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.ic}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📱 Phone:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.phone}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>💼 Job:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.job}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📍 Location:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.location}</Text>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  };

  // Results Screen
  const ResultsScreen = () => {
    const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
    const [showModal, setShowModal] = useState(false);

    const statistics = {
      total: testResults.length,
      passed: testResults.filter(r => r.status === 'Pass').length,
      failed: testResults.filter(r => r.status === 'Fail').length,
      average: Math.round(testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length)
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Pass': return '#27ae60';
        case 'Fail': return '#e74c3c';
        default: return '#f39c12';
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigateToScreen('dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>📊 Test Results</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScrollView}>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
              <Text style={styles.statNumber}>{statistics.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#27ae60' }]}>
              <Text style={styles.statNumber}>{statistics.passed}</Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#e74c3c' }]}>
              <Text style={styles.statNumber}>{statistics.failed}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#9b59b6' }]}>
              <Text style={styles.statNumber}>{statistics.average}%</Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>
          </View>
        </ScrollView>

        <ScrollView style={styles.listContainer}>
          {testResults.map(result => (
            <TouchableOpacity
              key={result.id}
              style={styles.listItem}
              onPress={() => {
                setSelectedResult(result);
                setShowModal(true);
              }}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.itemTitle}>{result.participantName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) }]}>
                  <Text style={styles.statusText}>{result.status}</Text>
                </View>
              </View>
              <Text style={styles.itemSubtitle}>📝 {result.testType}</Text>
              <Text style={styles.itemDetail}>🎯 Score: {result.score}%</Text>
              <Text style={styles.itemDetail}>📅 {result.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Test Result Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            {selectedResult && (
              <ScrollView style={styles.modalContent}>
                <Text style={styles.detailName}>{selectedResult.participantName}</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📝 Test Type:</Text>
                  <Text style={styles.detailValue}>{selectedResult.testType}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>🎯 Score:</Text>
                  <Text style={[styles.detailValue, { fontSize: 20, fontWeight: 'bold' }]}>{selectedResult.score}%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📊 Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedResult.status) }]}>
                    <Text style={styles.statusText}>{selectedResult.status}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>📅 Date:</Text>
                  <Text style={styles.detailValue}>{selectedResult.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>⏱️ Duration:</Text>
                  <Text style={styles.detailValue}>{selectedResult.duration}</Text>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  };

  // Staff Screen
  const StaffScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigateToScreen('dashboard')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>👨‍💼 Staff Management</Text>
      </View>
      <ScrollView contentContainerStyle={styles.centerContainer}>
        <Text style={styles.comingSoon}>👷‍♂️ Staff Management</Text>
        <Text style={styles.comingSoonSub}>Feature coming soon...</Text>
      </ScrollView>
    </SafeAreaView>
  );

  // Settings Screen
  const SettingsScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigateToScreen('dashboard')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>⚙️ Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.centerContainer}>
        <Text style={styles.comingSoon}>⚙️ Application Settings</Text>
        <Text style={styles.comingSoonSub}>Configuration options coming soon...</Text>
      </ScrollView>
    </SafeAreaView>
  );

  // Main render
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  switch (currentScreen) {
    case 'participants':
      return <ParticipantsScreen />;
    case 'results':
      return <ResultsScreen />;
    case 'staff':
      return <StaffScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <DashboardScreen />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Login styles
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  loginForm: {
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginFooter: {
    alignItems: 'center',
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  // Dashboard styles
  dashboardContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  menuGrid: {
    marginBottom: 30,
  },
  menuItem: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Screen header styles
  screenHeader: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  // Search styles
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
  // List styles
  listContainer: {
    flex: 1,
    padding: 20,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 3,
  },
  itemDetail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  // Stats styles
  statsScrollView: {
    maxHeight: 120,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statCard: {
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    minWidth: 80,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
  },
  // Result specific styles
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  // Coming soon styles
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  comingSoonSub: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
