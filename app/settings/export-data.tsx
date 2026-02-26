/**
 * Export Data Screen
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { getLocalExpenses } from '@/features/expenses/expense.service';
import { getLocalIncome } from '@/features/income/income.service';
import { getLocalCategories } from '@/features/categories/category.service';

const colors = Colors.light;

export default function ExportDataScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Fetch all data from API
      const [expenses, income, categories] = await Promise.all([
        getLocalExpenses(),
        getLocalIncome(),
        getLocalCategories(),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        data: {
          expenses,
          income,
          categories,
        },
        summary: {
          totalExpenses: expenses.length,
          totalIncome: income.length,
          totalCategories: categories.length,
        },
      };

      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);
      const fileName = `sefa-export-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystemLegacy.documentDirectory}${fileName}`;

      // Write file using legacy API (compatible with current expo-file-system)
      await FileSystemLegacy.writeAsStringAsync(fileUri, jsonData);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
        setToastMessage('Data exported successfully');
        setToastType('success');
      } else {
        setToastMessage('Sharing is not available on this device');
        setToastType('error');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error?.message || 'Failed to export data';
      setToastMessage(`Export failed: ${errorMessage}`);
      setToastType('error');
    } finally {
      setIsExporting(false);
      setShowToast(true);
    }
  };

  const handleExport = () => {
    Alert.alert(
      'Export Data',
      'This will export all your financial data (expenses, income, categories) to a JSON file. The file will be saved to your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: exportData,
        },
      ]
    );
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
          Export Data
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <View className="flex-row items-center mb-4">
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>
              Export all your financial data to a JSON file. This includes all transactions, categories, and settings.
            </Text>
          </View>
        </View>

        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            What will be exported:
          </Text>
          <View className="mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • All expenses
            </Text>
          </View>
          <View className="mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • All income entries
            </Text>
          </View>
          <View className="mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • All categories
            </Text>
          </View>
          <View>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Export metadata (date, version)
            </Text>
          </View>
        </View>

        <Button
          title="Export Data"
          onPress={handleExport}
          loading={isExporting}
        />
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
