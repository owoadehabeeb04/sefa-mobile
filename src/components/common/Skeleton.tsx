/**
 * Professional Skeleton Loader Component
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.backgroundTertiary,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Preset skeletons for common use cases
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 1 }) => {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 && lines > 1 ? '80%' : '100%'}
          style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
};

export const SkeletonCard: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Skeleton height={20} width={120} style={{ marginBottom: 12 }} />
      <Skeleton height={32} width={180} style={{ marginBottom: 8 }} />
      <Skeleton height={14} width={100} />
    </View>
  );
};

export const SkeletonCircle: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
};
