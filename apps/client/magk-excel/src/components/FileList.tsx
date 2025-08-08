/**
 * Interactive File List Component
 * Issue #5: Make files clickable and interactive
 */

import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Download, Eye, Trash2, Pin, Clock } from 'lucide-react';
import { FileVisibilityService, VisibleFile } from '../services/fileVisibilityService';
import { useFilePersistenceStore } from '../stores/filePersistenceStore';

interface FileListProps {
  files: VisibleFile[];
  sessionId: string;
  onFileClick?: (file: VisibleFile) => void;
  onFileRemove?: (fileId: string) => void;
  onFilePersist?: (fileId: string) => void;
  className?: string;
}

export function FileList({
  files,
  sessionId,
  onFileClick,
  onFileRemove,
  onFilePersist,
  className = ''
}: FileListProps) {
  const { toggleFilePersistence, removeFile } = useFilePersistenceStore();

  const handleDownload = async (file: VisibleFile) => {
    try {
      await FileVisibilityService.downloadFile(file);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const handleView = (file: VisibleFile) => {
    if (onFileClick) {
      onFileClick(file);
    } else {
      // Default view behavior - could open in a modal or new tab
      console.log('Viewing file:', file.name);
    }
  };

  const handleRemove = (file: VisibleFile) => {
    if (file.source === 'upload' && onFileRemove) {
      onFileRemove(file.id);
    } else if (file.source !== 'upload') {
      removeFile(file.id);
    }
  };

  const handleTogglePersistence = (file: VisibleFile) => {
    if (file.source !== 'upload') {
      toggleFilePersistence(file.id);
    } else if (onFilePersist) {
      onFilePersist(file.id);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSourceBadge = (source: VisibleFile['source']) => {
    switch (source) {
      case 'upload':
        return <Badge variant="secondary" className="text-xs">Uploaded</Badge>;
      case 'persistent':
        return <Badge variant="default" className="text-xs">Persistent</Badge>;
      case 'temporary':
        return <Badge variant="outline" className="text-xs">Session</Badge>;
    }
  };

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        No files available
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map(file => (
        <Card
          key={file.id}
          className="p-3 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleView(file)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl">
                {FileVisibilityService.getFileIcon(file.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate" title={file.name}>
                    {file.name}
                  </h4>
                  {getSourceBadge(file.source)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleView(file)}
                title="View file"
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownload(file)}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {file.source !== 'persistent' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTogglePersistence(file)}
                  title="Make persistent"
                >
                  <Pin className="h-4 w-4" />
                </Button>
              )}
              
              {file.source === 'persistent' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTogglePersistence(file)}
                  title="Make temporary"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(file)}
                className="text-destructive hover:text-destructive"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default FileList;