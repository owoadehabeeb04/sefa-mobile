import { Tabs, Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { AnimatedTabBar } from '@/components/navigation/AnimatedTabBar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { PushNotificationService } from '@/services/pushNotification.service';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { data: userData, isLoading: userLoading, isError } = useCurrentUser();

  // Guard: Redirect if not authenticated
  useEffect(() => {
    if (authLoading || userLoading) return;

    if (isError || !isAuthenticated || !userData?.data?.user) {
      router.replace('/(auth)/login');
      return;
    }

    const user = userData.data.user;

    // Check if email is verified
    if (!user.isVerified) {
      router.replace('/(auth)/verify-otp');
      return;
    }

    // Check if onboarding is completed (post-auth onboarding: financial profile, consent, categories)
    if (!user.onboardingCompleted) {
      router.replace('/(onboarding)/profile');
      return;
    }
  }, [authLoading, userLoading, isAuthenticated, userData, isError, router]);

  // Register for push notifications once authenticated
  useEffect(() => {
    if (isAuthenticated && userData?.data?.user) {
      PushNotificationService.registerAndSync().catch(() => {
        // Non-critical — ignore push registration failures silently
      });
    }
  }, [isAuthenticated, userData]);

  // Show nothing while checking auth status
  if (authLoading || userLoading) {
    return null;
  }

  // If not authenticated or not verified or onboarding not completed, redirect
  if (isError || !isAuthenticated || !userData?.data?.user || !userData.data.user.isVerified || !userData.data.user.onboardingCompleted) {
    return <Redirect href="/(auth)/login" />;
  }

  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
