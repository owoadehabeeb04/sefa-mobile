import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { useOnboardingStatus } from '@/features/onboarding/onboarding.hooks';
import { resolveAuthenticatedRoute } from '@/features/auth/auth-routing';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingStatus();

  // If authenticated and verified and onboarding completed, redirect to tabs
  if (!isLoading && !userLoading && !onboardingLoading && isAuthenticated && userData?.data?.user) {
    const destination = resolveAuthenticatedRoute(
      userData.data.user,
      onboardingData?.data || null
    );

    if (destination !== '/(auth)/verify-otp') {
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
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="verify-otp" />
    </Stack>
  );
}
