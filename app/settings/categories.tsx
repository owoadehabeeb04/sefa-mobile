/**
 * Categories Management Screen
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useGroupedCategories, useCreateCategory, useDeleteCategory, useSyncCategories } from '@/features/categories/category.hooks';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';

const colors = Colors.light;

// Icon options for categories
const ICON_OPTIONS = [
  { value: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { value: 'car', label: 'Car', icon: 'car' },
  { value: 'home', label: 'Home', icon: 'home' },
  { value: 'shopping-cart', label: 'Shopping', icon: 'cart' },
  { value: 'medical', label: 'Medical', icon: 'medical' },
  { value: 'school', label: 'Education', icon: 'school' },
  { value: 'fitness', label: 'Fitness', icon: 'fitness' },
  { value: 'airplane', label: 'Travel', icon: 'airplane' },
  { value: 'gift', label: 'Gift', icon: 'gift' },
  { value: 'briefcase', label: 'Work', icon: 'briefcase' },
  { value: 'wallet', label: 'Wallet', icon: 'wallet' },
  { value: 'cash', label: 'Cash', icon: 'cash' },
  { value: 'card', label: 'Card', icon: 'card' },
  { value: 'folder', label: 'Folder', icon: 'folder' },
];

// Color options
const COLOR_OPTIONS = [
  { value: '#3498db', label: 'Blue' },
  { value: '#e74c3c', label: 'Red' },
  { value: '#2ecc71', label: 'Green' },
  { value: '#f39c12', label: 'Orange' },
  { value: '#9b59b6', label: 'Purple' },
  { value: '#1abc9c', label: 'Teal' },
  { value: '#e67e22', label: 'Dark Orange' },
  { value: '#34495e', label: 'Dark Blue' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const { data: groupedCategories, isLoading, refetch } = useGroupedCategories();
  const { mutateAsync: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteCategory();
  const { mutateAsync: syncCategories, isPending: isSyncing } = useSyncCategories();

  const [showAddForm, setShowAddForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#3498db');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      setToastMessage('Category name is required');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      await createCategory({
        name: categoryName.trim(),
        type: categoryType,
        icon: selectedIcon,
        color: selectedColor,
      });

      setToastMessage('Category created successfully');
      setToastType('success');
      setShowToast(true);
      setCategoryName('');
      setShowAddForm(false);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to create category');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string, isSystem: boolean) => {
    if (isSystem) {
      Alert.alert('Cannot Delete', 'System categories cannot be deleted. You can only disable them.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(categoryId);
              setToastMessage('Category deleted successfully');
              setToastType('success');
              setShowToast(true);
            } catch (error: any) {
              setToastMessage(error?.message || 'Failed to delete category');
              setToastType('error');
              setShowToast(true);
            }
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    try {
      await syncCategories();
      setToastMessage('Categories synced successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to sync categories');
      setToastType('error');
      setShowToast(true);
    }
  };

  const renderCategoryItem = (category: any) => (
    <View
      key={category.id}
      className="flex-row items-center py-3 px-4 rounded-xl mb-2"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${category.color || colors.primary}15` }}
      >
        <Ionicons
          name={category.icon as any}
          size={20}
          color={category.color || colors.primary}
        />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold" style={{ color: colors.text }}>
          {category.name}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
          {category.source === 'system' ? 'System Category' : 'Custom Category'}
        </Text>
      </View>
      {category.source === 'user' && (
        <TouchableOpacity
          onPress={() => handleDeleteCategory(category.id, category.name, false)}
          className="p-2"
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

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
          Categories
        </Text>
        <TouchableOpacity
          onPress={handleSync}
          disabled={isSyncing}
          className="p-2"
        >
          <Ionicons
            name="refresh"
            size={24}
            color={isSyncing ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleSync}
            tintColor={colors.primary}
          />
        }
      >
        {/* Add Category Form */}
        {showAddForm && (
          <View
            className="p-5 rounded-2xl mb-6"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>
              Add New Category
            </Text>

            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Category name"
              placeholderTextColor={colors.textTertiary}
              className="rounded-xl border px-4 py-3 mb-4"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                color: colors.text,
                fontSize: 15,
                lineHeight: 20,
                paddingVertical: 0,
              }}
            />

            <Select
              label="Type"
              value={categoryType}
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
              onSelect={(value) => setCategoryType(value as 'income' | 'expense')}
            />

            <Select
              label="Icon"
              value={selectedIcon}
              options={ICON_OPTIONS.map((icon) => ({
                value: icon.value,
                label: icon.label,
                icon: icon.icon,
              }))}
              onSelect={setSelectedIcon}
              containerClassName="mt-4"
            />

            <Select
              label="Color"
              value={selectedColor}
              options={COLOR_OPTIONS}
              onSelect={setSelectedColor}
              containerClassName="mt-4"
            />

            <View className="flex-row mt-4">
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setShowAddForm(false);
                  setCategoryName('');
                }}
                className="flex-1 mr-2"
              />
              <Button
                title="Create"
                onPress={handleCreateCategory}
                loading={isCreating}
                className="flex-1 ml-2"
              />
            </View>
          </View>
        )}

        {/* Expense Categories */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold" style={{ color: colors.textTertiary }}>
              EXPENSE CATEGORIES ({groupedCategories?.expense?.length || 0})
            </Text>
            {!showAddForm && (
              <TouchableOpacity
                onPress={() => {
                  setCategoryType('expense');
                  setShowAddForm(true);
                }}
                className="px-3 py-1 rounded-lg"
                style={{ backgroundColor: colors.primaryBackground }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  + Add
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {groupedCategories?.expense?.map(renderCategoryItem)}
          {(!groupedCategories?.expense || groupedCategories.expense.length === 0) && (
            <Text className="text-sm text-center py-4" style={{ color: colors.textTertiary }}>
              No expense categories yet
            </Text>
          )}
        </View>

        {/* Income Categories */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold" style={{ color: colors.textTertiary }}>
              INCOME CATEGORIES ({groupedCategories?.income?.length || 0})
            </Text>
            {!showAddForm && (
              <TouchableOpacity
                onPress={() => {
                  setCategoryType('income');
                  setShowAddForm(true);
                }}
                className="px-3 py-1 rounded-lg"
                style={{ backgroundColor: colors.primaryBackground }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  + Add
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {groupedCategories?.income?.map(renderCategoryItem)}
          {(!groupedCategories?.income || groupedCategories.income.length === 0) && (
            <Text className="text-sm text-center py-4" style={{ color: colors.textTertiary }}>
              No income categories yet
            </Text>
          )}
        </View>
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
