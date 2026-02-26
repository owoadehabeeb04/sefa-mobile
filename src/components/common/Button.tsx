/**
 * Button Component
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const baseStyles = 'rounded-xl items-center justify-center';
  const sizeStyles = {
    small: 'px-4 py-2',
    medium: 'px-6 py-3',
    large: 'px-8 py-4',
  };
  const textSizeStyles = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  // Get background and border colors based on variant
  const getBackgroundColor = () => {
    if (variant === 'primary') return colors.primary;
    if (variant === 'secondary') return colors.backgroundSecondary;
    return 'transparent';
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.primary;
    return undefined;
  };

  const getTextColor = () => {
    if (variant === 'primary') return '#FFFFFF';
    if (variant === 'secondary') return colors.text;
    return colors.primary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variant === 'outline' ? 'border-2' : ''}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50' : ''}
        ${className}
      `}
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : colors.primary}
          size="small"
        />
      ) : (
        <Text
          className={`
            font-semibold
            ${textSizeStyles[size]}
          `}
          style={{
            color: getTextColor(),
          }}
        >
          {children || title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
