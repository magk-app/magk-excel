import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Download, FolderOpen, FileSpreadsheet, X } from 'lucide-react';

interface ExcelDownloadInfo {
  filePath: string;
  filename: string;
  timestamp: number;
  url?: string;
}

interface ExcelDownloadHandlerProps {
  downloadInfo?: ExcelDownloadInfo;
  onClose?: () => void;
}

export function ExcelDownloadHandler({ downloadInfo, onClose }: ExcelDownloadHandlerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!downloadInfo) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      if (window.fileAPI) {
        const result = await window.fileAPI.downloadFile(downloadInfo.filePath);
        if (result.success) {
          setDownloadSuccess(true);
          console.log('✅ File downloaded to:', result.savedPath);
        } else {
          setDownloadError(result.error || 'Download failed');
        }
      } else {
        // Fallback for web version
        setDownloadError('Download not available in web version');
      }
    } catch (error) {
      console.error('Download error:', error);
      setDownloadError('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenFile = async () => {
    try {
      if (window.fileAPI) {
        await window.fileAPI.openFile(downloadInfo.filePath);
      } else {
        setDownloadError('Cannot open file in web version');
      }
    } catch (error) {
      console.error('Open file error:', error);
      setDownloadError('Failed to open file');
    }
  };

  const handleShowInFolder = async () => {
    try {
      if (window.fileAPI) {
        await window.fileAPI.showInFolder(downloadInfo.filePath);
      } else {
        setDownloadError('Cannot show folder in web version');
      }
    } catch (error) {
      console.error('Show in folder error:', error);
      setDownloadError('Failed to show in folder');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="bg-background border shadow-lg">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-green-500 mt-0.5" />
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Excel File Created</h4>
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
              <strong>{downloadInfo.filename}</strong>
              {downloadSuccess && (
                <div className="text-green-600 mt-1">✅ File saved successfully!</div>
              )}
              {downloadError && (
                <div className="text-red-600 mt-1">❌ {downloadError}</div>
              )}
            </AlertDescription>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading || downloadSuccess}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                {isDownloading ? 'Saving...' : downloadSuccess ? 'Saved' : 'Save As'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenFile}
                className="flex items-center gap-1"
              >
                <FileSpreadsheet className="h-3 w-3" />
                Open
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleShowInFolder}
                className="flex items-center gap-1"
              >
                <FolderOpen className="h-3 w-3" />
                Show in Folder
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}