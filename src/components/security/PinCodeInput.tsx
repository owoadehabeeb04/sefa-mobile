import React, { useEffect, useRef } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CELL_GAP = 10;
const MAX_CELL_WIDTH = 56;
// width : height ratio for each cell (slightly taller than wide).
const CELL_ASPECT_RATIO = 0.82;

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
      {/* Cells flex to share the available width, so the row always fits the
          screen (small/narrow Android phones included) and caps on large ones. */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: CELL_GAP }}>
        {Array.from({ length }).map((_, index) => {
          const hasDigit = Boolean(value[index]);

          return (
            <View
              key={index}
              style={{
                flex: 1,
                maxWidth: MAX_CELL_WIDTH,
                aspectRatio: CELL_ASPECT_RATIO,
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
