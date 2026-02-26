/**
 * Network-aware refetch helper (API-only, no local DB).
 * On reconnect, the callback (e.g. invalidateQueries) is called so React Query refetches.
 */

import NetInfo from '@react-native-community/netinfo';

/**
 * Check if device is online
 */
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
};

/**
 * Subscribe to network state. When the device comes online, the callback is invoked
 * (e.g. to invalidate React Query cache so data is refetched from the API).
 */
export const setupAutoSync = (callback?: (result: { success: boolean }) => void) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && callback) {
      callback({ success: true });
    }
  });
  return unsubscribe;
};
