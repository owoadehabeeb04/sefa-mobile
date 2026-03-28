/**
 * Authentication Service
 * API calls for authentication endpoints
 */

import api, { getStoredRefreshToken } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type {
  RegisterRequest,
  LoginRequest,
  RegisterResponse,
  LoginResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendOTPRequest,
  ResendPasswordResetOTPRequest,
  ForgotPasswordRequest,
  VerifyPasswordResetOTPRequest,
  PasswordResetOtpVerificationResponse,
  ResetPasswordRequest,
  ApiResponse,
  RefreshTokenResponse,
  LogoutRequest,
} from './auth.types';

/**
 * Register a new user
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
  const response = await api.post<ApiResponse<RegisterResponse>>(
    API_ENDPOINTS.AUTH.REGISTER,
    data
  );
  return response.data;
};

/**
 * Login user
 */
export const login = async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  const response = await api.post<ApiResponse<LoginResponse>>(
    API_ENDPOINTS.AUTH.LOGIN,
    data
  );
  return response.data;
};

/**
 * Verify email with OTP
 */
export const verifyEmail = async (data: VerifyEmailRequest): Promise<ApiResponse<VerifyEmailResponse>> => {
  const response = await api.post<ApiResponse<VerifyEmailResponse>>(
    API_ENDPOINTS.AUTH.VERIFY_EMAIL,
    data
  );
  return response.data;
};

/**
 * Resend OTP for email verification
 */
export const resendOTP = async (data: ResendOTPRequest): Promise<ApiResponse<{ message: string; expiresIn?: string }>> => {
  const response = await api.post<ApiResponse<{ message: string; expiresIn?: string }>>(
    API_ENDPOINTS.AUTH.RESEND_OTP,
    data
  );
  return response.data;
};

/**
 * Resend OTP for password reset
 */
export const resendPasswordResetOTP = async (
  data: ResendPasswordResetOTPRequest
): Promise<ApiResponse<{ message: string; expiresIn?: string }>> => {
  const response = await api.post<ApiResponse<{ message: string; expiresIn?: string }>>(
    API_ENDPOINTS.AUTH.RESEND_PASSWORD_RESET_OTP,
    data
  );
  return response.data;
};

/**
 * Forgot password - Request OTP
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string; expiresIn?: string }>> => {
  const response = await api.post<ApiResponse<{ message: string; expiresIn?: string }>>(
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Verify password reset OTP before showing the password form
 */
export const verifyPasswordResetOTP = async (
  data: VerifyPasswordResetOTPRequest
): Promise<ApiResponse<PasswordResetOtpVerificationResponse>> => {
  const response = await api.post<ApiResponse<PasswordResetOtpVerificationResponse>>(
    API_ENDPOINTS.AUTH.VERIFY_PASSWORD_RESET_OTP,
    data
  );
  return response.data;
};

/**
 * Reset password with OTP
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
  const response = await api.post<ApiResponse<{ message: string }>>(
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<ApiResponse<{ user: LoginResponse['user'] }>> => {
  const response = await api.get<ApiResponse<{ user: LoginResponse['user'] }>>(
    API_ENDPOINTS.AUTH.ME
  );
  return response.data;
};

/**
 * Logout user
 */
export const logout = async (): Promise<ApiResponse<{ message: string }>> => {
  const refreshToken = await getStoredRefreshToken();
  const payload: LogoutRequest = {
    refreshToken: refreshToken || '',
  };

  const response = await api.post<ApiResponse<{ message: string }>>(
    API_ENDPOINTS.AUTH.LOGOUT,
    payload
  );
  return response.data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshTokenValue: string): Promise<ApiResponse<RefreshTokenResponse>> => {
  const response = await api.post<ApiResponse<RefreshTokenResponse>>(
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    { refreshToken: refreshTokenValue }
  );
  return response.data;
};
