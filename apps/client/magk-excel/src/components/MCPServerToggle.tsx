import { useEffect, useState } from 'react';
import { useMCPStore } from '../services/mcpService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Loader2, Server, AlertCircle, Plus, ExternalLink, Trash2, Settings } from 'lucide-react';
import { SmitheryServerBrowser } from './SmitheryServerBrowser';

export function MCPServerToggle() {
  const {
    availableServers,
    enabledServers,
    isLoading,
    error,
    tools,
    initialize,
    toggleServer,
    removeSmitheryServer
  } = useMCPStore();
  
  const [serverConfigs, setServerConfigs] = useState<Record<string, any>>({});
  const [showBrowser, setShowBrowser] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Load server configurations to determine which are Smithery servers
    const loadServerConfigs = async () => {
      const configs: Record<string, any> = {};
      for (const serverName of availableServers) {
        try {
          const config = await window.mcpAPI.getServerConfig(serverName);
          configs[serverName] = config;
        } catch (error) {
          console.warn(`Failed to load config for ${serverName}:`, error);
        }
      }
      setServerConfigs(configs);
    };

    if (availableServers.length > 0) {
      loadServerConfigs();
    }
  }, [availableServers]);

  const handleToggle = async (serverName: string, checked: boolean) => {
    await toggleServer(serverName, checked);
  };

  const handleRemoveServer = async (serverName: string) => {
    if (confirm(`Are you sure you want to remove ${serverName}?`)) {
      await removeSmitheryServer(serverName);
    }
  };

  if (isLoading && availableServers.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Loading MCP servers...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            MCP Servers
          </div>
          <Dialog open={showBrowser} onOpenChange={setShowBrowser}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Browse Registry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
              <SmitheryServerBrowser />
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Enable AI-powered tools for Excel, PDF extraction, and web scraping. Browse the Smithery registry to discover more servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {availableServers.map((serverName) => {
            const isEnabled = enabledServers.includes(serverName);
            const serverTools = tools.filter(t => t.server === serverName);
            const serverConfig = serverConfigs[serverName];
            const isSmithery = serverConfig?.isSmithery;
            const displayName = serverConfig?.displayName || serverName;
            const description = serverConfig?.description;
            
            return (
              <div
                key={serverName}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{displayName}</span>
                    {isSmithery && (
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Smithery
                      </Badge>
                    )}
                    {isEnabled && (
                      <Badge variant="secondary" className="text-xs">
                        {serverTools.length} tools
                      </Badge>
                    )}
                  </div>
                  {description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {description}
                    </div>
                  )}
                  {isEnabled && serverTools.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Tools: {serverTools.slice(0, 3).map(t => t.name).join(', ')}
                      {serverTools.length > 3 && ` +${serverTools.length - 3} more`}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isSmithery && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveServer(serverName)}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      title="Remove server"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(serverName, checked)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {availableServers.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No MCP servers configured</h3>
            <p className="text-sm mb-4">
              Discover and install MCP servers from the Smithery registry to enhance your workflows.
            </p>
            <Button onClick={() => setShowBrowser(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Browse Server Registry
            </Button>
          </div>
        )}

        {availableServers.length > 0 && (
          <div className="text-xs text-muted-foreground flex justify-between items-center pt-2 border-t">
            <span>
              {enabledServers.length} of {availableServers.length} servers enabled
              {tools.length > 0 && ` • ${tools.length} total tools available`}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowBrowser(true)}
              className="text-xs h-6 px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}