/**
 * Insights Screen
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function InsightsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Insights
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            AI-powered financial analysis
          </Text>
        </View>

        {/* Empty State */}
        <View className="flex-1 items-center justify-center py-20">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <Ionicons name="bulb-outline" size={48} color={colors.primary} />
          </View>
          <Text className="text-xl font-bold mb-2" style={{ color: colors.text }}>
            Smart Insights
          </Text>
          <Text
            className="text-base text-center px-8"
            style={{ color: colors.textSecondary }}
          >
            Add transactions to see personalized insights and spending patterns
          </Text>

          {/* Feature List */}
          <View className="mt-8 w-full max-w-sm">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              What you'll see here:
            </Text>
            <View className="gap-2">
              {[
                'AI spending analysis',
                'Monthly trends & comparisons',
                'Budget forecasts',
                'Category breakdowns',
                'Saving recommendations',
                'Spending alerts',
              ].map((feature, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name="analytics" size={18} color={colors.primary} />
                  <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
