import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

interface UserDashboardProps {
  userName: string;
  onLogout: () => void;
  onNavigateToPreTest: () => void;
  onNavigateToPostTest: () => void;
  onNavigateToComprehensiveResults: () => void;
}

export default function UserDashboard({ userName, onLogout, onNavigateToPreTest, onNavigateToPostTest, onNavigateToComprehensiveResults }: UserDashboardProps) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a0a", "#101020"]} style={styles.header}>
        <Text style={styles.title}>User Dashboard</Text>
        <Text style={styles.subtitle}>Welcome {userName}</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fade }] }>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={onNavigateToPreTest}>
            <Ionicons name="play-circle-outline" size={24} color="#00ff88" />
            <Text style={styles.cardTitle}>Take Pre Test</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={onNavigateToPostTest}>
            <Ionicons name="stopwatch-outline" size={24} color="#5b73ff" />
            <Text style={styles.cardTitle}>Take Post Test</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={onNavigateToComprehensiveResults}>
            <Ionicons name="list-outline" size={24} color="#ffaa00" />
            <Text style={styles.cardTitle}>Comprehensive Results</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: 16, position: 'relative' },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  subtitle: { color: '#00d4ff', marginTop: 4 },
  logout: { position: 'absolute', right: 16, top: 16, padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8 },
  content: { paddingHorizontal: 16, paddingVertical: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: (width - 16*3)/2, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cardTitle: { color: '#fff', fontWeight: '700', marginTop: 12 }
});


