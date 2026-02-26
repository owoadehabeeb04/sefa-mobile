/**
 * Bank Connections Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Toast } from '@/components/common/Toast';
import { MonoConnectWidget } from '@/components/bank/MonoConnectWidget';
import { BankConnectionCard } from '@/components/bank/BankConnectionCard';
import {
  useBankConnections,
  useConnectBank,
  useDisconnectBank,
  useSyncConnection,
  useUpdateConnectionSettings,
} from '@/features/bank/bankConnection.hooks';
import { useAuthStore } from '@/store/auth.store';
import type { BankConnection } from '@/features/bank/bankConnection.types';

export default function BankConnectionsScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: connections, isLoading, refetch, isRefetching } = useBankConnections();
  const connectBank = useConnectBank();
  const syncConnection = useSyncConnection();
  const disconnectBank = useDisconnectBank();
  const updateSettings = useUpdateConnectionSettings();

  const [showMono, setShowMono] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleMonoSuccess = async (code: string) => {
    setShowMono(false);
    try {
      await connectBank.mutateAsync(code);
      setToastMessage('Bank connected successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to connect bank');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleSync = async (connection: BankConnection) => {
    try {
      await syncConnection.mutateAsync(connection.id);
      setToastMessage('Sync started');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to sync connection');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDisconnect = (connection: BankConnection) => {
    Alert.alert(
      'Disconnect Bank',
      `Disconnect ${connection.institutionName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectBank.mutateAsync(connection.id);
              setToastMessage('Bank disconnected');
              setToastType('success');
              setShowToast(true);
            } catch (error: any) {
              setToastMessage(error?.message || 'Failed to disconnect');
              setToastType('error');
              setShowToast(true);
            }
          },
        },
      ]
    );
  };

  const handleToggleAutoSync = async (connection: BankConnection, enabled: boolean) => {
    try {
      await updateSettings.mutateAsync({ connectionId: connection.id, autoSync: enabled });
      setToastMessage('Auto-sync updated');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to update settings');
      setToastType('error');
      setShowToast(true);
    }
  };

  const isSyncingConnection = (connectionId: string) =>
    syncConnection.isPending && syncConnection.variables === connectionId;

  const isUpdatingConnection = (connectionId: string) =>
    updateSettings.isPending && updateSettings.variables?.connectionId === connectionId;

  const hasConnections = (connections ?? []).length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        className="flex-row items-center px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>
          Bank Connections
        </Text>
        <TouchableOpacity
          onPress={() => setShowMono(true)}
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-xs font-semibold" style={{ color: colors.textInverse }}>
            Connect
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View className="mb-4">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Link your bank accounts to sync transactions automatically.
          </Text>
        </View>

        {isLoading && (
          <View className="py-10 items-center">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
              Loading connections...
            </Text>
          </View>
        )}

        {!isLoading && !hasConnections && (
          <View className="items-center py-10">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.primaryBackground }}
            >
              <Ionicons name="link-outline" size={28} color={colors.primary} />
            </View>
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              No bank connections
            </Text>
            <Text className="text-sm mt-1 text-center" style={{ color: colors.textSecondary }}>
              Connect your bank to start syncing transactions.
            </Text>
            <TouchableOpacity
              onPress={() => setShowMono(true)}
              className="mt-4 px-5 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.textInverse }}>
                Connect New Bank
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {hasConnections && (
          <View>
            {(connections ?? []).map((connection) => (
              <BankConnectionCard
                key={connection.id}
                connection={connection}
                onSync={() => handleSync(connection)}
                onToggleAutoSync={(enabled) => handleToggleAutoSync(connection, enabled)}
                onDisconnect={() => handleDisconnect(connection)}
                isSyncing={isSyncingConnection(connection.id)}
                isUpdating={isUpdatingConnection(connection.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <MonoConnectWidget
        visible={showMono}
        onSuccess={handleMonoSuccess}
        onClose={() => setShowMono(false)}
        customer={{
          id: user?.id || 'unknown',
          email: user?.email,
          name: user?.name,
        }}
      />

      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        type={toastType}
      />
    </SafeAreaView>
  );
}
