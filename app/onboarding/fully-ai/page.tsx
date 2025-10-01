/**
 * Fully AI-Driven Onboarding Page
 * Premium consultation experience - Aesop-inspired design
 * Lazy-loaded for optimal performance
 */

'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Lazy load the heavy onboarding component
const FullyAIDrivenOnboardingPremium = dynamic(
  () => import('@/components/onboarding/FullyAIDrivenOnboarding_Premium').then((mod) => mod.FullyAIDrivenOnboardingPremium),
  {
    loading: () => (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sage-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-warm-600">Preparing your consultation...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function FullyAIOnboardingPage() {
  return <FullyAIDrivenOnboardingPremium />;
}
