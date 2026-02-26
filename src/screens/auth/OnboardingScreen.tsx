/**
 * Welcome/Intro Screen - 3-step pre-auth introduction to the app
 * This is shown BEFORE signup to introduce users to the app features
 * After this, users go to signup/login
 * 
 * Note: This is NOT the post-auth onboarding (financial profile, consent, categories)
 * Those screens are separate and shown after email verification
 */

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, PanResponder } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/common/Button';
import { onboardingSlides } from '@/features/onboarding/onboarding.data';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToSlide = (newIndex: number, direction: 'left' | 'right') => {
    const slideDirection = direction === 'left' ? 20 : -20;
    
    // Fade out current content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideDirection,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update index
      setCurrentIndex(newIndex);
      
      // Reset position and fade in new content
      slideAnim.setValue(-slideDirection);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      animateToSlide(currentIndex + 1, 'left');
    } else {
      handleGetStarted();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      animateToSlide(currentIndex - 1, 'right');
    }
  };

  // Swipe gesture handler - recreated on each render to capture current index
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderRelease: (_, gestureState) => {
      // Swipe left (next)
      if (gestureState.dx < -50 && currentIndex < onboardingSlides.length - 1) {
        handleNext();
      }
      // Swipe right (previous)
      else if (gestureState.dx > 50 && currentIndex > 0) {
        handlePrevious();
      }
    },
  });

  const handleSkip = () => {
    router.replace('/(auth)/signup');
  };

  const handleGetStarted = () => {
    router.replace('/(auth)/signup');
  };

  const currentSlide = onboardingSlides[currentIndex];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }} {...panResponder.panHandlers}>
      {/* Top Section - Dark with Illustration */}
      <View 
        className="flex-[1.2] justify-end items-center pt-16 pb-8"
        style={{ 
          backgroundColor: colors.primary,
          borderBottomLeftRadius: 80,
          borderBottomRightRadius: 80,
        }}
      >
        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkip}
          className="absolute top-14 right-6 z-10 px-6 py-4"
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text className="text-white text-base font-semibold">
            Skip
          </Text>
        </TouchableOpacity>

        {/* Animated Illustration */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="items-center justify-center"
        >
          <SvgXml
            xml={currentSlide.illustration || ''}
            width={280}
            height={280}
          />
        </Animated.View>
      </View>

      {/* Bottom Section - White with Content */}
      <View className="flex-1 px-8 pt-10 pb-8 justify-between">
        {/* Animated Text Content */}
        <View>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="items-center"
          >
            <Text
              className="text-[32px] font-bold mb-4 text-center leading-tight"
              style={{ color: colors.text }}
            >
              {currentSlide.title}
            </Text>
            <Text
              className="text-lg text-center leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              {currentSlide.description}
            </Text>
          </Animated.View>

          {/* Pagination Dots */}
          <View className="flex-row justify-center mt-8">
            {onboardingSlides.map((_, index) => (
              <View
                key={index}
                className="h-2 rounded-full mx-1"
                style={{
                  width: currentIndex === index ? 24 : 8,
                  backgroundColor: currentIndex === index ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
        </View>

        {/* Navigation Button */}
        <View className="mt-8">
          <Button
            title={currentIndex === onboardingSlides.length - 1 ? "Get Started" : "Continue"}
            onPress={handleNext}
            fullWidth
            size="large"
          />
        </View>
      </View>
    </View>
  );
}
