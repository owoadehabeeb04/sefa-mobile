/**
 * React Query hooks for onboarding
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import type { ApiResponse, User } from '@/features/auth/auth.types';
import {
  recordConsent,
  completeOnboarding,
  getOnboardingStatus,
  type RecordConsentRequest,
  type OnboardingStatusResponse,
} from './onboarding.service';

/**
 * Record consent mutation
 */
export const useRecordConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordConsentRequest) => recordConsent(data),
    onSuccess: async (response) => {
      if (response.success && response.data?.user) {
        queryClient.setQueryData<ApiResponse<{ user: User }>>(['user'], (current) => {
          if (!current?.data?.user) {
            return current;
          }

          return {
            ...current,
            data: {
              ...current.data,
              user: {
                ...current.data.user,
                onboardingStatus:
                  response.data.user.onboardingStatus || current.data.user.onboardingStatus,
              },
            },
          };
        });

        queryClient.setQueryData<ApiResponse<OnboardingStatusResponse>>(
          ['onboarding-status'],
          (current) => {
            if (!current?.data) {
              return current;
            }

            return {
              ...current,
              data: {
                ...current.data,
                onboardingStatus:
                  response.data.user.onboardingStatus || current.data.onboardingStatus,
                steps: {
                  ...current.data.steps,
                  consentGiven: true,
                  categoriesInitialized: true,
                },
              },
            };
          }
        );

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['user'] }),
          queryClient.invalidateQueries({ queryKey: ['onboarding-status'] }),
        ]);
      }
    },
  });
};

/**
 * Complete onboarding mutation
 */
export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completeOnboarding(),
    onSuccess: async (response) => {
      if (response.success && response.data?.user) {
        queryClient.setQueryData<ApiResponse<{ user: User }>>(['user'], (current) => {
          if (!current?.data?.user) {
            return current;
          }

          return {
            ...current,
            data: {
              ...current.data,
              user: {
                ...current.data.user,
                onboardingCompleted: true,
                onboardingStatus:
                  response.data.user.onboardingStatus || current.data.user.onboardingStatus,
              },
            },
          };
        });

        queryClient.setQueryData<ApiResponse<OnboardingStatusResponse>>(
          ['onboarding-status'],
          (current) => {
            if (!current?.data) {
              return current;
            }

            return {
              ...current,
              data: {
                ...current.data,
                onboardingCompleted: true,
                onboardingStatus:
                  response.data.user.onboardingStatus || current.data.onboardingStatus,
              },
            };
          }
        );

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['user'] }),
          queryClient.invalidateQueries({ queryKey: ['onboarding-status'] }),
        ]);
      }
    },
  });
};

/**
 * Get onboarding status query
 */
export const useOnboardingStatus = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: getOnboardingStatus,
    enabled: isAuthenticated,
    retry: false,
  });
};
