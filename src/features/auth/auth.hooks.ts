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
  forgotPassword,
  resetPassword,
  getCurrentUser, 
  logout,
} from './auth.service';
import type {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendOTPRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './auth.types';

/**
 * Register mutation
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: (response) => {
      console.log('📝 Registration response:', response);
      // Registration successful - user needs to verify email before getting tokens
      // Tokens will be provided after email verification
      if (response.success && response.data) {
        console.log('📝 User registered, verification required');
      }
    },
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
    onSuccess: (response) => {
      console.log('🔐 Login response structure:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        // Validate tokens before storing
        if (token && refreshToken && typeof token === 'string' && typeof refreshToken === 'string') {
          setAuth(user, token, refreshToken);
          queryClient.setQueryData(['user'], user);
          // Invalidate to refetch fresh user data
          queryClient.invalidateQueries({ queryKey: ['user'] });
        } else {
          console.error('Invalid tokens received. Full response.data:', response.data);
          console.error('Expected token and refreshToken but got:', { token, refreshToken });
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
    onSuccess: (response) => {
      console.log('📧 Verify email response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // If user is already verified, tokens may not be returned
        if (user.isVerified && !token) {
          console.log('📧 User already verified, tokens not required');
          // Invalidate to refetch user data
          queryClient.invalidateQueries({ queryKey: ['user'] });
          return;
        }
        
        // Validate tokens before storing
        if (token && refreshToken && typeof token === 'string' && typeof refreshToken === 'string') {
          setAuth(user, token, refreshToken);
          queryClient.setQueryData(['user'], user);
          queryClient.invalidateQueries({ queryKey: ['user'] });
        } else {
          console.error('Invalid tokens received. Full response.data:', response.data);
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
 * Forgot password mutation
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => forgotPassword(data),
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
  });
};
