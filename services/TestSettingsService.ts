import { supabase } from './supabase';

export interface GlobalTestSettings {
  settings_version: number;
  generalSettings?: {
    autoSave: boolean;
    showProgress: boolean;
    requireConfirmation: boolean;
  };
  notificationSettings?: {
    notifications: boolean;
    autoBackup: boolean;
  };
  syncSettings?: {
    syncWithCloud: boolean;
    enableSharing: boolean;
  };
  timerSettings: {
    overallTestTimer: number;
    enableVisualCountdown: boolean;
    enableAutoSubmit: boolean;
    timeWarnings: {
      tenMinutes: boolean;
      fiveMinutes: boolean;
      oneMinute: boolean;
    };
    countdownStyle: 'progress_bar' | 'circular' | 'both';
    warningSound: boolean;
    warningVibration: boolean;
  };
  submissionSettings: {
    enableOneTimeSubmission: boolean;
    singleAttempt: boolean;
    submissionLock: boolean;
    progressTracking: boolean;
    resultsLock: boolean;
    showResultsAfterSubmission: boolean;
    adminControlledRetake: boolean;
    allowRetake: boolean;
    maxRetakeAttempts: number;
    retakeCooldownHours: number;
    enableSubmissionConfirmation: boolean;
    confirmationMessage: string;
    successMessage: string;
    showSuccessMessage: boolean;
    successMessageDuration: number;
    enableHapticFeedback: boolean;
    enableSoundFeedback: boolean;
  };
  sessionSettings: {
    randomQuestionSelection: boolean;
    questionShuffling: boolean;
    progressSaving: boolean;
    sessionRecovery: boolean;
    autoSaveInterval: number;
    maxIncompleteSessions: number;
    sessionTimeout: number;
    allowResumeFromAnywhere: boolean;
    clearProgressOnRetake: boolean;
  };
  questionPoolSettings?: {
    enableQuestionPools: boolean;
    defaultPoolId: string | null;
    allowPoolSelection: boolean;
    requirePoolSelection: boolean;
    showPoolInfo: boolean;
    randomizeWithinPool: boolean;
    poolSelectionMode: 'admin' | 'user' | 'both';
    autoAssignPools: boolean;
    poolAssignmentRules: {
      preTestPoolId: string | null;
      postTestPoolId: string | null;
      fallbackToAll: boolean;
    };
  };
  languageSettings: {
    enableBilingual: boolean;
    defaultLanguage: 'primary' | 'secondary' | 'dual';
    showLanguageToggle: boolean;
    primaryLanguageName: string;
    secondaryLanguageName: string;
    allowLanguageSwitch: boolean;
    enableDualLanguage: boolean;
  };
  offlineSettings: {
    enableOfflineMode: boolean;
    autoCacheQuestions: boolean;
    cacheExpirationHours: number;
    autoSyncOnReconnect: boolean;
    maxCacheSize: number;
    enableProgressBackup: boolean;
    backupInterval: number;
    clearCacheOnSync: boolean;
  };
}

type TestSettingsRow = {
  id: string;
  scope: string;
  settings: GlobalTestSettings;
  updated_at: string;
};

const TABLE = 'test_settings';
const SCOPE = 'global';

export class TestSettingsService {
  static async getGlobalSettings(): Promise<GlobalTestSettings | null> {
    try {
      const { data, error } = await supabase
        .from<TestSettingsRow>(TABLE)
        .select('*')
        .eq('scope', SCOPE)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Failed to load test settings:', error);
        return null;
      }
      return data?.settings ?? null;
    } catch (e) {
      console.error('Unexpected error loading test settings:', e);
      return null;
    }
  }

  static async upsertGlobalSettings(settings: GlobalTestSettings): Promise<boolean> {
    try {
      const payload = { scope: SCOPE, settings } as Partial<TestSettingsRow>;
      const { error } = await supabase
        .from(TABLE)
        .upsert(payload, { onConflict: 'scope' });
      if (error) {
        console.error('Failed to save test settings:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Unexpected error saving test settings:', e);
      return false;
    }
  }
}


