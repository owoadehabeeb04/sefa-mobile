import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import type { BankConnection } from '@/features/bank/bankConnection.types';

interface BankConnectionCardProps {
  connection: BankConnection;
  onSync?: () => void;
  onToggleAutoSync?: (enabled: boolean) => void;
  onDisconnect?: () => void;
  onViewDetails?: () => void;
  isSyncing?: boolean;
  isUpdating?: boolean;
}

const getCurrencySymbol = (currency?: string) => {
  switch (currency) {
    case 'NGN':
      return '₦';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return currency ? `${currency} ` : '₦';
  }
};

const formatRelativeTime = (value: string) => {
  const now = Date.now();
  const date = new Date(value).getTime();
  const diff = Math.max(0, now - date);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
};

const getStatusStyle = (status?: string, lastSyncAt?: string) => {
  const colors = Colors.light;

  if (status === 'error' && !lastSyncAt) {
    return { label: 'Pending Sync', color: colors.warning };
  }

  switch (status) {
    case 'syncing':
      return { label: 'Syncing', color: colors.primary };
    case 'active':
      return { label: 'Active', color: colors.success };
    case 'error':
      return { label: 'Error', color: colors.error };
    case 'paused':
      return { label: 'Paused', color: colors.warning };
    case 'disconnected':
      return { label: 'Disconnected', color: colors.textTertiary };
    case 'reauth_required':
      return { label: 'Reauth Required', color: colors.warning };
    default:
      return { label: 'Unknown', color: colors.textTertiary };
  }
};

export const BankConnectionCard: React.FC<BankConnectionCardProps> = ({
  connection,
  onSync,
  onToggleAutoSync,
  onDisconnect,
  onViewDetails,
  isSyncing,
  isUpdating,
}) => {
  const colors = Colors.light;
  const status = getStatusStyle(connection.syncStatus, connection.lastSyncAt);
  const lastSync = connection.lastSyncAt
    ? formatRelativeTime(connection.lastSyncAt)
    : 'Never';
  const currencySymbol = getCurrencySymbol(connection.currency);
  const balance = `${currencySymbol}${(connection.balance ?? 0).toLocaleString()}`;
  const accountNumber = connection.maskedAccountNumber || connection.accountNumber || 'N/A';
  const accountTail = accountNumber && accountNumber !== 'N/A' ? accountNumber.slice(-4) : '';
  const institutionLabel =
    connection.institutionName && connection.institutionName !== 'Unknown Bank'
      ? connection.institutionName
      : connection.accountName?.trim() || (accountTail ? `Account ••••${accountTail}` : 'Linked Account');
  const syncLabel = lastSync === 'Never' ? 'Pending first sync' : lastSync;

  return (
    <View className="p-4 rounded-2xl mb-3" style={{ backgroundColor: colors.backgroundSecondary }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <Ionicons name="business-outline" size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {institutionLabel}
            </Text>
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              {accountNumber}
              {connection.accountType ? ` • ${connection.accountType}` : ''}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {balance}
          </Text>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: status.color }} />
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-xs" style={{ color: colors.textTertiary }}>
          Last synced: {syncLabel}
        </Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            className="px-3 py-1 rounded-full mr-2"
            style={{ backgroundColor: colors.background }}
            onPress={onViewDetails}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.primaryBackground }}
            onPress={onSync}
            disabled={isSyncing}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
          <Text className="text-sm mr-2" style={{ color: colors.textSecondary }}>
            Auto-sync
          </Text>
          <Switch
            value={connection.autoSync ?? true}
            onValueChange={onToggleAutoSync}
            disabled={isUpdating}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        <TouchableOpacity onPress={onDisconnect} disabled={isUpdating}>
          <Text className="text-xs font-semibold" style={{ color: colors.error }}>
            Disconnect
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
