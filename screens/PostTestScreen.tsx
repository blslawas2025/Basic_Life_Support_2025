import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 430; // include iPhone 13/14 widths
const isMediumScreen = width >= 430 && width < 768;
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

interface PostTestScreenProps {
  onBack: () => void;
  userName: string;
  onStartTest?: () => void;
}

export default function PostTestScreen({ onBack, userName, onStartTest }: PostTestScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    startAnimations();
  }, []);

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

  const handleStartTest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onStartTest) {
      onStartTest();
    } else {
      // Fallback: Show alert if no test handler provided
      Alert.alert(
        'Post Test Ready',
        'The post-test is ready to begin! This will navigate to the actual test interface.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Test', 
            onPress: () => {
              // For now, just show a success message
              Alert.alert('Test Started', 'Post-test has begun! (Test interface coming soon)');
            }
          }
        ]
      );
    }
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
      </Animated.View>

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
              transform: [{ scale: pulseAnim }]
            }
          ]}>
            <LinearGradient 
              colors={["#5b73ff", "#00d4ff", "#00ff88"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Post Test</Text>
            <Text style={styles.headerSubtitle}>Final Assessment</Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 0]
              }) }
            ]
          }
        ]}
      >
        {/* Test Info Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['rgba(91, 115, 255, 0.1)', 'rgba(0, 212, 255, 0.1)']}
            style={styles.infoCardGradient}
          >
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color="#5b73ff" />
              <Text style={styles.infoTitle}>Post Test Information</Text>
            </View>
            <Text style={styles.infoText}>
              This post-test will evaluate your knowledge after completing the Basic Life Support training. 
              It helps measure your learning progress and understanding of the material.
            </Text>
          </LinearGradient>
        </View>

        {/* Test Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={24} color="#00d4ff" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>Duration</Text>
              <Text style={styles.detailValue}>30 minutes</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="help-circle" size={24} color="#5b73ff" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>Questions</Text>
              <Text style={styles.detailValue}>30 questions</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="trophy" size={24} color="#ffaa00" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailTitle}>Passing Score</Text>
              <Text style={styles.detailValue}>Clinical: 25/30, Non-clinical: 20/30</Text>
            </View>
          </View>
        </View>

        {/* Start Test Button */}
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartTest}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#5b73ff', '#00d4ff', '#00ff88']}
            style={styles.startButtonGradient}
          >
            <Ionicons name="play" size={24} color="#ffffff" />
            <Text style={styles.startButtonText}>Start Post Test</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={24} color="#5b73ff" />
              <Text style={styles.instructionText}>Read each question carefully</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={24} color="#5b73ff" />
              <Text style={styles.instructionText}>Select the best answer for each question</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={24} color="#5b73ff" />
              <Text style={styles.instructionText}>You can review and change answers before submitting</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="checkmark-circle" size={24} color="#5b73ff" />
              <Text style={styles.instructionText}>The test will auto-submit when time runs out</Text>
            </View>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(91, 115, 255, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(91, 115, 255, 0.4)',
    shadowColor: '#5b73ff',
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
    shadowColor: '#5b73ff',
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
  infoCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 115, 255, 0.3)',
  },
  infoCardGradient: {
    padding: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 24,
  },
  infoText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(91, 115, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  startButton: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#5b73ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 24,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  instructionsList: {
    gap: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 24,
    flex: 1,
  },
});
