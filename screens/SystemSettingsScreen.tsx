import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Picker, Platform, Alert } from "react-native";
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
  const [draftSettings, setDraftSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    (async () => {
      const s = await SystemSettingsService.getSettings();
      setSettings(s);
      setDraftSettings(s);
    })();
  }, []);

  const updateLanding = async (role: RoleName, screen: ScreenKey) => {
    if (!draftSettings) return;
    setDraftSettings({ ...draftSettings, landingByRole: { ...draftSettings.landingByRole, [role]: screen } });
  };

  const toggleAction = (role: RoleName, action: string) => {
    if (!draftSettings) return;
    const current = new Set(draftSettings.allowedActionsByRole[role] || []);
    if (current.has(action)) current.delete(action); else current.add(action);
    setDraftSettings({
      ...draftSettings,
      allowedActionsByRole: { ...draftSettings.allowedActionsByRole, [role]: Array.from(current) },
    });
  };

  const handleSave = async () => {
    if (!draftSettings) return;
    try {
      setSaving(true);
      const updated = await SystemSettingsService.setSettings(draftSettings);
      setSettings(updated);
      setDraftSettings(updated);
      Alert.alert('Saved', 'System settings updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!draftSettings) {
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
              value={draftSettings.landingByRole.staff}
              onChange={(e) => updateLanding('staff', e.target.value as ScreenKey)}
              style={styles.select as any}
            >
              {staffOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <Picker
              selectedValue={draftSettings.landingByRole.staff}
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
              value={draftSettings.landingByRole.user}
              onChange={(e) => updateLanding('user', e.target.value as ScreenKey)}
              style={styles.select as any}
            >
              {userOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <Picker
              selectedValue={draftSettings.landingByRole.user}
              onValueChange={(val) => updateLanding('user', val as ScreenKey)}
              style={styles.picker}
            >
              {userOptions.map(opt => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>
          )}
        </View>

        <Text style={styles.hint}>{saving ? 'Saving...' : 'Press Save to apply changes.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allowed actions per role</Text>

        <Text style={styles.roleLabel}>Staff can access</Text>
        <View style={styles.chipsRow}>
          {['manageParticipants','manageStaff','staffDashboard','manageQuestions','manageChecklist','viewResults','createCourse','attendanceMonitoring'].map(key => (
            <TouchableOpacity key={key} style={[styles.chip, draftSettings.allowedActionsByRole.staff?.includes(key) ? styles.chipOn : styles.chipOff]} onPress={() => toggleAction('staff', key)}>
              <Text style={styles.chipText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.roleLabel}>User can access</Text>
        <View style={styles.chipsRow}>
          {['viewResults','checklistView'].map(key => (
            <TouchableOpacity key={key} style={[styles.chip, draftSettings.allowedActionsByRole.user?.includes(key) ? styles.chipOn : styles.chipOff]} onPress={() => toggleAction('user', key)}>
              <Text style={styles.chipText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving ? { opacity: 0.6 } : null ]}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
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
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipOn: {
    backgroundColor: 'rgba(0,255,136,0.12)',
    borderColor: 'rgba(0,255,136,0.5)'
  },
  chipOff: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.15)'
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
  },
  roleLabel: {
    color: '#ccc',
    marginBottom: 6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#00ff88',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveText: {
    color: '#0a0a0a',
    fontWeight: '800',
  }
});


