/**
 * Test component for debugging workflow store integration
 */

import React, { useEffect } from 'react';
import { useWorkflowStore, WorkflowType } from '@/stores/workflowStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const TestWorkflowStore: React.FC = () => {
  const {
    temporaryWorkflows,
    permanentWorkflows,
    activeWorkflow,
    createWorkflow,
    loadWorkflow,
    addNode,
    getWorkflowById,
    getRecentWorkflows
  } = useWorkflowStore();

  useEffect(() => {
    console.log('🔍 Store State:', {
      temporaryCount: temporaryWorkflows.size,
      permanentCount: permanentWorkflows.size,
      activeWorkflow: activeWorkflow?.name,
      activeNodes: activeWorkflow?.nodes?.length || 0,
      activeEdges: activeWorkflow?.edges?.length || 0
    });
  }, [temporaryWorkflows, permanentWorkflows, activeWorkflow]);

  const handleCreateTestWorkflow = () => {
    console.log('📝 Creating test workflow...');
    const id = createWorkflow(
      `Test Workflow ${new Date().toLocaleTimeString()}`,
      WorkflowType.TEMPORARY,
      'test-session'
    );
    console.log('✅ Created workflow with ID:', id);
    
    // Try to get it back
    const workflow = getWorkflowById(id);
    console.log('🔍 Retrieved workflow:', workflow);
    
    // Load it
    loadWorkflow(id);
  };

  const handleAddTestNode = () => {
    if (!activeWorkflow) {
      console.warn('⚠️ No active workflow');
      return;
    }

    const testNode = {
      id: `test-node-${Date.now()}`,
      type: 'transform',
      position: { x: 200, y: 200 },
      data: {
        type: 'transform',
        status: 'pending' as const,
        config: {
          id: `config-${Date.now()}`,
          name: 'Test Node',
          description: 'Test node for debugging',
          operations: []
        }
      }
    };

    console.log('📌 Adding test node:', testNode);
    addNode(testNode);
    
    // Check if it was added
    setTimeout(() => {
      console.log('🔍 Active workflow nodes:', activeWorkflow.nodes);
    }, 100);
  };

  const handleCheckStoreState = () => {
    console.log('🏪 Full Store State:');
    console.log('Temporary Workflows:', Array.from(temporaryWorkflows.entries()));
    console.log('Permanent Workflows:', Array.from(permanentWorkflows.entries()));
    console.log('Active Workflow:', activeWorkflow);
    
    const recent = getRecentWorkflows(5);
    console.log('Recent Workflows:', recent);
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Workflow Store Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleCreateTestWorkflow} variant="outline">
            Create Test Workflow
          </Button>
          <Button onClick={handleAddTestNode} variant="outline">
            Add Test Node
          </Button>
          <Button onClick={handleCheckStoreState} variant="outline">
            Check Store State
          </Button>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>Temporary Workflows: {temporaryWorkflows.size}</div>
          <div>Permanent Workflows: {permanentWorkflows.size}</div>
          <div>Active Workflow: {activeWorkflow?.name || 'None'}</div>
          {activeWorkflow && (
            <>
              <div>Nodes: {activeWorkflow.nodes?.length || 0}</div>
              <div>Edges: {activeWorkflow.edges?.length || 0}</div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestWorkflowStore;