import { ChecklistItemData } from './ChecklistItemService';

// Global state for checklist data
class ChecklistStateManager {
  private listeners: Set<() => void> = new Set();
  private checklistData: { [key: string]: ChecklistItemData[] } = {};
  private lastUpdated: { [key: string]: number } = {};

  // Subscribe to changes
  subscribe(listener: () => void) {
    console.log(`🔔 ChecklistStateManager: Adding listener, total: ${this.listeners.size + 1}`);
    this.listeners.add(listener);
    return () => {
      console.log(`🔔 ChecklistStateManager: Removing listener, total: ${this.listeners.size - 1}`);
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of changes
  private notify() {
    console.log(`🔔 ChecklistStateManager: Notifying ${this.listeners.size} listeners`);
    this.listeners.forEach(listener => listener());
  }

  // Update checklist data for a specific type
  updateChecklistData(type: string, items: ChecklistItemData[]) {
    this.checklistData[type] = items;
    this.lastUpdated[type] = Date.now();
    console.log(`🔄 ChecklistStateManager: Updated ${type} with ${items.length} items`);
    if (items.length > 0) {
      console.log(`🔄 ChecklistStateManager: First few items:`, items.slice(0, 3).map(item => ({
        type: item.checklist_type,
        section: item.section,
        item: item.item.substring(0, 30) + '...'
      })));
    }
    this.notify();
  }

  // Get checklist data for a specific type
  getChecklistData(type: string): ChecklistItemData[] {
    return this.checklistData[type] || [];
  }

  // Get last updated timestamp
  getLastUpdated(type: string): number {
    return this.lastUpdated[type] || 0;
  }

  // Check if data is stale (older than 5 minutes)
  isDataStale(type: string): boolean {
    const lastUpdate = this.lastUpdated[type];
    if (!lastUpdate) return true;
    return Date.now() - lastUpdate > 5 * 60 * 1000; // 5 minutes
  }

  // Clear all data
  clear() {
    this.checklistData = {};
    this.lastUpdated = {};
    this.notify();
  }

  // Get all checklist types
  getAvailableTypes(): string[] {
    return Object.keys(this.checklistData);
  }

  // Force refresh for a specific type
  async refreshType(type: string, fetchFunction: () => Promise<{ success: boolean; items?: ChecklistItemData[] }>) {
    try {
      console.log(`🔄 ChecklistStateManager: Refreshing ${type}...`);
      const result = await fetchFunction();
      console.log(`🔄 ChecklistStateManager: Fetch result for ${type}:`, {
        success: result.success,
        itemsCount: result.items?.length || 0,
        error: result.error
      });
      if (result.success && result.items) {
        this.updateChecklistData(type, result.items);
        return { success: true, items: result.items };
      }
      return { success: false, error: 'Failed to fetch data' };
    } catch (error) {
      console.error(`❌ ChecklistStateManager: Error refreshing ${type}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Force refresh specific type
  forceRefreshType(type: string) {
    console.log(`🔄 ChecklistStateManager: Force refreshing ${type}...`);
    delete this.checklistData[type];
    delete this.lastUpdated[type];
    this.notify();
  }

  // Clear cache for a specific type
  clearCacheForType(type: string) {
    console.log(`🔄 ChecklistStateManager: Clearing cache for ${type}`);
    delete this.checklistData[type];
    delete this.lastUpdated[type];
  }

  // Clear all cache
  clearAllCache() {
    console.log('🔄 ChecklistStateManager: Clearing all cache');
    this.checklistData = {};
    this.lastUpdated = {};
  }
}

// Export singleton instance
export const checklistStateManager = new ChecklistStateManager();

// Hook for React components
export const useChecklistState = (type: string) => {
  const [data, setData] = React.useState<ChecklistItemData[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    console.log(`🔍 useChecklistState: Setting up for type: ${type}`);
    
    // Get initial data
    const currentData = checklistStateManager.getChecklistData(type);
    const currentLastUpdated = checklistStateManager.getLastUpdated(type);
    
    console.log(`🔍 useChecklistState: Initial data for ${type}:`, currentData.length, 'items');
    setData(currentData);
    setLastUpdated(currentLastUpdated);

    // Subscribe to changes
    const unsubscribe = checklistStateManager.subscribe(() => {
      const newData = checklistStateManager.getChecklistData(type);
      const newLastUpdated = checklistStateManager.getLastUpdated(type);
      
      console.log(`🔍 useChecklistState: Data updated for ${type}:`, newData.length, 'items');
      setData(newData);
      setLastUpdated(newLastUpdated);
    });

    return unsubscribe;
  }, [type]);

  const refresh = async (fetchFunction: () => Promise<{ success: boolean; items?: ChecklistItemData[] }>) => {
    console.log(`🔍 useChecklistState: Refreshing ${type}`);
    setIsLoading(true);
    try {
      const result = await checklistStateManager.refreshType(type, fetchFunction);
      console.log(`🔍 useChecklistState: Refresh result for ${type}:`, {
        success: result.success,
        itemsCount: result.items?.length || 0
      });
      return result;
    } catch (error) {
      console.error(`❌ useChecklistState: Error refreshing ${type}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    lastUpdated,
    isLoading,
    refresh,
    isStale: checklistStateManager.isDataStale(type)
  };
};

// Import React for the hook
import React from 'react';
