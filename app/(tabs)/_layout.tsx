import { Tabs, Redirect } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NotificationResponse } from 'expo-notifications';

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
  const handledNotificationResponseId = useRef<string | null>(null);

  const navigateFromNotificationResponse = useCallback((response: NotificationResponse | null) => {
    const responseId = response?.notification?.request?.identifier ?? null;
    if (responseId && handledNotificationResponseId.current === responseId) {
      return;
    }

    handledNotificationResponseId.current = responseId;
    const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
    const notificationId = typeof data?.notificationId === 'string' ? data.notificationId : null;

    if (notificationId) {
      router.push(`/(tabs)/notifications/${notificationId}` as any);
      return;
    }

    router.push('/(tabs)/notifications');
  }, [router]);

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

  useEffect(() => {
    if (!isAuthenticated || !userData?.data?.user) {
      return;
    }

    let isMounted = true;

    PushNotificationService.getLastNotificationResponse()
      .then((response) => {
        if (!isMounted || !response) return;
        navigateFromNotificationResponse(response);
      })
      .catch(() => {
        // Best effort only.
      });

    const subscription = PushNotificationService.addResponseListener((response) => {
      navigateFromNotificationResponse(response);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [isAuthenticated, navigateFromNotificationResponse, userData]);

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
      <Tabs.Screen name="settings" />
      {/* Hidden routes – still navigable but not shown in tab bar */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="notifications/[id]" options={{ href: null }} />
    </Tabs>
  );
}
