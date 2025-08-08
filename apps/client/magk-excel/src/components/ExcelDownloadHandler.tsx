import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Download, FolderOpen, FileSpreadsheet, X, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { downloadService, DownloadProgress } from '../services/downloadService';

interface ExcelDownloadInfo {
  filePath?: string;
  filename: string;
  timestamp: number;
  url?: string;
  content?: string | Buffer;
  mimeType?: string;
  encoding?: 'base64' | 'utf8' | 'binary';
  size?: number;
}

interface ExcelDownloadHandlerProps {
  downloadInfo?: ExcelDownloadInfo;
  onClose?: () => void;
}

export function ExcelDownloadHandler({ downloadInfo, onClose }: ExcelDownloadHandlerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [environmentInfo, setEnvironmentInfo] = useState(downloadService.getEnvironmentInfo());

  useEffect(() => {
    setEnvironmentInfo(downloadService.getEnvironmentInfo());
  }, []);

  if (!downloadInfo) return null;

  const handleDownload = async (autoSave: boolean = false) => {
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadProgress(null);
    
    try {
      let result;
      
      if (downloadInfo.filePath && environmentInfo.supportsFilePathDownloads) {
        // Download from file path (Electron)
        result = await downloadService.downloadFile(downloadInfo.filePath, {
          autoSave,
          defaultPath: downloadInfo.filename
        });
      } else if (downloadInfo.content) {
        // Download from content (both Electron and browser)
        result = await downloadService.downloadFromContent({
          content: downloadInfo.content,
          fileName: downloadInfo.filename,
          mimeType: downloadInfo.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          encoding: downloadInfo.encoding || 'base64',
          autoSave
        });
      } else {
        throw new Error('No download source available');
      }
      
      if (result.success) {
        setDownloadSuccess(true);
        setSavedPath(result.savedPath || null);
        console.log('✅ File downloaded successfully:', result.savedPath);
      } else {
        setDownloadError(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      setDownloadError(error instanceof Error ? error.message : 'Failed to download file');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleOpenFile = async () => {
    try {
      if (savedPath || downloadInfo.filePath) {
        const filePath = savedPath || downloadInfo.filePath!;
        const result = await downloadService.openFile(filePath);
        if (!result.success) {
          setDownloadError(result.error || 'Failed to open file');
        }
      } else {
        setDownloadError('No file path available');
      }
    } catch (error) {
      console.error('Open file error:', error);
      setDownloadError('Failed to open file');
    }
  };

  const handleShowInFolder = async () => {
    try {
      if (savedPath || downloadInfo.filePath) {
        const filePath = savedPath || downloadInfo.filePath!;
        const result = await downloadService.showInFolder(filePath);
        if (!result.success) {
          setDownloadError(result.error || 'Failed to show in folder');
        }
      } else {
        setDownloadError('No file path available');
      }
    } catch (error) {
      console.error('Show in folder error:', error);
      setDownloadError('Failed to show in folder');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className="bg-background border shadow-lg">
        <div className="flex items-start gap-3">
          <div className="relative">
            <FileSpreadsheet className="h-5 w-5 text-green-500 mt-0.5" />
            {downloadSuccess && (
              <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
            )}
            {downloadError && (
              <AlertCircle className="h-3 w-3 text-red-500 absolute -top-1 -right-1" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">Excel File Ready</h4>
                <Badge variant="outline" className="text-xs">
                  {environmentInfo.isElectron ? 'Electron' : 'Browser'}
                </Badge>
              </div>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <AlertDescription className="text-xs mb-3">
              <div className="font-medium">{downloadInfo.filename}</div>
              {downloadInfo.size && (
                <div className="text-muted-foreground mt-1">
                  Size: {formatFileSize(downloadInfo.size)}
                </div>
              )}
              {savedPath && (
                <div className="text-muted-foreground mt-1 truncate">
                  Saved to: {savedPath}
                </div>
              )}
              {downloadProgress && (
                <div className="mt-2">
                  <Progress value={downloadProgress.percentage} className="h-1" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {downloadProgress.percentage.toFixed(0)}% ({formatFileSize(downloadProgress.loaded)} / {formatFileSize(downloadProgress.total)})
                  </div>
                </div>
              )}
              {downloadSuccess && (
                <div className="text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  File saved successfully!
                </div>
              )}
              {downloadError && (
                <div className="text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {downloadError}
                </div>
              )}
            </AlertDescription>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownload(false)}
                  disabled={isDownloading || downloadSuccess}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  {isDownloading ? 'Saving...' : downloadSuccess ? 'Saved' : 'Save As'}
                </Button>
                
                {environmentInfo.isElectron && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(true)}
                    disabled={isDownloading || downloadSuccess}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Quick Save
                  </Button>
                )}
              </div>
              
              {(downloadSuccess && environmentInfo.supportsFileOperations) && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenFile}
                    className="flex items-center gap-1 text-xs"
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                    Open
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShowInFolder}
                    className="flex items-center gap-1 text-xs"
                  >
                    <FolderOpen className="h-3 w-3" />
                    Show in Folder
                  </Button>
                </div>
              )}
              
              {downloadSuccess && !environmentInfo.isElectron && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Check your browser's Downloads folder
                </div>
              )}
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}