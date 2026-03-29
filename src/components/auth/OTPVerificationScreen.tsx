/**
 * OTP Verification Screen - Reusable component
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { OTPInput } from '@/src/components/common/OTPInput';
import { Button } from '@/src/components/common/Button';
import { Loading } from '@/src/components/common/Loading';
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';
import { maskEmail } from '@/src/utils/formatters';

interface OTPErrorDetails {
  code?: string;
  retryAfterSeconds?: number;
}

interface OTPVerificationScreenProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  purpose?: 'signup' | 'forgot-password' | 'login';
  isLoading?: boolean;
  error?: string;
  errorDetails?: OTPErrorDetails;
}

const INITIAL_RESEND_SECONDS = 60;

const getPurposeCopy = (purpose: OTPVerificationScreenProps['purpose']) => {
  switch (purpose) {
    case 'forgot-password':
      return {
        title: 'Check your email',
        subtitle: 'Enter the 6-digit reset code we sent to',
        loadingMessage: 'Verifying reset code...',
        buttonLabel: 'Verify code',
      };
    case 'login':
      return {
        title: 'Verify your account',
        subtitle: 'Enter the 6-digit code we sent to',
        loadingMessage: 'Verifying your account...',
        buttonLabel: 'Verify code',
      };
    case 'signup':
    default:
      return {
        title: 'Confirm your email',
        subtitle: 'Enter the 6-digit code we sent to',
        loadingMessage: 'Verifying your email...',
        buttonLabel: 'Verify code',
      };
  }
};

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  email,
  onVerify,
  onResend,
  purpose = 'signup',
  isLoading = false,
  error,
  errorDetails,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const copy = useMemo(() => getPurposeCopy(purpose), [purpose]);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(INITIAL_RESEND_SECONDS);
  const [clearSignal, setClearSignal] = useState(0);
  const [submitError, setSubmitError] = useState<string | undefined>(error);
  const lastSubmittedOtpRef = useRef<string | null>(null);
  const hasCompleteOtp = otp.length === 6;
  const isTemporarilyLocked = Boolean(
    errorDetails?.code && ['OTP_LOCKED', 'OTP_RESEND_TOO_SOON'].includes(errorDetails.code)
  );

  useEffect(() => {
    setSubmitError(error);
  }, [error]);

  useEffect(() => {
    if (errorDetails?.retryAfterSeconds && errorDetails.retryAfterSeconds > 0) {
      setTimer(errorDetails.retryAfterSeconds);
    }

    if (errorDetails?.code === 'OTP_EXPIRED') {
      setOtp('');
      setClearSignal((value) => value + 1);
    }
  }, [errorDetails]);

  useEffect(() => {
    if (!submitError) {
      return;
    }

    AccessibilityInfo.announceForAccessibility(submitError);
  }, [submitError]);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const submitOtp = useCallback(async (otpCode: string) => {
    if (isLoading || otpCode.length < 6 || isTemporarilyLocked) {
      return;
    }

    lastSubmittedOtpRef.current = otpCode;
    setSubmitError(undefined);
    await onVerify(otpCode);
  }, [isLoading, isTemporarilyLocked, onVerify]);

  useEffect(() => {
    if (!hasCompleteOtp || isLoading || isTemporarilyLocked) {
      return;
    }

    if (lastSubmittedOtpRef.current === otp) {
      return;
    }

    submitOtp(otp).catch(() => undefined);
  }, [hasCompleteOtp, isLoading, isTemporarilyLocked, otp, submitOtp]);

  const handleResend = async () => {
    if (timer > 0 || isLoading) {
      return;
    }

    try {
      await onResend();
      setSubmitError(undefined);
      setOtp('');
      setClearSignal((value) => value + 1);
      setTimer(INITIAL_RESEND_SECONDS);
      lastSubmittedOtpRef.current = null;
      AccessibilityInfo.announceForAccessibility('A new one-time password has been sent.');
    } catch {
      // Parent handles the visible error state.
    }
  };

  const maskedEmail = maskEmail(email);

  return (
    <View
      className="flex-1 px-6 pt-8"
      style={{ backgroundColor: colors.background }}
    >
      <FadeUp style={{ marginBottom: 32 }}>
        <Text
          className="text-3xl font-bold mb-2"
          style={{ color: colors.text }}
        >
          {copy.title}
        </Text>
        <Text
          className="text-base leading-6"
          style={{ color: colors.textSecondary }}
        >
          {copy.subtitle} <Text style={{ color: colors.text, fontWeight: '600' }}>{maskedEmail}</Text>
        </Text>
      </FadeUp>

      <AnimatedScreenSection index={0}>
        <OTPInput
          length={6}
          value={otp}
          onChangeOTP={setOtp}
          error={submitError}
          disabled={isLoading || isTemporarilyLocked}
          clearSignal={clearSignal}
        />
      </AnimatedScreenSection>

      <AnimatedScreenSection index={1} style={{ marginTop: 32 }}>
        <Button
          title={copy.buttonLabel}
          onPress={() => submitOtp(otp)}
          fullWidth
          size="large"
          disabled={!hasCompleteOtp || isLoading || isTemporarilyLocked}
          loading={isLoading}
        />
      </AnimatedScreenSection>

      <AnimatedScreenSection index={2} variant="slide" style={{ marginTop: 24, alignItems: 'center' }}>
        {timer > 0 ? (
          <Text
            className="text-sm text-center"
            style={{ color: colors.textTertiary }}
          >
            Resend code in {timer}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={isLoading}>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.primary }}
            >
              Resend code
            </Text>
          </TouchableOpacity>
        )}
      </AnimatedScreenSection>

      {isTemporarilyLocked && timer > 0 && (
        <AnimatedScreenSection index={3} style={{ marginTop: 12 }}>
          <Text
            className="text-sm text-center"
            style={{ color: colors.textSecondary }}
          >
            Verification is temporarily paused. Request a new code when the timer ends.
          </Text>
        </AnimatedScreenSection>
      )}

      {isLoading && (
        <AnimatedScreenSection index={4} style={{ marginTop: 24 }}>
          <Loading message={copy.loadingMessage} />
        </AnimatedScreenSection>
      )}
    </View>
  );
};
