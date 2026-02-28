/**
 * Import Details Screen
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { useImportJob, useUndoImport } from '@/features/import/import.hooks';

const colors = Colors.light;

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function ImportDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: job, isLoading, refetch } = useImportJob(id || '');
  const undoImport = useUndoImport();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const canUndo = useMemo(() => {
    if (!job) return false;
    if (job.status !== 'completed' || job.isUndone) return false;
    if (!job.retentionExpiresAt) return true;
    return new Date() < new Date(job.retentionExpiresAt);
  }, [job]);

  useEffect(() => {
    if (!job) return;
    const isActive = job.status === 'pending' || job.status === 'processing';
    if (!isActive) return;

    const intervalId = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [job, refetch]);

  const handleUndo = () => {
    if (!job) return;
    Alert.alert('Undo Import', 'This will remove all imported transactions from this job.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo Import',
        style: 'destructive',
        onPress: async () => {
          try {
            await undoImport.mutateAsync(job.id);
            setToastMessage('Import undone successfully');
            setToastType('success');
            setShowToast(true);
          } catch (error: any) {
            setToastMessage(error?.message || 'Failed to undo import');
            setToastType('error');
            setShowToast(true);
          }
        },
      },
    ]);
  };

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
          Import Details
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
        {isLoading && (
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Loading import details...
          </Text>
        )}

        {job && (
          <>
            <View
              className="p-5 rounded-2xl mb-4"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {job.fileName || 'Bank Import'}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                Status: {job.status}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                Started: {formatDateTime(job.createdAt)}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                Completed: {formatDateTime(job.completedAt)}
              </Text>
            </View>

            <View
              className="p-5 rounded-2xl mb-4"
              style={{ backgroundColor: colors.primaryBackground }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Import Summary
              </Text>
              <View className="mt-3">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  Total Transactions: {job.totalTransactions ?? 0}
                </Text>
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Imported: {job.importedCount ?? 0}
                </Text>
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Duplicates: {job.duplicateCount ?? 0}
                </Text>
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Errors: {job.errorCount ?? 0}
                </Text>
              </View>
            </View>

            {job.errors && job.errors.length > 0 && (
              <View
                className="p-5 rounded-2xl mb-4"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Errors
                </Text>
                {job.errors.map((err, index) => (
                  <Text key={index} className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                    • {err}
                  </Text>
                ))}
              </View>
            )}

            {canUndo && (
              <Button
                title={undoImport.isPending ? 'Undoing...' : 'Undo Import'}
                onPress={handleUndo}
                loading={undoImport.isPending}
                variant="secondary"
              />
            )}
          </>
        )}
      </ScrollView>

      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        type={toastType}
      />
    </SafeAreaView>
  );
}
