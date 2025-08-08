import React, { memo, useState } from 'react';
import { MessageSquare, Menu, Settings, Server, Download, Cog, FileIcon, Code2, Key, TestTube } from 'lucide-react';
import { Button } from './ui/button';
import { ModelSelector, ModelConfig } from './ModelSelector';
import { MCPServerToggle } from './MCPServerToggle';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

interface ChatHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  sessionTitle: string;
  messageCount: number;
  enabledServersCount: number;
  modelConfig: ModelConfig;
  onModelChange: (config: ModelConfig) => void;
  hasExcelFiles: boolean;
  toolCallsCount: number;
  onOpenToolMonitor: () => void;
  onExportToExcel: () => void;
  onTogglePDFPanel: () => void;
  onToggleForceExecutor?: () => void;
  forceExecutorEnabled?: boolean;
  mcpToolCallsCount?: number;
  onToggleMCPStatus?: () => void;
  onOpenFilePersistence?: () => void;
  onOpenApiKeys?: () => void;
  onToggleDevTestPanel?: () => void;
  children?: React.ReactNode;
}

export const ChatHeader = memo(function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
  sessionTitle,
  messageCount,
  enabledServersCount,
  modelConfig,
  onModelChange,
  hasExcelFiles,
  toolCallsCount,
  onOpenToolMonitor,
  onExportToExcel,
  onTogglePDFPanel,
  onToggleForceExecutor,
  forceExecutorEnabled = false,
  mcpToolCallsCount = 0,
  onToggleMCPStatus,
  onOpenFilePersistence,
  onOpenApiKeys,
  onToggleDevTestPanel,
  children
}: ChatHeaderProps) {
  const [showMCPDialog, setShowMCPDialog] = useState(false);

  return (
    <>
      <div className="h-14 border-b bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <MessageSquare className="h-5 w-5" />
          <div>
            <h1 className="text-lg font-semibold">{sessionTitle}</h1>
            {messageCount > 0 && (
              <p className="text-xs text-muted-foreground">{messageCount} messages</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Demo Controls */}
          {children}
          
          {/* Action Buttons */}
          {hasExcelFiles && (
            <Button size="sm" variant="outline" onClick={onExportToExcel}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={onTogglePDFPanel}>
            PDF Extract
          </Button>

          {onToggleForceExecutor && (
            <Button size="sm" variant={forceExecutorEnabled ? 'default' : 'outline'} onClick={onToggleForceExecutor}>
              <Code2 className="h-4 w-4 mr-1" />
              Code Run {forceExecutorEnabled ? 'ON' : 'OFF'}
            </Button>
          )}
          
          {/* File Persistence Button */}
          {onOpenFilePersistence && (
            <Button size="sm" variant="outline" onClick={onOpenFilePersistence}>
              <FileIcon className="h-4 w-4 mr-1" />
              Files
            </Button>
          )}
          
          {/* API Keys Button */}
          {onOpenApiKeys && (
            <Button size="sm" variant="outline" onClick={onOpenApiKeys} title="Configure API Keys">
              <Key className="h-4 w-4 mr-1" />
              API Keys
            </Button>
          )}
          
          {/* Developer Test Panel Button */}
          {process.env.NODE_ENV === 'development' && onToggleDevTestPanel && (
            <Button size="sm" variant="outline" onClick={onToggleDevTestPanel} title="Open Developer Test Panel">
              <TestTube className="h-4 w-4 mr-1" />
              Dev Tests
            </Button>
          )}
          
          {/* MCP Servers Status */}
          <Dialog open={showMCPDialog} onOpenChange={setShowMCPDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="relative">
                <Server className="h-4 w-4 mr-1" />
                Servers ({enabledServersCount})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <MCPServerToggle />
            </DialogContent>
          </Dialog>
          
          <ModelSelector 
            currentModel={modelConfig} 
            onModelChange={onModelChange}
          />
          
          {/* MCP Tool Status Button */}
          {mcpToolCallsCount > 0 && onToggleMCPStatus && (
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleMCPStatus}
              className="relative"
            >
              <Cog className="h-4 w-4 mr-1" />
              MCP ({mcpToolCallsCount})
              {mcpToolCallsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </Button>
          )}

          {toolCallsCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenToolMonitor}
              className="relative"
            >
              <Settings className="h-4 w-4 mr-1" />
              Tools ({toolCallsCount})
            </Button>
          )}
        </div>
      </div>
    </>
  );
});