import { useAppLockStore } from '@/store/appLock.store';
import type { SensitiveAction } from './appLock.types';

export const useSensitiveActionSecurity = () => {
  const requestSensitiveAction = useAppLockStore((state) => state.requestSensitiveAction);

  const requireVerification = async (action: SensitiveAction): Promise<boolean> => {
    return requestSensitiveAction(action);
  };

  return {
    requireVerification,
  };
};
