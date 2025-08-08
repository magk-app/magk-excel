# Claude API Direct File Upload Integration

This document outlines the implementation of direct file upload functionality to the Claude API, supporting both the Files API and base64 encoding methods.

## Features Implemented

### 1. Claude Files API Service (`/src/services/claude/ClaudeFilesService.ts`)

A comprehensive service for handling file uploads to Claude API with:

- **Files API Support**: Upload files once and get a `file_id` for reuse
- **Base64 Encoding**: Automatic fallback for smaller files (<5MB)
- **File Validation**: Support for PDFs, images (JPEG, PNG, GIF, WebP), and text files
- **Progress Tracking**: Real-time upload progress monitoring
- **Error Handling**: Comprehensive error messages and validation

#### Key Methods:

```typescript
// Process file for Claude API
await claudeFilesService.processFile(file, onProgress);

// Upload multiple files concurrently  
await claudeFilesService.processFiles(files, onProgress);

// Validate file support
claudeFilesService.isFileSupported(file);

// Get validation errors
claudeFilesService.getFileValidationError(file);
```

### 2. Updated Chat Adapter (`/src/hooks/useChatAdapter.ts`)

Enhanced to support direct Claude API file attachments:

- **Dual Processing**: Files are processed for both Claude API and backend compatibility
- **Smart Routing**: Uses base64 for small files, Files API for larger files
- **Progress Callbacks**: Real-time upload progress updates
- **Seamless Integration**: Works with existing message flow

#### New Options:

```typescript
interface ChatAdapterOptions {
  useDirectClaudeApi?: boolean;
  onFileUploadProgress?: (fileId: string, progress: FileUploadProgress) => void;
}
```

### 3. Enhanced File Upload Area (`/src/components/FileUploadArea.tsx`)

Updated with Claude API integration:

- **Toggle Switch**: Choose between Claude API and backend processing
- **Expanded File Support**: Images, PDFs, and text files when using Claude API
- **Progress Display**: Real-time upload progress with status indicators
- **Smart Validation**: Different validation rules based on upload method

#### New Features:

- **API Method Toggle**: Switch between Claude API and backend processing
- **Progress Tracking**: Visual progress bars for file uploads
- **Extended Support**: Images (JPEG, PNG, GIF, WebP), text files (TXT, CSV, HTML, MD)
- **File Size Limits**: 100MB for Claude API, 50MB for backend

### 4. File Upload Progress Component (`/src/components/FileUploadProgress.tsx`)

New component for visualizing upload progress:

- **Real-time Updates**: Shows upload progress percentage
- **Status Indicators**: Visual icons for different upload states
- **Error Handling**: Displays error messages and retry options
- **Method Display**: Shows whether using Base64 or Files API

### 5. Updated Chat Input Area (`/src/components/ChatInputArea.tsx`)

Simplified and integrated with new file upload system:

- **Integrated Upload**: File upload area is now part of the input
- **Progress Display**: Shows upload progress inline
- **Smart Validation**: Adapts to selected upload method

## API Integration Details

### Files API Headers

```typescript
{
  'Authorization': `Bearer ${apiKey}`,
  'anthropic-version': '2023-06-01',
  'anthropic-beta': 'files-api-2025-04-14'  // Required beta header
}
```

### File Processing Logic

1. **File Validation**: Check file type and size limits
2. **Method Selection**: 
   - Files <5MB: Use base64 encoding
   - Files >5MB: Use Files API upload
3. **Progress Tracking**: Monitor upload progress
4. **Error Handling**: Provide user-friendly error messages

### Message Format

Files are formatted for Claude API as:

```typescript
// Base64 format
{
  type: 'image',
  source: {
    type: 'base64',
    media_type: 'image/jpeg',
    data: 'base64_data_here'
  }
}

// Files API format
{
  type: 'document', 
  source: {
    type: 'file',
    file_id: 'file_id_from_upload'
  }
}
```

## Usage

### 1. Enable Claude API Upload

Set your Anthropic API key in the API Key Manager, then toggle "Claude API" in the file upload area.

### 2. Upload Files

- **Supported Types**: PDF, JPEG, PNG, GIF, WebP, TXT, CSV, HTML, MD
- **Size Limits**: Up to 100MB per file
- **Progress**: Real-time upload progress display

### 3. Send Messages

Files are automatically included with your message and sent directly to Claude API.

## Benefits

1. **Direct Integration**: Files go straight to Claude without backend processing
2. **Expanded Support**: Images and text files in addition to PDFs
3. **Better Performance**: Large files use efficient Files API upload
4. **Progress Tracking**: Real-time feedback on upload status
5. **Error Handling**: Clear error messages and retry options

## Configuration

The system automatically detects if you have an Anthropic API key configured and enables the Claude API option. No additional configuration required.

## Future Enhancements

- File caching and reuse
- Batch file operations
- File preview functionality
- Advanced file management UI