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
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { Button } from '@/src/components/common/Button';
import { Toast, useToast } from '@/src/components/common/Toast';
import { PinCodeInput } from '@/src/components/security/PinCodeInput';
import { AnimatedScreenSection } from '@/src/components/motion';
import {
  describeAppLockMethod,
  formatAutoLockTimeout,
  getBiometricAvailabilityCopy,
} from '@/features/security/appLock.service';
import { useAppLockStore } from '@/store/appLock.store';

type Mode = 'idle' | 'setup' | 'change_pin';

const isValidPin = (value: string) => /^\d{6}$/.test(value);

export default function AppLockSettingsScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const { toastConfig, showToast, hideToast } = useToast();
  const {
    settings,
    biometricStatus,
    configureAppLock,
    disableAppLock,
    refreshBiometricStatus,
    setBiometricEnabled,
    changePin,
  } = useAppLockStore();

  const [mode, setMode] = useState<Mode>(settings.lockEnabled ? 'idle' : 'setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [useBiometric, setUseBiometric] = useState(
    settings.biometricEnabled || biometricStatus.available
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    refreshBiometricStatus();
  }, [refreshBiometricStatus]);

  useEffect(() => {
    setUseBiometric(settings.biometricEnabled && biometricStatus.available);
  }, [biometricStatus.available, settings.biometricEnabled]);

  const methodLabel = useMemo(
    () => describeAppLockMethod(settings, biometricStatus),
    [biometricStatus, settings]
  );
  const biometricCopy = useMemo(
    () => getBiometricAvailabilityCopy(biometricStatus),
    [biometricStatus]
  );
  const canEnableBiometric = biometricStatus.available;

  const resetForm = () => {
    setPin('');
    setConfirmPin('');
    setUseBiometric(settings.biometricEnabled && biometricStatus.available);
  };

  const validatePins = (): boolean => {
    if (!isValidPin(pin)) {
      showToast('Enter a valid 6-digit PIN', 'error');
      return false;
    }

    if (pin !== confirmPin) {
      showToast('PIN entries do not match', 'error');
      return false;
    }

    return true;
  };

  const handleEnable = async () => {
    if (!validatePins()) {
      return;
    }

    setIsSaving(true);

    try {
      await configureAppLock({
        pin,
        biometricEnabled: useBiometric,
      });
      resetForm();
      setMode('idle');
      showToast('App lock enabled successfully', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to enable app lock', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePin = async () => {
    if (!validatePins()) {
      return;
    }

    setIsSaving(true);

    try {
      await changePin(pin);
      resetForm();
      setMode('idle');
      showToast('PIN updated successfully', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to update PIN', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisable = async () => {
    setIsSaving(true);

    try {
      await disableAppLock();
      resetForm();
      setMode('setup');
      showToast('App lock turned off on this device', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Failed to disable app lock', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    setUseBiometric(value);

    if (!settings.lockEnabled) {
      return;
    }

    try {
      await setBiometricEnabled(value);
      showToast(
        value
          ? `${biometricStatus.primaryLabel} unlock is now on`
          : 'Biometric unlock is now off',
        'success'
      );
    } catch (error: any) {
      showToast(error?.message || 'Failed to update biometric setting', 'error');
      setUseBiometric(settings.biometricEnabled);
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

      <View
        className="flex-row items-center px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>
          App Lock & PIN
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={{ padding: 20, paddingBottom: 48, flexGrow: 1 }}
      >
        <AnimatedScreenSection
          index={0}
          className="rounded-2xl p-5 mb-5"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
            Protect SEFA on this device
          </Text>
          <Text className="text-sm leading-6" style={{ color: colors.textSecondary }}>
            App lock is local to this phone. It adds biometric unlock with a 6-digit backup PIN.
          </Text>
        </AnimatedScreenSection>

        <AnimatedScreenSection
          index={1}
          className="rounded-2xl p-5 mb-5"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Current status
          </Text>
          <Text className="text-base font-semibold mb-1" style={{ color: colors.primary }}>
            {methodLabel}
          </Text>
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            Auto-lock timeout: {formatAutoLockTimeout(settings.autoLockTimeoutMs)}
          </Text>
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            {biometricCopy.summary}
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {biometricCopy.detail}
          </Text>
        </AnimatedScreenSection>

        <AnimatedScreenSection
          index={2}
          className="rounded-2xl p-5 mb-5"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Use {biometricStatus.primaryLabel}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {biometricCopy.detail}
              </Text>
            </View>
            <Switch
              value={useBiometric && canEnableBiometric}
              onValueChange={handleBiometricToggle}
              disabled={!canEnableBiometric || isSaving}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>
        </AnimatedScreenSection>

        {(mode === 'setup' || mode === 'change_pin') && (
          <AnimatedScreenSection
            index={3}
            className="rounded-2xl p-5 mb-5"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
              {mode === 'setup' ? 'Create a 6-digit PIN' : 'Change your 6-digit PIN'}
            </Text>
            <PinCodeInput value={pin} onChangeText={setPin} />
            <View style={{ height: 14 }} />
            <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
              Confirm PIN
            </Text>
            <PinCodeInput value={confirmPin} onChangeText={setConfirmPin} />
          </AnimatedScreenSection>
        )}

        <AnimatedScreenSection index={4}>
        <View style={{ gap: 12 }}>
          {!settings.lockEnabled ? (
            <Button
              title="Enable App Lock"
              onPress={handleEnable}
              loading={isSaving}
            />
          ) : mode === 'change_pin' ? (
            <>
              <Button
                title="Save New PIN"
                onPress={handleChangePin}
                loading={isSaving}
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  resetForm();
                  setMode('idle');
                }}
                disabled={isSaving}
              />
            </>
          ) : (
            <>
              <Button
                title="Change PIN"
                variant="outline"
                onPress={() => {
                  resetForm();
                  setMode('change_pin');
                }}
                disabled={isSaving}
              />
              <Button
                title="Turn Off App Lock"
                variant="secondary"
                onPress={handleDisable}
                loading={isSaving}
              />
            </>
          )}
        </View>
        </AnimatedScreenSection>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
