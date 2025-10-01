'use client';

/**
 * Accessibility Wrapper
 * Applies accessibility settings to the document root
 * Handles keyboard shortcuts, click delays, and ARIA live regions
 */

import { useEffect, useRef } from 'react';
import { useAccessibility } from '@/lib/contexts/AccessibilityContext';

export function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  const { settings, announce } = useAccessibility();
  const clickDelayTimeouts = useRef<Map<HTMLElement, NodeJS.Timeout>>(new Map());

  // Apply settings to document root
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);

    // Contrast mode
    root.setAttribute('data-contrast', settings.contrastMode);

    // Motion preference
    root.setAttribute('data-motion', settings.motionPreference);

    // Enhanced focus
    root.setAttribute('data-focus-enhanced', settings.focusIndicatorEnhanced.toString());

    // Announce settings changes
    if (settings.announcements) {
      // Only announce after initial mount
      const hasSeenSettings = sessionStorage.getItem('accessibility-announced');
      if (!hasSeenSettings) {
        sessionStorage.setItem('accessibility-announced', 'true');
      }
    }
  }, [settings, announce]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!settings.keyboardShortcuts) return;

    const handleKeyboard = (e: KeyboardEvent) => {
      // Alt+A: Open accessibility panel
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        const button = document.querySelector('[aria-label="Open accessibility settings"]') as HTMLElement;
        button?.click();
        announce('Accessibility settings opened', 'assertive');
      }

      // Alt+K: Show keyboard shortcuts
      if (e.altKey && e.key === 'k') {
        e.preventDefault();
        announce('Keyboard shortcuts: Alt+A for accessibility settings, Alt+M to toggle main content, Alt+1 through Alt+6 for headings', 'polite');
      }

      // Alt+M: Focus main content
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        const main = document.querySelector('main') || document.querySelector('[role="main"]');
        if (main instanceof HTMLElement) {
          main.focus();
          announce('Focused on main content', 'polite');
        }
      }

      // Alt+/ : Search (if exists)
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        const search = document.querySelector('input[type="search"]') as HTMLElement;
        if (search) {
          search.focus();
          announce('Search focused', 'polite');
        }
      }

      // Escape: Close modals/panels
      if (e.key === 'Escape') {
        const activePanel = document.querySelector('[role="dialog"]:not([hidden])');
        if (activePanel) {
          const closeButton = activePanel.querySelector('[aria-label*="Close"]') as HTMLElement;
          closeButton?.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [settings.keyboardShortcuts, announce]);

  // Click delay for motor impairments
  useEffect(() => {
    if (settings.clickDelay === 0) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Only apply to interactive elements
      if (!target.matches('button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]')) {
        return;
      }

      // Check if this is a real click or a delayed one
      if (target.hasAttribute('data-delayed-click')) {
        target.removeAttribute('data-delayed-click');
        return;
      }

      // Prevent immediate action
      e.preventDefault();
      e.stopPropagation();

      // Clear existing timeout for this element
      const existingTimeout = clickDelayTimeouts.current.get(target);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Visual feedback
      target.style.opacity = '0.6';

      // Set new timeout
      const timeout = setTimeout(() => {
        target.style.opacity = '';
        target.setAttribute('data-delayed-click', 'true');
        target.click();
        clickDelayTimeouts.current.delete(target);
      }, settings.clickDelay);

      clickDelayTimeouts.current.set(target, timeout);
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      // Clear all timeouts
      clickDelayTimeouts.current.forEach(timeout => clearTimeout(timeout));
      clickDelayTimeouts.current.clear();
    };
  }, [settings.clickDelay]);

  // Create permanent ARIA live region for announcements
  useEffect(() => {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'accessibility-announcer';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);

    return () => {
      const region = document.getElementById('accessibility-announcer');
      region?.remove();
    };
  }, []);

  return <>{children}</>;
}
