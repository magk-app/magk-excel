import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

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
}

export function FileUploadArea({ 
  attachments, 
  onAttachmentsChange, 
  maxFiles = 5,
  maxFileSize = 50 * 1024 * 1024 // 50MB default
}: FileUploadAreaProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Check file type
      const isValidType = 
        file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls');

      if (!isValidType) {
        errors.push(`${file.name} is not a supported file type (PDF, Excel only)`);
        return;
      }

      // Determine file type
      const fileType: 'pdf' | 'excel' = 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') 
          ? 'pdf' 
          : 'excel';

      // Check if we're at max files
      if (attachments.length + newAttachments.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check for duplicates
      const isDuplicate = attachments.some(existing => 
        existing.name === file.name && existing.size === file.size
      );
      
      if (isDuplicate) {
        errors.push(`${file.name} is already attached`);
        return;
      }

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

  const getFileIcon = (type: 'pdf' | 'excel'): string => {
    return type === 'pdf' ? '📄' : '📊';
  };

  const getFileTypeColor = (type: 'pdf' | 'excel'): 'default' | 'secondary' | 'destructive' | 'outline' => {
    return type === 'pdf' ? 'destructive' : 'secondary';
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
            accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
            PDF and Excel files • Max {maxFiles} files • {Math.round(maxFileSize / 1024 / 1024)}MB each
          </span>
        </div>
        
        {attachments.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {attachments.length}/{maxFiles} files attached
          </div>
        )}
      </div>

      {/* Error Display */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
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
              Drop PDF or Excel files here, or click "Attach Files" to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: .pdf, .xlsx, .xls
            </p>
          </div>
        </div>
      )}
    </div>
  );
}