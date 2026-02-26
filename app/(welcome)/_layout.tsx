/**
 * Welcome Layout - Pre-auth welcome/intro screens
 * This is shown BEFORE signup to introduce the app
 */

import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';

export default function WelcomeLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { data: userData, isLoading: userLoading } = useCurrentUser();

  // If authenticated and verified and onboarding completed, redirect to tabs
  // This prevents showing welcome screen to logged-in users
  if (!isLoading && !userLoading && isAuthenticated && userData?.data?.user) {
    const user = userData.data.user;
    if (user.isVerified && user.onboardingCompleted) {
      return <Redirect href="/(tabs)" />;
    }
    // If authenticated but not verified or onboarding incomplete, redirect to appropriate screen
    if (!user.isVerified) {
      return <Redirect href="/(auth)/verify-otp" />;
    }
    // If verified but onboarding incomplete, go to post-auth onboarding
    return <Redirect href="/(onboarding)/profile" />;
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
