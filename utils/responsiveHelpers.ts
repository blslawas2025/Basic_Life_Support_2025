import { Dimensions, useWindowDimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive design helpers
export const isSmallScreen = width < 375;
export const isMediumScreen = width >= 375 && width < 768;
export const isLargeScreen = width >= 768;
export const isTablet = width >= 768 && height >= 1024;

export const getResponsiveSize = (small: number, medium: number, large: number): number => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

export const getResponsiveFontSize = (small: number, medium: number, large: number): number => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

export const getResponsivePadding = (): number => {
  if (isSmallScreen) return 16;
  if (isMediumScreen) return 20;
  if (isTablet) return 32;
  return 24;
};

export const getResponsiveColumnWidth = (small: number, medium: number, large: number): number => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

export const getResponsiveMargin = (small: number, medium: number, large: number): number => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

export const getResponsiveBorderRadius = (small: number, medium: number, large: number): number => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

// Screen dimensions
export const screenWidth = width;
export const screenHeight = height;

// Hook-based responsive utilities that update on orientation/resize
export const useResponsive = () => {
  const { width: w, height: h } = useWindowDimensions();

  const isSmallScreenCurrent = w < 480;
  const isMediumScreenCurrent = w >= 480 && w < 768;
  const isLargeScreenCurrent = w >= 768;
  const isTabletCurrent = w >= 768 && h >= 1024;
  const isDesktopCurrent = w >= 1024;

  const getResponsiveSizeCurrent = (small: number, medium: number, large: number): number => {
    if (isSmallScreenCurrent) return small;
    if (isMediumScreenCurrent) return medium;
    if (isDesktopCurrent) return Math.min(large, large * 0.9); // Slightly smaller for desktop
    return large;
  };

  const getResponsiveFontSizeCurrent = (small: number, medium: number, large: number): number => {
    if (isSmallScreenCurrent) return small;
    if (isMediumScreenCurrent) return medium;
    if (isDesktopCurrent) return Math.min(large, large * 0.9); // Slightly smaller for desktop
    return large;
  };

  const getResponsivePaddingCurrent = (): number => {
    if (isSmallScreenCurrent) return 16;
    if (isMediumScreenCurrent) return 20;
    if (isTabletCurrent) return 32;
    return 24;
  };

  const getResponsiveColumnWidthCurrent = (small: number, medium: number, large: number): number => {
    if (isSmallScreenCurrent) return small;
    if (isMediumScreenCurrent) return medium;
    return large;
  };

  const getResponsiveMarginCurrent = (small: number, medium: number, large: number): number => {
    if (isSmallScreenCurrent) return small;
    if (isMediumScreenCurrent) return medium;
    return large;
  };

  const getResponsiveBorderRadiusCurrent = (small: number, medium: number, large: number): number => {
    if (isSmallScreenCurrent) return small;
    if (isMediumScreenCurrent) return medium;
    return large;
  };

  return {
    width: w,
    height: h,
    isSmallScreen: isSmallScreenCurrent,
    isMediumScreen: isMediumScreenCurrent,
    isLargeScreen: isLargeScreenCurrent,
    isTablet: isTabletCurrent,
    isDesktop: isDesktopCurrent,
    getResponsiveSize: getResponsiveSizeCurrent,
    getResponsiveFontSize: getResponsiveFontSizeCurrent,
    getResponsivePadding: getResponsivePaddingCurrent,
    getResponsiveColumnWidth: getResponsiveColumnWidthCurrent,
    getResponsiveMargin: getResponsiveMarginCurrent,
    getResponsiveBorderRadius: getResponsiveBorderRadiusCurrent,
  };
};
