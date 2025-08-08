import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File, 
  FolderOpen, 
  ExternalLink, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  History
} from 'lucide-react';
import { downloadService, DownloadHistoryItem } from '../services/downloadService';

interface DownloadHistoryPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DownloadHistoryPanel({ isOpen = true, onClose }: DownloadHistoryPanelProps) {
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);
  const [environmentInfo, setEnvironmentInfo] = useState(downloadService.getEnvironmentInfo());

  useEffect(() => {
    if (isOpen) {
      loadDownloadHistory();
      setEnvironmentInfo(downloadService.getEnvironmentInfo());
    }
  }, [isOpen]);

  const loadDownloadHistory = () => {
    const history = downloadService.getDownloadHistory();
    setDownloadHistory(history);
  };

  const handleClearHistory = () => {
    downloadService.clearDownloadHistory();
    setDownloadHistory([]);
  };

  const handleOpenFile = async (item: DownloadHistoryItem) => {
    if (item.filePath && environmentInfo.supportsFileOperations) {
      try {
        const result = await downloadService.openFile(item.filePath);
        if (!result.success) {
          console.error('Failed to open file:', result.error);
        }
      } catch (error) {
        console.error('Error opening file:', error);
      }
    }
  };

  const handleShowInFolder = async (item: DownloadHistoryItem) => {
    if (item.filePath && environmentInfo.supportsFileOperations) {
      try {
        const result = await downloadService.showInFolder(item.filePath);
        if (!result.success) {
          console.error('Failed to show in folder:', result.error);
        }
      } catch (error) {
        console.error('Error showing in folder:', error);
      }
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - timestamp) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'pdf':
        return <File className="h-4 w-4 text-red-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Download History</CardTitle>
              <CardDescription>
                Track your downloads across {environmentInfo.isElectron ? 'Electron' : 'Browser'} environment
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {downloadHistory.length} downloads
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Badge variant={environmentInfo.isElectron ? 'default' : 'secondary'}>
              {environmentInfo.isElectron ? 'Electron Mode' : 'Browser Mode'}
            </Badge>
            {environmentInfo.supportsFileOperations && (
              <Badge variant="outline">File Operations Enabled</Badge>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearHistory}
            disabled={downloadHistory.length === 0}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Clear History
          </Button>
        </div>

        <ScrollArea className="h-96">
          {downloadHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No downloads yet</p>
              <p className="text-xs">Your download history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downloadHistory.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="relative">
                    {getFileIcon(item.fileName)}
                    {item.success ? (
                      <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{item.fileName}</p>
                      <Badge variant={item.success ? 'default' : 'destructive'} className="text-xs">
                        {item.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(item.timestamp)}</span>
                      {item.size && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span>{formatFileSize(item.size)}</span>
                        </>
                      )}
                    </div>
                    
                    {item.filePath && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {item.filePath}
                      </p>
                    )}
                    
                    {!item.success && item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                  
                  {item.success && item.filePath && environmentInfo.supportsFileOperations && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenFile(item)}
                        className="h-7 w-7 p-0"
                        title="Open file"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowInFolder(item)}
                        className="h-7 w-7 p-0"
                        title="Show in folder"
                      >
                        <FolderOpen className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {item.success && !environmentInfo.supportsFileOperations && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      In Downloads
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p>Environment: {environmentInfo.isElectron ? 'Electron Desktop App' : 'Web Browser'}</p>
            <p>
              Capabilities: 
              {environmentInfo.supportsFilePathDownloads && ' File Path Downloads'}
              {environmentInfo.supportsContentDownloads && ' Content Downloads'}
              {environmentInfo.supportsFileOperations && ' File Operations'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}