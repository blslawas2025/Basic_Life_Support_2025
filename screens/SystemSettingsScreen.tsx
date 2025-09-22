import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Picker, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SystemSettingsService, SystemSettings, RoleName, ScreenKey } from "../services/SystemSettingsService";

interface SystemSettingsScreenProps {
  onBack: () => void;
}

const staffOptions: ScreenKey[] = [
  'staffDashboard',
  'manageParticipant',
  'manageQuestions',
  'attendanceMonitoring',
  'dashboard',
];

const userOptions: ScreenKey[] = [
  'dashboard',
  'checklistView',
  'testInterface',
  'resultsAnalytics',
];

export default function SystemSettingsScreen({ onBack }: SystemSettingsScreenProps) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const s = await SystemSettingsService.getSettings();
      setSettings(s);
    })();
  }, []);

  const updateLanding = async (role: RoleName, screen: ScreenKey) => {
    setSaving(true);
    const updated = await SystemSettingsService.setLandingForRole(role, screen);
    setSettings(updated);
    setSaving(false);
  };

  if (!settings) {
    return (
      <View style={styles.container}> 
        <Text style={styles.title}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a0a", "#101020"]} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Landing page per role</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Staff landing</Text>
          {Platform.OS === 'web' ? (
            <select
              value={settings.landingByRole.staff}
              onChange={(e) => updateLanding('staff', e.target.value as ScreenKey)}
              style={styles.select as any}
            >
              {staffOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <Picker
              selectedValue={settings.landingByRole.staff}
              onValueChange={(val) => updateLanding('staff', val as ScreenKey)}
              style={styles.picker}
            >
              {staffOptions.map(opt => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>User landing</Text>
          {Platform.OS === 'web' ? (
            <select
              value={settings.landingByRole.user}
              onChange={(e) => updateLanding('user', e.target.value as ScreenKey)}
              style={styles.select as any}
            >
              {userOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <Picker
              selectedValue={settings.landingByRole.user}
              onValueChange={(val) => updateLanding('user', val as ScreenKey)}
              style={styles.picker}
            >
              {userOptions.map(opt => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>
          )}
        </View>

        <Text style={styles.hint}>{saving ? 'Saving...' : 'Changes are saved automatically.'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    marginBottom: 16,
  },
  label: {
    color: '#ccc',
    marginBottom: 6,
  },
  picker: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#fff',
  },
  select: {
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    padding: 8,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)'
  },
  hint: {
    color: '#888',
    marginTop: 8,
  }
});


