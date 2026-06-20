import * as SecureStore from '@/utils/secureStore';

const LAST_PROTECTED_ROUTE_KEY = 'last_protected_route_v1';
const SAFE_ROUTE_PATTERN = /^\/(?:\(tabs\)|assistant|settings|transactions|insights|notifications|add)(?:\/[^?#]*)?$/;

export const saveLastProtectedRoute = async (pathname: string): Promise<void> => {
  const raw = String(pathname || '').trim();
  const normalized = raw === '/' ? '/(tabs)' : raw;
  if (!SAFE_ROUTE_PATTERN.test(normalized)) return;

  try {
    await SecureStore.setItemAsync(LAST_PROTECTED_ROUTE_KEY, normalized);
  } catch (error) {
    console.warn('Could not save the current app route:', error);
  }
};

export const getLastProtectedRoute = async (): Promise<string | null> => {
  try {
    const route = await SecureStore.getItemAsync(LAST_PROTECTED_ROUTE_KEY);
    return route && SAFE_ROUTE_PATTERN.test(route) ? route : null;
  } catch (error) {
    console.warn('Could not restore the previous app route:', error);
    return null;
  }
};

export const clearLastProtectedRoute = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(LAST_PROTECTED_ROUTE_KEY);
  } catch (error) {
    console.warn('Could not clear the previous app route:', error);
  }
};
