import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';
import { Button } from '@/src/components/common/Button';
import { Toast } from '@/src/components/common/Toast';
import { useDeleteStatementImport, useStatementImport } from '@/features/statements/statement.hooks';

// Friendly story labels for each backend progress step. The screen advances
// through these based on REAL backend events (persisted progress), not timers.
const STEP_STORY: Record<string, string> = {
  'import.created': 'Statement received',
  'upload.received': 'Statement received',
  'file.validating': 'Checking your file',
  'pdf.converting': 'Opening your PDF',
  'page.image.created': 'Converting pages for AI reading',
  'ai.reading.started': 'Reading your statement',
  'ai.reading.page': 'Reading your statement',
  'ai.extraction.completed': 'Finding transaction rows',
  'rows.normalizing': 'Mapping dates, descriptions, debit, credit, and balance',
  'rows.validating': 'Checking unclear rows',
  'categories.suggesting': 'Suggesting categories',
  'duplicates.checking': 'Checking possible duplicates',
  'review.preparing': 'Preparing your review screen',
  'import.ready': 'Ready for review',
  'import.failed': 'Import failed',
};

// The canonical story order shown while processing. Completed steps get a check;
// the current step gets a spinner; upcoming steps are dimmed.
const STORY_ORDER: { key: string; label: string }[] = [
  { key: 'file.validating', label: 'Statement received' },
  { key: 'pdf.converting', label: 'Opening your PDF' },
  { key: 'page.image.created', label: 'Converting pages for AI reading' },
  { key: 'ai.reading.started', label: 'Reading your statement' },
  { key: 'ai.extraction.completed', label: 'Finding transaction rows' },
  { key: 'rows.normalizing', label: 'Mapping dates, amounts, debit & credit' },
  { key: 'rows.validating', label: 'Checking unclear rows' },
  { key: 'categories.suggesting', label: 'Suggesting categories' },
  { key: 'duplicates.checking', label: 'Checking possible duplicates' },
  { key: 'review.preparing', label: 'Preparing your review screen' },
];

const getImportFailureContent = (errorMessage?: string | null) => {
  const safeMessage = String(errorMessage || '').trim();

  if (/no longer available on the server/i.test(safeMessage)) {
    return {
      title: 'This upload expired before processing finished',
      body: safeMessage,
      tips: [
        'Upload the statement again.',
        'Stay on the import screen until the preview finishes.',
        'If it happens again, try a smaller file.',
      ],
    };
  }

  if (/image scan/i.test(safeMessage) || /blurry/i.test(safeMessage) || /cropped/i.test(safeMessage)) {
    return {
      title: 'This statement image is hard to read',
      body: safeMessage,
      tips: [
        'Use a brighter, flatter photo.',
        'Make sure the full transaction table is visible.',
        'Avoid shadows, blur, and cropped edges.',
      ],
    };
  }

  if (/pdf statement/i.test(safeMessage) || /transaction table/i.test(safeMessage)) {
    return {
      title: 'This PDF does not have enough readable statement data',
      body: safeMessage,
      tips: [
        'Upload the real bank statement, not another PDF document.',
        'Use a cleaner PDF export if your bank provides one.',
        'Make sure dates, descriptions, and amounts are visible.',
      ],
    };
  }

  if (/spreadsheet/i.test(safeMessage) || /excel/i.test(safeMessage) || /csv/i.test(safeMessage)) {
    return {
      title: 'This spreadsheet statement could not be parsed',
      body: safeMessage,
      tips: [
        'Check that the file contains transaction rows.',
        'Keep the date, description, and amount columns visible.',
        'Try exporting the statement again from your bank.',
      ],
    };
  }

  return {
    title: 'We could not read this statement',
    body: safeMessage || 'We could not prepare a preview for this statement. Try uploading a clearer bank statement file.',
    tips: [
      'Try a clearer statement file.',
      'Make sure it shows real transaction rows.',
      'Upload again after checking the file format.',
    ],
  };
};

const StatCard = ({ label, value, tone }: { label: string; value: number; tone: string }) => {
  const colors = Colors.light;
  return (
    <View
      style={{
        flex: 1,
        minWidth: '47%',
        backgroundColor: `${tone}15`,
        borderRadius: 18,
        padding: 16,
      }}
    >
      <Text style={{ color: tone, fontSize: 12, marginBottom: 6 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{value}</Text>
    </View>
  );
};

export default function StatementImportDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { data: statementImport, isLoading } = useStatementImport(id);
  const deleteImport = useDeleteStatementImport();

  const handleCancel = () => {
    if (!statementImport) return;

    Alert.alert('Cancel Import', 'This will remove the preview rows for this statement import.', [
      { text: 'Keep Import', style: 'cancel' },
      {
        text: 'Cancel Import',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteImport.mutateAsync(statementImport.id);
            router.replace('/settings/statement-import');
          } catch (error: any) {
            setToastMessage(error?.message || 'Failed to cancel statement import');
            setToastType('error');
            setToastVisible(true);
          }
        },
      },
    ]);
  };

  if (isLoading || !statementImport) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const isProcessing = statementImport.isProcessing;
  const isImported = statementImport.status === 'imported';
  const hasNoRows = !isImported && !isProcessing && statementImport.status === 'reviewing' && statementImport.totalRows === 0;
  const hasOnlyDuplicates =
    !isImported
    && statementImport.totalRows > 0
    && statementImport.duplicateRows === statementImport.totalRows;
  const failureContent = getImportFailureContent(statementImport.errorMessage);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <FadeUp style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', flex: 1 }} numberOfLines={1}>
              {statementImport.fileName}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary }}>
            {statementImport.bankName || 'Manual statement import'}
          </Text>
        </FadeUp>

        {isProcessing ? (
          <AnimatedScreenSection
            index={0}
            style={{
              backgroundColor: colors.primaryBackground,
              borderRadius: 24,
              padding: 20,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
              {STEP_STORY[statementImport.progressStep || ''] || 'Reading your statement'}
            </Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 16 }}>
              SEFA is reading your statement page by page, then checking and preparing every row for your review.
            </Text>

            {/* Progress bar driven by real backend percent */}
            <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.background, marginBottom: 18, overflow: 'hidden' }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  width: `${Math.max(6, Math.min(statementImport.progressPercent || 0, 100))}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>

            {STORY_ORDER.map(({ key, label }) => {
              const reached = (statementImport.progress || []).some((entry) => entry.step === key);
              const isCurrent = statementImport.progressStep === key;
              const done = reached && !isCurrent;
              return (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: done ? colors.primary : colors.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                    ) : isCurrent ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border }} />
                    )}
                  </View>
                  <Text
                    style={{
                      color: done || isCurrent ? colors.text : colors.textTertiary,
                      fontWeight: isCurrent ? '600' : '400',
                      flex: 1,
                    }}
                  >
                    {key === 'ai.reading.started' && statementImport.pageCount
                      ? `Reading your statement (${statementImport.pageCount} ${statementImport.pageCount === 1 ? 'page' : 'pages'})`
                      : label}
                  </Text>
                </View>
              );
            })}

            {/* You can leave — we'll notify you when it's ready. */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginTop: 8,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: `${colors.text}10`,
              }}
            >
              <Ionicons name="notifications-outline" size={18} color={colors.primary} style={{ marginTop: 1, marginRight: 10 }} />
              <Text style={{ color: colors.textSecondary, flex: 1, lineHeight: 20, fontSize: 13 }}>
                This can take a few minutes. You can leave this screen — we&apos;ll send you a notification when your
                transactions are ready to review.
              </Text>
            </View>
          </AnimatedScreenSection>
        ) : statementImport.status === 'failed' ? (
          <AnimatedScreenSection
            index={0}
            style={{
              backgroundColor: `${colors.error}10`,
              borderRadius: 24,
              padding: 20,
            }}
          >
            <Text style={{ color: colors.error, fontSize: 20, fontWeight: '700', marginBottom: 10 }}>
              {failureContent.title}
            </Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22, marginBottom: 18 }}>
              {failureContent.body}
            </Text>
            <View style={{ gap: 10, marginBottom: 18 }}>
              {failureContent.tips.map((tip) => (
                <View key={tip} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.error} style={{ marginTop: 2, marginRight: 10 }} />
                  <Text style={{ color: colors.textSecondary, flex: 1, lineHeight: 22 }}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
            <Button title="Back to Imports" onPress={() => router.replace('/settings/statement-import')} fullWidth />
          </AnimatedScreenSection>
        ) : (
          <>
            <AnimatedScreenSection index={0}>
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 24,
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
                  {isImported
                    ? 'Import complete'
                    : hasNoRows
                      ? 'No transactions found'
                      : 'Statement scanned successfully'}
                </Text>
                <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
                  {isImported
                    ? 'Your approved transactions are now part of your SEFA records.'
                    : hasNoRows
                      ? 'No transaction rows were detected. Try another statement or upload a clearer file.'
                      : hasOnlyDuplicates
                        ? 'All transactions in this statement may already exist in SEFA.'
                        : 'Review the summary before deciding what to import.'}
                </Text>
              </View>
            </AnimatedScreenSection>

            <AnimatedScreenSection index={1}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <StatCard label="Total transactions found" value={statementImport.totalRows} tone={colors.info} />
                <StatCard label="Ready to import" value={statementImport.readyRows} tone={colors.success} />
                <StatCard label="Needs review" value={statementImport.needsReviewRows} tone={colors.warning} />
                <StatCard label="Possible duplicates" value={statementImport.duplicateRows} tone={colors.error} />
              </View>
            </AnimatedScreenSection>

            {!isImported ? (
              <AnimatedScreenSection index={2}>
                {!hasNoRows && (
                  <Button
                    title="Review Transactions"
                    onPress={() => router.push(`/settings/statement-import/${statementImport.id}/rows` as any)}
                    fullWidth
                  />
                )}
                <Button
                  title={hasNoRows ? 'Upload Another Statement' : 'Cancel Import'}
                  onPress={hasNoRows ? () => router.replace('/settings/statement-import') : handleCancel}
                  variant="outline"
                  fullWidth
                  className={hasNoRows ? undefined : 'mt-3'}
                  loading={deleteImport.isPending}
                />
              </AnimatedScreenSection>
            ) : (
              <AnimatedScreenSection index={2}>
                <Button
                  title="View Transactions"
                  onPress={() => router.replace('/(tabs)/transactions')}
                  fullWidth
                />
                <Button
                  title="Back to Dashboard"
                  onPress={() => router.replace('/(tabs)')}
                  variant="outline"
                  fullWidth
                  className="mt-3"
                />
              </AnimatedScreenSection>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
