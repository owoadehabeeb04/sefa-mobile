/**
 * Transaction Details Route
 */

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import TransactionDetailsScreen from '@/screens/transactions/TransactionDetailsScreen';
import * as SecureStore from 'expo-secure-store';
import type { Transaction } from '@/features/transactions/transaction.hooks';
import { View, Text, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TransactionDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        const transactionData = await SecureStore.getItemAsync('transactionDetails');
        if (transactionData) {
          setTransaction(JSON.parse(transactionData));
          await SecureStore.deleteItemAsync('transactionDetails');
        }
      } catch (error) {
        console.error('Error loading transaction:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTransaction();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.text }}>Transaction not found</Text>
      </View>
    );
  }

  return <TransactionDetailsScreen transaction={transaction} />;
}
