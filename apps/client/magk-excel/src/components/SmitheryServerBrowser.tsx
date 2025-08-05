import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Download, Settings, ExternalLink, Shield, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { useMCPStore } from '../services/mcpService';
import { SmitheryServerInfo, SmitheryServerDetails, smitheryClient } from '../services/smitheryClient';

interface ServerConfigModalProps {
  server: SmitheryServerInfo;
  onInstall: (qualifiedName: string, config?: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ server, onInstall, onClose }) => {
  const [serverDetails, setServerDetails] = useState<SmitheryServerDetails | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServerDetails = async () => {
      try {
        setLoading(true);
        const details = await smitheryClient.getServerDetails(server.qualifiedName);
        setServerDetails(details);
        
        // Initialize config with default values
        if (details.configSchema?.properties) {
          const defaultConfig: Record<string, any> = {};
          Object.entries(details.configSchema.properties).forEach(([key, schema]: [string, any]) => {
            if (schema.default !== undefined) {
              defaultConfig[key] = schema.default;
            }
          });
          setConfig(defaultConfig);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load server details');
      } finally {
        setLoading(false);
      }
    };

    loadServerDetails();
  }, [server.qualifiedName]);

  const handleInstall = async () => {
    try {
      setInstalling(true);
      setError(null);
      await onInstall(server.qualifiedName, config);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed');
    } finally {
      setInstalling(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderConfigField = (key: string, schema: any) => {
    const value = config[key] || '';
    const isRequired = serverDetails?.configSchema?.required?.includes(key);

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return (
            <select
              value={value}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              className="w-full p-2 border rounded-md"
              required={isRequired}
            >
              <option value="">Select {schema.title || key}</option>
              {schema.enum.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        }
        return (
          <Input
            type={key.toLowerCase().includes('password') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') ? 'password' : 'text'}
            value={value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            placeholder={schema.description || `Enter ${schema.title || key}`}
            required={isRequired}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleConfigChange(key, parseFloat(e.target.value))}
            placeholder={schema.description || `Enter ${schema.title || key}`}
            min={schema.minimum}
            max={schema.maximum}
            required={isRequired}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleConfigChange(key, e.target.checked)}
            className="h-4 w-4"
          />
        );
      default:
        return (
          <Input
            value={JSON.stringify(value)}
            onChange={(e) => {
              try {
                handleConfigChange(key, JSON.parse(e.target.value));
              } catch {
                handleConfigChange(key, e.target.value);
              }
            }}
            placeholder={schema.description || `Enter ${schema.title || key}`}
            required={isRequired}
          />
        );
    }
  };

  if (loading) {
    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Loading Server Details...</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Install {server.displayName}
        </DialogTitle>
        <DialogDescription>
          Configure and install this MCP server to extend your workflow capabilities.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Server Information */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-semibold text-sm text-gray-600">Author</h4>
            <p className="text-sm">{serverDetails?.author || 'Unknown'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-600">Version</h4>
            <p className="text-sm">{serverDetails?.version || 'Latest'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-600">License</h4>
            <p className="text-sm">{serverDetails?.license || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-600">Usage</h4>
            <p className="text-sm flex items-center gap-1">
              <Users className="h-3 w-3" />
              {server.useCount.toLocaleString()} installs
            </p>
          </div>
        </div>

        {/* Configuration */}
        {serverDetails?.configSchema?.properties && Object.keys(serverDetails.configSchema.properties).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
            <div className="space-y-4">
              {Object.entries(serverDetails.configSchema.properties).map(([key, schema]: [string, any]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">
                    {schema.title || key}
                    {serverDetails.configSchema?.required?.includes(key) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {schema.description && (
                    <p className="text-xs text-gray-600 mb-2">{schema.description}</p>
                  )}
                  {renderConfigField(key, schema)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example Configuration */}
        {serverDetails?.exampleConfig && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Example Configuration</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(serverDetails.exampleConfig, null, 2)}
            </pre>
          </div>
        )}

        {/* Documentation Link */}
        {serverDetails?.documentation && (
          <div>
            <Button variant="outline" asChild>
              <a href={serverDetails.documentation} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Documentation
              </a>
            </Button>
          </div>
        )}

        {/* Install Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={installing}>
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={installing}>
            {installing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Installing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Install Server
              </>
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export const SmitheryServerBrowser: React.FC = () => {
  const {
    smitheryServers,
    smitheryLoading,
    smitheryError,
    searchQuery,
    selectedCategory,
    searchSmitheryServers,
    getPopularServers,
    installSmitheryServer,
    setSearchQuery,
    setSelectedCategory
  } = useMCPStore();

  const [selectedServer, setSelectedServer] = useState<SmitheryServerInfo | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<{ configured: boolean; source: string }>({ configured: false, source: 'none' });
  const [categories] = useState([
    'AI & ML',
    'Data & Analytics',
    'Development Tools',
    'Cloud Services',
    'Databases',
    'Communication',
    'File Management',
    'Web Scraping',
    'APIs & Integration',
    'Productivity'
  ]);

  useEffect(() => {
    // Check API key status on mount
    const status = smitheryClient.getApiKeyStatus();
    setApiKeyStatus(status);
    
    // Only load popular servers if API key is configured
    if (status.configured) {
      getPopularServers();
    }
  }, [getPopularServers]);

  const handleConfigureApiKey = () => {
    if (apiKey.trim()) {
      smitheryClient.setApiKey(apiKey.trim());
      const newStatus = smitheryClient.getApiKeyStatus();
      setApiKeyStatus(newStatus);
      setShowApiKeyDialog(false);
      setApiKey('');
      
      // Load popular servers after configuring API key
      getPopularServers();
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchSmitheryServers(query);
    } else {
      await getPopularServers();
    }
  };

  const handleCategoryFilter = async (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      // This would use getServersByCategory, but for now we'll filter locally
      await searchSmitheryServers(`category:${category}`);
    } else {
      await getPopularServers();
    }
  };

  const handleInstallServer = async (qualifiedName: string, config?: Record<string, any>) => {
    try {
      console.log(`🎯 UI: Starting installation of ${qualifiedName}`, config);
      await installSmitheryServer(qualifiedName, config);
      console.log(`✅ UI: Successfully installed ${qualifiedName}`);
    } catch (error) {
      console.error(`❌ UI: Installation failed for ${qualifiedName}:`, error);
      // Error is already handled by the store, just log here for UI debugging
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Smithery Server Registry</h1>
        <p className="text-gray-600">
          Discover and install MCP servers to extend your workflow capabilities with external tools and services.
        </p>
      </div>

      {/* API Key Configuration Alert */}
      {!apiKeyStatus.configured && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Smithery API Key Required:</strong> Configure your API key to browse and install servers from the registry.
              </div>
              <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    Configure API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configure Smithery API Key</DialogTitle>
                    <DialogDescription>
                      Enter your Smithery API key to access the server registry. You can get an API key from{' '}
                      <a href="https://smithery.ai/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        smithery.ai/settings/tokens
                      </a>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Enter your Smithery API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleConfigureApiKey} disabled={!apiKey.trim()}>
                        Save API Key
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Key Status (when configured) */}
      {apiKeyStatus.configured && (
        <div className="mb-6 flex items-center justify-between text-sm text-green-600">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>API Key configured ({apiKeyStatus.source})</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowApiKeyDialog(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            Update Key
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search servers... (e.g., 'web scraping', 'database', 'AI tools')"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryFilter(null)}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {smitheryError && (
        <Alert className="mb-6">
          <AlertDescription>{smitheryError}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {smitheryLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading servers...</span>
        </div>
      )}

      {/* Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {smitheryServers.map((server) => (
          <Card key={server.qualifiedName} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {server.displayName}
                    {server.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {server.description}
                  </CardDescription>
                </div>
                {server.iconUrl && (
                  <img 
                    src={server.iconUrl} 
                    alt={server.displayName}
                    className="w-8 h-8 rounded"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Tags */}
                {server.tags && server.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {server.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {server.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{server.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {server.useCount.toLocaleString()} installs
                  </span>
                  <span className="flex items-center gap-1">
                    {server.remote ? (
                      <>
                        <ExternalLink className="h-3 w-3" />
                        Hosted
                      </>
                    ) : (
                      'Local'
                    )}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedServer(server)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {server.isDeployed ? 'Connect' : 'Install'}
                      </Button>
                    </DialogTrigger>
                    {selectedServer && (
                      <ServerConfigModal
                        server={selectedServer}
                        onInstall={handleInstallServer}
                        onClose={() => setSelectedServer(null)}
                      />
                    )}
                  </Dialog>
                  
                  {server.homepage && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={server.homepage} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                {!server.isDeployed && (
                  <p className="text-xs text-blue-600 mt-2">
                    Local server - requires Smithery CLI
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!smitheryLoading && smitheryServers.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No servers found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or browse different categories.
          </p>
          <Button onClick={() => getPopularServers()}>
            Show Popular Servers
          </Button>
        </div>
      )}
    </div>
  );
};