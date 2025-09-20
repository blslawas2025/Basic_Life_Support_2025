import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

interface SimpleDashboardProps {
  userName: string;
  onLogout: () => void;
  onNavigateToManageParticipant: () => void;
  onNavigateToApproveParticipants: () => void;
  onNavigateToManageStaff: () => void;
  onNavigateToStaffDashboard: () => void;
  onNavigateToManageQuestions: () => void;
  onNavigateToManageChecklist: () => void;
  onNavigateToComprehensiveResults: () => void;
  onNavigateToCreateCourse: () => void;
  onNavigateToAttendanceMonitoring: () => void;
}

export default function SimpleDashboard(props: SimpleDashboardProps) {
  const menuItems = [
    {
      title: "👥 Manage Participants",
      subtitle: "Add, view, and manage participants",
      onPress: props.onNavigateToManageParticipant,
      color: "#3498db"
    },
    {
      title: "✅ Approve Participants", 
      subtitle: "Review and approve new participants",
      onPress: props.onNavigateToApproveParticipants,
      color: "#27ae60"
    },
    {
      title: "👨‍💼 Manage Staff",
      subtitle: "Staff management and roles",
      onPress: props.onNavigateToManageStaff,
      color: "#e74c3c"
    },
    {
      title: "📝 Manage Questions",
      subtitle: "Test questions and pools",
      onPress: props.onNavigateToManageQuestions,
      color: "#f39c12"
    },
    {
      title: "📋 Manage Checklist",
      subtitle: "Training checklists",
      onPress: props.onNavigateToManageChecklist,
      color: "#9b59b6"
    },
    {
      title: "📊 View Results",
      subtitle: "Comprehensive results and analytics",
      onPress: props.onNavigateToComprehensiveResults,
      color: "#1abc9c"
    },
    {
      title: "🎓 Create Course",
      subtitle: "Create new training courses",
      onPress: props.onNavigateToCreateCourse,
      color: "#34495e"
    },
    {
      title: "📋 Attendance",
      subtitle: "Monitor attendance tracking",
      onPress: props.onNavigateToAttendanceMonitoring,
      color: "#e67e22"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{props.userName}</Text>
          <Text style={styles.subtitle}>Basic Life Support Training</Text>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: item.color }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={props.onLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Basic Life Support Training Platform v1.0
          </Text>
          <Text style={styles.footerSubtext}>
            Mobile Optimized Dashboard
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
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
    textAlign: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginVertical: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  menuItem: {
    width: isSmallScreen ? '100%' : '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#bdc3c7',
    textAlign: 'center',
    marginTop: 5,
  },
});
