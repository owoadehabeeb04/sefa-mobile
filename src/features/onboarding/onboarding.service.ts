/**
 * Onboarding Service
 * API calls for onboarding endpoints
 */

import api from '@/services/api';
import type { ApiResponse } from '../auth/auth.types';

const API_BASE = '/onboarding';

export interface SetupProfileRequest {
  incomeType: 'salary' | 'business' | 'freelance' | 'mixed' | 'other';
  incomeFrequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';
  averageIncome?: number;
  financialGoals?: string[];
}

export interface RecordConsentRequest {
  dataAnalysis: boolean;
}

export interface OnboardingStatusResponse {
  onboardingCompleted: boolean;
  onboardingStatus: string;
  steps: {
    profileCompleted: boolean;
    consentGiven: boolean;
    categoriesInitialized: boolean;
  };
  categoriesCount: number;
}

export interface SetupProfileResponse {
  user: {
    id: string;
    onboardingStatus: string;
    financialProfile: {
      incomeType: string;
      incomeFrequency: string;
      averageIncome?: number;
      financialGoals?: string[];
    };
  };
}

export interface RecordConsentResponse {
  user: {
    id: string;
    onboardingStatus: string;
    consent: {
      dataAnalysis: boolean;
      timestamp: string;
    };
  };
}

export interface CompleteOnboardingResponse {
  user: {
    id: string;
    onboardingCompleted: boolean;
    onboardingStatus: string;
  };
}

/**
 * Setup financial profile
 */
export const setupProfile = async (data: SetupProfileRequest): Promise<ApiResponse<SetupProfileResponse>> => {
  const response = await api.post<ApiResponse<SetupProfileResponse>>(
    `${API_BASE}/profile`,
    data
  );
  return response.data;
};

/**
 * Record user consent
 */
export const recordConsent = async (data: RecordConsentRequest): Promise<ApiResponse<RecordConsentResponse>> => {
  const response = await api.post<ApiResponse<RecordConsentResponse>>(
    `${API_BASE}/consent`,
    data
  );
  return response.data;
};

/**
 * Complete onboarding
 */
export const completeOnboarding = async (): Promise<ApiResponse<CompleteOnboardingResponse>> => {
  const response = await api.post<ApiResponse<CompleteOnboardingResponse>>(
    `${API_BASE}/complete`
  );
  return response.data;
};

/**
 * Get onboarding status
 */
export const getOnboardingStatus = async (): Promise<ApiResponse<OnboardingStatusResponse>> => {
  const response = await api.get<ApiResponse<OnboardingStatusResponse>>(
    `${API_BASE}/status`
  );
  return response.data;
};
