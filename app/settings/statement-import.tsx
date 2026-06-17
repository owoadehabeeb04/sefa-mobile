import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { Button } from '@/src/components/common/Button';
import { Toast } from '@/src/components/common/Toast';
import { Colors } from '@/constants/theme';
import { FadeUp, AnimatedScreenSection } from '@/src/components/motion';
import { useUploadStatementImport, useStatementImports } from '@/features/statements/statement.hooks';

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Unknown';

const statusColor = (status: string, colors: typeof Colors.light) => {
  switch (status) {
    case 'imported': return colors.success;
    case 'failed':
    case 'cancelled': return colors.error;
    case 'reviewing': return colors.primary;
    default: return colors.warning;
  }
};

const statusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');

export default function StatementImportScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const uploadStatement = useUploadStatementImport();
  const { data: imports = [], isLoading, refetch } = useStatementImports();

  const activeImport = useMemo(
    () => imports.find((item) => ['uploaded', 'extracting', 'parsed', 'reviewing'].includes(item.status)),
    [imports],
  );

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const statementImport = await uploadStatement.mutateAsync(result.assets[0]);
      router.push(`/settings/statement-import/${statementImport.id}` as any);
    } catch (error: any) {
      setToastMessage(error?.message || 'Could not upload statement. Please try again.');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const openImport = (id: string) => router.push(`/settings/statement-import/${id}` as any);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

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
          Statement Imports
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={{ padding: 4 }}>
          <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </FadeUp>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload Card */}
        <AnimatedScreenSection
          index={0}
          style={{
            backgroundColor: colors.primaryBackground,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: `${colors.success}18`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Ionicons name="document-text-outline" size={24} color={colors.success} />
          </View>

          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
            Upload a bank statement
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 18 }}>
            {activeImport
              ? 'You can start a new statement anytime, even while another one is still processing.'
              : 'Upload a PDF and SEFA will extract transactions for you to review before saving.'}
          </Text>

          {/* Uploading a fresh statement is always available — each upload is its
              own import, so a new one can start while another is in progress. */}
          <Button
            title="Upload PDF Statement"
            onPress={handlePickFile}
            fullWidth
            loading={uploadStatement.isPending}
          />

          {activeImport ? (
            <Button
              title={`Continue current import · ${statusLabel(activeImport.status)}`}
              onPress={() => openImport(activeImport.id)}
              variant="outline"
              fullWidth
              className="mt-3"
            />
          ) : null}

          <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 12, textAlign: 'center' }}>
            PDF only · You review everything before it saves
          </Text>
        </AnimatedScreenSection>

        {/* History */}
        <AnimatedScreenSection index={1}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 14 }}>
            History
          </Text>

          {isLoading ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : imports.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                No imports yet. Upload a statement to get started.
              </Text>
            </View>
          ) : (
            imports.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => openImport(item.id)}
                activeOpacity={0.75}
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: index === imports.length - 1 ? 0 : 10,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3 }}
                      numberOfLines={1}
                    >
                      {item.fileName}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: `${statusColor(item.status, colors)}15`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: statusColor(item.status, colors),
                      }}
                    >
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: `${item.importedRows} imported`, color: colors.success },
                    { label: `${item.duplicateRows} duplicates`, color: colors.textTertiary },
                    { label: `${item.needsReviewRows} to review`, color: colors.warning },
                  ].map(({ label, color }) => (
                    <View
                      key={label}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: colors.background,
                      }}
                    >
                      <Text style={{ fontSize: 11, color }}>{label}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))
          )}
        </AnimatedScreenSection>
      </ScrollView>
    </SafeAreaView>
  );
}
