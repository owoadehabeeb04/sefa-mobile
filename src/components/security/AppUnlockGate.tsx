import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  describeAppLockMethod,
} from '@/features/security/appLock.service';
import { useAppLockStore } from '@/store/appLock.store';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/src/components/common/Button';
import { PinCodeInput } from './PinCodeInput';

const UNPROTECTED_SEGMENTS = new Set(['(auth)', '(welcome)', 'splash']);

const getStepUpCopy = (action?: string) => {
  switch (action) {
    case 'connect_bank':
      return {
        title: 'Confirm it’s you',
        subtitle: 'Unlock with biometrics or your PIN before connecting a bank account.',
      };
    case 'disconnect_bank':
      return {
        title: 'Confirm it’s you',
        subtitle: 'Unlock with biometrics or your PIN before disconnecting this bank account.',
      };
    case 'change_password':
      return {
        title: 'Confirm it’s you',
        subtitle: 'Unlock with biometrics or your PIN before changing your password.',
      };
    default:
      return {
        title: 'Confirm it’s you',
        subtitle: 'Unlock with biometrics or your PIN to continue.',
      };
  }
};

export const AppUnlockGate: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const segments = useSegments();
  const firstSegment = String(segments[0] || '');
  const isProtectedRoute = !UNPROTECTED_SEGMENTS.has(firstSegment);

  const {
    settings,
    biometricStatus,
    isInitialized,
    isLocked,
    lockReason,
    lockedUntil,
    stepUpRequest,
    initialize,
    maybeLockOnForeground,
    maybeLockOnLaunch,
    noteBackgrounded,
    unlockWithBiometrics,
    unlockWithPin,
    cancelStepUp,
    clearSessionState,
  } = useAppLockStore();
  const { isAuthenticated, didRestoreSession } = useAuthStore();

  const [pin, setPin] = useState('');
  const [showPinFallback, setShowPinFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [remainingLockoutMs, setRemainingLockoutMs] = useState(0);
  const attemptedKeyRef = useRef<string | null>(null);

  const requestKey = useMemo(() => {
    if (stepUpRequest) {
      return `step-up:${stepUpRequest.action}`;
    }

    if (isLocked) {
      return `lock:${lockReason || 'app_launch'}`;
    }

    return null;
  }, [isLocked, lockReason, stepUpRequest]);

  const canUseBiometrics =
    settings.lockEnabled && settings.biometricEnabled && biometricStatus.available;

  const isVisible =
    isInitialized
    && isAuthenticated
    && isProtectedRoute
    && settings.lockEnabled
    && (isLocked || Boolean(stepUpRequest));

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearSessionState();
    }
  }, [clearSessionState, isAuthenticated]);

  useEffect(() => {
    maybeLockOnLaunch({
      didRestoreSession,
      isAuthenticated,
      isProtectedRoute,
    });
  }, [didRestoreSession, isAuthenticated, isProtectedRoute, maybeLockOnLaunch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        maybeLockOnForeground(isAuthenticated);
        return;
      }

      if (nextState === 'background' || nextState === 'inactive') {
        noteBackgrounded();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, maybeLockOnForeground, noteBackgrounded]);

  useEffect(() => {
    if (!requestKey) {
      return;
    }

    setPin('');
    setErrorMessage('');
    setIsAuthenticating(false);
    setShowPinFallback(!canUseBiometrics);
    attemptedKeyRef.current = null;
  }, [canUseBiometrics, requestKey]);

  useEffect(() => {
    if (!lockedUntil) {
      setRemainingLockoutMs(0);
      return;
    }

    const updateCountdown = () => {
      setRemainingLockoutMs(Math.max(0, lockedUntil - Date.now()));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const copy = stepUpRequest
    ? getStepUpCopy(stepUpRequest.action)
    : {
        title: 'Unlock SEFA',
        subtitle: `Use ${describeAppLockMethod(settings, biometricStatus)} to continue.`,
      };

  const triggerBiometric = useCallback(async () => {
    if (isAuthenticating) {
      return;
    }

    setIsAuthenticating(true);
    setErrorMessage('');
    const result = await unlockWithBiometrics();
    setIsAuthenticating(false);

    if (!result.success) {
      setShowPinFallback(true);
      if (result.message) {
        setErrorMessage(result.message);
      }
    }
  }, [isAuthenticating, unlockWithBiometrics]);

  useEffect(() => {
    if (!isVisible || !canUseBiometrics || showPinFallback || isAuthenticating || remainingLockoutMs > 0) {
      return;
    }

    if (attemptedKeyRef.current === requestKey) {
      return;
    }

    attemptedKeyRef.current = requestKey;
    triggerBiometric();
  }, [canUseBiometrics, isAuthenticating, isVisible, remainingLockoutMs, requestKey, showPinFallback, triggerBiometric]);

  useEffect(() => {
    if (!showPinFallback || pin.length !== 6 || isAuthenticating) {
      return;
    }

    const submitPin = async () => {
      setIsAuthenticating(true);
      const result = await unlockWithPin(pin);
      setIsAuthenticating(false);

      if (!result.success) {
        setPin('');
        setErrorMessage(result.message || 'Incorrect PIN');
        return;
      }

      setPin('');
      setErrorMessage('');
    };

    submitPin();
  }, [isAuthenticating, pin, showPinFallback, unlockWithPin]);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {
        if (stepUpRequest) {
          cancelStepUp();
        }
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <View
            style={{
              flex: 1,
              paddingHorizontal: 24,
              paddingVertical: 28,
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                borderRadius: 28,
                padding: 24,
                backgroundColor: colors.backgroundSecondary,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primaryBackground,
                  marginBottom: 18,
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} />
              </View>

            <Text
              style={{
                color: colors.text,
                fontSize: 28,
                lineHeight: 34,
                fontWeight: '700',
                marginBottom: 10,
              }}
            >
              {copy.title}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 15,
                lineHeight: 24,
                marginBottom: 24,
              }}
            >
              {copy.subtitle}
            </Text>

            {showPinFallback ? (
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: '600',
                    marginBottom: 14,
                  }}
                >
                  Enter your 6-digit PIN
                </Text>
                <PinCodeInput
                  value={pin}
                  onChangeText={setPin}
                  autoFocus
                  disabled={isAuthenticating || remainingLockoutMs > 0}
                />
              </View>
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 18,
                  marginBottom: 20,
                }}
              >
                {isAuthenticating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name={biometricStatus.primaryLabel === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                    size={42}
                    color={colors.primary}
                  />
                )}
              </View>
            )}

            {remainingLockoutMs > 0 ? (
              <Text
                style={{
                  color: colors.warning,
                  fontSize: 13,
                  lineHeight: 20,
                  marginBottom: 16,
                }}
              >
                Too many incorrect PIN attempts. Try again in {Math.ceil(remainingLockoutMs / 1000)} seconds.
              </Text>
            ) : null}

            {errorMessage ? (
              <Text
                style={{
                  color: colors.error,
                  fontSize: 13,
                  lineHeight: 20,
                  marginBottom: 16,
                }}
              >
                {errorMessage}
              </Text>
            ) : null}

            <View style={{ gap: 12 }}>
              {canUseBiometrics ? (
                <Button
                  title={
                    showPinFallback
                      ? `Try ${biometricStatus.primaryLabel} again`
                      : `Use ${biometricStatus.primaryLabel}`
                  }
                  variant={showPinFallback ? 'outline' : 'primary'}
                  onPress={() => {
                    setShowPinFallback(false);
                    triggerBiometric();
                  }}
                  disabled={isAuthenticating || remainingLockoutMs > 0}
                />
              ) : null}

              {!showPinFallback ? (
                <Button
                  title="Use PIN instead"
                  variant="secondary"
                  onPress={() => setShowPinFallback(true)}
                  disabled={isAuthenticating || remainingLockoutMs > 0}
                />
              ) : null}

              {stepUpRequest ? (
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={cancelStepUp}
                  disabled={isAuthenticating}
                />
              ) : null}
            </View>

              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 12,
                  lineHeight: 18,
                  marginTop: 18,
                  textAlign: 'center',
                }}
              >
                This protection is saved only on this device.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
