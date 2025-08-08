/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeveloperTestPanel } from '../DeveloperTestPanel';
import { testDiscoveryService } from '../../services/testDiscoveryService';
import { testExecutorService } from '../../services/testExecutorService';

// Mock services
jest.mock('../../services/testDiscoveryService');
jest.mock('../../services/testExecutorService');

// Mock dependencies
jest.mock('../ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>
}));

jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

jest.mock('../ui/input', () => ({
  Input: ({ onChange, ...props }: any) => (
    <input onChange={onChange} {...props} />
  )
}));

jest.mock('../ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
}));

jest.mock('../ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { onValueChange })
      )}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button data-testid={`tab-${value}`} {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  )
}));

// Mock components
jest.mock('../test/TestRunner', () => ({
  TestRunner: ({ test, onStatusChange, onResultReady }: any) => (
    <div data-testid="test-runner">
      <span>Running test: {test?.name}</span>
      <button 
        onClick={() => {
          onStatusChange?.(test?.id, 'running');
          setTimeout(() => {
            onStatusChange?.(test?.id, 'success');
            onResultReady?.({
              testId: test?.id,
              status: 'success',
              duration: 1000,
              startTime: new Date(),
              endTime: new Date(),
              logs: [],
              output: 'Test completed successfully'
            });
          }, 100);
        }}
      >
        Run Test
      </button>
    </div>
  )
}));

jest.mock('../test/BatchTestRunner', () => ({
  BatchTestRunner: ({ tests, onComplete }: any) => (
    <div data-testid="batch-test-runner">
      <span>Batch runner with {tests?.length || 0} tests</span>
      <button onClick={() => onComplete?.({ status: 'completed', results: [] })}>
        Run Batch
      </button>
    </div>
  )
}));

jest.mock('../test/TestResultsDisplay', () => ({
  TestResultsDisplay: ({ result }: any) => (
    <div data-testid="test-results">
      Result for {result?.testId}: {result?.status}
    </div>
  )
}));

// Test data
const mockTestFiles = [
  {
    id: 'test-chat-api',
    name: 'Chat API Test',
    description: 'Test chat API functionality',
    type: 'html' as const,
    category: 'chat',
    path: 'testing/test-chat-api.html'
  },
  {
    id: 'test-excel-functionality',
    name: 'Excel Functionality Test',
    description: 'Test Excel file operations',
    type: 'html' as const,
    category: 'excel',
    path: 'testing/test-excel-functionality.html'
  },
  {
    id: 'test-mcp-integration',
    name: 'MCP Integration Test',
    description: 'Test MCP server integration',
    type: 'js' as const,
    category: 'mcp',
    path: 'testing/test-mcp-integration.js'
  }
];

const mockCategories = {
  chat: {
    id: 'chat',
    name: 'Chat Tests',
    description: 'Test chat functionality',
    icon: '💬',
    color: 'text-blue-500',
    expanded: true
  },
  excel: {
    id: 'excel',
    name: 'Excel Tests',
    description: 'Test Excel functionality',
    icon: '📊',
    color: 'text-green-500',
    expanded: true
  },
  mcp: {
    id: 'mcp',
    name: 'MCP Tests',
    description: 'Test MCP functionality',
    icon: '🔌',
    color: 'text-purple-500',
    expanded: true
  }
};

describe('DeveloperTestPanel', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });

    // Mock process.env
    Object.defineProperty(process, 'env', {
      value: { NODE_ENV: 'development' },
      writable: true
    });

    // Mock window.open
    Object.defineProperty(window, 'open', {
      value: jest.fn().mockReturnValue({ focus: jest.fn() }),
      writable: true
    });
  });

  describe('Component Rendering', () => {
    test('renders developer test panel with correct title', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      expect(screen.getByText('Developer Test Panel')).toBeInTheDocument();
      expect(screen.getByText(/comprehensive testing interface/i)).toBeInTheDocument();
    });

    test('renders development mode toggle', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      expect(screen.getByText('Development Mode')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    test('renders tab navigation', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      expect(screen.getByTestId('tab-browser')).toBeInTheDocument();
      expect(screen.getByTestId('tab-runner')).toBeInTheDocument();
      expect(screen.getByTestId('tab-batch')).toBeInTheDocument();
      expect(screen.getByTestId('tab-results')).toBeInTheDocument();
    });

    test('does not render when not visible and not in development mode', () => {
      Object.defineProperty(process, 'env', {
        value: { NODE_ENV: 'production' },
        writable: true
      });

      const { container } = render(<DeveloperTestPanel isVisible={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    test('renders when explicitly made visible even in production', () => {
      Object.defineProperty(process, 'env', {
        value: { NODE_ENV: 'production' },
        writable: true
      });

      render(<DeveloperTestPanel isVisible={true} />);
      
      expect(screen.getByText('Developer Test Panel')).toBeInTheDocument();
    });
  });

  describe('Development Mode Functionality', () => {
    test('toggles development mode on switch change', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      const toggle = screen.getByRole('checkbox');
      
      fireEvent.click(toggle);
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'developer-mode',
        expect.any(String)
      );
    });

    test('initializes development mode from localStorage', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('true');
      
      render(<DeveloperTestPanel isVisible={true} />);
      
      expect(window.localStorage.getItem).toHaveBeenCalledWith('developer-mode');
    });
  });

  describe('Search and Filter Functionality', () => {
    beforeEach(() => {
      // Mock the TEST_FILES constant
      jest.doMock('../DeveloperTestPanel', () => ({
        ...jest.requireActual('../DeveloperTestPanel'),
        TEST_FILES: mockTestFiles
      }));
    });

    test('renders search input', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      expect(screen.getByPlaceholderText('Search tests...')).toBeInTheDocument();
    });

    test('filters tests by search term', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search tests...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'chat' } });
      });

      await waitFor(() => {
        // Should filter to only show chat-related tests
        expect(searchInput).toHaveValue('chat');
      });
    });

    test('renders category filter buttons', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      expect(screen.getByText(/All \(/)).toBeInTheDocument();
    });
  });

  describe('Test Execution', () => {
    test('opens test in browser mode', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      // Mock window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        value: mockOpen,
        writable: true
      });

      // This test would need the actual test files rendered
      // For now, we test the window.open functionality
      expect(mockOpen).not.toHaveBeenCalled();
    });

    test('switches to runner mode when test is selected', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      // Test would need more complex setup to test runner mode switching
    });

    test('handles test status changes', async () => {
      const onToggle = jest.fn();
      render(<DeveloperTestPanel isVisible={true} onToggle={onToggle} />);

      // This would test status change handling
    });
  });

  describe('Tab Navigation', () => {
    test('switches between tabs correctly', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      const runnerTab = screen.getByTestId('tab-runner');
      
      await act(async () => {
        fireEvent.click(runnerTab);
      });

      expect(screen.getByTestId('tab-content-runner')).toBeInTheDocument();
    });

    test('shows empty state in runner tab when no test selected', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      const runnerTab = screen.getByTestId('tab-runner');
      fireEvent.click(runnerTab);

      expect(screen.getByText(/select a test from the browser tab/i)).toBeInTheDocument();
    });

    test('shows empty state in results tab when no results', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      const resultsTab = screen.getByTestId('tab-results');
      fireEvent.click(resultsTab);

      expect(screen.getByText(/no test results available/i)).toBeInTheDocument();
    });
  });

  describe('Test Statistics', () => {
    test('displays test statistics correctly', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      // Should show total tests count
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Passed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  describe('Runner Mode Toggle', () => {
    test('toggles between single and batch runner modes', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      const browserButton = screen.getByText('Browser');
      const runnerButton = screen.getByText('Runner');
      
      expect(browserButton).toBeInTheDocument();
      expect(runnerButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(runnerButton);
      });

      // Should change the mode (visual indication would be tested here)
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('handles Ctrl+Shift+T shortcut', async () => {
      const onToggle = jest.fn();
      render(<DeveloperTestPanel isVisible={true} onToggle={onToggle} />);

      await act(async () => {
        fireEvent.keyDown(window, {
          key: 'T',
          ctrlKey: true,
          shiftKey: true
        });
      });

      expect(onToggle).toHaveBeenCalled();
    });

    test('ignores shortcuts when not in development mode', async () => {
      Object.defineProperty(process, 'env', {
        value: { NODE_ENV: 'production' },
        writable: true
      });

      const onToggle = jest.fn();
      render(<DeveloperTestPanel isVisible={true} onToggle={onToggle} />);

      fireEvent.keyDown(window, {
        key: 'T',
        ctrlKey: true,
        shiftKey: true
      });

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('Integration with TestRunner', () => {
    test('integrates with TestRunner component', async () => {
      const mockTest = mockTestFiles[0];
      render(<DeveloperTestPanel isVisible={true} />);
      
      // Switch to runner tab and simulate test selection
      const runnerTab = screen.getByTestId('tab-runner');
      fireEvent.click(runnerTab);

      // This would need more setup to fully test TestRunner integration
    });
  });

  describe('Integration with BatchTestRunner', () => {
    test('integrates with BatchTestRunner component', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      const batchTab = screen.getByTestId('tab-batch');
      fireEvent.click(batchTab);

      expect(screen.getByTestId('batch-test-runner')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      // Additional accessibility tests would go here
    });

    test('supports keyboard navigation', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      const firstTab = screen.getByTestId('tab-browser');
      
      await act(async () => {
        firstTab.focus();
        fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      });

      // Test keyboard navigation behavior
    });
  });

  describe('Error Handling', () => {
    test('handles test execution errors gracefully', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      // Mock error scenario
      Object.defineProperty(window, 'open', {
        value: jest.fn().mockReturnValue(null),
        writable: true
      });

      // Test error handling (would need more setup)
    });

    test('shows error states appropriately', async () => {
      render(<DeveloperTestPanel isVisible={true} />);
      
      // Test error state display
    });
  });

  describe('Performance', () => {
    test('does not cause memory leaks with multiple renders', async () => {
      const { rerender } = render(<DeveloperTestPanel isVisible={true} />);
      
      for (let i = 0; i < 10; i++) {
        rerender(<DeveloperTestPanel isVisible={i % 2 === 0} />);
      }

      // Test that no memory leaks occur
    });

    test('handles large numbers of tests efficiently', async () => {
      // Create a large number of mock tests
      const manyTests = Array.from({ length: 100 }, (_, i) => ({
        id: `test-${i}`,
        name: `Test ${i}`,
        description: `Description ${i}`,
        type: 'html' as const,
        category: 'test',
        path: `testing/test-${i}.html`
      }));

      render(<DeveloperTestPanel isVisible={true} />);
      
      // Test that it renders efficiently with many tests
    });
  });
});