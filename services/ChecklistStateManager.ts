import { ChecklistItemData } from './ChecklistItemService';

// Global state for checklist data
class ChecklistStateManager {
  private listeners: Set<() => void> = new Set();
  private checklistData: { [key: string]: ChecklistItemData[] } = {};
  private lastUpdated: { [key: string]: number } = {};

  // Subscribe to changes
  subscribe(listener: () => void) {

    this.listeners.add(listener);
    return () => {

      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of changes
  private notify() {

    this.listeners.forEach(listener => listener());
  }

  // Update checklist data for a specific type
  updateChecklistData(type: string, items: ChecklistItemData[]) {
    this.checklistData[type] = items;
    this.lastUpdated[type] = Date.now();

    if (items.length > 0) {

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

      const result = await fetchFunction();

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

    delete this.checklistData[type];
    delete this.lastUpdated[type];
    this.notify();
  }

  // Clear cache for a specific type
  clearCacheForType(type: string) {

    delete this.checklistData[type];
    delete this.lastUpdated[type];
  }

  // Clear all cache
  clearAllCache() {

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

    // Get initial data
    const currentData = checklistStateManager.getChecklistData(type);
    const currentLastUpdated = checklistStateManager.getLastUpdated(type);

    setData(currentData);
    setLastUpdated(currentLastUpdated);

    // Subscribe to changes
    const unsubscribe = checklistStateManager.subscribe(() => {
      const newData = checklistStateManager.getChecklistData(type);
      const newLastUpdated = checklistStateManager.getLastUpdated(type);

      setData(newData);
      setLastUpdated(newLastUpdated);
    });

    return unsubscribe;
  }, [type]);

  const refresh = async (fetchFunction: () => Promise<{ success: boolean; items?: ChecklistItemData[] }>) => {

    setIsLoading(true);
    try {
      const result = await checklistStateManager.refreshType(type, fetchFunction);

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
