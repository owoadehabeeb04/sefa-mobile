/**
 * Import History Screen
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useImportJobs } from '@/features/import/import.hooks';
import type { ImportJob } from '@/features/import/import.types';

const colors = Colors.light;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return colors.success;
    case 'processing':
      return colors.info;
    case 'failed':
      return colors.error;
    case 'undone':
      return colors.textTertiary;
    default:
      return colors.warning;
  }
};

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'csv_upload':
      return 'CSV Upload';
    case 'pdf_upload':
      return 'PDF Upload';
    case 'mono_sync':
      return 'Bank Sync';
    default:
      return 'Import';
  }
};

const formatDate = (value?: string) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ImportJobCard = ({ job, onPress }: { job: ImportJob; onPress: () => void }) => {
  const statusColor = getStatusColor(job.status);
  return (
    <TouchableOpacity
      className="p-4 rounded-2xl mb-3"
      style={{ backgroundColor: colors.backgroundSecondary }}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {getSourceLabel(job.source)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            {job.fileName || 'Bank Import'}
          </Text>
        </View>
        <View className="items-end">
          <View className="flex-row items-center mb-1">
            <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: statusColor }} />
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              {job.status}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {formatDate(job.createdAt)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          Imported: {job.importedCount ?? 0}
        </Text>
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          Duplicates: {job.duplicateCount ?? 0}
        </Text>
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          Errors: {job.errorCount ?? 0}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ImportHistoryScreen() {
  const router = useRouter();
  const { data, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useImportJobs(20);

  const jobs = data?.pages.flatMap((page) => page.jobs) ?? [];

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
          Import History
        </Text>
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
        {jobs.length === 0 && (
          <View className="items-center py-10">
            <Ionicons name="folder-open-outline" size={32} color={colors.textTertiary} />
            <Text className="text-base font-semibold mt-3" style={{ color: colors.text }}>
              No imports yet
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Upload a bank statement to get started.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/settings/import-statement')}
              className="mt-4 px-4 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.textInverse }}>
                Import Statement
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {jobs.map((job) => (
          <ImportJobCard
            key={job.id}
            job={job}
            onPress={() => router.push(`/settings/import-details/${job.id}`)}
          />
        ))}

        {hasNextPage && (
          <TouchableOpacity
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mt-2 px-4 py-3 rounded-full items-center"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
