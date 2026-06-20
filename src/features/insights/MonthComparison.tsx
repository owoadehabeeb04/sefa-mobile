import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInsightsDashboard } from './dashboard.hooks';
import type { CategoryBreakdownItem, DashboardData } from './dashboard.types';

const formatMoney = (value: number) => `N${Math.round(value || 0).toLocaleString()}`;

/** Build the last `count` selectable months as { key: 'YYYY-MM', label: 'June 2026' }. */
const buildMonthOptions = (count = 12): { key: string; label: string }[] => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return { key, label };
  });
};

const labelForKey = (key: string) => {
  const [year, month] = key.split('-').map((part) => parseInt(part, 10));
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const pctChange = (current: number, base: number): number | null =>
  base ? Number((((current - base) / base) * 100).toFixed(1)) : null;

/** A change cell: arrow + percent, coloured by whether the move is good or bad. */
function ChangeText({
  current,
  base,
  goodWhenUp,
  colors,
}: {
  current: number;
  base: number;
  goodWhenUp: boolean;
  colors: typeof Colors.light;
}) {
  const change = pctChange(current, base);
  if (change == null) {
    return <Text style={{ color: colors.textTertiary, fontSize: 13 }}>—</Text>;
  }
  if (change === 0) {
    return <Text style={{ color: colors.textSecondary, fontSize: 13 }}>0%</Text>;
  }
  const isUp = change > 0;
  const isGood = isUp === goodWhenUp;
  return (
    <Text style={{ color: isGood ? colors.success : colors.error, fontSize: 13, fontWeight: '600' }}>
      {isUp ? '▲' : '▼'} {Math.abs(change)}%
    </Text>
  );
}

/** Single comparison row: label | A value | B value | change. */
function CompareRow({
  label,
  a,
  b,
  goodWhenUp,
  colors,
  emphasise,
}: {
  label: string;
  a: number;
  b: number;
  goodWhenUp: boolean;
  colors: typeof Colors.light;
  emphasise?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1.2 }}>{label}</Text>
      <Text
        style={{ color: colors.text, fontSize: 13, fontWeight: emphasise ? '700' : '500', flex: 1.4, textAlign: 'right' }}
      >
        {formatMoney(a)}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1.4, textAlign: 'right' }}>
        {formatMoney(b)}
      </Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <ChangeText current={a} base={b} goodWhenUp={goodWhenUp} colors={colors} />
      </View>
    </View>
  );
}

/** Tappable pill that opens the month picker. */
function MonthPill({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: typeof Colors.light;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
    </Pressable>
  );
}

function MonthPickerModal({
  visible,
  options,
  selectedKey,
  disabledKey,
  onSelect,
  onClose,
  colors,
}: {
  visible: boolean;
  options: { key: string; label: string }[];
  selectedKey: string;
  disabledKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
  colors: typeof Colors.light;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
      >
        <Pressable
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 12,
            paddingBottom: 28,
            maxHeight: '70%',
          }}
        >
          <View style={{ alignItems: 'center', paddingBottom: 8 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', paddingHorizontal: 20, paddingVertical: 8 }}>
            Choose a month
          </Text>
          <ScrollView>
            {options.map((option) => {
              const isSelected = option.key === selectedKey;
              const isDisabled = option.key === disabledKey;
              return (
                <Pressable
                  key={option.key}
                  disabled={isDisabled}
                  onPress={() => {
                    onSelect(option.key);
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: isSelected ? '700' : '400' }}>
                    {option.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  {isDisabled && !isSelected && (
                    <Text style={{ color: colors.textTertiary, fontSize: 12 }}>in use</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Category-by-category spend comparison across the two months. */
function CategoryCompare({
  a,
  b,
  colors,
}: {
  a: CategoryBreakdownItem[];
  b: CategoryBreakdownItem[];
  colors: typeof Colors.light;
}) {
  const rows = useMemo(() => {
    const map = new Map<string, { name: string; color: string; a: number; b: number }>();
    a.forEach((entry) => {
      map.set(entry.categoryName, { name: entry.categoryName, color: entry.color, a: entry.totalSpent, b: 0 });
    });
    b.forEach((entry) => {
      const existing = map.get(entry.categoryName);
      if (existing) existing.b = entry.totalSpent;
      else map.set(entry.categoryName, { name: entry.categoryName, color: entry.color, a: 0, b: entry.totalSpent });
    });
    return Array.from(map.values())
      .sort((left, right) => Math.max(right.a, right.b) - Math.max(left.a, left.b))
      .slice(0, 8);
  }, [a, b]);

  if (!rows.length) return null;

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>By category</Text>
      {rows.map((row) => (
        <View
          key={row.name}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 9,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1.2, paddingRight: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 8, backgroundColor: row.color }} />
            <Text style={{ color: colors.text, fontSize: 13 }} numberOfLines={1}>
              {row.name}
            </Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 13, flex: 1.4, textAlign: 'right' }}>{formatMoney(row.a)}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1.4, textAlign: 'right' }}>
            {formatMoney(row.b)}
          </Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <ChangeText current={row.a} base={row.b} goodWhenUp={false} colors={colors} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Side-by-side comparison of two chosen months. */
export function MonthComparison() {
  const colors = Colors[useColorScheme() ?? 'light'];
  const monthOptions = useMemo(() => buildMonthOptions(12), []);

  const [monthAKey, setMonthAKey] = useState(monthOptions[0].key);
  const [monthBKey, setMonthBKey] = useState(monthOptions[1]?.key ?? monthOptions[0].key);
  const [picking, setPicking] = useState<null | 'a' | 'b'>(null);

  const monthA = useInsightsDashboard({ period: monthAKey });
  const monthB = useInsightsDashboard({ period: monthBKey });

  const loading = monthA.isLoading || monthB.isLoading;
  const a: DashboardData | undefined = monthA.data;
  const b: DashboardData | undefined = monthB.data;

  const headerRow = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 6 }}>
      <Text style={{ flex: 1.2 }} />
      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', flex: 1.4, textAlign: 'right' }}>
        {labelForKey(monthAKey).split(' ')[0]}
      </Text>
      <Text style={{ color: colors.textTertiary, fontSize: 12, fontWeight: '700', flex: 1.4, textAlign: 'right' }}>
        {labelForKey(monthBKey).split(' ')[0]}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' }}>
        Change
      </Text>
    </View>
  );

  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
      }}
    >
      {/* Selectors */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <MonthPill label={labelForKey(monthAKey)} onPress={() => setPicking('a')} colors={colors} />
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>vs</Text>
        <MonthPill label={labelForKey(monthBKey)} onPress={() => setPicking('b')} colors={colors} />
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : !a || !b ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 12 }}>
          Could not load these months. Pull to refresh and try again.
        </Text>
      ) : (
        <>
          {headerRow}
          <CompareRow label="Income" a={a.snapshot.totalIncome} b={b.snapshot.totalIncome} goodWhenUp colors={colors} />
          <CompareRow
            label="Expenses"
            a={a.snapshot.totalExpenses}
            b={b.snapshot.totalExpenses}
            goodWhenUp={false}
            colors={colors}
            emphasise
          />
          <CompareRow label="Balance" a={a.snapshot.balance} b={b.snapshot.balance} goodWhenUp colors={colors} />

          {!a.hasData && (
            <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 10 }}>
              No transactions recorded in {labelForKey(monthAKey)}.
            </Text>
          )}
          {!b.hasData && (
            <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 4 }}>
              No transactions recorded in {labelForKey(monthBKey)}.
            </Text>
          )}

          <CategoryCompare a={a.categoryBreakdown} b={b.categoryBreakdown} colors={colors} />
        </>
      )}

      <MonthPickerModal
        visible={picking !== null}
        options={monthOptions}
        selectedKey={picking === 'a' ? monthAKey : monthBKey}
        disabledKey={picking === 'a' ? monthBKey : monthAKey}
        onSelect={(key) => (picking === 'a' ? setMonthAKey(key) : setMonthBKey(key))}
        onClose={() => setPicking(null)}
        colors={colors}
      />
    </View>
  );
}

export default MonthComparison;
