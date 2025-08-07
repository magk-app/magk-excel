import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { RefreshCw } from 'lucide-react';

export interface ModelConfig {
  provider: string;
  model: string;
  displayName: string;
  enableThinking: boolean;
  temperature?: number;
  maxTokens?: number;
  // API keys should only be managed server-side via environment variables
}

interface ModelSelectorProps {
  currentModel: ModelConfig;
  onModelChange: (config: ModelConfig) => void;
}

interface ModelInfo {
  value: string;
  displayName: string;
  baseModel: string;
  provider: string;
  contextWindow: number;
  features: string[];
  tier: 'flagship' | 'fast' | 'mini' | 'local';
  supportsThinking?: boolean;
  requiresApiKey?: boolean;
  description: string;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  // Eliza Models (Custom tuned based on Claude Sonnet)
  {
    value: 'eliza-4.0',
    displayName: 'Eliza 4.0',
    baseModel: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    contextWindow: 200000,
    features: ['Excel-Expert', 'Fast', 'Data-Analysis', 'Workflow'],
    tier: 'flagship',
    supportsThinking: true,
    requiresApiKey: true,
    description: 'Excel and data workflow specialist - optimized for spreadsheet tasks'
  },
  {
    value: 'eliza-3.5',
    displayName: 'Eliza 3.5',
    baseModel: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    contextWindow: 200000,
    features: ['Balanced', 'Reliable', 'Excel', 'Fast'],
    tier: 'fast',
    supportsThinking: true,
    requiresApiKey: true,
    description: 'Efficient Excel assistant - balanced performance and cost'
  },
  // Claude Models (Anthropic) - Latest versions as of Dec 2024
  {
    value: 'claude-3-5-sonnet-latest',
    displayName: 'Claude 3.5 Sonnet (Latest)',
    baseModel: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    contextWindow: 200000,
    features: ['Best-Coding', 'Vision', 'Computer-Use', 'Fast'],
    tier: 'flagship',
    supportsThinking: true,
    requiresApiKey: true,
    description: 'Latest and most capable Claude model - 2x faster than Opus'
  },
  {
    value: 'claude-3-5-haiku',
    displayName: 'Claude 3.5 Haiku',
    baseModel: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    contextWindow: 200000,
    features: ['Fast', 'Efficient', 'Coding', 'Low-cost'],
    tier: 'fast',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Fastest Claude model - outperforms Claude 3 Opus on many tasks'
  },
  {
    value: 'claude-3-opus',
    displayName: 'Claude 3 Opus',
    baseModel: 'claude-3-opus-20240229',
    provider: 'anthropic',
    contextWindow: 200000,
    features: ['Complex-reasoning', 'Research', 'Analysis'],
    tier: 'flagship',
    supportsThinking: true,
    requiresApiKey: true,
    description: 'Powerful model for highly complex tasks'
  },
  {
    value: 'claude-3-sonnet',
    displayName: 'Claude 3 Sonnet',
    baseModel: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    contextWindow: 200000,
    features: ['Balanced', 'Reliable', 'Vision'],
    tier: 'fast',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Balanced performance and speed'
  },
  
  // OpenAI Models - Including O3 (Dec 2024)
  {
    value: 'o3-mini',
    displayName: 'O3-mini',
    baseModel: 'o3-mini',
    provider: 'openai',
    contextWindow: 128000,
    features: ['Advanced-Reasoning', 'Math', 'Coding', 'Science'],
    tier: 'fast',
    supportsThinking: true,
    requiresApiKey: true,
    description: 'Latest reasoning model - available to all users (Jan 2025)'
  },
  {
    value: 'gpt-4o',
    displayName: 'GPT-4o',
    baseModel: 'gpt-4o',
    provider: 'openai',
    contextWindow: 128000,
    features: ['Multimodal', 'Fast', 'Vision', 'Audio'],
    tier: 'flagship',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Multimodal flagship with vision and audio'
  },
  {
    value: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    baseModel: 'gpt-4o-mini',
    provider: 'openai',
    contextWindow: 128000,
    features: ['Fast', 'Affordable', 'Vision'],
    tier: 'mini',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Small, affordable model for fast tasks'
  },
  {
    value: 'o1-preview',
    displayName: 'o1-preview',
    baseModel: 'o1-preview',
    provider: 'openai',
    contextWindow: 128000,
    features: ['Reasoning', 'Math', 'Science', 'Coding'],
    tier: 'flagship',
    supportsThinking: true,
    requiresApiKey: true,
    description: 'Advanced reasoning with private chain-of-thought'
  },
  {
    value: 'o1-mini',
    displayName: 'o1-mini',
    baseModel: 'o1-mini',
    provider: 'openai',
    contextWindow: 128000,
    features: ['Reasoning', 'Fast', 'STEM'],
    tier: 'fast',
    supportsThinking: true,
    requiresApiKey: true,
    description: 'Faster reasoning model for STEM tasks'
  },
  
  // Google Models - Including Gemini 2.0 Flash Thinking (Dec 2024)
  {
    value: 'gemini-2.0-flash-thinking',
    displayName: 'Gemini 2.0 Flash Thinking',
    baseModel: 'gemini-2.0-flash-thinking-exp-1219',
    provider: 'google',
    contextWindow: 32767,
    features: ['Visible-Reasoning', 'Math', 'Coding', 'Multimodal'],
    tier: 'flagship',
    supportsThinking: true,
    requiresApiKey: true,
    description: '#1 on Chatbot Arena - shows its thoughts explicitly'
  },
  {
    value: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    baseModel: 'gemini-2.0-flash-exp',
    provider: 'google',
    contextWindow: 1000000,
    features: ['Multimodal', 'Fast', 'Vision', 'Long-context'],
    tier: 'fast',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Fast multimodal model with native tool use'
  },
  {
    value: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    baseModel: 'gemini-1.5-pro-002',
    provider: 'google',
    contextWindow: 2000000,
    features: ['2M-context', 'Multimodal', 'Vision', 'Audio'],
    tier: 'flagship',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Best for massive documents and long context'
  },
  {
    value: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    baseModel: 'gemini-1.5-flash-002',
    provider: 'google',
    contextWindow: 1000000,
    features: ['Fast', 'Efficient', 'Vision', '1M-context'],
    tier: 'mini',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Fast and cost-effective for high-volume tasks'
  },
  
  // Meta Models
  {
    value: 'llama-3.3-70b',
    displayName: 'Llama 3.3 70B',
    baseModel: 'llama-3.3-70b-instruct',
    provider: 'meta',
    contextWindow: 128000,
    features: ['Open-source', 'Versatile', 'Coding'],
    tier: 'flagship',
    supportsThinking: false,
    requiresApiKey: false,
    description: 'Powerful open-source model'
  },
  {
    value: 'llama-3.2-90b',
    displayName: 'Llama 3.2 90B',
    baseModel: 'llama-3.2-90b-vision-instruct',
    provider: 'meta',
    contextWindow: 128000,
    features: ['Vision', 'Open-source', 'Multimodal'],
    tier: 'flagship',
    supportsThinking: false,
    requiresApiKey: false,
    description: 'Multimodal open-source model with vision'
  },
  
  // Mistral Models
  {
    value: 'mistral-large',
    displayName: 'Mistral Large',
    baseModel: 'mistral-large-latest',
    provider: 'mistral',
    contextWindow: 128000,
    features: ['Reasoning', 'Coding', 'Multilingual'],
    tier: 'flagship',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Top-tier reasoning and coding capabilities'
  },
  {
    value: 'codestral',
    displayName: 'Codestral',
    baseModel: 'codestral-latest',
    provider: 'mistral',
    contextWindow: 32000,
    features: ['Coding', 'Fill-in-middle', '80+ languages'],
    tier: 'fast',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Specialized for code generation'
  },
  
  // Amazon Models
  {
    value: 'nova-pro',
    displayName: 'Amazon Nova Pro',
    baseModel: 'amazon-nova-pro',
    provider: 'amazon',
    contextWindow: 300000,
    features: ['Multimodal', 'Video', 'Cost-effective'],
    tier: 'flagship',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Multimodal model with video understanding'
  },
  {
    value: 'nova-lite',
    displayName: 'Amazon Nova Lite',
    baseModel: 'amazon-nova-lite',
    provider: 'amazon',
    contextWindow: 300000,
    features: ['Fast', 'Cost-effective', 'Text'],
    tier: 'mini',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Very fast and cost-effective text model'
  },
  
  // xAI Models
  {
    value: 'grok-2',
    displayName: 'Grok 2',
    baseModel: 'grok-2-1212',
    provider: 'xai',
    contextWindow: 128000,
    features: ['Real-time', 'Web-access', 'Unfiltered'],
    tier: 'flagship',
    supportsThinking: false,
    requiresApiKey: true,
    description: 'Real-time knowledge with web access'
  },
  
  // Local Models
  {
    value: 'ollama-llama3',
    displayName: 'Llama 3 (Local)',
    baseModel: 'llama3:latest',
    provider: 'ollama',
    contextWindow: 8192,
    features: ['Privacy', 'Offline', 'Free'],
    tier: 'local',
    supportsThinking: false,
    requiresApiKey: false,
    description: 'Run locally with Ollama'
  },
  {
    value: 'ollama-mistral',
    displayName: 'Mistral (Local)',
    baseModel: 'mistral:latest',
    provider: 'ollama',
    contextWindow: 8192,
    features: ['Privacy', 'Offline', 'Fast'],
    tier: 'local',
    supportsThinking: false,
    requiresApiKey: false,
    description: 'Fast local model with Ollama'
  },
  {
    value: 'ollama-deepseek',
    displayName: 'DeepSeek Coder (Local)',
    baseModel: 'deepseek-coder:latest',
    provider: 'ollama',
    contextWindow: 16384,
    features: ['Coding', 'Privacy', 'Offline'],
    tier: 'local',
    supportsThinking: false,
    requiresApiKey: false,
    description: 'Specialized coding model running locally'
  }
];

const PROVIDER_INFO: Record<string, { name: string; icon: string; color: string }> = {
  anthropic: { name: 'Anthropic', icon: '🔴', color: 'text-red-600' },
  openai: { name: 'OpenAI', icon: '🟢', color: 'text-green-600' },
  google: { name: 'Google', icon: '🔵', color: 'text-blue-600' },
  meta: { name: 'Meta', icon: '🟣', color: 'text-purple-600' },
  mistral: { name: 'Mistral', icon: '🟠', color: 'text-orange-600' },
  amazon: { name: 'AWS', icon: '🟡', color: 'text-yellow-600' },
  xai: { name: 'xAI', icon: '⚫', color: 'text-gray-600' },
  ollama: { name: 'Local', icon: '🏠', color: 'text-indigo-600' }
};

const TIER_BADGES = {
  flagship: { label: 'Flagship', className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
  fast: { label: 'Fast', className: 'bg-blue-500 text-white' },
  mini: { label: 'Mini', className: 'bg-green-500 text-white' },
  local: { label: 'Local', className: 'bg-gray-500 text-white' }
};

export function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState(currentModel?.model || 'eliza-4.0');
  const [selectedProvider, setSelectedProvider] = useState<string>(currentModel?.provider || 'anthropic');
  const [enableThinking, setEnableThinking] = useState(currentModel?.enableThinking || false);
  const [temperature, setTemperature] = useState(currentModel?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(currentModel?.maxTokens || 4096);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'models' | 'settings' | 'keys'>('models');
  const [availableProviders, setAvailableProviders] = useState<Set<string>>(new Set());
  const [backendModels, setBackendModels] = useState<string[]>([]);
  const [modelAvailability, setModelAvailability] = useState<Record<string, boolean>>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  useEffect(() => {
    // Map the current model back to the selector value
    const currentModelConfig = AVAILABLE_MODELS.find(m => m.baseModel === currentModel.model);
    if (currentModelConfig) {
      setSelectedModel(currentModelConfig.value);
      setSelectedProvider(currentModelConfig.provider);
    }
    setEnableThinking(currentModel.enableThinking);
    setTemperature(currentModel.temperature || 0.7);
    setMaxTokens(currentModel.maxTokens || 4096);
    
    // Load saved API keys from localStorage
    const savedKeys = localStorage.getItem('magk-api-keys');
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      setApiKeys(keys);
      checkModelAvailability(keys);
    }
  }, [currentModel]);

  // Check model availability when dialog opens
  useEffect(() => {
    if (isOpen && !isCheckingAvailability) {
      checkModelAvailability(apiKeys);
    }
  }, [isOpen]);

  const checkModelAvailability = async (keys: Record<string, string>) => {
    setIsCheckingAvailability(true);
    const availability: Record<string, boolean> = {};
    const providers = new Set<string>();

    // Check which providers have API keys
    AVAILABLE_MODELS.forEach(model => {
      if (model.requiresApiKey) {
        const hasKey = keys[model.provider] && keys[model.provider].trim() !== '';
        availability[model.value] = hasKey;
        if (hasKey) {
          providers.add(model.provider);
        }
      } else {
        // Local models or models without API key requirement
        availability[model.value] = true;
        if (model.provider === 'ollama') {
          // Check if Ollama is running
          checkOllamaAvailability().then(available => {
            availability[model.value] = available;
          });
        } else {
          providers.add(model.provider);
        }
      }
    });

    setAvailableProviders(providers);
    setModelAvailability(availability);

    // Check backend for supported models
    try {
      const response = await fetch('http://localhost:3000/api/models', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      }).catch(() => null);

      if (response?.ok) {
        const data = await response.json();
        if (data.models) {
          setBackendModels(data.models);
          // Update availability based on backend support
          AVAILABLE_MODELS.forEach(model => {
            if (data.models.includes(model.baseModel)) {
              availability[model.value] = availability[model.value] !== false;
            }
          });
        }
      }
    } catch (error) {
      console.warn('Could not fetch backend models:', error);
    }

    setModelAvailability(availability);
    setIsCheckingAvailability(false);
  };

  const checkOllamaAvailability = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSave = () => {
    const selectedModelConfig = AVAILABLE_MODELS.find(m => m.value === selectedModel);
    if (selectedModelConfig) {
      // Save API keys to localStorage
      localStorage.setItem('magk-api-keys', JSON.stringify(apiKeys));
      
      // For Eliza models, add (Thinking) to the display name when thinking is enabled
      const displayName = selectedModelConfig.displayName.startsWith('Eliza') 
        ? `${selectedModelConfig.displayName}${enableThinking && selectedModelConfig.supportsThinking ? ' (Thinking)' : ''}`
        : `${selectedModelConfig.displayName}${enableThinking && selectedModelConfig.supportsThinking ? ' (Thinking)' : ''}`;
      
      onModelChange({
        provider: selectedModelConfig.provider,
        model: selectedModelConfig.baseModel,
        displayName: displayName,
        enableThinking: enableThinking && (selectedModelConfig.supportsThinking || false),
        temperature,
        maxTokens,
        apiKey: apiKeys[selectedModelConfig.provider]
      });
    }
    setIsOpen(false);
  };

  const currentModelInfo = AVAILABLE_MODELS.find(m => 
    m.baseModel === currentModel.model
  ) || AVAILABLE_MODELS[0];
  
  const filteredModels = selectedProvider === 'all' 
    ? AVAILABLE_MODELS 
    : AVAILABLE_MODELS.filter(m => m.provider === selectedProvider);
    
  const providers = Array.from(new Set(AVAILABLE_MODELS.map(m => m.provider)));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-3">
          <span className="text-sm">
            {PROVIDER_INFO[currentModelInfo.provider]?.icon || '🤖'}
          </span>
          <span className="text-xs font-medium">
            {currentModelInfo.displayName}
            {currentModel.enableThinking && currentModelInfo.supportsThinking && ' 💭'}
          </span>
          <Badge className={`ml-1 text-xs px-1 py-0 h-4 ${TIER_BADGES[currentModelInfo.tier].className}`}>
            {TIER_BADGES[currentModelInfo.tier].label}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>AI Model Configuration</DialogTitle>
          <DialogDescription>
            Select your AI provider and model, configure parameters, and manage API keys.
          </DialogDescription>
        </DialogHeader>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b mb-4">
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'models' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Models
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'settings' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'keys' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            API Keys
          </button>
        </div>
        
        <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
          {/* Models Tab */}
          {activeTab === 'models' && (
            <>
              {/* Provider Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedProvider === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedProvider('all')}
                >
                  All Providers
                </Button>
                {providers.map(provider => (
                  <Button
                    key={provider}
                    variant={selectedProvider === provider ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedProvider(provider)}
                    className="gap-1"
                  >
                    <span>{PROVIDER_INFO[provider].icon}</span>
                    {PROVIDER_INFO[provider].name}
                  </Button>
                ))}
              </div>
              
              {/* Model Grid */}
              <div className="grid gap-2">
                {filteredModels.map((model) => {
                  const isAvailable = modelAvailability[model.value] !== false;
                  const needsApiKey = model.requiresApiKey && !apiKeys[model.provider];
                  
                  return (
                    <div
                      key={model.value}
                      className={`p-3 rounded-lg border transition-all ${
                        !isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
                      } ${
                        selectedModel === model.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedModel(model.value);
                          if (!model.supportsThinking) {
                            setEnableThinking(false);
                          }
                        } else if (needsApiKey) {
                          setActiveTab('keys');
                        }
                      }}
                    >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={PROVIDER_INFO[model.provider].color}>
                            {PROVIDER_INFO[model.provider].icon}
                          </span>
                          <span className="font-medium">{model.displayName}</span>
                          <Badge className={`text-xs px-1.5 py-0 h-5 ${TIER_BADGES[model.tier].className}`}>
                            {TIER_BADGES[model.tier].label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {model.description}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {model.features.map(feature => (
                            <Badge key={feature} variant="secondary" className="text-xs px-1.5 py-0">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Context: {(model.contextWindow / 1000).toFixed(0)}K</span>
                          {model.supportsThinking && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              💭 Thinking
                            </Badge>
                          )}
                          {model.requiresApiKey && (
                            <Badge 
                              variant={apiKeys[model.provider] ? "outline" : "destructive"} 
                              className="text-xs px-1.5 py-0"
                            >
                              🔑 {apiKeys[model.provider] ? 'API Key Set' : 'API Key Required'}
                            </Badge>
                          )}
                          {!isAvailable && model.provider === 'ollama' && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              Ollama Offline
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0 mt-1">
                        {selectedModel === model.value && (
                          <div className="h-3 w-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              
              {/* Status bar */}
              <div className="flex items-center justify-between px-2 py-2">
                <div className="text-xs text-muted-foreground">
                  {isCheckingAvailability ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Checking model availability...
                    </span>
                  ) : (
                    <span>
                      {Object.values(modelAvailability).filter(v => v).length} of {AVAILABLE_MODELS.length} models available
                      {backendModels.length > 0 && ` • ${backendModels.length} backend models detected`}
                    </span>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 px-2"
                  onClick={() => checkModelAvailability(apiKeys)}
                  disabled={isCheckingAvailability}
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingAvailability ? 'animate-spin' : ''}`} />
                  <span className="ml-1 text-xs">Refresh</span>
                </Button>
              </div>
            </>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Thinking Mode Toggle */}
              {AVAILABLE_MODELS.find(m => m.value === selectedModel)?.supportsThinking && (
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
                  <div className="space-y-0.5">
                    <label htmlFor="thinking-mode" className="text-sm font-medium">
                      💭 Thinking Mode
                    </label>
                    <div className="text-xs text-muted-foreground">
                      Enable step-by-step reasoning for complex tasks
                    </div>
                  </div>
                  <Switch
                    id="thinking-mode"
                    checked={enableThinking}
                    onCheckedChange={setEnableThinking}
                  />
                </div>
              )}
              
              {/* Temperature Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Temperature</label>
                  <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Focused</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>
              
              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <span className="text-sm text-muted-foreground">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="32768"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>256</span>
                  <span>16K</span>
                  <span>32K</span>
                </div>
              </div>
              
              {/* Model Info */}
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Selected Model:</strong> {AVAILABLE_MODELS.find(m => m.value === selectedModel)?.displayName}
                  <br />
                  <strong>Provider:</strong> {PROVIDER_INFO[AVAILABLE_MODELS.find(m => m.value === selectedModel)?.provider || 'anthropic'].name}
                  <br />
                  <strong>Context Window:</strong> {((AVAILABLE_MODELS.find(m => m.value === selectedModel)?.contextWindow || 0) / 1000).toFixed(0)}K tokens
                  <br />
                  <strong>Features:</strong> {AVAILABLE_MODELS.find(m => m.value === selectedModel)?.features.join(', ')}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* API Keys Tab */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="text-xs">
                  API keys are stored locally in your browser. They are never sent to our servers.
                  Leave blank to use the default API configuration.
                </AlertDescription>
              </Alert>
              
              {providers.filter(p => p !== 'ollama').map(provider => (
                <div key={provider} className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className={PROVIDER_INFO[provider].color}>
                      {PROVIDER_INFO[provider].icon}
                    </span>
                    {PROVIDER_INFO[provider].name} API Key
                  </label>
                  <Input
                    type="password"
                    placeholder={`Enter your ${PROVIDER_INFO[provider].name} API key (optional)`}
                    value={apiKeys[provider] || ''}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                  />
                  <div className="text-xs text-muted-foreground">
                    {provider === 'anthropic' && 'Get your API key from console.anthropic.com'}
                    {provider === 'openai' && 'Get your API key from platform.openai.com'}
                    {provider === 'google' && 'Get your API key from makersuite.google.com'}
                    {provider === 'mistral' && 'Get your API key from console.mistral.ai'}
                    {provider === 'amazon' && 'Configure AWS credentials for Bedrock access'}
                    {provider === 'xai' && 'Get your API key from x.ai'}
                    {provider === 'meta' && 'Available through various API providers'}
                  </div>
                </div>
              ))}
              
              <Alert className="mt-4">
                <AlertDescription className="text-xs">
                  <strong>Note:</strong> Some models may require additional setup:
                  <ul className="mt-2 ml-4 list-disc">
                    <li>Local models require Ollama to be installed and running</li>
                    <li>AWS models require AWS credentials and Bedrock access</li>
                    <li>Some models may have usage limits or costs associated</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-muted-foreground">
            {Object.entries(modelAvailability)
              .filter(([key, available]) => available && filteredModels.some(m => m.value === key))
              .length} of {filteredModels.length} models ready
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!modelAvailability[selectedModel]}
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}