import React from 'react';
import { DeveloperTestPanel, useDeveloperTestPanel } from '../DeveloperTestPanel';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

/**
 * Example component demonstrating various ways to use the DeveloperTestPanel
 */
export function DeveloperTestPanelExample() {
  const testPanel = useDeveloperTestPanel();

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Developer Test Panel Integration Examples</CardTitle>
          <CardDescription>
            Different ways to integrate and use the DeveloperTestPanel component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Hook-based Usage */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Hook-based Usage</h3>
            <p className="text-sm text-muted-foreground">
              Use the useDeveloperTestPanel hook for programmatic control
            </p>
            <div className="flex gap-2">
              <Button onClick={testPanel.show} size="sm">
                Show Test Panel
              </Button>
              <Button onClick={testPanel.hide} variant="outline" size="sm">
                Hide Test Panel
              </Button>
              <Button onClick={testPanel.toggle} variant="secondary" size="sm">
                Toggle Test Panel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Current state: {testPanel.isVisible ? 'Visible' : 'Hidden'}
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
            <p className="text-sm text-muted-foreground">
              The test panel supports keyboard shortcuts for quick access
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-mono">
                <kbd className="px-2 py-1 bg-background rounded border">Ctrl</kbd> + 
                <kbd className="px-2 py-1 bg-background rounded border mx-1">Shift</kbd> + 
                <kbd className="px-2 py-1 bg-background rounded border">T</kbd>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Toggle the developer test panel
              </p>
            </div>
          </div>

          {/* Development Mode */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Development Mode</h3>
            <p className="text-sm text-muted-foreground">
              The panel automatically detects development mode and can be manually toggled
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Current NODE_ENV:</strong> {process.env.NODE_ENV || 'undefined'}
              </p>
              <p className="text-sm">
                <strong>Developer Mode:</strong> {localStorage.getItem('developer-mode') || 'auto'}
              </p>
              <p className="text-xs text-muted-foreground">
                Toggle development mode within the panel to show/hide it regardless of NODE_ENV
              </p>
            </div>
          </div>

          {/* Test Categories */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Available Test Categories</h3>
            <p className="text-sm text-muted-foreground">
              Tests are organized into logical categories for easy navigation
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300">Chat Tests</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  API flow, streaming, session management
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-300">Excel Tests</h4>
                <p className="text-xs text-green-600 dark:text-green-400">
                  MCP functionality, path resolution
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <h4 className="font-medium text-purple-700 dark:text-purple-300">MCP Tests</h4>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Server integration, communication
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <h4 className="font-medium text-orange-700 dark:text-orange-300">Workflow Tests</h4>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Creation, execution, state management
                </p>
              </div>
            </div>
          </div>

          {/* Integration Code */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Integration Code</h3>
            <p className="text-sm text-muted-foreground">
              Example of how to integrate into your components
            </p>
            <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
{`// Hook-based approach (recommended)
import { useDeveloperTestPanel } from './DeveloperTestPanel';

function MyComponent() {
  const testPanel = useDeveloperTestPanel();
  
  return (
    <>
      <Button onClick={testPanel.toggle}>
        Toggle Dev Tests
      </Button>
      <testPanel.DeveloperTestPanel />
    </>
  );
}

// Direct component usage
import { DeveloperTestPanel } from './DeveloperTestPanel';

function MyComponent() {
  const [showTests, setShowTests] = useState(false);
  
  return (
    <DeveloperTestPanel 
      isVisible={showTests}
      onToggle={() => setShowTests(!showTests)}
    />
  );
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* The actual test panel */}
      <testPanel.DeveloperTestPanel />
    </div>
  );
}

export default DeveloperTestPanelExample;