/**
 * Animation Utilities
 * Centralized animation timing and easing for consistent, professional motion
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Professional easing curves
 * Based on iOS Human Interface Guidelines and Material Design
 */
export const easing = {
  // Standard easing - for most UI elements
  standard: [0.4, 0.0, 0.2, 1],

  // Deceleration - entering elements (ease-out)
  decelerate: [0.0, 0.0, 0.2, 1],

  // Acceleration - exiting elements (ease-in)
  accelerate: [0.4, 0.0, 1, 1],

  // Sharp - quick, decisive motion
  sharp: [0.4, 0.0, 0.6, 1],

  // Smooth - organic, natural motion
  smooth: [0.45, 0.05, 0.55, 0.95],

  // Bounce - playful, energetic
  bounce: [0.68, -0.55, 0.265, 1.55],

  // Spring - iOS-style spring physics
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 1
  },

  // Gentle spring - softer, more relaxed
  springGentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
    mass: 0.8
  },

  // Snappy spring - quick, responsive
  springSnappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
    mass: 0.6
  }
} as const;

/**
 * Duration presets (in seconds)
 */
export const duration = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
  slowest: 1.0
} as const;

/**
 * Common animation variants
 */
export const variants = {
  // Fade in/out
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  } as Variants,

  // Fade + scale (professional card entrance)
  fadeScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  } as Variants,

  // Slide up
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  } as Variants,

  // Slide down
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  } as Variants,

  // Slide left
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  } as Variants,

  // Slide right
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  } as Variants,

  // Pop (scale + fade, playful)
  pop: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  } as Variants,

  // Bounce (entrance with bounce)
  bounce: {
    initial: { opacity: 0, y: 30, scale: 0.9 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 20
      }
    },
    exit: { opacity: 0, y: -10, scale: 0.95 }
  } as Variants,

  // Stagger children (for lists)
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  } as Variants,

  // Stagger children (faster)
  staggerFast: {
    animate: {
      transition: {
        staggerChildren: 0.03
      }
    }
  } as Variants
} as const;

/**
 * Common transitions
 */
export const transitions = {
  // Standard transition
  standard: {
    duration: duration.normal,
    ease: easing.standard
  } as Transition,

  // Fast transition
  fast: {
    duration: duration.fast,
    ease: easing.sharp
  } as Transition,

  // Slow, smooth transition
  smooth: {
    duration: duration.slow,
    ease: easing.smooth
  } as Transition,

  // Spring transition (default)
  spring: easing.spring as Transition,

  // Gentle spring
  springGentle: easing.springGentle as Transition,

  // Snappy spring
  springSnappy: easing.springSnappy as Transition,

  // Bounce
  bounce: {
    duration: duration.normal,
    ease: easing.bounce
  } as Transition
} as const;

/**
 * Hover/tap animations (for interactive elements)
 */
export const interactive = {
  // Standard hover/tap (buttons)
  button: {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 },
    transition: transitions.springSnappy
  },

  // Subtle hover (cards, links)
  subtle: {
    whileHover: { scale: 1.01 },
    whileTap: { scale: 0.99 },
    transition: transitions.springSnappy
  },

  // Grow (playful elements)
  grow: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: transitions.spring
  },

  // Lift (floating effect)
  lift: {
    whileHover: { y: -4, scale: 1.01 },
    whileTap: { y: 0, scale: 0.99 },
    transition: transitions.springGentle
  },

  // Press (satisfying push)
  press: {
    whileTap: { scale: 0.95, y: 2 },
    transition: transitions.springSnappy
  }
} as const;

/**
 * Page transition variants
 */
export const pageTransitions = {
  // Fade transition (simple)
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: transitions.standard
  },

  // Slide transition (directional)
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: transitions.smooth
  },

  // Scale transition (modern)
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
    transition: transitions.smooth
  }
} as const;

/**
 * Utility functions
 */

/**
 * Create stagger animation for lists
 */
export function createStagger(staggerDelay: number = 0.05, delayChildren: number = 0) {
  return {
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren
      }
    }
  };
}

/**
 * Create delayed animation
 */
export function withDelay(animation: Variants, delay: number): Variants {
  return {
    ...animation,
    animate: {
      ...animation.animate,
      transition: {
        ...(animation.animate as any)?.transition,
        delay
      }
    }
  };
}

/**
 * Shimmer effect for skeletons
 */
export const shimmer = {
  animate: {
    x: ['-100%', '100%']
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear'
  }
} as const;

/**
 * Pulse effect for loading indicators
 */
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5]
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: easing.smooth
  }
} as const;
