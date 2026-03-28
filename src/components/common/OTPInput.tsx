/**
 * OTP Input Component
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OTPInputProps {
  length?: number;
  value?: string;
  onChangeOTP: (otp: string) => void;
  error?: string;
  disabled?: boolean;
  clearSignal?: number;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value = '',
  onChangeOTP,
  error,
  disabled = false,
  clearSignal = 0,
  autoFocus = true,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const inputRef = useRef<TextInput | null>(null);
  const prevClearSignalRef = useRef(clearSignal);
  const [isFocused, setIsFocused] = useState(false);

  const normalizedValue = useMemo(
    () => value.replace(/\D/g, '').slice(0, length),
    [length, value]
  );

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (prevClearSignalRef.current === clearSignal) {
      return;
    }

    prevClearSignalRef.current = clearSignal;

    if (!disabled) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [clearSignal, disabled]);

  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleChangeText = (text: string) => {
    const nextValue = text.replace(/\D/g, '').slice(0, length);
    if (nextValue !== normalizedValue) {
      onChangeOTP(nextValue);
    }
  };

  const hasError = Boolean(error);
  const boxWidth = length <= 4 ? '22%' : '15%';

  return (
    <View className="w-full">
      <Pressable
        onPress={focusInput}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="One-time password input"
        accessibilityHint="Double tap to enter or paste the full verification code"
      >
        <View className="relative">
          <TextInput
            ref={inputRef}
            value={normalizedValue}
            onChangeText={handleChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            importantForAutofill="yes"
            maxLength={length}
            editable={!disabled}
            allowFontScaling={false}
            selectionColor={colors.primary}
            contextMenuHidden={false}
            caretHidden={Platform.OS !== 'android'}
            accessibilityLabel="One-time password"
            className="absolute inset-0"
            style={{
              opacity: 0.015,
              zIndex: 2,
            }}
          />

          <View className="flex-row justify-between mb-3">
            {Array.from({ length }, (_, index) => {
              const digit = normalizedValue[index] || '';
              const isActive =
                !disabled &&
                isFocused &&
                (index === normalizedValue.length
                  || (normalizedValue.length === length && index === length - 1));

              return (
                <View
                  key={index}
                  className={`h-16 rounded-2xl border-2 items-center justify-center ${disabled ? 'opacity-60' : ''}`}
                  style={{
                    width: boxWidth,
                    borderColor: hasError
                      ? colors.error
                      : isActive || digit
                        ? colors.primary
                        : colors.border,
                    backgroundColor: disabled ? colors.backgroundSecondary : colors.background,
                    shadowColor: digit || isActive ? colors.primary : 'transparent',
                    shadowOpacity: digit || isActive ? 0.1 : 0,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: colors.text }}
                    accessible={false}
                  >
                    {digit}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Pressable>

      <Text
        className="text-sm text-center"
        style={{ color: hasError ? colors.error : colors.textSecondary, minHeight: 20 }}
        accessibilityLiveRegion="polite"
      >
        {error || 'Enter the 6-digit code exactly as it appears in your email.'}
      </Text>
    </View>
  );
};
