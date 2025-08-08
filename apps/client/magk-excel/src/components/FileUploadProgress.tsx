/**
 * File Upload Progress Component
 * Shows progress indicators for Claude API file uploads
 */

import React from 'react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  uploadMethod?: 'base64' | 'files-api';
}

interface FileUploadProgressProps {
  uploads: FileUploadProgress[];
  onCancel?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onClear?: (fileId: string) => void;
}

export function FileUploadProgressComponent({
  uploads,
  onCancel,
  onRetry,
  onClear
}: FileUploadProgressProps) {
  if (uploads.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i))} ${sizes[i]}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-4 h-4 animate-pulse text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {uploads.map((upload) => (
        <div
          key={upload.fileId}
          className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
        >
          <div className="flex-shrink-0">
            {getStatusIcon(upload.status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {upload.fileName}
              </p>
              
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className="text-xs"
                >
                  {upload.uploadMethod === 'base64' ? 'Base64' : 'Files API'}
                </Badge>
                
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(upload.fileSize)}
                </span>
                
                {upload.status === 'uploading' && onCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(upload.fileId)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
                
                {upload.status === 'error' && onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRetry(upload.fileId)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                )}
                
                {(upload.status === 'completed' || upload.status === 'error') && onClear && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onClear(upload.fileId)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {upload.status === 'uploading' && (
              <div className="space-y-1">
                <Progress 
                  value={upload.progress} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {upload.progress}% uploaded
                </p>
              </div>
            )}
            
            {upload.status === 'completed' && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Upload completed successfully
              </p>
            )}
            
            {upload.status === 'error' && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {upload.error || 'Upload failed'}
              </p>
            )}
          </div>
        </div>
      ))}
      
      {uploads.some(u => u.status === 'completed') && (
        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              uploads
                .filter(u => u.status === 'completed')
                .forEach(u => onClear?.(u.fileId));
            }}
            className="text-xs"
          >
            Clear completed
          </Button>
        </div>
      )}
    </div>
  );
}