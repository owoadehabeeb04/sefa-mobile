/**
 * Date Range Picker Component
 * Calendar modal for selecting custom date ranges
 */

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectRange: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function DateRangePicker({
  visible,
  onClose,
  onSelectRange,
  initialStartDate,
  initialEndDate,
}: DateRangePickerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [startDate, setStartDate] = useState<Date>(initialStartDate ? new Date(initialStartDate) : new Date());
  const [endDate, setEndDate] = useState<Date>(initialEndDate ? new Date(initialEndDate) : new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleApply = () => {
    // Format dates in local timezone (YYYY-MM-DD) to avoid timezone conversion issues
    // toISOString() converts to UTC which can shift the date to previous day
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const start = formatDateLocal(startDate);
    const end = formatDateLocal(endDate);
    onSelectRange(start, end);
    onClose();
  };

  const handleReset = () => {
    setStartDate(new Date());
    setEndDate(new Date());
  };

  const handlePreset = (preset: 'today' | 'week' | 'month' | 'year') => {
    const end = new Date();
    let start = new Date();

    switch (preset) {
      case 'today':
        start = new Date();
        break;
      case 'week':
        start = subDays(end, 7);
        break;
      case 'month':
        start = startOfMonth(end);
        break;
      case 'year':
        start = startOfYear(end);
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const formatDisplayDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={colorScheme}>
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={onClose}
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View
                className="rounded-t-3xl px-6 pt-6 pb-8"
                style={{ 
                  backgroundColor: colors.background,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Select Date Range
              </Text>
              <TouchableOpacity onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View className="mb-6">
              <Text className="text-xs font-semibold mb-3" style={{ color: colors.textTertiary }}>
                QUICK SELECT
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { label: 'Today', value: 'today' as const, icon: 'today' },
                  { label: 'Last 7 Days', value: 'week' as const, icon: 'calendar' },
                  { label: 'This Month', value: 'month' as const, icon: 'calendar-outline' },
                  { label: 'This Year', value: 'year' as const, icon: 'time' },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    onPress={() => handlePreset(preset.value)}
                    className="flex-row items-center px-4 py-3 rounded-xl"
                    style={{ backgroundColor: colors.backgroundSecondary, flex: 1, minWidth: '45%' }}
                  >
                    <Ionicons name={preset.icon as any} size={18} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Date Selection */}
            <View className="mb-6">
              <Text className="text-xs font-semibold mb-3" style={{ color: colors.textTertiary }}>
                CUSTOM RANGE
              </Text>
              
              {/* Start Date */}
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                className="flex-row items-center justify-between p-4 rounded-xl mb-3"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <View>
                  <Text className="text-xs mb-1" style={{ color: colors.textTertiary }}>
                    Start Date
                  </Text>
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {formatDisplayDate(startDate)}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              </TouchableOpacity>

              {/* End Date */}
              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                className="flex-row items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <View>
                  <Text className="text-xs mb-1" style={{ color: colors.textTertiary }}>
                    End Date
                  </Text>
                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                    {formatDisplayDate(endDate)}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center gap-3 mt-2">
              <TouchableOpacity
                onPress={handleReset}
                className="flex-1 py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApply}
                className="flex-1 py-4 rounded-xl items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Date Picker Modals for iOS */}
      {Platform.OS === 'ios' && showStartPicker && (
        <Modal transparent animationType="slide">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowStartPicker(false)}
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <View style={{ backgroundColor: colors.background, paddingBottom: 20 }}>
              <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                  <Text className="text-base" style={{ color: colors.primary }}>Cancel</Text>
                </TouchableOpacity>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Select Start Date</Text>
                <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                  <Text className="text-base font-semibold" style={{ color: colors.primary }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setStartDate(selectedDate);
                    if (selectedDate > endDate) {
                      setEndDate(selectedDate);
                    }
                  }
                }}
                maximumDate={new Date()}
                textColor={colors.text}
                style={{ backgroundColor: colors.background }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {Platform.OS === 'ios' && showEndPicker && (
        <Modal transparent animationType="slide">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowEndPicker(false)}
            className="flex-1 justify-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <View style={{ backgroundColor: colors.background, paddingBottom: 20 }}>
              <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                  <Text className="text-base" style={{ color: colors.primary }}>Cancel</Text>
                </TouchableOpacity>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>Select End Date</Text>
                <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                  <Text className="text-base font-semibold" style={{ color: colors.primary }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={endDate}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setEndDate(selectedDate);
                    if (selectedDate < startDate) {
                      setStartDate(selectedDate);
                    }
                  }
                }}
                minimumDate={startDate}
                maximumDate={new Date()}
                textColor={colors.text}
                style={{ backgroundColor: colors.background }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Android Date Pickers */}
      {Platform.OS === 'android' && showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
              if (selectedDate > endDate) {
                setEndDate(selectedDate);
              }
            }
          }}
          maximumDate={new Date()}
        />
      )}

      {Platform.OS === 'android' && showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
              if (selectedDate < startDate) {
                setStartDate(selectedDate);
              }
            }
          }}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}
    </Modal>
  );
}
