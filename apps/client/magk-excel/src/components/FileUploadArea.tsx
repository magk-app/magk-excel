import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { FileUploadProgressComponent, FileUploadProgress } from './FileUploadProgress';
import { claudeFilesService } from '../services/claude/ClaudeFilesService';
import { Info, Cloud, Server } from 'lucide-react';

export interface FileAttachment {
  file: File;
  type: string;
  name: string;
  size: number;
  id: string;
}

interface FileUploadAreaProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  useDirectClaudeApi?: boolean;
  onDirectClaudeApiChange?: (enabled: boolean) => void;
  onFileUploadProgress?: (fileId: string, progress: FileUploadProgress) => void;
}

export function FileUploadArea({ 
  attachments, 
  onAttachmentsChange, 
  maxFiles = 5,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  useDirectClaudeApi = false,
  onDirectClaudeApiChange,
  onFileUploadProgress
}: FileUploadAreaProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasClaudeApiKey = !!claudeFilesService.getApiKey();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploadError(null);
    const newAttachments: FileAttachment[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name} is too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`);
        return;
      }

      // Check file type - expand support for Claude API
      let isValidType = false;
      
      if (useDirectClaudeApi && hasClaudeApiKey) {
        // Use Claude API validation for supported files
        isValidType = claudeFilesService.isFileSupported(file);
        const validationError = claudeFilesService.getFileValidationError(file);
        if (validationError) {
          errors.push(validationError);
          return;
        }
      } else {
        // Legacy validation for backend processing
        isValidType = 
          file.type === 'application/pdf' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.name.toLowerCase().endsWith('.pdf') ||
          file.name.toLowerCase().endsWith('.xlsx') ||
          file.name.toLowerCase().endsWith('.xls');
      }

      if (!isValidType) {
        const supportedTypes = useDirectClaudeApi && hasClaudeApiKey 
          ? 'PDF, Images (JPEG, PNG, GIF, WebP), Text files (TXT, CSV, HTML, Markdown)'
          : 'PDF, Excel only';
        errors.push(`${file.name} is not a supported file type (${supportedTypes})`);
        return;
      }

      // Determine file type - expand for Claude API
      let fileType: 'pdf' | 'excel' | 'image' | 'text' = 'pdf';
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        fileType = 'pdf';
      } else if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('text/') || 
                 file.name.toLowerCase().endsWith('.txt') || 
                 file.name.toLowerCase().endsWith('.csv') || 
                 file.name.toLowerCase().endsWith('.md')) {
        fileType = 'text';
      } else {
        fileType = 'excel';
      }

      // Check if we're at max files
      if (attachments.length + newAttachments.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Remove duplicate check to allow re-uploading same files
      // This fixes Issue #1: Allow re-uploading the same file multiple times

      newAttachments.push({
        file,
        type: fileType,
        name: file.name,
        size: file.size,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    });

    if (errors.length > 0) {
      setUploadError(errors.join(', '));
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(attachment => attachment.id !== id));
    setUploadError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: 'pdf' | 'excel' | 'image' | 'text'): string => {
    switch (type) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'image': return '🖼️';
      case 'text': return '📝';
      default: return '📄';
    }
  };

  const getFileTypeColor = (type: 'pdf' | 'excel' | 'image' | 'text'): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'pdf': return 'destructive';
      case 'excel': return 'secondary';
      case 'image': return 'default';
      case 'text': return 'outline';
      default: return 'destructive';
    }
  };

  const handleFileUploadProgress = (fileId: string, progress: FileUploadProgress) => {
    setUploadProgress(prev => {
      const existing = prev.find(p => p.fileId === fileId);
      if (existing) {
        return prev.map(p => p.fileId === fileId ? progress : p);
      } else {
        return [...prev, progress];
      }
    });
    
    if (onFileUploadProgress) {
      onFileUploadProgress(fileId, progress);
    }
  };

  const clearUploadProgress = (fileId: string) => {
    setUploadProgress(prev => prev.filter(p => p.fileId !== fileId));
  };

  return (
    <div className="border-b bg-muted/30 p-4 space-y-3">
      {/* Upload Button and Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept={useDirectClaudeApi && hasClaudeApiKey 
              ? '.pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.html,.md,application/pdf,image/*,text/*'
              : '.pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
            }
            multiple
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            disabled={attachments.length >= maxFiles}
            className="flex items-center gap-2"
          >
            📎 Attach Files
          </Button>
          <span className="text-sm text-muted-foreground">
            {useDirectClaudeApi && hasClaudeApiKey 
              ? 'PDF, Images, Text files • Max 100MB each'
              : 'PDF and Excel files • Max 50MB each'
            } • Max {maxFiles} files
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {hasClaudeApiKey && onDirectClaudeApiChange && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="direct-claude-api"
                      checked={useDirectClaudeApi}
                      onCheckedChange={onDirectClaudeApiChange}
                    />
                    <label 
                      htmlFor="direct-claude-api" 
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      {useDirectClaudeApi ? (
                        <><Cloud className="w-3 h-3" /> Claude API</>
                      ) : (
                        <><Server className="w-3 h-3" /> Backend</>
                      )}
                    </label>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-64">
                  <div className="space-y-1">
                    <p className="font-semibold">File Upload Method</p>
                    <p className="text-sm">
                      {useDirectClaudeApi
                        ? 'Files are sent directly to Claude API with support for images, PDFs, and text files. Large files use Files API for efficient processing.'
                        : 'Files are processed by the backend server and converted for Claude. Supports PDF and Excel files only.'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {attachments.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {attachments.length}/{maxFiles} files attached
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Upload Progress:</h4>
          <FileUploadProgressComponent
            uploads={uploadProgress}
            onClear={clearUploadProgress}
            onRetry={(fileId) => {
              // Find the corresponding attachment and retry upload
              const progressItem = uploadProgress.find(p => p.fileId === fileId);
              if (progressItem) {
                // This would need to be implemented based on your retry logic
                console.log('Retry upload for:', progressItem.fileName);
              }
            }}
          />
        </div>
      )}

      {/* Attached Files Display */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Attached Files:</h4>
          <div className="grid gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 bg-background px-3 py-2 rounded-md border shadow-sm"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg" role="img" aria-label={`${attachment.type} file`}>
                    {getFileIcon(attachment.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate" title={attachment.name}>
                        {attachment.name}
                      </span>
                      <Badge variant={getFileTypeColor(attachment.type)} className="text-xs">
                        {attachment.type.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => removeAttachment(attachment.id)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  title="Remove file"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop Zone Hint */}
      {attachments.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <div className="space-y-2">
            <div className="text-2xl">📁</div>
            <p className="text-sm text-muted-foreground">
              {useDirectClaudeApi && hasClaudeApiKey
                ? 'Drop files here, or click "Attach Files" to browse'
                : 'Drop PDF or Excel files here, or click "Attach Files" to browse'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {useDirectClaudeApi && hasClaudeApiKey
                ? 'Supported: PDF, Images (JPEG, PNG, GIF, WebP), Text (TXT, CSV, HTML, MD)'
                : 'Supported: .pdf, .xlsx, .xls'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}