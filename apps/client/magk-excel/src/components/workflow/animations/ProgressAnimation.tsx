/**
 * ProgressAnimation Component
 * Advanced progress indicator with smooth animations, wave effects, and particle animations
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { NodeProgress } from '../../../types/workflow';
import {
  progressBarVariants,
  counterVariants,
  particleVariants,
  getAnimationVariants,
  SPRING_CONFIG,
  SMOOTH_SPRING,
  STATUS_COLORS,
} from './nodeAnimations';
import { cn } from '../../../lib/utils';

interface ProgressAnimationProps {
  progress: NodeProgress;
  variant?: 'default' | 'minimal' | 'detailed' | 'circular' | 'node-compact';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showEta?: boolean;
  showThroughput?: boolean;
  animated?: boolean;
  className?: string;
  onComplete?: () => void;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

// Animated number component with smooth transitions
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.5,
  decimals = 0,
  suffix = '',
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const difference = endValue - startValue;

    let startTime: number;
    const updateValue = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + difference * easeOutQuart;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, duration, displayValue]);

  return (
    <motion.span
      className={className}
      variants={getAnimationVariants(counterVariants)}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {displayValue.toFixed(decimals)}{suffix}
    </motion.span>
  );
};

// Wave effect component
const WaveEffect: React.FC<{ 
  color: string; 
  height: string; 
  speed?: number; 
}> = ({ color, height, speed = 2 }) => {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          height,
        }}
        variants={{
          animate: {
            x: ['-100%', '200%'],
            transition: {
              duration: speed,
              repeat: Infinity,
              ease: 'linear',
            },
          },
        }}
        initial={{ x: '-100%' }}
        animate="animate"
      />
    </motion.div>
  );
};

// Circular progress component
const CircularProgress: React.FC<{
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
  showValue?: boolean;
}> = ({ percentage, size, strokeWidth, color, showValue = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(229 231 235)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={SMOOTH_SPRING}
          strokeLinecap="round"
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedNumber
            value={percentage}
            suffix="%"
            className="text-sm font-semibold"
          />
        </div>
      )}
    </div>
  );
};

// Main progress animation component
export const ProgressAnimation: React.FC<ProgressAnimationProps> = ({
  progress,
  variant = 'default',
  size = 'md',
  showPercentage = true,
  showEta = true,
  showThroughput = false,
  animated = true,
  className,
  onComplete,
}) => {
  const [isComplete, setIsComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const percentage = progress.percentage ?? 
    (progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0);

  const sizeConfig = {
    sm: { height: 'h-2', text: 'text-xs', circular: 40 },
    md: { height: 'h-3', text: 'text-sm', circular: 60 },
    lg: { height: 'h-4', text: 'text-base', circular: 80 },
  };

  const config = sizeConfig[size];

  // Format time remaining
  const formatEta = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return 'Calculating...';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  // Format throughput
  const formatThroughput = (rate?: number): string => {
    if (!rate) return '0/s';
    if (rate >= 1000) return `${(rate / 1000).toFixed(1)}k/s`;
    return `${rate.toFixed(1)}/s`;
  };

  // Check for completion
  useEffect(() => {
    if (percentage >= 100 && !isComplete) {
      setIsComplete(true);
      setShowCelebration(true);
      onComplete?.();
      
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [percentage, isComplete, onComplete]);

  // Determine progress color based on percentage
  const getProgressColor = () => {
    if (percentage >= 100) return STATUS_COLORS.completed;
    if (percentage >= 75) return STATUS_COLORS.running;
    if (percentage >= 50) return STATUS_COLORS.paused;
    return STATUS_COLORS.error;
  };

  const progressColor = getProgressColor();

  if (variant === 'circular') {
    return (
      <div className={cn('relative', className)}>
        <CircularProgress
          percentage={percentage}
          size={config.circular}
          strokeWidth={size === 'sm' ? 3 : size === 'md' ? 4 : 5}
          color={progressColor}
        />
        
        {/* Celebration particles */}
        <AnimatePresence>
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 12 }, (_, i) => (
                <motion.div
                  key={i}
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
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('flex-1 bg-gray-200 rounded-full overflow-hidden', config.height)}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: progressColor }}
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={SMOOTH_SPRING}
          />
        </div>
        {showPercentage && (
          <AnimatedNumber
            value={percentage}
            suffix="%"
            className={cn('font-medium text-gray-700', config.text)}
          />
        )}
      </div>
    );
  }

  if (variant === 'node-compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Progress stages completely removed for clean display */}

        {/* Compact progress bar with message */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-700 font-medium truncate">
              {progress.message || 'Processing...'}
            </span>
            <span className="text-gray-500 font-mono ml-2">
              {percentage}%
            </span>
          </div>
          
          {/* Progress bar removed from node-compact variant - prevents duplicates */}
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>
              {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
            </span>
            {showEta && progress.estimatedTimeRemaining && (
              <span className="whitespace-nowrap">
                ETA: {formatEta(progress.estimatedTimeRemaining)}
              </span>
            )}
          </div>

          {/* Compact stats (moved up to avoid duplication) */}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn('w-full space-y-2', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_CONFIG}
    >
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {progress.message && (
            <span className={cn('text-gray-700 font-medium', config.text)}>
              {progress.message}
            </span>
          )}
          {percentage >= 100 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, ...SPRING_CONFIG }}
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </motion.div>
          )}
        </div>
        
        {showPercentage && (
          <div className="flex items-center gap-1">
            <AnimatedNumber
              value={percentage}
              suffix="%"
              className={cn('font-bold', config.text)}
            />
            {percentage < 100 && percentage > 0 && (
              <TrendingUp className="w-3 h-3 text-blue-500" />
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', config.height)}>
          <motion.div
            className="h-full relative rounded-full"
            style={{ backgroundColor: progressColor, width: `${percentage}%` }}
            variants={getAnimationVariants(progressBarVariants)}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Wave effect for active progress */}
            {animated && percentage > 0 && percentage < 100 && (
              <WaveEffect color={progressColor} height="100%" />
            )}
          </motion.div>
        </div>
        
        {/* Celebration particles */}
        <AnimatePresence>
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 8 }, (_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 w-1 h-1 bg-green-400 rounded-full"
                  style={{ left: `${Math.random() * 100}%` }}
                  variants={getAnimationVariants(particleVariants)}
                  initial="initial"
                  animate="animate"
                  custom={i}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Details */}
      {variant === 'detailed' && (
        <motion.div
          className="flex items-center justify-between text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4">
            <span>
              {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
            </span>
            
            {showThroughput && progress.throughputRate && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{formatThroughput(progress.throughputRate)}</span>
              </div>
            )}
          </div>
          
          {showEta && progress.estimatedTimeRemaining && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatEta(progress.estimatedTimeRemaining)}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Stage Progress */}
      {progress.stages && progress.stages.length > 0 && (
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.4 }}
        >
          {progress.stages.map((stage) => (
            <div key={stage.name} className="flex items-center gap-2 text-xs">
              <div className={cn(
                'w-2 h-2 rounded-full',
                stage.status === 'completed' ? 'bg-green-500' :
                stage.status === 'running' ? 'bg-blue-500' :
                stage.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
              )} />
              <span className="text-gray-600">{stage.name}</span>
              {stage.progress !== undefined && (
                <span className="text-gray-500">({stage.progress}%)</span>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

// Compact progress indicator
export const ProgressDot: React.FC<{
  percentage: number;
  size?: number;
  className?: string;
}> = ({ percentage, size = 20, className }) => {
  const getColor = () => {
    if (percentage >= 100) return STATUS_COLORS.completed;
    if (percentage >= 75) return STATUS_COLORS.running;
    if (percentage >= 50) return STATUS_COLORS.paused;
    return STATUS_COLORS.error;
  };

  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="transparent"
          stroke="rgb(229 231 235)"
          strokeWidth="2"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="transparent"
          stroke={getColor()}
          strokeWidth="2"
          strokeDasharray={`${(size / 2 - 2) * 2 * Math.PI}`}
          initial={{ strokeDashoffset: (size / 2 - 2) * 2 * Math.PI }}
          animate={{ 
            strokeDashoffset: (size / 2 - 2) * 2 * Math.PI * (1 - percentage / 100) 
          }}
          transition={SMOOTH_SPRING}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </div>
  );
};

export default ProgressAnimation;