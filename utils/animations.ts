import { Animated } from 'react-native';

// Animation creation helpers
export const createFadeAnimation = (initialValue: number = 0) => {
  return new Animated.Value(initialValue);
};

export const createSlideAnimation = (initialValue: number = 50) => {
  return new Animated.Value(initialValue);
};

export const createScaleAnimation = (initialValue: number = 0.9) => {
  return new Animated.Value(initialValue);
};

export const createPulseAnimation = (initialValue: number = 1) => {
  return new Animated.Value(initialValue);
};

export const createShimmerAnimation = (initialValue: number = 0) => {
  return new Animated.Value(initialValue);
};

// Common animation sequences
export const startFadeInAnimation = (fadeAnim: Animated.Value, duration: number = 1000) => {
  return Animated.timing(fadeAnim, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

export const startSlideInAnimation = (slideAnim: Animated.Value, duration: number = 800) => {
  return Animated.timing(slideAnim, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

export const startScaleAnimation = (scaleAnim: Animated.Value, duration: number = 600) => {
  return Animated.timing(scaleAnim, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

export const startPulseAnimation = (pulseAnim: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ])
  );
};

export const startShimmerAnimation = (shimmerAnim: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ])
  );
};

// Combined animation sequences
export const startEntranceAnimations = (
  fadeAnim: Animated.Value,
  slideAnim: Animated.Value,
  scaleAnim: Animated.Value
) => {
  return Animated.parallel([
    startFadeInAnimation(fadeAnim),
    startSlideInAnimation(slideAnim),
    startScaleAnimation(scaleAnim),
  ]);
};

export const startLoadingAnimations = (
  pulseAnim: Animated.Value,
  shimmerAnim: Animated.Value
) => {
  return Animated.parallel([
    startPulseAnimation(pulseAnim),
    startShimmerAnimation(shimmerAnim),
  ]);
};
