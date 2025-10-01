/**
 * Main Onboarding Entry Point
 * Redirects to fully AI-driven onboarding
 */

import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  redirect('/onboarding/fully-ai');
}