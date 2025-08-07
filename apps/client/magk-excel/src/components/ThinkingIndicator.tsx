import React, { memo, useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ThinkingIndicatorProps {
  isVisible: boolean;
  thoughts?: string[];
  onToggleThoughts?: () => void;
  allowInteraction?: boolean;
}

interface ThinkingStep {
  id: string;
  text: string;
  timestamp: number;
  type: 'analysis' | 'planning' | 'execution' | 'validation';
}

const THINKING_STEPS: ThinkingStep[] = [
  { id: '1', text: 'Analyzing your request...', timestamp: 0, type: 'analysis' },
  { id: '2', text: 'Planning approach and steps...', timestamp: 800, type: 'planning' },
  { id: '3', text: 'Gathering relevant information...', timestamp: 1600, type: 'execution' },
  { id: '4', text: 'Processing and organizing data...', timestamp: 2400, type: 'execution' },
  { id: '5', text: 'Validating results...', timestamp: 3200, type: 'validation' },
  { id: '6', text: 'Preparing response...', timestamp: 4000, type: 'execution' }
];

const ThinkingDot = memo(({ delay = 0 }: { delay?: number }) => (
  <div 
    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
    style={{ animationDelay: `${delay}s` }}
  />
));

const ThinkingStepIndicator = memo(({ step, isActive, isCompleted }: { 
  step: ThinkingStep;
  isActive: boolean;
  isCompleted: boolean;
}) => {
  const getStepIcon = (type: ThinkingStep['type']) => {
    switch (type) {
      case 'analysis':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'planning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'execution':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'validation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-300 ${
      isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : 
      isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 
      'bg-gray-50 dark:bg-gray-800/50'
    }`}>
      <div className={`flex-shrink-0 transition-colors duration-300 ${
        isActive ? 'text-blue-600 dark:text-blue-400' : 
        isCompleted ? 'text-green-600 dark:text-green-400' : 
        'text-gray-400 dark:text-gray-600'
      }`}>
        {getStepIcon(step.type)}
      </div>
      
      <div className="flex-1">
        <p className={`text-sm transition-colors duration-300 ${
          isActive ? 'text-blue-900 dark:text-blue-100 font-medium' : 
          isCompleted ? 'text-green-900 dark:text-green-100' : 
          'text-gray-600 dark:text-gray-400'
        }`}>
          {step.text}
        </p>
      </div>

      {isActive && (
        <div className="flex space-x-1">
          <ThinkingDot delay={0} />
          <ThinkingDot delay={0.1} />
          <ThinkingDot delay={0.2} />
        </div>
      )}

      {isCompleted && (
        <div className="text-green-600 dark:text-green-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
});

const InteractiveThoughts = memo(({ thoughts, onToggleThoughts }: { 
  thoughts: string[];
  onToggleThoughts: () => void;
}) => {
  const [expandedThought, setExpandedThought] = useState<number | null>(null);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Internal Reasoning:</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleThoughts}
          className="text-xs"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Hide
        </Button>
      </div>
      
      <div className="max-h-32 overflow-y-auto space-y-2">
        {thoughts.map((thought, index) => (
          <div key={index} className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-800 rounded">
            <button
              onClick={() => setExpandedThought(expandedThought === index ? null : index)}
              className="text-left w-full hover:text-gray-800 dark:hover:text-gray-200"
            >
              {expandedThought === index ? thought : `${thought.slice(0, 60)}${thought.length > 60 ? '...' : ''}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

const ThinkingIndicator = memo(({ 
  isVisible, 
  thoughts = [], 
  onToggleThoughts,
  allowInteraction = false 
}: ThinkingIndicatorProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showThoughts, setShowThoughts] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0);
      setShowThoughts(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextStepIndex = THINKING_STEPS.findIndex(step => step.timestamp > elapsed);
      
      if (nextStepIndex === -1) {
        setCurrentStepIndex(THINKING_STEPS.length);
      } else {
        setCurrentStepIndex(nextStepIndex);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, startTime]);

  if (!isVisible) return null;

  const handleToggleThoughts = () => {
    setShowThoughts(!showThoughts);
    onToggleThoughts?.();
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-700 rounded-xl my-2 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <ThinkingDot delay={0} />
            <ThinkingDot delay={0.1} />
            <ThinkingDot delay={0.2} />
          </div>
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            AI is thinking...
          </span>
        </div>

        {allowInteraction && (
          <div className="flex items-center space-x-2">
            {thoughts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleThoughts}
                className="text-xs text-blue-700 dark:text-blue-300"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {showThoughts ? 'Hide' : 'Show'} Thoughts
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {THINKING_STEPS.map((step, index) => (
          <ThinkingStepIndicator
            key={step.id}
            step={step}
            isActive={index === currentStepIndex}
            isCompleted={index < currentStepIndex}
          />
        ))}
      </div>

      {showThoughts && thoughts.length > 0 && (
        <InteractiveThoughts 
          thoughts={thoughts}
          onToggleThoughts={handleToggleThoughts}
        />
      )}
    </Card>
  );
});

ThinkingIndicator.displayName = 'ThinkingIndicator';

export { ThinkingIndicator };