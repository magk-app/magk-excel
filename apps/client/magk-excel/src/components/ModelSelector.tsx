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

export interface ModelConfig {
  model: string;
  displayName: string;
  enableThinking: boolean;
}

interface ModelSelectorProps {
  currentModel: ModelConfig;
  onModelChange: (config: ModelConfig) => void;
}

const AVAILABLE_MODELS = [
  { value: 'eliza-4.0', displayName: 'Eliza 4.0', baseModel: 'claude-3-5-sonnet-20241022' },
  { value: 'eliza-3.5', displayName: 'Eliza 3.5', baseModel: 'claude-3-5-sonnet-20240620' },
];

export function ModelSelector({ currentModel, onModelChange }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState(currentModel.model);
  const [enableThinking, setEnableThinking] = useState(currentModel.enableThinking);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Map the current model back to the selector value
    const currentModelConfig = AVAILABLE_MODELS.find(m => m.baseModel === currentModel.model);
    if (currentModelConfig) {
      setSelectedModel(currentModelConfig.value);
    }
    setEnableThinking(currentModel.enableThinking);
  }, [currentModel]);

  const handleSave = () => {
    const selectedModelConfig = AVAILABLE_MODELS.find(m => m.value === selectedModel);
    if (selectedModelConfig) {
      onModelChange({
        model: selectedModelConfig.baseModel,
        displayName: `${selectedModelConfig.displayName}${enableThinking ? ' (Thinking)' : ''}`,
        enableThinking,
      });
    }
    setIsOpen(false);
  };

  const currentModelDisplay = AVAILABLE_MODELS.find(m => 
    m.baseModel === currentModel.model
  )?.displayName || 'Eliza 4.0';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span className="text-xs">🤖</span>
          <span className="text-xs font-medium">
            {currentModelDisplay}
            {currentModel.enableThinking && ' 💭'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Model Settings</DialogTitle>
          <DialogDescription>
            Choose your AI assistant model and configure thinking mode.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <div
                  key={model.value}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedModel === model.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedModel(model.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{model.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.value === 'eliza-4.0' 
                          ? 'Latest model with advanced capabilities'
                          : 'Stable model with proven performance'}
                      </div>
                    </div>
                    <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                      {selectedModel === model.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thinking Mode Toggle */}
          <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border">
            <div className="space-y-0.5">
              <label htmlFor="thinking-mode" className="text-sm font-medium">
                Thinking Mode
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

          {/* Thinking Mode Explanation */}
          {enableThinking && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-xs space-y-1">
                <div className="font-medium">💭 Thinking Mode Active</div>
                <div className="text-muted-foreground">
                  The model will show its reasoning process before providing answers.
                  This is helpful for complex problems but may increase response time.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}