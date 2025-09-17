import { supabase } from './supabase';
import { checklistStateManager } from './ChecklistStateManager';

/**
 * SynchronizationService ensures all screens stay connected and synced with Supabase
 * This service handles real-time updates and ensures data consistency across all components
 */
export class SynchronizationService {
  private static instance: SynchronizationService;
  private refreshCallbacks: Map<string, Set<() => void>> = new Map();
  private isListening = false;

  private constructor() {}

  static getInstance(): SynchronizationService {
    if (!SynchronizationService.instance) {
      SynchronizationService.instance = new SynchronizationService();
    }
    return SynchronizationService.instance;
  }

  /**
   * Start listening to Supabase changes for real-time synchronization
   */
  async startListening(): Promise<void> {
    if (this.isListening) return;

    try {
      // Listen to checklist_item changes
      const checklistItemSubscription = supabase
        .channel('checklist_item_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checklist_item'
          },
          (payload) => {
            console.log('Checklist item changed:', payload);
            this.handleChecklistItemChange(payload);
          }
        )
        .subscribe();

      // Listen to checklist_result changes
      const checklistResultSubscription = supabase
        .channel('checklist_result_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'checklist_result'
          },
          (payload) => {
            console.log('Checklist result changed:', payload);
            this.handleChecklistResultChange(payload);
          }
        )
        .subscribe();

      this.isListening = true;
      console.log('SynchronizationService: Started listening to Supabase changes');
    } catch (error) {
      console.error('Failed to start synchronization:', error);
    }
  }

  /**
   * Stop listening to Supabase changes
   */
  stopListening(): void {
    if (!this.isListening) return;

    supabase.removeAllChannels();
    this.isListening = false;
    console.log('SynchronizationService: Stopped listening to Supabase changes');
  }

  /**
   * Register a callback to be called when a specific checklist type changes
   */
  subscribeToChecklistType(checklistType: string, callback: () => void): () => void {
    if (!this.refreshCallbacks.has(checklistType)) {
      this.refreshCallbacks.set(checklistType, new Set());
    }
    
    this.refreshCallbacks.get(checklistType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.refreshCallbacks.get(checklistType)?.delete(callback);
    };
  }

  /**
   * Register a callback to be called when any checklist result changes
   */
  subscribeToResults(callback: () => void): () => void {
    return this.subscribeToChecklistType('results', callback);
  }

  /**
   * Force refresh a specific checklist type
   */
  async refreshChecklistType(checklistType: string): Promise<void> {
    console.log(`SynchronizationService: Refreshing ${checklistType}`);
    
    // Clear cache for this type
    checklistStateManager.clearCacheForType(checklistType);
    
    // Notify all subscribers
    this.refreshCallbacks.get(checklistType)?.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in refresh callback:', error);
      }
    });
  }

  /**
   * Force refresh all data
   */
  async refreshAll(): Promise<void> {
    console.log('SynchronizationService: Refreshing all data');
    
    // Clear all cache
    checklistStateManager.clearAllCache();
    
    // Notify all subscribers
    this.refreshCallbacks.forEach((callbacks, type) => {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in refresh callback:', error);
        }
      });
    });
  }

  /**
   * Handle checklist item changes from Supabase
   */
  private handleChecklistItemChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
      const checklistType = newRecord?.checklist_type || oldRecord?.checklist_type;
      
      if (checklistType) {
        // Clear cache for this checklist type
        checklistStateManager.clearCacheForType(checklistType);
        
        // Notify subscribers
        this.refreshChecklistType(checklistType);
      }
    }
  }

  /**
   * Handle checklist result changes from Supabase
   */
  private handleChecklistResultChange(payload: any): void {
    const { eventType } = payload;
    
    if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
      // Clear results cache
      checklistStateManager.clearCacheForType('results');
      
      // Notify results subscribers
      this.refreshChecklistType('results');
    }
  }

  /**
   * Save changes to Supabase and trigger synchronization
   */
  async saveAndSync<T>(
    operation: () => Promise<T>,
    checklistType?: string
  ): Promise<T> {
    try {
      const result = await operation();
      
      // Trigger refresh for the specific type or all
      if (checklistType) {
        await this.refreshChecklistType(checklistType);
      } else {
        await this.refreshAll();
      }
      
      return result;
    } catch (error) {
      console.error('Error in saveAndSync:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const synchronizationService = SynchronizationService.getInstance();

