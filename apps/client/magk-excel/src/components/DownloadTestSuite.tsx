import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  Info,
  Play,
  Clock
} from 'lucide-react';
import { downloadService } from '../services/downloadService';
// Lazy-load ExcelService only when tests run to avoid importing Node modules in browser context
let excelService: typeof import('../services/excel/ExcelService').excelService | null = null;
import { ExcelDownloadHandler } from './ExcelDownloadHandler';

export function DownloadTestSuite() {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message?: string;
    duration?: number;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [environmentInfo, setEnvironmentInfo] = useState(downloadService.getEnvironmentInfo());
  const [downloadInfo, setDownloadInfo] = useState<any>(null);

  const sampleData = [
    ['Name', 'Age', 'City', 'Salary', 'Department'],
    ['John Doe', 30, 'New York', 75000, 'Engineering'],
    ['Jane Smith', 25, 'Los Angeles', 65000, 'Marketing'],
    ['Bob Johnson', 35, 'Chicago', 80000, 'Sales'],
    ['Alice Brown', 28, 'Houston', 70000, 'Design'],
    ['Charlie Wilson', 32, 'Phoenix', 72000, 'Engineering'],
  ];

  const tests = [
    {
      name: 'Environment Detection',
      test: async () => {
        const info = downloadService.getEnvironmentInfo();
        setEnvironmentInfo(info);
        return {
          success: true,
          message: `Detected: ${info.isElectron ? 'Electron' : 'Browser'} environment`
        };
      }
    },
    {
      name: 'Excel Buffer Creation',
      test: async () => {
        if (!excelService) {
          excelService = (await import('../services/excel/ExcelService')).excelService;
        }
        const result = await excelService.createExcelBuffer({
          data: sampleData.slice(1),
          headers: sampleData[0]
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        return {
          success: true,
          message: `Created ${result.size} byte Excel buffer with ${result.rowsAffected} rows`
        };
      }
    },
    {
      name: 'CSV Buffer Creation',
      test: async () => {
        if (!excelService) {
          excelService = (await import('../services/excel/ExcelService')).excelService;
        }
        const result = excelService.createCSVBuffer(sampleData.slice(1), sampleData[0]);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        return {
          success: true,
          message: `Created ${result.size} byte CSV buffer with ${result.rowsAffected} rows`
        };
      }
    },
    {
      name: 'Download Service Content Download',
      test: async () => {
        if (!excelService) {
          excelService = (await import('../services/excel/ExcelService')).excelService;
        }
        const excelResult = await excelService.createExcelBuffer({
          data: sampleData.slice(1),
          headers: sampleData[0]
        });
        
        if (!excelResult.success || !excelResult.fileContent) {
          throw new Error('Failed to create Excel content');
        }
        
        // Create base64 content
        const base64Content = excelResult.fileContent.toString('base64');
        
        const downloadResult = await downloadService.downloadFromContent({
          content: base64Content,
          fileName: 'test_download.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          encoding: 'base64',
          autoSave: true
        });
        
        if (!downloadResult.success) {
          throw new Error(downloadResult.error);
        }
        
        return {
          success: true,
          message: `Downloaded to: ${downloadResult.savedPath}`
        };
      }
    },
    {
      name: 'Component Integration Test',
      test: async () => {
        if (!excelService) {
          excelService = (await import('../services/excel/ExcelService')).excelService;
        }
        const result = await excelService.createExcelBuffer({
          data: sampleData.slice(1),
          headers: sampleData[0]
        });
        
        if (!result.success || !result.fileContent) {
          throw new Error('Failed to create Excel content');
        }
        
        // Set download info for component
        setDownloadInfo({
          filename: result.fileName || 'component_test.xlsx',
          timestamp: Date.now(),
          content: result.fileContent.toString('base64'),
          mimeType: result.mimeType,
          encoding: 'base64' as const,
          size: result.size
        });
        
        return {
          success: true,
          message: 'Component integration ready - check download handler below'
        };
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const startTime = Date.now();
      
      setTestResults(prev => [...prev, {
        name: test.name,
        status: 'running'
      }]);
      
      try {
        const result = await test.test();
        const duration = Date.now() - startTime;
        
        setTestResults(prev => prev.map((item, index) => 
          index === i ? {
            ...item,
            status: result.success ? 'success' : 'error',
            message: result.message,
            duration
          } : item
        ));
      } catch (error) {
        const duration = Date.now() - startTime;
        
        setTestResults(prev => prev.map((item, index) => 
          index === i ? {
            ...item,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            duration
          } : item
        ));
      }
      
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            <div>
              <CardTitle>Download Functionality Test Suite</CardTitle>
              <CardDescription>
                Comprehensive testing for both Electron and browser download capabilities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Environment Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center gap-4">
                  <div>
                    <strong>Environment:</strong> {environmentInfo.isElectron ? 'Electron Desktop App' : 'Web Browser'}
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <Badge variant={environmentInfo.supportsFilePathDownloads ? 'default' : 'secondary'}>
                      File Path Downloads
                    </Badge>
                    <Badge variant={environmentInfo.supportsContentDownloads ? 'default' : 'secondary'}>
                      Content Downloads
                    </Badge>
                    <Badge variant={environmentInfo.supportsFileOperations ? 'default' : 'secondary'}>
                      File Operations
                    </Badge>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Test Controls */}
            <div className="flex items-center justify-between">
              <Button
                onClick={runTests}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isRunning ? 'Running Tests...' : 'Run Test Suite'}
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {testResults.length > 0 && (
                  <>
                    <span>
                      {testResults.filter(t => t.status === 'success').length}/{tests.length} passed
                    </span>
                    {testResults.some(t => t.status === 'error') && (
                      <Badge variant="destructive" className="text-xs">
                        {testResults.filter(t => t.status === 'error').length} failed
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Test Results</h3>
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded">
                    {getStatusIcon(result.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{result.name}</span>
                        {result.duration && (
                          <span className="text-xs text-muted-foreground">
                            ({result.duration}ms)
                          </span>
                        )}
                      </div>
                      {result.message && (
                        <p className={`text-xs mt-1 ${
                          result.status === 'error' ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          {result.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sample Data Preview */}
            <div className="mt-6">
              <h3 className="font-semibold text-sm mb-2">Sample Test Data</h3>
              <div className="border rounded p-3 bg-muted/50">
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {sampleData.slice(0, 3).map((row, rowIndex) => 
                    row.map((cell, cellIndex) => (
                      <div 
                        key={`${rowIndex}-${cellIndex}`} 
                        className={`p-1 ${rowIndex === 0 ? 'font-semibold bg-background border' : ''}`}
                      >
                        {cell}
                      </div>
                    ))
                  )}
                </div>
                <div className="text-center text-muted-foreground mt-2 text-xs">
                  ... and {sampleData.length - 3} more rows
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Integration Test */}
      {downloadInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Component Integration Test</CardTitle>
            <CardDescription>
              Test the ExcelDownloadHandler component with generated content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExcelDownloadHandler 
              downloadInfo={downloadInfo} 
              onClose={() => setDownloadInfo(null)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}