/**
 * Swipeable Transaction Item
 * Supports swipe left to delete, swipe right to edit
 * Following industry standard: Swipe left = Delete, Swipe right = Edit
 */

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Transaction } from '@/features/transactions/transaction.hooks';

interface SwipeableTransactionItemProps {
  transaction: Transaction;
  isExpense: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onPress?: (transaction: Transaction) => void;
}

const SwipeableTransactionItemInner: React.FC<SwipeableTransactionItemProps> = ({
  transaction,
  isExpense,
  onEdit,
  onDelete,
  onPress,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const swipeableRef = useRef<Swipeable>(null);

  const formatAmount = (value: number) => {
    return value.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const iconColor = transaction.category?.color || (isExpense ? colors.error : colors.success);

  // Render left action (Edit - swipe right to reveal)
  // Industry standard: Swipe right = Edit (safe, reversible action)
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.leftAction, { backgroundColor: colors.primary }]}>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingLeft: 20,
            transform: [{ translateX }],
            opacity,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              swipeableRef.current?.close();
              setTimeout(() => onEdit(transaction), 100);
            }}
            activeOpacity={0.8}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Render right action (Delete - swipe left to reveal)
  // Industry standard: Swipe left = Delete (destructive action)
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.rightAction, { backgroundColor: colors.error }]}>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'flex-end',
            paddingRight: 20,
            transform: [{ translateX }],
            opacity,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              swipeableRef.current?.close();
              // Small delay to ensure smooth close animation
              setTimeout(() => {
                onDelete(transaction);
              }, 100);
            }}
            activeOpacity={0.8}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={60}
      rightThreshold={60}
      friction={1.5}
      overshootLeft={false}
      overshootRight={false}
      enableTrackpadTwoFingerGesture
    >
      <TouchableOpacity
        onPress={onPress ? () => onPress(transaction) : undefined}
        activeOpacity={0.7}
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Ionicons
            name={(transaction.category?.icon as any) || (isExpense ? 'remove-circle' : 'add-circle')}
            size={20}
            color={iconColor}
          />
        </View>

        <View className="flex-1">
          <Text
            className="text-sm font-semibold mb-0.5"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {transaction.category?.name || 'Unknown'}
          </Text>
          {transaction.description && (
            <Text
              className="text-xs"
              style={{ color: colors.textTertiary }}
              numberOfLines={1}
            >
              {transaction.description}
            </Text>
          )}
        </View>

        <View className="items-end">
          <Text
            className="text-sm font-bold"
            style={{
              color: isExpense ? colors.error : colors.success,
            }}
          >
            {isExpense ? '-' : '+'}₦{formatAmount(transaction.amount)}
          </Text>
          <Text
            className="text-xs mt-0.5"
            style={{ color: colors.textTertiary }}
          >
            {formatDate(transaction.date)}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export const SwipeableTransactionItem = React.memo(SwipeableTransactionItemInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftAction: {
    flex: 1,
    justifyContent: 'center',
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
