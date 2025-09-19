import { useMemo } from 'react';
import { useResponsive } from './responsiveHelpers';
import { AccessibilityInfo } from 'react-native';

export const useContainerMaxWidth = () => {
	const { width, isTablet } = useResponsive();
	return useMemo(() => (isTablet ? Math.min(1100, width * 0.92) : undefined), [width, isTablet]);
};

export const useReducedMotion = () => {
	// Simple hook placeholder; can be extended to read OS reduce motion if exposed
	// For now, return false; screens can later wire a setting or platform flag
	return false;
};
