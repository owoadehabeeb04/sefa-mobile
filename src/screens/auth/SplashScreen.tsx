/**
 * Splash Screen - First screen on app launch
 * Handles authentication and onboarding routing
 * Shows logo briefly before navigating
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { resolveAuthenticatedRoute } from '@/features/auth/auth-routing';
import { getLastProtectedRoute } from '@/features/security/lastRoute.service';
import { sefaLogoSvg } from '@/assets/illustrations';

export default function SplashScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const lastRouteRef = useRef<string | null>(null);
  const [isLastRouteReady, setIsLastRouteReady] = useState(false);
  
  const { initializeAuth, isLoading: authLoading, isAuthenticated, setUser, clearAuth } = useAuthStore();
  const { data: userData, isLoading: userLoading, isError } = useCurrentUser();

  // Animate logo in on mount (so it actually appears)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Initialize auth on mount
  useEffect(() => {
    void Promise.all([
      initializeAuth(),
      getLastProtectedRoute().then((route) => {
        lastRouteRef.current = route;
        setIsLastRouteReady(true);
      }),
    ]);
  }, [initializeAuth]);

  // Update user in store when fetched
  useEffect(() => {
    if (userData?.success && userData.data?.user) {
      setUser(userData.data.user);
    }
  }, [userData, setUser]);

  // Handle invalid token - clear auth if user fetch fails
  useEffect(() => {
    if (isError && isAuthenticated) {
      clearAuth();
    }
  }, [isError, isAuthenticated, clearAuth]);

  // Route as soon as session validation finishes; the native splash already covers startup.
  useEffect(() => {
    if (authLoading || userLoading || !isLastRouteReady) return;

    if (isError || !isAuthenticated || !userData?.data?.user) {
      router.replace('/(welcome)');
      return;
    }

    const fallbackRoute = resolveAuthenticatedRoute(userData.data.user, null);
    const restoredRoute = userData.data.user.onboardingCompleted ? lastRouteRef.current : null;
    router.replace((restoredRoute || fallbackRoute) as any);
  }, [authLoading, userLoading, isLastRouteReady, isAuthenticated, userData, isError, router]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.primary }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center justify-center"
      >
        {/* SEFA Logo */}
        <View className="mb-4">
          <SvgXml
            xml={sefaLogoSvg}
            width={140}
            height={140}
          />
        </View>
        
        {/* SEFA Text */}
        <Text
          className="text-5xl font-bold text-center tracking-widest mb-8"
          style={{ color: '#FFFFFF', letterSpacing: 8 }}
        >
          SEFA
        </Text>

        {/* Loading Indicator */}
        <ActivityIndicator size="small" color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}
