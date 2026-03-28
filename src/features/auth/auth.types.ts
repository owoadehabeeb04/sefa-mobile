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
  onboardingStatus?: string;
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

export interface ResendPasswordResetOTPRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyPasswordResetOTPRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface RegisterResponse {
  user: Pick<User, 'id' | 'email' | 'isVerified' | 'onboardingCompleted' | 'onboardingStatus'>;
  requiresVerification: boolean;
  expiresIn?: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
  refreshToken?: string;
  requiresVerification?: boolean;
}

export interface VerifyEmailResponse {
  user: User;
  token?: string;
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  token: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface PasswordResetOtpVerificationResponse {
  canResetPassword: boolean;
}

export type AuthResponse = LoginResponse | VerifyEmailResponse;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp?: string;
}
