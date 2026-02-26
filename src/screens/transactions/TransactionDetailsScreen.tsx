/**
 * Transaction Details Screen
 * Shows full details of an expense or income transaction
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Transaction } from '@/features/transactions/transaction.hooks';

interface TransactionDetailsScreenProps {
  transaction: Transaction;
}

export default function TransactionDetailsScreen({ transaction }: TransactionDetailsScreenProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isExpense = transaction.type === 'expense';
  const iconColor = transaction.category?.color || (isExpense ? colors.error : colors.success);

  const formatAmount = (value: number) => {
    return value.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const DetailRow = ({
    icon,
    label,
    value,
    valueColor,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    valueColor?: string;
  }) => (
    <View className="flex-row items-center py-4 border-b" style={{ borderBottomColor: colors.border }}>
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: colors.primaryBackground }}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-xs mb-1" style={{ color: colors.textTertiary }}>
          {label}
        </Text>
        <Text className="text-base font-semibold" style={{ color: valueColor || colors.text }}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>
          Transaction Details
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Amount Card */}
        <View
          className="p-6 rounded-2xl mb-6 items-center"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Ionicons
              name={(transaction.category?.icon as any) || (isExpense ? 'remove-circle' : 'add-circle')}
              size={32}
              color={iconColor}
            />
          </View>
          <Text className="text-3xl font-bold mb-2" style={{ color: isExpense ? colors.error : colors.success }}>
            {isExpense ? '-' : '+'}₦{formatAmount(transaction.amount)}
          </Text>
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {transaction.category?.name || 'Unknown Category'}
          </Text>
          <View
            className="px-3 py-1 rounded-full mt-2"
            style={{ backgroundColor: isExpense ? `${colors.error}15` : `${colors.success}15` }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: isExpense ? colors.error : colors.success }}
            >
              {isExpense ? 'Expense' : 'Income'}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View
          className="rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          {transaction.description && (
            <DetailRow
              icon="document-text-outline"
              label="Description"
              value={transaction.description}
            />
          )}

          {isExpense && (transaction as any).location && (
            <DetailRow
              icon="location-outline"
              label="Location"
              value={(transaction as any).location}
            />
          )}

          {!isExpense && (transaction as any).source && (
            <DetailRow
              icon="business-outline"
              label="Source"
              value={(transaction as any).source}
            />
          )}

          <DetailRow
            icon="calendar-outline"
            label="Date"
            value={formatDate(transaction.date)}
          />

          <DetailRow
            icon="time-outline"
            label="Time"
            value={formatTime(transaction.date)}
          />

          <DetailRow
            icon="card-outline"
            label="Payment Method"
            value={
              (transaction as any).paymentMethod
                ? String((transaction as any).paymentMethod)
                    .split('_')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                : 'Not specified'
            }
          />

          {(transaction as any).tags && Array.isArray((transaction as any).tags) && (transaction as any).tags.length > 0 && (
            <View className="py-4 border-b" style={{ borderBottomColor: colors.border }}>
              <View className="flex-row items-center mb-3 px-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primaryBackground }}
                >
                  <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
                </View>
                <Text className="text-xs" style={{ color: colors.textTertiary }}>
                  Tags
                </Text>
              </View>
              <View className="flex-row flex-wrap px-4">
                {(transaction as any).tags.map((tag: string, index: number) => (
                  <View
                    key={index}
                    className="px-3 py-1 rounded-full mr-2 mb-2"
                    style={{ backgroundColor: colors.primaryBackground }}
                  >
                    <Text className="text-sm" style={{ color: colors.primary }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(transaction as any).isRecurring && (
            <DetailRow
              icon="repeat-outline"
              label="Recurring"
              value={
                (transaction as any).recurringFrequency
                  ? String((transaction as any).recurringFrequency)
                      .split('_')
                      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')
                  : 'Yes'
              }
            />
          )}

          {(transaction as any).isPending && (
            <View className="py-4 px-4">
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.warning || '#F59E0B'}15` }}
                >
                  <Ionicons name="time-outline" size={20} color={colors.warning || '#F59E0B'} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textTertiary }}>
                    Status
                  </Text>
                  <View
                    className="px-3 py-1 rounded-full self-start"
                    style={{ backgroundColor: `${colors.warning || '#F59E0B'}15` }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.warning || '#F59E0B' }}
                    >
                      Pending / Upcoming
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Category Info */}
        {transaction.category && (
          <View
            className="p-5 rounded-2xl mb-6"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              Category Information
            </Text>
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${transaction.category.color}15` }}
              >
                <Ionicons
                  name={transaction.category.icon as any}
                  size={24}
                  color={transaction.category.color}
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {transaction.category.name}
                </Text>
                <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                  {transaction.category.type === 'expense' ? 'Expense Category' : 'Income Category'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View
          className="p-4 rounded-2xl"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-xs text-center" style={{ color: colors.textTertiary }}>
            Transaction ID: {transaction.id.slice(0, 8)}...
          </Text>
          {(transaction as any).createdAt && (
            <Text className="text-xs text-center mt-1" style={{ color: colors.textTertiary }}>
              Created: {new Date((transaction as any).createdAt).toLocaleString()}
            </Text>
          )}
          {(transaction as any).updatedAt && (transaction as any).updatedAt !== (transaction as any).createdAt && (
            <Text className="text-xs text-center mt-1" style={{ color: colors.textTertiary }}>
              Last updated: {new Date((transaction as any).updatedAt).toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
