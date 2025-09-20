import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          gradient: ['#6366f1', '#4f46e5'],
          shadowColor: '#6366f1',
          textColor: '#ffffff',
        };
      case 'secondary':
        return {
          gradient: ['#6b7280', '#4b5563'],
          shadowColor: '#6b7280',
          textColor: '#ffffff',
        };
      case 'danger':
        return {
          gradient: ['#ef4444', '#dc2626'],
          shadowColor: '#ef4444',
          textColor: '#ffffff',
        };
      case 'success':
        return {
          gradient: ['#10b981', '#059669'],
          shadowColor: '#10b981',
          textColor: '#ffffff',
        };
      case 'warning':
        return {
          gradient: ['#f59e0b', '#d97706'],
          shadowColor: '#f59e0b',
          textColor: '#ffffff',
        };
      default:
        return {
          gradient: ['#6366f1', '#4f46e5'],
          shadowColor: '#6366f1',
          textColor: '#ffffff',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 16,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16,
          iconSize: 20,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          fontSize: 18,
          iconSize: 24,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          fontSize: 16,
          iconSize: 20,
        };
    }
  };

  const colors = getButtonColors();
  const sizeStyles = getSizeStyles();

  const buttonStyle = [
    styles.button,
    {
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: 12,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: disabled ? 0.1 : 0.3,
      shadowRadius: 8,
      elevation: disabled ? 2 : 6,
      opacity: disabled ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
    },
    style,
  ];

  const textStyleCombined = [
    styles.text,
    {
      fontSize: sizeStyles.fontSize,
      color: colors.textColor,
    },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#6b7280', '#4b5563'] : colors.gradient}
        style={styles.gradient}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={sizeStyles.iconSize}
            color={colors.textColor}
            style={styles.icon}
          />
        )}
        <Text style={textStyleCombined}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
