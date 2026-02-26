/**
 * Add Transaction Screen
 * Single screen with toggle between Expense and Income
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import * as SecureStore from 'expo-secure-store';
import { useCategories, useSyncCategories } from '@/features/categories/category.hooks';
import { useCreateExpense, useUpdateExpense } from '@/features/expenses/expense.hooks';
import { useCreateIncome, useUpdateIncome } from '@/features/income/income.hooks';
import type { ExpenseInput } from '@/features/expenses/expense.types';
import type { IncomeInput } from '@/features/income/income.types';
import type { PaymentMethod } from '@/features/expenses/expense.types';
import type { Transaction } from '@/features/transactions/transaction.hooks';

type TransactionType = 'expense' | 'income';

export default function AddTransactionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Check if editing
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const isEditing = !!editingTransaction;

  // State
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState(''); // For income
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [location, setLocation] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Hooks
  const { data: categories, isLoading: categoriesLoading } = useCategories(transactionType);
  const syncCategories = useSyncCategories();
  const createExpense = useCreateExpense();
  const createIncome = useCreateIncome();
  const updateExpense = useUpdateExpense();
  const updateIncome = useUpdateIncome();

  // Load transaction data if editing - reload every time screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadTransaction = async () => {
        try {
          // Clear previous editing state first
          setEditingTransaction(null);
          setAmount('');
          setCategoryId('');
          setDescription('');
          setSource('');
          setLocation('');
          setDate(new Date().toISOString().split('T')[0]);
          setPaymentMethod('cash');
          setTransactionType('expense');

          // Then load new transaction if exists
          const transactionData = await SecureStore.getItemAsync('editingTransaction');
          if (transactionData) {
            const transaction = JSON.parse(transactionData) as Transaction;
            console.log('Loading transaction for edit:', transaction.id, transaction.type);
            setEditingTransaction(transaction);
            setTransactionType(transaction.type || 'expense');
            
            // Format amount with commas
            const amountValue = transaction.amount || 0;
            setAmount(amountValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            
            // Set categoryId - use the transaction's categoryId directly
            if (transaction.categoryId) {
              setCategoryId(transaction.categoryId);
            }
            
            setDescription(transaction.description || '');
            setSource((transaction as any).source || '');
            setLocation((transaction as any).location || '');
            
            // Format date properly
            if (transaction.date) {
              const dateObj = new Date(transaction.date);
              if (!isNaN(dateObj.getTime())) {
                setDate(dateObj.toISOString().split('T')[0]);
              }
            }
            
            setPaymentMethod((transaction as any).paymentMethod || 'cash');
            // Don't delete from SecureStore here - delete after successful save or when navigating away
          }
        } catch (error) {
          console.error('Error loading transaction:', error);
        }
      };
      loadTransaction();
    }, [])
  );

  // Ensure categoryId is set when categories load (for edit mode)
  useEffect(() => {
    if (isEditing && editingTransaction && categories && categories.length > 0) {
      // If categoryId is not set or doesn't match, try to find it
      if (!categoryId || !categories.find(c => c.id === categoryId)) {
        // Try to find category by the transaction's categoryId
        const matchingCategory = categories.find(c => c.id === editingTransaction.categoryId);
        if (matchingCategory) {
          setCategoryId(matchingCategory.id);
        }
      }
    }
  }, [categories, isEditing, editingTransaction, categoryId]);

  // Sync categories on mount
  useEffect(() => {
    syncCategories.mutate();
  }, []);

  // Reset category when type changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setCategoryId('');
    }
  }, [transactionType]);

  // Payment method options
  const paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Card', value: 'card' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'Mobile Money', value: 'mobile_money' },
    { label: 'Other', value: 'other' },
  ];

  // Format amount with commas
  const formatAmount = (value: string) => {
    const cleaned = value.replace(/,/g, '');
    if (cleaned && !isNaN(Number(cleaned))) {
      return Number(cleaned).toLocaleString('en-NG');
    }
    return value;
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/,/g, '');
    if (cleaned === '' || !isNaN(Number(cleaned))) {
      setAmount(formatAmount(cleaned));
    }
  };

  const validate = (): string | null => {
    const numAmount = Number(amount.replace(/,/g, ''));
    
    if (!amount || numAmount <= 0) {
      return 'Please enter a valid amount';
    }
    
    if (numAmount > 10000000) {
      return 'Amount cannot exceed ₦10,000,000';
    }
    
    if (!categoryId) {
      return 'Please select a category';
    }
    
    if (transactionType === 'income' && !source.trim()) {
      return 'Please enter an income source';
    }
    
    return null;
  };

  const handleCancelEdit = async () => {
    try {
      // Clear SecureStore
      await SecureStore.deleteItemAsync('editingTransaction');
      
      // Reset all form fields
      setEditingTransaction(null);
      setAmount('');
      setCategoryId('');
      setDescription('');
      setSource('');
      setLocation('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('cash');
      setTransactionType('expense');
      
      setToastMessage('Switched to add new transaction');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error canceling edit:', error);
    }
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      setToastMessage(error);
      setToastType('error');
      setShowToast(true);
      return;
    }

    const numAmount = Number(amount.replace(/,/g, ''));
    const transactionDate = new Date(date).toISOString();

    try {
      if (transactionType === 'expense') {
        const expenseInput: Partial<ExpenseInput> = {
          amount: numAmount,
          categoryId,
          description: description.trim() || undefined,
          date: transactionDate,
          paymentMethod,
          location: location.trim() || undefined,
        };

        if (isEditing && editingTransaction) {
          console.log('Updating expense:', editingTransaction.id, expenseInput);
          await updateExpense.mutateAsync({ 
            id: editingTransaction.id, 
            data: expenseInput 
          });
          setToastMessage('Expense updated successfully!');
        } else {
          await createExpense.mutateAsync(expenseInput as ExpenseInput);
          setToastMessage('Expense added successfully!');
        }
      } else {
        const incomeInput: Partial<IncomeInput> = {
          amount: numAmount,
          categoryId,
          source: source.trim(),
          description: description.trim() || undefined,
          date: transactionDate,
          paymentMethod,
        };

        if (isEditing && editingTransaction) {
          console.log('Updating income:', editingTransaction.id, incomeInput);
          await updateIncome.mutateAsync({ 
            id: editingTransaction.id, 
            data: incomeInput 
          });
          setToastMessage('Income updated successfully!');
        } else {
          await createIncome.mutateAsync(incomeInput as IncomeInput);
          setToastMessage('Income added successfully!');
        }
      }

      setToastType('success');
      setShowToast(true);

      // Clear SecureStore and reset form
      await SecureStore.deleteItemAsync('editingTransaction');
      
      // Reset form and navigate immediately (optimistic update shows transaction instantly)
      setTimeout(() => {
        setAmount('');
        setCategoryId('');
        setDescription('');
        setSource('');
        setLocation('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('cash');
        setEditingTransaction(null);
        
        // Navigate back to transactions tab
        router.replace('/(tabs)/transactions');
      }, 800);
    } catch (error: any) {
      console.error('Transaction error:', error);
      setToastMessage(error.message || `Failed to ${isEditing ? 'update' : 'add'} transaction`);
      setToastType('error');
      setShowToast(true);
    }
  };

  const categoryOptions = categories?.map(cat => ({
    label: cat.name,
    value: cat.id,
    icon: cat.icon,
    color: cat.color,
  })) || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      > */}
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-3">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-1">
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                  {isEditing ? 'Edit Transaction' : 'Add Transaction'}
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  {isEditing ? 'Update your transaction details' : 'Record your expense or income'}
                </Text>
              </View>
              
              {/* Cancel Edit Button - Only shows when editing */}
              {isEditing && (
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  className="flex-row items-center px-4 py-2 rounded-xl"
                  style={{ backgroundColor: colors.backgroundSecondary }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  <Text className="text-sm font-medium ml-2" style={{ color: colors.textSecondary }}>
                    New
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Type Toggle */}
          <View className="mx-6 mb-6">
            <View
              className="flex-row p-1 rounded-2xl"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <TouchableOpacity
                onPress={() => setTransactionType('expense')}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor:
                    transactionType === 'expense' ? colors.error : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: transactionType === 'expense' ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTransactionType('income')}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor:
                    transactionType === 'income' ? colors.success : 'transparent',
                }}
                activeOpacity={0.7}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: transactionType === 'income' ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View className="px-6 gap-5">
            {/* Amount */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Amount *
              </Text>
              <View
                className="flex-row items-center px-4 py-4 rounded-xl"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <Text className="text-2xl font-bold mr-2" style={{ color: colors.text }}>
                  ₦
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  returnKeyType="next"
                  className="flex-1"
                  style={{
                    color: colors.text,
                    fontSize: 24,
                    lineHeight: 28,
                    paddingVertical: 0,
                  }}
                />
              </View>
            </View>

            {/* Category */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Category *
              </Text>
              <Select
                options={categoryOptions}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select category"
              />
            </View>

            {/* Source (Income only) */}
            {transactionType === 'income' && (
              <View>
                <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Source *
                </Text>
                <TextInput
                  value={source}
                  onChangeText={setSource}
                  placeholder="e.g., Salary, Freelance, Gift"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="next"
                  className="px-4 py-4 rounded-xl"
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    fontSize: 15,
                    lineHeight: 20,
                    paddingVertical: 0,
                  }}
                />
              </View>
            )}

            {/* Description */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add a note (optional)"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="next"
                blurOnSubmit={false}
                className="px-4 py-4 rounded-xl"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  fontSize: 15,
                  lineHeight: 20,
                  paddingVertical: 0,
                  minHeight: 80,
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Date */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Date
              </Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="next"
                className="px-4 py-4 rounded-xl"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  fontSize: 15,
                  lineHeight: 20,
                  paddingVertical: 0,
                }}
              />
            </View>

            {/* Payment Method */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Payment Method
              </Text>
              <Select
                options={paymentMethods}
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value as PaymentMethod)}
                placeholder="Select payment method"
              />
            </View>

            {/* Location (Expense only) */}
            {transactionType === 'expense' && (
              <View>
                <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Location
                </Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Where did you spend? (optional)"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="done"
                  className="px-4 py-4 rounded-xl"
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    fontSize: 15,
                    lineHeight: 20,
                    paddingVertical: 0,
                  }}
                />
              </View>
            )}

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              loading={createExpense.isPending || createIncome.isPending || updateExpense.isPending || updateIncome.isPending}
              disabled={createExpense.isPending || createIncome.isPending || updateExpense.isPending || updateIncome.isPending}
            >
              {isEditing 
                ? 'Update Transaction'
                : transactionType === 'expense' ? 'Add Expense' : 'Add Income'
              }
            </Button>
          </View>
        </ScrollView>
      {/* </KeyboardAvoidingView> */}

      {/* Toast */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}
