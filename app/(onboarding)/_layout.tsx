/**
 * Onboarding Layout - Post-auth onboarding screens
 * Financial profile setup and consent acceptance
 */

import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { Loading } from '@/src/components/common/Loading';

export default function OnboardingLayout() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { data: userData, isLoading: userLoading, isError } = useCurrentUser();

  // Show loading while checking auth status
  if (authLoading || userLoading) {
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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="consent" />
    </Stack>
  );
}
