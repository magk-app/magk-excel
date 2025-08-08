import React, { memo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { FileText, Download, X } from 'lucide-react';

interface PDFExtractionPanelProps {
  isVisible: boolean;
  pdfUrl: string;
  extractionPrompt: string;
  isExtracting: boolean;
  onPdfUrlChange: (url: string) => void;
  onPromptChange: (prompt: string) => void;
  onExtractAll: () => void;
  onExtractSpecific: () => void;
  onCancel: () => void;
  canExtractAll: boolean;
  canExtractSpecific: boolean;
}

export const PDFExtractionPanel = memo(function PDFExtractionPanel({
  isVisible,
  pdfUrl,
  extractionPrompt,
  isExtracting,
  onPdfUrlChange,
  onPromptChange,
  onExtractAll,
  onExtractSpecific,
  onCancel,
  canExtractAll,
  canExtractSpecific
}: PDFExtractionPanelProps) {
  if (!isVisible) return null;

  return (
    <Card className="mx-4 mt-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Extraction
          </div>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Extract data from PDF documents by providing a URL and optional extraction criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">PDF URL</label>
          <Input
            value={pdfUrl}
            onChange={(e) => onPdfUrlChange(e.target.value)}
            placeholder="https://example.com/document.pdf"
            disabled={isExtracting}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">
            Extraction Criteria (Optional)
          </label>
          <Input
            value={extractionPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="e.g., 'Extract all financial data and tables'"
            disabled={isExtracting}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onExtractAll}
            disabled={!canExtractAll}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Extract All Content
          </Button>
          <Button
            onClick={onExtractSpecific}
            disabled={!canExtractSpecific}
            variant="outline"
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Extract Specific Content
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});