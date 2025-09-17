import { useState, useEffect } from 'react';
import { AnalyticsService, TestSubmission } from '../services/AnalyticsService';

export interface AnalyticsData {
  totalParticipants: number;
  preTestParticipants: number;
  postTestParticipants: number;
  averagePreTestScore: number;
  averagePostTestScore: number;
  improvementRate: number;
  passRate: number;
  completionRate: number;
  categoryPerformance: any[];
  difficultyAnalysis: any[];
  timeAnalysis: any[];
}

export const useAnalyticsData = () => {
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [submissionsData, analyticsData] = await Promise.all([
        AnalyticsService.getAllSubmissions(),
        AnalyticsService.getAnalyticsData()
      ]);
      
      setSubmissions(submissionsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    submissions,
    analytics,
    isLoading,
    refreshing,
    error,
    loadData,
    handleRefresh,
  };
};
