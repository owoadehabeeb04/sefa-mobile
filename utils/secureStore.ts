import * as ExpoSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const getWebStorage = (): Storage | null => {
  if (!isWeb || typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.error('Secure storage fallback unavailable:', error);
    return null;
  }
};

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return getWebStorage()?.getItem(key) ?? null;
  }

  return ExpoSecureStore.getItemAsync(key);
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  if (isWeb) {
    getWebStorage()?.setItem(key, value);
    return;
  }

  await ExpoSecureStore.setItemAsync(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (isWeb) {
    getWebStorage()?.removeItem(key);
    return;
  }

  await ExpoSecureStore.deleteItemAsync(key);
};
