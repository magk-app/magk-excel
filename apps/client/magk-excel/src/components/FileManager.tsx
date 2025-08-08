/**
 * File Manager Component - Comprehensive file browser and management UI
 * 
 * Features:
 * - Browse files across all storage layers
 * - Version history viewing and management
 * - File operations (download, delete, share)
 * - Storage usage monitoring
 * - Search and filtering capabilities
 * - Batch operations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { 
  MoreVertical, 
  Download, 
  Trash2, 
  History, 
  Search, 
  Filter,
  FolderOpen, 
  File, 
  FileSpreadsheet,
  FileText,
  HardDrive,
  Clock,
  Tag,
  Eye,
  Share,
  RefreshCw,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { useFilePersistenceStore, type PersistedFile } from '../stores/filePersistenceStore';
import { unifiedPersistenceService, type FileVersion, type FileMetrics } from '../services/persistence/UnifiedPersistenceService';

interface FileManagerProps {
  sessionId: string;
  className?: string;
}

interface FileWithVersions extends PersistedFile {
  versions?: FileVersion[];
  selected?: boolean;
}

export const FileManager: React.FC<FileManagerProps> = ({ sessionId, className }) => {
  const [files, setFiles] = useState<FileWithVersions[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileWithVersions[]>([]);
  const [metrics, setMetrics] = useState<FileMetrics | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'temporary' | 'persistent'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFileVersions, setSelectedFileVersions] = useState<FileVersion[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const store = useFilePersistenceStore();

  // Load files and metrics
  useEffect(() => {
    loadFiles();
    loadMetrics();
  }, [sessionId, store]);

  // Filter and sort files when dependencies change
  useEffect(() => {
    filterAndSortFiles();
  }, [files, searchTerm, filterType, sortBy, sortOrder]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sessionFiles = store.getSessionFiles(sessionId);
      const filesWithVersions: FileWithVersions[] = [];
      
      // Load version information for each file
      for (const file of sessionFiles) {
        const versionResult = await unifiedPersistenceService.retrieveFile(file.id, {
          includeHistory: true
        });
        
        filesWithVersions.push({
          ...file,
          versions: versionResult.versions || []
        });
      }
      
      setFiles(filesWithVersions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = () => {
    const currentMetrics = unifiedPersistenceService.getStorageMetrics();
    setMetrics(currentMetrics);
  };

  const filterAndSortFiles = () => {
    let filtered = [...files];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(term) ||
        (file.description?.toLowerCase().includes(term)) ||
        (file.tags?.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(file => {
        if (filterType === 'persistent') return file.isPersistent;
        if (filterType === 'temporary') return !file.isPersistent;
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'date':
          compareValue = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          compareValue = a.size - b.size;
          break;
        case 'type':
          compareValue = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    setFilteredFiles(filtered);
  };

  const handleFileSelect = (fileId: string, selected: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (selected) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const handleDownloadFile = async (file: PersistedFile) => {
    try {
      const result = await unifiedPersistenceService.retrieveFile(file.id, { asBuffer: true });
      if (result.success && result.buffer) {
        const blob = new Blob([result.buffer], { type: file.type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error || 'Failed to download file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    store.removeFile(fileId);
    loadFiles();
    loadMetrics();
  };

  const handleDeleteSelected = () => {
    selectedFiles.forEach(fileId => store.removeFile(fileId));
    setSelectedFiles(new Set());
    loadFiles();
    loadMetrics();
  };

  const handleTogglePersistence = (fileId: string) => {
    store.toggleFilePersistence(fileId);
    loadFiles();
    loadMetrics();
  };

  const handleViewVersions = async (file: PersistedFile) => {
    try {
      const result = await unifiedPersistenceService.retrieveFile(file.id, {
        includeHistory: true
      });
      
      if (result.success && result.versions) {
        setSelectedFileVersions(result.versions);
        setShowVersionDialog(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  const getFileIcon = (type: string) => {
    if (type.includes('spreadsheet') || type.includes('excel')) {
      return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    }
    if (type.includes('text') || type.includes('csv')) {
      return <FileText className="w-4 h-4 text-blue-600" />;
    }
    return <File className="w-4 h-4 text-gray-600" />;
  };

  const getStorageUsagePercent = (layer: 'temporary' | 'persistent'): number => {
    if (!metrics) return 0;
    const layerData = metrics.byLayer[layer];
    if (!layerData) return 0;
    
    // Assume max sizes (these should come from the persistence service)
    const maxSizes = {
      temporary: 50 * 1024 * 1024, // 50MB
      persistent: 500 * 1024 * 1024 // 500MB
    };
    
    return Math.min((layerData.size / maxSizes[layer]) * 100, 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Storage Metrics */}
      {metrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Storage Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.totalFiles}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatFileSize(metrics.totalSize)}</div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.versionsCount}</div>
                <div className="text-sm text-muted-foreground">Versions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Object.keys(metrics.byType).length}</div>
                <div className="text-sm text-muted-foreground">File Types</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Temporary Storage</span>
                  <span>{formatFileSize(metrics.byLayer.temporary?.size || 0)}</span>
                </div>
                <Progress value={getStorageUsagePercent('temporary')} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Persistent Storage</span>
                  <span>{formatFileSize(metrics.byLayer.persistent?.size || 0)}</span>
                </div>
                <Progress value={getStorageUsagePercent('persistent')} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Browser */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              File Manager
            </CardTitle>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadFiles}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {selectedFiles.size > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected ({selectedFiles.size})
                </Button>
              )}
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-1" />
                    Filter: {filterType}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType('all')}>
                    All Files
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('persistent')}>
                    Persistent Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('temporary')}>
                    Temporary Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Sort: {sortBy} {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>
                    Name A-Z
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('desc'); }}>
                    Name Z-A
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('size'); setSortOrder('desc'); }}>
                    Largest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('size'); setSortOrder('asc'); }}>
                    Smallest First
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {filteredFiles.length > 0 && (
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
                Select All ({filteredFiles.length} files)
              </label>
            </div>
          )}
          
          <ScrollArea className="h-96">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading files...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                {searchTerm || filterType !== 'all' 
                  ? 'No files match your search criteria.' 
                  : 'No files found. Upload some files to get started.'
                }
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <input 
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={(e) => handleFileSelect(file.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="flex gap-1">
                          {file.isPersistent ? (
                            <Badge variant="default" className="text-xs">
                              Persistent
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Temporary
                            </Badge>
                          )}
                          
                          {file.versions && file.versions.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              v{Math.max(...file.versions.map(v => v.version))}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(file.uploadedAt)}
                        </span>
                        
                        {file.tags && file.tags.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {file.tags.slice(0, 2).join(', ')}
                            {file.tags.length > 2 && ` +${file.tags.length - 2}`}
                          </span>
                        )}
                      </div>
                      
                      {file.description && (
                        <div className="text-sm text-muted-foreground mt-1 truncate">
                          {file.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleTogglePersistence(file.id)}>
                            <Archive className="w-4 h-4 mr-2" />
                            {file.isPersistent ? 'Make Temporary' : 'Make Persistent'}
                          </DropdownMenuItem>
                          
                          {file.versions && file.versions.length > 0 && (
                            <DropdownMenuItem onClick={() => handleViewVersions(file)}>
                              <History className="w-4 h-4 mr-2" />
                              View Versions ({file.versions.length})
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Version History Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {selectedFileVersions.map((version) => (
                <div key={version.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Version {version.version}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(version.createdAt)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Size: {formatFileSize(version.size)}
                      </div>
                    </div>
                    
                    <Badge variant="outline">
                      {version.createdBy}
                    </Badge>
                  </div>
                  
                  {version.changes && (
                    <div className="mt-2 text-sm">
                      <strong>Changes:</strong> {version.changes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileManager;