/**
 * Input Component - Enhanced with better styling
 */

import React from 'react';
import { TextInput, Text, View, TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  optional?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerClassName = '',
  optional = false,
  ...props
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <View className="flex-row items-center mb-2">
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.text }}
          >
            {label}
          </Text>
          {optional && (
            <Text
              className="text-xs ml-2"
              style={{ color: colors.textTertiary }}
            >
              (Optional)
            </Text>
          )}
        </View>
      )}
      <View
        className="flex-row items-center rounded-xl border"
        style={{
          borderColor: error ? colors.error : colors.border,
          backgroundColor: '#F9FAFB', // Light gray background like reference
          height: 52,
          paddingHorizontal: 16,
        }}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1"
          placeholderTextColor="#9CA3AF"
          style={{
            color: colors.text,
            fontSize: 15,
            lineHeight: 20,
            paddingVertical: 0,
          }}
          {...props}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && (
        <Text
          className="text-sm mt-1.5"
          style={{ color: colors.error }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
