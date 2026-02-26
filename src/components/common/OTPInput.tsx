/**
 * OTP Input Component - 4 digit OTP input
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  error,
  disabled = false,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === length) {
      onComplete(otpString);
    }
  }, [otp, length, onComplete]);

  const handleChange = (text: string, index: number) => {
    if (disabled) return;

    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // Handle paste
      const pastedDigits = numericText.slice(0, length);
      const newOtp = [...otp];
      pastedDigits.split('').forEach((digit, i) => {
        if (index + i < length) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus next empty input or last input
      const nextIndex = Math.min(index + pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single digit input
      const newOtp = [...otp];
      newOtp[index] = numericText;
      setOtp(newOtp);

      // Auto-focus next input
      if (numericText && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  return (
    <View className="w-full">
      <View className="flex-row justify-between mb-2 flex-wrap">
        {otp.map((digit, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleFocus(index)}
            activeOpacity={0.7}
            disabled={disabled}
            className="mb-2"
            style={{ width: length <= 4 ? '22%' : '15%' }}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!disabled}
              className={`
                w-full
                ${length <= 4 ? 'h-16' : 'h-14'}
                rounded-xl
                border-2
                text-center
                ${length <= 4 ? 'text-2xl' : 'text-xl'}
                font-bold
                ${disabled ? 'opacity-50' : ''}
              `}
              style={{
                borderColor: error ? colors.error : colors.border,
                backgroundColor: colors.background,
                color: colors.text,
              }}
            />
          </TouchableOpacity>
        ))}
      </View>
      {error && (
        <Text
          className="text-sm text-center"
          style={{ color: colors.error }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
