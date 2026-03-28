/**
 * Welcome Layout - Pre-auth welcome/intro screens
 * This is shown BEFORE signup to introduce the app
 */

import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { useOnboardingStatus } from '@/features/onboarding/onboarding.hooks';
import { resolveAuthenticatedRoute } from '@/features/auth/auth-routing';

export default function WelcomeLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingStatus();

  // If authenticated and verified and onboarding completed, redirect to tabs
  // This prevents showing welcome screen to logged-in users
  if (!isLoading && !userLoading && !onboardingLoading && isAuthenticated && userData?.data?.user) {
    const destination = resolveAuthenticatedRoute(
      userData.data.user,
      onboardingData?.data || null
    );

    if (destination !== '/(welcome)') {
      return <Redirect href={destination} />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
