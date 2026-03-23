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
import type { BankDetectionConfidence, ImportJob } from '@/features/import/import.types';

const colors = Colors.light;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return colors.success;
    case 'queued':
      return colors.warning;
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

const getConfidenceLabel = (confidence?: BankDetectionConfidence) => {
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
    default:
      return 'Needs review';
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

const formatStage = (value?: string) => {
  if (!value) return 'Queued';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const StatusChip = ({ job }: { job: ImportJob }) => (
  <View
    className="flex-row items-center self-start px-3 py-1 rounded-full"
    style={{ backgroundColor: `${getStatusColor(job.status)}18` }}
  >
    <View
      className="w-2 h-2 rounded-full mr-2"
      style={{ backgroundColor: getStatusColor(job.status) }}
    />
    <Text className="text-xs font-semibold capitalize" style={{ color: colors.textSecondary }}>
      {job.status}
    </Text>
  </View>
);

const MetaChip = ({
  label,
  tint = colors.primaryBackground,
}: {
  label: string;
  tint?: string;
}) => (
  <View className="px-3 py-1 rounded-full mr-2 mb-2" style={{ backgroundColor: tint }}>
    <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
      {label}
    </Text>
  </View>
);

const Metric = ({ label, value }: { label: string; value: number }) => (
  <View
    className="rounded-2xl px-3 py-3 mb-2"
    style={{ backgroundColor: colors.background, width: '48%' }}
  >
    <Text className="text-xs mb-1" style={{ color: colors.textTertiary }}>
      {label}
    </Text>
    <Text className="text-base font-semibold" style={{ color: colors.text }}>
      {value}
    </Text>
  </View>
);

const ImportJobCard = ({ job, onPress }: { job: ImportJob; onPress: () => void }) => {
  const detectedBank =
    job.detectedBankDisplayName ||
    (job.detectedBank && job.detectedBank !== 'unknown' ? job.detectedBank : null);

  return (
    <TouchableOpacity
      className="p-4 rounded-3xl mb-3"
      style={{ backgroundColor: colors.backgroundSecondary }}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold" style={{ color: colors.text }}>
          {getSourceLabel(job.source)}
        </Text>
        {job.needsReview && <MetaChip label="Review needed" tint="#FFF4E5" />}
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <StatusChip job={job} />
        <Text className="text-xs ml-auto" style={{ color: colors.textTertiary }}>
          {formatDate(job.completedAt || job.createdAt)}
        </Text>
      </View>

      <Text
        className="text-sm leading-5 mb-3"
        numberOfLines={2}
        style={{ color: colors.textSecondary }}
      >
        {job.fileName || 'Bank import'}
      </Text>

      <View className="flex-row flex-wrap mb-2">
        {detectedBank && <MetaChip label={detectedBank} tint={colors.primaryBackground} />}
        {job.bankDetectionConfidence && (
          <MetaChip
            label={getConfidenceLabel(job.bankDetectionConfidence)}
            tint={job.needsReview ? '#FFF4E5' : colors.background}
          />
        )}
        {job.ocrProvider && <MetaChip label={`OCR: ${job.ocrProvider}`} tint={colors.background} />}
      </View>

      <View className="flex-row flex-wrap justify-between mt-2">
        <Metric label="Imported" value={job.importedCount ?? 0} />
        <Metric label="Duplicates" value={job.duplicateCount ?? 0} />
        <Metric label="Skipped" value={job.skippedCount ?? 0} />
        <Metric label="Errors" value={job.errorCount ?? 0} />
      </View>

      {(job.status === 'queued' || job.status === 'processing') && (
        <View className="mt-2 px-3 py-3 rounded-2xl" style={{ backgroundColor: colors.background }}>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {formatStage(job.stage)} • {job.progress ?? 0}%
          </Text>
        </View>
      )}
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
            <Text className="text-sm mt-1 text-center" style={{ color: colors.textSecondary }}>
              Upload a bank statement to start tracking import quality and progress here.
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
