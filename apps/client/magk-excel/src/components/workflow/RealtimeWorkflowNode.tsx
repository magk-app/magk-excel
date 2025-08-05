/**
 * Enhanced Real-time Workflow Node Component
 * Extends BaseWorkflowNode with real-time updates from nodeExecutionStore
 * 
 * Features:
 * - Real-time data subscription and updates
 * - Smooth animations for status changes
 * - Connection status indicators
 * - Retry mechanism for failed nodes
 * - Offline handling and data merging
 * - Live progress updates with enhanced transitions
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  WifiOff, 
  Wifi, 
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';

import { BaseWorkflowNode } from './BaseWorkflowNode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  useNodeExecutionStore,
  useNodeState,
  useConnectionState,
  useNodeSubscription,
  type NodeExecutionState,
  type NodeUpdatePayload
} from '@/stores/nodeExecutionStore';
import { WorkflowNodeData, NodeStatus } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface RealtimeWorkflowNodeProps extends NodeProps {
  data: WorkflowNodeData;
  workflowId: string;
  onRetry?: (nodeId: string) => void;
  enableOfflineMode?: boolean;
  enableConnectionIndicator?: boolean;
  retryButtonPosition?: 'top-right' | 'bottom-right' | 'inline';
}

interface ConnectionIndicatorProps {
  connectionState: string;
  isConnected: boolean;
  reconnectAttempts: number;
}

const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ 
  connectionState, 
  isConnected, 
  reconnectAttempts 
}) => {
  const getIndicatorColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-500';
      case 'connecting': 
      case 'reconnecting': return 'text-yellow-500';
      case 'disconnected': return 'text-gray-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getTooltipContent = () => {
    switch (connectionState) {
      case 'connected': return 'Connected to real-time updates';
      case 'connecting': return 'Connecting to real-time updates...';
      case 'reconnecting': return `Reconnecting... (attempt ${reconnectAttempts})`;
      case 'disconnected': return 'Disconnected from real-time updates';
      case 'error': return 'Connection error - retrying...';
      default: return 'Unknown connection state';
    }
  };

  const IconComponent = isConnected ? Wifi : WifiOff;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            animate={connectionState === 'connecting' || connectionState === 'reconnecting' ? {
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-1.5 right-1.5 z-10"
          >
            <IconComponent className={cn('h-3 w-3', getIndicatorColor())} />
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface RetryButtonProps {
  nodeId: string;
  onRetry?: (nodeId: string) => void;
  isRetrying: boolean;
  position: 'top-right' | 'bottom-right' | 'inline';
  className?: string;
}

const RetryButton: React.FC<RetryButtonProps> = ({ 
  nodeId, 
  onRetry, 
  isRetrying, 
  position,
  className 
}) => {
  const handleRetry = useCallback(() => {
    if (onRetry && !isRetrying) {
      onRetry(nodeId);
    }
  }, [nodeId, onRetry, isRetrying]);

  const positionClasses = {
    'top-right': 'absolute top-1.5 right-8 z-10',
    'bottom-right': 'absolute bottom-1.5 right-1.5 z-10',
    'inline': 'inline-flex'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(positionClasses[position], className)}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying}
              className="h-7 w-7 p-0 bg-background/90 hover:bg-background"
            >
              <motion.div
                animate={isRetrying ? { rotate: 360 } : { rotate: 0 }}
                transition={isRetrying ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
              >
                <RefreshCw className="h-3 w-3" />
              </motion.div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {isRetrying ? 'Retrying...' : 'Retry failed node'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
};

interface OfflineModeIndicatorProps {
  isOffline: boolean;
  queuedUpdates: number;
}

const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({ 
  isOffline, 
  queuedUpdates 
}) => {
  if (!isOffline && queuedUpdates === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-0 left-0 right-0 z-20"
      >
        <Alert variant="default" className="border-orange-200 bg-orange-50/90 backdrop-blur-sm">
          <AlertTriangle className="h-3 w-3 text-orange-600" />
          <AlertDescription className="text-xs text-orange-700">
            {isOffline && (
              <>
                Offline mode - updates will sync when reconnected
                {queuedUpdates > 0 && ` (${queuedUpdates} pending)`}
              </>
            )}
            {!isOffline && queuedUpdates > 0 && (
              <>Syncing {queuedUpdates} offline updates...</>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export const RealtimeWorkflowNode: React.FC<RealtimeWorkflowNodeProps> = ({
  data: propsData,
  workflowId,
  selected,
  onRetry,
  enableOfflineMode = true,
  enableConnectionIndicator = true,
  retryButtonPosition = 'top-right',
  ...nodeProps
}) => {
  const nodeId = propsData.config.id;
  
  // Store subscriptions and state
  const connectionState = useConnectionState();
  const realtimeNodeState = useNodeState(nodeId);
  const store = useNodeExecutionStore();
  
  // Local state for retry handling
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Merge real-time data with props data (real-time takes precedence)
  const mergedData: WorkflowNodeData = useMemo(() => {
    if (!realtimeNodeState) {
      return propsData;
    }

    return {
      ...propsData,
      status: realtimeNodeState.status || propsData.status,
      progress: realtimeNodeState.progress || propsData.progress,
      error: realtimeNodeState.error || propsData.error,
      result: realtimeNodeState.result || propsData.result,
      metadata: realtimeNodeState.metadata ? {
        ...propsData.metadata,
        ...realtimeNodeState.metadata,
        lastExecuted: realtimeNodeState.lastUpdated
      } : propsData.metadata,
      logs: realtimeNodeState.logs || propsData.logs || []
    };
  }, [propsData, realtimeNodeState]);

  // Subscribe to node updates with filtering
  const updateFilter = useCallback((update: NodeUpdatePayload) => {
    // Only process updates for this specific node and workflow
    return update.nodeId === nodeId && update.workflowId === workflowId;
  }, [nodeId, workflowId]);

  const handleNodeUpdate = useCallback((nodeState: NodeExecutionState) => {
    setLastUpdateTime(new Date());
    
    // Reset retry state if node recovers
    if (isRetrying && nodeState.status !== 'error') {
      setIsRetrying(false);
    }
  }, [isRetrying]);

  // Set up subscription for real-time updates
  useNodeSubscription(nodeId, handleNodeUpdate, updateFilter);

  // Handle retry action
  const handleRetry = useCallback(async (retryNodeId: string) => {
    if (retryNodeId !== nodeId || isRetrying) return;
    
    setIsRetrying(true);
    
    try {
      // Call external retry handler if provided
      if (onRetry) {
        await onRetry(retryNodeId);
      }
      
      // Update node status to pending to trigger re-execution
      store.actions.updateNodeStatus(nodeId, workflowId, 'pending');
      
      // Clear any existing error state
      if (mergedData.error) {
        store.actions.updateNodeState({
          nodeId,
          workflowId,
          type: 'error',
          data: { error: undefined },
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error('Retry failed:', error);
      // Keep retry state if retry itself failed
      setIsRetrying(false);
    }
  }, [nodeId, workflowId, isRetrying, onRetry, store.actions, mergedData.error]);

  // Enhanced status with transition detection
  const statusTransition = useMemo(() => {
    const timeSinceUpdate = Date.now() - lastUpdateTime.getTime();
    const isRecentlyUpdated = timeSinceUpdate < 2000; // 2 seconds
    
    return {
      current: mergedData.status,
      isRecent: isRecentlyUpdated,
      hasRealTimeData: !!realtimeNodeState
    };
  }, [mergedData.status, lastUpdateTime, realtimeNodeState]);

  // Offline mode calculations
  const offlineInfo = useMemo(() => {
    const isOffline = !connectionState.isConnected;
    const queuedUpdates = store.offlineQueue.filter(
      update => update.payload.nodeId === nodeId && update.payload.workflowId === workflowId
    ).length;
    
    return { isOffline, queuedUpdates };
  }, [connectionState.isConnected, store.offlineQueue, nodeId, workflowId]);

  // Enhanced node data with real-time indicators
  const enhancedData: WorkflowNodeData = useMemo(() => ({
    ...mergedData,
    metadata: {
      ...mergedData.metadata,
      lastExecuted: realtimeNodeState?.lastUpdated || mergedData.metadata?.lastExecuted,
      // Add real-time specific metadata
      realtimeVersion: realtimeNodeState?.version,
      connectionState: connectionState.connectionState,
      lastSyncTime: lastUpdateTime
    }
  }), [mergedData, realtimeNodeState, connectionState.connectionState, lastUpdateTime]);

  return (
    <div className="relative">
      {/* Offline mode indicator */}
      {enableOfflineMode && (
        <OfflineModeIndicator 
          isOffline={offlineInfo.isOffline} 
          queuedUpdates={offlineInfo.queuedUpdates} 
        />
      )}

      {/* Status transition wrapper with enhanced animations */}
      <motion.div
        layout
        animate={statusTransition.isRecent ? {
          scale: [1, 1.02, 1],
          boxShadow: [
            '0 0 0 rgba(59, 130, 246, 0)',
            '0 0 20px rgba(59, 130, 246, 0.3)',
            '0 0 0 rgba(59, 130, 246, 0)'
          ]
        } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        {/* Real-time data indicator */}
        {statusTransition.hasRealTimeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1.5 left-1.5 z-10"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    animate={{ 
                      scale: statusTransition.isRecent ? [1, 1.3, 1] : 1,
                      opacity: statusTransition.isRecent ? [0.5, 1, 0.8] : 0.8
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Real-time Data Active</div>
                    <div>Version: {realtimeNodeState?.version || 1}</div>
                    <div>Last update: {lastUpdateTime.toLocaleTimeString()}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}

        {/* Connection status indicator */}
        {enableConnectionIndicator && (
          <ConnectionIndicator
            connectionState={connectionState.connectionState}
            isConnected={connectionState.isConnected}
            reconnectAttempts={connectionState.reconnectAttempts}
          />
        )}

        {/* Retry button for failed nodes */}
        {mergedData.status === 'error' && onRetry && retryButtonPosition !== 'inline' && (
          <AnimatePresence>
            <RetryButton
              nodeId={nodeId}
              onRetry={handleRetry}
              isRetrying={isRetrying}
              position={retryButtonPosition}
            />
          </AnimatePresence>
        )}

        {/* Base workflow node with enhanced data */}
        <BaseWorkflowNode
          {...nodeProps}
          data={enhancedData}
          selected={selected}
        />

        {/* Inline retry for error nodes */}
        {mergedData.status === 'error' && onRetry && retryButtonPosition === 'inline' && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-2.5 bg-red-50/90 backdrop-blur-sm rounded-lg border border-red-200"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-700 font-medium">
                  {mergedData.error?.recoverable ? 'Recoverable error' : 'Node failed'}
                </span>
              </div>
              <RetryButton
                nodeId={nodeId}
                onRetry={handleRetry}
                isRetrying={isRetrying}
                position="inline"
                className="flex-shrink-0"
              />
            </motion.div>
          </div>
        )}

        {/* Real-time activity pulse for running nodes */}
        {mergedData.status === 'running' && statusTransition.hasRealTimeData && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(59, 130, 246, 0.7)',
                '0 0 0 8px rgba(59, 130, 246, 0)',
                '0 0 0 0 rgba(59, 130, 246, 0)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Data freshness indicator */}
        {statusTransition.hasRealTimeData && (
          <div className="absolute bottom-1.5 left-1.5 z-10">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1 py-0 h-4 bg-green-100 text-green-700 border-green-300"
                  >
                    LIVE
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Live data from real-time connection
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RealtimeWorkflowNode;