import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/common/Button';
import { Toast, useToast } from '@/src/components/common/Toast';
import { PinCodeInput } from '@/src/components/security/PinCodeInput';
import { AnimatedScreenSection, FadeUp, ScaleIn } from '@/src/components/motion';
import { getBiometricAvailabilityCopy } from '@/features/security/appLock.service';
import { useAppLockStore } from '@/store/appLock.store';
import { sefaLogoSvg } from '@/assets/illustrations';

const isValidPin = (value: string) => /^\d{6}$/.test(value);

export default function SecuritySetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { toastConfig, showToast, hideToast } = useToast();
  const {
    settings,
    biometricStatus,
    configureAppLock,
    markSetupPromptCompleted,
    refreshBiometricStatus,
  } = useAppLockStore();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [useBiometric, setUseBiometric] = useState(biometricStatus.available);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    refreshBiometricStatus();
  }, [refreshBiometricStatus]);

  useEffect(() => {
    setUseBiometric(biometricStatus.available);
  }, [biometricStatus.available]);

  const biometricCopy = useMemo(
    () => getBiometricAvailabilityCopy(biometricStatus),
    [biometricStatus]
  );
  const introText = useMemo(() => {
    if (biometricStatus.available) {
      return `Add ${biometricStatus.primaryLabel} and a backup PIN so only you can reopen SEFA on this device.`;
    }

    if (biometricStatus.hasHardware) {
      return `Create a backup PIN now. You can turn on ${biometricStatus.primaryLabel} later after setting it up in your phone settings.`;
    }

    return 'Create a backup PIN so only you can reopen SEFA on this device.';
  }, [biometricStatus]);

  const getLogoSvg = (color: string) => {
    return sefaLogoSvg.replace('stroke="white"', `stroke="${color}"`);
  };

  const handleEnable = async () => {
    if (!isValidPin(pin)) {
      showToast('Enter a valid 6-digit PIN', 'error');
      return;
    }

    if (pin !== confirmPin) {
      showToast('PIN entries do not match', 'error');
      return;
    }

    setIsSaving(true);

    try {
      await configureAppLock({
        pin,
        biometricEnabled: useBiometric,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      showToast(error?.message || 'Failed to enable app lock', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    setIsSaving(true);

    try {
      if (!settings.setupPromptCompleted) {
        await markSetupPromptCompleted();
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      showToast(error?.message || 'Failed to continue', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={hideToast}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, flexGrow: 1 }}
      >
        <ScaleIn style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
          <SvgXml xml={getLogoSvg(colors.primary)} width={40} height={42} />
          <Text
            style={{
              color: colors.primary,
              fontSize: 28,
              fontWeight: '700',
              marginLeft: 12,
              marginTop: 2,
            }}
          >
            SEFA
          </Text>
        </ScaleIn>

        <AnimatedScreenSection index={0} variant="scale"
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primaryBackground,
            marginBottom: 18,
          }}
        >
          <Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} />
        </AnimatedScreenSection>

        <FadeUp>
          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              lineHeight: 38,
              fontWeight: '700',
              marginBottom: 10,
            }}
          >
            Protect this app
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 15,
              lineHeight: 24,
              marginBottom: 26,
            }}
          >
            {introText}
          </Text>
        </FadeUp>

        <AnimatedScreenSection
          index={1}
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 24,
            padding: 20,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Use {biometricStatus.primaryLabel}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {biometricCopy.detail}
              </Text>
            </View>
            <Switch
              value={useBiometric && biometricStatus.available}
              onValueChange={setUseBiometric}
              disabled={!biometricStatus.available || isSaving}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
            Create a 6-digit PIN
          </Text>
          <PinCodeInput value={pin} onChangeText={setPin} autoFocus />

          <Text className="text-xs mt-4 mb-3" style={{ color: colors.textSecondary }}>
            Confirm PIN
          </Text>
          <PinCodeInput value={confirmPin} onChangeText={setConfirmPin} />
        </AnimatedScreenSection>

        <AnimatedScreenSection index={2}>
          <Button
            title="Enable Protection"
            onPress={handleEnable}
            loading={isSaving}
            fullWidth
          />
        </AnimatedScreenSection>

        <AnimatedScreenSection index={3} variant="slide">
          <TouchableOpacity
            onPress={handleSkip}
            disabled={isSaving}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        </AnimatedScreenSection>

        <AnimatedScreenSection index={4}>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: 12,
              lineHeight: 18,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            This security is saved only on this phone and can be changed later in Settings.
          </Text>
        </AnimatedScreenSection>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
