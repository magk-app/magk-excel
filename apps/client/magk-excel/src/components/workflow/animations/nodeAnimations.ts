/**
 * Animation configurations for MAGK Excel workflow nodes
 * Using framer-motion for performant status transitions and visual effects
 */

import { Variants, Transition } from 'framer-motion';
import { NodeStatus } from '../../../types/workflow';

// Spring physics configuration for natural movements
export const SPRING_CONFIG: Transition = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
  mass: 1,
};

export const SMOOTH_SPRING: Transition = {
  type: 'spring',
  damping: 30,
  stiffness: 200,
  mass: 0.8,
};

export const BOUNCY_SPRING: Transition = {
  type: 'spring',
  damping: 15,
  stiffness: 400,
  mass: 0.6,
};

// Duration-based transitions for consistent timing
export const FAST_TRANSITION: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

export const MEDIUM_TRANSITION: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

export const SLOW_TRANSITION: Transition = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94],
};

// Node container animation variants
export const nodeContainerVariants: Variants = {
  pending: {
    scale: 1,
    opacity: 0.7,
    borderWidth: 2,
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
    filter: 'brightness(0.9) saturate(0.8)',
    transition: MEDIUM_TRANSITION,
  },
  running: {
    scale: 1.05,
    opacity: 1,
    borderWidth: 3,
    boxShadow: '0 0 20px 0 rgba(59, 130, 246, 0.4)',
    filter: 'brightness(1.1) saturate(1.2)',
    transition: SPRING_CONFIG,
  },
  completed: {
    scale: 1,
    opacity: 1,
    borderWidth: 2,
    boxShadow: '0 0 15px 0 rgba(34, 197, 94, 0.3)',
    filter: 'brightness(1) saturate(1)',
    transition: SMOOTH_SPRING,
  },
  error: {
    scale: 1,
    opacity: 1,
    borderWidth: 3,
    boxShadow: '0 0 20px 0 rgba(239, 68, 68, 0.4)',
    filter: 'brightness(1.1) saturate(1.3)',
    transition: SPRING_CONFIG,
  },
  paused: {
    scale: 0.98,
    opacity: 0.8,
    borderWidth: 2,
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
    filter: 'brightness(0.95) saturate(0.9)',
    transition: MEDIUM_TRANSITION,
  },
};

// Status icon animation variants
export const statusIconVariants: Variants = {
  pending: {
    scale: 1,
    rotate: 0,
    opacity: 0.6,
    transition: FAST_TRANSITION,
  },
  running: {
    scale: 1.1,
    rotate: 360,
    opacity: 1,
    transition: {
      scale: FAST_TRANSITION,
      rotate: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
      opacity: FAST_TRANSITION,
    },
  },
  completed: {
    scale: [1, 1.3, 1],
    rotate: 0,
    opacity: 1,
    transition: {
      scale: {
        duration: 0.6,
        times: [0, 0.5, 1],
        ease: 'easeOut',
      },
      opacity: FAST_TRANSITION,
    },
  },
  error: {
    scale: [1, 1.2, 1, 1.1, 1],
    rotate: [-5, 5, -5, 5, 0],
    opacity: 1,
    transition: {
      duration: 0.8,
      times: [0, 0.2, 0.4, 0.6, 1],
      ease: 'easeInOut',
    },
  },
  paused: {
    scale: 0.9,
    rotate: 0,
    opacity: 0.7,
    transition: MEDIUM_TRANSITION,
  },
};

// Progress bar animation variants
export const progressBarVariants: Variants = {
  initial: {
    width: '0%',
    opacity: 0,
  },
  animate: {
    width: '100%',
    opacity: 1,
    transition: {
      width: {
        duration: 1.5,
        ease: 'easeInOut',
      },
      opacity: FAST_TRANSITION,
    },
  },
  complete: {
    width: '100%',
    opacity: 1,
    backgroundColor: '#22c55e',
    transition: {
      backgroundColor: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  },
  error: {
    width: '100%',
    opacity: 1,
    backgroundColor: '#ef4444',
    transition: {
      backgroundColor: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  },
};

// Wave effect for progress animation
export const waveVariants: Variants = {
  animate: {
    x: ['0%', '100%'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Particle effect variants for celebration
export const particleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
    x: 0,
    y: 0,
  },
  animate: (i: number) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    x: Math.cos(i * 0.5) * 100,
    y: Math.sin(i * 0.5) * 100 - 50,
    transition: {
      duration: 1.5,
      delay: i * 0.1,
      ease: 'easeOut',
    },
  }),
};

// Status transition animations with enter/exit states
export const statusTransitionVariants: Variants = {
  enter: (status: NodeStatus) => {
    const baseEnter = {
      opacity: 1,
      scale: 1,
      transition: SPRING_CONFIG,
    };

    switch (status) {
      case 'running':
        return {
          ...baseEnter,
          scale: [0.8, 1.1, 1],
          rotate: [0, 5, 0],
          transition: {
            duration: 0.6,
            ease: 'easeOut',
          },
        };
      case 'completed':
        return {
          ...baseEnter,
          scale: [0.5, 1.2, 1],
          rotate: [0, 180, 360],
          transition: {
            duration: 0.8,
            ease: 'backOut',
          },
        };
      case 'error':
        return {
          ...baseEnter,
          x: [-10, 10, -5, 5, 0],
          transition: {
            duration: 0.5,
            ease: 'easeOut',
          },
        };
      default:
        return baseEnter;
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: FAST_TRANSITION,
  },
};

// Number counter animation variants
export const counterVariants: Variants = {
  initial: {
    y: 20,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: SPRING_CONFIG,
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: FAST_TRANSITION,
  },
};

// Connection line animation variants
export const connectionVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1,
        ease: 'easeInOut',
      },
      opacity: FAST_TRANSITION,
    },
  },
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Glow effect variants
export const glowVariants: Variants = {
  initial: {
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
  },
  animate: (color: string) => ({
    boxShadow: [
      `0 0 0 0 ${color}20`,
      `0 0 20px 5px ${color}40`,
      `0 0 0 0 ${color}20`,
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

// Hover interaction variants
export const hoverVariants: Variants = {
  rest: {
    scale: 1,
    transition: FAST_TRANSITION,
  },
  hover: {
    scale: 1.02,
    transition: FAST_TRANSITION,
  },
  tap: {
    scale: 0.98,
    transition: FAST_TRANSITION,
  },
};

// Attention-grabbing animation for errors
export const attentionVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    rotate: [0, 1, -1, 0],
    transition: {
      duration: 0.6,
      repeat: 3,
      ease: 'easeInOut',
    },
  },
};

// Breathe animation for pending states
export const breatheVariants: Variants = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.7, 0.9, 0.7],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Status color mappings for animations
export const STATUS_COLORS = {
  pending: '#6b7280',
  running: '#3b82f6',
  completed: '#22c55e',
  error: '#ef4444',
  paused: '#f59e0b',
} as const;

// Animation timing presets
export const ANIMATION_TIMINGS = {
  status_change: 0.3,
  progress_update: 0.15,
  completion_celebration: 1.2,
  error_shake: 0.5,
  hover_response: 0.1,
} as const;

// Accessibility-aware animation configuration
export const getReducedMotionVariants = (variants: Variants): Variants => {
  const reducedVariants: Variants = {};
  
  Object.keys(variants).forEach((key) => {
    const variant = variants[key];
    if (typeof variant === 'object' && variant !== null) {
      reducedVariants[key] = {
        ...variant,
        transition: {
          duration: 0.01,
          ease: 'linear',
        },
      };
    } else {
      reducedVariants[key] = variant;
    }
  });
  
  return reducedVariants;
};

// Check for reduced motion preference
export const respectsReducedMotion = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

// Get animation variants with accessibility consideration
export const getAnimationVariants = (variants: Variants): Variants => {
  return respectsReducedMotion() ? getReducedMotionVariants(variants) : variants;
};