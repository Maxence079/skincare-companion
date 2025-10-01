'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontSize = 'small' | 'medium' | 'large' | 'x-large';
export type ContrastMode = 'normal' | 'high';
export type MotionPreference = 'full' | 'reduced' | 'none';

interface AccessibilitySettings {
  // Visual
  fontSize: FontSize;
  contrastMode: ContrastMode;
  motionPreference: MotionPreference;
  focusIndicatorEnhanced: boolean;

  // Screen Reader
  announcements: boolean;
  verboseDescriptions: boolean;

  // Interaction
  keyboardShortcuts: boolean;
  clickDelay: number; // ms delay to prevent accidental clicks
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'medium',
  contrastMode: 'normal',
  motionPreference: 'full',
  focusIndicatorEnhanced: false,
  announcements: true,
  verboseDescriptions: false,
  keyboardShortcuts: true,
  clickDelay: 0
};

const STORAGE_KEY = 'skincare_accessibility_settings';

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);

    // Load saved settings
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e);
      }
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersReducedMotion && !saved) {
      setSettings(prev => ({ ...prev, motionPreference: 'reduced' }));
    }

    if (prefersHighContrast && !saved) {
      setSettings(prev => ({ ...prev, contrastMode: 'high' }));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      applyAccessibilitySettings(settings);
    }
  }, [settings, mounted]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings, announce }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// Apply accessibility settings to document
function applyAccessibilitySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // Font size
  const fontSizeMap: Record<FontSize, string> = {
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
}
