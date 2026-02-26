/**
 * Onboarding Types
 */

export interface OnboardingSlide {
  title: string;
  subtitle: string;
  description: string;
  illustration?: string;
}

export type OnboardingStep = 'profile' | 'consent' | 'categories' | 'complete';
