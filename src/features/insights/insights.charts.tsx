import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { InsightsLinePoint, InsightsVisualCategory } from './insights.types';

const formatCompactAmount = (value: number) => {
  if (value >= 1000000) return `${Math.round(value / 1000000)}m`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return `${Math.round(value || 0)}`;
};

const clampWidth = (width: number) => Math.max(120, Math.round(width || 0));

const getRange = (values: number[]) => {
  if (!values.length) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return { min: min - 1, max: max + 1 };
  return { min, max };
};

const getScaledPoint = (
  index: number,
  value: number,
  count: number,
  min: number,
  max: number,
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
) => {
  const innerWidth = Math.max(1, width - padding.left - padding.right);
  const innerHeight = Math.max(1, height - padding.top - padding.bottom);
  const x = padding.left + (count <= 1 ? innerWidth / 2 : (index / (count - 1)) * innerWidth);
  const y = padding.top + innerHeight - ((value - min) / (max - min)) * innerHeight;
  return { x, y };
};

const buildLinePath = (
  points: { x: number; y: number }[],
  smooth = false,
) => {
  if (!points.length) return '';
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y}`;
  }

  if (!smooth) {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  }

  return points
    .map((point, index, all) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = all[index - 1];
      const controlX = (previous.x + point.x) / 2;
      return `C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(' ');
};

export function ChartEmptyState({
  message,
  subtext,
  textColor,
  secondaryTextColor,
}: {
  message: string;
  subtext: string;
  textColor: string;
  secondaryTextColor: string;
}) {
  return (
    <View className="rounded-3xl border px-4 py-5" style={{ borderColor: `${secondaryTextColor}22` }}>
      <Text className="text-sm font-semibold" style={{ color: textColor }}>
        {message}
      </Text>
      <Text className="text-xs mt-2" style={{ color: secondaryTextColor }}>
        {subtext}
      </Text>
    </View>
  );
}

export function InsightsSparkline({
  points,
  width,
  color,
  axisColor,
}: {
  points: InsightsLinePoint[];
  width: number;
  color: string;
  axisColor: string;
}) {
  if (!points.length) return null;

  const svgWidth = clampWidth(width);
  const svgHeight = 92;
  const padding = { top: 16, right: 12, bottom: 10, left: 12 };
  const values = points.map((point) => point.y);
  const { min, max } = getRange(values);
  const plottedPoints = points.map((point, index) =>
    getScaledPoint(index, point.y, points.length, min, max, svgWidth, svgHeight, padding),
  );
  const path = buildLinePath(plottedPoints, true);

  return (
    <Svg width={svgWidth} height={svgHeight}>
      <Line
        x1={padding.left}
        y1={svgHeight - padding.bottom}
        x2={svgWidth - padding.right}
        y2={svgHeight - padding.bottom}
        stroke={`${axisColor}22`}
        strokeWidth={1}
      />
      <Line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={svgHeight - padding.bottom}
        stroke={`${axisColor}14`}
        strokeWidth={1}
      />
      <Path d={path} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function InsightsDonutChart({
  categories,
  width,
  totalLabel,
  textColor,
  secondaryTextColor,
}: {
  categories: InsightsVisualCategory[];
  width: number;
  totalLabel: string;
  textColor: string;
  secondaryTextColor: string;
}) {
  if (!categories.length) {
    return (
      <ChartEmptyState
        message="No spending chart yet"
        subtext="Add a few expenses this month and the spending split will show here."
        textColor={textColor}
        secondaryTextColor={secondaryTextColor}
      />
    );
  }

  const svgWidth = clampWidth(width);
  const svgHeight = 230;
  const size = Math.min(svgWidth, svgHeight);
  const radius = Math.max(40, (size / 2) - 18);
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, categories.reduce((sum, entry) => sum + Math.max(0, entry.amount), 0));

  let offset = 0;

  return (
    <View className="items-center justify-center relative">
      <Svg width={svgWidth} height={svgHeight}>
        <Circle
          cx={svgWidth / 2}
          cy={svgHeight / 2}
          r={radius}
          stroke={`${secondaryTextColor}18`}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {categories.map((entry) => {
          const segmentLength = (Math.max(0, entry.amount) / total) * circumference;
          const dashOffset = circumference - offset;
          offset += segmentLength;

          return (
            <Circle
              key={entry.categoryName}
              cx={svgWidth / 2}
              cy={svgHeight / 2}
              r={radius}
              stroke={entry.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              fill="none"
              originX={svgWidth / 2}
              originY={svgHeight / 2}
              rotation={-90}
            />
          );
        })}
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-xl font-bold" style={{ color: textColor }}>
          {totalLabel}
        </Text>
        <Text className="text-xs mt-1" style={{ color: secondaryTextColor }}>
          spent this month
        </Text>
      </View>
    </View>
  );
}

export function InsightsCategoryBarChart({
  categories,
  width,
  textColor,
  axisColor,
}: {
  categories: InsightsVisualCategory[];
  width: number;
  textColor: string;
  axisColor: string;
}) {
  if (!categories.length) return null;

  const svgWidth = clampWidth(width);
  const maxAmount = Math.max(...categories.map((entry) => entry.amount), 1);

  return (
    <View className="mt-4">
      {categories.map((entry) => {
        const percent = Math.max(0, Math.min(100, (entry.amount / maxAmount) * 100));

        return (
          <View key={entry.categoryName} className="mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-medium flex-1 pr-3" style={{ color: textColor }}>
                {entry.categoryName}
              </Text>
              <Text className="text-[11px]" style={{ color: axisColor }}>
                {formatCompactAmount(entry.amount)}
              </Text>
            </View>
            <View
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: `${axisColor}18`, width: svgWidth }}
            >
              <View
                className="h-3 rounded-full"
                style={{
                  width: `${Math.max(percent, 6)}%`,
                  backgroundColor: entry.color,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function InsightsTrendChart({
  actualSeries,
  forecastSeries,
  width,
  axisColor,
  actualColor,
  forecastColor,
}: {
  actualSeries: InsightsLinePoint[];
  forecastSeries: InsightsLinePoint[];
  width: number;
  textColor: string;
  axisColor: string;
  actualColor: string;
  forecastColor: string;
}) {
  const combined = [...actualSeries, ...forecastSeries];

  if (!combined.length) {
    return (
      <ChartEmptyState
        message="No trend chart yet"
        subtext="When you add more records this month, SEFA will draw your spending trend here."
        textColor={axisColor}
        secondaryTextColor={axisColor}
      />
    );
  }

  const svgWidth = clampWidth(width);
  const svgHeight = 250;
  const padding = { top: 18, right: 16, bottom: 38, left: 12 };
  const values = combined.map((point) => point.y);
  const { min, max } = getRange(values);
  const actualPoints = actualSeries.map((point, index) =>
    getScaledPoint(index, point.y, combined.length, min, max, svgWidth, svgHeight, padding),
  );
  const forecastStartIndex = actualSeries.length ? actualSeries.length - 1 : 0;
  const dashedForecastSeries = actualSeries.length && forecastSeries.length
    ? [actualSeries[actualSeries.length - 1], ...forecastSeries]
    : forecastSeries;
  const forecastPoints = dashedForecastSeries.map((point, index) =>
    getScaledPoint(
      forecastStartIndex + index,
      point.y,
      combined.length,
      min,
      max,
      svgWidth,
      svgHeight,
      padding,
    ),
  );

  const tickPoints = combined.filter((point) => point.tickLabel);

  return (
    <View>
      <Svg width={svgWidth} height={svgHeight}>
        {[0, 0.5, 1].map((step) => {
          const y = padding.top + ((svgHeight - padding.top - padding.bottom) * step);
          return (
            <Line
              key={String(step)}
              x1={padding.left}
              y1={y}
              x2={svgWidth - padding.right}
              y2={y}
              stroke={`${axisColor}18`}
              strokeWidth={1}
            />
          );
        })}
        <Path
          d={buildLinePath(actualPoints, true)}
          fill="none"
          stroke={actualColor}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {!!forecastPoints.length && (
          <Path
            d={buildLinePath(forecastPoints, true)}
            fill="none"
            stroke={forecastColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="6 5"
          />
        )}
        {actualPoints.map((point, index) => (
          <Circle key={`actual-${index}`} cx={point.x} cy={point.y} r={2.5} fill={actualColor} />
        ))}
      </Svg>
      <View className="flex-row justify-between mt-2 px-1">
        {tickPoints.map((point) => {
          return (
            <Text
              key={`${point.x}-${point.tickLabel}`}
              className="text-[10px]"
              style={{ color: axisColor }}
            >
              {point.tickLabel}
            </Text>
          );
        })}
      </View>
    </View>
  );
}
