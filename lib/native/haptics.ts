/**
 * Native Haptic Feedback Utilities
 * Provides tactile feedback for user interactions
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Detect if running in native app
const isNative = () => {
  if (typeof window === 'undefined') return false;
  return (window as any).Capacitor !== undefined;
};

/**
 * Haptic feedback patterns
 */
export const haptics = {
  /**
   * Light impact - for subtle interactions
   */
  light: async () => {
    try {
      if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (error) {
      console.warn('[Haptics] Light feedback failed:', error);
    }
  },

  /**
   * Medium impact - for standard interactions
   */
  medium: async () => {
    try {
      if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    } catch (error) {
      console.warn('[Haptics] Medium feedback failed:', error);
    }
  },

  /**
   * Heavy impact - for important interactions
   */
  heavy: async () => {
    try {
      if (isNative()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch (error) {
      console.warn('[Haptics] Heavy feedback failed:', error);
    }
  },

  /**
   * Success notification - for completed actions
   */
  success: async () => {
    try {
      if (isNative()) {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (navigator.vibrate) {
        navigator.vibrate([20, 50, 20]);
      }
    } catch (error) {
      console.warn('[Haptics] Success feedback failed:', error);
    }
  },

  /**
   * Error notification - for failed actions
   */
  error: async () => {
    try {
      if (isNative()) {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (navigator.vibrate) {
        navigator.vibrate([40, 30, 40, 30, 40]);
      }
    } catch (error) {
      console.warn('[Haptics] Error feedback failed:', error);
    }
  },

  /**
   * Warning notification - for cautionary actions
   */
  warning: async () => {
    try {
      if (isNative()) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    } catch (error) {
      console.warn('[Haptics] Warning feedback failed:', error);
    }
  },

  /**
   * Selection feedback - for picker/selector changes
   */
  selection: async () => {
    try {
      if (isNative()) {
        await Haptics.selectionChanged();
      } else if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    } catch (error) {
      console.warn('[Haptics] Selection feedback failed:', error);
    }
  },
};
