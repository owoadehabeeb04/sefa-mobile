/**
 * Splash Screen - First screen on app launch
 * Handles authentication and onboarding routing
 * Shows logo for at least 10 seconds before navigating
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/features/auth/auth.hooks';
import { sefaLogoSvg } from '@/assets/illustrations';

const MIN_SPLASH_DURATION_MS = 10000; // 10 seconds minimum

export default function SplashScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const mountTimeRef = useRef<number>(Date.now());
  
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
    initializeAuth();
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

  // Navigate only after auth/user are ready AND at least 10 seconds have passed
  useEffect(() => {
    if (authLoading || userLoading) return;

    const elapsed = Date.now() - mountTimeRef.current;
    const waitMs = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);

    const timer = setTimeout(() => {
      if (isError || !isAuthenticated || !userData?.data?.user) {
        router.replace('/(welcome)');
        return;
      }

      const user = userData.data.user;

      if (!user.isVerified) {
        router.replace('/(auth)/verify-otp');
        return;
      }

      if (!user.onboardingCompleted) {
        router.replace('/(onboarding)/profile');
        return;
      }

      router.replace('/(tabs)');
    }, waitMs);

    return () => clearTimeout(timer);
  }, [authLoading, userLoading, isAuthenticated, userData, isError, router]);

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
