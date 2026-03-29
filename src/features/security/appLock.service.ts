import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  AppSecuritySettings,
  BiometricStatus,
  SensitiveAction,
  UnlockReason,
} from './appLock.types';

const APP_SECURITY_SETTINGS_KEY = 'app_security_settings_v1';
export const DEFAULT_AUTO_LOCK_TIMEOUT_MS = 30_000;
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 30_000;
export const RECENT_VERIFICATION_WINDOW_MS = 2 * 60 * 1000;

export const DEFAULT_APP_SECURITY_SETTINGS: AppSecuritySettings = {
  lockEnabled: false,
  biometricEnabled: false,
  pinEnabled: false,
  pinHash: null,
  pinSalt: null,
  autoLockTimeoutMs: DEFAULT_AUTO_LOCK_TIMEOUT_MS,
  setupPromptCompleted: false,
};

export const EMPTY_BIOMETRIC_STATUS: BiometricStatus = {
  available: false,
  hasHardware: false,
  isEnrolled: false,
  supportedTypes: [],
  primaryLabel: 'Biometrics',
  availabilityReason: 'unsupported',
};

const toHex = (words: number[]): string =>
  words
    .map((value) => value.toString(16).padStart(8, '0'))
    .join('');

const utf8ToBytes = (value: string): number[] => {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    let codePoint = value.charCodeAt(index);

    if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoint = ((codePoint - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        index += 1;
      }
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6));
      bytes.push(0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(0xe0 | (codePoint >> 12));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }

  return bytes;
};

const rightRotate = (value: number, amount: number) =>
  (value >>> amount) | (value << (32 - amount));

const SHA256_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const sha256Hex = (value: string): string => {
  const bytes = utf8ToBytes(value);
  const bitLength = bytes.length * 8;
  bytes.push(0x80);

  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;

  bytes.push((highBits >>> 24) & 0xff);
  bytes.push((highBits >>> 16) & 0xff);
  bytes.push((highBits >>> 8) & 0xff);
  bytes.push(highBits & 0xff);
  bytes.push((lowBits >>> 24) & 0xff);
  bytes.push((lowBits >>> 16) & 0xff);
  bytes.push((lowBits >>> 8) & 0xff);
  bytes.push(lowBits & 0xff);

  const hash = [
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ];

  const words = new Array<number>(64).fill(0);

  for (let chunkOffset = 0; chunkOffset < bytes.length; chunkOffset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const offset = chunkOffset + index * 4;
      words[index] =
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];
    }

    for (let index = 16; index < 64; index += 1) {
      const s0 =
        rightRotate(words[index - 15], 7) ^
        rightRotate(words[index - 15], 18) ^
        (words[index - 15] >>> 3);
      const s1 =
        rightRotate(words[index - 2], 17) ^
        rightRotate(words[index - 2], 19) ^
        (words[index - 2] >>> 10);

      words[index] = (((words[index - 16] + s0) | 0) + ((words[index - 7] + s1) | 0)) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (let index = 0; index < 64; index += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((((h + s1) | 0) + ch) | 0) + ((SHA256_CONSTANTS[index] + words[index]) | 0)) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  return toHex(hash.map((value) => value >>> 0));
};

const generateSalt = (length = 32): string => {
  const alphabet = 'abcdef0123456789';
  let salt = '';

  for (let index = 0; index < length; index += 1) {
    salt += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return salt;
};

const getBiometricLabel = (type: LocalAuthentication.AuthenticationType): string => {
  switch (type) {
    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
      return 'Face ID';
    case LocalAuthentication.AuthenticationType.FINGERPRINT:
      return 'Fingerprint';
    case LocalAuthentication.AuthenticationType.IRIS:
      return 'Iris';
    default:
      return 'Biometrics';
  }
};

export const getStoredSecuritySettings = async (): Promise<AppSecuritySettings> => {
  try {
    const raw = await SecureStore.getItemAsync(APP_SECURITY_SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_APP_SECURITY_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AppSecuritySettings>;

    return {
      ...DEFAULT_APP_SECURITY_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load app security settings:', error);
    return DEFAULT_APP_SECURITY_SETTINGS;
  }
};

export const saveSecuritySettings = async (settings: AppSecuritySettings): Promise<void> => {
  await SecureStore.setItemAsync(APP_SECURITY_SETTINGS_KEY, JSON.stringify(settings));
};

export const getBiometricStatus = async (): Promise<BiometricStatus> => {
  try {
    const [hasHardware, isEnrolled, supported] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const supportedTypes = Array.from(new Set(supported.map(getBiometricLabel)));
    const primaryLabel = supportedTypes[0] || 'Biometrics';
    const supportsBiometrics = hasHardware && supportedTypes.length > 0;
    const isExpoGoFaceIdRuntime =
      Platform.OS === 'ios'
      && Constants.appOwnership === 'expo'
      && supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

    let availabilityReason: BiometricStatus['availabilityReason'] = 'unsupported';

    if (supportsBiometrics) {
      if (!isEnrolled) {
        availabilityReason = 'supported_not_enrolled';
      } else if (isExpoGoFaceIdRuntime) {
        availabilityReason = 'expo_go_limited';
      } else {
        availabilityReason = 'ready';
      }
    }

    return {
      available: availabilityReason === 'ready',
      hasHardware,
      isEnrolled,
      supportedTypes,
      primaryLabel,
      availabilityReason,
    };
  } catch (error) {
    console.error('Failed to check biometric availability:', error);
    return EMPTY_BIOMETRIC_STATUS;
  }
};

export const createPinHash = async (pin: string): Promise<{ hash: string; salt: string }> => {
  const salt = generateSalt();
  const hash = sha256Hex(`${salt}:${pin}`);

  return { hash, salt };
};

export const verifyPinHash = async (pin: string, hash: string, salt: string): Promise<boolean> => {
  const nextHash = sha256Hex(`${salt}:${pin}`);

  return nextHash === hash;
};

const getBiometricPromptMessage = (
  reason: UnlockReason,
  action?: SensitiveAction,
  label?: string
): string => {
  if (reason === 'sensitive_action') {
    switch (action) {
      case 'connect_bank':
        return `Use ${label || 'biometrics'} to connect a bank account`;
      case 'disconnect_bank':
        return `Use ${label || 'biometrics'} to disconnect a bank account`;
      case 'change_password':
        return `Use ${label || 'biometrics'} to change your password`;
      default:
        return `Use ${label || 'biometrics'} to continue`;
    }
  }

  if (reason === 'app_resume') {
    return `Use ${label || 'biometrics'} to unlock SEFA`;
  }

  return `Use ${label || 'biometrics'} to open SEFA`;
};

export const authenticateWithBiometrics = async (
  reason: UnlockReason,
  action?: SensitiveAction,
  label?: string
) => {
  return LocalAuthentication.authenticateAsync({
    promptMessage: getBiometricPromptMessage(reason, action, label),
    cancelLabel: 'Use PIN',
    fallbackLabel: '',
    disableDeviceFallback: true,
  });
};

export const describeAppLockMethod = (
  settings: AppSecuritySettings,
  biometricStatus: BiometricStatus
): string => {
  if (!settings.lockEnabled) {
    return 'Off';
  }

  if (settings.biometricEnabled && biometricStatus.available) {
    return `${biometricStatus.primaryLabel} + PIN`;
  }

  return 'PIN only';
};

const getDeviceSettingsHint = (status: BiometricStatus): string => {
  if (Platform.OS === 'ios' && status.primaryLabel === 'Face ID') {
    return 'Set it up in Settings > Face ID & Passcode.';
  }

  if (Platform.OS === 'ios') {
    return 'Set it up in iPhone Settings.';
  }

  return 'Set it up in your device security settings.';
};

export const getBiometricAvailabilityCopy = (
  status: BiometricStatus
): { summary: string; detail: string } => {
  switch (status.availabilityReason) {
    case 'ready':
      return {
        summary: `${status.primaryLabel} is ready on this device`,
        detail: 'Unlock with biometrics first and fall back to your PIN.',
      };
    case 'supported_not_enrolled':
      return {
        summary: `${status.primaryLabel} is supported, but not set up yet`,
        detail: getDeviceSettingsHint(status),
      };
    case 'expo_go_limited':
      return {
        summary: `${status.primaryLabel} is set up on this device`,
        detail: 'Expo Go on iPhone cannot test it reliably. Use a development or production build to verify it.',
      };
    case 'unsupported':
    default:
      return {
        summary: 'Biometric unlock is not available on this device',
        detail: 'You can still protect SEFA with your 6-digit PIN.',
      };
  }
};

export const formatAutoLockTimeout = (timeoutMs: number): string => {
  if (timeoutMs < 60_000) {
    return `${Math.round(timeoutMs / 1000)} seconds`;
  }

  return `${Math.round(timeoutMs / 60_000)} minutes`;
};
