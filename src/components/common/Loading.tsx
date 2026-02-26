/**
 * Loading Component
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  fullScreen = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const content = (
    <View className="items-center justify-center">
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          className="mt-4 text-base"
          style={{ color: colors.textSecondary }}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        {content}
      </View>
    );
  }

  return content;
};
