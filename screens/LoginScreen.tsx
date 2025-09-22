import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients } from "../styles/theme";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileService } from "../services/ProfileService";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;
const isTablet = width >= 768 && height >= 1024;

// Responsive dimensions
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

const getCardWidth = () => {
  if (isSmallScreen) return width - 32;
  if (isMediumScreen) return width - 40;
  if (isTablet) return Math.min(500, width * 0.6);
  return Math.min(400, width * 0.8);
};

interface LoginScreenProps {
  onLogin: (userData: { id: string; email: string; isSuperAdmin: boolean; userName: string; roles: 'admin' | 'staff' | 'user' }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<Array<{ id: string; name: string; email: string; roles: 'admin'|'staff'|'user'; user_type: string }>>([]);
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; name: string; email: string; roles: 'admin'|'staff'|'user'; user_type: string } | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Particle animations
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load saved credentials if remember me was enabled
    loadSavedCredentials();
    
    // Start animations
    startAnimations();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedPassword = await AsyncStorage.getItem('savedPassword');
      const rememberMe = await AsyncStorage.getItem('rememberMe');
      
      if (rememberMe === 'true' && savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRemember(true);
      }
    } catch (error) {
      }
  };

  const saveCredentials = async (email: string, password: string) => {
    try {
      if (remember) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('savedPassword', password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
        await AsyncStorage.setItem('rememberMe', 'false');
      }
    } catch (error) {
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

    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
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
    createParticle(particle4, 1500).start();
  };

  const validate = () => {
    if (!email.trim()) return "Email is required";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) return "Please select a name from search to fill email";
    if (!password || password.length < 6) return "Password must be 6+ characters";
    return null;
  };

  const handleEmailChange = async (text: string) => {
    setEmail(text);
    setSelectedProfile(null);
    try {
      if (text.trim().length < 2) {
        setNameSuggestions([]);
        return;
      }
      const results = await ProfileService.searchProfilesByName(text.trim());
      setNameSuggestions(results);
    } catch (e) {
      setNameSuggestions([]);
    }
  };

  const handleSelectSuggestion = (p: { id: string; name: string; email: string; roles: 'admin'|'staff'|'user'; user_type: string }) => {
    setSelectedProfile(p);
    setEmail(p.email);
    setNameSuggestions([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLogin = async () => {
    const v = validate();
    if (v) {
      setError(v);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Loading animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Try to fetch user profile from database first
    try {
      const userProfile = selectedProfile && selectedProfile.email === email
        ? selectedProfile as any
        : await ProfileService.getProfileByEmail(email);
      
      if (userProfile) {
        // Check password equals IC number
        const fullProfile = await ProfileService.getProfileByEmail(userProfile.email);
        const icRaw = (fullProfile && fullProfile.ic_number) ? String(fullProfile.ic_number) : '';
        const ic = icRaw.replace(/\D/g, '');
        const pass = String(password || '').replace(/\D/g, '');
        if (!ic || pass !== ic) {
          setLoading(false);
          setError('Incorrect IC number');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        // User exists and password matches, use their role
        setLoading(false);
        onLogin({
          id: userProfile.id,
          email: userProfile.email,
          isSuperAdmin: userProfile.roles === 'admin' || userProfile.user_type === 'super_admin',
          userName: userProfile.name,
          roles: userProfile.roles
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      
      // Fallback to hardcoded credentials for demo
      setTimeout(async () => {
        setLoading(false);
        
        // Save credentials if remember me is checked
        await saveCredentials(email, password);
        
        if (email === "blslawas2025" && password === "lawas2025") {
          onLogin({
            id: "demo-admin-id", // Demo ID for testing
            email,
            isSuperAdmin: true,
            userName: "Mr. Amri Amit",
            roles: 'admin'
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (email.includes("@admin.")) {
          onLogin({
            id: `demo-staff-${email}`, // Demo ID for testing
            email,
            isSuperAdmin: false,
            userName: email.split("@")[0].replace(".", " ").replace(/\b\w/g, l => l.toUpperCase()),
            roles: 'staff'
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setError("Invalid credentials. User not found in database.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }, 2000);
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      setError("Login failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleInputFocus = (inputType: string) => {
    setFocusedInput(inputType);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleInputBlur = () => {
    setFocusedInput(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={gradients.appBackground} 
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
            colors={gradients.brandSweep} 
            style={styles.backgroundGradient}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </Animated.View>

      {/* Scanning line */}
      <Animated.View style={[
        styles.scanLine,
        {
          transform: [{
            translateY: scanAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, height + 50]
            })
          }]
        }
      ]} />

      {/* Particles */}
      <Animated.View style={[
        styles.particle,
        styles.particle1,
        {
          transform: [
            {
              translateY: particle1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -150]
              })
            },
            {
              translateX: particle1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 100]
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
                outputRange: [0, -80]
              })
            }
          ],
          opacity: particle2.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0, 0.8, 1, 0]
          })
        }
      ]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.keyboardView}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ],
                paddingHorizontal: 20,
              }
            ]}
          >
            {/* Header */}
            <Animated.View style={styles.header}>
              <Animated.View style={[
                styles.logoContainer,
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
                <Animated.View style={[
                  styles.logoGlow,
                  {
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1]
                    })
                  }
                ]} />
                <LinearGradient 
                  colors={[colors.primary, colors.indigo, colors.accent, colors.magenta]} 
                  style={styles.logoGradient}
                >
                  <Animated.Text style={styles.blsInsideCircle}>
                    BLS
                  </Animated.Text>
                </LinearGradient>
              </Animated.View>
              
              <Animated.View style={styles.appNameContainer}>
                <Animated.Text style={[
                  styles.appName,
                  {
                    textShadowColor: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(0, 212, 255, 0)', 'rgba(0, 212, 255, 1)']
                    })
                  }
                ]}>
                  BASIC LIFE SUPPORT
                </Animated.Text>
              </Animated.View>
            </Animated.View>

            {/* Login Card */}
            <Animated.View style={[
              styles.card,
              {
                width: getCardWidth(),
                maxWidth: isTablet ? 500 : undefined,
                alignSelf: 'center',
              }
            ]}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>Access your training portal</Text>

              {/* Email Input with Name Search */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <Animated.View style={[
                  styles.inputWrapper,
                  {
                    borderColor: focusedInput === 'email' ? '#00d4ff' : '#2a2a3e',
                    backgroundColor: focusedInput === 'email' ? 'rgba(0, 212, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  }
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={24} 
                    color={focusedInput === 'email' ? "#00d4ff" : "#8b9dc3"} 
                  />
                  <TextInput
                    placeholder="Type your name, then pick and we fill email"
                    placeholderTextColor="#8b9dc3"
                    value={email}
                    onChangeText={handleEmailChange}
                    onFocus={() => handleInputFocus('email')}
                    onBlur={handleInputBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.textInput}
                  />
                </Animated.View>
                {nameSuggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {nameSuggestions.map(s => (
                      <TouchableOpacity key={s.id} style={styles.suggestionItem} onPress={() => handleSelectSuggestion(s)}>
                        <Text style={styles.suggestionName}>{s.name}</Text>
                        <Text style={styles.suggestionEmail}>{s.email}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <Animated.View style={[
                  styles.inputWrapper,
                  {
                    borderColor: focusedInput === 'password' ? '#00ff88' : '#2a2a3e',
                    backgroundColor: focusedInput === 'password' ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  }
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={24} 
                    color={focusedInput === 'password' ? "#00ff88" : "#8b9dc3"} 
                  />
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="#8b9dc3"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => handleInputFocus('password')}
                    onBlur={handleInputBlur}
                    secureTextEntry={secure}
                    style={styles.textInput}
                  />
                  <TouchableOpacity 
                    onPress={() => setSecure(!secure)}
                    style={styles.eyeButton}
                  >
                    <Ionicons 
                      name={secure ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color="#8b9dc3" 
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Remember Me */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={styles.rememberContainer}
                  onPress={() => {
                    setRemember(!remember);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Animated.View style={[
                    styles.checkbox,
                    {
                      backgroundColor: remember ? '#5b73ff' : 'transparent',
                      borderColor: remember ? '#5b73ff' : '#4a5568',
                    }
                  ]}>
                    {remember && <Ionicons name="checkmark" size={24} color="#ffffff" />}
                  </Animated.View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => Linking.openURL("https://example.com/forgot")}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error && (
                <Animated.View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={24} color="#ff0080" />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Sign In Button */}
              <TouchableOpacity 
                style={[
                  styles.signInButton,
                  loading && styles.signInButtonDisabled
                ]} 
                onPress={handleLogin} 
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? gradients.ctaDisabled : gradients.cta}
                  style={styles.signInGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <Animated.View style={{
                      transform: [{
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }}>
                      <ActivityIndicator color="#ffffff" size="small" />
                    </Animated.View>
                  ) : (
                    <>
                      <Ionicons name="rocket-outline" size={24} color="#ffffff" />
                      <Text style={styles.signInText}>Access Portal</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Footer */}
              <Text style={styles.footerText}>
                New to the system?{' '}
                <Text style={styles.linkText}>Create Account</Text>
              </Text>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scanLine: {
    position: 'absolute',
    width: width,
    height: 2,
    backgroundColor: 'rgba(0, 212, 255, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
      },
      web: {
        boxShadow: '0 0 10px rgba(0, 212, 255, 0.6)',
      },
    }),
    elevation: 5,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  particle1: {
    top: height * 0.1,
    left: width * 0.05,
    backgroundColor: '#00d4ff',
    ...Platform.select({
      ios: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
      },
      web: {
        boxShadow: '0 0 8px rgba(0, 212, 255, 0.8)',
      },
    }),
    elevation: 3,
  },
  particle2: {
    top: height * 0.2,
    right: width * 0.1,
    backgroundColor: '#5b73ff',
    ...Platform.select({
      ios: {
        shadowColor: '#5b73ff',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
      },
      web: {
        boxShadow: '0 0 8px rgba(91, 115, 255, 0.8)',
      },
    }),
    elevation: 3,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minHeight: height,
    paddingVertical: isTablet ? 40 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 35,
      },
      web: {
        boxShadow: '0 0 35px rgba(0, 212, 255, 0.2)',
      },
    }),
    elevation: 25,
  },
  logoGradient: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
      },
      web: {
        boxShadow: '0 15px 30px rgba(0, 212, 255, 0.6)',
      },
    }),
    elevation: 20,
  },
  blsInsideCircle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    ...Platform.select({
      ios: {
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 15,
      },
      web: {
        textShadow: '0 2px 15px rgba(0, 212, 255, 0.8)',
      },
    }),
  },
  appNameContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  appName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
    ...Platform.select({
      ios: {
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 25,
      },
      web: {
        textShadow: '0 3px 25px rgba(0, 212, 255, 0.6)',
      },
    }),
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 30 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
      },
      web: {
        boxShadow: '0 30px 40px rgba(0, 212, 255, 0.3)',
      },
    }),
    elevation: 25,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
    ...Platform.select({
      ios: {
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
      },
      web: {
        textShadow: '0 2px 10px rgba(0, 212, 255, 0.4)',
      },
    }),
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    minHeight: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 15,
      },
      web: {
        boxShadow: '0 8px 15px rgba(0, 212, 255, 0.3)',
      },
    }),
    elevation: 8,
  },
  textInput: {
    flex: 1, 
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 24,
    fontWeight: '600',
  },
  eyeButton: {
    padding: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 12 : 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4a5568',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#5b73ff',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      web: {
        boxShadow: '0 3px 8px rgba(91, 115, 255, 0.4)',
      },
    }),
    elevation: 5,
  },
  rememberText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 128, 0.3)',
  },
  errorText: { 
    color: '#ff0080',
    fontSize: 16,
    marginLeft: 24,
    flex: 1, 
    fontWeight: '600',
  },
  signInButton: {
    borderRadius: 24,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
      },
      web: {
        boxShadow: '0 15px 25px rgba(0, 212, 255, 0.5)',
      },
    }),
    elevation: 15,
    overflow: 'hidden',
  },
  signInButtonDisabled: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      web: {
        boxShadow: '0 15px 25px rgba(0, 212, 255, 0.1)',
      },
    }),
    elevation: 3,
  },
  signInGradient: {
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    minHeight: 24,
  },
  signInText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 24,
    letterSpacing: 1,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
    fontWeight: '500',
  },
  linkText: {
    color: '#00d4ff',
    fontWeight: '700',
  },
  suggestionsBox: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  suggestionName: {
    color: '#ffffff',
    fontWeight: '700'
  },
  suggestionEmail: {
    color: '#8b9dc3',
    fontSize: 12
  }
});
