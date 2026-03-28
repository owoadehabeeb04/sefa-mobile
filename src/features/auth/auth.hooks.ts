/**
 * React Query hooks for authentication
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import {
  register,
  login,
  verifyEmail,
  resendOTP,
  resendPasswordResetOTP,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  getCurrentUser, 
  logout,
} from './auth.service';
import type {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendOTPRequest,
  ResendPasswordResetOTPRequest,
  ForgotPasswordRequest,
  VerifyPasswordResetOTPRequest,
  ResetPasswordRequest,
} from './auth.types';

/**
 * Register mutation
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
  });
};

/**
 * Login mutation
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: async (response) => {
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;

        if (token && refreshToken && typeof token === 'string' && typeof refreshToken === 'string') {
          await setAuth(user, token, refreshToken);
          await queryClient.invalidateQueries({ queryKey: ['user'] });
          await queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
        }
      }
    },
  });
};

/**
 * Verify email mutation
 */
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => verifyEmail(data),
    onSuccess: async (response) => {
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;

        if (user.isVerified && !token) {
          await queryClient.invalidateQueries({ queryKey: ['user'] });
          await queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
          return;
        }

        if (token && refreshToken && typeof token === 'string' && typeof refreshToken === 'string') {
          await setAuth(user, token, refreshToken);
          await queryClient.invalidateQueries({ queryKey: ['user'] });
          await queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
        }
      }
    },
  });
};

/**
 * Resend OTP mutation
 */
export const useResendOTP = () => {
  return useMutation({
    mutationFn: (data: ResendOTPRequest) => resendOTP(data),
  });
};

/**
 * Resend OTP for password reset
 */
export const useResendPasswordResetOTP = () => {
  return useMutation({
    mutationFn: (data: ResendPasswordResetOTPRequest) => resendPasswordResetOTP(data),
  });
};

/**
 * Forgot password mutation
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => forgotPassword(data),
  });
};

/**
 * Verify password reset OTP
 */
export const useVerifyPasswordResetOTP = () => {
  return useMutation({
    mutationFn: (data: VerifyPasswordResetOTPRequest) => verifyPasswordResetOTP(data),
  });
};

/**
 * Reset password mutation
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => resetPassword(data),
  });
};

/**
 * Get current user query
 */
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
    retry: false,
  });
};

/**
 * Logout mutation
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout: logoutStore } = useAuthStore();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await logoutStore();
      queryClient.clear();
    },
    onError: async () => {
      await logoutStore();
      queryClient.clear();
    },
  });
};
