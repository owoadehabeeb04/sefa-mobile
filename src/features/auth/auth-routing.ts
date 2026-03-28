import type { User } from './auth.types';
import type { OnboardingStatusResponse } from '@/features/onboarding/onboarding.service';

export type AppRoute =
  | '/(welcome)'
  | '/(auth)/login'
  | '/(auth)/verify-otp'
  | '/(onboarding)/profile'
  | '/(tabs)';

export const getOnboardingRoute = (
  _onboardingStatus?: OnboardingStatusResponse | null
): '/(onboarding)/profile' => {
  return '/(onboarding)/profile';
};

export const resolveAuthenticatedRoute = (
  user?: User | null,
  onboardingStatus?: OnboardingStatusResponse | null
): AppRoute => {
  if (!user) {
    return '/(welcome)';
  }

  if (!user.isVerified) {
    return '/(auth)/verify-otp';
  }

  if (!user.onboardingCompleted) {
    return getOnboardingRoute(onboardingStatus);
  }

  return '/(tabs)';
};
