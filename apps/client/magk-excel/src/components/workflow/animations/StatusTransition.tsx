/**
 * StatusTransition Component
 * Handles smooth transitions between workflow node statuses with visual effects
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2, 
  Pause,
  Zap,
  Sparkles,
} from 'lucide-react';
import { NodeStatus } from '../../../types/workflow';
import {
  statusTransitionVariants,
  statusIconVariants,
  glowVariants,
  attentionVariants,
  breatheVariants,
  particleVariants,
  getAnimationVariants,
  STATUS_COLORS,
} from './nodeAnimations';
import { cn } from '../../../lib/utils';

interface StatusTransitionProps {
  status: NodeStatus;
  previousStatus?: NodeStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onTransitionComplete?: () => void;
}

interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

const STATUS_CONFIG: Record<NodeStatus, StatusConfig> = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: STATUS_COLORS.pending,
    bgColor: 'bg-gray-100',
    description: 'Waiting to start execution',
  },
  running: {
    icon: Loader2,
    label: 'Running',
    color: STATUS_COLORS.running,
    bgColor: 'bg-blue-100',
    description: 'Currently executing',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: STATUS_COLORS.completed,
    bgColor: 'bg-green-100',
    description: 'Successfully completed',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    color: STATUS_COLORS.error,
    bgColor: 'bg-red-100',
    description: 'Execution failed',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    color: STATUS_COLORS.paused,
    bgColor: 'bg-yellow-100',
    description: 'Execution paused',
  },
};

const SIZE_CONFIG = {
  sm: { icon: 16, container: 'p-2', text: 'text-xs' },
  md: { icon: 20, container: 'p-3', text: 'text-sm' },
  lg: { icon: 24, container: 'p-4', text: 'text-base' },
};

export const StatusTransition: React.FC<StatusTransitionProps> = ({
  status,
  previousStatus,
  size = 'md',
  showLabel = true,
  className,
  onTransitionComplete,
}) => {
  const [showParticles, setShowParticles] = useState(false);
  const [particleKey, setParticleKey] = useState(0);
  
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  // Trigger particle effect on completion
  useEffect(() => {
    if (status === 'completed' && previousStatus === 'running') {
      setShowParticles(true);
      setParticleKey(prev => prev + 1);
      
      const timer = setTimeout(() => {
        setShowParticles(false);
        onTransitionComplete?.();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [status, previousStatus, onTransitionComplete]);

  // Get appropriate animation variant based on status
  const getStatusAnimation = () => {
    switch (status) {
      case 'running':
        return getAnimationVariants(statusIconVariants);
      case 'error':
        return getAnimationVariants(attentionVariants);
      case 'pending':
        return getAnimationVariants(breatheVariants);
      default:
        return getAnimationVariants(statusIconVariants);
    }
  };

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      {/* Status Icon Container */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 transition-colors',
          config.bgColor,
          sizeConfig.container
        )}
        style={{ borderColor: config.color }}
        variants={getAnimationVariants(statusTransitionVariants)}
        initial="exit"
        animate="enter"
        exit="exit"
        custom={status}
        onAnimationComplete={() => {
          if (status !== 'completed') {
            onTransitionComplete?.();
          }
        }}
      >
        {/* Glow Effect for Running Status */}
        {status === 'running' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            variants={getAnimationVariants(glowVariants)}
            initial="initial"
            animate="animate"
            custom={config.color}
          />
        )}

        {/* Status Icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${status}-${particleKey}`}
            variants={getStatusAnimation()}
            initial="pending"
            animate={status}
            exit="exit"
          >
            <Icon
              className={cn('transition-colors')}
              size={sizeConfig.icon}
              style={{ color: config.color }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Particle Effects for Completion */}
        <AnimatePresence>
          {showParticles && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 8 }, (_, i) => (
                <motion.div
                  key={`particle-${i}-${particleKey}`}
                  className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-400 rounded-full"
                  variants={getAnimationVariants(particleVariants)}
                  initial="initial"
                  animate="animate"
                  custom={i}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Success Sparkle Effect */}
        {status === 'completed' && (
          <motion.div
            className="absolute -top-1 -right-1"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1, 0], rotate: 360 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles className="w-3 h-3 text-yellow-400" />
          </motion.div>
        )}

        {/* Lightning bolt for fast execution */}
        {status === 'running' && previousStatus === 'pending' && (
          <motion.div
            className="absolute -top-2 -right-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Zap className="w-3 h-3 text-blue-400" />
          </motion.div>
        )}
      </motion.div>

      {/* Status Label */}
      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            className="flex flex-col"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <span
              className={cn(
                'font-medium transition-colors',
                sizeConfig.text
              )}
              style={{ color: config.color }}
            >
              {config.label}
            </span>
            {size === 'lg' && (
              <span className="text-xs text-gray-500 mt-1">
                {config.description}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Status Change Ripple Effect */}
      <AnimatePresence>
        {previousStatus && previousStatus !== status && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 pointer-events-none"
            style={{ borderColor: config.color }}
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Status Badge Component for compact display
export const StatusBadge: React.FC<{
  status: NodeStatus;
  className?: string;
}> = ({ status, className }) => {
  const config = STATUS_CONFIG[status];

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        config.bgColor,
        className
      )}
      style={{ color: config.color }}
      variants={getAnimationVariants(statusTransitionVariants)}
      initial="exit"
      animate="enter"
      custom={status}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <config.icon size={12} />
      <span>{config.label}</span>
    </motion.div>
  );
};

// Status Timeline Component for showing progression
export const StatusTimeline: React.FC<{
  statuses: Array<{ status: NodeStatus; timestamp: Date; duration?: number }>;
  className?: string;
}> = ({ statuses, className }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {statuses.map((item, index) => (
        <React.Fragment key={index}>
          <StatusBadge status={item.status} />
          {index < statuses.length - 1 && (
            <motion.div
              className="w-4 h-0.5 bg-gray-300 rounded"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.2, duration: 0.3 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StatusTransition;