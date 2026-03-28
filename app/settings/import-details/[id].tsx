/**
 * Import Details Screen
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { useGroupedCategories } from '@/features/categories/category.hooks';
import {
  useConfirmImportDraft,
  useDeleteImportDraftRow,
  useImportDraft,
  useImportJob,
  useSelectImportBank,
  useUndoImport,
  useUpdateImportDraftRow,
} from '@/features/import/import.hooks';
import type { Category } from '@/features/categories/category.types';
import type { ImportDraftRow, ImportJob } from '@/features/import/import.types';

const colors = Colors.light;

type ToastType = 'success' | 'error' | 'warning';

type RowEditorState = {
  rowId: string;
  description: string;
  date: string;
  amount: string;
  direction: 'debit' | 'credit';
  reference: string;
  balance: string;
  categoryId: string;
  excluded: boolean;
  sourceText: string;
};

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

const toInputDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
};

const formatCurrency = (value: number) =>
  `NGN ${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

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
  return value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
};

const humanize = (value?: string | null) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return colors.success;
    case 'queued':
      return colors.warning;
    case 'processing':
      return colors.info;
    case 'needs_bank_selection':
      return colors.warning;
    case 'needs_review':
      return colors.primary;
    case 'importing':
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

const MetricCard = ({ label, value }: { label: string; value: string | number }) => (
  <View
    className="rounded-2xl px-4 py-4 mb-3"
    style={{ backgroundColor: colors.background, width: '48%' }}
  >
    <Text className="text-xs mb-2" style={{ color: colors.textTertiary }}>
      {label}
    </Text>
    <Text className="text-base font-semibold" style={{ color: colors.text }}>
      {value}
    </Text>
  </View>
);

const DirectionPill = ({
  label,
  active,
  onPress,
}: {
  label: 'debit' | 'credit';
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 py-3 rounded-2xl items-center mr-2"
    style={{
      backgroundColor: active ? colors.primary : colors.background,
      borderWidth: 1,
      borderColor: active ? colors.primary : colors.border,
    }}
  >
    <Text
      className="text-sm font-semibold"
      style={{ color: active ? colors.textInverse : colors.textSecondary }}
    >
      {label === 'debit' ? 'Debit' : 'Credit'}
    </Text>
  </TouchableOpacity>
);

const RowAction = ({
  label,
  icon,
  onPress,
  tint,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tint: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-3 py-2 rounded-full mr-2 mb-2"
    style={{ backgroundColor: `${tint}14` }}
  >
    <Ionicons name={icon} size={14} color={tint} />
    <Text className="text-xs font-semibold ml-2" style={{ color: tint }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const buildEditorState = (row: ImportDraftRow): RowEditorState => ({
  rowId: row.id,
  description: row.description,
  date: toInputDate(row.date),
  amount: String(row.amount),
  direction: row.direction,
  reference: row.reference ?? '',
  balance: row.balance === null || row.balance === undefined ? '' : String(row.balance),
  categoryId: row.categoryId ?? '',
  excluded: row.excluded,
  sourceText: row.sourceText ?? '',
});

const getStatusCopy = (job?: ImportJob | null) => {
  switch (job?.status) {
    case 'queued':
      return 'Your statement is in the queue. SEFA will parse it and prepare a review draft.';
    case 'processing':
      return 'SEFA is extracting transactions and checking which parsing lane fits this statement best.';
    case 'importing':
      return 'Your reviewed rows are being written into the ledger now.';
    case 'needs_bank_selection':
      return 'We could not confidently identify the bank. Choose one to continue with the best parser.';
    case 'needs_review':
      return 'Nothing has been imported yet. Review the draft rows, fix anything suspicious, then confirm.';
    case 'completed':
      return 'This import has finished. You can still undo it while the retention window is open.';
    case 'failed':
      return 'This import stopped before completion. Review the errors below and try a cleaner file if needed.';
    case 'undone':
      return 'This import was undone and the transactions were removed from your ledger.';
    default:
      return 'Loading import details...';
  }
};

export default function ImportDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: job, isLoading, refetch } = useImportJob(id || '');
  const draftJobId = job?.status === 'needs_review' ? job.id : '';
  const { data: draft, isLoading: isDraftLoading } = useImportDraft(draftJobId);
  const { data: groupedCategories } = useGroupedCategories();

  const selectImportBank = useSelectImportBank();
  const updateDraftRow = useUpdateImportDraftRow();
  const deleteDraftRow = useDeleteImportDraftRow();
  const confirmDraft = useConfirmImportDraft();
  const undoImport = useUndoImport();

  const [bankSearch, setBankSearch] = useState('');
  const [editor, setEditor] = useState<RowEditorState | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showFeedback = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const canUndo = useMemo(() => {
    if (!job) return false;
    if (job.status !== 'completed' || job.isUndone) return false;
    if (!job.retentionExpiresAt) return true;
    return new Date() < new Date(job.retentionExpiresAt);
  }, [job]);

  const filteredBanks = useMemo(() => {
    const options = job?.availableBanks ?? [];
    const query = bankSearch.trim().toLowerCase();
    if (!query) return options;
    return options.filter((bank) => bank.displayName.toLowerCase().includes(query));
  }, [bankSearch, job?.availableBanks]);

  const editorCategories = useMemo(() => {
    if (!editor || !groupedCategories) return [];
    return editor.direction === 'credit' ? groupedCategories.income : groupedCategories.expense;
  }, [editor, groupedCategories]);

  const openEditor = (row: ImportDraftRow) => {
    setEditor(buildEditorState(row));
  };

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
            showFeedback('Import undone successfully', 'success');
          } catch (error: any) {
            showFeedback(error?.message || 'Failed to undo import', 'error');
          }
        },
      },
    ]);
  };

  const handleSelectBank = async (bankSlug: string) => {
    if (!job) return;

    try {
      await selectImportBank.mutateAsync({ jobId: job.id, bankSlug });
      showFeedback('Bank selected. Parsing will continue now.', 'success');
      setBankSearch('');
    } catch (error: any) {
      showFeedback(error?.message || 'Failed to continue import', 'error');
    }
  };

  const handleToggleExclude = async (row: ImportDraftRow) => {
    if (!job) return;

    try {
      await updateDraftRow.mutateAsync({
        jobId: job.id,
        rowId: row.id,
        payload: { excluded: !row.excluded },
      });
      showFeedback(row.excluded ? 'Row included again' : 'Row excluded from import', 'success');
    } catch (error: any) {
      showFeedback(error?.message || 'Failed to update row', 'error');
    }
  };

  const handleDeleteRow = (row: ImportDraftRow) => {
    if (!job) return;

    Alert.alert(
      'Delete Row',
      'This row will be removed from the draft entirely. You can re-upload the statement if you need it back.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Row',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDraftRow.mutateAsync({ jobId: job.id, rowId: row.id });
              setEditor((current) => (current?.rowId === row.id ? null : current));
              showFeedback('Draft row deleted', 'success');
            } catch (error: any) {
              showFeedback(error?.message || 'Failed to delete row', 'error');
            }
          },
        },
      ],
    );
  };

  const handleSaveEditor = async () => {
    if (!job || !editor) return;

    const amount = Number(editor.amount);
    const balance =
      editor.balance.trim().length === 0 ? null : Number(editor.balance);
    const parsedDate = new Date(`${editor.date}T00:00:00.000Z`);

    if (!editor.description.trim()) {
      showFeedback('Description is required', 'error');
      return;
    }

    if (!editor.date || Number.isNaN(parsedDate.getTime())) {
      showFeedback('Enter a valid date in YYYY-MM-DD format', 'error');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showFeedback('Amount must be a positive number', 'error');
      return;
    }

    if (editor.balance.trim().length > 0 && !Number.isFinite(balance as number)) {
      showFeedback('Balance must be a valid number', 'error');
      return;
    }

    try {
      await updateDraftRow.mutateAsync({
        jobId: job.id,
        rowId: editor.rowId,
        payload: {
          description: editor.description.trim(),
          date: parsedDate.toISOString(),
          amount,
          direction: editor.direction,
          reference: editor.reference.trim() || null,
          balance,
          categoryId: editor.categoryId || null,
          excluded: editor.excluded,
        },
      });
      setEditor(null);
      showFeedback('Draft row updated', 'success');
    } catch (error: any) {
      showFeedback(error?.message || 'Failed to update draft row', 'error');
    }
  };

  const handleConfirmDraft = async () => {
    if (!job || !draft) return;

    if (draft.summary.includedRows === 0) {
      showFeedback('Include at least one row before confirming import', 'warning');
      return;
    }

    try {
      await confirmDraft.mutateAsync(job.id);
      showFeedback('Import confirmed. Final processing has started.', 'success');
    } catch (error: any) {
      showFeedback(error?.message || 'Failed to confirm import', 'error');
    }
  };

  const renderJobSummary = () => {
    if (!job) return null;

    return (
      <SectionCard title="Job">
        <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
          {job.fileName || 'Bank import'}
        </Text>
        <View className="flex-row flex-wrap mb-2">
          <Chip
            label={humanize(job.status)}
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
    );
  };

  const renderBankSection = () => {
    if (!job) return null;

    return (
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
    );
  };

  const renderProgressState = () => {
    if (!job) return null;

    if (!['queued', 'processing', 'importing'].includes(job.status)) {
      return null;
    }

    return (
      <SectionCard title="Progress">
        <View
          className="p-4 rounded-3xl"
          style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color={getStatusColor(job.status)} />
            <Text className="text-sm font-semibold ml-3" style={{ color: colors.text }}>
              {formatStage(job.stage)}
            </Text>
          </View>
          <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
            {getStatusCopy(job)}
          </Text>
          <View className="mt-4 rounded-full h-3" style={{ backgroundColor: colors.borderLight }}>
            <View
              className="h-3 rounded-full"
              style={{
                width: `${Math.max(6, Math.min(job.progress ?? 0, 100))}%`,
                backgroundColor: getStatusColor(job.status),
              }}
            />
          </View>
          <View className="mt-4">
            <Button title="Refresh Progress" onPress={() => refetch()} variant="secondary" />
          </View>
        </View>
      </SectionCard>
    );
  };

  const renderBankSelectionState = () => {
    if (!job || job.status !== 'needs_bank_selection') return null;

    return (
      <SectionCard title="Choose Bank">
        <View
          className="p-4 rounded-3xl mb-4"
          style={{ backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#F59E0B33' }}
        >
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            Bank confirmation required
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {getStatusCopy(job)}
          </Text>
        </View>

        <TextInput
          value={bankSearch}
          onChangeText={setBankSearch}
          placeholder="Search supported banks"
          placeholderTextColor={colors.textTertiary}
          className="px-4 py-3 rounded-2xl mb-4"
          style={{
            backgroundColor: colors.background,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />

        {filteredBanks.map((bank) => (
          <TouchableOpacity
            key={bank.slug}
            onPress={() => handleSelectBank(bank.slug)}
            disabled={selectImportBank.isPending}
            className="p-4 rounded-2xl mb-3"
            style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primaryBackground }}
                >
                  <Ionicons name="business-outline" size={18} color={colors.primary} />
                </View>
                <Text className="text-sm font-semibold flex-1" style={{ color: colors.text }}>
                  {bank.displayName}
                </Text>
              </View>
              {selectImportBank.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {filteredBanks.length === 0 && (
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            No matching banks found.
          </Text>
        )}
      </SectionCard>
    );
  };

  const renderReviewState = () => {
    if (!job || job.status !== 'needs_review') return null;

    return (
      <>
        <SectionCard title="Review Draft">
          <View
            className="p-4 rounded-3xl mb-4"
            style={{ backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#3629B733' }}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              Review before import
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {getStatusCopy(job)}
            </Text>
          </View>

          {job.fileType === 'application/pdf' && job.ocrProvider ? (
            <View
              className="p-4 rounded-3xl mb-4"
              style={{ backgroundColor: '#FFF4E5', borderWidth: 1, borderColor: '#F59E0B33' }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                OCR-assisted draft
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                This looks like a scanned statement. Dates, descriptions, and amounts may need extra edits.
              </Text>
            </View>
          ) : null}

          {isDraftLoading && (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
                Loading draft rows...
              </Text>
            </View>
          )}

          {draft && (
            <>
              <View className="flex-row flex-wrap justify-between">
                <MetricCard label="Draft rows" value={draft.summary.totalRows} />
                <MetricCard label="Included" value={draft.summary.includedRows} />
                <MetricCard label="Excluded" value={draft.summary.excludedRows} />
                <MetricCard label="Flagged" value={draft.summary.flaggedRows} />
                <MetricCard label="Debit total" value={formatCurrency(draft.summary.debitTotal)} />
                <MetricCard label="Credit total" value={formatCurrency(draft.summary.creditTotal)} />
              </View>

              {draft.summary.lowConfidenceRows > 0 && (
                <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                  {draft.summary.lowConfidenceRows} row(s) have low confidence and deserve a closer look.
                </Text>
              )}

              <Button
                title={confirmDraft.isPending ? 'Starting import...' : 'Confirm Import'}
                onPress={handleConfirmDraft}
                loading={confirmDraft.isPending}
                disabled={confirmDraft.isPending || draft.summary.includedRows === 0}
              />
            </>
          )}
        </SectionCard>

        {draft?.rows.map((row) => {
          const categoryLabel =
            row.categoryName || row.suggestedCategoryName || 'No category';
          const categoryTint = row.categoryColor || row.suggestedCategoryColor || colors.primary;
          const isDebit = row.direction === 'debit';

          return (
            <View
              key={row.id}
              className="p-4 rounded-3xl mb-4"
              style={{
                backgroundColor: row.excluded ? colors.backgroundSecondary : colors.background,
                borderWidth: 1,
                borderColor: row.excluded ? colors.border : colors.borderLight,
              }}
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                    {row.description}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                    {formatDate(row.date)}{row.reference ? ` • ${row.reference}` : ''}
                  </Text>
                </View>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: isDebit ? colors.error : colors.success }}
                >
                  {isDebit ? '-' : '+'}
                  {formatCurrency(row.amount)}
                </Text>
              </View>

              <View className="flex-row flex-wrap mb-2">
                <Chip label={humanize(row.direction)} />
                <Chip
                  label={row.categoryId ? categoryLabel : `${categoryLabel}${row.suggestedCategoryName ? ' (suggested)' : ''}`}
                  backgroundColor={`${categoryTint}14`}
                  textColor={categoryTint}
                />
                <Chip
                  label={`Confidence: ${row.confidence}`}
                  backgroundColor={row.confidence === 'low' ? '#FFF4E5' : colors.backgroundSecondary}
                />
                {typeof row.balance === 'number' ? <Chip label={`Bal: ${formatCurrency(row.balance)}`} /> : null}
                {row.excluded ? <Chip label="Excluded" backgroundColor="#FEE2E2" textColor={colors.error} /> : null}
              </View>

              {!!row.issueFlags.length && (
                <View className="flex-row flex-wrap mb-2">
                  {row.issueFlags.map((flag) => (
                    <Chip
                      key={flag}
                      label={humanize(flag)}
                      backgroundColor="#FFF4E5"
                      textColor={colors.warning}
                    />
                  ))}
                </View>
              )}

              <View className="flex-row flex-wrap mt-2">
                <RowAction
                  label="Edit"
                  icon="create-outline"
                  onPress={() => openEditor(row)}
                  tint={colors.primary}
                />
                <RowAction
                  label={row.excluded ? 'Include' : 'Exclude'}
                  icon={row.excluded ? 'add-circle-outline' : 'remove-circle-outline'}
                  onPress={() => handleToggleExclude(row)}
                  tint={row.excluded ? colors.success : colors.warning}
                />
                <RowAction
                  label="Delete"
                  icon="trash-outline"
                  onPress={() => handleDeleteRow(row)}
                  tint={colors.error}
                />
              </View>
            </View>
          );
        })}
      </>
    );
  };

  const renderResultsState = () => {
    if (!job || ['queued', 'processing', 'needs_bank_selection', 'needs_review', 'importing'].includes(job.status)) {
      return null;
    }

    const useDraftMetrics = job.status !== 'completed' && job.draftSummary;

    return (
      <SectionCard title="Results">
        <View className="flex-row flex-wrap justify-between">
          <MetricCard
            label={useDraftMetrics ? 'Draft rows' : 'Source Rows'}
            value={useDraftMetrics ? job.draftSummary?.totalRows ?? 0 : job.sourceRecordCount ?? job.totalTransactions ?? 0}
          />
          <MetricCard
            label={useDraftMetrics ? 'Included' : 'Valid Rows'}
            value={useDraftMetrics ? job.draftSummary?.includedRows ?? 0 : job.validRecordCount ?? 0}
          />
          <MetricCard label="Imported" value={job.importedCount ?? 0} />
          <MetricCard label="Duplicates" value={job.duplicateCount ?? 0} />
          <MetricCard label="Skipped" value={job.skippedCount ?? 0} />
          <MetricCard label="Errors" value={job.errorCount ?? 0} />
        </View>
      </SectionCard>
    );
  };

  const renderQualitySections = () => {
    if (!job) return null;

    return (
      <>
        {!!job.documentIdentityReasons?.length && (
          <SectionCard title="Detection Notes">
            {job.documentIdentityReasons.map((reason, index) => (
              <Text
                key={`${reason}-${index}`}
                className="text-sm mb-3"
                style={{ color: colors.textSecondary }}
              >
                {reason}
              </Text>
            ))}
          </SectionCard>
        )}

        {!!job.qualityFlags?.length && (
          <SectionCard title="Quality Flags">
            <View className="flex-row flex-wrap">
              {job.qualityFlags.map((flag) => (
                <Chip
                  key={flag}
                  label={humanize(flag)}
                  backgroundColor="#FFF4E5"
                  textColor={colors.warning}
                />
              ))}
            </View>
          </SectionCard>
        )}

        {!!job.warnings?.length && (
          <SectionCard title="Warnings">
            {job.warnings.map((warning, index) => (
              <Text
                key={`${warning}-${index}`}
                className="text-sm mb-3"
                style={{ color: colors.textSecondary }}
              >
                {warning}
              </Text>
            ))}
          </SectionCard>
        )}

        {!!job.errors?.length && (
          <SectionCard title="Errors">
            {job.errors.map((err, index) => (
              <Text
                key={`${err}-${index}`}
                className="text-sm mb-3"
                style={{ color: colors.textSecondary }}
              >
                {err}
              </Text>
            ))}
          </SectionCard>
        )}
      </>
    );
  };

  const renderFooterActions = () => {
    if (!job) return null;

    if (canUndo) {
      return (
        <View className="mb-4">
          <Button
            title={undoImport.isPending ? 'Undoing...' : 'Undo Import'}
            onPress={handleUndo}
            loading={undoImport.isPending}
            variant="secondary"
          />
        </View>
      );
    }

    if (['queued', 'processing', 'needs_bank_selection', 'importing', 'failed'].includes(job.status)) {
      return <Button title="Refresh" onPress={() => refetch()} variant="secondary" />;
    }

    return null;
  };

  const renderEditorModal = () => {
    if (!editor) return null;

    return (
      <Modal
        visible
        transparent
        animationType="slide"
        onRequestClose={() => setEditor(null)}
      >
        <View
          className="flex-1 justify-end px-4 pb-6"
          style={{ backgroundColor: colors.overlay }}
        >
          <View
            className="rounded-3xl p-5"
            style={{ backgroundColor: colors.background, maxHeight: '88%' }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                Edit Draft Row
              </Text>
              <TouchableOpacity onPress={() => setEditor(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Description
              </Text>
              <TextInput
                value={editor.description}
                onChangeText={(value) => setEditor((current) => (current ? { ...current, description: value } : current))}
                placeholder="Transaction description"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3 rounded-2xl mb-4"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Date
              </Text>
              <TextInput
                value={editor.date}
                onChangeText={(value) => setEditor((current) => (current ? { ...current, date: value } : current))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                className="px-4 py-3 rounded-2xl mb-4"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Amount
              </Text>
              <TextInput
                value={editor.amount}
                onChangeText={(value) => setEditor((current) => (current ? { ...current, amount: value.replace(/[^0-9.]/g, '') } : current))}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                className="px-4 py-3 rounded-2xl mb-4"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Direction
              </Text>
              <View className="flex-row mb-4">
                <DirectionPill
                  label="debit"
                  active={editor.direction === 'debit'}
                  onPress={() =>
                    setEditor((current) =>
                      current ? { ...current, direction: 'debit', categoryId: '' } : current,
                    )
                  }
                />
                <DirectionPill
                  label="credit"
                  active={editor.direction === 'credit'}
                  onPress={() =>
                    setEditor((current) =>
                      current ? { ...current, direction: 'credit', categoryId: '' } : current,
                    )
                  }
                />
              </View>

              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Reference
              </Text>
              <TextInput
                value={editor.reference}
                onChangeText={(value) => setEditor((current) => (current ? { ...current, reference: value } : current))}
                placeholder="Optional reference"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3 rounded-2xl mb-4"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                Balance
              </Text>
              <TextInput
                value={editor.balance}
                onChangeText={(value) => setEditor((current) => (current ? { ...current, balance: value.replace(/[^0-9.-]/g, '') } : current))}
                placeholder="Optional running balance"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                className="px-4 py-3 rounded-2xl mb-4"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                Category override
              </Text>
              <TouchableOpacity
                onPress={() => setEditor((current) => (current ? { ...current, categoryId: '' } : current))}
                className="px-4 py-3 rounded-2xl mb-3"
                style={{
                  backgroundColor: editor.categoryId ? colors.backgroundSecondary : `${colors.primary}12`,
                  borderWidth: 1,
                  borderColor: editor.categoryId ? colors.border : `${colors.primary}40`,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: editor.categoryId ? colors.textSecondary : colors.primary }}
                >
                  Use suggested category / no override
                </Text>
              </TouchableOpacity>

              <View className="flex-row flex-wrap mb-4">
                {editorCategories.map((category: Category) => {
                  const selected = editor.categoryId === category.id;

                  return (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() =>
                        setEditor((current) =>
                          current ? { ...current, categoryId: selected ? '' : category.id } : current,
                        )
                      }
                      className="mr-2 mb-2 px-3 py-2 rounded-full flex-row items-center"
                      style={{
                        backgroundColor: selected ? `${category.color}18` : colors.backgroundSecondary,
                        borderWidth: 1,
                        borderColor: selected ? category.color : colors.border,
                      }}
                    >
                      <Ionicons
                        name={(category.icon || 'folder') as keyof typeof Ionicons.glyphMap}
                        size={14}
                        color={selected ? category.color : colors.textSecondary}
                      />
                      <Text
                        className="text-xs font-semibold ml-2"
                        style={{ color: selected ? category.color : colors.textSecondary }}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={() => setEditor((current) => (current ? { ...current, excluded: !current.excluded } : current))}
                className="px-4 py-3 rounded-2xl mb-4 flex-row items-center"
                style={{
                  backgroundColor: editor.excluded ? '#FEE2E2' : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: editor.excluded ? '#FCA5A5' : colors.border,
                }}
              >
                <Ionicons
                  name={editor.excluded ? 'remove-circle' : 'add-circle-outline'}
                  size={18}
                  color={editor.excluded ? colors.error : colors.textSecondary}
                />
                <Text
                  className="text-sm font-semibold ml-2"
                  style={{ color: editor.excluded ? colors.error : colors.textSecondary }}
                >
                  {editor.excluded ? 'This row will be excluded from import' : 'Keep this row included'}
                </Text>
              </TouchableOpacity>

              {editor.sourceText ? (
                <View
                  className="p-4 rounded-2xl mb-4"
                  style={{ backgroundColor: colors.backgroundSecondary }}
                >
                  <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                    Extracted source text
                  </Text>
                  <Text className="text-sm" style={{ color: colors.text }}>
                    {editor.sourceText}
                  </Text>
                </View>
              ) : null}

              <Button
                title={updateDraftRow.isPending ? 'Saving...' : 'Save Changes'}
                onPress={handleSaveEditor}
                loading={updateDraftRow.isPending}
              />

              <View className="mt-3">
                <Button
                  title="Cancel"
                  onPress={() => setEditor(null)}
                  variant="secondary"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
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
        {isLoading && !job ? (
          <View className="items-center py-10">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
              Loading import details...
            </Text>
          </View>
        ) : null}

        {!isLoading && !job ? (
          <SectionCard title="Import Not Found">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              This import job could not be found.
            </Text>
          </SectionCard>
        ) : null}

        {job ? (
          <>
            {renderJobSummary()}
            {renderProgressState()}
            {renderBankSelectionState()}
            {renderReviewState()}
            {renderBankSection()}
            {renderResultsState()}
            {renderQualitySections()}
            {renderFooterActions()}
          </>
        ) : null}
      </ScrollView>

      {renderEditorModal()}

      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        type={toastType}
      />
    </SafeAreaView>
  );
}
