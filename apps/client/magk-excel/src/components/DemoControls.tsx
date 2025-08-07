import React, { memo } from 'react';
import { Button } from './ui/button';
import { Play, FileSpreadsheet, FileText } from 'lucide-react';

interface DemoControlsProps {
  onRunHKDemo: () => void;
  onRunPDFDemo: () => void;
  disabled?: boolean;
}

export const DemoControls = memo(function DemoControls({
  onRunHKDemo,
  onRunPDFDemo,
  disabled = false
}: DemoControlsProps) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onRunHKDemo}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <FileSpreadsheet className="h-4 w-4" />
        HK Passenger Demo
      </Button>
      <Button
        size="sm" 
        variant="outline"
        onClick={onRunPDFDemo}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <FileText className="h-4 w-4" />
        PDF Balance Sheet Demo
      </Button>
    </div>
  );
});