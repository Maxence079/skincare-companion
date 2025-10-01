'use client';

/**
 * Lazy-loaded Accessibility Button
 * Defers loading until user interacts or after initial page load
 */

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Settings } from 'lucide-react';

// Dynamically import the AccessibilityButton with loading state
const AccessibilityButton = dynamic(
  () => import('@/components/ui/accessibility-panel').then(mod => ({ default: mod.AccessibilityButton })),
  {
    loading: () => (
      <button
        className="fixed bottom-4 right-4 p-4 bg-sage-600 text-white rounded-full shadow-lg z-30"
        disabled
        aria-label="Loading accessibility settings"
      >
        <Settings className="w-6 h-6 animate-pulse" aria-hidden="true" />
      </button>
    ),
    ssr: false, // Don't render on server (not needed for initial paint)
  }
);

export function LazyAccessibilityButton() {
  return (
    <Suspense
      fallback={
        <button
          className="fixed bottom-4 right-4 p-4 bg-sage-600 text-white rounded-full shadow-lg z-30"
          disabled
          aria-label="Loading accessibility settings"
        >
          <Settings className="w-6 h-6" aria-hidden="true" />
        </button>
      }
    >
      <AccessibilityButton />
    </Suspense>
  );
}
