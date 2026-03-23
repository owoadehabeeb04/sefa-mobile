/**
 * Import Statement Screen
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { useUploadStatement } from '@/features/import/import.hooks';

const colors = Colors.light;

export default function ImportStatementScreen() {
  const router = useRouter();
  const uploadStatement = useUploadStatement();

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [bankHint, setBankHint] = useState('');
  const [accountNumberHint, setAccountNumberHint] = useState('');

  const fileLabel = useMemo(() => {
    if (!selectedFile) return 'No file selected';
    const sizeKb = selectedFile.size ? Math.round(selectedFile.size / 1024) : null;
    return `${selectedFile.name}${sizeKb ? ` • ${sizeKb} KB` : ''}`;
  }, [selectedFile]);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setToastMessage('Please select a CSV or PDF file');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const response = await uploadStatement.mutateAsync({
        file: {
          uri: selectedFile.uri,
          name: selectedFile.name,
          mimeType: selectedFile.mimeType || undefined,
        },
        metadata: {
          bankHint: bankHint.trim() || undefined,
          accountNumberHint: accountNumberHint.replace(/\D+/g, '').slice(-4) || undefined,
        },
      });

      const importJobId = response.data?.importJobId;
      setToastMessage('Statement uploaded successfully');
      setToastType('success');
      setShowToast(true);

      if (importJobId) {
        router.push(`/settings/import-details/${importJobId}`);
      }
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to upload statement');
      setToastType('error');
      setShowToast(true);
    }
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
          Import Statement
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>
              Upload a CSV or PDF statement to import transactions. If a PDF scan is messy, you can
              add an optional bank hint and the last 4 account digits to improve detection.
            </Text>
          </View>
        </View>

        <View
          className="p-5 rounded-2xl mb-4"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Selected File
          </Text>
          <Text className="text-base font-semibold mt-1" style={{ color: colors.text }}>
            {fileLabel}
          </Text>
          <TouchableOpacity
            onPress={handlePickFile}
            className="mt-4 px-4 py-3 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
            <Text className="text-sm font-semibold ml-2" style={{ color: colors.primary }}>
              Choose File
            </Text>
          </TouchableOpacity>
        </View>

        <View
          className="p-5 rounded-2xl mb-4"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            Optional import hints
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Use this only when the statement header is blurry or the bank name is hard to read.
          </Text>

          <View className="mt-4">
            <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
              Bank hint
            </Text>
            <TextInput
              value={bankHint}
              onChangeText={setBankHint}
              placeholder="e.g. OPay, GTBank, Access Bank"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              className="px-4 py-3 rounded-xl"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          <View className="mt-4">
            <Text className="text-xs mb-2" style={{ color: colors.textSecondary }}>
              Account last 4 digits
            </Text>
            <TextInput
              value={accountNumberHint}
              onChangeText={(value) => setAccountNumberHint(value.replace(/\D+/g, '').slice(-4))}
              placeholder="1234"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={4}
              className="px-4 py-3 rounded-xl"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Text className="text-xs mt-2" style={{ color: colors.textTertiary }}>
              We only send the last 4 digits, never the full account number.
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Button
            title={uploadStatement.isPending ? 'Uploading...' : 'Upload Statement'}
            onPress={handleUpload}
            disabled={uploadStatement.isPending}
            loading={uploadStatement.isPending}
          />
        </View>

        {uploadStatement.isPending && (
          <View className="items-center">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
              Processing upload...
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push('/settings/import-history')}
          className="mt-4 px-4 py-3 rounded-xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
          <Text className="text-sm font-semibold ml-2" style={{ color: colors.textSecondary }}>
            View Import History
          </Text>
        </TouchableOpacity>
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
