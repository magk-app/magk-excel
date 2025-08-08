import React, { forwardRef, useEffect, useRef, useImperativeHandle, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle,
  Globe,
  Loader2,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TestFile {
  id: string;
  name: string;
  description: string;
  type: 'html' | 'js';
  category: string;
  path: string;
}

interface TestIframeContainerProps {
  test: TestFile;
  isRunning?: boolean;
  onMessage?: (message: string, level?: 'info' | 'warn' | 'error' | 'debug') => void;
  onLoad?: () => void;
  onError?: (error: string) => void;
  autoScroll?: boolean;
  height?: string;
  allowFullscreen?: boolean;
  showControls?: boolean;
}

export interface TestIframeContainerRef {
  reload: () => void;
  getIframe: () => HTMLIFrameElement | null;
  captureScreenshot: () => Promise<string | null>;
}

export const TestIframeContainer = forwardRef<TestIframeContainerRef, TestIframeContainerProps>(({
  test,
  isRunning = false,
  onMessage,
  onLoad,
  onError,
  autoScroll = true,
  height = "400px",
  allowFullscreen = true,
  showControls = true
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [iframeKey, setIframeKey] = React.useState(0); // Force iframe reload

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reload: () => {
      setIframeKey(prev => prev + 1);
      reload();
    },
    getIframe: () => iframeRef.current,
    captureScreenshot: captureScreenshot
  }), []);

  // Reload iframe
  const reload = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  // Open in new tab
  const openInNewTab = useCallback(() => {
    const baseUrl = window.location.origin;
    const testUrl = `${baseUrl}/${test.path}`;
    window.open(testUrl, `test-${test.id}`, 'width=1200,height=800');
  }, [test]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Capture screenshot (simulation)
  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    try {
      onMessage?.('Capturing screenshot...', 'info');
      
      // In a real implementation, you would use html2canvas or similar
      // to capture the iframe content
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a placeholder image data URL
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw a simple placeholder
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#374151';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Screenshot: ${test.name}`, 400, 300);
        ctx.font = '16px Arial';
        ctx.fillText(`Test ID: ${test.id}`, 400, 340);
        
        const imageData = canvas.toDataURL('image/png');
        onMessage?.('Screenshot captured successfully', 'info');
        return imageData;
      }
      
      return null;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Screenshot capture failed';
      onMessage?.(errorMsg, 'error');
      return null;
    }
  }, [test, onMessage]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
    onMessage?.(`Test page loaded: ${test.name}`, 'info');
    
    // Try to set up communication with iframe
    if (iframeRef.current) {
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow) {
          // Listen for messages from iframe
          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            try {
              const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (data.type === 'test-log') {
                onMessage?.(data.message, data.level || 'info');
              } else if (data.type === 'test-error') {
                onMessage?.(data.error, 'error');
              } else if (data.type === 'test-info') {
                onMessage?.(data.info, 'info');
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON messages
            }
          };
          
          window.addEventListener('message', handleMessage);
          
          // Send initialization message to iframe
          iframeWindow.postMessage({
            type: 'test-init',
            testId: test.id,
            autoScroll
          }, window.location.origin);
        }
      } catch (error) {
        console.warn('Could not establish iframe communication:', error);
      }
    }
  }, [test, onLoad, onMessage, autoScroll]);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('Failed to load test page');
    onError?.('Failed to load test page');
    onMessage?.(`Failed to load test: ${test.name}`, 'error');
  }, [test, onError, onMessage]);

  // Get iframe URL
  const getIframeUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${test.path}`;
  };

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && isRunning && iframeRef.current) {
      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          iframeDoc.documentElement.scrollTop = iframeDoc.documentElement.scrollHeight;
        }
      } catch (error) {
        // Cross-origin restrictions may prevent access
        console.warn('Auto-scroll failed due to cross-origin restrictions');
      }
    }
  }, [autoScroll, isRunning]);

  return (
    <Card className={cn("w-full", isFullscreen && "fixed inset-4 z-50")}>
      <CardHeader className={cn("pb-3", !showControls && "hidden")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" />
            <div>
              <CardTitle className="text-lg">{test.name}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {test.path}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{test.type.toUpperCase()}</Badge>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            {isRunning && <Badge variant="default" className="animate-pulse">Running</Badge>}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Reload
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={openInNewTab}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </Button>
          
          {allowFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  Minimize
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={captureScreenshot}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Screenshot
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Error Alert */}
        {hasError && (
          <Alert className="m-4 mb-0" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}. Check the console for more details.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading test page...
          </div>
        )}

        {/* Iframe Container */}
        <div 
          className="relative border-t overflow-hidden"
          style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={getIframeUrl()}
            className="w-full h-full border-0"
            title={`Test: ${test.name}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              opacity: isLoading ? 0.5 : 1,
              transition: 'opacity 0.2s ease'
            }}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm">Loading test...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TestIframeContainer.displayName = 'TestIframeContainer';

export default TestIframeContainer;