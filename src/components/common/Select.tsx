/**
 * Select/Dropdown Component
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface SelectProps {
  label?: string;
  value?: string;
  options: readonly SelectOption[] | SelectOption[];
  onSelect?: (value: string) => void;
  onChange?: (value: string) => void; // Alias for onSelect
  placeholder?: string;
  error?: string;
  containerClassName?: string;
  optional?: boolean;
  icon?: string;
  color?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onSelect,
  onChange,
  placeholder = 'Select an option',
  error,
  containerClassName = '',
  optional = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selectedOption = options.find((opt) => opt.value === value);

  // Use onChange if provided, otherwise use onSelect
  const handleChange = onChange || onSelect;

  useEffect(() => {
    if (isOpen) {
      // Slide up animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (handleChange) {
      handleChange(optionValue);
    }
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <View className="flex-row items-center mb-2">
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.text }}
          >
            {label}
          </Text>
          {optional && (
            <Text
              className="text-xs ml-2"
              style={{ color: colors.textTertiary }}
            >
              (Optional)
            </Text>
          )}
        </View>
      )}
      
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between rounded-xl border"
        style={{
          borderColor: error ? colors.error : colors.border,
          backgroundColor: colors.backgroundSecondary,
          height: 52,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center flex-1">
          {selectedOption?.icon && (
            <View
              className="w-7 h-7 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: selectedOption.color ? `${selectedOption.color}15` : colors.backgroundTertiary }}
            >
              <Ionicons
                name={selectedOption.icon as any}
                size={14}
                color={selectedOption.color || colors.primary}
              />
            </View>
          )}
          <Text
            className="flex-1 text-[15px]"
            style={{
              color: selectedOption ? colors.text : colors.textTertiary,
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {error && (
        <Text
          className="text-sm mt-1.5"
          style={{ color: colors.error }}
        >
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  opacity: fadeAnim,
                },
              ]}
            />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Handle bar */}
            <View className="items-center mb-4">
              <View
                className="w-12 h-1 rounded-full"
                style={{ backgroundColor: colors.border }}
              />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between mb-4 pb-4 border-b" style={{ borderBottomColor: colors.border }}>
              <Text
                className="text-lg font-semibold"
                style={{ color: colors.text }}
              >
                {label || 'Select an option'}
              </Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item.value)}
                  className="py-4 px-4 rounded-lg mb-1"
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: value === item.value ? colors.primaryBackground : 'transparent',
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      {item.icon && (
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: item.color ? `${item.color}15` : colors.backgroundSecondary }}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={16}
                            color={item.color || colors.primary}
                          />
                        </View>
                      )}
                      <Text
                        className="text-base"
                        style={{
                          color: value === item.value ? colors.primary : colors.text,
                          fontWeight: value === item.value ? '600' : '400',
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {value === item.value && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
});
