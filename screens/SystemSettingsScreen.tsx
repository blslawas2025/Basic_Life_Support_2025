import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Picker, Platform, Alert, Switch, ScrollView } from "react-native";
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

const ACTION_CATALOG: Array<{ key: string; label: string; group: string }> = [
  // Participants / Staff
  { key: 'manageParticipants', label: 'Manage Participants', group: 'Participants & Staff' },
  { key: 'viewParticipants', label: 'View Participants', group: 'Participants & Staff' },
  { key: 'approveParticipants', label: 'Approve Participants', group: 'Participants & Staff' },
  { key: 'manageStaff', label: 'Manage Staff', group: 'Participants & Staff' },
  { key: 'staffDashboard', label: 'Staff Dashboard', group: 'Participants & Staff' },
  // Checklist
  { key: 'manageChecklist', label: 'Manage Checklist', group: 'Checklist' },
  { key: 'uploadChecklist', label: 'Upload Checklist', group: 'Checklist' },
  { key: 'viewEditDeleteChecklist', label: 'View/Edit/Delete Checklist', group: 'Checklist' },
  { key: 'checklistView', label: 'Checklist View', group: 'Checklist' },
  { key: 'checklistResults', label: 'Checklist Results', group: 'Checklist' },
  // Questions / Tests
  { key: 'manageQuestions', label: 'Manage Questions', group: 'Questions & Tests' },
  { key: 'uploadQuestions', label: 'Upload Questions', group: 'Questions & Tests' },
  { key: 'preTest', label: 'Take Pre Test', group: 'Questions & Tests' },
  { key: 'postTest', label: 'Take Post Test', group: 'Questions & Tests' },
  { key: 'testInterface', label: 'Test Interface', group: 'Questions & Tests' },
  // Results / Analytics
  { key: 'resultsAnalytics', label: 'Results Analytics', group: 'Results & Analytics' },
  { key: 'viewResults', label: 'View Reports', group: 'Results & Analytics' },
  { key: 'comprehensiveResults', label: 'Comprehensive Results', group: 'Results & Analytics' },
  { key: 'importResults', label: 'Import Results', group: 'Results & Analytics' },
  { key: 'bulkImportResults', label: 'Bulk Import Results', group: 'Results & Analytics' },
  { key: 'resultView', label: 'Result View', group: 'Results & Analytics' },
  { key: 'resultAnalysis', label: 'Result Analysis', group: 'Results & Analytics' },
  { key: 'resultSettings', label: 'Result Settings', group: 'Results & Analytics' },
  { key: 'certificateManagement', label: 'Certificate Management', group: 'Results & Analytics' },
  // Pools & Access
  { key: 'questionPoolManagement', label: 'Question Pools', group: 'Pools & Access' },
  { key: 'accessControlManagement', label: 'Access Control', group: 'Pools & Access' },
  // Courses
  { key: 'createCourse', label: 'Create Course', group: 'Courses' },
  { key: 'viewCourses', label: 'View Courses', group: 'Courses' },
  { key: 'editCourse', label: 'Edit Course', group: 'Courses' },
  // Attendance
  { key: 'attendanceMonitoring', label: 'Attendance Monitoring', group: 'Attendance' },
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
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

        {['Participants & Staff','Checklist','Questions & Tests','Results & Analytics','Pools & Access','Courses','Attendance'].map(group => (
          <View key={group} style={styles.groupBox}>
            <Text style={styles.groupTitle}>{group}</Text>
            {ACTION_CATALOG.filter(a => a.group === group).map(action => (
              <View key={action.key} style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionKey}>{action.key}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.roleLabelInline}>Staff</Text>
                  <Switch
                    value={draftSettings.allowedActionsByRole.staff?.includes(action.key) || false}
                    onValueChange={() => toggleAction('staff', action.key)}
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.roleLabelInline}>User</Text>
                  <Switch
                    value={draftSettings.allowedActionsByRole.user?.includes(action.key) || false}
                    onValueChange={() => toggleAction('user', action.key)}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving ? { opacity: 0.6 } : null ]}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
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
  roleLabel: {
    color: '#ccc',
    marginBottom: 6,
  },
  roleLabelInline: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'right'
  },
  groupBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  groupTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
  },
  actionKey: {
    color: '#7a7a7a',
    fontSize: 11,
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


