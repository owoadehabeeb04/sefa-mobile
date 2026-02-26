/**
 * Onboarding Data
 */

import type { OnboardingSlide } from './onboarding.types';
import {
  savingsIllustration,
  trackingIllustration,
  securityIllustration,
} from '@/assets/illustrations';

export const onboardingSlides: OnboardingSlide[] = [
  {
    title: 'Smart budgeting\nmade easy',
    subtitle: 'AI-powered insights',
    description: 'Let AI help you create and manage budgets that work for your financial goals',
    illustration: savingsIllustration,
  },
  {
    title: 'Track every\nexpense',
    subtitle: 'Stay in control',
    description: 'Monitor your spending and get real-time insights on where your money goes',
    illustration: trackingIllustration,
  },
  {
    title: 'Secure &\nprivate',
    subtitle: 'Bank-level security',
    description: 'Your financial data is protected with industry-standard encryption',
    illustration: securityIllustration,
  },
];
