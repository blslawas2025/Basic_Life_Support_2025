import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SimpleApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Basic Life Support App</Text>
      <Text style={styles.subtitle}>Test Version</Text>
      <Text style={styles.status}>App is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: '#00d4ff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    color: '#00ff88',
    fontSize: 16,
    textAlign: 'center',
  },
});
