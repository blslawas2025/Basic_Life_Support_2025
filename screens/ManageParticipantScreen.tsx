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
        <Text style={styles.totalLabel}>Total Participants</Text>
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
        
        {/* Non-clinical bar */}
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

interface ManageParticipantScreenProps {
  onBack: () => void;
  onNavigateToRegisterParticipant: () => void;
  onNavigateToBulkImport: () => void;
  onNavigateToViewParticipants: () => void;
}

export default function ManageParticipantScreen({ onBack, onNavigateToRegisterParticipant, onNavigateToBulkImport, onNavigateToViewParticipants }: ManageParticipantScreenProps) {
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [participantsByJob, setParticipantsByJob] = useState<{ job: string; count: number }[]>([]);
  const [participantsByClinical, setParticipantsByClinical] = useState<{ clinical: number; nonClinical: number }>({ clinical: 0, nonClinical: 0 });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

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
      setIsLoadingData(true);
      
      // Fetch all dashboard data in parallel
      const [
        totalParticipantsResult,
        participantsByJobResult,
        participantsByClinicalResult,
        pendingCountResult
      ] = await Promise.all([
        ProfileService.getTotalParticipantsCount(),
        ProfileService.getParticipantsByJob(),
        ProfileService.getParticipantsByClinical(),
        ProfileService.getPendingParticipantsCount()
      ]);

      setTotalParticipants(totalParticipantsResult);
      setParticipantsByJob(participantsByJobResult);
      setParticipantsByClinical(participantsByClinicalResult);
      setPendingCount(pendingCountResult);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setTotalParticipants(0);
      setParticipantsByJob([]);
      setParticipantsByClinical({ clinical: 0, nonClinical: 0 });
      setPendingCount(0);
    } finally {
      setIsLoadingData(false);
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

  const handleActionPress = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Here you would implement the actual action logic
    // For now, just show an alert
    alert(`${action} functionality will be implemented here`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View style={[
          styles.animatedGradient,
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
            colors={["#00d4ff", "#5b73ff", "#00ff88", "#ff0080", "#ffaa00", "#00d4ff"]} 
            style={styles.backgroundGradient}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </Animated.View>

      {/* Particles */}
      <Animated.View style={[
        styles.particle,
        styles.particle1,
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
        styles.particle,
        styles.particle2,
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
        styles.particle,
        styles.particle3,
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
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
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
              colors={["#00ff88", "#5b73ff", "#00d4ff"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="people" size={24} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Manage Participants</Text>
            <Text style={styles.headerSubtitle}>Manage all participant operations</Text>
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
              title="Total Participants"
              value={isLoadingData ? "..." : totalParticipants.toLocaleString()}
              subtitle="All Course Sessions"
              color="#00ff88"
              gradient={['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']}
            />
            
            <ModernStatCard
              icon="time"
              title="Pending Approval"
              value={isLoadingData ? "..." : pendingCount}
              subtitle="Awaiting Review"
              color="#ffaa00"
              gradient={['rgba(255, 170, 0, 0.2)', 'rgba(255, 170, 0, 0.1)']}
            />
          </View>

          {/* Clinical vs Non-Clinical Wheel Chart */}
          <View style={styles.wheelChartSection}>
            <Text style={styles.sectionTitle}>Clinical vs Non-Clinical Distribution</Text>
            <View style={styles.wheelChartContainer}>
              <ModernDistributionChart 
                clinical={participantsByClinical.clinical} 
                nonClinical={participantsByClinical.nonClinical}
              />
              <View style={styles.wheelLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#00ff88' }]} />
                  <Text style={styles.legendText}>
                    Clinical: {isLoadingData ? "..." : participantsByClinical.clinical}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ff6b6b' }]} />
                  <Text style={styles.legendText}>
                    Non-Clinical: {isLoadingData ? "..." : participantsByClinical.nonClinical}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Job Breakdown Section */}
          <View style={styles.jobBreakdownSection}>
            <Text style={styles.sectionTitle}>Job Position Breakdown</Text>
            {isLoadingData ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading job data...</Text>
              </View>
            ) : participantsByJob.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.jobScrollContainer}
              >
                {participantsByJob.map((jobData, index) => (
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
                          {jobData.job}
                        </Text>
                        <Text style={styles.jobCardSubtitle}>
                          participant{jobData.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No job data available</Text>
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
                title: "Register Participant", 
                subtitle: "Add new participant to the system",
                action: "Register Participant"
              },
              { 
                icon: "cloud-upload", 
                color: "#06b6d4", 
                title: "Bulk Import", 
                subtitle: "Import participants from Excel/CSV",
                action: "Bulk Import"
              },
              { 
                icon: "eye", 
                color: "#00d4ff", 
                title: "View Participants", 
                subtitle: "View and browse all participants",
                action: "View Participants"
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
                  if (item.action === 'Register Participant') {
                    onNavigateToRegisterParticipant();
                  } else if (item.action === 'Bulk Import') {
                    onNavigateToBulkImport();
                  } else if (item.action === 'View Participants') {
                    onNavigateToViewParticipants();
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
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  particle1: {
    top: height * 0.1,
    left: width * 0.05,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  particle2: {
    top: height * 0.2,
    right: width * 0.1,
    backgroundColor: '#5b73ff',
    shadowColor: '#5b73ff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  particle3: {
    top: height * 0.3,
    left: width * 0.15,
    backgroundColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 255, 136, 0.4)',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  backButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
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
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 24,
  },
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
  sectionTitle: {
    fontSize: 16,
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
    gap: 24,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 24,
  },
  statCard: {
    width: isSmallScreen ? (width - 48) / 2 : isMediumScreen ? (width - 60) / 2 : (width - 72) / 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statCardLarge: {
    width: isSmallScreen ? width - 32 : isMediumScreen ? (width - 40) / 2 : (width - 48) / 2,
  },
  statDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  additionalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  jobListContainer: {
    maxHeight: 24,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  jobIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  jobInfo: {
    flex: 1,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    lineHeight: 16,
  },
  jobCount: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
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
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleBackground: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 8,
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
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  centerLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 2,
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
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 24,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionCard: {
    width: isSmallScreen ? width - 32 : isMediumScreen ? (width - 60) / 2 : (width - 72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  actionCardGradient: {
    padding: 24,
    borderRadius: 24,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  actionIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  actionCardContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
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
});
