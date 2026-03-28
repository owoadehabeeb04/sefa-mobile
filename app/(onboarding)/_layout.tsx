/**
 * Onboarding Layout - Post-auth onboarding screen
 */

import { Stack, Redirect, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Loading } from '@/src/components/common/Loading';
import { useOnboardingStatus } from '@/features/onboarding/onboarding.hooks';
import { getOnboardingRoute } from '@/features/auth/auth-routing';

export default function OnboardingLayout() {
  const segments = useSegments();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { data: userData, isLoading: userLoading, isError } = useCurrentUser();
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingStatus();

  // Show loading while checking auth status
  if (authLoading || userLoading || onboardingLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  // If not authenticated or error fetching user, redirect to welcome
  if (!isAuthenticated || isError || !userData?.data?.user) {
    return <Redirect href="/(welcome)" />;
  }

  const user = userData.data.user;

  // If not verified, redirect to OTP verification
  if (!user.isVerified) {
    return <Redirect href="/(auth)/verify-otp" />;
  }

  // If onboarding is already completed, redirect to main app
  if (user.onboardingCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  const desiredRoute = getOnboardingRoute(onboardingData?.data || null);
  const currentScreen = segments[segments.length - 1];
  const desiredScreen = desiredRoute.split('/').pop();

  if (currentScreen !== desiredScreen) {
    return <Redirect href={desiredRoute} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile" />
    </Stack>
  );
}
