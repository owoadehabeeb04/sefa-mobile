import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useInsightCopilot,
  useInsightFeedback,
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
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';
import type {
  InsightAction,
  InsightAnomalyAlert,
  InsightEvidenceCard,
  InsightTextSection,
} from '@/features/insights/insights.types';

const formatMoney = (value: number) => `N${Math.round(value || 0).toLocaleString()}`;
const formatPercent = (value: number) => `${Math.round(value || 0)}%`;

const getSeverityColor = (severity: string, colors: typeof Colors.light) => {
  if (severity === 'critical' || severity === 'high') return colors.error;
  if (severity === 'medium') return colors.warning;
  return colors.info;
};

const getRiskTagLabel = (riskTag: string) => {
  if (riskTag === 'possible_fraud') return 'Looks risky';
  if (riskTag === 'possible_error') return 'May be mistake';
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
      <View className="mb-6">
        <View className="mb-3">
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {title}
          </Text>
          {!!subtitle && (
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {subtitle}
            </Text>
          )}
        </View>
        {children}
      </View>
    </AnimatedScreenSection>
  );
}

function Surface({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: string;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      className="rounded-3xl p-4 border mb-3"
      style={{
        backgroundColor: colors.backgroundSecondary,
        borderColor: accent || colors.border,
      }}
    >
      {children}
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 py-3 rounded-2xl items-center"
      style={{
        backgroundColor: active ? colors.primary : colors.background,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text
        className="text-sm font-semibold"
        style={{ color: active ? colors.textInverse : colors.textSecondary }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AlertCard({ alert }: { alert: InsightAnomalyAlert }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const accent = getSeverityColor(alert.severity, colors);

  return (
    <Surface accent={`${accent}55`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold flex-1 pr-2" style={{ color: colors.text }}>
          {alert.title}
        </Text>
        <Text className="text-[11px] font-semibold" style={{ color: accent }}>
          {getSeverityLabel(alert.severity)}
        </Text>
      </View>
      <Text className="text-xs" style={{ color: colors.textSecondary }}>
        {getRiskTagLabel(alert.riskTag)}
      </Text>
      <Text className="text-xs mt-2" style={{ color: colors.primary }}>
        {alert.recommendedAction}
      </Text>
    </Surface>
  );
}

function EvidenceCard({ card }: { card: InsightEvidenceCard }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Surface accent={`${colors.info}30`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
          {card.title}
        </Text>
        <Text className="text-[11px]" style={{ color: colors.info }}>
          {Math.round((card.confidence || 0) * 100)}% sure
        </Text>
      </View>
      <Text className="text-sm" style={{ color: colors.text }}>
        {card.insight}
      </Text>
      <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
        {card.why}
      </Text>
      {!!card.recommendedAction && (
        <Text className="text-xs mt-2 font-medium" style={{ color: colors.primary }}>
          Do this: {card.recommendedAction}
        </Text>
      )}
    </Surface>
  );
}

function ActionCards({ actions }: { actions: InsightAction[] }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (!actions.length) {
    return (
      <ChartEmptyState
        message="No clear save step yet"
        subtext="Add more records and SEFA will show better saving ideas here."
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
      />
    );
  }

  return (
    <>
      {actions.map((action) => (
        <Surface key={action.id} accent={`${colors.primary}25`}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                {action.title}
              </Text>
              <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                {action.action}
              </Text>
            </View>
            <View
              className="px-3 py-2 rounded-2xl"
              style={{ backgroundColor: colors.primaryBackground }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                {formatMoney(action.impact)}
              </Text>
            </View>
          </View>
        </Surface>
      ))}
    </>
  );
}

function TextBlock({
  section,
  accent,
  children,
  index = 0,
}: {
  section: InsightTextSection;
  accent?: string;
  children?: React.ReactNode;
  index?: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Section title={section.title} index={index}>
      <Surface accent={accent}>
        {section.lines.map((line) => (
          <Text key={line} className="text-sm mb-2" style={{ color: colors.text }}>
            {line}
          </Text>
        ))}
        <Text className="text-xs font-semibold mt-2" style={{ color: colors.primary }}>
          Do this: {section.action}
        </Text>
        {children}
      </Surface>
    </Section>
  );
}

export default function InsightsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(Math.min(width - 56, 420), 260);
  const {
    data: hub,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useInsightsHub({ months: 3, days: 30 });
  const copilot = useInsightCopilot();
  const whatIf = useWhatIfScenario();
  const feedback = useInsightFeedback();

  const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual');
  const [question, setQuestion] = useState('');
  const [feedbackState, setFeedbackState] = useState('');

  const handleAsk = async (prompt?: string) => {
    const message = (prompt || question).trim();
    if (!message) return;

    setFeedbackState('');
    await copilot.mutateAsync({ question: message, months: 3, days: 30 });
    if (!prompt) {
      setQuestion('');
    }
  };

  const topRiskCategory = hub?.forecast.likelyBudgetBreachCategories[0]?.categoryName
    || hub?.forecast.categoryForecasts[0]?.categoryName;

  const handleScenario = async (variant: 'cut-risk' | 'food' | 'income-drop') => {
    if (variant === 'income-drop') {
      await whatIf.mutateAsync({ days: 30, incomeChangePercent: -10 });
      return;
    }

    const categoryName = variant === 'food'
      ? 'Food & Dining'
      : topRiskCategory || 'Food & Dining';

    await whatIf.mutateAsync({
      days: 30,
      categoryName,
      reductionPercent: variant === 'food' ? 15 : 12,
    });
  };

  const handleFeedback = async (
    rating: 'helpful' | 'not_helpful' | 'wrong' | 'already_knew' | 'took_action'
  ) => {
    if (!copilot.data) return;

    await feedback.mutateAsync({
      sessionId: copilot.data.sessionId,
      insightKey: 'copilot-response',
      insightType: 'copilot_chat',
      rating,
      metadata: {
        evidenceCardCount: copilot.data.evidenceCards.length,
      },
    });

    setFeedbackState(
      rating === 'took_action'
        ? 'Noted. We saved that you took action.'
        : 'Noted. Your feedback has been saved.'
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
            Checking your money...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hub) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="analytics-outline" size={40} color={colors.primary} />
          <Text className="text-lg font-bold mt-4" style={{ color: colors.text }}>
            Insight is not ready
          </Text>
          <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
            {error instanceof Error ? error.message : 'We could not load your money update right now.'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-5 px-5 py-3 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.textInverse }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const quickPrompts = hub.textView.askSefa.prompts.length
    ? hub.textView.askSefa.prompts
    : hub.suggestedQuestions;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <FadeUp className="mb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Money Insight
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            See your money in charts or in simple words.
          </Text>
        </FadeUp>

        <AnimatedScreenSection
          index={0}
          className="flex-row rounded-3xl p-1 mb-6"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <TabButton label="Visual" active={activeTab === 'visual'} onPress={() => setActiveTab('visual')} />
          <View className="w-2" />
          <TabButton label="Text" active={activeTab === 'text'} onPress={() => setActiveTab('text')} />
        </AnimatedScreenSection>

        {activeTab === 'visual' ? (
          <>
            <Section
              title="Main Update"
              subtitle="Quick look at where your money may land before month end."
              index={1}
            >
              <Surface accent={`${getMainUpdateColor(hub.visuals.mainUpdate.status, colors)}55`}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                      {hub.visuals.mainUpdate.message}
                    </Text>
                    <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                      {hub.visuals.mainUpdate.supportingText}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-2 rounded-2xl"
                    style={{ backgroundColor: colors.primaryBackground }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                      {formatMoney(hub.visuals.mainUpdate.projectedMonthEndBalance)}
                    </Text>
                  </View>
                </View>
                <View className="mt-4">
                  <InsightsSparkline
                    points={hub.visuals.mainUpdate.sparkline}
                    width={chartWidth - 24}
                    color={colors.primary}
                    axisColor={colors.textTertiary}
                  />
                </View>
                <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                  {hub.visuals.mainUpdate.actionText}
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('text')}
                  className="mt-4 px-4 py-3 rounded-2xl items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-sm font-semibold" style={{ color: colors.textInverse }}>
                    Ask SEFA in Text tab
                  </Text>
                </TouchableOpacity>
              </Surface>
            </Section>

            <Section
              title="Things To Check"
              subtitle="Only the few items that need your eye now."
              index={2}
            >
              {hub.visuals.thingsToCheck.length ? (
                hub.visuals.thingsToCheck.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))
              ) : (
                <ChartEmptyState
                  message="Nothing serious to check now"
                  subtext="Your recent spending looks normal."
                  textColor={colors.text}
                  secondaryTextColor={colors.textSecondary}
                />
              )}
            </Section>

            <Section
              title="Where Your Money Is Going"
              subtitle="Top places taking money this month."
              index={3}
            >
              <Surface accent={`${colors.primary}25`}>
                <InsightsDonutChart
                  categories={hub.visuals.spendingBreakdown.categories}
                  width={chartWidth}
                  totalLabel={formatMoney(hub.visuals.spendingBreakdown.totalCurrentMonthSpending)}
                  textColor={colors.text}
                  secondaryTextColor={colors.textSecondary}
                />
                <InsightsCategoryBarChart
                  categories={hub.visuals.spendingBreakdown.categories}
                  width={chartWidth}
                  textColor={colors.text}
                  axisColor={colors.textTertiary}
                />
                <View className="mt-2">
                  {hub.visuals.spendingBreakdown.categories.map((entry) => (
                    <View key={entry.categoryName} className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center flex-1 pr-3">
                        <View
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: entry.color }}
                        />
                        <View className="flex-1">
                          <Text className="text-sm font-medium" style={{ color: colors.text }}>
                            {entry.categoryName}
                          </Text>
                          <Text className="text-[11px] mt-1" style={{ color: colors.textSecondary }}>
                            {Math.round(entry.percentage)}% of this month spend
                          </Text>
                        </View>
                      </View>
                      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                        {formatMoney(entry.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Surface>
            </Section>

            <Section
              title="This Month Trend"
              subtitle="See how spending is moving and what may happen next."
              index={4}
            >
              <Surface accent={`${colors.info}25`}>
                <View className="flex-row flex-wrap mb-2">
                  <View className="flex-row items-center mr-4 mb-2">
                    <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      Actual spend
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: colors.warning }}
                    />
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      Expected next
                    </Text>
                  </View>
                </View>
                <InsightsTrendChart
                  actualSeries={hub.visuals.spendingTrend.actualSeries}
                  forecastSeries={hub.visuals.spendingTrend.forecastSeries}
                  width={chartWidth}
                  textColor={colors.text}
                  axisColor={colors.textTertiary}
                  actualColor={colors.primary}
                  forecastColor={colors.warning}
                />
                <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                  {getTrendLineLabel(hub.visuals.spendingTrend.direction)}
                </Text>
              </Surface>
            </Section>

            <Section
              title="Budget Use"
              subtitle="The budget areas getting close to the line."
              index={5}
            >
              {hub.visuals.budgetUsage.length ? (
                hub.visuals.budgetUsage.map((entry) => {
                  const accent = getBudgetStatusColor(entry.status, colors);

                  return (
                    <Surface key={entry.categoryName} accent={`${accent}44`}>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {entry.categoryName}
                        </Text>
                        <Text className="text-xs font-semibold" style={{ color: accent }}>
                          {formatPercent(entry.percentUsed)}
                        </Text>
                      </View>
                      <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                        {formatMoney(entry.spent)} of {formatMoney(entry.budgetAmount)}
                      </Text>
                      <View
                        className="mt-3 h-2 rounded-full"
                        style={{ backgroundColor: colors.border }}
                      >
                        <View
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max(6, Math.min(entry.percentUsed, 100))}%`,
                            backgroundColor: entry.color || accent,
                          }}
                        />
                      </View>
                    </Surface>
                  );
                })
              ) : (
                <ChartEmptyState
                  message="No budget pressure yet"
                  subtext="Add active budgets and SEFA will show the categories close to their limit."
                  textColor={colors.text}
                  secondaryTextColor={colors.textSecondary}
                />
              )}
            </Section>

            <Section
              title="Ways To Save"
              subtitle="Simple actions with the biggest money effect."
              index={6}
            >
              <ActionCards actions={hub.visuals.savingsActions} />
            </Section>
          </>
        ) : (
          <>
            <TextBlock section={hub.textView.mainUpdate} accent={`${colors.primary}25`} index={1} />

            <TextBlock section={hub.textView.thingsToCheck} accent={`${colors.warning}35`} index={2} />

            <TextBlock section={hub.textView.whereMoneyGoes} accent={`${colors.info}25`} index={3} />

            <TextBlock section={hub.textView.thisMonthTrend} accent={`${colors.success}25`} index={4}>
              <View className="flex-row flex-wrap mt-4">
                <TouchableOpacity
                  onPress={() => handleScenario('cut-risk')}
                  disabled={whatIf.isPending}
                  className="mr-2 mb-2 px-3 py-2 rounded-full"
                  style={{ backgroundColor: colors.primaryBackground }}
                >
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                    Cut top risk by 12%
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleScenario('food')}
                  disabled={whatIf.isPending}
                  className="mr-2 mb-2 px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                    Food -15%
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleScenario('income-drop')}
                  disabled={whatIf.isPending}
                  className="mr-2 mb-2 px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                    Income -10%
                  </Text>
                </TouchableOpacity>
              </View>

              {!!whatIf.data && (
                <View
                  className="mt-2 rounded-2xl px-3 py-3"
                  style={{ backgroundColor: colors.background }}
                >
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                    {whatIf.data.explanation}
                  </Text>
                  <Text className="text-sm font-semibold mt-2" style={{ color: colors.success }}>
                    Balance change: {formatMoney(whatIf.data.delta.projectedMonthEndBalance)}
                  </Text>
                </View>
              )}
            </TextBlock>

            <TextBlock section={hub.textView.waysToSave} accent={`${colors.primary}25`} index={5} />

            <TextBlock section={hub.textView.askSefa} accent={`${colors.primary}45`} index={6}>
              <View className="flex-row flex-wrap mt-4">
                {quickPrompts.map((prompt) => (
                  <TouchableOpacity
                    key={prompt}
                    onPress={() => handleAsk(prompt)}
                    className="mr-2 mb-2 px-3 py-2 rounded-full"
                    style={{ backgroundColor: colors.background }}
                    disabled={copilot.isPending}
                  >
                    <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-2">
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Ask something like: Can I still reach month end?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  className="rounded-3xl px-4 py-4 text-sm"
                  style={{
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 96,
                    textAlignVertical: 'top',
                  }}
                />
                <TouchableOpacity
                  onPress={() => handleAsk()}
                  disabled={!question.trim() || copilot.isPending}
                  className="mt-3 px-4 py-3 rounded-2xl items-center"
                  style={{
                    backgroundColor: !question.trim() || copilot.isPending
                      ? colors.border
                      : colors.primary,
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color: !question.trim() || copilot.isPending
                        ? colors.textSecondary
                        : colors.textInverse,
                    }}
                  >
                    {copilot.isPending ? 'Checking your records...' : 'Ask SEFA'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TextBlock>

            {!!copilot.data && (
              <Section title="SEFA Answer" index={7}>
                <Surface accent={`${colors.success}35`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      Answer
                    </Text>
                    <Text className="text-[11px]" style={{ color: colors.success }}>
                      {Math.round((copilot.data.confidence || 0) * 100)}% sure
                    </Text>
                  </View>
                  <Text className="text-sm mt-3" style={{ color: colors.text }}>
                    {copilot.data.answer}
                  </Text>

                  {!!copilot.data.actions.length && (
                    <View className="mt-4">
                      {copilot.data.actions.map((action) => (
                        <View key={action} className="flex-row items-start mb-2">
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={colors.primary}
                            style={{ marginTop: 2 }}
                          />
                          <Text className="text-xs ml-2 flex-1" style={{ color: colors.textSecondary }}>
                            {action}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Surface>

                {!!copilot.data.evidenceCards.length && (
                  <View className="mt-1">
                    {copilot.data.evidenceCards.map((card) => (
                      <EvidenceCard key={card.id} card={card} />
                    ))}
                  </View>
                )}

                <View className="flex-row flex-wrap mt-2">
                  {[
                    ['Helpful', 'helpful'],
                    ['No Help', 'not_helpful'],
                    ['Wrong', 'wrong'],
                    ['I Did It', 'took_action'],
                  ].map(([label, rating]) => (
                    <TouchableOpacity
                      key={label}
                      onPress={() => handleFeedback(rating as 'helpful' | 'not_helpful' | 'wrong' | 'took_action')}
                      disabled={feedback.isPending}
                      className="mr-2 mb-2 px-3 py-2 rounded-full"
                      style={{ backgroundColor: colors.backgroundSecondary }}
                    >
                      <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {!!feedbackState && (
                  <Text className="text-[11px] mt-1" style={{ color: colors.success }}>
                    {feedbackState}
                  </Text>
                )}
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
