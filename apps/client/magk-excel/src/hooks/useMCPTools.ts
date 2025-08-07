import { useState, useEffect, useMemo } from 'react';
import { useMCPStore } from '../services/mcpService';

export interface MCPTool {
  server: string;
  name: string;
  description?: string;
}

export interface ServerStatus {
  availableCount: number;
  enabledCount: number;
  toolsCount: number;
  isLoading: boolean;
  errors: string[];
}

export function useMCPTools() {
  const {
    availableServers,
    enabledServers,
    tools,
    isLoading,
    error,
    initialize
  } = useMCPStore();

  const [mcpServers, setMcpServers] = useState<Record<string, any>>({});

  useEffect(() => {
    initialize();
  }, [initialize]);

  const serverStatus = useMemo((): ServerStatus => ({
    availableCount: availableServers.length,
    enabledCount: enabledServers.length,
    toolsCount: tools.length,
    isLoading,
    errors: error ? [error] : []
  }), [availableServers.length, enabledServers.length, tools.length, isLoading, error]);

  return {
    tools,
    enabledServers,  // Keep it as an array for compatibility
    mcpServers,
    serverStatus,
    availableServers,
    isLoading
  };
}