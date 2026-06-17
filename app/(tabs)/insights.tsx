import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useInsightsHub,
  useWhatIfScenario,
} from '@/features/insights/insights.hooks';
import {
  ChartEmptyState,
  InsightsCategoryBarChart,
  InsightsDonutChart,
  InsightsSparkline,
  InsightsTrendChart,
} from '@/features/insights/insights.charts';
import InsightsDashboard from '@/features/insights/InsightsDashboard';
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';
import type {
  InsightAction,
  InsightAnomalyAlert,
  InsightEvidenceCard,
  InsightTextSection,
} from '@/features/insights/insights.types';
import { useSensitiveActionSecurity } from '@/features/security/useSensitiveActionSecurity';

const formatMoney = (value: number) => `N${Math.round(value || 0).toLocaleString()}`;
const formatPercent = (value: number) => `${Math.round(value || 0)}%`;

const getSeverityColor = (severity: string, colors: typeof Colors.light) => {
  if (severity === 'critical' || severity === 'high') return colors.error;
  if (severity === 'medium') return colors.warning;
  return colors.info;
};

const getRiskTagLabel = (riskTag: string) => {
  if (riskTag === 'possible_fraud') return 'Looks risky';
  if (riskTag === 'possible_error') return 'May be a mistake';
  return 'Looks normal';
};

const getSeverityLabel = (severity: string) => {
  if (severity === 'critical') return 'Check now';
  if (severity === 'high') return 'High';
  if (severity === 'medium') return 'Watch';
  return 'Low';
};

const getBudgetStatusColor = (status: string, colors: typeof Colors.light) => {
  if (status === 'over' || status === 'breach_likely') return colors.error;
  if (status === 'watch') return colors.warning;
  return colors.success;
};

const getMainUpdateColor = (status: string, colors: typeof Colors.light) => {
  if (status === 'at_risk') return colors.error;
  if (status === 'watch') return colors.warning;
  return colors.success;
};

const getTrendLineLabel = (direction: string) => {
  if (direction === 'rising') return 'Spending is going up this month.';
  if (direction === 'falling') return 'Spending is cooling down this month.';
  return 'Spending is steady this month.';
};

/** Reusable clean card — white bg, subtle shadow, optional left accent border */
function Card({
  children,
  accentColor,
}: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

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
      {accentColor ? (
        <View style={{ width: 4, backgroundColor: accentColor }} />
      ) : null}
      <View style={{ flex: 1, padding: 16 }}>{children}</View>
    </View>
  );
}

/** Section wrapper with title */
function Section({
  title,
  subtitle,
  children,
  index = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  index?: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <AnimatedScreenSection index={index}>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 2 }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>
            {subtitle}
          </Text>
        )}
        {children}
      </View>
    </AnimatedScreenSection>
  );
}

/** Tab pill button */
function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: active ? colors.text : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: active ? colors.background : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** Alert card with colored left border */
function AlertCard({ alert }: { alert: InsightAnomalyAlert }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const accent = getSeverityColor(alert.severity, colors);

  return (
    <Card accentColor={accent}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', flex: 1, paddingRight: 8 }}>
          {alert.title}
        </Text>
        <Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>
          {getSeverityLabel(alert.severity)}
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
        {getRiskTagLabel(alert.riskTag)}
      </Text>
      <Text style={{ color: colors.primary, fontSize: 13, marginTop: 6 }}>
        {alert.recommendedAction}
      </Text>
    </Card>
  );
}

function EvidenceCard({ card }: { card: InsightEvidenceCard }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Card accentColor={colors.info}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{card.title}</Text>
        <Text style={{ color: colors.info, fontSize: 11 }}>{Math.round((card.confidence || 0) * 100)}% sure</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 13 }}>{card.insight}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{card.why}</Text>
      {!!card.recommendedAction && (
        <Text style={{ color: colors.primary, fontSize: 12, marginTop: 6, fontWeight: '500' }}>
          Do this: {card.recommendedAction}
        </Text>
      )}
    </Card>
  );
}

function ActionCards({ actions }: { actions: InsightAction[] }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!actions.length) {
    return (
      <ChartEmptyState
        message="No clear save step yet"
        subtext="Add more records and SEFA will show saving ideas here."
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
      />
    );
  }

  return (
    <>
      {actions.map((action) => (
        <Card key={action.id} accentColor={colors.primary}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{action.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{action.action}</Text>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: colors.primaryBackground,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                {formatMoney(action.impact)}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </>
  );
}

function TextBlock({
  section,
  accentColor,
  children,
  index = 0,
}: {
  section: InsightTextSection;
  accentColor?: string;
  children?: React.ReactNode;
  index?: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Section title={section.title} index={index}>
      <Card accentColor={accentColor}>
        {section.lines.map((line) => (
          <Text key={line} style={{ color: colors.text, fontSize: 14, lineHeight: 21, marginBottom: 6 }}>
            {line}
          </Text>
        ))}
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
          Do this: {section.action}
        </Text>
        {children}
      </Card>
    </Section>
  );
}

export default function InsightsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { requireVerification } = useSensitiveActionSecurity();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(Math.min(width - 56, 420), 260);
  const { data: hub, isLoading, isRefetching, refetch, error } = useInsightsHub({ months: 3, days: 30 });
  const whatIf = useWhatIfScenario();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'visual' | 'text'>('dashboard');
  const [assistantOpening, setAssistantOpening] = useState(false);

  const openAssistant = async () => {
    if (assistantOpening) return;
    setAssistantOpening(true);
    try {
      const allowed = await requireVerification('assistant_history');
      if (!allowed) { setAssistantOpening(false); return; }
      router.push('/assistant' as any);
      setAssistantOpening(false);
    } catch (_error) {
      setAssistantOpening(false);
    }
  };

  const topRiskCategory =
    hub?.forecast.likelyBudgetBreachCategories[0]?.categoryName ||
    hub?.forecast.categoryForecasts[0]?.categoryName;

  const handleScenario = async (variant: 'cut-risk' | 'food' | 'income-drop') => {
    if (variant === 'income-drop') {
      await whatIf.mutateAsync({ days: 30, incomeChangePercent: -10 });
      return;
    }
    const categoryName = variant === 'food' ? 'Food & Dining' : topRiskCategory || 'Food & Dining';
    await whatIf.mutateAsync({ days: 30, categoryName, reductionPercent: variant === 'food' ? 15 : 12 });
  };

  // Header + tab bar shared across all tabs.
  const renderHeader = () => (
    <>
      <FadeUp style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Insights</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
          See your money in charts or plain words.
        </Text>
      </FadeUp>
      <AnimatedScreenSection
        index={0}
        style={{
          flexDirection: 'row',
          borderRadius: 12,
          padding: 3,
          marginBottom: 24,
          backgroundColor: colors.backgroundSecondary,
        }}
      >
        <TabButton label="Dashboard" active={activeTab === 'dashboard'} onPress={() => setActiveTab('dashboard')} />
        <TabButton label="Visual" active={activeTab === 'visual'} onPress={() => setActiveTab('visual')} />
        <TabButton label="Text" active={activeTab === 'text'} onPress={() => setActiveTab('text')} />
      </AnimatedScreenSection>
    </>
  );

  // The Dashboard tab is self-sufficient (its own data fetching + loading/empty
  // states), so it renders independently of the hub query used by Visual/Text.
  if (activeTab === 'dashboard') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
        >
          {renderHeader()}
          <InsightsDashboard />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 10 }}>
            Checking your money...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hub) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="analytics-outline" size={40} color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 16 }}>
            Insight not ready
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
            {error instanceof Error ? error.message : 'Could not load your money update right now.'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              marginTop: 20,
              paddingHorizontal: 22,
              paddingVertical: 11,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.textInverse, fontSize: 14, fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {renderHeader()}

        {activeTab === 'visual' ? (
          <>
            {/* Main Update */}
            <Section
              title="Main Update"
              subtitle="Where your money may land before month end."
              index={1}
            >
              <Card accentColor={getMainUpdateColor(hub.visuals.mainUpdate.status, colors)}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
                      {hub.visuals.mainUpdate.message}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                      {hub.visuals.mainUpdate.supportingText}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: colors.primaryBackground,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                      {formatMoney(hub.visuals.mainUpdate.projectedMonthEndBalance)}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: 14 }}>
                  <InsightsSparkline
                    points={hub.visuals.mainUpdate.sparkline}
                    width={chartWidth - 32}
                    color={colors.primary}
                    axisColor={colors.textTertiary}
                  />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                  {hub.visuals.mainUpdate.actionText}
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('text')}
                  style={{
                    marginTop: 14,
                    paddingVertical: 11,
                    borderRadius: 999,
                    alignItems: 'center',
                    backgroundColor: colors.primary,
                  }}
                >
                  <Text style={{ color: colors.textInverse, fontSize: 14, fontWeight: '600' }}>
                    See text summary
                  </Text>
                </TouchableOpacity>
              </Card>
            </Section>

            {/* Things to Check */}
            <Section title="Things To Check" subtitle="Items that need your attention now." index={2}>
              {hub.visuals.thingsToCheck.length ? (
                hub.visuals.thingsToCheck.map((alert) => <AlertCard key={alert.id} alert={alert} />)
              ) : (
                <ChartEmptyState
                  message="Nothing to flag right now"
                  subtext="Your recent spending looks normal."
                  textColor={colors.text}
                  secondaryTextColor={colors.textSecondary}
                />
              )}
            </Section>

            {/* Where Money Goes */}
            <Section title="Where Your Money Is Going" subtitle="Top spending categories this month." index={3}>
              <Card>
                <InsightsDonutChart
                  categories={hub.visuals.spendingBreakdown.categories}
                  width={chartWidth - 32}
                  totalLabel={formatMoney(hub.visuals.spendingBreakdown.totalCurrentMonthSpending)}
                  textColor={colors.text}
                  secondaryTextColor={colors.textSecondary}
                />
                <InsightsCategoryBarChart
                  categories={hub.visuals.spendingBreakdown.categories}
                  width={chartWidth - 32}
                  textColor={colors.text}
                  axisColor={colors.textTertiary}
                />
                <View style={{ marginTop: 8 }}>
                  {hub.visuals.spendingBreakdown.categories.map((entry) => (
                    <View
                      key={entry.categoryName}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 10, backgroundColor: entry.color }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{entry.categoryName}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 1 }}>
                            {Math.round(entry.percentage)}% of spend
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                        {formatMoney(entry.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Section>

            {/* Trend */}
            <Section title="This Month Trend" subtitle="Actual spend vs what comes next." index={4}>
              <Card>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 6, backgroundColor: colors.primary }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Actual</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 6, backgroundColor: colors.warning }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Expected</Text>
                  </View>
                </View>
                <InsightsTrendChart
                  actualSeries={hub.visuals.spendingTrend.actualSeries}
                  forecastSeries={hub.visuals.spendingTrend.forecastSeries}
                  width={chartWidth - 32}
                  textColor={colors.text}
                  axisColor={colors.textTertiary}
                  actualColor={colors.primary}
                  forecastColor={colors.warning}
                />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                  {getTrendLineLabel(hub.visuals.spendingTrend.direction)}
                </Text>
              </Card>
            </Section>

            {/* Budget Use */}
            <Section title="Budget Use" subtitle="Categories getting close to their limit." index={5}>
              {hub.visuals.budgetUsage.length ? (
                hub.visuals.budgetUsage.map((entry) => {
                  const accent = getBudgetStatusColor(entry.status, colors);
                  return (
                    <Card key={entry.categoryName} accentColor={accent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{entry.categoryName}</Text>
                        <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>{formatPercent(entry.percentUsed)}</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                        {formatMoney(entry.spent)} of {formatMoney(entry.budgetAmount)}
                      </Text>
                      <View style={{ marginTop: 10, height: 6, borderRadius: 999, backgroundColor: colors.border }}>
                        <View
                          style={{
                            height: 6,
                            borderRadius: 999,
                            width: `${Math.max(4, Math.min(entry.percentUsed, 100))}%`,
                            backgroundColor: entry.color || accent,
                          }}
                        />
                      </View>
                    </Card>
                  );
                })
              ) : (
                <ChartEmptyState
                  message="No budget pressure yet"
                  subtext="Add active budgets and SEFA will track categories near their limit."
                  textColor={colors.text}
                  secondaryTextColor={colors.textSecondary}
                />
              )}
            </Section>

            {/* Ways to Save */}
            <Section title="Ways To Save" subtitle="Simple actions with the biggest impact." index={6}>
              <ActionCards actions={hub.visuals.savingsActions} />
            </Section>
          </>
        ) : (
          <>
            <TextBlock section={hub.textView.mainUpdate} accentColor={colors.primary} index={1} />

            <TextBlock section={hub.textView.thingsToCheck} accentColor={colors.warning} index={2} />

            <TextBlock section={hub.textView.whereMoneyGoes} accentColor={colors.info} index={3} />

            <TextBlock section={hub.textView.thisMonthTrend} accentColor={colors.success} index={4}>
              {/* What-if scenario chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {[
                  { label: `Cut top risk by 12%`, variant: 'cut-risk' as const, primary: true },
                  { label: 'Food -15%', variant: 'food' as const, primary: false },
                  { label: 'Income -10%', variant: 'income-drop' as const, primary: false },
                ].map(({ label, variant, primary }) => (
                  <TouchableOpacity
                    key={variant}
                    onPress={() => handleScenario(variant)}
                    disabled={whatIf.isPending}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: primary ? colors.primaryBackground : colors.backgroundSecondary,
                      borderWidth: primary ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: primary ? colors.primary : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!!whatIf.data && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                    {whatIf.data.explanation}
                  </Text>
                  <Text style={{ color: colors.success, fontSize: 14, fontWeight: '700', marginTop: 6 }}>
                    Balance change: {formatMoney(whatIf.data.delta.projectedMonthEndBalance)}
                  </Text>
                </View>
              )}
            </TextBlock>

            <TextBlock section={hub.textView.waysToSave} accentColor={colors.primary} index={5} />

            {/* Ask SEFA — full-width CTA */}
            <AnimatedScreenSection index={6}>
              <TextBlock section={hub.textView.askSefa} accentColor={colors.primary} index={6} />
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={assistantOpening}
                onPress={openAssistant}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  paddingVertical: 15,
                  borderRadius: 999,
                  backgroundColor: assistantOpening ? colors.border : colors.primary,
                  marginTop: 4,
                }}
              >
                {assistantOpening ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textInverse} />
                    <Text style={{ color: colors.textInverse, fontSize: 15, fontWeight: '600' }}>
                      Ask SEFA
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </AnimatedScreenSection>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
