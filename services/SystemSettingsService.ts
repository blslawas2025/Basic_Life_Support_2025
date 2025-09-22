import { supabase } from './supabase';

export type RoleName = 'staff' | 'user';
export type ScreenKey =
  | 'dashboard'
  | 'manageParticipant'
  | 'approveParticipants'
  | 'viewParticipants'
  | 'manageStaff'
  | 'staffDashboard'
  | 'manageQuestions'
  | 'manageChecklist'
  | 'comprehensiveResults'
  | 'createCourse'
  | 'attendanceMonitoring';

export interface SystemSettings {
  version: number;
  landingByRole: Record<RoleName, ScreenKey>;
}

const LOCAL_STORAGE_KEY = 'bls_system_settings_v1';

const DEFAULT_SETTINGS: SystemSettings = {
  version: 1,
  landingByRole: {
    staff: 'staffDashboard',
    user: 'dashboard',
  },
};

async function loadFromSupabase(): Promise<SystemSettings | null> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'app')
      .single();

    if (error) return null;
    if (!data || !data.value) return null;
    return data.value as SystemSettings;
  } catch {
    return null;
  }
}

async function saveToSupabase(settings: SystemSettings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'app', value: settings }, { onConflict: 'key' });
    return !error;
  } catch {
    return false;
  }
}

function loadFromLocal(): SystemSettings | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw) as SystemSettings;
  } catch {
    return null;
  }
}

function saveToLocal(settings: SystemSettings) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {}
}

export const SystemSettingsService = {
  async getSettings(): Promise<SystemSettings> {
    // Try Supabase first
    const dbSettings = await loadFromSupabase();
    if (dbSettings) return dbSettings;

    // Fallback to local
    const local = loadFromLocal();
    if (local) return local;

    // Default
    return DEFAULT_SETTINGS;
  },

  async setLandingForRole(role: RoleName, screen: ScreenKey): Promise<SystemSettings> {
    const current = await this.getSettings();
    const updated: SystemSettings = {
      ...current,
      landingByRole: { ...current.landingByRole, [role]: screen },
    };

    // Attempt to persist to Supabase; fallback to local storage regardless
    await saveToSupabase(updated);
    saveToLocal(updated);

    return updated;
  },
};


