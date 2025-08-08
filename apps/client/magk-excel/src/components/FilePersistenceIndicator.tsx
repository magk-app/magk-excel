import React, { memo } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { Pin, Clock, FileIcon } from 'lucide-react';
import { useFilePersistenceStore } from '../stores/filePersistenceStore';

interface FilePersistenceIndicatorProps {
  sessionId: string;
  onManageFiles?: () => void;
}

export const FilePersistenceIndicator = memo(function FilePersistenceIndicator({
  sessionId,
  onManageFiles
}: FilePersistenceIndicatorProps) {
  const { getFileStats, getSessionFiles } = useFilePersistenceStore();
  
  const stats = getFileStats();
  const sessionFiles = getSessionFiles(sessionId);
  const persistentFiles = sessionFiles.filter(f => f.isPersistent);
  const temporaryFiles = sessionFiles.filter(f => !f.isPersistent);
  
  if (stats.persistent === 0 && stats.temporary === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2">
      {stats.persistent > 0 && (
        <Tooltip content={`${stats.persistent} persistent file(s) available across all sessions`}>
          <Badge variant="default" className="text-xs cursor-help">
            <Pin className="w-3 h-3 mr-1" />
            {stats.persistent}
          </Badge>
        </Tooltip>
      )}
      
      {temporaryFiles.length > 0 && (
        <Tooltip content={`${temporaryFiles.length} temporary file(s) in this session`}>
          <Badge variant="secondary" className="text-xs cursor-help">
            <Clock className="w-3 h-3 mr-1" />
            {temporaryFiles.length}
          </Badge>
        </Tooltip>
      )}
      
      {onManageFiles && (
        <Tooltip content="Manage files">
          <Button
            size="sm"
            variant="ghost"
            onClick={onManageFiles}
            className="h-7 w-7 p-0"
          >
            <FileIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
});