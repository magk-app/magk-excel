import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { ModelConfig } from './ModelSelector';

interface ModelCompatibilityCheckProps {
  modelConfig: ModelConfig;
  onModelFallback?: (fallbackModel: string) => void;
}

// Known working models from the error message
const VALIDATED_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-latest', 
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229'
];

// Claude 4 models that should work (from Anthropic docs)
const CLAUDE_4_MODELS = [
  'claude-opus-4-1-20250805',
  'claude-opus-4-20250514',
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219'
];

export const ModelCompatibilityCheck: React.FC<ModelCompatibilityCheckProps> = ({
  modelConfig,
  onModelFallback
}) => {
  const isValidated = VALIDATED_MODELS.includes(modelConfig.model);
  const isClaude4 = CLAUDE_4_MODELS.includes(modelConfig.model);
  
  if (isValidated) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
        <AlertDescription className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            ✓ Validated
          </Badge>
          Model <strong>{modelConfig.model}</strong> is confirmed to work with the current API.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isClaude4) {
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
        <AlertDescription className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
            🧪 Claude 4
          </Badge>
          Model <strong>{modelConfig.model}</strong> is a Claude 4 model with extended thinking support.
          {modelConfig.enableThinking && (
            <Badge className="bg-amber-200 text-amber-900">Thinking Enabled</Badge>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="border-red-200 bg-red-50 dark:bg-red-900/10">
      <AlertDescription className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            ⚠ Unvalidated
          </Badge>
          Model <strong>{modelConfig.model}</strong> may not be supported by the current API.
        </div>
        <div className="text-sm">
          <p className="mb-2">Recommended models:</p>
          <div className="flex flex-wrap gap-1">
            {VALIDATED_MODELS.slice(0, 3).map(model => (
              <button
                key={model}
                onClick={() => onModelFallback?.(model)}
                className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-700"
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};