# Testing Strategy for Improved Architecture

## Testing Pyramid Overview

```
                    ┌─────────────────────────────────────┐
                    │           E2E Tests (5%)            │
                    │  Full user journeys & integration   │
                    └─────────────────────────────────────┘
                  ┌─────────────────────────────────────────┐
                  │         Integration Tests (15%)         │
                  │    Service interactions & API calls     │
                  └─────────────────────────────────────────┘
              ┌─────────────────────────────────────────────────┐
              │              Unit Tests (80%)                   │
              │  Component isolation, business logic, utils    │
              └─────────────────────────────────────────────────┘
```

## Current MVP Testing (Legacy)
- **Unit Testing (Primary for MVP):** In line with the PRD, automated unit tests, created by AI agents using `pytest`, will be implemented for the core backend modules in `chalicelib`. This ensures foundational reliability.
- **Manual Testing:** The primary focus will be end-to-end manual testing of the three core demo use cases to ensure a flawless presentation.

## Enhanced Testing Strategy for Improved Architecture

### Unit Testing Strategy

#### 1. Provider Abstraction Tests

```typescript
// tests/providers/AnthropicProvider.test.ts
describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider();
  });

  describe('createClient', () => {
    it('should create client with valid config', () => {
      const config = { apiKey: 'test-key', model: 'claude-3-5-sonnet' };
      const client = provider.createClient(config);
      
      expect(client).toBeInstanceOf(AnthropicClient);
      expect(client.config.apiKey).toBe('test-key');
    });

    it('should throw error with invalid config', () => {
      const config = { apiKey: '', model: 'invalid' };
      
      expect(() => provider.createClient(config)).toThrow('Invalid API key');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config = { apiKey: 'sk-test', model: 'claude-3-5-sonnet' };
      const result = provider.validateConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject configuration without API key', () => {
      const config = { apiKey: '', model: 'claude-3-5-sonnet' };
      const result = provider.validateConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key required');
    });
  });

  describe('getSupportedModels', () => {
    it('should return available models', () => {
      const models = provider.getSupportedModels();
      
      expect(models).toHaveLength(4);
      expect(models[0]).toMatchObject({
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000
      });
    });
  });
});

// tests/services/ProviderFactory.test.ts
describe('ProviderFactory', () => {
  let factory: ProviderFactory;
  let mockProvider: jest.Mocked<AIProvider>;

  beforeEach(() => {
    factory = new ProviderFactory();
    mockProvider = {
      getName: jest.fn().mockReturnValue('test-provider'),
      createClient: jest.fn(),
      validateConfig: jest.fn().mockReturnValue({ valid: true }),
      getSupportedModels: jest.fn().mockReturnValue([])
    };
  });

  describe('register', () => {
    it('should register provider successfully', () => {
      factory.register(mockProvider);
      
      expect(factory.getAvailableProviders()).toContain('test-provider');
    });

    it('should override existing provider', () => {
      const anotherProvider = { ...mockProvider, getName: () => 'test-provider' };
      
      factory.register(mockProvider);
      factory.register(anotherProvider);
      
      expect(factory.getAvailableProviders()).toHaveLength(1);
    });
  });

  describe('createClient', () => {
    beforeEach(() => {
      factory.register(mockProvider);
    });

    it('should create client for registered provider', () => {
      const config = { apiKey: 'test' };
      const mockClient = { config };
      mockProvider.createClient.mockReturnValue(mockClient);

      const client = factory.createClient('test-provider', config);

      expect(mockProvider.validateConfig).toHaveBeenCalledWith(config);
      expect(mockProvider.createClient).toHaveBeenCalledWith(config);
      expect(client).toBe(mockClient);
    });

    it('should throw error for unregistered provider', () => {
      expect(() => factory.createClient('unknown', {}))
        .toThrow('Provider unknown not registered');
    });

    it('should throw error for invalid config', () => {
      mockProvider.validateConfig.mockReturnValue({ 
        valid: false, 
        error: 'Invalid config' 
      });

      expect(() => factory.createClient('test-provider', {}))
        .toThrow('Invalid config: Invalid config');
    });
  });
});
```

#### 2. Component Decomposition Tests

```typescript
// tests/components/ChatOrchestrator.test.ts
describe('ChatOrchestrator', () => {
  let orchestrator: ChatOrchestrator;
  let mockLLMService: jest.Mocked<LLMService>;
  let mockMCPService: jest.Mocked<MCPService>;
  let mockFileService: jest.Mocked<FileService>;

  beforeEach(() => {
    mockLLMService = {
      chat: jest.fn().mockResolvedValue({ response: 'Test response' })
    };
    mockMCPService = {
      selectRelevantTools: jest.fn().mockResolvedValue([])
    };
    mockFileService = {
      process: jest.fn().mockResolvedValue({ processed: true })
    };

    orchestrator = new ChatOrchestratorImpl(
      mockLLMService,
      mockMCPService,
      mockFileService
    );
  });

  describe('processMessage', () => {
    it('should process message with attachments', async () => {
      const context = {
        message: 'Test message',
        history: [],
        attachments: [{ name: 'test.xlsx', type: 'excel' }],
        modelConfig: { provider: 'anthropic', model: 'claude-3-5-sonnet' }
      };

      const result = await orchestrator.processMessage('Test message', context);

      expect(mockFileService.process).toHaveBeenCalledWith(context.attachments[0]);
      expect(mockMCPService.selectRelevantTools).toHaveBeenCalledWith('Test message', context);
      expect(mockLLMService.chat).toHaveBeenCalledWith('Test message', {
        history: context.history,
        files: [{ processed: true }],
        tools: [],
        modelConfig: context.modelConfig
      });
      expect(result.response).toBe('Test response');
    });

    it('should handle processing errors gracefully', async () => {
      const context = {
        message: 'Test message',
        history: [],
        attachments: [],
        modelConfig: { provider: 'anthropic', model: 'claude-3-5-sonnet' }
      };

      mockLLMService.chat.mockRejectedValue(new Error('API Error'));

      await expect(orchestrator.processMessage('Test message', context))
        .rejects.toThrow('API Error');
    });
  });

  describe('handleFileUpload', () => {
    it('should process multiple files concurrently', async () => {
      const files = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      ];

      mockFileService.process
        .mockResolvedValueOnce({ processed: true, name: 'file1.txt' })
        .mockResolvedValueOnce({ processed: true, name: 'file2.xlsx' });

      const results = await orchestrator.handleFileUpload(files);

      expect(results).toHaveLength(2);
      expect(mockFileService.process).toHaveBeenCalledTimes(2);
      expect(results[0].name).toBe('file1.txt');
      expect(results[1].name).toBe('file2.xlsx');
    });

    it('should handle file processing errors', async () => {
      const files = [new File(['content'], 'error.txt', { type: 'text/plain' })];
      mockFileService.process.mockRejectedValue(new Error('Processing failed'));

      await expect(orchestrator.handleFileUpload(files))
        .rejects.toThrow('Processing failed');
    });
  });
});

// tests/components/ChatContainer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatContainer } from '../../../src/components/ChatContainer';

describe('ChatContainer', () => {
  let mockOrchestrator: jest.Mocked<ChatOrchestrator>;
  let mockSessionManager: jest.Mocked<SessionManager>;

  beforeEach(() => {
    mockOrchestrator = {
      processMessage: jest.fn().mockResolvedValue({ response: 'Test response' }),
      handleFileUpload: jest.fn().mockResolvedValue([]),
      executeDemo: jest.fn().mockResolvedValue({ success: true })
    };
    mockSessionManager = {
      getActiveSession: jest.fn().mockReturnValue({ id: '1', title: 'Test Chat' }),
      createSession: jest.fn(),
      addMessage: jest.fn()
    };
  });

  it('should render chat interface elements', () => {
    render(
      <ChatContainer 
        orchestrator={mockOrchestrator}
        sessionManager={mockSessionManager}
      />
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask me to create/i)).toBeInTheDocument();
  });

  it('should handle message submission', async () => {
    render(
      <ChatContainer 
        orchestrator={mockOrchestrator}
        sessionManager={mockSessionManager}
      />
    );

    const input = screen.getByPlaceholderText(/ask me to create/i);
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOrchestrator.processMessage).toHaveBeenCalledWith(
        'Test message',
        expect.any(Object)
      );
    });
  });

  it('should display error messages when processing fails', async () => {
    mockOrchestrator.processMessage.mockRejectedValue(new Error('Processing failed'));

    render(
      <ChatContainer 
        orchestrator={mockOrchestrator}
        sessionManager={mockSessionManager}
      />
    );

    const input = screen.getByPlaceholderText(/ask me to create/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/processing failed/i)).toBeInTheDocument();
    });
  });
});
```

#### 3. MCP Tool Integration Tests

```typescript
// tests/services/ToolSelectionManager.test.ts
describe('ToolSelectionManager', () => {
  let manager: ToolSelectionManager;
  let mockAIStrategy: jest.Mocked<ToolSelectionStrategy>;
  let mockPatternStrategy: jest.Mocked<ToolSelectionStrategy>;

  beforeEach(() => {
    manager = new ToolSelectionManager();
    
    mockAIStrategy = {
      selectTools: jest.fn(),
      canHandle: jest.fn().mockReturnValue(true),
      getPriority: jest.fn().mockReturnValue(10)
    };
    
    mockPatternStrategy = {
      selectTools: jest.fn(),
      canHandle: jest.fn().mockReturnValue(true),
      getPriority: jest.fn().mockReturnValue(1)
    };
  });

  it('should register strategies in priority order', () => {
    manager.registerStrategy(mockPatternStrategy);
    manager.registerStrategy(mockAIStrategy);

    expect(mockAIStrategy.getPriority).toHaveBeenCalled();
    expect(mockPatternStrategy.getPriority).toHaveBeenCalled();
  });

  it('should use highest priority strategy first', async () => {
    mockAIStrategy.selectTools.mockResolvedValue([
      { server: 'excel', tool: 'write_sheet', args: {} }
    ]);

    manager.registerStrategy(mockPatternStrategy);
    manager.registerStrategy(mockAIStrategy);

    const request = {
      message: 'Create excel file',
      availableTools: [],
      context: {}
    };

    const result = await manager.selectTools(request);

    expect(mockAIStrategy.selectTools).toHaveBeenCalledWith(request);
    expect(mockPatternStrategy.selectTools).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('should fall back to lower priority strategy when higher fails', async () => {
    mockAIStrategy.selectTools.mockRejectedValue(new Error('AI unavailable'));
    mockPatternStrategy.selectTools.mockResolvedValue([
      { server: 'excel', tool: 'write_sheet', args: {} }
    ]);

    manager.registerStrategy(mockAIStrategy);
    manager.registerStrategy(mockPatternStrategy);

    const request = {
      message: 'Create excel file',
      availableTools: [],
      context: {}
    };

    const result = await manager.selectTools(request);

    expect(mockAIStrategy.selectTools).toHaveBeenCalledWith(request);
    expect(mockPatternStrategy.selectTools).toHaveBeenCalledWith(request);
    expect(result).toHaveLength(1);
  });

  it('should return empty array when no strategies work', async () => {
    mockAIStrategy.selectTools.mockResolvedValue([]);
    mockPatternStrategy.selectTools.mockResolvedValue([]);

    manager.registerStrategy(mockAIStrategy);
    manager.registerStrategy(mockPatternStrategy);

    const request = {
      message: 'Unsupported request',
      availableTools: [],
      context: {}
    };

    const result = await manager.selectTools(request);

    expect(result).toHaveLength(0);
  });
});

// tests/strategies/AIToolSelector.test.ts
describe('AIToolSelector', () => {
  let selector: AIToolSelector;
  let mockLLMService: jest.Mocked<LLMService>;

  beforeEach(() => {
    mockLLMService = {
      chat: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true)
    };
    selector = new AIToolSelector(mockLLMService);
  });

  it('should select tools based on AI response', async () => {
    mockLLMService.chat.mockResolvedValue({
      response: JSON.stringify([
        { server: 'excel', tool: 'write_sheet', args: { file: 'test.xlsx' } }
      ])
    });

    const request = {
      message: 'Create an excel file with sales data',
      availableTools: [
        { server: 'excel', name: 'write_sheet', description: 'Write to Excel' },
        { server: 'pdf', name: 'extract', description: 'Extract from PDF' }
      ],
      context: {}
    };

    const result = await selector.selectTools(request);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      server: 'excel',
      tool: 'write_sheet',
      args: { file: 'test.xlsx' }
    });
  });

  it('should handle invalid JSON response gracefully', async () => {
    mockLLMService.chat.mockResolvedValue({
      response: 'Invalid JSON response'
    });

    const request = {
      message: 'Create an excel file',
      availableTools: [],
      context: {}
    };

    const result = await selector.selectTools(request);

    expect(result).toHaveLength(0);
  });

  it('should filter out non-existent tools', async () => {
    mockLLMService.chat.mockResolvedValue({
      response: JSON.stringify([
        { server: 'excel', tool: 'write_sheet', args: {} },
        { server: 'nonexistent', tool: 'fake_tool', args: {} }
      ])
    });

    const request = {
      message: 'Create an excel file',
      availableTools: [
        { server: 'excel', name: 'write_sheet', description: 'Write to Excel' }
      ],
      context: {}
    };

    const result = await selector.selectTools(request);

    expect(result).toHaveLength(1);
    expect(result[0].server).toBe('excel');
  });
});
```

### Integration Testing Strategy

#### 1. Service Integration Tests

```typescript
// tests/integration/ChatFlow.integration.test.ts
describe('Chat Flow Integration', () => {
  let app: TestApplication;

  beforeEach(async () => {
    app = await TestApplication.create({
      providers: {
        anthropic: { apiKey: process.env.TEST_ANTHROPIC_KEY }
      }
    });
  });

  afterEach(async () => {
    await app.cleanup();
  });

  it('should handle complete chat flow with Excel creation', async () => {
    // Given: A chat request for Excel creation
    const chatRequest = {
      message: 'Create an Excel file with sample sales data',
      modelConfig: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022'
      }
    };

    // When: Processing the chat message
    const response = await app.chatOrchestrator.processMessage(
      chatRequest.message,
      {
        history: [],
        attachments: [],
        modelConfig: chatRequest.modelConfig
      }
    );

    // Then: Should create Excel file and return appropriate response
    expect(response.response).toContain('Excel file');
    expect(response.mcpToolCalls).toHaveLength(1);
    expect(response.mcpToolCalls[0].server).toBe('excel');
    expect(response.downloadLinks).toHaveLength(1);
  });

  it('should handle file upload and processing', async () => {
    // Given: An uploaded Excel file
    const testFile = await app.fileService.createTestExcelFile({
      sheets: [{
        name: 'Sales Data',
        data: [
          ['Product', 'Sales', 'Region'],
          ['Widget A', 1000, 'North'],
          ['Widget B', 1500, 'South']
        ]
      }]
    });

    // When: Processing file upload
    const processedFiles = await app.chatOrchestrator.handleFileUpload([testFile]);

    // Then: Should process file successfully
    expect(processedFiles).toHaveLength(1);
    expect(processedFiles[0].type).toBe('excel');
    expect(processedFiles[0].sheets).toHaveLength(1);
    expect(processedFiles[0].sheets[0].rowCount).toBe(3);
  });
});
```

### End-to-End Testing Strategy

```typescript
// tests/e2e/ChatWorkflow.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Chat Workflow', () => {
  test('should create Excel file through chat interface', async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:5173');

    // Wait for chat interface to load
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Type message requesting Excel creation
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Create an Excel file with quarterly sales data');
    
    // Send message
    await page.locator('[data-testid="send-button"]').click();

    // Wait for AI response
    await expect(page.locator('[data-testid="ai-message"]').last()).toContainText('Excel file');

    // Verify download link appears
    await expect(page.locator('[data-testid="download-link"]')).toBeVisible();

    // Test download functionality
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="download-link"]').click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });
});
```

### Performance Testing

```typescript
// tests/performance/ChatPerformance.test.ts
describe('Chat Performance', () => {
  test('should handle concurrent messages efficiently', async () => {
    const app = await TestApplication.create();
    const messageCount = 10;
    const startTime = Date.now();

    // Send multiple messages concurrently
    const promises = Array.from({ length: messageCount }, (_, i) => 
      app.chatOrchestrator.processMessage(`Message ${i}`, {
        history: [],
        attachments: [],
        modelConfig: { provider: 'anthropic', model: 'claude-3-5-sonnet' }
      })
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Verify all messages processed successfully
    expect(results).toHaveLength(messageCount);
    results.forEach(result => {
      expect(result.response).toBeTruthy();
    });

    // Performance assertion (should handle 10 messages in under 30 seconds)
    expect(totalTime).toBeLessThan(30000);
    console.log(`Processed ${messageCount} messages in ${totalTime}ms`);
  });
});
```

### Test Utilities and Helpers

```typescript
// tests/utils/TestApplication.ts
export class TestApplication {
  static async create(config: TestConfig = {}): Promise<TestApplication> {
    const providerFactory = new ProviderFactory();
    
    // Register test providers
    if (config.providers?.anthropic) {
      providerFactory.register(new AnthropicProvider());
    }
    if (config.providers?.openai) {
      providerFactory.register(new OpenAIProvider());
    }

    const modelRegistry = new ModelRegistryImpl();
    await modelRegistry.loadModels(testModelDefinitions);

    const configManager = new ConfigurationManagerImpl(
      modelRegistry,
      new MemoryConfigStorage()
    );

    const llmService = new LLMService(providerFactory);
    const mcpService = new MCPService();
    const fileService = new FileService();

    const chatOrchestrator = new ChatOrchestratorImpl(
      llmService,
      mcpService,
      fileService
    );

    return new TestApplication({
      providerFactory,
      modelRegistry,
      configManager,
      llmService,
      mcpService,
      fileService,
      chatOrchestrator
    });
  }

  async cleanup(): Promise<void> {
    await this.mcpService.stopAllServers();
    await this.fileService.cleanupTempFiles();
  }
}

// tests/fixtures/mockData.ts
export const testModelDefinitions = [
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet',
    capabilities: ['text', 'reasoning'],
    limits: { maxContextTokens: 200000 }
  },
  {
    id: 'gpt-4',
    provider: 'openai',
    displayName: 'GPT-4',
    capabilities: ['text', 'reasoning'],
    limits: { maxContextTokens: 128000 }
  }
];
```

This comprehensive testing strategy ensures that the improved architecture maintains reliability while enabling easier testing through dependency injection and separation of concerns. The tests cover all levels from unit to end-to-end, providing confidence in both individual components and complete user workflows.
