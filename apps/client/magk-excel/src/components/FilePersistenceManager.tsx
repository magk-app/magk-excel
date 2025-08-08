import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { useFilePersistenceStore, PersistedFile } from '../stores/filePersistenceStore';
import { FileIcon, Pin, Clock, Trash2, Download, Upload, X } from 'lucide-react';

interface FilePersistenceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  currentAttachments?: Array<{ id: string; file: File; name: string; size: number; type: string }>;
}

export function FilePersistenceManager({ 
  isOpen, 
  onClose, 
  sessionId,
  currentAttachments = []
}: FilePersistenceManagerProps) {
  const {
    getSessionFiles,
    getAllPersistentFiles,
    toggleFilePersistence,
    removeFile,
    clearTemporaryFiles,
    clearAllFiles,
    addFile,
    getFileStats,
    syncWithSupabase
  } = useFilePersistenceStore();

  const [sessionFiles, setSessionFiles] = useState<PersistedFile[]>([]);
  const [persistentFiles, setPersistentFiles] = useState<PersistedFile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load files when dialog opens or session changes
  useEffect(() => {
    if (isOpen) {
      setSessionFiles(getSessionFiles(sessionId));
      setPersistentFiles(getAllPersistentFiles());
    }
  }, [isOpen, sessionId, getSessionFiles, getAllPersistentFiles]);

  const stats = getFileStats();

  const handleTogglePersistence = (fileId: string) => {
    toggleFilePersistence(fileId);
    // Refresh file lists
    setSessionFiles(getSessionFiles(sessionId));
    setPersistentFiles(getAllPersistentFiles());
  };

  const handleRemoveFile = (fileId: string) => {
    removeFile(fileId);
    // Refresh file lists
    setSessionFiles(getSessionFiles(sessionId));
    setPersistentFiles(getAllPersistentFiles());
  };

  const handleClearTemporary = () => {
    clearTemporaryFiles(sessionId);
    setSessionFiles(getSessionFiles(sessionId));
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAllFiles();
      setSessionFiles([]);
      setPersistentFiles([]);
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithSupabase();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddCurrentAttachments = async () => {
    for (const attachment of currentAttachments) {
      try {
        // Check file size for persistence (2.5MB limit)
        const maxPersistentSize = 2.5 * 1024 * 1024;
        if (attachment.file.size > maxPersistentSize) {
          alert(`File "${attachment.name}" exceeds 2.5MB limit for persistent storage`);
          continue;
        }
        await addFile(attachment.file, false, sessionId);
      } catch (error) {
        console.error('Failed to add file to persistence:', error);
        alert(`Failed to add "${attachment.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    // Refresh file lists
    setSessionFiles(getSessionFiles(sessionId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  // Separate temporary and persistent files
  const temporaryFiles = sessionFiles.filter(f => !f.isPersistent);
  const displayPersistentFiles = persistentFiles.filter(f => f.isPersistent);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">File Persistence Manager</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Temporary Files</span>
              </div>
              <div className="text-2xl font-bold">{stats.temporary}</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Pin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Persistent Files</span>
              </div>
              <div className="text-2xl font-bold">{stats.persistent}</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Size</span>
              </div>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            </div>
          </div>

          {/* File Size Limits Info */}
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Storage Limits:</strong>
              <div className="text-xs mt-1">
                • Temporary files: Up to 10MB each
                • Persistent files: Up to 2.5MB each (for cross-session storage)
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Add current attachments button */}
          {currentAttachments.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription>
                You have {currentAttachments.length} attached file(s) that are not persisted.
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="ml-2"
                  onClick={handleAddCurrentAttachments}
                >
                  Add to Persistence
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-6 max-h-[400px] overflow-y-auto">
            {/* Temporary Files */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Session Files (Temporary)
                </h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleClearTemporary}
                  disabled={temporaryFiles.length === 0}
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-2">
                {temporaryFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No temporary files in this session</p>
                ) : (
                  temporaryFiles.map(file => (
                    <div key={file.id} className="bg-muted/20 p-3 rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span>{getFileIcon(file.type)}</span>
                            <span className="font-medium text-sm truncate">{file.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTogglePersistence(file.id)}
                            title="Make persistent"
                          >
                            <Pin className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Persistent Files */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  Persistent Files (All Sessions)
                </h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
              <div className="space-y-2">
                {displayPersistentFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No persistent files</p>
                ) : (
                  displayPersistentFiles.map(file => (
                    <div key={file.id} className="bg-primary/5 p-3 rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span>{getFileIcon(file.type)}</span>
                            <span className="font-medium text-sm truncate">{file.name}</span>
                            <Badge variant="secondary" className="text-xs">Persistent</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTogglePersistence(file.id)}
                            title="Make temporary"
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              {showClearConfirm ? (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>
                    Click again to confirm clearing all files
                  </AlertDescription>
                </Alert>
              ) : null}
              <Button 
                variant="destructive" 
                onClick={handleClearAll}
                disabled={stats.temporary === 0 && stats.persistent === 0}
              >
                Clear All Files
              </Button>
            </div>
            <Button variant="default" onClick={onClose}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}