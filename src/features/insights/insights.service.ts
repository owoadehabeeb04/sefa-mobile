import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type {
  CopilotApiResponse,
  CopilotResponse,
  ForecastData,
  ForecastApiResponse,
  HealthScore,
  HealthScoreApiResponse,
  InsightFeedbackApiResponse,
  InsightFeedbackRequest,
  InsightsHubApiResponse,
  InsightsHubData,
  WhatIfApiResponse,
  WhatIfRequest,
  WhatIfResponse,
} from './insights.types';

export const getInsightsHub = async (
  params: { months?: number; days?: 7 | 30 } = {}
): Promise<InsightsHubData> => {
  const response = await api.get<InsightsHubApiResponse>(API_ENDPOINTS.INSIGHTS.HUB, {
    params,
  });

  return response.data.data;
};

export const getHealthScore = async (): Promise<HealthScore> => {
  const response = await api.get<HealthScoreApiResponse>(API_ENDPOINTS.INSIGHTS.HEALTH_SCORE);
  return response.data.data;
};

export const getForecast = async (days: 7 | 30 = 30): Promise<ForecastData> => {
  const response = await api.get<ForecastApiResponse>(API_ENDPOINTS.INSIGHTS.FORECAST, {
    params: { days },
  });

  return response.data.data;
};

export const askInsightCopilot = async (
  question: string,
  options: { months?: number; days?: 7 | 30 } = {}
): Promise<CopilotResponse> => {
  const response = await api.post<CopilotApiResponse>(API_ENDPOINTS.INSIGHTS.CHAT, {
    question,
    ...options,
  });

  return response.data.data;
};

export const runWhatIfScenario = async (payload: WhatIfRequest): Promise<WhatIfResponse> => {
  const response = await api.post<WhatIfApiResponse>(API_ENDPOINTS.INSIGHTS.WHAT_IF, payload);
  return response.data.data;
};

export const submitInsightFeedback = async (
  payload: InsightFeedbackRequest
): Promise<Record<string, unknown>> => {
  const response = await api.post<InsightFeedbackApiResponse>(API_ENDPOINTS.INSIGHTS.FEEDBACK, payload);
  return response.data.data;
};
