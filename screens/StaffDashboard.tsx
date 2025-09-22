import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useResponsive } from "../utils/responsiveHelpers";
import { colors, gradients } from "../styles/theme";
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

interface StaffDashboardProps {
  userName: string;
  onLogout: () => void;
  onNavigateToRegisterStaff: () => void;
  onNavigateToViewStaff: () => void;
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  pendingStaff: number;
  adminCount: number;
  staffCount: number;
  recentRegistrations: number;
  staffByDepartment: { department: string; count: number }[];
}

export default function StaffDashboard({ 
  userName, 
  onLogout, 
  onNavigateToRegisterStaff, 
  onNavigateToViewStaff
}: StaffDashboardProps) {
  const { width: rw, isTablet } = useResponsive();
  const containerMaxWidth = isTablet ? Math.min(1100, rw * 0.92) : undefined;
  const [staffStats, setStaffStats] = useState<StaffStats>({
    totalStaff: 0,
    activeStaff: 0,
    pendingStaff: 0,
    adminCount: 0,
    staffCount: 0,
    recentRegistrations: 0,
    staffByDepartment: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStaffStatistics();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Entrance animations
    Animated.stagger(100, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
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

    Animated.loop(
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  };

  const loadStaffStatistics = async () => {
    try {
      setIsLoading(true);
      const allProfiles = await ProfileService.getAllProfiles();
      
      // Filter staff profiles (staff and admin roles)
      const staffProfiles = allProfiles.filter(p => 
        p.roles === 'staff' || p.roles === 'admin' || p.user_type === 'staff' || p.user_type === 'admin'
      );

      // Calculate statistics
      const totalStaff = staffProfiles.length;
      const activeStaff = staffProfiles.filter(p => p.status === 'active').length;
      const pendingStaff = staffProfiles.filter(p => p.status === 'pending').length;
      const adminCount = staffProfiles.filter(p => p.roles === 'admin' || p.user_type === 'admin').length;
      const staffCount = staffProfiles.filter(p => p.roles === 'staff' || p.user_type === 'staff').length;

      // Recent registrations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentRegistrations = staffProfiles.filter(p => 
        new Date(p.created_at) > sevenDaysAgo
      ).length;

      // Staff by department (based on job position)
      const departmentMap = new Map<string, number>();
      staffProfiles.forEach(staff => {
        if (staff.job_position_name) {
          const department = staff.job_position_name.split(' ')[0]; // Get first word as department
          departmentMap.set(department, (departmentMap.get(department) || 0) + 1);
        }
      });
      
      const staffByDepartment = Array.from(departmentMap.entries())
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 departments

      setStaffStats({
        totalStaff,
        activeStaff,
        pendingStaff,
        adminCount,
        staffCount,
        recentRegistrations,
        staffByDepartment
      });
    } catch (error) {
      console.error('Error loading staff statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (action) {
      case 'Register Staff':
        onNavigateToRegisterStaff();
        break;
      case 'View Staff':
        onNavigateToViewStaff();
        break;
      default:
        }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'approved': return '#3b82f6';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'staff': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Modern Elegant Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={gradients.appBackground} 
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
        <View style={styles.headerContent}>
          <Animated.View style={[
            styles.headerIcon,
            {
              transform: [
                { scale: pulseAnim },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }
              ]
            }
          ]}>
            <LinearGradient 
              colors={[colors.accent, colors.indigo, colors.primary, colors.magenta]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="people" size={24} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>👥 Staff Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, {userName}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <LinearGradient
            colors={["rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0.1)"]}
            style={styles.logoutButtonGradient}
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : null]}
      >
        {/* Statistics Overview */}
        <Animated.View style={[
          styles.statsSection,
          {
            opacity: fadeAnim,
            transform: [
              { 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }
            ]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#6366f1", "#8b5cf6"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="analytics" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Staff Overview</Text>
          </View>

          <View style={styles.statsGrid}>
            {/* Total Staff */}
            <Animated.View style={[
              styles.statCard,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  }
                ]
              }
            ]}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.3)', 'rgba(5, 150, 105, 0.3)']}
                style={styles.statCardGradient}
              >
                <View style={styles.statIcon}>
                  <Ionicons name="people" size={24} color="#10b981" />
                </View>
                <Text style={styles.statNumber}>
                  {isLoading ? '...' : staffStats.totalStaff}
                </Text>
                <Text style={styles.statLabel}>Total Staff</Text>
              </LinearGradient>
            </Animated.View>

            {/* Active Staff */}
            <Animated.View style={[
              styles.statCard,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0]
                    })
                  }
                ]
              }
            ]}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.3)', 'rgba(37, 99, 235, 0.3)']}
                style={styles.statCardGradient}
              >
                <View style={styles.statIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statNumber}>
                  {isLoading ? '...' : staffStats.activeStaff}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </LinearGradient>
            </Animated.View>

            {/* Pending Staff */}
            <Animated.View style={[
              styles.statCard,
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
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.3)', 'rgba(217, 119, 6, 0.3)']}
                style={styles.statCardGradient}
              >
                <View style={styles.statIcon}>
                  <Ionicons name="time" size={24} color="#f59e0b" />
                </View>
                <Text style={styles.statNumber}>
                  {isLoading ? '...' : staffStats.pendingStaff}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </LinearGradient>
            </Animated.View>

            {/* Recent Registrations */}
            <Animated.View style={[
              styles.statCard,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, 0]
                    })
                  }
                ]
              }
            ]}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.3)', 'rgba(124, 58, 237, 0.3)']}
                style={styles.statCardGradient}
              >
                <View style={styles.statIcon}>
                  <Ionicons name="person-add" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.statNumber}>
                  {isLoading ? '...' : staffStats.recentRegistrations}
                </Text>
                <Text style={styles.statLabel}>This Week</Text>
              </LinearGradient>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Role Distribution */}
        <Animated.View style={[
          styles.roleSection,
          {
            opacity: fadeAnim,
            transform: [
              { 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [90, 0]
                })
              }
            ]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#f59e0b", "#d97706"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="shield" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Role Distribution</Text>
          </View>

          <View style={styles.roleCards}>
            <Animated.View style={[
              styles.roleCard,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0]
                    })
                  }
                ]
              }
            ]}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.2)']}
                style={styles.roleCardGradient}
              >
                <View style={styles.roleIcon}>
                  <Ionicons name="person" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.roleNumber}>
                  {isLoading ? '...' : staffStats.staffCount}
                </Text>
                <Text style={styles.roleLabel}>Staff Members</Text>
                <Text style={styles.rolePercentage}>
                  {isLoading ? '...' : staffStats.totalStaff > 0 ? Math.round((staffStats.staffCount / staffStats.totalStaff) * 100) : 0}%
                </Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={[
              styles.roleCard,
              {
                opacity: fadeAnim,
                transform: [
                  { 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [110, 0]
                    })
                  }
                ]
              }
            ]}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.2)']}
                style={styles.roleCardGradient}
              >
                <View style={styles.roleIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="#ef4444" />
                </View>
                <Text style={styles.roleNumber}>
                  {isLoading ? '...' : staffStats.adminCount}
                </Text>
                <Text style={styles.roleLabel}>Administrators</Text>
                <Text style={styles.rolePercentage}>
                  {isLoading ? '...' : staffStats.totalStaff > 0 ? Math.round((staffStats.adminCount / staffStats.totalStaff) * 100) : 0}%
                </Text>
              </LinearGradient>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Department Distribution */}
        {staffStats.staffByDepartment.length > 0 && (
          <Animated.View style={[
            styles.departmentSection,
            {
              opacity: fadeAnim,
              transform: [
                { 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [120, 0]
                  })
                }
              ]
            }
          ]}>
            <View style={styles.sectionHeader}>
              <LinearGradient 
                colors={["#8b5cf6", "#7c3aed"]} 
                style={styles.sectionIcon}
              >
                <Ionicons name="business" size={24} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Top Departments</Text>
            </View>

            <View style={styles.departmentList}>
              {staffStats.staffByDepartment.map((dept, index) => (
                <Animated.View 
                  key={dept.department}
                  style={[
                    styles.departmentItem,
                    {
                      opacity: fadeAnim,
                      transform: [
                        { 
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [130 + (index * 20), 0]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.departmentItemGradient}
                  >
                    <View style={styles.departmentInfo}>
                      <Text style={styles.departmentName}>{dept.department}</Text>
                      <Text style={styles.departmentCount}>{dept.count} staff</Text>
                    </View>
                    <View style={styles.departmentBar}>
                      <View 
                        style={[
                          styles.departmentBarFill,
                          { 
                            width: `${(dept.count / Math.max(...staffStats.staffByDepartment.map(d => d.count))) * 100}%`,
                            backgroundColor: getRoleColor('staff')
                          }
                        ]} 
                      />
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View style={[
          styles.actionsSection,
          {
            opacity: fadeAnim,
            transform: [
              { 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [150, 0]
                })
              }
            ]
          }
        ]}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#00ff88", "#5b73ff"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="flash" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            {[
              { 
                icon: "person-add", 
                color: "#10b981", 
                title: "Register Staff", 
                subtitle: "Add new staff members",
                action: "Register Staff"
              },
              { 
                icon: "eye", 
                color: "#3b82f6", 
                title: "View Staff", 
                subtitle: "View and manage staff",
                action: "View Staff"
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.action}
                style={[
                  styles.actionCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { 
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [160 + (index * 20), 0]
                        })
                      }
                    ]
                  }
                ]}
                onPress={() => handleAction(item.action)}
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
                  </View>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.25)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerIconGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  logoutButton: {
    marginLeft: 24,
  },
  logoutButtonGradient: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statsSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  roleSection: {
    marginBottom: 12,
  },
  departmentSection: {
    marginBottom: 12,
  },
  actionsSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  statCardGradient: {
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  roleCards: {
    flexDirection: 'row',
    gap: 24,
  },
  roleCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  roleCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  roleIcon: {
    marginBottom: 24,
  },
  roleNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  rolePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  departmentList: {
    gap: 8,
  },
  departmentItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  departmentItemGradient: {
    padding: 12,
  },
  departmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  departmentCount: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  departmentBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  departmentBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  actionCard: {
    width: '31%',
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
    alignItems: 'center',
    minHeight: 24,
  },
  actionCardHeader: {
    marginBottom: 24,
  },
  actionIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
