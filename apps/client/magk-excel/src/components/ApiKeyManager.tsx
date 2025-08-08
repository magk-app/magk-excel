import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Key, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { loadApiKeys, saveApiKeys, type ApiKeyConfig } from '../utils/apiKeyStorage';
import { claudeFilesService } from '../services/claude/ClaudeFilesService';

// ApiKeyConfig is now imported from utils/apiKeyStorage

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  requiredKeys: string[];
  optionalKeys?: string[];
  onKeysSet: (keys: ApiKeyConfig) => void;
}

const API_KEY_INFO = {
  anthropic: {
    name: 'Anthropic (Claude)',
    url: 'https://console.anthropic.com/settings/keys',
    envVar: 'ANTHROPIC_API_KEY',
    description: 'Required for Claude models'
  },
  openai: {
    name: 'OpenAI',
    url: 'https://platform.openai.com/api-keys',
    envVar: 'OPENAI_API_KEY',
    description: 'Required for GPT models'
  },
  firecrawl: {
    name: 'Firecrawl',
    url: 'https://firecrawl.dev/dashboard',
    envVar: 'FIRECRAWL_API_KEY',
    description: 'Required for web scraping'
  },
  smithery: {
    name: 'Smithery',
    url: 'https://smithery.ai/dashboard',
    envVar: 'SMITHERY_API_KEY',
    description: 'Required for MCP server registry access'
  }
};

export function ApiKeyManager({ isOpen, onClose, requiredKeys, optionalKeys = [], onKeysSet }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing keys using the utility function
    const keys = loadApiKeys();
    setApiKeys(keys);
    
    // Notify parent component of loaded keys
    if (Object.keys(keys).length > 0) {
      onKeysSet(keys);
    }
  }, [onKeysSet]);

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setErrors(prev => ({ ...prev, [provider]: '' }));
    setSaved(false);
  };

  const validateAndSave = () => {
    const newErrors: Record<string, string> = {};
    
    // Only validate required keys, not optional ones
    requiredKeys.forEach(key => {
      if (!apiKeys[key] || apiKeys[key]!.trim() === '') {
        newErrors[key] = 'This API key is required';
      } else if (apiKeys[key]!.length < 20) {
        newErrors[key] = 'API key seems too short';
      }
    });
    
    // Validate optional keys only if they are provided
    optionalKeys.forEach(key => {
      if (apiKeys[key] && apiKeys[key]!.trim() !== '' && apiKeys[key]!.length < 20) {
        newErrors[key] = 'API key seems too short';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save using the utility function
    saveApiKeys(apiKeys);
    
    // Set API key for Claude Files Service if anthropic key is provided
    if (apiKeys.anthropic) {
      claudeFilesService.setApiKey(apiKeys.anthropic);
    }
    
    setSaved(true);
    onKeysSet(apiKeys);
    
    // Auto close after 1.5 seconds
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const getMissingKeys = () => {
    return requiredKeys.filter(key => !apiKeys[key] || apiKeys[key]!.trim() === '');
  };

  const missingKeys = getMissingKeys();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Configuration
          </DialogTitle>
          <DialogDescription>
            {requiredKeys.length > 0 
              ? `Please configure at least the required API keys to continue. Optional keys can be added later.`
              : 'Manage your API keys for various services'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Required Keys */}
          {requiredKeys.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Required API Keys</h3>
              {requiredKeys.map(key => {
                const info = API_KEY_INFO[key as keyof typeof API_KEY_INFO];
                if (!info) return null;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {info.name} <span className="text-red-500">*</span>
                      </label>
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Get API Key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <Input
                      type="password"
                      placeholder={`Enter your ${info.name} API key`}
                      value={apiKeys[key] || ''}
                      onChange={(e) => handleKeyChange(key, e.target.value)}
                      className={errors[key] ? 'border-red-500' : ''}
                    />
                    {errors[key] && (
                      <p className="text-xs text-red-500">{errors[key]}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {info.description} • Environment variable: {info.envVar}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Optional Keys */}
          {optionalKeys.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Optional API Keys</h3>
              {optionalKeys.map(key => {
                const info = API_KEY_INFO[key as keyof typeof API_KEY_INFO];
                if (!info) return null;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {info.name} <span className="text-gray-400">(Optional)</span>
                      </label>
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Get API Key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <Input
                      type="password"
                      placeholder={`Enter your ${info.name} API key (optional)`}
                      value={apiKeys[key] || ''}
                      onChange={(e) => handleKeyChange(key, e.target.value)}
                      className={errors[key] ? 'border-red-500' : ''}
                    />
                    {errors[key] && (
                      <p className="text-xs text-red-500">{errors[key]}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {info.description} • Environment variable: {info.envVar}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {missingKeys.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm">
              <strong>Missing API Keys:</strong> {missingKeys.join(', ')}
              <br />
              These keys are required for the selected features to work properly.
            </AlertDescription>
          </Alert>
        )}

        {saved && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm">
              API keys saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={validateAndSave}>
            Save API Keys
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>({});
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  useEffect(() => {
    // Load from storage using the utility function
    const keys = loadApiKeys();
    setApiKeys(keys);
  }, []);

  const checkRequiredKeys = useCallback((required: string[]): string[] => {
    const missing = required.filter(key => !apiKeys[key] || apiKeys[key]!.trim() === '');
    setMissingKeys(missing);
    return missing;
  }, [apiKeys]);

  const updateApiKeys = useCallback((keys: ApiKeyConfig) => {
    setApiKeys(keys);
    saveApiKeys(keys);
    
    // Set API key for Claude Files Service if anthropic key is provided
    if (keys.anthropic) {
      claudeFilesService.setApiKey(keys.anthropic);
    }
  }, []);

  return {
    apiKeys,
    missingKeys,
    checkRequiredKeys,
    updateApiKeys
  };
}