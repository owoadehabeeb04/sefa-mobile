import React, { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';

export type MotionPreset = 'subtle' | 'none';
type DelayGroup = 'xs' | 'sm' | 'md' | 'lg';

const DELAY_TOKENS: Record<DelayGroup, number> = {
  xs: 35,
  sm: 55,
  md: 80,
  lg: 110,
};

const MAX_STAGGERED_ITEMS = 8;

interface BaseMotionProps {
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  children: React.ReactNode;
  preset?: MotionPreset;
}

export const useReducedMotionEnabled = () => {
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setReducedMotionEnabled(enabled);
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReducedMotionEnabled
    );

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reducedMotionEnabled;
};

const useMotionEnabled = (preset: MotionPreset) => {
  const reducedMotionEnabled = useReducedMotionEnabled();

  return useMemo(
    () => preset !== 'none' && !reducedMotionEnabled,
    [preset, reducedMotionEnabled]
  );
};

export const getStaggerDelay = (
  index: number,
  group: DelayGroup = 'md',
  maxItems = MAX_STAGGERED_ITEMS
) => Math.max(0, Math.min(index, maxItems - 1)) * DELAY_TOKENS[group];

export const shouldAnimateListItem = (
  index: number,
  total: number,
  maxAnimated = MAX_STAGGERED_ITEMS
) => total <= maxAnimated || index < maxAnimated;

export function FadeIn({
  delay = 0,
  duration = 320,
  style,
  className,
  children,
  preset = 'subtle',
}: BaseMotionProps) {
  const motionEnabled = useMotionEnabled(preset);

  return (
    <Animated.View
      entering={motionEnabled ? FadeInDown.delay(delay).duration(duration) : undefined}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

export function FadeUp({
  delay = 0,
  duration = 300,
  style,
  className,
  children,
  preset = 'subtle',
}: BaseMotionProps) {
  const motionEnabled = useMotionEnabled(preset);

  return (
    <Animated.View
      entering={motionEnabled ? FadeInUp.delay(delay).duration(duration) : undefined}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

export function ScaleIn({
  delay = 0,
  duration = 340,
  style,
  className,
  children,
  preset = 'subtle',
}: BaseMotionProps) {
  const motionEnabled = useMotionEnabled(preset);

  return (
    <Animated.View
      entering={
        motionEnabled
          ? ZoomIn.delay(delay).duration(duration).springify().damping(16)
          : undefined
      }
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

export function SlideIn({
  delay = 0,
  duration = 280,
  style,
  className,
  children,
  preset = 'subtle',
}: BaseMotionProps) {
  const motionEnabled = useMotionEnabled(preset);

  return (
    <Animated.View
      entering={
        motionEnabled
          ? SlideInRight.delay(delay).duration(duration).springify().damping(18)
          : undefined
      }
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

interface AnimatedScreenSectionProps {
  index?: number;
  group?: DelayGroup;
  style?: StyleProp<ViewStyle>;
  className?: string;
  children: React.ReactNode;
  variant?: 'fade' | 'fadeUp' | 'scale' | 'slide';
  preset?: MotionPreset;
}

export function AnimatedScreenSection({
  index = 0,
  group = 'md',
  style,
  className,
  children,
  variant = 'fade',
  preset = 'subtle',
}: AnimatedScreenSectionProps) {
  const delay = getStaggerDelay(index, group);

  if (variant === 'fadeUp') {
    return (
      <FadeUp delay={delay} style={style} className={className} preset={preset}>
        {children}
      </FadeUp>
    );
  }

  if (variant === 'scale') {
    return (
      <ScaleIn delay={delay} style={style} className={className} preset={preset}>
        {children}
      </ScaleIn>
    );
  }

  if (variant === 'slide') {
    return (
      <SlideIn delay={delay} style={style} className={className} preset={preset}>
        {children}
      </SlideIn>
    );
  }

  return (
    <FadeIn delay={delay} style={style} className={className} preset={preset}>
      {children}
    </FadeIn>
  );
}

interface AnimatedListItemProps {
  index: number;
  total: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  group?: DelayGroup;
  variant?: 'fade' | 'slide';
  maxAnimated?: number;
}

export function AnimatedListItem({
  index,
  total,
  children,
  style,
  className,
  group = 'sm',
  variant = 'slide',
  maxAnimated = MAX_STAGGERED_ITEMS,
}: AnimatedListItemProps) {
  const preset = shouldAnimateListItem(index, total, maxAnimated) ? 'subtle' : 'none';
  const delay = getStaggerDelay(index, group, maxAnimated);

  if (variant === 'fade') {
    return (
      <FadeIn delay={delay} style={style} className={className} preset={preset}>
        {children}
      </FadeIn>
    );
  }

  return (
    <SlideIn delay={delay} style={style} className={className} preset={preset}>
      {children}
    </SlideIn>
  );
}
