/**
 * Authentication Types
 */

export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  isVerified: boolean;
  onboardingCompleted: boolean;
  preferences?: {
    notifications: boolean;
    theme: string;
    language: string;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  currency?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendOTPRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  requiresVerification?: boolean;
  otp?: string; // Only in development
  expiresIn?: string; // Only in development
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
}
