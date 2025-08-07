import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { 
  FileIcon, 
  Trash2, 
  Pin, 
  Clock, 
  HardDrive,
  Download,
  Upload,
  Info
} from 'lucide-react';
import { useFilePersistenceStore, PersistedFile } from '../stores/filePersistenceStore';
import { formatDistanceToNow } from 'date-fns';

interface FilePersistenceToggleProps {
  sessionId: string;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  if (type.includes('image')) return '🖼️';
  if (type.includes('text')) return '📝';
  return '📎';
};

const FileItem = memo(({ 
  file, 
  onToggle, 
  onRemove 
}: { 
  file: PersistedFile; 
  onToggle: () => void; 
  onRemove: () => void;
}) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl">{getFileIcon(file.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{file.name}</p>
            {file.isPersistent ? (
              <Badge variant="default" className="text-xs">
                <Pin className="w-3 h-3 mr-1" />
                Persistent
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Temporary
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</span>
            {file.tags && file.tags.length > 0 && (
              <>
                <span>•</span>
                <span>{file.tags.join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Tooltip content={file.isPersistent ? 'Make temporary' : 'Make persistent'}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {file.isPersistent ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
        
        <Tooltip content="Remove file">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});

export const FilePersistenceToggle = memo(function FilePersistenceToggle({
  sessionId,
  className
}: FilePersistenceToggleProps) {
  const {
    getSessionFiles,
    getAllPersistentFiles,
    toggleFilePersistence,
    removeFile,
    clearTemporaryFiles,
    getFileStats,
    syncWithSupabase
  } = useFilePersistenceStore();

  const sessionFiles = getSessionFiles(sessionId);
  const persistentFiles = getAllPersistentFiles();
  const stats = getFileStats();

  const temporaryFiles = sessionFiles.filter(f => !f.isPersistent);
  const hasPersistentFiles = persistentFiles.length > 0;
  const hasTemporaryFiles = temporaryFiles.length > 0;

  const handleTogglePersistence = (fileId: string) => {
    toggleFilePersistence(fileId);
  };

  const handleRemoveFile = (fileId: string) => {
    if (confirm('Are you sure you want to remove this file?')) {
      removeFile(fileId);
    }
  };

  const handleClearTemporary = () => {
    if (confirm('Clear all temporary files for this session?')) {
      clearTemporaryFiles(sessionId);
    }
  };

  const handleSyncSupabase = async () => {
    await syncWithSupabase();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            File Persistence
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.temporary} temp
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.persistent} persistent
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatFileSize(stats.totalSize)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">File Persistence System</p>
            <p className="text-xs mt-1 text-blue-700 dark:text-blue-200">
              Toggle files between temporary (session-only) and persistent (conversation-wide) storage.
              Persistent files remain available across all chat sessions.
            </p>
          </div>
        </div>

        {/* Persistent Files Section */}
        {hasPersistentFiles && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Persistent Files ({persistentFiles.length})
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSyncSupabase}
                className="text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                Sync
              </Button>
            </div>
            <div className="space-y-2">
              {persistentFiles.map(file => (
                <FileItem
                  key={file.id}
                  file={file}
                  onToggle={() => handleTogglePersistence(file.id)}
                  onRemove={() => handleRemoveFile(file.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Temporary Files Section */}
        {hasTemporaryFiles && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Temporary Files ({temporaryFiles.length})
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearTemporary}
                className="text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <div className="space-y-2">
              {temporaryFiles.map(file => (
                <FileItem
                  key={file.id}
                  file={file}
                  onToggle={() => handleTogglePersistence(file.id)}
                  onRemove={() => handleRemoveFile(file.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasPersistentFiles && !hasTemporaryFiles && (
          <div className="text-center py-8 text-muted-foreground">
            <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No files uploaded yet</p>
            <p className="text-xs mt-1">Upload files to the chat to manage persistence</p>
          </div>
        )}

        {/* Storage Info */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Storage used: {formatFileSize(stats.totalSize)}</span>
            <span>Max file size: 10 MB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});