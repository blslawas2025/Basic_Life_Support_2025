import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients } from "../styles/theme";
import SectionHeader from "../components/SectionHeader";
import ActionTile from "../components/ActionTile";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ProfileService } from "../services/ProfileService";
import { CourseSessionService } from "../services/CourseSessionService";

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

interface SuperAdminDashboardProps {
  userName: string;
  onLogout: () => void;
  onNavigateToManageParticipant: () => void;
  onNavigateToApproveParticipants: () => void;
  onNavigateToManageStaff?: () => void;
  onNavigateToStaffDashboard?: () => void;
  onNavigateToManageQuestions?: () => void;
  onNavigateToManageChecklist?: () => void;
  onNavigateToComprehensiveResults?: () => void;
  onNavigateToCreateCourse?: () => void;
  onNavigateToAttendanceMonitoring?: () => void;
}

export default function SuperAdminDashboard({ userName, onLogout, onNavigateToManageParticipant, onNavigateToApproveParticipants, onNavigateToManageStaff, onNavigateToStaffDashboard, onNavigateToManageQuestions, onNavigateToManageChecklist, onNavigateToComprehensiveResults, onNavigateToCreateCourse, onNavigateToAttendanceMonitoring }: SuperAdminDashboardProps) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [totalStaff, setTotalStaff] = useState<number>(0);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [endedCourseSessions, setEndedCourseSessions] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Particle animations
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoadingCount(true);
      
      // Fetch only the 3 required metrics
      const [
        pendingCountResult,
        totalStaffResult,
        totalParticipantsResult,
        endedCourseSessionsResult
      ] = await Promise.all([
        ProfileService.getPendingParticipantsCount(),
        ProfileService.getTotalStaffCount(),
        ProfileService.getTotalParticipantsCount(),
        CourseSessionService.getEndedCourseSessionsCount()
      ]);

      setPendingCount(pendingCountResult);
      setTotalStaff(totalStaffResult);
      setTotalParticipants(totalParticipantsResult);
      setEndedCourseSessions(endedCourseSessionsResult);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setPendingCount(0);
      setTotalStaff(0);
      setTotalParticipants(0);
      setEndedCourseSessions(0);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const startAnimations = () => {
    // Entrance animations
    Animated.stagger(200, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous animations
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Particle animations
    const createParticle = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 10000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 10000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createParticle(particle1, 0).start();
    createParticle(particle2, 500).start();
    createParticle(particle3, 1000).start();
  };

  return (
    <View style={styles.dashboard}>
      <StatusBar style="light" />
      
      {/* Background */}
      <Animated.View style={styles.dashboardBackground}>
        <LinearGradient 
          colors={gradients.appBackground} 
          style={styles.dashboardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View style={[
          styles.dashboardAnimatedGradient,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0.3, 0.7, 0.4, 0.8, 0.3]
            }),
            transform: [{
              rotate: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg']
              })
            }]
          }
        ]}>
          <LinearGradient 
            colors={gradients.brandSweep} 
            style={styles.dashboardGradient}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </Animated.View>

      {/* Particles */}
      <Animated.View style={[
        styles.dashboardParticle,
        styles.dashboardParticle1,
        {
          transform: [
            {
              translateY: particle1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -100]
              })
            },
            {
              translateX: particle1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 80]
              })
            }
          ],
          opacity: particle1.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 0.6, 0]
          })
        }
      ]} />

      <Animated.View style={[
        styles.dashboardParticle,
        styles.dashboardParticle2,
        {
          transform: [
            {
              translateY: particle2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -120]
              })
            },
            {
              translateX: particle2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -60]
              })
            }
          ],
          opacity: particle2.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0, 0.8, 1, 0]
          })
        }
      ]} />

      <Animated.View style={[
        styles.dashboardParticle,
        styles.dashboardParticle3,
        {
          transform: [
            {
              translateY: particle3.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -90]
              })
            },
            {
              translateX: particle3.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 70]
              })
            }
          ],
          opacity: particle3.interpolate({
            inputRange: [0, 0.25, 0.75, 1],
            outputRange: [0, 1, 0.7, 0]
          })
        }
      ]} />

      {/* Header */}
      <Animated.View style={[
        styles.dashboardHeader,
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
              colors={[colors.primary, colors.indigo, colors.accent, colors.magenta]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="shield-checkmark" size={getResponsiveSize(28, 32, 36)} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Animated.Text style={[
              styles.dashboardTitle,
              {
                textShadowColor: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0, 212, 255, 0)', 'rgba(0, 212, 255, 0.8)']
                })
              }
            ]}>
              Super Admin Dashboard
            </Animated.Text>
            <Text style={styles.welcomeMessage}>Welcome {userName}</Text>
            <Text style={styles.dashboardSubtitle}>Complete System Control</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Content */}
      <Animated.ScrollView 
        style={styles.dashboardScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.dashboardContent}
      >
        {/* Statistics Overview */}
        <Animated.View style={[
          styles.statsContainer,
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
          <Text style={styles.statsTitle}>System Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={24} color="#00d4ff" />
              </View>
              <Text style={styles.statNumber}>
                {isLoadingCount ? "..." : totalStaff.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Staff</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={16} color="#00ff88" />
                <Text style={styles.statTrendText}>Staff & Admin</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="people-outline" size={24} color="#00ff88" />
              </View>
              <Text style={styles.statNumber}>
                {isLoadingCount ? "..." : totalParticipants.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Participants</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={16} color="#00ff88" />
                <Text style={styles.statTrendText}>All Sessions</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="school" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.statNumber}>
                {isLoadingCount ? "..." : endedCourseSessions.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Ended Course Sessions</Text>
              <View style={styles.statTrend}>
                <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                <Text style={styles.statTrendText}>Completed</Text>
              </View>
            </View>
          </View>
          
          {/* Approve Participants Panel */}
          <TouchableOpacity 
            style={styles.approvePanel}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onNavigateToApproveParticipants();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={["rgba(0, 255, 136, 0.1)", "rgba(0, 255, 136, 0.05)"]} 
              style={styles.approvePanelGradient}
            >
              <View style={styles.approvePanelHeader}>
                <View style={styles.approveIcon}>
                  <Ionicons name="checkmark-circle" size={getResponsiveSize(24, 26, 28)} color="#00ff88" />
                  {pendingCount > 0 && !isLoadingCount && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>
                        {pendingCount > 99 ? '99+' : pendingCount.toString()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.approvePanelContent}>
                  <Text style={styles.approvePanelTitle}>Pending Approval</Text>
                  <Text style={styles.approvePanelSubtitle}>
                    {isLoadingCount 
                      ? "Loading..." 
                      : `${pendingCount} participant${pendingCount !== 1 ? 's' : ''} awaiting approval`
                    }
                  </Text>
                </View>
                <View style={styles.approvePanelAction}>
                  <Text style={styles.approvePanelButton}>Review</Text>
                  <Ionicons name="chevron-forward" size={16} color="#00ff88" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
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
              colors={["#00d4ff", "#5b73ff"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="flash" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.sectionGrid}>
            {[
              { 
                icon: "people", 
                color: "#00d4ff", 
                title: "Manage Staff", 
                subtitle: "Add, edit and delete staff members",
                action: "Manage Staff"
              },
              { 
                icon: "people-outline", 
                color: "#00ff88", 
                title: "Manage Participants", 
                subtitle: "Add, edit and delete participants",
                action: "Manage Participants"
              },
              { 
                icon: "help-circle-outline", 
                color: "#ff0080", 
                title: "Manage Questions", 
                subtitle: "Add, edit and delete questions",
                action: "Manage Questions"
              },
              { 
                icon: "checklist-outline", 
                color: "#ffaa00", 
                title: "Manage Checklist", 
                subtitle: "Add, edit and delete checklists",
                action: "Manage Checklist"
              },
              { 
                icon: "analytics-outline", 
                color: "#5b73ff", 
                title: "View Reports", 
                subtitle: "Check system analytics",
                action: "View Result"
              },
              { 
                icon: "list-outline", 
                color: "#8b5cf6", 
                title: "Comprehensive Results", 
                subtitle: "All tests and checklists combined",
                action: "Comprehensive Results"
              },
              { 
                icon: "school-outline", 
                color: "#8b5cf6", 
                title: "Create Course", 
                subtitle: "Set up new training course",
                action: "Create Course"
              },
              { 
                icon: "people-outline", 
                color: "#00ff88", 
                title: "Attendance Monitor", 
                subtitle: "Track participant attendance",
                action: "Attendance Monitoring"
              },
              { 
                icon: "cog-outline", 
                color: "#8b5cf6", 
                title: "System Settings", 
                subtitle: "Configure system options",
                action: "Edit Profile"
              }
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
                  if (item.action === 'Manage Participants') {
                    onNavigateToManageParticipant();
                  } else if (item.action === 'Manage Staff' && onNavigateToManageStaff) {
                    onNavigateToManageStaff();
                  } else if (item.action === 'Staff Dashboard' && onNavigateToStaffDashboard) {
                    onNavigateToStaffDashboard();
                  } else if (item.action === 'Manage Questions' && onNavigateToManageQuestions) {
                    onNavigateToManageQuestions();
                  } else if (item.action === 'Manage Checklist' && onNavigateToManageChecklist) {
                    onNavigateToManageChecklist();
                  } else if (item.action === 'Comprehensive Results' && onNavigateToComprehensiveResults) {
                    onNavigateToComprehensiveResults();
                  } else if (item.action === 'Create Course' && onNavigateToCreateCourse) {
                    onNavigateToCreateCourse();
                  } else if (item.action === 'Attendance Monitoring' && onNavigateToAttendanceMonitoring) {
                    onNavigateToAttendanceMonitoring();
                  } else {
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
                      <Ionicons name={item.icon as any} size={getResponsiveSize(20, 22, 24)} color={item.color} />
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
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboard: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  dashboardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dashboardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dashboardAnimatedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dashboardParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dashboardParticle1: {
    top: height * 0.1,
    left: width * 0.05,
    backgroundColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  dashboardParticle2: {
    top: height * 0.2,
    right: width * 0.1,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  dashboardParticle3: {
    top: height * 0.3,
    left: width * 0.15,
    backgroundColor: '#ff0080',
    shadowColor: '#ff0080',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
    paddingTop: getResponsiveSize(25, 30, 35),
    paddingBottom: getResponsiveSize(20, 25, 30),
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 212, 255, 0.4)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
  },
  headerIcon: {
    width: getResponsiveSize(50, 55, 60),
    height: getResponsiveSize(50, 55, 60),
    borderRadius: getResponsiveSize(25, 27, 30),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(15, 18, 20),
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  headerIconGradient: {
    width: getResponsiveSize(50, 55, 60),
    height: getResponsiveSize(50, 55, 60),
    borderRadius: getResponsiveSize(25, 27, 30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  dashboardTitle: {
    fontSize: getResponsiveFontSize(22, 26, 30),
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  welcomeMessage: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#00d4ff',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  dashboardSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  logoutButton: {
    padding: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(255, 0, 128, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 128, 0.5)',
    shadowColor: '#ff0080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  dashboardScrollView: {
    flex: 1,
  },
  dashboardContent: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(15, 18, 20),
    paddingBottom: getResponsiveSize(30, 35, 40),
  },
  sectionContainer: {
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(12, 15, 18),
  },
  sectionIcon: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(16, 18, 20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(8, 10, 12),
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: getResponsiveSize(8, 10, 12),
  },
  statsContainer: {
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  statsTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(12, 15, 18),
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: getResponsiveSize(8, 10, 12),
  },
  statCard: {
    width: isSmallScreen ? (width - 48) / 2 : isMediumScreen ? (width - 60) / 2 : (width - 72) / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statIcon: {
    width: getResponsiveSize(28, 32, 36),
    height: getResponsiveSize(28, 32, 36),
    borderRadius: getResponsiveSize(14, 16, 18),
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  statNumber: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  statLabel: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(4, 6, 8),
  },
  statTrendText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '700',
    color: '#00ff88',
  },
  actionCard: {
    width: isSmallScreen ? width - 32 : isMediumScreen ? (width - 60) / 2 : (width - 72) / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  actionCardGradient: {
    padding: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  actionIcon: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(16, 18, 20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(8, 10, 12),
  },
  actionCardContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  actionSubtitle: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: getResponsiveFontSize(14, 16, 18),
  },
  actionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#00d4ff',
  },
  // Approve Panel Styles
  approvePanel: {
    marginTop: getResponsiveSize(16, 18, 20),
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  approvePanelGradient: {
    padding: getResponsiveSize(16, 18, 20),
  },
  approvePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approveIcon: {
    width: getResponsiveSize(40, 44, 48),
    height: getResponsiveSize(40, 44, 48),
    borderRadius: getResponsiveSize(20, 22, 24),
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(12, 14, 16),
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  approvePanelContent: {
    flex: 1,
  },
  approvePanelTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  approvePanelSubtitle: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  approvePanelAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(4, 6, 8),
  },
  approvePanelButton: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#00ff88',
  },
});
