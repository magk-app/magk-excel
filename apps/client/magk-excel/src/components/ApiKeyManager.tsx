import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Key, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface ApiKeyConfig {
  anthropic?: string;
  openai?: string;
  firecrawl?: string;
  [key: string]: string | undefined;
}

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  requiredKeys: string[];
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
  }
};

export function ApiKeyManager({ isOpen, onClose, requiredKeys, onKeysSet }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing keys from localStorage
    const savedKeys = localStorage.getItem('magk_api_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(parsed);
      } catch (e) {
        console.error('Failed to parse saved API keys');
      }
    }
  }, []);

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setErrors(prev => ({ ...prev, [provider]: '' }));
    setSaved(false);
  };

  const validateAndSave = () => {
    const newErrors: Record<string, string> = {};
    
    requiredKeys.forEach(key => {
      if (!apiKeys[key] || apiKeys[key]!.trim() === '') {
        newErrors[key] = 'This API key is required';
      } else if (apiKeys[key]!.length < 20) {
        newErrors[key] = 'API key seems too short';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save to localStorage
    localStorage.setItem('magk_api_keys', JSON.stringify(apiKeys));
    
    // Also save to sessionStorage for immediate use
    sessionStorage.setItem('magk_api_keys', JSON.stringify(apiKeys));
    
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
            {missingKeys.length > 0 
              ? `Please configure the following API keys to continue:`
              : 'Manage your API keys for various services'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {requiredKeys.map(key => {
            const info = API_KEY_INFO[key as keyof typeof API_KEY_INFO];
            if (!info) return null;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {info.name}
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
    // Load from localStorage
    const saved = localStorage.getItem('magk_api_keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setApiKeys(parsed);
      } catch (e) {
        console.error('Failed to load API keys');
      }
    }
  }, []);

  const checkRequiredKeys = useCallback((required: string[]): string[] => {
    const missing = required.filter(key => !apiKeys[key] || apiKeys[key]!.trim() === '');
    setMissingKeys(missing);
    return missing;
  }, [apiKeys]);

  const updateApiKeys = useCallback((keys: ApiKeyConfig) => {
    setApiKeys(keys);
    localStorage.setItem('magk_api_keys', JSON.stringify(keys));
  }, []);

  return {
    apiKeys,
    missingKeys,
    checkRequiredKeys,
    updateApiKeys
  };
}