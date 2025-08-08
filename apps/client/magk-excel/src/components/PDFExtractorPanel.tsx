import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Upload, FileText, Download, Clock, Table2, AlertCircle, MessageSquare } from 'lucide-react';

interface PDFExtractionResult {
  fileName: string;
  totalPages: number;
  processedPages: number;
  extractionTime: number;
  text: string;
  tables: Array<{
    page: number;
    tableType: 'financial' | 'data' | 'unknown';
    confidence: number;
    headers: string[];
    rows: string[][];
  }>;
  metadata: {
    hasFinancialData: boolean;
    tableCount: number;
    averageTableConfidence: number;
  };
}

interface PDFExtractorPanelProps {
  onExtractedContent?: (content: string, result: PDFExtractionResult) => void;
  onSendToChat?: (content: string, result: PDFExtractionResult) => void;
}

export function PDFExtractorPanel({ onExtractedContent, onSendToChat }: PDFExtractorPanelProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<PDFExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setUploadProgress(0);
    setExtractionResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify({
        chunkSize: 25,
        fileName: file.name
      }));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Make API request
      const response = await fetch('http://localhost:3001/api/pdf-extract', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF extraction failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'PDF extraction failed');
      }

      const result = data.result as PDFExtractionResult;
      setExtractionResult(result);
      
      // Call callback with extracted content
      if (onExtractedContent) {
        onExtractedContent(result.text, result);
      }

    } catch (err) {
      console.error('PDF extraction error:', err);
      setError(err instanceof Error ? err.message : 'PDF extraction failed');
    } finally {
      setIsExtracting(false);
      setUploadProgress(0);
    }
  }, [onExtractedContent]);

  const downloadMarkdown = useCallback(() => {
    if (!extractionResult) return;

    // Create markdown content
    let markdown = `# ${extractionResult.fileName} - Extracted Content\n\n`;
    markdown += `**Extraction Date:** ${new Date().toLocaleDateString()}\n`;
    markdown += `**Pages:** ${extractionResult.totalPages}\n`;
    markdown += `**Tables Found:** ${extractionResult.tables.length}\n`;
    markdown += `**Processing Time:** ${(extractionResult.extractionTime / 1000).toFixed(2)}s\n\n`;
    
    markdown += `## Document Text\n\n${extractionResult.text}\n\n`;
    
    if (extractionResult.tables.length > 0) {
      markdown += `## Extracted Tables\n\n`;
      extractionResult.tables.forEach((table, index) => {
        markdown += `### Table ${index + 1} (Page ${table.page}) - ${table.tableType} (${(table.confidence * 100).toFixed(1)}% confidence)\n\n`;
        
        if (table.headers.length > 0) {
          markdown += `| ${table.headers.join(' | ')} |\n`;
          markdown += `| ${table.headers.map(() => '---').join(' | ')} |\n`;
        }
        
        table.rows.forEach(row => {
          markdown += `| ${row.join(' | ')} |\n`;
        });
        
        markdown += '\n';
      });
    }

    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractionResult.fileName.replace('.pdf', '')}_extracted.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [extractionResult]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Content Extractor
        </CardTitle>
        <CardDescription>
          Upload a PDF to extract text and tables with AI-powered recognition
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            disabled={isExtracting}
            className="hidden"
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">
                {isExtracting ? 'Processing PDF...' : 'Choose PDF file'}
              </div>
              <div className="text-xs text-muted-foreground">
                PDF files up to 50MB • Extracts text, tables, and financial data
              </div>
            </div>
          </label>
        </div>

        {/* Progress Bar */}
        {isExtracting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Extracting content...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {extractionResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{extractionResult.totalPages}</div>
                <div className="text-xs text-muted-foreground">Pages</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{extractionResult.tables.length}</div>
                <div className="text-xs text-muted-foreground">Tables</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {extractionResult.tables.filter(t => t.tableType === 'financial').length}
                </div>
                <div className="text-xs text-muted-foreground">Financial</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {(extractionResult.extractionTime / 1000).toFixed(1)}s
                </div>
                <div className="text-xs text-muted-foreground">Time</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={downloadMarkdown} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Markdown
              </Button>
              {onSendToChat && (
                <Button 
                  onClick={() => onSendToChat(extractionResult.text, extractionResult)} 
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send to Chat
                </Button>
              )}
              {onExtractedContent && !onSendToChat && (
                <Badge variant="secondary" className="ml-auto">
                  Content ready for chat
                </Badge>
              )}
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="tables">
                  Tables ({extractionResult.tables.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-2">
                <ScrollArea className="h-60 w-full border rounded-md p-3">
                  <div className="text-sm font-mono whitespace-pre-wrap">
                    {extractionResult.text.substring(0, 1000)}
                    {extractionResult.text.length > 1000 && '...'}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  Showing first 1000 characters. Download full content as markdown.
                </p>
              </TabsContent>
              
              <TabsContent value="tables" className="space-y-3">
                <ScrollArea className="h-60 w-full">
                  {extractionResult.tables.length > 0 ? (
                    extractionResult.tables.map((table, index) => (
                      <div key={index} className="border rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Table2 className="h-4 w-4" />
                          <span className="font-medium">Table {index + 1}</span>
                          <Badge variant={table.tableType === 'financial' ? 'default' : 'secondary'}>
                            {table.tableType}
                          </Badge>
                          <Badge variant="outline">
                            Page {table.page}
                          </Badge>
                          <Badge variant="outline">
                            {(table.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        
                        {/* Table preview */}
                        <div className="text-xs overflow-x-auto">
                          <div className="grid gap-1">
                            {table.headers.length > 0 && (
                              <div className="font-medium border-b pb-1">
                                {table.headers.join(' | ')}
                              </div>
                            )}
                            {table.rows.slice(0, 3).map((row, rowIndex) => (
                              <div key={rowIndex} className="text-muted-foreground">
                                {row.join(' | ')}
                              </div>
                            ))}
                            {table.rows.length > 3 && (
                              <div className="text-muted-foreground italic">
                                ... and {table.rows.length - 3} more rows
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No tables detected in this PDF
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
