/**
 * Progress Manager Component - Displays and manages all active progress operations
 * Provides a centralized view of long-running operations across the application
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2, AlertCircle, CheckCircle2, Clock, Zap, Cancel } from 'lucide-react';
import { useProgress, ProgressOperation, ProgressStatus } from '../../contexts/ProgressContext';
import { 
  Progress, 
  CircularProgress, 
  ProgressWithLabels, 
  IndeterminateProgress 
} from '../ui/progress';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';

interface ProgressManagerProps {
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  variant?: 'floating' | 'inline' | 'modal';
  showCompleted?: boolean;
  maxHeight?: number;
}

export const ProgressManager: React.FC<ProgressManagerProps> = ({
  isVisible = true,
  onClose,
  className,
  position = 'bottom-right',
  variant = 'floating',
  showCompleted = true,
  maxHeight = 400,
}) => {
  const { 
    state, 
    cancelOperation, 
    removeOperation, 
    clearCompleted, 
    getActiveOperations,
    getCompletedOperations,
    getErrorOperations 
  } = useProgress();

  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'errors'>('active');

  const activeOperations = getActiveOperations();
  const completedOperations = getCompletedOperations();
  const errorOperations = getErrorOperations();

  // Don't render if no operations and not explicitly visible
  if (!isVisible && state.operations.size === 0) {
    return null;
  }

  const getStatusIcon = (status: ProgressStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'error':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProgressStatus) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'error':
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDuration = (operation: ProgressOperation) => {
    const start = operation.startTime.getTime();
    const end = operation.endTime?.getTime() || Date.now();
    const duration = Math.round((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  const renderOperationCard = (operation: ProgressOperation) => (
    <motion.div
      key={operation.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border rounded-lg p-3 bg-card shadow-sm"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon(operation.status)}
          <div>
            <div className="font-medium text-sm">{operation.title}</div>
            {operation.description && (
              <div className="text-xs text-muted-foreground mt-1">
                {operation.description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {operation.type.replace('_', ' ')}
          </Badge>
          {operation.cancellable && (operation.status === 'running' || operation.status === 'pending') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelOperation(operation.id)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          {(operation.status === 'completed' || operation.status === 'error' || operation.status === 'cancelled') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeOperation(operation.id)}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress display */}
      {operation.status === 'running' || operation.status === 'pending' ? (
        operation.progress > 0 ? (
          <ProgressWithLabels
            value={operation.progress}
            variant={getStatusColor(operation.status)}
            size="sm"
            showValue={true}
            showETA={!!operation.eta}
            eta={operation.eta}
            speed={operation.speed}
            processed={operation.processed}
          />
        ) : (
          <IndeterminateProgress
            variant="dots"
            size="sm"
            color={getStatusColor(operation.status)}
          />
        )
      ) : (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {operation.status === 'completed' && '✓ Completed'}
            {operation.status === 'error' && '✗ Failed'}
            {operation.status === 'cancelled' && '⊘ Cancelled'}
          </span>
          <span>{formatDuration(operation)}</span>
        </div>
      )}

      {/* Error message */}
      {operation.error && (
        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
          {operation.error}
        </div>
      )}
    </motion.div>
  );

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  };

  if (variant === 'floating') {
    return (
      <AnimatePresence>
        {(isVisible && state.operations.size > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'fixed z-50 w-96',
              positionClasses[position],
              className
            )}
          >
            <Card className="shadow-lg border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>Progress</span>
                    {state.activeCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {state.activeCount} active
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-8 w-8 p-0"
                    >
                      {isMinimized ? (
                        <Maximize2 className="w-4 h-4" />
                      ) : (
                        <Minimize2 className="w-4 h-4" />
                      )}
                    </Button>
                    {onClose && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {!isMinimized && (
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="active" className="text-xs">
                        Active ({activeOperations.length})
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs">
                        Done ({completedOperations.length})
                      </TabsTrigger>
                      <TabsTrigger value="errors" className="text-xs">
                        Errors ({errorOperations.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-4">
                      <ScrollArea style={{ maxHeight }} className="w-full">
                        <TabsContent value="active" className="space-y-3 mt-0">
                          <AnimatePresence>
                            {activeOperations.map(renderOperationCard)}
                          </AnimatePresence>
                          {activeOperations.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              No active operations
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="completed" className="space-y-3 mt-0">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-muted-foreground">
                              {completedOperations.length} completed
                            </span>
                            {completedOperations.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={clearCompleted}
                                className="h-7 text-xs"
                              >
                                Clear All
                              </Button>
                            )}
                          </div>
                          <AnimatePresence>
                            {completedOperations.map(renderOperationCard)}
                          </AnimatePresence>
                          {completedOperations.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              No completed operations
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="errors" className="space-y-3 mt-0">
                          <AnimatePresence>
                            {errorOperations.map(renderOperationCard)}
                          </AnimatePresence>
                          {errorOperations.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              No errors
                            </div>
                          )}
                        </TabsContent>
                      </ScrollArea>
                    </div>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Inline variant
  return (
    <div className={cn('w-full', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Operations</span>
            {state.activeCount > 0 && (
              <Badge variant="secondary">
                {state.activeCount} active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                Active ({activeOperations.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOperations.length})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Errors ({errorOperations.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <ScrollArea style={{ maxHeight }} className="w-full">
                <TabsContent value="active" className="space-y-3">
                  <AnimatePresence>
                    {activeOperations.map(renderOperationCard)}
                  </AnimatePresence>
                  {activeOperations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No active operations
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-muted-foreground">
                      {completedOperations.length} completed
                    </span>
                    {completedOperations.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCompleted}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <AnimatePresence>
                    {completedOperations.map(renderOperationCard)}
                  </AnimatePresence>
                  {completedOperations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No completed operations
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="errors" className="space-y-3">
                  <AnimatePresence>
                    {errorOperations.map(renderOperationCard)}
                  </AnimatePresence>
                  {errorOperations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No errors
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressManager;