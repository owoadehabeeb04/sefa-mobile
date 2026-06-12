import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { Button } from '@/src/components/common/Button';
import { Select } from '@/src/components/common/Select';
import { Toast } from '@/src/components/common/Toast';
import { FadeUp, AnimatedScreenSection } from '@/src/components/motion';
import { useGroupedCategories } from '@/features/categories/category.hooks';
import { useSensitiveActionSecurity } from '@/features/security/useSensitiveActionSecurity';
import {
  useConfirmStatementImport,
  useStatementImport,
  useStatementImportRows,
  useUpdateStatementImportRow,
} from '@/features/statements/statement.hooks';
import type { StatementClassification, StatementImportRow, StatementImportRowStatus } from '@/features/statements/statement.types';

const FILTERS: { label: string; value: '' | StatementImportRowStatus }[] = [
  { label: 'All', value: '' },
  { label: 'Ready', value: 'ready' },
  { label: 'Needs Review', value: 'needs_review' },
  { label: 'Duplicates', value: 'duplicate' },
  { label: 'Ignored', value: 'ignored' },
];

const formatAmount = (amount: number) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date';

const formatLocalDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resolveEditableClassification = (row: StatementImportRow): StatementClassification => {
  if (row.classification === 'income' || row.classification === 'expense') {
    return row.classification;
  }

  return row.direction === 'credit' ? 'income' : 'expense';
};

const classificationTone = (classification: string, colors: typeof Colors.light) => {
  switch (classification) {
    case 'income':
      return colors.success;
    case 'expense':
      return colors.error;
    default:
      return colors.warning;
  }
};

const statusTone = (status: string, colors: typeof Colors.light) => {
  switch (status) {
    case 'ready':
    case 'imported':
      return colors.success;
    case 'duplicate':
      return colors.error;
    case 'ignored':
      return colors.textTertiary;
    case 'failed':
      return colors.error;
    default:
      return colors.warning;
  }
};

export default function StatementImportRowsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const { requireVerification } = useSensitiveActionSecurity();

  const [activeFilter, setActiveFilter] = useState<'' | StatementImportRowStatus>('');
  const [editingRow, setEditingRow] = useState<StatementImportRow | null>(null);
  const [draftDescription, setDraftDescription] = useState('');
  const [draftAmount, setDraftAmount] = useState('');
  const [draftClassification, setDraftClassification] = useState<StatementClassification>('unknown');
  const [draftCategoryId, setDraftCategoryId] = useState<string>('');
  const [draftDate, setDraftDate] = useState('');
  const [draftIgnored, setDraftIgnored] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');

  const { data: statementImport, isLoading: importLoading } = useStatementImport(id);
  const { data: rows = [], isLoading: rowsLoading } = useStatementImportRows(id, {
    status: activeFilter || undefined,
  });
  const { data: groupedCategories } = useGroupedCategories();
  const updateRow = useUpdateStatementImportRow();
  const confirmImport = useConfirmStatementImport();

  const categoryOptions = useMemo(() => {
    const source = draftClassification === 'income' ? groupedCategories?.income : groupedCategories?.expense;
    return (source || []).map((category) => ({
      label: category.name,
      value: category.id,
    }));
  }, [draftClassification, groupedCategories]);

  const openEditor = (row: StatementImportRow) => {
    setEditingRow(row);
    setDraftDescription(row.description || '');
    setDraftAmount(String(row.amount || ''));
    setDraftClassification(resolveEditableClassification(row));
    setDraftCategoryId(row.categoryId || '');
    setDraftDate(formatLocalDateInput(row.transactionDate));
    setDraftIgnored(row.status === 'ignored');
  };

  const closeEditor = () => {
    setEditingRow(null);
  };

  const saveEditor = async () => {
    if (!editingRow || !id) return;

    try {
      await updateRow.mutateAsync({
        statementImportId: id,
        rowId: editingRow.id,
        payload: {
          description: draftDescription,
          amount: Number(draftAmount || 0),
          classification: draftClassification,
          categoryId: draftCategoryId || null,
          transactionDate: draftDate || null,
          status: draftIgnored ? 'ignored' : 'needs_review',
        },
      });
      closeEditor();
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to save changes');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const handleConfirmImport = async () => {
    if (!id) return;

    const allowed = await requireVerification('statement_import_confirm');
    if (!allowed) {
      return;
    }

    try {
      await confirmImport.mutateAsync(id);
      router.replace(`/settings/statement-import/${id}` as any);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to confirm import');
      setToastType('error');
      setToastVisible(true);
    }
  };

  if (importLoading || rowsLoading || !statementImport) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <FadeUp style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>
                Review Transactions
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary }}>
              Edit, ignore, or approve rows before importing them into SEFA.
            </Text>
          </FadeUp>

          <AnimatedScreenSection index={0}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
              {FILTERS.map((filter) => {
                const active = activeFilter === filter.value;
                return (
                  <TouchableOpacity
                    key={filter.label}
                    onPress={() => setActiveFilter(filter.value)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: active ? colors.primaryBackground : colors.backgroundSecondary,
                    }}
                  >
                    <Text style={{ color: active ? colors.primary : colors.textSecondary, fontWeight: '600' }}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </AnimatedScreenSection>

          <AnimatedScreenSection index={1}>
            {rows.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 22,
                  padding: 20,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>
                  No transactions found
                </Text>
                <Text style={{ color: colors.textSecondary, lineHeight: 22 }}>
                  Try another filter or upload a clearer statement if this PDF could not be read well.
                </Text>
              </View>
            ) : (
              rows.map((row, index) => (
                <TouchableOpacity
                  key={row.id}
                  onPress={() => openEditor(row)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: index === rows.length - 1 ? 0 : 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={2}>
                        {row.counterParty || row.description || row.rawDescription}
                      </Text>
                      <Text style={{ color: colors.textTertiary, marginTop: 4 }}>
                        {formatDate(row.transactionDate)}
                      </Text>
                    </View>
                    <Text style={{ color: row.classification === 'income' ? colors.success : colors.text, fontWeight: '700' }}>
                      {formatAmount(row.amount)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      {
                        label: row.classification.charAt(0).toUpperCase() + row.classification.slice(1),
                        tone: classificationTone(row.classification, colors),
                      },
                      {
                        label: row.category?.name || row.suggestedCategoryName || 'Uncategorized',
                        tone: colors.primary,
                      },
                      {
                        label: row.status === 'needs_review' ? 'Needs Review' : row.status.replace('_', ' '),
                        tone: statusTone(row.status, colors),
                      },
                    ].map((chip) => (
                      <View
                        key={`${row.id}-${chip.label}`}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: `${chip.tone}15`,
                        }}
                      >
                        <Text style={{ color: chip.tone, fontSize: 12, fontWeight: '600' }}>{chip.label}</Text>
                      </View>
                    ))}
                  </View>

                  {row.validationErrors.length > 0 && (
                    <Text style={{ color: colors.warning, fontSize: 12, marginTop: 10 }}>
                      {row.validationErrors[0]}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </AnimatedScreenSection>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 20,
            backgroundColor: colors.background,
          }}
        >
          <Button
            title={`Import Approved Transactions (${statementImport.readyRows})`}
            onPress={handleConfirmImport}
            fullWidth
            disabled={statementImport.readyRows === 0}
            loading={confirmImport.isPending}
          />
        </View>
      </View>

      <Modal visible={Boolean(editingRow)} animationType="slide" onRequestClose={closeEditor}>
        <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom + 24, 32),
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>Edit Transaction</Text>
              <TouchableOpacity onPress={closeEditor}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Description</Text>
            <TextInput
              value={draftDescription}
              onChangeText={setDraftDescription}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                marginBottom: 16,
              }}
            />

            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Date</Text>
            <TextInput
              value={draftDate}
              onChangeText={setDraftDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                marginBottom: 16,
              }}
            />

            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Amount</Text>
            <TextInput
              value={draftAmount}
              onChangeText={setDraftAmount}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                marginBottom: 16,
              }}
            />

            <Select
              label="Classification"
              value={draftClassification}
              options={[
                { label: 'Expense', value: 'expense' },
                { label: 'Income', value: 'income' },
              ]}
              onChange={(value) => setDraftClassification(value as StatementClassification)}
            />

            <Select
              label="Category"
              value={draftCategoryId}
              options={categoryOptions}
              onChange={setDraftCategoryId}
              placeholder="Select a category"
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 24,
              }}
            >
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 4 }}>Ignore transaction</Text>
                <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
                  Ignored rows stay out of the final import.
                </Text>
              </View>
              <Switch value={draftIgnored} onValueChange={setDraftIgnored} />
            </View>

            {editingRow?.validationErrors?.length ? (
              <View
                style={{
                  backgroundColor: `${colors.warning}15`,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 20,
                }}
              >
                {editingRow.validationErrors.map((error) => (
                  <Text key={error} style={{ color: colors.warning, marginBottom: 4 }}>
                    {error}
                  </Text>
                ))}
              </View>
            ) : null}

            <Button title="Save Changes" onPress={saveEditor} fullWidth loading={updateRow.isPending} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
