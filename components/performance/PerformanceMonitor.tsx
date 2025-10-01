'use client';

/**
 * Performance Monitoring Component
 * Initializes Web Vitals tracking and Service Worker
 */

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/performance/register-sw';
import { reportWebVitals, observePerformance } from '@/lib/performance/web-vitals';

export function PerformanceMonitor() {
  useEffect(() => {
    // Register service worker for offline support
    registerServiceWorker();

    // Initialize performance monitoring
    observePerformance();

    // Import and report web vitals dynamically
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
      onINP(reportWebVitals); // INP replaces FID in web-vitals v4
    }).catch(() => {
      // web-vitals package not available, skip
    });
  }, []);

  return null; // This component doesn't render anything
}
