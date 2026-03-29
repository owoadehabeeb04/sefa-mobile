import { create } from 'zustand';

import {
  authenticateWithBiometrics,
  createPinHash,
  DEFAULT_APP_SECURITY_SETTINGS,
  EMPTY_BIOMETRIC_STATUS,
  getBiometricStatus,
  getStoredSecuritySettings,
  MAX_PIN_ATTEMPTS,
  PIN_LOCKOUT_MS,
  RECENT_VERIFICATION_WINDOW_MS,
  saveSecuritySettings,
  verifyPinHash,
} from '@/features/security/appLock.service';
import type {
  AppLockState,
  AppSecuritySettings,
  SensitiveAction,
  UnlockReason,
} from '@/features/security/appLock.types';

interface StepUpRequest {
  action: SensitiveAction;
  resolve: (allowed: boolean) => void;
}

interface AppLockStore extends AppLockState {
  stepUpRequest: StepUpRequest | null;
  initialize: () => Promise<void>;
  refreshBiometricStatus: () => Promise<void>;
  markSetupPromptCompleted: () => Promise<void>;
  configureAppLock: (input: { pin: string; biometricEnabled: boolean }) => Promise<void>;
  disableAppLock: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  changePin: (pin: string) => Promise<void>;
  noteBackgrounded: () => void;
  maybeLockOnForeground: (isAuthenticated: boolean) => void;
  maybeLockOnLaunch: (input: {
    didRestoreSession: boolean;
    isAuthenticated: boolean;
    isProtectedRoute: boolean;
  }) => void;
  lock: (reason: UnlockReason) => void;
  unlockWithBiometrics: () => Promise<{ success: boolean; message?: string }>;
  unlockWithPin: (
    pin: string
  ) => Promise<{ success: boolean; message?: string; remainingAttempts?: number; retryAfterMs?: number }>;
  requestSensitiveAction: (action: SensitiveAction) => Promise<boolean>;
  cancelStepUp: () => void;
  clearSessionState: () => void;
}

const initialState: AppLockState = {
  settings: DEFAULT_APP_SECURITY_SETTINGS,
  biometricStatus: EMPTY_BIOMETRIC_STATUS,
  isInitialized: false,
  isLocked: false,
  lockReason: null,
  failedPinAttempts: 0,
  lockedUntil: null,
  lastBackgroundedAt: null,
  lastUnlockAt: null,
  lastSensitiveVerificationAt: null,
  launchLockHandled: false,
};

const getMostRecentVerification = (state: Pick<AppLockState, 'lastUnlockAt' | 'lastSensitiveVerificationAt'>) =>
  Math.max(state.lastUnlockAt || 0, state.lastSensitiveVerificationAt || 0);

const resolveSuccess = (set: (partial: Partial<AppLockStore>) => void, get: () => AppLockStore) => {
  const now = Date.now();
  const currentRequest = get().stepUpRequest;

  currentRequest?.resolve(true);

  set({
    isLocked: false,
    lockReason: null,
    failedPinAttempts: 0,
    lockedUntil: null,
    lastUnlockAt: now,
    lastSensitiveVerificationAt: currentRequest ? now : get().lastSensitiveVerificationAt,
    stepUpRequest: null,
  });
};

export const useAppLockStore = create<AppLockStore>((set, get) => ({
  ...initialState,
  stepUpRequest: null,

  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    const [settings, biometricStatus] = await Promise.all([
      getStoredSecuritySettings(),
      getBiometricStatus(),
    ]);

    set({
      settings: {
        ...settings,
        biometricEnabled: settings.biometricEnabled && biometricStatus.available,
      },
      biometricStatus,
      isInitialized: true,
    });
  },

  refreshBiometricStatus: async () => {
    const biometricStatus = await getBiometricStatus();
    const currentSettings = get().settings;
    const nextSettings: AppSecuritySettings = {
      ...currentSettings,
      biometricEnabled: currentSettings.biometricEnabled && biometricStatus.available,
    };

    if (JSON.stringify(nextSettings) !== JSON.stringify(currentSettings)) {
      await saveSecuritySettings(nextSettings);
    }

    set({
      biometricStatus,
      settings: nextSettings,
    });
  },

  markSetupPromptCompleted: async () => {
    const current = get().settings;
    const nextSettings = {
      ...current,
      setupPromptCompleted: true,
    };

    await saveSecuritySettings(nextSettings);
    set({ settings: nextSettings });
  },

  configureAppLock: async ({ pin, biometricEnabled }) => {
    const { biometricStatus, settings } = get();
    const { hash, salt } = await createPinHash(pin);
    const nextSettings: AppSecuritySettings = {
      ...settings,
      lockEnabled: true,
      biometricEnabled: biometricEnabled && biometricStatus.available,
      pinEnabled: true,
      pinHash: hash,
      pinSalt: salt,
      autoLockTimeoutMs: settings.autoLockTimeoutMs || DEFAULT_APP_SECURITY_SETTINGS.autoLockTimeoutMs,
      setupPromptCompleted: true,
    };

    await saveSecuritySettings(nextSettings);

    set({
      settings: nextSettings,
      isLocked: false,
      lockReason: null,
      failedPinAttempts: 0,
      lockedUntil: null,
      lastUnlockAt: Date.now(),
      lastSensitiveVerificationAt: Date.now(),
      stepUpRequest: null,
    });
  },

  disableAppLock: async () => {
    const currentSettings = get().settings;
    const stepUpRequest = get().stepUpRequest;
    const nextSettings: AppSecuritySettings = {
      ...DEFAULT_APP_SECURITY_SETTINGS,
      autoLockTimeoutMs: currentSettings.autoLockTimeoutMs,
      setupPromptCompleted: true,
    };

    await saveSecuritySettings(nextSettings);
    stepUpRequest?.resolve(false);

    set({
      settings: nextSettings,
      isLocked: false,
      lockReason: null,
      failedPinAttempts: 0,
      lockedUntil: null,
      lastUnlockAt: null,
      lastSensitiveVerificationAt: null,
      stepUpRequest: null,
    });
  },

  setBiometricEnabled: async (enabled) => {
    const current = get().settings;
    const canEnable = enabled && get().biometricStatus.available;
    const nextSettings = {
      ...current,
      biometricEnabled: canEnable,
    };

    await saveSecuritySettings(nextSettings);
    set({ settings: nextSettings });
  },

  changePin: async (pin) => {
    const { hash, salt } = await createPinHash(pin);
    const current = get().settings;
    const nextSettings = {
      ...current,
      pinEnabled: true,
      pinHash: hash,
      pinSalt: salt,
      setupPromptCompleted: true,
    };

    await saveSecuritySettings(nextSettings);
    set({
      settings: nextSettings,
      failedPinAttempts: 0,
      lockedUntil: null,
      lastSensitiveVerificationAt: Date.now(),
    });
  },

  noteBackgrounded: () => {
    if (!get().settings.lockEnabled) {
      return;
    }

    set({ lastBackgroundedAt: Date.now() });
  },

  maybeLockOnForeground: (isAuthenticated) => {
    const state = get();

    if (!isAuthenticated || !state.settings.lockEnabled || !state.lastBackgroundedAt) {
      return;
    }

    const elapsed = Date.now() - state.lastBackgroundedAt;

    set({ lastBackgroundedAt: null });

    if (elapsed >= state.settings.autoLockTimeoutMs) {
      set({
        isLocked: true,
        lockReason: 'app_resume',
      });
    }
  },

  maybeLockOnLaunch: ({ didRestoreSession, isAuthenticated, isProtectedRoute }) => {
    const state = get();

    if (!state.isInitialized || state.launchLockHandled) {
      return;
    }

    if (!didRestoreSession || !isAuthenticated) {
      set({ launchLockHandled: true });
      return;
    }

    if (!isProtectedRoute) {
      return;
    }

    if (!state.settings.lockEnabled) {
      set({ launchLockHandled: true });
      return;
    }

    set({
      launchLockHandled: true,
      isLocked: true,
      lockReason: 'app_launch',
    });
  },

  lock: (reason) => {
    if (!get().settings.lockEnabled) {
      return;
    }

    set({
      isLocked: true,
      lockReason: reason,
    });
  },

  unlockWithBiometrics: async () => {
    const state = get();

    if (state.lockedUntil && state.lockedUntil > Date.now()) {
      return {
        success: false,
        message: 'Too many failed PIN attempts. Use your PIN again shortly.',
      };
    }

    const result = await authenticateWithBiometrics(
      state.stepUpRequest ? 'sensitive_action' : (state.lockReason || 'app_launch'),
      state.stepUpRequest?.action,
      state.biometricStatus.primaryLabel
    );

    if (!result.success) {
      return {
        success: false,
        message:
          result.error === 'user_cancel'
            ? 'Biometric check was cancelled. Use your PIN to continue.'
            : 'Biometric unlock is unavailable right now. Use your PIN to continue.',
      };
    }

    resolveSuccess(set, get);
    return { success: true };
  },

  unlockWithPin: async (pin) => {
    const state = get();

    if (state.lockedUntil && state.lockedUntil > Date.now()) {
      return {
        success: false,
        message: 'Too many incorrect PIN attempts. Try again shortly.',
        retryAfterMs: state.lockedUntil - Date.now(),
      };
    }

    if (!state.settings.pinHash || !state.settings.pinSalt) {
      return {
        success: false,
        message: 'PIN unlock is not configured yet.',
      };
    }

    const matches = await verifyPinHash(pin, state.settings.pinHash, state.settings.pinSalt);

    if (matches) {
      resolveSuccess(set, get);
      return { success: true };
    }

    const nextFailedAttempts = state.failedPinAttempts + 1;

    if (nextFailedAttempts >= MAX_PIN_ATTEMPTS) {
      const lockedUntil = Date.now() + PIN_LOCKOUT_MS;
      set({
        failedPinAttempts: 0,
        lockedUntil,
      });

      return {
        success: false,
        message: 'Too many incorrect PIN attempts. Try again in 30 seconds.',
        retryAfterMs: PIN_LOCKOUT_MS,
        remainingAttempts: 0,
      };
    }

    set({
      failedPinAttempts: nextFailedAttempts,
      lockedUntil: null,
    });

    return {
      success: false,
      message: 'Incorrect PIN. Try again.',
      remainingAttempts: MAX_PIN_ATTEMPTS - nextFailedAttempts,
    };
  },

  requestSensitiveAction: async (action) => {
    const state = get();

    if (!state.settings.lockEnabled) {
      return true;
    }

    const recentVerificationAt = getMostRecentVerification(state);
    if (recentVerificationAt && Date.now() - recentVerificationAt <= RECENT_VERIFICATION_WINDOW_MS) {
      return true;
    }

    if (state.stepUpRequest) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      set({
        stepUpRequest: {
          action,
          resolve,
        },
      });
    });
  },

  cancelStepUp: () => {
    const currentRequest = get().stepUpRequest;
    currentRequest?.resolve(false);
    set({ stepUpRequest: null });
  },

  clearSessionState: () => {
    const currentRequest = get().stepUpRequest;
    currentRequest?.resolve(false);

    set({
      isLocked: false,
      lockReason: null,
      failedPinAttempts: 0,
      lockedUntil: null,
      lastBackgroundedAt: null,
      lastUnlockAt: null,
      lastSensitiveVerificationAt: null,
      launchLockHandled: false,
      stepUpRequest: null,
    });
  },
}));
