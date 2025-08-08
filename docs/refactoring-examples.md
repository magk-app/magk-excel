# Architecture Refactoring Examples

## Example 1: Provider Abstraction

### Current Implementation (Problematic)
```typescript
// LLMService - Tightly coupled to specific providers
export class LLMService {
  private anthropic: Anthropic | null = null;

  async chat(message: string, config?: ModelConfig): Promise<string> {
    if (config.provider === 'anthropic') {
      if (config.apiKey) {
        apiClient = new Anthropic({ apiKey: config.apiKey });
      } else if (!this.anthropic) {
        return this.generateMockResponse(message);
      }
    } else {
      // Other providers not implemented
      return this.generateMockResponse(message);
    }
    // ... 200+ lines of provider-specific logic
  }
}
```

### Improved Implementation
```typescript
// Abstract Provider Interface
interface AIProvider {
  createClient(config: ProviderConfig): AIClient;
  validateConfig(config: ProviderConfig): ValidationResult;
  getSupportedModels(): ModelInfo[];
  getName(): string;
}

// Concrete Provider Implementation
class AnthropicProvider implements AIProvider {
  createClient(config: ProviderConfig): AnthropicClient {
    return new AnthropicClient(config);
  }

  validateConfig(config: ProviderConfig): ValidationResult {
    if (!config.apiKey) {
      return { valid: false, error: 'API key required' };
    }
    return { valid: true };
  }

  getSupportedModels(): ModelInfo[] {
    return [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000 },
      // ... other models
    ];
  }

  getName(): string {
    return 'anthropic';
  }
}

// Provider Factory
class ProviderFactory {
  private providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.getName(), provider);
  }

  createClient(providerName: string, config: ProviderConfig): AIClient {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not registered`);
    }
    
    const validation = provider.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.error}`);
    }
    
    return provider.createClient(config);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Usage in LLMService
export class LLMService {
  constructor(private providerFactory: ProviderFactory) {}

  async chat(message: string, config: ModelConfig): Promise<ChatResponse> {
    const client = this.providerFactory.createClient(config.provider, config);
    return client.chat(message, config);
  }
}
```

## Example 2: Component Decomposition

### Current Implementation (ChatInterface - 943 lines)
```typescript
export function ChatInterface() {
  // 50+ state variables
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPDFExtraction, setShowPDFExtraction] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({...});
  // ... 40+ more state variables

  // Business logic mixed with UI
  const handlePDFExtraction = async (extractAll: boolean = false) => {
    // 100+ lines of PDF processing logic
  };

  const runHKPassengerDemo = async () => {
    // 200+ lines of demo orchestration
  };

  // Mixed adapter logic
  const mcpEnhancedAdapter = {
    streamText: (message: string, observer: any) => {
      // 300+ lines of API communication and processing
    }
  };

  return (
    <div className="h-full w-full flex">
      {/* 500+ lines of mixed UI and logic */}
    </div>
  );
}
```

### Improved Implementation
```typescript
// 1. Separate Business Logic
interface ChatOrchestrator {
  processMessage(message: string, context: ChatContext): Promise<ChatResponse>;
  handleFileUpload(files: File[]): Promise<ProcessedFile[]>;
  executeDemo(demo: DemoType): Promise<DemoResult>;
}

class ChatOrchestratorImpl implements ChatOrchestrator {
  constructor(
    private llmService: LLMService,
    private mcpService: MCPService,
    private fileService: FileService
  ) {}

  async processMessage(message: string, context: ChatContext): Promise<ChatResponse> {
    const processedFiles = await this.processAttachments(context.attachments);
    const tools = await this.mcpService.selectRelevantTools(message, context);
    
    return this.llmService.chat(message, {
      history: context.history,
      files: processedFiles,
      tools: tools,
      modelConfig: context.modelConfig
    });
  }

  async handleFileUpload(files: File[]): Promise<ProcessedFile[]> {
    return Promise.all(files.map(file => this.fileService.process(file)));
  }

  private async processAttachments(attachments: FileAttachment[]): Promise<ProcessedFile[]> {
    // Focused file processing logic
  }
}

// 2. Separate UI Components
interface ChatContainerProps {
  orchestrator: ChatOrchestrator;
  sessionManager: SessionManager;
}

export function ChatContainer({ orchestrator, sessionManager }: ChatContainerProps) {
  return (
    <div className="h-full w-full flex">
      <ChatSidebar sessionManager={sessionManager} />
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <ChatMessages />
        <ChatInput onMessage={handleMessage} />
      </div>
    </div>
  );
}

// 3. Feature-Specific Components
function ChatHeader() {
  return (
    <div className="p-3 border-b">
      <ChatTitle />
      <ModelSelector />
      <ActionButtons />
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="flex gap-2">
      <DemoButtons />
      <ExcelExportButton />
      <PDFExtractionButton />
      <ToolMonitorButton />
    </div>
  );
}

// 4. Demo Components
interface DemoManagerProps {
  demos: DemoDefinition[];
  onExecuteDemo: (demo: DemoType) => Promise<DemoResult>;
}

function DemoManager({ demos, onExecuteDemo }: DemoManagerProps) {
  return (
    <>
      {demos.map(demo => (
        <DemoButton
          key={demo.id}
          demo={demo}
          onExecute={() => onExecuteDemo(demo.type)}
        />
      ))}
    </>
  );
}
```

## Example 3: MCP Tool Integration

### Current Implementation (Tightly Coupled)
```typescript
// Mixed AI selection and pattern matching
async function selectMCPToolsWithAI(message: string, mcpTools: any[]): Promise<any[]> {
  try {
    const llmResult = await llmService.chatWithSystem(prompt, '', []);
    // 100+ lines of parsing and validation
    return validTools;
  } catch (error) {
    // Hardcoded fallback logic
    if (message.toLowerCase().includes('excel')) {
      return [{
        server: 'excel',
        tool: 'excel_write_to_sheet',
        args: { /* hardcoded args */ }
      }];
    }
    return [];
  }
}
```

### Improved Implementation
```typescript
// Tool Selection Strategy Interface
interface ToolSelectionStrategy {
  selectTools(request: ToolSelectionRequest): Promise<SelectedTool[]>;
  canHandle(request: ToolSelectionRequest): boolean;
  getPriority(): number;
}

// AI-Powered Strategy
class AIToolSelector implements ToolSelectionStrategy {
  constructor(private llmService: LLMService) {}

  async selectTools(request: ToolSelectionRequest): Promise<SelectedTool[]> {
    const prompt = this.buildSelectionPrompt(request);
    const result = await this.llmService.chat(prompt, { enableThinking: false });
    return this.parseToolSelection(result.response, request.availableTools);
  }

  canHandle(request: ToolSelectionRequest): boolean {
    return this.llmService.isAvailable();
  }

  getPriority(): number {
    return 10; // High priority when AI is available
  }

  private buildSelectionPrompt(request: ToolSelectionRequest): string {
    return `Select appropriate tools for: "${request.message}"
Available tools: ${request.availableTools.map(t => t.name).join(', ')}
Return JSON array with selections.`;
  }

  private parseToolSelection(response: string, availableTools: MCPTool[]): SelectedTool[] {
    // Focused parsing logic
  }
}

// Pattern-Based Fallback Strategy
class PatternToolSelector implements ToolSelectionStrategy {
  private patterns = new Map<RegExp, ToolSelector>();

  constructor() {
    this.patterns.set(
      /excel|spreadsheet|xlsx/i,
      new ExcelToolSelector()
    );
    this.patterns.set(
      /pdf|extract|document/i,
      new PDFToolSelector()
    );
    this.patterns.set(
      /web|scrape|url|website/i,
      new WebScrapingToolSelector()
    );
  }

  async selectTools(request: ToolSelectionRequest): Promise<SelectedTool[]> {
    for (const [pattern, selector] of this.patterns) {
      if (pattern.test(request.message)) {
        return selector.selectTools(request);
      }
    }
    return [];
  }

  canHandle(request: ToolSelectionRequest): boolean {
    return true; // Always available as fallback
  }

  getPriority(): number {
    return 1; // Low priority fallback
  }
}

// Tool Selection Manager
class ToolSelectionManager {
  private strategies: ToolSelectionStrategy[] = [];

  registerStrategy(strategy: ToolSelectionStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  async selectTools(request: ToolSelectionRequest): Promise<SelectedTool[]> {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(request)) {
        try {
          const tools = await strategy.selectTools(request);
          if (tools.length > 0) {
            return tools;
          }
        } catch (error) {
          console.warn(`Tool selection strategy failed:`, error);
          // Continue to next strategy
        }
      }
    }
    return [];
  }
}

// Usage
const toolManager = new ToolSelectionManager();
toolManager.registerStrategy(new AIToolSelector(llmService));
toolManager.registerStrategy(new PatternToolSelector());

const selectedTools = await toolManager.selectTools({
  message: userMessage,
  availableTools: mcpTools,
  context: chatContext
});
```

## Example 4: Configuration Management

### Current Implementation (Scattered Config)
```typescript
// Hardcoded in ModelSelector.tsx
const AVAILABLE_MODELS: ModelInfo[] = [
  {
    value: 'eliza-4.0',
    displayName: 'Eliza 4.0',
    baseModel: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    // ... hardcoded properties
  },
  // ... 30+ more hardcoded models
];

// Scattered state management
const [modelConfig, setModelConfig] = useState<ModelConfig>({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  displayName: 'Eliza 4.0',
  enableThinking: false
});
```

### Improved Implementation
```typescript
// Configuration Schema
interface AppConfiguration {
  models: ModelRegistry;
  providers: ProviderRegistry;
  defaults: DefaultSettings;
  features: FeatureFlags;
}

// Model Registry
interface ModelRegistry {
  registerModel(model: ModelDefinition): void;
  getAvailableModels(provider?: string): ModelInfo[];
  getModelById(id: string): ModelInfo | null;
  getModelCapabilities(id: string): ModelCapabilities;
}

class ModelRegistryImpl implements ModelRegistry {
  private models = new Map<string, ModelDefinition>();
  private providerModels = new Map<string, Set<string>>();

  registerModel(model: ModelDefinition): void {
    this.models.set(model.id, model);
    
    if (!this.providerModels.has(model.provider)) {
      this.providerModels.set(model.provider, new Set());
    }
    this.providerModels.get(model.provider)!.add(model.id);
  }

  getAvailableModels(provider?: string): ModelInfo[] {
    if (provider) {
      const modelIds = this.providerModels.get(provider) || new Set();
      return Array.from(modelIds)
        .map(id => this.models.get(id))
        .filter((model): model is ModelDefinition => model !== undefined)
        .map(model => this.toModelInfo(model));
    }
    
    return Array.from(this.models.values())
      .map(model => this.toModelInfo(model));
  }

  private toModelInfo(model: ModelDefinition): ModelInfo {
    return {
      id: model.id,
      displayName: model.displayName,
      provider: model.provider,
      capabilities: model.capabilities,
      contextWindow: model.limits.maxContextTokens
    };
  }
}

// Configuration Manager
interface ConfigurationManager {
  getModelConfig(): ModelConfig;
  updateModelConfig(config: Partial<ModelConfig>): Promise<void>;
  getProviderSettings(provider: string): ProviderSettings;
  resetToDefaults(): void;
}

class ConfigurationManagerImpl implements ConfigurationManager {
  constructor(
    private modelRegistry: ModelRegistry,
    private storage: ConfigStorage
  ) {}

  getModelConfig(): ModelConfig {
    const saved = this.storage.get('modelConfig');
    if (saved && this.isValidConfig(saved)) {
      return saved;
    }
    return this.getDefaultModelConfig();
  }

  async updateModelConfig(config: Partial<ModelConfig>): Promise<void> {
    const currentConfig = this.getModelConfig();
    const newConfig = { ...currentConfig, ...config };
    
    if (this.isValidConfig(newConfig)) {
      await this.storage.set('modelConfig', newConfig);
      this.notifyConfigChange(newConfig);
    } else {
      throw new Error('Invalid model configuration');
    }
  }

  private isValidConfig(config: ModelConfig): boolean {
    const model = this.modelRegistry.getModelById(config.model);
    return model !== null && model.provider === config.provider;
  }

  private getDefaultModelConfig(): ModelConfig {
    const defaultModel = this.modelRegistry.getAvailableModels()[0];
    return {
      provider: defaultModel.provider,
      model: defaultModel.id,
      displayName: defaultModel.displayName,
      enableThinking: true,
      temperature: 0.7,
      maxTokens: 4096
    };
  }
}

// Usage with Dependency Injection
const modelRegistry = new ModelRegistryImpl();
const configManager = new ConfigurationManagerImpl(
  modelRegistry, 
  new LocalStorageConfigStorage()
);

// Load models from external source (API, file, etc.)
await modelRegistry.loadModels(modelDefinitions);

// In components
function ModelSelector() {
  const [config, setConfig] = useModelConfig();
  const availableModels = useAvailableModels();
  
  const handleConfigChange = async (newConfig: Partial<ModelConfig>) => {
    await configManager.updateModelConfig(newConfig);
  };
  
  return (
    <ModelSelectorUI 
      config={config}
      availableModels={availableModels}
      onChange={handleConfigChange}
    />
  );
}
```

## Example 5: Error Handling Architecture

### Current Implementation (Inconsistent Error Handling)
```typescript
// Scattered try-catch blocks with inconsistent error messages
try {
  const result = await PDFExtractionService.extractSpecificTable(pdfUrl, prompt);
  // Success handling
} catch (error) {
  console.error('PDF extraction error:', error);
  if (activeSessionId) {
    updateMessage(activeSessionId, statusMessageId, {
      role: 'assistant',
      content: `**PDF Extraction - Error** ❌\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n\n**Troubleshooting:**...`
    });
  }
}
```

### Improved Implementation
```typescript
// Centralized Error Types
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  abstract readonly severity: ErrorSeverity;
  
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
  }
}

class PDFExtractionError extends AppError {
  readonly code = 'PDF_EXTRACTION_FAILED';
  readonly category = ErrorCategory.EXTERNAL_SERVICE;
  readonly severity = ErrorSeverity.HIGH;
}

class ModelConfigurationError extends AppError {
  readonly code = 'INVALID_MODEL_CONFIG';
  readonly category = ErrorCategory.CONFIGURATION;
  readonly severity = ErrorSeverity.MEDIUM;
}

// Error Handler Interface
interface ErrorHandler {
  canHandle(error: Error): boolean;
  handle(error: Error, context: ErrorContext): Promise<ErrorHandlingResult>;
}

// Specific Error Handlers
class PDFExtractionErrorHandler implements ErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof PDFExtractionError;
  }

  async handle(error: PDFExtractionError, context: ErrorContext): Promise<ErrorHandlingResult> {
    const userMessage = this.formatUserMessage(error);
    const troubleshooting = this.getTroubleshootingSteps(error);
    
    await context.messageService.addErrorMessage({
      title: 'PDF Extraction Failed',
      message: userMessage,
      troubleshooting: troubleshooting,
      canRetry: true
    });
    
    return {
      handled: true,
      shouldPropagate: false,
      retryable: true
    };
  }

  private formatUserMessage(error: PDFExtractionError): string {
    return `Failed to extract data from PDF: ${error.message}`;
  }

  private getTroubleshootingSteps(error: PDFExtractionError): string[] {
    return [
      'Check if the PDF URL is accessible',
      'Verify the Modal API is responding',
      'Try with a different PDF or prompt'
    ];
  }
}

// Global Error Manager
class ErrorManager {
  private handlers: ErrorHandler[] = [];
  
  registerHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }
  
  async handleError(error: Error, context: ErrorContext): Promise<void> {
    console.error(`[${error.constructor.name}] ${error.message}`, error);
    
    for (const handler of this.handlers) {
      if (handler.canHandle(error)) {
        const result = await handler.handle(error, context);
        if (result.handled && !result.shouldPropagate) {
          return;
        }
      }
    }
    
    // Fallback handler
    await this.handleUnknownError(error, context);
  }
  
  private async handleUnknownError(error: Error, context: ErrorContext): Promise<void> {
    await context.messageService.addErrorMessage({
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again.',
      canRetry: true
    });
  }
}

// Usage
const errorManager = new ErrorManager();
errorManager.registerHandler(new PDFExtractionErrorHandler());
errorManager.registerHandler(new ModelConfigurationErrorHandler());
errorManager.registerHandler(new NetworkErrorHandler());

// In service methods
class PDFExtractionService {
  constructor(private errorManager: ErrorManager) {}
  
  async extractData(url: string, prompt: string): Promise<ExtractionResult> {
    try {
      return await this.performExtraction(url, prompt);
    } catch (error) {
      await this.errorManager.handleError(
        error instanceof Error ? error : new Error(String(error)),
        { service: 'pdf-extraction', url, prompt }
      );
      throw error;
    }
  }
}
```

These examples demonstrate how the proposed architecture addresses the key issues:

1. **Separation of Concerns**: Each class has a single, well-defined responsibility
2. **Dependency Injection**: Components depend on abstractions, not concrete implementations
3. **Extensibility**: New providers, strategies, and error handlers can be added without modifying existing code
4. **Testability**: Each component can be tested in isolation with mocked dependencies
5. **Configuration Management**: Centralized, type-safe configuration with validation
6. **Error Handling**: Consistent, contextual error handling with user-friendly messages