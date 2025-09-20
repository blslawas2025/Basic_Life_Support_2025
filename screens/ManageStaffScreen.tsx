import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ProfileService } from "../services/ProfileService";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;
const isTablet = width >= 768 && height >= 1024;

const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsiveFontSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsivePadding = () => {
  if (isSmallScreen) return 16;
  if (isMediumScreen) return 20;
  if (isTablet) return 32;
  return 24;
};

// Helper function to extract base job title without grades
const extractBaseJobTitle = (fullJobTitle: string): string => {
  if (!fullJobTitle) return 'Unknown Position';
  
  // Remove common grade patterns (U followed by numbers, UD followed by numbers, etc.)
  let baseJob = fullJobTitle
    .replace(/\s+U\s*\d+/g, '') // Remove " U5", " U6", "U5", "U6", etc.
    .replace(/\s+UD\s*\d+/g, '') // Remove " UD10", " UD11", etc.
    .replace(/\s+UG\s*\d+/g, '') // Remove " UG9", " UG10", etc.
    .replace(/\s+UJ\s*\d+/g, '') // Remove " UJ1", " UJ2", etc.
    .replace(/\s+UP\s*\d+/g, '') // Remove " UP1", " UP2", etc.
    .replace(/\s+U\s*\d+\s*$/g, '') // Remove trailing " U5", " U6", etc.
    .replace(/\s+UD\s*\d+\s*$/g, '') // Remove trailing " UD10", etc.
    .replace(/\s+UG\s*\d+\s*$/g, '') // Remove trailing " UG9", etc.
    .replace(/\s+UJ\s*\d+\s*$/g, '') // Remove trailing " UJ1", etc.
    .replace(/\s+UP\s*\d+\s*$/g, '') // Remove trailing " UP1", etc.
    .trim();

  // If the result is empty or just whitespace, return the original
  if (!baseJob || baseJob.length < 3) {
    return fullJobTitle;
  }

  return baseJob;
};

// Modern Distribution Chart Component
const ModernDistributionChart = ({ clinical, nonClinical }: { clinical: number; nonClinical: number }) => {
  const total = clinical + nonClinical;
  const clinicalPercentage = total > 0 ? (clinical / total) * 100 : 0;
  const nonClinicalPercentage = total > 0 ? (nonClinical / total) * 100 : 0;
  
  return (
    <View style={styles.distributionContainer}>
      {/* Total count display */}
      <View style={styles.totalDisplay}>
        <Text style={styles.totalNumber}>{total}</Text>
        <Text style={styles.totalLabel}>Total Staff</Text>
      </View>
      
      {/* Visual bars */}
      <View style={styles.visualBars}>
        {/* Clinical bar */}
        <View style={styles.barContainer}>
          <View style={styles.barLabel}>
            <View style={[styles.colorDot, { backgroundColor: '#00ff88' }]} />
            <Text style={styles.barText}>Clinical</Text>
          </View>
          <View style={styles.barBackground}>
            <View style={[
              styles.barFill,
              { 
                width: `${clinicalPercentage}%`,
                backgroundColor: '#00ff88'
              }
            ]} />
          </View>
          <Text style={styles.barValue}>{clinical}</Text>
        </View>
        
        {/* Non-Clinical bar */}
        <View style={styles.barContainer}>
          <View style={styles.barLabel}>
            <View style={[styles.colorDot, { backgroundColor: '#ff6b6b' }]} />
            <Text style={styles.barText}>Non-Clinical</Text>
          </View>
          <View style={styles.barBackground}>
            <View style={[
              styles.barFill,
              { 
                width: `${nonClinicalPercentage}%`,
                backgroundColor: '#ff6b6b'
              }
            ]} />
          </View>
          <Text style={styles.barValue}>{nonClinical}</Text>
        </View>
      </View>
    </View>
  );
};

// Modern Stat Card Component
const ModernStatCard = ({ icon, title, value, subtitle, color, gradient }: {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  gradient: string[];
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };
  
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[styles.modernStatCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={gradient} style={styles.modernCardGradient}>
          <View style={styles.modernCardContent}>
            <View style={[styles.modernIconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon as any} size={28} color={color} />
            </View>
            <Text style={styles.modernValue}>{value}</Text>
            <Text style={styles.modernTitle}>{title}</Text>
            {subtitle && <Text style={styles.modernSubtitle}>{subtitle}</Text>}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface ManageStaffScreenProps {
  onBack: () => void;
  onNavigateToRegisterStaff: () => void;
  onNavigateToViewStaff: () => void;
  onNavigateToStaffDashboard?: () => void;
}

export default function ManageStaffScreen({ onBack, onNavigateToRegisterStaff, onNavigateToViewStaff, onNavigateToStaffDashboard }: ManageStaffScreenProps) {
  const [totalStaff, setTotalStaff] = useState<number>(0);
  const [staffByRole, setStaffByRole] = useState<{ role: string; count: number }[]>([]);
  const [staffByDepartment, setStaffByDepartment] = useState<{ department: string; count: number }[]>([]);
  const [activeStaff, setActiveStaff] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [clinicalStaff, setClinicalStaff] = useState<number>(0);
  const [nonClinicalStaff, setNonClinicalStaff] = useState<number>(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoadingData(true);
      
      // Get all profiles and filter for staff/admin
      const allProfiles = await ProfileService.getAllProfiles();
      const staffProfiles = allProfiles.filter(p => p.roles === 'staff' || p.roles === 'admin' || p.user_type === 'staff' || p.user_type === 'admin');
      
      // Calculate total staff (staff + admin)
      const totalStaffCount = staffProfiles.length;
      setTotalStaff(totalStaffCount);
      setActiveStaff(totalStaffCount); // For now, all staff are considered active
      
      // Calculate role distribution (staff vs admin)
      const staffCount = staffProfiles.filter(p => p.roles === 'staff' || p.user_type === 'staff').length;
      const adminCount = staffProfiles.filter(p => p.roles === 'admin' || p.user_type === 'admin').length;
      setStaffByRole([
        { role: 'staff', count: staffCount },
        { role: 'admin', count: adminCount }
      ]);
      
      // Calculate job position distribution (combining grades)
      const jobCounts: { [key: string]: number } = {};
      staffProfiles.forEach(profile => {
        const fullJob = profile.job_position_name || 'Unknown Position';
        // Extract base job title by removing grade patterns
        const baseJob = extractBaseJobTitle(fullJob);
        jobCounts[baseJob] = (jobCounts[baseJob] || 0) + 1;
      });
      
      // Convert to array and sort by count
      const jobDistribution = Object.entries(jobCounts)
        .map(([job, count]) => ({ department: job, count }))
        .sort((a, b) => b.count - a.count);
      
      setStaffByDepartment(jobDistribution);
      
      // Get clinical vs non-clinical staff counts using the ProfileService method
      const clinicalCounts = await ProfileService.getStaffByClinical();
      setClinicalStaff(clinicalCounts.clinical);
      setNonClinicalStaff(clinicalCounts.nonClinical);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setTotalStaff(0);
      setStaffByRole([]);
      setStaffByDepartment([]);
      setActiveStaff(0);
      setClinicalStaff(0);
      setNonClinicalStaff(0);
    } finally {
      setIsLoadingData(false);
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous animations
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleRegisterStaff = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNavigateToRegisterStaff();
  };

  const handleViewStaff = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNavigateToViewStaff();
  };

  const handleActionPress = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Here you would implement the actual action logic
    // For now, just show an alert
    alert(`${action} functionality will be implemented here`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Modern Elegant Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={["#0f0f23", "#1a1a2e", "#16213e", "#0f3460"]} 
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Elegant gradient overlay */}
        <Animated.View style={[
          styles.animatedGradient,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.2, 0.4, 0.2]
            }),
          }
        ]}>
          <LinearGradient 
            colors={["rgba(99, 102, 241, 0.1)", "rgba(139, 92, 246, 0.1)", "rgba(6, 182, 212, 0.1)"]} 
            style={styles.backgroundGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </Animated.View>

      {/* Modern Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Animated.View style={[
            styles.headerIcon,
            {
              transform: [
                { scale: pulseAnim },
              ]
            }
          ]}>
            <LinearGradient 
              colors={["#00ff88", "#5b73ff", "#00d4ff", "#ff0080"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="people" size={24} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>👥 Manage Staff</Text>
            <Text style={styles.headerSubtitle}>Staff management and administration</Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Modern Dashboard Overview */}
        <Animated.View style={[
          styles.modernStatsContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              }) }
            ]
          }
        ]}>
          {/* Main Stats Row */}
          <View style={styles.modernStatsRow}>
            <ModernStatCard
              icon="people"
              title="Total Staff"
              value={isLoadingData ? "..." : totalStaff.toLocaleString()}
              subtitle="All Staff Members"
              color="#00ff88"
              gradient={['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']}
            />
            
            <ModernStatCard
              icon="checkmark-circle"
              title="Active Staff"
              value={isLoadingData ? "..." : activeStaff}
              subtitle="Currently Active"
              color="#06b6d4"
              gradient={['rgba(6, 182, 212, 0.2)', 'rgba(6, 182, 212, 0.1)']}
            />
          </View>

          {/* Clinical vs Non-Clinical Distribution Chart */}
          <View style={styles.wheelChartSection}>
            <Text style={styles.sectionTitle}>Clinical vs Non-Clinical Distribution</Text>
            <View style={styles.wheelChartContainer}>
              <ModernDistributionChart 
                clinical={clinicalStaff} 
                nonClinical={nonClinicalStaff}
              />
              <View style={styles.wheelLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#00ff88' }]} />
                  <Text style={styles.legendText}>
                    Clinical: {isLoadingData ? "..." : clinicalStaff}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ff6b6b' }]} />
                  <Text style={styles.legendText}>
                    Non-Clinical: {isLoadingData ? "..." : nonClinicalStaff}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Job Position Breakdown Section */}
          <View style={styles.jobBreakdownSection}>
            <Text style={styles.sectionTitle}>Job Position Breakdown</Text>
            {isLoadingData ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading job position data...</Text>
              </View>
            ) : staffByDepartment.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.jobScrollContainer}
              >
                {staffByDepartment.map((jobData, index) => (
                  <View key={index} style={styles.modernJobCard}>
                    <LinearGradient 
                      colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                      style={styles.modernJobCardGradient}
                    >
                      <View style={styles.jobCardContent}>
                        <View style={styles.jobCardIcon}>
                          <Ionicons name="briefcase" size={24} color="#00d4ff" />
                        </View>
                        <Text style={styles.jobCardCount}>{jobData.count}</Text>
                        <Text style={styles.jobCardTitle} numberOfLines={2}>
                          {jobData.department}
                        </Text>
                        <Text style={styles.jobCardSubtitle}>
                          staff member{jobData.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No job position data available</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Management Actions */}
        <Animated.View style={[
          styles.sectionContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [80, 0]
              }) }
            ]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#00ff88", "#5b73ff"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="settings" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Management Actions</Text>
          </View>
          
          <View style={styles.sectionGrid}>
            {[
              { 
                icon: "person-add", 
                color: "#00ff88", 
                title: "Register Staff", 
                subtitle: "Add new staff member to the system",
                action: "Register Staff"
              },
              { 
                icon: "eye", 
                color: "#00d4ff", 
                title: "View Staff", 
                subtitle: "View and manage all staff members",
                action: "View Staff"
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { 
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [120 + (index * 20), 0]
                        })
                      }
                    ]
                  }
                ]}
                onPress={() => {
                  if (item.action === 'Register Staff') {
                    onNavigateToRegisterStaff();
                  } else if (item.action === 'View Staff') {
                    onNavigateToViewStaff();
                  } else {
                    handleActionPress(item.action);
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]} 
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionCardHeader}>
                    <View style={[styles.actionIcon, { backgroundColor: item.color + '20' }]}>
                      <Ionicons name={item.icon as any} size={24} color={item.color} />
                    </View>
                    <View style={styles.actionCardContent}>
                      <Text style={styles.actionTitle}>{item.title}</Text>
                      <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.actionCardFooter}>
                    <Text style={styles.actionButton}>Open</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Quick Info Section */}
        <Animated.View style={[
          styles.infoSection,
          {
            opacity: fadeAnim,
            transform: [
              { 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [70, 0]
                })
              }
            ]
          }
        ]}>
          <Text style={styles.infoTitle}>📋 Staff Management Features</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.infoText}>Register new staff with complete profile information</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.infoText}>View and manage existing staff members</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.infoText}>Edit staff information and permissions</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.infoText}>Track staff activity and status</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  animatedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  backButton: {
    marginRight: 24,
  },
  backButtonGradient: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  headerIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  statsCard: {
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statsCardGradient: {
    padding: 24,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIcon: {
    marginRight: 24,
  },
  statsText: {
    flex: 1,
  },
  statsNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 24,
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionsContainer: {
    gap: 24,
  },
  actionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCardGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 24,
  },
  actionIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  actionDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
  },
  actionArrow: {
    marginLeft: 24,
  },
  infoSection: {
    marginTop: 24,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  infoList: {
    gap: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 24,
    flex: 1,
  },
  // Modern Dashboard Styles
  modernStatsContainer: {
    marginBottom: 24,
  },
  modernStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 24,
  },
  modernStatCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modernCardGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernCardContent: {
    alignItems: 'center',
  },
  modernIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modernValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  modernTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  modernSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  // Wheel Chart Styles
  wheelChartSection: {
    marginBottom: 24,
  },
  wheelChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  distributionContainer: {
    flex: 1,
  },
  totalDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
  visualBars: {
    gap: 24,
  },
  barContainer: {
    marginBottom: 24,
  },
  barLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 24,
    marginRight: 24,
  },
  barText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  barBackground: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 24,
  },
  barValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    marginTop: 24,
  },
  wheelLegend: {
    flex: 1,
    marginLeft: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  legendDot: {
    width: 24,
    height: 24,
    borderRadius: 24,
    marginRight: 24,
  },
  legendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Job Breakdown Styles
  jobBreakdownSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  jobScrollContainer: {
    paddingHorizontal: 24,
  },
  modernJobCard: {
    width: 24,
    marginRight: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modernJobCardGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  jobCardContent: {
    alignItems: 'center',
  },
  jobCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  jobCardCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 24,
  },
  jobCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 16,
  },
  jobCardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  // Section Styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 24,
  },
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  actionCardContent: {
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  actionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  noDataText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
});
