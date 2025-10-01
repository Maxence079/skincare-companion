'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Eye,
  Volume2,
  Keyboard,
  RefreshCw,
  X,
  Check,
  ZoomIn,
  Contrast,
  Zap,
  MousePointer
} from 'lucide-react';
import { useAccessibility, FontSize, ContrastMode, MotionPreference } from '@/lib/contexts/AccessibilityContext';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useRadioGroup } from '@/lib/hooks/useRadioGroup';
import { Button } from './button';
import { variants, transitions } from '@/lib/utils/animations';
import { toggleInteraction } from '@/lib/utils/micro-interactions';
import { cn } from '@/lib/utils';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { settings, updateSetting, resetSettings, announce } = useAccessibility();
  const panelRef = useFocusTrap(isOpen);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        announce('Accessibility settings closed');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, announce]);

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSetting(key, value);
    toggleInteraction(value);
    announce(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleFontSizeChange = (size: FontSize) => {
    updateSetting('fontSize', size);
    announce(`Font size changed to ${size}`);
  };

  const handleContrastChange = (mode: ContrastMode) => {
    updateSetting('contrastMode', mode);
    announce(`Contrast mode changed to ${mode}`);
  };

  const handleMotionChange = (preference: MotionPreference) => {
    updateSetting('motionPreference', preference);
    announce(`Motion preference changed to ${preference}`);
  };

  const handleReset = () => {
    resetSettings();
    announce('Accessibility settings reset to defaults');
  };

  // Radio group keyboard navigation
  const fontSizeRadio = useRadioGroup({
    options: ['small', 'medium', 'large', 'x-large'] as const,
    value: settings.fontSize,
    onChange: handleFontSizeChange,
    orientation: 'horizontal'
  });

  const contrastRadio = useRadioGroup({
    options: ['normal', 'high'] as const,
    value: settings.contrastMode,
    onChange: handleContrastChange,
    orientation: 'horizontal'
  });

  const motionRadio = useRadioGroup({
    options: ['full', 'reduced', 'none'] as const,
    value: settings.motionPreference,
    onChange: handleMotionChange,
    orientation: 'vertical'
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef as any}
            variants={variants.slideRight}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.smooth}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            role="dialog"
            aria-labelledby="accessibility-title"
            aria-modal="true"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-sage-600" aria-hidden="true" />
                  <h2 id="accessibility-title" className="text-2xl font-bold text-sage-900">
                    Accessibility Settings
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close accessibility settings"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-sm text-sage-600">
                Customize your experience for better accessibility and comfort. Use arrow keys to navigate options.
              </p>

              {/* Visual Section */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-sage-900 mb-4">
                  <Eye className="w-5 h-5" aria-hidden="true" />
                  Visual
                </h3>

                {/* Font Size with Keyboard Navigation */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-medium text-sage-700">
                    <ZoomIn className="w-4 h-4 inline mr-2" aria-hidden="true" />
                    Font Size
                  </label>
                  <div
                    ref={fontSizeRadio.groupRef}
                    className="grid grid-cols-4 gap-2"
                    role="radiogroup"
                    aria-label="Font size. Use arrow keys to navigate."
                  >
                    {(['small', 'medium', 'large', 'x-large'] as FontSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => handleFontSizeChange(size)}
                        {...fontSizeRadio.getRadioProps(size)}
                        className={cn(
                          'px-3 py-2 rounded-lg border-2 transition-colors text-sm font-medium',
                          settings.fontSize === size
                            ? 'border-sage-500 bg-sage-50 text-sage-900'
                            : 'border-sage-200 bg-white text-sage-700 hover:border-sage-300'
                        )}
                        role="radio"
                        aria-checked={settings.fontSize === size}
                      >
                        {size === 'x-large' ? 'XL' : size.charAt(0).toUpperCase() + size.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrast Mode with Keyboard Navigation */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-medium text-sage-700">
                    <Contrast className="w-4 h-4 inline mr-2" aria-hidden="true" />
                    Contrast Mode
                  </label>
                  <div
                    ref={contrastRadio.groupRef}
                    className="grid grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label="Contrast mode. Use arrow keys to navigate."
                  >
                    {(['normal', 'high'] as ContrastMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleContrastChange(mode)}
                        {...contrastRadio.getRadioProps(mode)}
                        className={cn(
                          'px-4 py-3 rounded-lg border-2 transition-colors text-sm font-medium',
                          settings.contrastMode === mode
                            ? 'border-sage-500 bg-sage-50 text-sage-900'
                            : 'border-sage-200 bg-white text-sage-700 hover:border-sage-300'
                        )}
                        role="radio"
                        aria-checked={settings.contrastMode === mode}
                      >
                        {mode === 'high' ? 'High Contrast' : 'Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Focus Indicators */}
                <label className="flex items-center justify-between p-3 bg-sage-50 rounded-lg cursor-pointer">
                  <span className="text-sm font-medium text-sage-900">Enhanced Focus Indicators</span>
                  <input
                    type="checkbox"
                    checked={settings.focusIndicatorEnhanced}
                    onChange={(e) => handleToggle('focusIndicatorEnhanced', e.target.checked)}
                    className="sr-only"
                    aria-label="Toggle enhanced focus indicators"
                  />
                  <div
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors',
                      settings.focusIndicatorEnhanced ? 'bg-sage-500' : 'bg-sage-300'
                    )}
                    aria-hidden="true"
                  >
                    <motion.div
                      animate={{ x: settings.focusIndicatorEnhanced ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-6 h-6 bg-white rounded-full shadow-sm"
                    />
                  </div>
                </label>
              </section>

              {/* Motion Section with Keyboard Navigation */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-sage-900 mb-4">
                  <Zap className="w-5 h-5" aria-hidden="true" />
                  Motion & Animations
                </h3>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-sage-700">
                    Motion Preference
                  </label>
                  <div
                    ref={motionRadio.groupRef}
                    className="space-y-2"
                    role="radiogroup"
                    aria-label="Motion preference. Use arrow keys to navigate."
                  >
                    {([
                      { value: 'full', label: 'Full Animations', desc: 'All animations enabled' },
                      { value: 'reduced', label: 'Reduced Motion', desc: 'Fewer, gentler animations' },
                      { value: 'none', label: 'No Animations', desc: 'Instant transitions only' }
                    ] as const).map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => handleMotionChange(value)}
                        {...motionRadio.getRadioProps(value)}
                        className={cn(
                          'w-full text-left px-4 py-3 rounded-lg border-2 transition-colors',
                          settings.motionPreference === value
                            ? 'border-sage-500 bg-sage-50'
                            : 'border-sage-200 bg-white hover:border-sage-300'
                        )}
                        role="radio"
                        aria-checked={settings.motionPreference === value}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-sage-900">{label}</p>
                            <p className="text-xs text-sage-600">{desc}</p>
                          </div>
                          {settings.motionPreference === value && (
                            <Check className="w-5 h-5 text-sage-600" aria-hidden="true" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Screen Reader Section */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-sage-900 mb-4">
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                  Screen Reader
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-sage-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-sage-900">Live Announcements</p>
                      <p className="text-xs text-sage-600">Hear updates as they happen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.announcements}
                      onChange={(e) => handleToggle('announcements', e.target.checked)}
                      className="sr-only"
                      aria-label="Toggle live announcements"
                    />
                    <div
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors',
                        settings.announcements ? 'bg-sage-500' : 'bg-sage-300'
                      )}
                      aria-hidden="true"
                    >
                      <motion.div
                        animate={{ x: settings.announcements ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-6 h-6 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-sage-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-sage-900">Verbose Descriptions</p>
                      <p className="text-xs text-sage-600">More detailed element descriptions</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.verboseDescriptions}
                      onChange={(e) => handleToggle('verboseDescriptions', e.target.checked)}
                      className="sr-only"
                      aria-label="Toggle verbose descriptions"
                    />
                    <div
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors',
                        settings.verboseDescriptions ? 'bg-sage-500' : 'bg-sage-300'
                      )}
                      aria-hidden="true"
                    >
                      <motion.div
                        animate={{ x: settings.verboseDescriptions ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-6 h-6 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </label>
                </div>
              </section>

              {/* Interaction Section */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-sage-900 mb-4">
                  <Keyboard className="w-5 h-5" aria-hidden="true" />
                  Interaction
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-sage-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-sage-900">Keyboard Shortcuts</p>
                      <p className="text-xs text-sage-600">Enable power user shortcuts (Alt+A, Alt+K)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.keyboardShortcuts}
                      onChange={(e) => handleToggle('keyboardShortcuts', e.target.checked)}
                      className="sr-only"
                      aria-label="Toggle keyboard shortcuts"
                    />
                    <div
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors',
                        settings.keyboardShortcuts ? 'bg-sage-500' : 'bg-sage-300'
                      )}
                      aria-hidden="true"
                    >
                      <motion.div
                        animate={{ x: settings.keyboardShortcuts ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-6 h-6 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </label>

                  <div className="p-3 bg-sage-50 rounded-lg">
                    <label className="block text-sm font-medium text-sage-900 mb-2">
                      <MousePointer className="w-4 h-4 inline mr-2" aria-hidden="true" />
                      Click Delay: {settings.clickDelay}ms
                    </label>
                    <p className="text-xs text-sage-600 mb-2">
                      Prevents accidental clicks (useful for motor impairments)
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="50"
                      value={settings.clickDelay}
                      onChange={(e) => updateSetting('clickDelay', parseInt(e.target.value))}
                      className="w-full"
                      aria-label="Click delay in milliseconds"
                      aria-valuemin={0}
                      aria-valuemax={500}
                      aria-valuenow={settings.clickDelay}
                    />
                    <div className="flex justify-between text-xs text-sage-600 mt-1">
                      <span>0ms</span>
                      <span>500ms</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Reset Button */}
              <div className="pt-4 border-t border-sage-200">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2"
                  aria-label="Reset all accessibility settings to defaults"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Floating Accessibility Button
 * Sticky button to open accessibility panel
 */
export function AccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-4 bg-sage-600 hover:bg-sage-700 text-white rounded-full shadow-lg z-30 focus:outline-none focus:ring-4 focus:ring-sage-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open accessibility settings"
        title="Accessibility Settings (Alt+A)"
      >
        <Settings className="w-6 h-6" aria-hidden="true" />
      </motion.button>

      <AccessibilityPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
