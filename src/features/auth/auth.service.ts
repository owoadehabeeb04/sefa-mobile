/**
 * Authentication Service
 * API calls for authentication endpoints
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ResendOTPRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  ApiResponse,
} from './auth.types';

/**
 * Register a new user
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {

  const response = await api.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.REGISTER,
    data
  );
  console.log(response.data);
  return response.data;
};

/**
 * Login user
 */
export const login = async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.LOGIN,
    data
  );
  return response.data;
};

/**
 * Verify email with OTP
 */
export const verifyEmail = async (data: VerifyEmailRequest): Promise<ApiResponse<AuthResponse>> => {
  const response = await api.post<ApiResponse<AuthResponse>>(
    API_ENDPOINTS.AUTH.VERIFY_EMAIL,
    data
  );
  return response.data;
};

/**
 * Resend OTP for email verification
 */
export const resendOTP = async (data: ResendOTPRequest): Promise<ApiResponse<{ message: string; otp?: string; expiresIn?: string }>> => {
  const response = await api.post<ApiResponse<{ message: string; otp?: string; expiresIn?: string }>>(
    API_ENDPOINTS.AUTH.RESEND_OTP,
    data
  );
  return response.data;
};

/**
 * Forgot password - Request OTP
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string; otp?: string; expiresIn?: string }>> => {
  const response = await api.post<ApiResponse<{ message: string; otp?: string; expiresIn?: string }>>(
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
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
export const getCurrentUser = async (): Promise<ApiResponse<{ user: AuthResponse['user'] }>> => {
  const response = await api.get<ApiResponse<{ user: AuthResponse['user'] }>>(
    API_ENDPOINTS.AUTH.ME
  );
  return response.data;
};

/**
 * Logout user
 */
export const logout = async (): Promise<ApiResponse<{ message: string }>> => {
  const response = await api.post<ApiResponse<{ message: string }>>(
    API_ENDPOINTS.AUTH.LOGOUT
  );
  return response.data;
};
