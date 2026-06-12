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
import { AnimatedListItem, AnimatedScreenSection, FadeUp } from '@/src/components/motion';

const colors = Colors.light;

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
  const { data: groupedCategories } = useGroupedCategories();
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
      setToastMessage('Category created');
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
      Alert.alert('Cannot Delete', 'System categories cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Delete "${categoryName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(categoryId);
              setToastMessage('Category deleted');
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
      setToastMessage('Categories synced');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to sync categories');
      setToastType('error');
      setShowToast(true);
    }
  };

  const renderCategoryItem = (category: any, index: number, total: number) => (
    <AnimatedListItem
      key={category.id}
      index={index}
      total={total}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: colors.backgroundSecondary,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          backgroundColor: `${category.color || colors.primary}18`,
        }}
      >
        <Ionicons name={category.icon as any} size={18} color={category.color || colors.primary} />
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.text }}>
        {category.name}
      </Text>
      {category.source === 'user' && (
        <TouchableOpacity
          onPress={() => handleDeleteCategory(category.id, category.name, false)}
          style={{ padding: 6 }}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      )}
    </AnimatedListItem>
  );

  const SectionHeader = ({
    label,
    count,
    type,
  }: {
    label: string;
    count: number;
    type: 'expense' | 'income';
  }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{label}</Text>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: colors.backgroundSecondary,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.textTertiary, fontWeight: '600' }}>{count}</Text>
        </View>
      </View>
      {!showAddForm && (
        <TouchableOpacity
          onPress={() => {
            setCategoryType(type);
            setShowAddForm(true);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: colors.primaryBackground,
            gap: 4,
          }}
        >
          <Ionicons name="add" size={14} color={colors.primary} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
          Categories
        </Text>
        <TouchableOpacity onPress={handleSync} disabled={isSyncing} style={{ padding: 4 }}>
          <Ionicons
            name="refresh-outline"
            size={20}
            color={isSyncing ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>
      </FadeUp>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={handleSync} tintColor={colors.primary} />
        }
      >
        {/* Add Form */}
        {showAddForm && (
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
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                New Category
              </Text>
              <TouchableOpacity
                onPress={() => { setShowAddForm(false); setCategoryName(''); }}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Category name"
              placeholderTextColor={colors.textTertiary}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 13,
                color: colors.text,
                fontSize: 15,
                marginBottom: 14,
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
              options={ICON_OPTIONS.map((icon) => ({ value: icon.value, label: icon.label, icon: icon.icon }))}
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

            <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => { setShowAddForm(false); setCategoryName(''); }}
                className="flex-1"
              />
              <Button
                title="Create"
                onPress={handleCreateCategory}
                loading={isCreating}
                className="flex-1"
              />
            </View>
          </AnimatedScreenSection>
        )}

        {/* Expense Categories */}
        <AnimatedScreenSection index={showAddForm ? 1 : 0} style={{ marginBottom: 24 }}>
          <SectionHeader
            label="Expense"
            count={groupedCategories?.expense?.length || 0}
            type="expense"
          />
          {groupedCategories?.expense?.map((category, index, list) =>
            renderCategoryItem(category, index, list.length)
          )}
          {(!groupedCategories?.expense || groupedCategories.expense.length === 0) && (
            <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center', paddingVertical: 16 }}>
              No expense categories yet
            </Text>
          )}
        </AnimatedScreenSection>

        {/* Income Categories */}
        <AnimatedScreenSection index={showAddForm ? 2 : 1} style={{ marginBottom: 16 }}>
          <SectionHeader
            label="Income"
            count={groupedCategories?.income?.length || 0}
            type="income"
          />
          {groupedCategories?.income?.map((category, index, list) =>
            renderCategoryItem(category, index, list.length)
          )}
          {(!groupedCategories?.income || groupedCategories.income.length === 0) && (
            <Text style={{ fontSize: 13, color: colors.textTertiary, textAlign: 'center', paddingVertical: 16 }}>
              No income categories yet
            </Text>
          )}
        </AnimatedScreenSection>
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
