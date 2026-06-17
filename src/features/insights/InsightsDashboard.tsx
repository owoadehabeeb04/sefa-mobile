import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ChartEmptyState, InsightsDonutChart } from './insights.charts';
import { useInsightsDashboard, useInsightsSummaryStream } from './dashboard.hooks';
import type { InsightsVisualCategory } from './insights.types';
import type {
  BudgetHealthItem,
  BudgetStatus,
  SavingsConfidence,
  SavingsOpportunity,
  SpendingDrivers,
} from './dashboard.types';

const formatMoney = (value: number) => `N${Math.round(value || 0).toLocaleString()}`;
const formatPercent = (value: number) => `${Math.round(value || 0)}%`;

const budgetStatusColor = (status: BudgetStatus, colors: typeof Colors.light) => {
  if (status === 'over_budget') return colors.error;
  if (status === 'close_to_limit') return colors.warning;
  if (status === 'no_budget') return colors.textTertiary;
  return colors.success;
};

const budgetStatusLabel = (status: BudgetStatus) => {
  if (status === 'over_budget') return 'Over budget';
  if (status === 'close_to_limit') return 'Close to limit';
  if (status === 'no_budget') return 'No budget';
  return 'Within budget';
};

const confidenceColor = (confidence: SavingsConfidence, colors: typeof Colors.light) => {
  if (confidence === 'high') return colors.success;
  if (confidence === 'medium') return colors.warning;
  return colors.textSecondary;
};

function Card({ children, accentColor }: { children: React.ReactNode; accentColor?: string }) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <View
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 16,
        marginBottom: 10,
        overflow: 'hidden',
        flexDirection: 'row',
      }}
    >
      {accentColor ? <View style={{ width: 4, backgroundColor: accentColor }} /> : null}
      <View style={{ flex: 1, padding: 16 }}>{children}</View>
    </View>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 2 }}>{title}</Text>
      {!!subtitle && (
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>{subtitle}</Text>
      )}
      {children}
    </View>
  );
}

/** Layer 1 — financial snapshot cards. */
function SnapshotCards({
  income,
  expenses,
  balance,
  spendingRate,
}: {
  income: number;
  expenses: number;
  balance: number;
  spendingRate: number;
}) {
  const colors = Colors[useColorScheme() ?? 'light'];
  const cards = [
    { label: 'Income', value: formatMoney(income), color: colors.success, icon: 'arrow-down-circle-outline' as const },
    { label: 'Expenses', value: formatMoney(expenses), color: colors.error, icon: 'arrow-up-circle-outline' as const },
    {
      label: 'Balance',
      value: formatMoney(balance),
      color: balance >= 0 ? colors.primary : colors.error,
      icon: 'wallet-outline' as const,
    },
    {
      label: 'Spending rate',
      value: income > 0 ? formatPercent(spendingRate * 100) : '—',
      color: colors.info,
      icon: 'speedometer-outline' as const,
    },
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {cards.map((card) => (
        <View
          key={card.label}
          style={{
            flexGrow: 1,
            flexBasis: '46%',
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 16,
            padding: 14,
          }}
        >
          <Ionicons name={card.icon} size={18} color={card.color} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>{card.label}</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 2 }}>{card.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** Layer 3 — spending drivers ("what's taking most of your money"). */
function DriversSection({ drivers, colors }: { drivers: SpendingDrivers; colors: typeof Colors.light }) {
  const rows: { label: string; value: string; sub?: string }[] = [];

  if (drivers.topSpendingCategory) {
    rows.push({
      label: 'Top spending',
      value: drivers.topSpendingCategory.categoryName,
      sub: `${formatMoney(drivers.topSpendingCategory.totalSpent)} · ${formatPercent(
        drivers.topSpendingCategory.percentage
      )} of spend`,
    });
  }
  if (drivers.mostFrequentCategory) {
    rows.push({
      label: 'Most frequent',
      value: drivers.mostFrequentCategory.categoryName,
      sub: `${drivers.mostFrequentCategory.transactionCount} transactions`,
    });
  }
  if (drivers.highestSingleExpense) {
    rows.push({
      label: 'Biggest single expense',
      value: formatMoney(drivers.highestSingleExpense.amount),
      sub: drivers.highestSingleExpense.categoryName,
    });
  }
  if (drivers.fastestGrowingCategory) {
    rows.push({
      label: 'Fastest growing',
      value: drivers.fastestGrowingCategory.categoryName,
      sub: `Up ${formatPercent(drivers.fastestGrowingCategory.changePercent)} vs last month`,
    });
  }

  if (!rows.length) {
    return (
      <ChartEmptyState
        message="Nothing standing out yet"
        subtext="Add more transactions and SEFA will show what's taking most of your money."
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
      />
    );
  }

  return (
    <Card accentColor={colors.warning}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingVertical: 8,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{row.label}</Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 1 }}>{row.value}</Text>
            {!!row.sub && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>{row.sub}</Text>}
          </View>
        </View>
      ))}
      {drivers.possibleMoneyLeaks.length > 0 && (
        <View style={{ marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
            Possible money leaks
          </Text>
          {drivers.possibleMoneyLeaks.map((leak) => (
            <Text key={leak.description} style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              • {leak.description} — {formatMoney(leak.total)} ({leak.occurrences}x)
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
}

/** Layer 3 — savings opportunities. */
function SavingsSection({
  opportunities,
  totalSavings,
  colors,
}: {
  opportunities: SavingsOpportunity[];
  totalSavings: number;
  colors: typeof Colors.light;
}) {
  if (!opportunities.length) {
    return (
      <ChartEmptyState
        message="No clear savings yet"
        subtext="Keep recording transactions and SEFA will surface ways to save."
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
      />
    );
  }

  return (
    <>
      <Card accentColor={colors.success}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>You could save about</Text>
        <Text style={{ color: colors.success, fontSize: 22, fontWeight: '800', marginTop: 2 }}>
          {formatMoney(totalSavings)}
        </Text>
      </Card>
      {opportunities.map((opp) => (
        <Card key={opp.id} accentColor={colors.primary}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', flex: 1, paddingRight: 10 }}>
              {opp.title}
            </Text>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
              {formatMoney(opp.estimatedSavings)}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 }}>{opp.reason}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginRight: 6,
                backgroundColor: confidenceColor(opp.confidence, colors),
              }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{opp.confidence} confidence</Text>
          </View>
        </Card>
      ))}
    </>
  );
}

/** Layer 3 — budget health. */
function BudgetHealthSection({
  hasBudgets,
  monthlyPercent,
  items,
  colors,
}: {
  hasBudgets: boolean;
  monthlyPercent: number;
  items: BudgetHealthItem[];
  colors: typeof Colors.light;
}) {
  if (!hasBudgets) {
    return (
      <ChartEmptyState
        message="No budget set yet"
        subtext="Set a budget to track your spending progress."
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
      />
    );
  }

  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Overall this month</Text>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{formatPercent(monthlyPercent)}</Text>
        </View>
        <View style={{ marginTop: 10, height: 6, borderRadius: 999, backgroundColor: colors.border }}>
          <View
            style={{
              height: 6,
              borderRadius: 999,
              width: `${Math.max(4, Math.min(monthlyPercent, 100))}%`,
              backgroundColor: monthlyPercent >= 100 ? colors.error : monthlyPercent >= 80 ? colors.warning : colors.success,
            }}
          />
        </View>
      </Card>
      {items.slice(0, 6).map((item) => {
        const accent = budgetStatusColor(item.status, colors);
        return (
          <Card key={item.categoryName} accentColor={accent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{item.categoryName}</Text>
              <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>{budgetStatusLabel(item.status)}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              {formatMoney(item.spent)} of {formatMoney(item.budgetAmount)} · {formatPercent(item.percentUsed)}
            </Text>
            <View style={{ marginTop: 8, height: 6, borderRadius: 999, backgroundColor: colors.border }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 999,
                  width: `${Math.max(4, Math.min(item.percentUsed, 100))}%`,
                  backgroundColor: item.color || accent,
                }}
              />
            </View>
          </Card>
        );
      })}
    </>
  );
}

/** Layer 4 — AI summary (streams in). */
function AiSummarySection({ period, colors }: { period?: string; colors: typeof Colors.light }) {
  const { text, summary, isStreaming, error, start } = useInsightsSummaryStream({ period });

  useEffect(() => {
    start();
  }, [start]);

  return (
    <Card accentColor={colors.primary}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>SEFA explains</Text>
        {isStreaming && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
      </View>

      {error ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Could not load the summary right now. Your numbers above are still accurate.
        </Text>
      ) : (
        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
          {text || (isStreaming ? 'Writing your summary…' : '')}
        </Text>
      )}

      {summary?.actions?.length ? (
        <View style={{ marginTop: 12 }}>
          {summary.actions.map((action) => (
            <View key={action} style={{ flexDirection: 'row', marginTop: 6 }}>
              <Text style={{ color: colors.primary, fontSize: 14, marginRight: 6 }}>•</Text>
              <Text style={{ color: colors.text, fontSize: 13, flex: 1, lineHeight: 19 }}>{action}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const toVisualCategories = (
  pie: { label: string; value: number; percentage: number; color: string }[]
): InsightsVisualCategory[] =>
  pie.map((slice) => ({
    categoryName: slice.label,
    amount: slice.value,
    percentage: slice.percentage,
    color: slice.color,
    budgetAmount: null,
    status: 'monitor',
  }));

/**
 * Financial Intelligence Dashboard tab. Renders in layers:
 *  1. snapshot cards  2. pie/category breakdown
 *  3. drivers + savings + budget health  4. AI summary (streams in)
 */
export default function InsightsDashboard({ period }: { period?: string }) {
  const colors = Colors[useColorScheme() ?? 'light'];
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(Math.min(width - 88, 420), 240);
  const { data, isLoading, error } = useInsightsDashboard({ period });

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 10 }}>Crunching your numbers…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <ChartEmptyState
        message="Could not load your dashboard"
        subtext={error instanceof Error ? error.message : 'Please pull to refresh and try again.'}
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
      />
    );
  }

  // Global empty state — no transaction data at all.
  if (!data.hasData) {
    return (
      <View style={{ paddingVertical: 48, alignItems: 'center', paddingHorizontal: 24 }}>
        <Ionicons name="receipt-outline" size={40} color={colors.primary} />
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
          No insights yet for {data.period}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
          Add transactions or import a statement to see your insights.
        </Text>
      </View>
    );
  }

  const { snapshot, spendingDrivers, savingsOpportunities, savingsSummary, budgetHealth, pieChart } = data;

  return (
    <View>
      {/* Layer 1 — financial snapshot */}
      <Section title="Your money summary" subtitle={data.period}>
        <SnapshotCards
          income={snapshot.totalIncome}
          expenses={snapshot.totalExpenses}
          balance={snapshot.balance}
          spendingRate={snapshot.spendingRate}
        />
        {snapshot.previousPeriod && snapshot.previousPeriod.expensesChangePercent != null && (
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
            Spending is {snapshot.previousPeriod.expensesChange >= 0 ? 'up' : 'down'}{' '}
            {formatPercent(Math.abs(snapshot.previousPeriod.expensesChangePercent))} vs {snapshot.previousPeriod.periodLabel}.
          </Text>
        )}
      </Section>

      {/* Layer 2 — pie / category breakdown */}
      <Section title="Where your money is going" subtitle="Top spending categories this period.">
        <Card>
          <InsightsDonutChart
            categories={toVisualCategories(pieChart)}
            width={chartWidth}
            totalLabel={formatMoney(snapshot.totalExpenses)}
            textColor={colors.text}
            secondaryTextColor={colors.textSecondary}
          />
          <View style={{ marginTop: 8 }}>
            {data.categoryBreakdown.slice(0, 6).map((entry) => (
              <View
                key={entry.categoryName}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 10, backgroundColor: entry.color }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{entry.categoryName}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
                      {formatPercent(entry.percentage)} · {entry.transactionCount} txns · avg{' '}
                      {formatMoney(entry.averageTransaction)}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{formatMoney(entry.totalSpent)}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>

      {/* Layer 3 — spending drivers */}
      <Section title="What's taking most of your money" subtitle="Your biggest spending drivers this period.">
        <DriversSection drivers={spendingDrivers} colors={colors} />
      </Section>

      {/* Layer 3 — savings opportunities */}
      <Section title="Savings opportunities" subtitle="Realistic ways to keep more of your money.">
        <SavingsSection
          opportunities={savingsOpportunities}
          totalSavings={savingsSummary.totalEstimatedSavings}
          colors={colors}
        />
      </Section>

      {/* Layer 3 — budget health */}
      <Section title="Budget health" subtitle="How your spending sits against your budgets.">
        <BudgetHealthSection
          hasBudgets={budgetHealth.hasBudgets}
          monthlyPercent={budgetHealth.monthly?.percentUsed || 0}
          items={budgetHealth.categories || []}
          colors={colors}
        />
      </Section>

      {/* Layer 4 — AI summary */}
      <Section title="Your money explained" subtitle="SEFA explains the numbers above — in plain words.">
        <AiSummarySection period={period} colors={colors} />
      </Section>
    </View>
  );
}
