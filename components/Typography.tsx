import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'button';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white' | 'gray';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
}

export default function Typography({
  children,
  variant = 'body1',
  color = 'white',
  weight = 'normal',
  align = 'left',
  style,
}: TypographyProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: 32,
          lineHeight: 40,
          fontWeight: '800',
        };
      case 'h2':
        return {
          fontSize: 28,
          lineHeight: 36,
          fontWeight: '700',
        };
      case 'h3':
        return {
          fontSize: 24,
          lineHeight: 32,
          fontWeight: '700',
        };
      case 'h4':
        return {
          fontSize: 20,
          lineHeight: 28,
          fontWeight: '600',
        };
      case 'h5':
        return {
          fontSize: 18,
          lineHeight: 24,
          fontWeight: '600',
        };
      case 'h6':
        return {
          fontSize: 16,
          lineHeight: 22,
          fontWeight: '600',
        };
      case 'body1':
        return {
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '400',
        };
      case 'body2':
        return {
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '400',
        };
      case 'caption':
        return {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '400',
        };
      case 'button':
        return {
          fontSize: 16,
          lineHeight: 20,
          fontWeight: '600',
        };
      default:
        return {
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '400',
        };
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'primary':
        return '#6366f1';
      case 'secondary':
        return '#6b7280';
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'white':
        return '#ffffff';
      case 'gray':
        return '#a0a0a0';
      default:
        return '#ffffff';
    }
  };

  const getWeightStyles = () => {
    switch (weight) {
      case 'light':
        return '300';
      case 'normal':
        return '400';
      case 'medium':
        return '500';
      case 'semibold':
        return '600';
      case 'bold':
        return '700';
      case 'extrabold':
        return '800';
      default:
        return '400';
    }
  };

  const variantStyles = getVariantStyles();
  const colorValue = getColorStyles();
  const weightValue = getWeightStyles();

  const combinedStyle = [
    styles.base,
    {
      fontSize: variantStyles.fontSize,
      lineHeight: variantStyles.lineHeight,
      fontWeight: weightValue,
      color: colorValue,
      textAlign: align,
    },
    style,
  ];

  return <Text style={combinedStyle}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
});
