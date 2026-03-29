export type UnlockReason = 'app_launch' | 'app_resume' | 'sensitive_action';

export type SensitiveAction =
  | 'connect_bank'
  | 'disconnect_bank'
  | 'change_password';

export interface AppSecuritySettings {
  lockEnabled: boolean;
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  autoLockTimeoutMs: number;
  setupPromptCompleted: boolean;
}

export type BiometricAvailabilityReason =
  | 'ready'
  | 'supported_not_enrolled'
  | 'unsupported'
  | 'expo_go_limited';

export interface BiometricStatus {
  available: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
  primaryLabel: string;
  availabilityReason: BiometricAvailabilityReason;
}

export interface AppLockState {
  settings: AppSecuritySettings;
  biometricStatus: BiometricStatus;
  isInitialized: boolean;
  isLocked: boolean;
  lockReason: UnlockReason | null;
  failedPinAttempts: number;
  lockedUntil: number | null;
  lastBackgroundedAt: number | null;
  lastUnlockAt: number | null;
  lastSensitiveVerificationAt: number | null;
  launchLockHandled: boolean;
}
