/**
 * Bank Connections Screen
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { Toast } from '@/components/common/Toast';
import { MonoConnectWidget } from '@/components/bank/MonoConnectWidget';
import { BankConnectionCard } from '@/components/bank/BankConnectionCard';
import {
  BANK_CONNECTIONS_QUERY_KEY,
  isConnectionSyncActive,
  useBankConnections,
  useConnectBank,
  useDisconnectBank,
  useSyncConnection,
  useUpdateConnectionSettings,
} from '@/features/bank/bankConnection.hooks';
import { useAuthStore } from '@/store/auth.store';
import { useSensitiveActionSecurity } from '@/features/security/useSensitiveActionSecurity';
import type { BankConnection } from '@/features/bank/bankConnection.types';
import { AnimatedListItem, AnimatedScreenSection, FadeUp } from '@/src/components/motion';

export default function BankConnectionsScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { requireVerification } = useSensitiveActionSecurity();

  const { data: connections, isLoading, refetch, isRefetching } = useBankConnections();
  const connectBank = useConnectBank();
  const syncConnection = useSyncConnection();
  const disconnectBank = useDisconnectBank();
  const updateSettings = useUpdateConnectionSettings();

  const [showMono, setShowMono] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [pendingMonoConnectionId, setPendingMonoConnectionId] = useState<string | null>(null);
  const [isReturningFromMono, setIsReturningFromMono] = useState(false);

  const hasPendingMonoConnection = useMemo(
    () =>
      Boolean(
        pendingMonoConnectionId &&
          (connections ?? []).some((c) => c.id === pendingMonoConnectionId),
      ),
    [connections, pendingMonoConnectionId],
  );

  useEffect(() => {
    if (!hasPendingMonoConnection) return;
    setIsReturningFromMono(false);
    setPendingMonoConnectionId(null);
  }, [hasPendingMonoConnection]);

  useEffect(() => {
    if (!isReturningFromMono || !pendingMonoConnectionId) return;
    const timeout = setTimeout(() => {
      setIsReturningFromMono(false);
      setPendingMonoConnectionId(null);
    }, 15000);
    return () => clearTimeout(timeout);
  }, [isReturningFromMono, pendingMonoConnectionId]);

  const openMonoWidget = () => {
    if (!user?.id) {
      setToastMessage('Unable to connect bank right now. Please log out and back in.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    const monoPublicKey = (process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY || '').trim();
    if (!monoPublicKey) {
      setToastMessage('Mono key missing. Add EXPO_PUBLIC_MONO_PUBLIC_KEY and restart Expo.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    requireVerification('connect_bank').then((allowed) => {
      if (!allowed) return;
      Alert.alert(
        'Read-only connection',
        'SEFA reads your transactions for budgeting. It cannot transfer or move money.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => setShowMono(true) },
        ],
      );
    });
  };

  const handleMonoSuccess = async (code: string) => {
    setShowMono(false);
    setIsReturningFromMono(true);
    try {
      const connection = await connectBank.mutateAsync(code);
      setPendingMonoConnectionId(connection.id);
      queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY });
      await refetch();
      setToastMessage('Bank connected. Sync queued in the background.');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setIsReturningFromMono(false);
      setPendingMonoConnectionId(null);
      setToastMessage(error?.message || 'Failed to connect bank');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleSync = async (connection: BankConnection) => {
    try {
      const response = await syncConnection.mutateAsync(connection.id);
      await refetch();
      setToastMessage(
        response?.data?.status === 'syncing'
          ? 'Already syncing in the background.'
          : (response?.message || 'Sync queued.'),
      );
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      const message = String(error?.message || '');
      const isAlreadySyncing =
        message.includes('409') || message.toLowerCase().includes('already in progress');
      setToastMessage(
        isAlreadySyncing
          ? 'Already syncing in the background.'
          : (error?.message || 'Failed to sync'),
      );
      setToastType(isAlreadySyncing ? 'success' : 'error');
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
            const allowed = await requireVerification('disconnect_bank');
            if (!allowed) return;
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
    (syncConnection.isPending && syncConnection.variables === connectionId) ||
    (connections ?? []).some(
      (c) => c.id === connectionId && isConnectionSyncActive(c),
    );

  const isUpdatingConnection = (connectionId: string) =>
    updateSettings.isPending && updateSettings.variables?.connectionId === connectionId;

  const hasConnections = (connections ?? []).length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <FadeUp
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 2 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
          Bank Connections
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/settings/sync-history')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.backgroundSecondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openMonoWidget}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </FadeUp>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Info strip */}
        <AnimatedScreenSection
          index={0}
          style={{
            backgroundColor: colors.primaryBackground,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
          <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
            Read-only access. SEFA cannot transfer or move your money.
          </Text>
        </AnimatedScreenSection>

        {isLoading && (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {!isLoading && !hasConnections && (
          <AnimatedScreenSection index={1} style={{ alignItems: 'center', paddingVertical: 48 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primaryBackground,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="link-outline" size={28} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
              No bank connections
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', maxWidth: 240, marginBottom: 20 }}>
              Connect your bank to automatically sync transactions.
            </Text>
            <TouchableOpacity
              onPress={openMonoWidget}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 11,
                borderRadius: 999,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                Connect Bank
              </Text>
            </TouchableOpacity>
          </AnimatedScreenSection>
        )}

        {hasConnections && (
          <AnimatedScreenSection index={1}>
            {(connections ?? []).map((connection, index) => (
              <AnimatedListItem
                key={connection.id}
                index={index}
                total={connections?.length ?? 0}
                group="xs"
              >
                <BankConnectionCard
                  connection={connection}
                  onSync={() => handleSync(connection)}
                  onToggleAutoSync={(enabled) => handleToggleAutoSync(connection, enabled)}
                  onDisconnect={() => handleDisconnect(connection)}
                  onViewDetails={() =>
                    router.push({
                      pathname: '/settings/sync-details/[id]',
                      params: { id: connection.id, kind: 'connection' },
                    })
                  }
                  isSyncing={isSyncingConnection(connection.id)}
                  isUpdating={isUpdatingConnection(connection.id)}
                />
              </AnimatedListItem>
            ))}
          </AnimatedScreenSection>
        )}
      </ScrollView>

      {isReturningFromMono && (
        <View
          pointerEvents="auto"
          style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0, left: 0,
            backgroundColor: 'rgba(255,255,255,0.88)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              borderRadius: 24,
              paddingHorizontal: 28,
              paddingVertical: 28,
              alignItems: 'center',
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 16 }}>
              Syncing your bank
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
              Pulling your account data into SEFA.
            </Text>
          </View>
        </View>
      )}

      <MonoConnectWidget
        visible={showMono}
        onSuccess={handleMonoSuccess}
        onClose={() => setShowMono(false)}
        customer={{ id: user?.id || '', email: user?.email, name: user?.name }}
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
