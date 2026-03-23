import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  askInsightCopilot,
  getForecast,
  getHealthScore,
  getInsightsHub,
  runWhatIfScenario,
  submitInsightFeedback,
} from './insights.service';
import type { InsightFeedbackRequest, WhatIfRequest } from './insights.types';

export const INSIGHTS_HUB_QUERY_KEY = ['insights-hub'];

export const useInsightsHub = (params: { months?: number; days?: 7 | 30 } = {}) => {
  return useQuery({
    queryKey: [...INSIGHTS_HUB_QUERY_KEY, params],
    queryFn: () => getInsightsHub(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useHealthScore = () => {
  return useQuery({
    queryKey: ['insights-health-score'],
    queryFn: getHealthScore,
    staleTime: 2 * 60 * 1000,
  });
};

export const useForecast = (days: 7 | 30 = 30) => {
  return useQuery({
    queryKey: ['insights-forecast', days],
    queryFn: () => getForecast(days),
    staleTime: 2 * 60 * 1000,
  });
};

export const useInsightCopilot = () => {
  return useMutation({
    mutationFn: ({ question, months, days }: { question: string; months?: number; days?: 7 | 30 }) =>
      askInsightCopilot(question, { months, days }),
  });
};

export const useWhatIfScenario = () => {
  return useMutation({
    mutationFn: (payload: WhatIfRequest) => runWhatIfScenario(payload),
  });
};

export const useInsightFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InsightFeedbackRequest) => submitInsightFeedback(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSIGHTS_HUB_QUERY_KEY });
    },
  });
};
