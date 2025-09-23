import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients } from "../styles/theme";
import { useResponsive } from "../utils/responsiveHelpers";
import { useReducedMotion } from "../utils/uiHooks";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;
const isTablet = width >= 768 && height >= 1024;

interface UserDashboardProps {
  userName: string;
  onLogout: () => void;
  onNavigateToPreTest: () => void;
  onNavigateToPostTest: () => void;
  onNavigateToTestInterface: () => void;
  onNavigateToChecklistBrowse?: () => void;
  onNavigateToComprehensiveResults: () => void;
  allowedActions?: string[];
}

export default function UserDashboard({ userName, onLogout, onNavigateToPreTest, onNavigateToPostTest, onNavigateToTestInterface, onNavigateToChecklistBrowse, onNavigateToComprehensiveResults, allowedActions = [] }: UserDashboardProps) {
  const { width: rw, isTablet } = useResponsive();
  const containerMaxWidth = isTablet ? Math.min(1100, rw * 0.92) : undefined;
  const reduceMotion = useReducedMotion();
  
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
  }, []);

  const startAnimations = () => {
    // Entrance animations
    Animated.stagger(200, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: reduceMotion ? 400 : 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: reduceMotion ? 300 : 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: reduceMotion ? 250 : 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous animations
    if (!reduceMotion) {
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
    }

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

    if (!reduceMotion) {
      createParticle(particle1, 0).start();
      createParticle(particle2, 500).start();
      createParticle(particle3, 1000).start();
    }
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
              <Ionicons name="person" size={24} color="#ffffff" />
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
              User Dashboard
            </Animated.Text>
            <Text style={styles.welcomeMessage}>Welcome {userName}</Text>
            <Text style={styles.dashboardSubtitle}>Take Tests & View Results</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Content */}
      <Animated.ScrollView 
        style={styles.dashboardScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.dashboardContent, containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : null]}
      >
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
              <Ionicons name="flash" size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Available Actions</Text>
          </View>
          
          <View style={styles.sectionGrid}>
            {/** Map legacy 'testInterface' to 'myResults' to avoid stale settings and hide 'testInterface' */}
            {(() => {
              const mapped = new Set(allowedActions.map(a => (a === 'testInterface' ? 'myResults' : a)));
              mapped.delete('testInterface');
              const isAllowed = (action: string) => mapped.size === 0 ? true : mapped.has(action);
              return [
              { 
                icon: "play-circle-outline", 
                color: "#00ff88", 
                title: "Take Pre Test", 
                subtitle: "Complete your pre-training assessment",
                action: "preTest"
              },
              { 
                icon: "stopwatch-outline", 
                color: "#5b73ff", 
                title: "Take Post Test", 
                subtitle: "Complete your post-training assessment",
                action: "postTest"
              },
              { 
                icon: "bar-chart-outline", 
                color: "#ff0080", 
                title: "My Results", 
                subtitle: "View my test and checklist results",
                action: "myResults"
              },
              { 
                icon: "checklist-outline", 
                color: "#ffaa00", 
                title: "View Checklist", 
                subtitle: "View available checklists",
                action: "checklistView"
              },
              { 
                icon: "list-outline", 
                color: "#8b5cf6", 
                title: "Comprehensive Results", 
                subtitle: "View all your test results and progress",
                action: "comprehensiveResults"
              }
            ].filter(item => isAllowed(item.action)).map((item, index) => (
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (item.action === 'preTest') {
                    onNavigateToPreTest();
                  } else if (item.action === 'postTest') {
                    onNavigateToPostTest();
                  } else if (item.action === 'myResults') {
                    onNavigateToComprehensiveResults();
                  } else if (item.action === 'checklistView') {
                    if (onNavigateToChecklistBrowse) {
                      onNavigateToChecklistBrowse();
                    }
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
            ));
            })()}
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.25)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
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
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  welcomeMessage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00d4ff',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  dashboardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 128, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 128, 0.4)',
    shadowColor: '#ff0080',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  dashboardScrollView: {
    flex: 1,
  },
  dashboardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 12,
  },
  sectionContainer: {
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
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: isSmallScreen ? 8 : 12,
  },
  actionCard: {
    width: isSmallScreen ? (width - 40) / 2 : isMediumScreen ? (width - 60) / 2 : (width - 72) / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  actionCardGradient: {
    padding: isSmallScreen ? 12 : 16,
    borderRadius: 16,
  },
  actionCardHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  actionIcon: {
    width: isSmallScreen ? 20 : 24,
    height: isSmallScreen ? 20 : 24,
    borderRadius: isSmallScreen ? 10 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  actionCardContent: {
    flex: 1,
    width: '100%',
  },
  actionTitle: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: isSmallScreen ? 4 : 6,
    textAlign: 'left',
    lineHeight: isSmallScreen ? 14 : 16,
  },
  actionSubtitle: {
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: isSmallScreen ? 12 : 14,
    textAlign: 'left',
  },
  actionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: isSmallScreen ? 4 : 6,
  },
  actionButton: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
    color: '#00d4ff',
  },
});


