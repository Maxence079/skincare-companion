/**
 * Mobile Utilities
 * Keyboard handling and haptic feedback for mobile devices
 */

/**
 * Detect if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Detect if device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Haptic feedback types
 */
export type HapticType =
  | 'light'      // Subtle feedback
  | 'medium'     // Standard feedback
  | 'heavy'      // Strong feedback
  | 'success'    // Success pattern
  | 'warning'    // Warning pattern
  | 'error'      // Error pattern
  | 'selection'; // Selection change

/**
 * Haptic feedback preferences
 */
const HAPTIC_ENABLED_KEY = 'skincare-ai-haptic-enabled';

export function isHapticEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(HAPTIC_ENABLED_KEY);
  return stored === null ? true : stored === 'true'; // Default enabled
}

export function setHapticEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HAPTIC_ENABLED_KEY, enabled.toString());
}

/**
 * Trigger haptic feedback
 * Uses Vibration API with patterns for different feedback types
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  if (!isHapticEnabled()) return;
  if (!isMobile()) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;

      case 'medium':
        navigator.vibrate(20);
        break;

      case 'heavy':
        navigator.vibrate(40);
        break;

      case 'success':
        // Two quick taps
        navigator.vibrate([15, 30, 15]);
        break;

      case 'warning':
        // Medium pulse
        navigator.vibrate([30, 50, 30]);
        break;

      case 'error':
        // Three sharp taps
        navigator.vibrate([20, 50, 20, 50, 20]);
        break;

      case 'selection':
        // Very subtle
        navigator.vibrate(5);
        break;

      default:
        navigator.vibrate(10);
    }
  } catch (e) {
    console.warn('Haptic feedback not supported:', e);
  }
}

/**
 * Mobile keyboard utilities
 */

/**
 * Scroll element into view when keyboard opens
 * Prevents input from being hidden by keyboard
 */
export function scrollIntoViewOnFocus(element: HTMLElement, options?: {
  delay?: number;
  offset?: number;
  behavior?: ScrollBehavior;
}): void {
  const {
    delay = 300,
    offset = 20,
    behavior = 'smooth'
  } = options || {};

  // Wait for keyboard to open
  setTimeout(() => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if element is hidden by keyboard (assuming keyboard takes bottom 40% of screen)
    const keyboardHeight = viewportHeight * 0.4;
    const elementBottom = rect.bottom + offset;

    if (elementBottom > (viewportHeight - keyboardHeight)) {
      element.scrollIntoView({
        behavior,
        block: 'center',
        inline: 'nearest'
      });
    }
  }, delay);
}

/**
 * Prevent viewport zoom on input focus (iOS)
 */
export function preventZoomOnFocus(inputElement: HTMLInputElement | HTMLTextAreaElement): void {
  if (!isIOS()) return;

  // Store original font size
  const originalFontSize = window.getComputedStyle(inputElement).fontSize;

  // Set minimum font size to prevent zoom (16px minimum on iOS)
  if (parseFloat(originalFontSize) < 16) {
    inputElement.style.fontSize = '16px';
  }

  // Restore original size on blur
  inputElement.addEventListener('blur', () => {
    inputElement.style.fontSize = originalFontSize;
  }, { once: true });
}

/**
 * Detect if keyboard is visible
 * Uses viewport height changes to estimate keyboard state
 */
let initialViewportHeight: number | null = null;

export function isKeyboardVisible(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isMobile()) return false;

  if (initialViewportHeight === null) {
    initialViewportHeight = window.innerHeight;
  }

  const currentHeight = window.innerHeight;
  const heightDiff = initialViewportHeight - currentHeight;

  // Keyboard likely visible if viewport shrunk by more than 150px
  return heightDiff > 150;
}

/**
 * Handle keyboard show/hide events
 */
export function onKeyboardChange(callback: (visible: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  if (!isMobile()) return () => {};

  initialViewportHeight = window.innerHeight;
  let timeoutId: NodeJS.Timeout;

  const handleResize = () => {
    // Debounce to avoid rapid calls
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const visible = isKeyboardVisible();
      callback(visible);
    }, 100);
  };

  window.addEventListener('resize', handleResize);

  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(timeoutId);
  };
}

/**
 * Dismiss keyboard
 */
export function dismissKeyboard(): void {
  if (typeof document === 'undefined') return;

  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
}

/**
 * Safe area insets for notched devices
 */
export function getSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10)
  };
}

/**
 * Add CSS safe area insets to root
 * Call this once on app initialization
 */
export function initializeSafeAreaInsets(): void {
  if (typeof document === 'undefined') return;

  const style = document.documentElement.style;

  style.setProperty('--sat', 'env(safe-area-inset-top)');
  style.setProperty('--sab', 'env(safe-area-inset-bottom)');
  style.setProperty('--sal', 'env(safe-area-inset-left)');
  style.setProperty('--sar', 'env(safe-area-inset-right)');
}
