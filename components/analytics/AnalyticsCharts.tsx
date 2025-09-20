import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../utils/colorScheme';
import { getResponsiveSize } from '../../utils/responsiveHelpers';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsChartsProps {
  categoryPerformance: any[];
  difficultyAnalysis: any[];
  timeAnalysis: any[];
}

export default function AnalyticsCharts({ 
  categoryPerformance, 
  difficultyAnalysis, 
  timeAnalysis 
}: AnalyticsChartsProps) {
  const chartHeight = getResponsiveSize(120, 150, 180);

  const renderBarChart = (data: any[], title: string, color: string) => {
    const maxValue = Math.max(...data.map(item => item.value || 0));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chartContent}>
          {data.map((item, index) => {
            const height = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <LinearGradient
                    colors={[color, `${color}80`]}
                    style={[styles.bar, { height }]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={styles.barValue}>{item.value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Analytics Charts</Text>
      
      <View style={styles.chartsGrid}>
        {renderBarChart(
          categoryPerformance, 
          'Category Performance', 
          COLORS.neon.electric
        )}
        
        {renderBarChart(
          difficultyAnalysis, 
          'Difficulty Analysis', 
          COLORS.neon.purple
        )}
        
        {renderBarChart(
          timeAnalysis, 
          'Time Analysis', 
          COLORS.neon.green
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  chartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chartContainer: {
    width: '48%',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface.glass,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  chartTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: SPACING.xs,
  },
  bar: {
    width: 20,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 4,
  },
  barLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
    minWidth: 40,
    maxWidth: 60,
    flexWrap: 'wrap',
  },
  barValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.primary,
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
