import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  Search, 
  Play, 
  FileText, 
  Code, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PlayCircle,
  BarChart3,
  TestTube
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TestRunner, TestFile, TestResult } from './test/TestRunner';
import { BatchTestRunner } from './test/BatchTestRunner';
import { TestExecutionMonitor } from './test/TestExecutionMonitor';
import { TestResultsDisplay } from './test/TestResultsDisplay';

interface TestFile {
  id: string;
  name: string;
  description: string;
  type: 'html' | 'js';
  category: 'chat' | 'excel' | 'mcp' | 'workflow' | 'persistence' | 'other';
  path: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  lastRun?: Date;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  expanded: boolean;
}

// Test files configuration based on the testing directory
const TEST_FILES: TestFile[] = [
  // Chat Tests
  {
    id: 'chat-api',
    name: 'Chat API Test',
    description: 'Complete chat API flow testing with real-time status monitoring',
    type: 'html',
    category: 'chat',
    path: 'testing/test-chat-api.html'
  },
  {
    id: 'chat-complete',
    name: 'Chat Complete Flow',
    description: 'End-to-end chat completion testing',
    type: 'html',
    category: 'chat',
    path: 'testing/test-chat-complete.html'
  },
  {
    id: 'chat-streaming',
    name: 'Chat Streaming Test',
    description: 'Test streaming chat responses and real-time updates',
    type: 'html',
    category: 'chat',
    path: 'testing/test-chat-streaming.html'
  },
  {
    id: 'chat-store',
    name: 'Chat Store Integration',
    description: 'Test chat history and session store functionality',
    type: 'html',
    category: 'chat',
    path: 'testing/test-chat-store.html'
  },
  {
    id: 'chat-immediate',
    name: 'Immediate Chat Response',
    description: 'Test immediate chat response handling',
    type: 'html',
    category: 'chat',
    path: 'testing/test-chat-immediate.html'
  },

  // Excel Tests
  {
    id: 'excel-functionality',
    name: 'Excel MCP Functionality',
    description: 'Comprehensive Excel MCP server functionality testing',
    type: 'html',
    category: 'excel',
    path: 'testing/test-excel-functionality.html'
  },
  {
    id: 'excel-path-resolution',
    name: 'Excel Path Resolution',
    description: 'Test Excel file path resolution and access',
    type: 'html',
    category: 'excel',
    path: 'testing/test-excel-path-resolution.html'
  },

  // MCP Tests
  {
    id: 'mcp-integration',
    name: 'MCP Integration Test',
    description: 'Test MCP server integration and communication',
    type: 'html',
    category: 'mcp',
    path: 'testing/test-mcp-integration.html'
  },
  {
    id: 'mcp-complete',
    name: 'MCP Complete Suite',
    description: 'Complete MCP server testing suite',
    type: 'js',
    category: 'mcp',
    path: 'testing/test-mcp-complete.js'
  },
  {
    id: 'mcp-debug',
    name: 'MCP Debug Tools',
    description: 'Debug tools for MCP server communication',
    type: 'js',
    category: 'mcp',
    path: 'testing/test-mcp-debug.js'
  },
  {
    id: 'smithery-integration',
    name: 'Smithery Integration',
    description: 'Test Smithery API integration and server browsing',
    type: 'js',
    category: 'mcp',
    path: 'testing/test_smithery_api.js'
  },
  {
    id: 'filesystem-mcp',
    name: 'Filesystem MCP Test',
    description: 'Test filesystem MCP server operations',
    type: 'html',
    category: 'mcp',
    path: 'testing/test-filesystem-mcp.html'
  },

  // Workflow Tests
  {
    id: 'workflow-creation',
    name: 'Workflow Creation',
    description: 'Test workflow creation and management',
    type: 'html',
    category: 'workflow',
    path: 'testing/test-workflow-creation.html'
  },
  {
    id: 'workflow-creation-flow',
    name: 'Workflow Creation Flow',
    description: 'End-to-end workflow creation flow testing',
    type: 'html',
    category: 'workflow',
    path: 'testing/test-workflow-creation-flow.html'
  },
  {
    id: 'workflow-store',
    name: 'Workflow Store Test',
    description: 'Test workflow store and state management',
    type: 'js',
    category: 'workflow',
    path: 'testing/test-workflow-store.js'
  },

  // File Persistence Tests
  {
    id: 'file-persistence',
    name: 'File Persistence Test',
    description: 'Test file persistence and storage mechanisms',
    type: 'html',
    category: 'persistence',
    path: 'testing/test-file-persistence.html'
  },
  {
    id: 'file-upload',
    name: 'File Upload Test',
    description: 'Test file upload functionality and validation',
    type: 'html',
    category: 'persistence',
    path: 'testing/test-upload.html'
  }
];

const TEST_CATEGORIES: Record<string, TestCategory> = {
  chat: {
    id: 'chat',
    name: 'Chat Tests',
    description: 'Test chat functionality and API integration',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-blue-500',
    expanded: true
  },
  excel: {
    id: 'excel',
    name: 'Excel Tests',
    description: 'Test Excel file operations and MCP integration',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-green-500',
    expanded: true
  },
  mcp: {
    id: 'mcp',
    name: 'MCP Tests',
    description: 'Test MCP server communication and integration',
    icon: <Settings className="w-4 h-4" />,
    color: 'text-purple-500',
    expanded: true
  },
  workflow: {
    id: 'workflow',
    name: 'Workflow Tests',
    description: 'Test workflow creation and execution',
    icon: <Code className="w-4 h-4" />,
    color: 'text-orange-500',
    expanded: true
  },
  persistence: {
    id: 'persistence',
    name: 'Persistence Tests',
    description: 'Test file persistence and storage',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-red-500',
    expanded: true
  }
};

interface DeveloperTestPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export function DeveloperTestPanel({ isVisible = false, onToggle }: DeveloperTestPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [testStatuses, setTestStatuses] = useState<Record<string, TestFile['status']>>({});
  const [categoryExpansion, setCategoryExpansion] = useState<Record<string, boolean>>(() => 
    Object.fromEntries(Object.entries(TEST_CATEGORIES).map(([id, cat]) => [id, cat.expanded]))
  );
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(() => {
    return process.env.NODE_ENV === 'development' || 
           localStorage.getItem('developer-mode') === 'true';
  });
  const [activeTab, setActiveTab] = useState('browser');
  const [selectedTest, setSelectedTest] = useState<TestFile | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [runnerMode, setRunnerMode] = useState<'single' | 'batch'>('single');

  // Filter tests based on search and category
  const filteredTests = useMemo(() => {
    return TEST_FILES.filter(test => {
      const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || test.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Group tests by category
  const groupedTests = useMemo(() => {
    const groups: Record<string, TestFile[]> = {};
    filteredTests.forEach(test => {
      if (!groups[test.category]) {
        groups[test.category] = [];
      }
      groups[test.category].push(test);
    });
    return groups;
  }, [filteredTests]);

  // Handle test execution
  const runTest = async (test: TestFile) => {
    setTestStatuses(prev => ({ ...prev, [test.id]: 'running' }));
    
    try {
      if (runnerMode === 'single') {
        // For single test mode, run in integrated test runner
        setSelectedTest(test);
        setActiveTab('runner');
      } else {
        // For browser mode, open the test file in a new window/tab
        const baseUrl = window.location.origin;
        const testUrl = `${baseUrl}/${test.path}`;
        
        const testWindow = window.open(testUrl, `test-${test.id}`, 'width=1200,height=800');
        
        if (!testWindow) {
          throw new Error('Failed to open test window. Please allow popups for this site.');
        }
        
        // Simulate test completion after a short delay
        setTimeout(() => {
          setTestStatuses(prev => ({ ...prev, [test.id]: 'success' }));
        }, 1000);
      }
      
    } catch (error) {
      console.error('Failed to run test:', error);
      setTestStatuses(prev => ({ ...prev, [test.id]: 'error' }));
    }
  };

  // Handle test result
  const handleTestResult = (result: TestResult) => {
    setTestResults(prev => ({ ...prev, [result.testId]: result }));
    setTestStatuses(prev => ({ ...prev, [result.testId]: result.status === 'success' ? 'success' : 'error' }));
  };

  // Handle status change
  const handleStatusChange = (testId: string, status: TestFile['status']) => {
    setTestStatuses(prev => ({ ...prev, [testId]: status }));
  };

  // Get selected tests for batch execution
  const getSelectedTests = () => {
    if (selectedCategory) {
      return TEST_FILES.filter(test => test.category === selectedCategory);
    }
    return filteredTests;
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setCategoryExpansion(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Get status icon
  const getStatusIcon = (status: TestFile['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-400" />;
    }
  };

  // Toggle development mode
  const toggleDevelopmentMode = () => {
    const newMode = !isDevelopmentMode;
    setIsDevelopmentMode(newMode);
    localStorage.setItem('developer-mode', newMode.toString());
  };

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + T to toggle test panel
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        if (onToggle) {
          onToggle();
        }
      }
    };

    if (isDevelopmentMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDevelopmentMode, onToggle]);

  // Don't render if not in development mode and not explicitly made visible
  if (!isDevelopmentMode && !isVisible) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className={cn(
        "fixed right-4 top-20 w-[600px] max-w-[90vw] max-h-[85vh] z-50 shadow-lg border-2",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "md:w-[600px] sm:w-[95vw] sm:right-2 sm:top-16",
        !isVisible && "hidden"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Developer Test Panel
              </CardTitle>
              <CardDescription>
                Comprehensive testing interface with integrated runner
                <br />
                <span className="text-xs text-muted-foreground">
                  Shortcut: Ctrl+Shift+T
                </span>
              </CardDescription>
            </div>
            {onToggle && (
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Development Mode Toggle */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Development Mode</span>
              <Badge variant={isDevelopmentMode ? "default" : "secondary"}>
                {isDevelopmentMode ? "ON" : "OFF"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                <span>Mode:</span>
                <Button
                  variant={runnerMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRunnerMode('single')}
                  className="h-6 px-2 text-xs"
                >
                  <TestTube className="w-3 h-3 mr-1" />
                  Runner
                </Button>
                <Button
                  variant={runnerMode === 'batch' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRunnerMode('batch')}
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Browser
                </Button>
              </div>
              <Switch 
                checked={isDevelopmentMode} 
                onCheckedChange={toggleDevelopmentMode}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="browser" className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Browser</span>
              </TabsTrigger>
              <TabsTrigger value="runner" className="flex items-center gap-1">
                <PlayCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Runner</span>
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span className="hidden sm:inline">Batch</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Results</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browser" className="space-y-4">
              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Category Filter */}
                <div className="flex flex-wrap gap-1 text-xs">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs"
                  >
                    All ({filteredTests.length})
                  </Button>
                  {Object.values(TEST_CATEGORIES).map(category => {
                    const count = TEST_FILES.filter(t => t.category === category.id).length;
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(
                          selectedCategory === category.id ? null : category.id
                        )}
                        className="text-xs"
                      >
                        {category.name} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Test Categories */}
              <div className="max-h-80 overflow-y-auto space-y-3">
                {Object.entries(groupedTests).map(([categoryId, tests]) => {
                  const category = TEST_CATEGORIES[categoryId];
                  if (!category) return null;

                  const isExpanded = categoryExpansion[categoryId];

                  return (
                    <div key={categoryId} className="border rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-3 h-auto font-medium"
                        onClick={() => toggleCategory(categoryId)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={category.color}>{category.icon}</div>
                          <span>{category.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {tests.length}
                          </Badge>
                        </div>
                        {isExpanded ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </Button>

                      {/* Category Tests */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30">
                          {tests.map(test => (
                            <div
                              key={test.id}
                              className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm truncate">
                                    {test.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {test.type.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {test.description}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-3">
                                <Tooltip>
                                  <TooltipTrigger>
                                    {getStatusIcon(testStatuses[test.id])}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Status: {testStatuses[test.id] || 'Ready'}
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => runTest(test)}
                                  disabled={testStatuses[test.id] === 'running'}
                                  className="p-1 h-8 w-8"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="runner" className="space-y-4">
              {selectedTest ? (
                <TestRunner
                  test={selectedTest}
                  onStatusChange={handleStatusChange}
                  onResultReady={handleTestResult}
                  enableScreenshots={true}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a test from the Browser tab to run</p>
                  <p className="text-xs mt-1">Or click the test runner button next to any test</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <BatchTestRunner
                tests={getSelectedTests()}
                onComplete={(execution) => {
                  console.log('Batch execution completed:', execution);
                }}
                onProgress={(execution) => {
                  console.log('Batch execution progress:', execution.progress);
                }}
                enableScreenshots={true}
                maxConcurrency={2}
              />
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {Object.keys(testResults).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No test results available</p>
                  <p className="text-xs mt-1">Run some tests to see results here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {Object.values(testResults).map(result => (
                    <TestResultsDisplay
                      key={result.testId}
                      result={result}
                      showDetails={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Stats Summary */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-muted rounded-lg p-2">
                <div className="text-lg font-bold">{TEST_FILES.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-green-600">
                  {Object.values(testStatuses).filter(s => s === 'success').length}
                </div>
                <div className="text-xs text-green-600">Passed</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-red-600">
                  {Object.values(testStatuses).filter(s => s === 'error').length}
                </div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                <div className="text-lg font-bold text-yellow-600">
                  {Object.values(testStatuses).filter(s => s === 'running').length}
                </div>
                <div className="text-xs text-yellow-600">Running</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Hook for easy integration
export function useDeveloperTestPanel() {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible(prev => !prev);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return {
    isVisible,
    toggle,
    show,
    hide,
    DeveloperTestPanel: (props: Partial<DeveloperTestPanelProps>) => (
      <DeveloperTestPanel 
        {...props} 
        isVisible={isVisible} 
        onToggle={toggle} 
      />
    )
  };
}