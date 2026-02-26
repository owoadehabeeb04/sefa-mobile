/**
 * Dashboard Loading Skeleton
 */

import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton, SkeletonCard } from '@/components/common/Skeleton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const DashboardSkeleton: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Skeleton */}
      <View style={{ marginBottom: 24 }}>
        <Skeleton height={28} width={150} style={{ marginBottom: 8 }} />
        <Skeleton height={16} width={200} />
      </View>

      {/* Summary Cards Skeleton */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, minWidth: '45%' }}>
          <SkeletonCard />
        </View>
        <View style={{ flex: 1, minWidth: '45%' }}>
          <SkeletonCard />
        </View>
        <View style={{ flex: 1, minWidth: '45%' }}>
          <SkeletonCard />
        </View>
        <View style={{ flex: 1, minWidth: '45%' }}>
          <SkeletonCard />
        </View>
      </View>

      {/* Chart Skeleton */}
      <View
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <Skeleton height={20} width={150} style={{ marginBottom: 16 }} />
        <Skeleton height={200} style={{ marginBottom: 12 }} />
      </View>

      {/* AI Insight Skeleton */}
      <View
        style={{
          backgroundColor: colors.primaryBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <Skeleton height={16} width="90%" style={{ marginBottom: 8 }} />
        <Skeleton height={16} width="70%" />
      </View>

      {/* Transactions Skeleton */}
      <View style={{ marginBottom: 12 }}>
        <Skeleton height={24} width={150} style={{ marginBottom: 16 }} />
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Skeleton height={16} width="60%" style={{ marginBottom: 6 }} />
              <Skeleton height={14} width="40%" />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Skeleton height={18} width={80} style={{ marginBottom: 4 }} />
              <Skeleton height={12} width={60} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
