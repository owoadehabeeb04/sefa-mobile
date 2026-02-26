/**
 * React Query hooks for onboarding
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import {
  setupProfile,
  recordConsent,
  completeOnboarding,
  getOnboardingStatus,
  type SetupProfileRequest,
  type RecordConsentRequest,
} from './onboarding.service';

/**
 * Setup profile mutation
 */
export const useSetupProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetupProfileRequest) => setupProfile(data),
    onSuccess: (response) => {
      if (response.success && response.data?.user) {
        // Invalidate user query to refetch updated user data
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      }
    },
  });
};

/**
 * Record consent mutation
 */
export const useRecordConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordConsentRequest) => recordConsent(data),
    onSuccess: (response) => {
      if (response.success && response.data?.user) {
        // Invalidate user query to refetch updated user data
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
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
    onSuccess: (response) => {
      if (response.success && response.data?.user) {
        // Invalidate user query to refetch updated user data with completed onboarding status
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      }
    },
  });
};

/**
 * Get onboarding status query
 */
export const useOnboardingStatus = () => {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: getOnboardingStatus,
    retry: false,
  });
};
