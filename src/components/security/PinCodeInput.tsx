import React, { useEffect, useRef } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PinCodeInputProps {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const PinCodeInput: React.FC<PinCodeInputProps> = ({
  value,
  onChangeText,
  length = 6,
  disabled = false,
  autoFocus = false,
}) => {
  const inputRef = useRef<TextInput | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    if (autoFocus && !disabled) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [autoFocus, disabled]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      disabled={disabled}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        {Array.from({ length }).map((_, index) => {
          const hasDigit = Boolean(value[index]);

          return (
            <View
              key={index}
              style={{
                width: 44,
                height: 54,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: hasDigit ? colors.primary : colors.border,
                backgroundColor: colors.backgroundSecondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: '700',
                }}
              >
                {hasDigit ? '•' : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        editable={!disabled}
        textContentType="oneTimeCode"
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
        }}
      />
    </TouchableOpacity>
  );
};
