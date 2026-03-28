/**
 * Onboarding Types
 */

export interface OnboardingSlide {
  title: string;
  subtitle: string;
  description: string;
  illustration?: string;
}

export type OnboardingStep = 'setup' | 'complete';
