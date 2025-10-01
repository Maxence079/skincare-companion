/**
 * Micro-Interactions Library
 * World-class subtle animations and feedback for interactive elements
 *
 * Philosophy: Every interaction should feel delightful and provide clear feedback
 */

import { playSound } from './sound-effects';
import { triggerHaptic } from './mobile';
import { Variants } from 'framer-motion';

/**
 * Button press interaction with multi-sensory feedback
 */
export function buttonPress(soundType: 'click' | 'success' | 'toggle-on' | 'toggle-off' = 'click') {
  playSound(soundType);
  triggerHaptic('light');
}

/**
 * Suggestion pill tap interaction
 */
export function suggestionTap() {
  playSound('click');
  triggerHaptic('selection');
}

/**
 * Message send interaction
 */
export function messageSend() {
  playSound('message-sent');
  triggerHaptic('light');
}

/**
 * Message received interaction
 */
export function messageReceived() {
  playSound('message-received');
  triggerHaptic('light');
}

/**
 * Success interaction (completion, achievement)
 */
export function successInteraction() {
  playSound('success');
  triggerHaptic('success');
}

/**
 * Error interaction
 */
export function errorInteraction() {
  playSound('error');
  triggerHaptic('error');
}

/**
 * Toggle interaction
 */
export function toggleInteraction(enabled: boolean) {
  playSound(enabled ? 'toggle-on' : 'toggle-off');
  triggerHaptic(enabled ? 'medium' : 'light');
}

/**
 * Swipe interaction
 */
export function swipeInteraction() {
  playSound('swipe');
  triggerHaptic('selection');
}

/**
 * Framer Motion Variants for common micro-interactions
 */

export const microVariants = {
  // Button with satisfying press
  buttonPress: {
    rest: { scale: 1 },
    hover: { scale: 1.02, y: -2 },
    tap: { scale: 0.98, y: 0 }
  } as Variants,

  // Pill/chip with bounce
  pill: {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  } as Variants,

  // Card with lift effect
  card: {
    rest: { scale: 1, y: 0, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' },
    hover: {
      scale: 1.01,
      y: -4,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  } as Variants,

  // Icon button rotate
  iconRotate: {
    rest: { rotate: 0 },
    tap: { rotate: 15 }
  } as Variants,

  // Checkbox with pop
  checkbox: {
    unchecked: { scale: 1 },
    checked: { scale: [1, 1.2, 1] }
  } as Variants,

  // Switch toggle
  switch: {
    off: { x: 0 },
    on: { x: 20 }
  } as Variants,

  // Input focus
  input: {
    rest: { borderColor: 'rgba(0, 0, 0, 0.1)' },
    focus: { borderColor: 'rgba(99, 102, 241, 0.5)', scale: 1.01 }
  } as Variants,

  // Toast notification
  toast: {
    initial: { opacity: 0, y: 50, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
  } as Variants,

  // Loading spinner
  spinner: {
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 1,
        ease: 'linear'
      }
    }
  } as Variants,

  // Pulse effect
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut'
      }
    }
  } as Variants,

  // Shake (for errors)
  shake: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 0.5
      }
    }
  } as Variants,

  // Message bubble entrance
  messageBubble: {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30
      }
    }
  } as Variants,

  // Typing indicator dots
  typingDot: {
    animate: {
      y: [0, -8, 0],
      transition: {
        repeat: Infinity,
        duration: 0.6,
        ease: 'easeInOut'
      }
    }
  } as Variants
};

/**
 * Spring configurations for different interaction types
 */
export const springs = {
  // Snappy response (buttons)
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.6
  },

  // Gentle motion (cards, modals)
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
    mass: 0.8
  },

  // Bouncy (playful elements)
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 20,
    mass: 0.7
  },

  // Smooth (page transitions)
  smooth: {
    type: 'spring' as const,
    stiffness: 250,
    damping: 30,
    mass: 1
  }
};

/**
 * Scroll utilities
 */

/**
 * Smooth scroll to element with offset
 */
export function smoothScrollTo(element: HTMLElement | null, offset: number = 0) {
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Scroll to bottom of container (for message lists)
 */
export function scrollToBottom(
  container: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth'
) {
  if (!container) return;

  container.scrollTo({
    top: container.scrollHeight,
    behavior
  });
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Auto-scroll to keep element in view (for chat inputs)
 */
export function keepInView(element: HTMLElement, container: HTMLElement) {
  if (!isInViewport(element)) {
    smoothScrollTo(element, 100);
  }
}
