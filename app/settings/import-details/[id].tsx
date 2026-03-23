/**
 * Import Details Screen
 */

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { useImportJob, useUndoImport } from '@/features/import/import.hooks';
import type { ImportJob } from '@/features/import/import.types';

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

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateRange = (job: ImportJob) => {
  const range = job.statementDateRange ?? job.dateRange;
  if (!range?.from && !range?.to) return 'Not detected';
  if (range?.from && range?.to) {
    return `${formatDate(range.from)} to ${formatDate(range.to)}`;
  }
  return formatDate(range?.from || range?.to);
};

const formatStage = (value?: string) => {
  if (!value) return 'Queued';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

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

const SectionCard = ({
  title,
  children,
  backgroundColor = colors.backgroundSecondary,
}: {
  title: string;
  children: React.ReactNode;
  backgroundColor?: string;
}) => (
  <View className="p-5 rounded-3xl mb-4" style={{ backgroundColor }}>
    <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
      {title}
    </Text>
    {children}
  </View>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-2">
    <Text className="text-sm pr-3" style={{ color: colors.textTertiary }}>
      {label}
    </Text>
    <Text className="text-sm flex-1 text-right" style={{ color: colors.textSecondary }}>
      {value}
    </Text>
  </View>
);

const Chip = ({
  label,
  backgroundColor = colors.background,
  textColor = colors.textSecondary,
}: {
  label: string;
  backgroundColor?: string;
  textColor?: string;
}) => (
  <View className="px-3 py-1 rounded-full mr-2 mb-2" style={{ backgroundColor }}>
    <Text className="text-xs font-medium" style={{ color: textColor }}>
      {label}
    </Text>
  </View>
);

const MetricCard = ({ label, value }: { label: string; value: number }) => (
  <View
    className="rounded-2xl px-4 py-4 mb-3"
    style={{ backgroundColor: colors.background, width: '48%' }}
  >
    <Text className="text-xs mb-2" style={{ color: colors.textTertiary }}>
      {label}
    </Text>
    <Text className="text-xl font-semibold" style={{ color: colors.text }}>
      {value}
    </Text>
  </View>
);

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
            {job.needsReview && (
              <View
                className="p-4 rounded-3xl mb-4"
                style={{ backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#F59E0B33' }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                  Review recommended
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  SEFA imported this statement, but the bank identity or transaction dates need a
                  quick human check before you trust every row.
                </Text>
              </View>
            )}

            <SectionCard title="Job">
              <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
                {job.fileName || 'Bank import'}
              </Text>
              <View className="flex-row flex-wrap mb-2">
                <Chip
                  label={job.status}
                  backgroundColor={`${getStatusColor(job.status)}18`}
                  textColor={colors.textSecondary}
                />
                <Chip label={formatStage(job.stage)} />
                <Chip label={`${job.progress ?? 0}% complete`} />
              </View>
              <InfoRow label="Created" value={formatDateTime(job.createdAt)} />
              <InfoRow label="Completed" value={formatDateTime(job.completedAt)} />
              {job.queueJobId ? <InfoRow label="Queue ID" value={job.queueJobId} /> : null}
            </SectionCard>

            <SectionCard title="Bank Detection" backgroundColor={colors.primaryBackground}>
              <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
                {job.detectedBankDisplayName || job.detectedBank || 'Unknown bank'}
              </Text>
              <View className="flex-row flex-wrap mb-2">
                <Chip label={`Confidence: ${job.bankDetectionConfidence || 'unknown'}`} />
                <Chip label={`Source: ${job.bankDetectionSource || 'unknown'}`} />
                {job.parser ? <Chip label={`Parser: ${job.parser}`} /> : null}
                {job.ocrProvider ? <Chip label={`OCR: ${job.ocrProvider}`} /> : null}
              </View>
              {job.bankHint ? <InfoRow label="Upload bank hint" value={job.bankHint} /> : null}
              {job.accountNumberHint ? (
                <InfoRow label="Account hint" value={`****${job.accountNumberHint}`} />
              ) : null}
              <InfoRow label="Statement period" value={formatDateRange(job)} />
            </SectionCard>

            <SectionCard title="Results">
              <View className="flex-row flex-wrap justify-between">
                <MetricCard label="Source Rows" value={job.sourceRecordCount ?? job.totalTransactions ?? 0} />
                <MetricCard label="Valid Rows" value={job.validRecordCount ?? 0} />
                <MetricCard label="Imported" value={job.importedCount ?? 0} />
                <MetricCard label="Duplicates" value={job.duplicateCount ?? 0} />
                <MetricCard label="Skipped" value={job.skippedCount ?? 0} />
                <MetricCard label="Errors" value={job.errorCount ?? 0} />
              </View>
            </SectionCard>

            {!!job.qualityFlags?.length && (
              <SectionCard title="Quality Flags">
                <View className="flex-row flex-wrap">
                  {job.qualityFlags.map((flag) => (
                    <Chip
                      key={flag}
                      label={flag.replace(/_/g, ' ')}
                      backgroundColor="#FFF4E5"
                    />
                  ))}
                </View>
              </SectionCard>
            )}

            {!!job.warnings?.length && (
              <SectionCard title="Warnings">
                {job.warnings.map((warning, index) => (
                  <Text key={`${warning}-${index}`} className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                    • {warning}
                  </Text>
                ))}
              </SectionCard>
            )}

            {!!job.errors?.length && (
              <SectionCard title="Errors">
                {job.errors.map((err, index) => (
                  <Text key={`${err}-${index}`} className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                    • {err}
                  </Text>
                ))}
              </SectionCard>
            )}

            {canUndo && (
              <Button
                title={undoImport.isPending ? 'Undoing...' : 'Undo Import'}
                onPress={handleUndo}
                loading={undoImport.isPending}
                variant="secondary"
              />
            )}

            {(job.status === 'queued' || job.status === 'processing') && (
              <View className={canUndo ? 'mt-3' : ''}>
                <Button title="Refresh Progress" onPress={() => refetch()} variant="secondary" />
              </View>
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
