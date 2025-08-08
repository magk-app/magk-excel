/**
 * Animation Components and Utilities for MAGK Excel Workflow Nodes
 * 
 * This module provides comprehensive animation utilities for workflow node status changes,
 * progress indicators, and visual effects. All animations respect accessibility preferences
 * and provide smooth, performant transitions.
 * 
 * @module WorkflowAnimations
 */

// Core animation configurations and variants
export {
  // Animation variants
  nodeContainerVariants,
  statusIconVariants,
  progressBarVariants,
  waveVariants,
  particleVariants,
  statusTransitionVariants,
  counterVariants,
  connectionVariants,
  glowVariants,
  hoverVariants,
  attentionVariants,
  breatheVariants,
  
  // Transition configurations
  SPRING_CONFIG,
  SMOOTH_SPRING,
  BOUNCY_SPRING,
  FAST_TRANSITION,
  MEDIUM_TRANSITION,
  SLOW_TRANSITION,
  
  // Color mappings
  STATUS_COLORS,
  
  // Animation timing presets
  ANIMATION_TIMINGS,
  
  // Accessibility utilities
  getReducedMotionVariants,
  respectsReducedMotion,
  getAnimationVariants,
} from './nodeAnimations';

// Status transition components
export {
  StatusTransition,
  StatusBadge,
  StatusTimeline,
} from './StatusTransition';

// Progress animation components
export {
  ProgressAnimation,
  ProgressDot,
} from './ProgressAnimation';

// Re-export common animation types for convenience
export type {
  Variants,
  Transition,
} from 'framer-motion';

export type {
  NodeStatus,
  NodeProgress,
} from '../../../types/workflow';

/**
 * Animation Usage Examples:
 * 
 * 1. Basic Status Transition:
 * ```tsx
 * import { StatusTransition } from './animations';
 * 
 * <StatusTransition 
 *   status="running" 
 *   previousStatus="pending" 
 *   size="md" 
 *   showLabel={true}
 *   onTransitionComplete={() => console.log('Animation complete')}
 * />
 * ```
 * 
 * 2. Progress Animation:
 * ```tsx
 * import { ProgressAnimation } from './animations';
 * 
 * <ProgressAnimation
 *   progress={{
 *     current: 45,
 *     total: 100,
 *     percentage: 45,
 *     message: "Processing data...",
 *     estimatedTimeRemaining: 120
 *   }}
 *   variant="detailed"
 *   showEta={true}
 *   showThroughput={true}
 * />
 * ```
 * 
 * 3. Custom Animation with Variants:
 * ```tsx
 * import { motion } from 'framer-motion';
 * import { nodeContainerVariants, getAnimationVariants } from './animations';
 * 
 * <motion.div
 *   variants={getAnimationVariants(nodeContainerVariants)}
 *   initial="pending"
 *   animate="running"
 * >
 *   Your content here
 * </motion.div>
 * ```
 * 
 * 4. Accessibility-Aware Animations:
 * ```tsx
 * import { respectsReducedMotion, getAnimationVariants } from './animations';
 * 
 * const shouldAnimate = !respectsReducedMotion();
 * const variants = getAnimationVariants(statusTransitionVariants);
 * ```
 */

/**
 * Animation Performance Guidelines:
 * 
 * 1. Use transform properties (scale, rotate, translate) over layout properties
 * 2. Prefer opacity changes over visibility toggles
 * 3. Use will-change: transform for complex animations
 * 4. Debounce rapid status changes to prevent animation conflicts
 * 5. Clean up animation timers in useEffect cleanup functions
 * 
 * 6. For optimal performance with large numbers of nodes:
 *    - Use ProgressDot for overview displays
 *    - Implement virtualization for off-screen nodes
 *    - Consider reducing animation complexity when >50 nodes are visible
 */

/**
 * Accessibility Features:
 * 
 * 1. Respects prefers-reduced-motion setting
 * 2. Provides alternative static states for reduced motion
 * 3. Maintains semantic meaning without animations
 * 4. Uses appropriate ARIA labels and roles
 * 5. Ensures sufficient color contrast for status indicators
 * 6. Provides text alternatives for visual status changes
 */

/**
 * Browser Compatibility:
 * 
 * - Modern browsers with CSS Grid and Flexbox support
 * - framer-motion requires React 16.8+ (hooks)
 * - CSS custom properties for theming
 * - RequestAnimationFrame for smooth number animations
 * - IntersectionObserver for performance optimizations (optional)
 */