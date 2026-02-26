import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { data: userData, isLoading: userLoading } = useCurrentUser();

  // If authenticated and verified and onboarding completed, redirect to tabs
  if (!isLoading && !userLoading && isAuthenticated && userData?.data?.user) {
    const user = userData.data.user;
    if (user.isVerified && user.onboardingCompleted) {
      return <Redirect href="/(tabs)" />;
    }
    // If verified but onboarding not completed, redirect to onboarding
    if (user.isVerified && !user.onboardingCompleted) {
      return <Redirect href="/(onboarding)/profile" />;
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
