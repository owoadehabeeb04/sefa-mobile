import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

import { Colors } from '@/constants/theme';
import type { AssistantMessage } from '@/features/assistant/assistant.types';

function TypingDots({ color }: { color: string }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay((dots.length - i - 1) * 160),
        ]),
      ),
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: color,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}

const actionBtn = (colors: typeof Colors.light) => ({
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  width: 26,
  height: 26,
  borderRadius: 13,
  backgroundColor: colors.backgroundSecondary,
});

type Props = {
  colors: typeof Colors.light;
  formatTime: (value?: string | null) => string;
  isBusy?: boolean;
  message: AssistantMessage;
  onCancel: (message: AssistantMessage) => void;
  onCopy: (message: AssistantMessage) => void;
  onEdit: (message: AssistantMessage) => void;
  onRegenerate: (message: AssistantMessage) => void;
  onRetry: (message: AssistantMessage) => void;
};

export function AssistantMessageBubble({
  colors,
  formatTime,
  isBusy = false,
  message,
  onCancel,
  onCopy,
  onEdit,
  onRegenerate,
  onRetry,
}: Props) {
  const isUser = message.role === 'user';
  const isActive = ['queued', 'generating', 'streaming'].includes(message.status);
  const hasFailed = message.status === 'failed';
  const sources = message.sources || [];
  const canShowSources = !isUser && message.status === 'completed' && sources.length > 0;

  const userBubble = isUser;
  const bubbleBg = userBubble ? colors.primary : colors.backgroundSecondary;
  const textColor = userBubble ? colors.textInverse : colors.text;

  const markdownStyles = useMemo(() => ({
    body: { color: textColor, fontSize: 15, lineHeight: 24, marginTop: 0, marginBottom: 0 },
    paragraph: { color: textColor, marginTop: 0, marginBottom: 10, lineHeight: 24 },
    heading1: { color: textColor, fontSize: 20, fontWeight: '700' as const, marginBottom: 10 },
    heading2: { color: textColor, fontSize: 17, fontWeight: '700' as const, marginBottom: 8 },
    heading3: { color: textColor, fontSize: 15, fontWeight: '700' as const, marginBottom: 6 },
    bullet_list: { marginBottom: 10 },
    ordered_list: { marginBottom: 10 },
    list_item: { color: textColor, marginBottom: 4 },
    bullet_list_icon: { color: textColor, marginRight: 6 },
    ordered_list_icon: { color: textColor, marginRight: 6 },
    strong: { color: textColor, fontWeight: '700' as const },
    em: { color: textColor, fontStyle: 'italic' as const },
    link: { color: isUser ? colors.textInverse : colors.primary, textDecorationLine: 'underline' as const },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: isUser ? 'rgba(255,255,255,0.4)' : colors.primaryLight,
      paddingLeft: 10,
    },
    code_inline: {
      color: textColor,
      backgroundColor: isUser ? 'rgba(255,255,255,0.18)' : colors.backgroundTertiary,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    fence: {
      color: textColor,
      backgroundColor: isUser ? 'rgba(255,255,255,0.12)' : colors.backgroundTertiary,
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
    },
    code_block: {
      color: textColor,
      backgroundColor: isUser ? 'rgba(255,255,255,0.12)' : colors.backgroundTertiary,
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
    },
  }), [colors, isUser, textColor]);

  return (
    <View style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
      {/* Bubble */}
      <View
        style={{
          backgroundColor: bubbleBg,
          borderRadius: 20,
          borderTopRightRadius: isUser ? 4 : 20,
          borderTopLeftRadius: isUser ? 20 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        {isActive && !message.content ? (
          <TypingDots color={colors.textTertiary} />
        ) : (
          <>
            <Markdown style={markdownStyles}>
              {message.content || (hasFailed ? 'SEFA could not complete this response.' : '')}
            </Markdown>

            {canShowSources ? (
              <View style={{ marginTop: 6, gap: 6 }}>
                <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Sources
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {sources.map((source) => (
                    <Pressable
                      key={`${message.id}-${source.url}`}
                      onPress={() => Linking.openURL(source.url)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 9,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Ionicons name="globe-outline" size={12} color={colors.primary} />
                      <Text numberOfLines={1} style={{ color: colors.text, fontSize: 12, fontWeight: '500', maxWidth: 110 }}>
                        {source.sourceName}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Action row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginTop: 4,
          paddingHorizontal: 2,
          gap: 6,
        }}
      >
        {!!message.content && (
          <Pressable disabled={isBusy} onPress={() => onCopy(message)} style={actionBtn(colors)}>
            <Ionicons name="copy-outline" size={13} color={colors.textSecondary} />
          </Pressable>
        )}

        {isUser ? (
          <Pressable disabled={isBusy} onPress={() => onEdit(message)} style={actionBtn(colors)}>
            <Ionicons name="create-outline" size={13} color={colors.textSecondary} />
          </Pressable>
        ) : null}

        {message.role === 'assistant' && hasFailed ? (
          <Pressable disabled={isBusy} onPress={() => onRetry(message)} style={actionBtn(colors)}>
            <Ionicons name="refresh-outline" size={13} color={colors.textSecondary} />
          </Pressable>
        ) : null}

        {message.role === 'assistant' && ['completed', 'cancelled', 'superseded'].includes(message.status) ? (
          <Pressable disabled={isBusy} onPress={() => onRegenerate(message)} style={actionBtn(colors)}>
            <Ionicons name="sparkles-outline" size={13} color={colors.textSecondary} />
          </Pressable>
        ) : null}

        {message.role === 'assistant' && isActive ? (
          <Pressable disabled={isBusy} onPress={() => onCancel(message)} style={actionBtn(colors)}>
            <Ionicons name="stop-circle-outline" size={13} color={colors.textSecondary} />
          </Pressable>
        ) : null}

        <Text style={{ color: colors.textTertiary, fontSize: 11, marginLeft: 2 }}>
          {formatTime(message.completedAt || message.updatedAt || message.createdAt)}
        </Text>
        {message.isEdited ? (
          <Text style={{ color: colors.textTertiary, fontSize: 11 }}>edited</Text>
        ) : null}
        {hasFailed ? (
          <Text style={{ color: colors.error, fontSize: 11 }}>failed</Text>
        ) : null}
      </View>
    </View>
  );
}
