/**
 * AI Insight Card - detailed multi-paragraph finance coach insight (scrollable)
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AIInsightCardProps {
  insight: string;
  maxHeight?: number;
}

const PREVIEW_CHARS = 220;

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  insight,
  maxHeight = 280,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [expanded, setExpanded] = useState(false);

  if (!insight) return null;

  const needsExpand = insight.length > PREVIEW_CHARS;
  const preview = needsExpand ? insight.slice(0, PREVIEW_CHARS).trim() + '...' : insight;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  };

  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.primaryBackground,
        borderWidth: 1,
        borderColor: `${colors.primary}20`,
      }}
    >
      <View className="flex-row items-center p-4 pb-2">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <Ionicons name="bulb" size={16} color={colors.primary} />
        </View>
        <Text className="text-xs font-semibold flex-1" style={{ color: colors.primary }}>
          AI finance coach
        </Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {expanded ? (
          <ScrollView
            nestedScrollEnabled
            style={{ maxHeight }}
            showsVerticalScrollIndicator
          >
            <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
              {insight}
            </Text>
          </ScrollView>
        ) : (
          <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
            {preview}
          </Text>
        )}
        {needsExpand && (
          <TouchableOpacity
            onPress={toggleExpand}
            className="mt-2 flex-row items-center"
            activeOpacity={0.7}
          >
            <Text className="text-sm font-medium mr-1" style={{ color: colors.primary }}>
              {expanded ? 'Show less' : 'Read more'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
