import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question } from '../types/Question';
import { TestSubmission } from './SubmissionService';

interface OfflineTestData {
  questions: Question[];
  testType: 'pre_test' | 'post_test';
  courseSessionId?: string;
  cachedAt: string;
  expiresAt: string;
}

interface OfflineProgress {
  userId: string;
  testType: 'pre_test' | 'post_test';
  courseSessionId?: string;
  answers: {[key: string]: string};
  flaggedQuestions: string[];
  skippedQuestions: string[];
  currentQuestionIndex: number;
  timeLeft: number;
  startTime: string;
  lastSaved: string;
}

interface OfflineSubmission {
  userId: string;
  testType: 'pre_test' | 'post_test';
  courseSessionId?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  answers: {[key: string]: string};
  submittedAt: string;
  synced: boolean;
}

export class OfflineService {
  private static readonly CACHE_PREFIX = 'offline_cache_';
  private static readonly PROGRESS_PREFIX = 'offline_progress_';
  private static readonly SUBMISSION_PREFIX = 'offline_submission_';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Check if device is online
  static async isOnline(): Promise<boolean> {
    try {
      // Simple connectivity check - you might want to use @react-native-netinfo
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Cache questions for offline use
  static async cacheQuestions(
    questions: Question[], 
    testType: 'pre_test' | 'post_test',
    courseSessionId?: string
  ): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${testType}_${courseSessionId || 'default'}`;
      const cacheData: OfflineTestData = {
        questions,
        testType,
        courseSessionId,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION).toISOString()
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (error) {
      console.error('Error caching questions:', error);
    }
  }

  // Get cached questions
  static async getCachedQuestions(
    testType: 'pre_test' | 'post_test',
    courseSessionId?: string
  ): Promise<Question[] | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${testType}_${courseSessionId || 'default'}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const cache: OfflineTestData = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (new Date() > new Date(cache.expiresAt)) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return cache.questions;
    } catch (error) {
      console.error('Error getting cached questions:', error);
      return null;
    }
  }

  // Save test progress locally
  static async saveProgress(progress: Omit<OfflineProgress, 'lastSaved'>): Promise<void> {
    try {
      const progressKey = `${this.PROGRESS_PREFIX}${progress.userId}_${progress.testType}_${progress.courseSessionId || 'default'}`;
      const progressData: OfflineProgress = {
        ...progress,
        lastSaved: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(progressKey, JSON.stringify(progressData));
      } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  // Get saved progress
  static async getProgress(
    userId: string,
    testType: 'pre_test' | 'post_test',
    courseSessionId?: string
  ): Promise<OfflineProgress | null> {
    try {
      const progressKey = `${this.PROGRESS_PREFIX}${userId}_${testType}_${courseSessionId || 'default'}`;
      const progressData = await AsyncStorage.getItem(progressKey);
      
      if (!progressData) return null;
      
      return JSON.parse(progressData);
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }

  // Clear saved progress for a specific user/test/session
  static async clearProgress(
    userId: string,
    testType: 'pre_test' | 'post_test',
    courseSessionId?: string
  ): Promise<void> {
    try {
      const progressKey = `${this.PROGRESS_PREFIX}${userId}_${testType}_${courseSessionId || 'default'}`;
      await AsyncStorage.removeItem(progressKey);
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  }

  // Save submission for later sync
  static async saveOfflineSubmission(submission: Omit<OfflineSubmission, 'submittedAt' | 'synced'>): Promise<void> {
    try {
      const submissionKey = `${this.SUBMISSION_PREFIX}${submission.userId}_${Date.now()}`;
      const submissionData: OfflineSubmission = {
        ...submission,
        submittedAt: new Date().toISOString(),
        synced: false
      };
      
      await AsyncStorage.setItem(submissionKey, JSON.stringify(submissionData));
      } catch (error) {
      console.error('Error saving offline submission:', error);
    }
  }

  // Get all pending submissions
  static async getPendingSubmissions(): Promise<OfflineSubmission[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const submissionKeys = keys.filter(key => key.startsWith(this.SUBMISSION_PREFIX));
      const submissions: OfflineSubmission[] = [];
      
      for (const key of submissionKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          submissions.push(JSON.parse(data));
        }
      }
      
      return submissions.filter(sub => !sub.synced);
    } catch (error) {
      console.error('Error getting pending submissions:', error);
      return [];
    }
  }

  // Mark submission as synced
  static async markSubmissionSynced(submissionKey: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(submissionKey);
      if (data) {
        const submission: OfflineSubmission = JSON.parse(data);
        submission.synced = true;
        await AsyncStorage.setItem(submissionKey, JSON.stringify(submission));
      }
    } catch (error) {
      console.error('Error marking submission as synced:', error);
    }
  }

  // Remove synced submissions
  static async removeSyncedSubmissions(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const submissionKeys = keys.filter(key => key.startsWith(this.SUBMISSION_PREFIX));
      
      for (const key of submissionKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const submission: OfflineSubmission = JSON.parse(data);
          if (submission.synced) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error removing synced submissions:', error);
    }
  }

  // Clear all offline data
  static async clearAllOfflineData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => 
        key.startsWith(this.CACHE_PREFIX) || 
        key.startsWith(this.PROGRESS_PREFIX) || 
        key.startsWith(this.SUBMISSION_PREFIX)
      );
      
      await AsyncStorage.multiRemove(offlineKeys);
      } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  // Get offline data size
  static async getOfflineDataSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => 
        key.startsWith(this.CACHE_PREFIX) || 
        key.startsWith(this.PROGRESS_PREFIX) || 
        key.startsWith(this.SUBMISSION_PREFIX)
      );
      
      let totalSize = 0;
      for (const key of offlineKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating offline data size:', error);
      return 0;
    }
  }
}
