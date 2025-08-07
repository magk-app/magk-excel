import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Eye, FileSpreadsheet, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ExcelService } from '../services/excelService';

interface ExcelPreviewProps {
  data: any[];
  filename?: string;
  onClose?: () => void;
  showInDialog?: boolean;
}

export function ExcelPreview({ data, filename = 'export.xlsx', onClose, showInDialog = false }: ExcelPreviewProps) {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      // Get columns from first row
      const cols = Object.keys(data[0]).filter(key => !key.startsWith('_'));
      setColumns(cols);
      
      // Limit preview to first 10 rows
      setPreviewData(data.slice(0, 10));
    }
  }, [data]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await ExcelService.writeExcelFile(data, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Header with file info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-semibold">{filename}</h3>
            <p className="text-sm text-muted-foreground">
              {data.length} rows × {columns.length} columns
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
            variant={downloadSuccess ? "default" : "outline"}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading...' : downloadSuccess ? 'Downloaded!' : 'Download Excel'}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Data preview table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-muted/50">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with preview info */}
      {data.length > 10 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing first 10 rows of {data.length} total rows
        </div>
      )}
    </div>
  );

  if (showInDialog) {
    return (
      <Dialog open={true} onOpenChange={() => onClose?.()}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Excel File Preview</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Excel Preview</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

// Inline Excel preview for chat messages
export function InlineExcelPreview({ data, filename }: { data: any[]; filename: string }) {
  const [showDialog, setShowDialog] = useState(false);
  
  if (!data || data.length === 0) return null;
  
  const columns = Object.keys(data[0]).filter(key => !key.startsWith('_'));
  const previewRows = data.slice(0, 3);
  
  return (
    <>
      <div className="my-3 p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{filename}</span>
            <Badge variant="secondary" className="text-xs">
              {data.length} rows
            </Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowDialog(true)}>
            <Eye className="h-3 w-3 mr-1" />
            Preview & Download
          </Button>
        </div>
        
        {/* Mini preview */}
        <div className="text-xs border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {columns.slice(0, 4).map(col => (
                  <th key={col} className="px-2 py-1 text-left">
                    {col}
                  </th>
                ))}
                {columns.length > 4 && (
                  <th className="px-2 py-1 text-left">...</th>
                )}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.slice(0, 4).map(col => (
                    <td key={col} className="px-2 py-1">
                      {String(row[col] || '-').substring(0, 20)}
                    </td>
                  ))}
                  {columns.length > 4 && (
                    <td className="px-2 py-1">...</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {showDialog && (
        <ExcelPreview
          data={data}
          filename={filename}
          onClose={() => setShowDialog(false)}
          showInDialog
        />
      )}
    </>
  );
}