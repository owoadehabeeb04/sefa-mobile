/**
 * Animated Tab Bar Component
 * Features: Sliding indicator, spring animations, smooth transitions
 */

import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
// Badge removed — notifications is no longer a tab

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VISIBLE_TAB_NAMES = ['index', 'add', 'transactions', 'insights', 'settings'] as const;

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Render only the primary 5 tabs regardless of hidden nested routes
  const visibleRoutes = VISIBLE_TAB_NAMES
    .map((name) => state.routes.find((route) => route.name === name))
    .filter((route): route is typeof state.routes[number] => Boolean(route));

  const visibleIndexMap = new Map(visibleRoutes.map((r, i) => [r.key, i]));
  const focusedVisibleIndex = visibleIndexMap.get(state.routes[state.index]?.key) ?? 0;
  const tabWidth = SCREEN_WIDTH / Math.max(visibleRoutes.length, 1);



  // Animated value for sliding indicator
  const slideAnim = useSharedValue(0);

  useEffect(() => {
    // Animate to new position with smooth spring
    slideAnim.value = withSpring(focusedVisibleIndex * tabWidth, {
      damping: 18,
      stiffness: 180,
      mass: 0.5,
      overshootClamping: false,
    });
  }, [focusedVisibleIndex, tabWidth]);

  const getIconName = (routeName: string, focused: boolean): string => {
    const icons: Record<string, { focused: string; unfocused: string }> = {
      index: {
        focused: 'home',
        unfocused: 'home-outline',
      },
      add: {
        focused: 'add-circle',
        unfocused: 'add-circle-outline',
      },
      transactions: {
        focused: 'list',
        unfocused: 'list-outline',
      },
      insights: {
        focused: 'trending-up',
        unfocused: 'trending-up-outline',
      },
      notifications: {
        focused: 'notifications',
        unfocused: 'notifications-outline',
      },
      settings: {
        focused: 'settings',
        unfocused: 'settings-outline',
      },
    };

    const icon = icons[routeName] || icons.index;
    return focused ? icon.focused : icon.unfocused;
  };

  const getLabel = (routeName: string): string => {
    const labels: Record<string, string> = {
      index: 'Home',
      add: 'Add',
      transactions: 'Transactions',
      insights: 'Insights',
      notifications: 'Alerts',
      settings: 'Settings',
    };
    return labels[routeName] || routeName;
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideAnim.value }],
    };
  });

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }}>
      <View style={{ backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
        {/* Animated Sliding Indicator */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              height: 3,
              width: tabWidth * 0.4,
              marginLeft: tabWidth * 0.3,
              backgroundColor: colors.primary,
              borderRadius: 3,
            },
            animatedStyle,
          ]}
        />

        {/* Tab Buttons */}
        <View className="flex-row items-center justify-around pt-2 pb-1">
          {visibleRoutes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = focusedVisibleIndex === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const iconName = getIconName(route.name, isFocused);
            const label = getLabel(route.name);
            const isAddButton = route.name === 'add';


            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                className="flex-1 items-center justify-center py-1"
              >
                <View
                  className="items-center justify-center rounded-xl px-3 py-1.5"
                  style={{
                    backgroundColor: isFocused ? `${colors.primary}15` : 'transparent',
                  }}
                >
                  {/* Icon */}
                  <View className="mb-0.5">
                    <View>
                      <Ionicons
                        name={iconName as any}
                        size={isAddButton ? 26 : 22}
                        color={isFocused ? colors.primary : colors.tabIconDefault}
                      />

                    </View>
                  </View>

                  {/* Label */}
                  <Text
                    className="text-[10px] font-semibold"
                    style={{
                      color: isFocused ? colors.primary : colors.tabIconDefault,
                    }}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
