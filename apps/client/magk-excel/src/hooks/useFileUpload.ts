import { useState, useCallback, useMemo } from 'react';

export interface FileAttachment {
  id: string;
  file: File;
  type: string;
  size: number;
  name: string;
  preview?: string;
  isPersistent?: boolean;
}

interface UseFileUploadOptions {
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { 
    maxFiles = 5, 
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes
  } = options;

  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const handleFilesChange = useCallback((filesOrAttachments: FileAttachment[] | File[]) => {
    // Check if it's already FileAttachment array
    if (filesOrAttachments.length > 0 && 'id' in filesOrAttachments[0]) {
      // It's FileAttachment[]
      setAttachments(filesOrAttachments as FileAttachment[]);
    } else {
      // It's File[], convert to FileAttachment[]
      const files = filesOrAttachments as File[];
      const newAttachments: FileAttachment[] = files.map(file => ({
        id: `${Date.now()}-${Math.random()}-${file.name}`,
        file,
        type: file.type,
        size: file.size,
        name: file.name,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        isPersistent: false
      }));
      setAttachments(newAttachments);
    }
  }, []);

  const handleFilesUpload = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxFileSize) {
        console.warn(`File ${file.name} exceeds max size of ${maxFileSize} bytes`);
        return false;
      }
      
      // Check file type if specified
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        console.warn(`File type ${file.type} not allowed`);
        return false;
      }
      
      return true;
    });

    // Limit number of files
    const filesToAdd = validFiles.slice(0, maxFiles - attachments.length);
    
    const newAttachments: FileAttachment[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: file.type,
      size: file.size,
      name: file.name,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      isPersistent: false
    }));

    setAttachments(prev => [...prev, ...newAttachments].slice(0, maxFiles));
  }, [attachments.length, maxFiles, maxFileSize, allowedTypes]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      // Clean up preview URL if exists
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    // Clean up all preview URLs
    attachments.forEach(attachment => {
      if (attachment.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
    });
    setAttachments([]);
  }, [attachments]);

  const hasExcelFiles = useMemo(() => 
    attachments.some(a => 
      a.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      a.type === 'application/vnd.ms-excel' ||
      a.name?.endsWith('.xlsx') ||
      a.name?.endsWith('.xls')
    ), [attachments]);

  const hasPDFFiles = useMemo(() => 
    attachments.some(a => a.type === 'application/pdf' || a.name?.endsWith('.pdf')),
    [attachments]
  );

  const totalSize = useMemo(() => 
    attachments.reduce((sum, a) => sum + a.size, 0),
    [attachments]
  );
  
  return {
    attachments,
    handleFilesChange,
    handleFilesUpload,
    removeAttachment,
    clearAttachments,
    hasExcelFiles,
    hasPDFFiles,
    totalSize,
    canAddMore: attachments.length < maxFiles
  };
}