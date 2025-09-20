// App.tsx - Mobile Test Version
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';

export default function SimpleMobileApp() {
  const handleTestPress = () => {
    alert('Mobile app is working!');
  };

  const handleLoginPress = () => {
    alert('Login functionality will be added here');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🏥 Basic Life Support</Text>
          <Text style={styles.subtitle}>Mobile Training Platform</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.description}>
            Welcome to the Basic Life Support Training Platform
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={handleTestPress}>
            <Text style={styles.buttonText}>Test Mobile Function</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
            <Text style={styles.buttonText}>Login to Full App</Text>
          </TouchableOpacity>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Platform Features:</Text>
            <Text style={styles.infoItem}>• Pre/Post Testing</Text>
            <Text style={styles.infoItem}>• Participant Management</Text>
            <Text style={styles.infoItem}>• Result Analytics</Text>
            <Text style={styles.infoItem}>• Certificate Generation</Text>
          </View>
          
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>✅ Mobile App Loaded Successfully</Text>
            <Text style={styles.versionText}>Version: 1.0.0 - Mobile Test Build</Text>
          </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#34495e',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
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
  loginButton: {
    backgroundColor: '#27ae60',
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoItem: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    lineHeight: 22,
  },
  statusSection: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '600',
    marginBottom: 5,
  },
  versionText: {
    fontSize: 14,
    color: '#155724',
  },
});
