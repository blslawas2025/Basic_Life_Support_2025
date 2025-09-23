import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ChecklistBrowseScreenProps {
  onBack: () => void;
  onOpenChecklist: (type: string) => void;
}

const CHECKLIST_TYPES = [
  { key: 'one man cpr', title: 'One Man CPR', color: ['#00d4ff', '#5b73ff'], icon: 'heart' },
  { key: 'two man cpr', title: 'Two Man CPR', color: ['#00ff88', '#22c55e'], icon: 'heart-circle' },
  { key: 'infant cpr', title: 'Infant CPR', color: ['#ff0080', '#ff4d4d'], icon: 'happy' },
  { key: 'adult choking', title: 'Adult Choking', color: ['#ffaa00', '#ff7a18'], icon: 'warning' },
  { key: 'infant choking', title: 'Infant Choking', color: ['#8b5cf6', '#6366f1'], icon: 'warning' },
];

export default function ChecklistBrowseScreen({ onBack, onOpenChecklist }: ChecklistBrowseScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a0a", "#101020"]} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Browse Checklists</Text>
        <Text style={styles.subtitle}>View-only access</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {CHECKLIST_TYPES.map((t, i) => (
          <TouchableOpacity key={t.key} style={styles.card} onPress={() => onOpenChecklist(t.key)}>
            <LinearGradient colors={t.color as any} style={styles.cardGradient}>
              <View style={styles.cardHeader}>
                <Ionicons name={t.icon as any} size={22} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.cardSubtitle}>Tap to view items</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 },
  back: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, alignSelf: 'flex-start' },
  title: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 8 },
  subtitle: { color: '#00d4ff', marginTop: 2 },
  content: { padding: 16, gap: 12 },
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardGradient: { padding: 16 },
  cardHeader: { marginBottom: 8 },
  cardTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cardSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 2, fontSize: 12 },
});


