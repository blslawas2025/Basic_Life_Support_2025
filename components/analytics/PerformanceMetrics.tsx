import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../utils/colorScheme';
import { getResponsiveSize, getResponsiveFontSize } from '../../utils/responsiveHelpers';

interface PerformanceMetricsProps {
  analytics: {
    totalParticipants: number;
    preTestParticipants: number;
    postTestParticipants: number;
    averagePreTestScore: number;
    averagePostTestScore: number;
    improvementRate: number;
    passRate: number;
    completionRate: number;
  };
}

export default function PerformanceMetrics({ analytics }: PerformanceMetricsProps) {
  const metrics = [
    {
      title: 'Total Participants',
      value: analytics.totalParticipants,
      icon: 'people-outline',
      color: COLORS.neon.electric,
      gradient: COLORS.gradient.primary,
    },
    {
      title: 'Pre-Test Average',
      value: `${analytics.averagePreTestScore.toFixed(1)}%`,
      icon: 'trending-up-outline',
      color: COLORS.neon.orange,
      gradient: COLORS.gradient.secondary,
    },
    {
      title: 'Post-Test Average',
      value: `${analytics.averagePostTestScore.toFixed(1)}%`,
      icon: 'trending-up-outline',
      color: COLORS.neon.green,
      gradient: COLORS.gradient.accent,
    },
    {
      title: 'Improvement Rate',
      value: `${analytics.improvementRate.toFixed(1)}%`,
      icon: 'arrow-up-outline',
      color: COLORS.neon.purple,
      gradient: COLORS.gradient.primary,
    },
    {
      title: 'Pass Rate',
      value: `${analytics.passRate.toFixed(1)}%`,
      icon: 'checkmark-circle-outline',
      color: COLORS.neon.green,
      gradient: COLORS.gradient.accent,
    },
    {
      title: 'Completion Rate',
      value: `${analytics.completionRate.toFixed(1)}%`,
      icon: 'flag-outline',
      color: COLORS.neon.cyan,
      gradient: COLORS.gradient.secondary,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Metrics</Text>
      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <LinearGradient
            key={index}
            colors={metric.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.metricCard}
          >
            <View style={styles.metricContent}>
              <View style={styles.metricHeader}>
                <Ionicons name={metric.icon as any} size={24} color={metric.color} />
                <Text style={styles.metricTitle}>{metric.title}</Text>
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </View>
          </LinearGradient>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: COLORS.shadow.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  metricContent: {
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metricTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
    textAlign: 'center',
  },
  metricValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
});
