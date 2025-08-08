/**
 * Persistence Status Indicator - Shows storage system status
 * 
 * A small indicator component that displays the current state of the
 * persistence system including storage usage, active operations, and health.
 */

import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { Progress } from './ui/progress';
import { 
  HardDrive, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  Clock,
  Database
} from 'lucide-react';
import { 
  unifiedPersistenceService, 
  storageIntegrationService,
  type FileMetrics,
  type IntegrationPoint 
} from '../services/persistence/UnifiedPersistenceService';

export const PersistenceStatusIndicator: React.FC = () => {
  const [metrics, setMetrics] = useState<FileMetrics | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Update metrics every 5 seconds
  useEffect(() => {
    const updateMetrics = () => {
      try {
        const currentMetrics = unifiedPersistenceService.getStorageMetrics();
        setMetrics(currentMetrics);
        
        const status = storageIntegrationService.getIntegrationStatus();
        setIntegrationStatus(status);
      } catch (error) {
        console.warn('Failed to get persistence metrics:', error);
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStorageUsagePercent = (): number => {
    if (!metrics) return 0;
    const maxStorage = 500 * 1024 * 1024; // 500MB default max
    return Math.min((metrics.totalSize / maxStorage) * 100, 100);
  };

  const getHealthStatus = (): 'healthy' | 'warning' | 'error' => {
    if (!integrationStatus) return 'warning';
    
    const activePoints = integrationStatus.integrationPoints.filter((p: IntegrationPoint) => p.active);
    const healthyPoints = activePoints.filter((p: IntegrationPoint) => 
      p.metrics.successRate > 0.8 || p.metrics.operationsCount === 0
    );
    
    if (healthyPoints.length === activePoints.length) return 'healthy';
    if (healthyPoints.length > activePoints.length * 0.5) return 'warning';
    return 'error';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const healthStatus = getHealthStatus();
  const storagePercent = getStorageUsagePercent();
  
  const getStatusIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-600" />;
      default:
        return <HardDrive className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 gap-1 text-xs"
        >
          {getStatusIcon()}
          <span>{metrics?.totalFiles || 0} files</span>
          <span>({formatFileSize(metrics?.totalSize || 0)})</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Storage System
            </h4>
            <Badge variant={getStatusColor() as any}>
              {healthStatus}
            </Badge>
          </div>

          {/* Storage Overview */}
          {metrics && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Usage</span>
                  <span>{formatFileSize(metrics.totalSize)} / 500MB</span>
                </div>
                <Progress value={storagePercent} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">{metrics.totalFiles}</div>
                  <div className="text-muted-foreground">Total Files</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">{metrics.versionsCount}</div>
                  <div className="text-muted-foreground">Versions</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium">By Storage Layer:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Temporary:</span>
                    <span>{metrics.byLayer.temporary?.count || 0} files 
                          ({formatFileSize(metrics.byLayer.temporary?.size || 0)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Persistent:</span>
                    <span>{metrics.byLayer.persistent?.count || 0} files 
                          ({formatFileSize(metrics.byLayer.persistent?.size || 0)})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integration Status */}
          {integrationStatus && (
            <div className="space-y-2 border-t pt-3">
              <div className="text-xs font-medium flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Integration Points
              </div>
              
              <div className="space-y-1">
                {integrationStatus.integrationPoints.map((point: IntegrationPoint) => (
                  <div key={point.name} className="flex justify-between items-center text-xs">
                    <span className="truncate">{point.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {point.metrics.operationsCount} ops
                      </span>
                      {point.active ? (
                        <CheckCircle className="w-2 h-2 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-2 h-2 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Success Rate: {(integrationStatus.successRate * 100).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PersistenceStatusIndicator;