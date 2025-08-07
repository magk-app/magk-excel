/**
 * Test script to verify workflow store functionality
 */

// Simulate the workflow store behavior
class WorkflowStore {
  constructor() {
    this.temporaryWorkflows = new Map();
    this.permanentWorkflows = new Map();
    this.activeWorkflow = null;
    this.activeWorkflowId = null;
  }

  createWorkflow(name, type, chatSessionId) {
    const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const workflow = {
      id,
      name,
      type,
      chatSessionId,
      nodes: [],
      edges: [],
      status: 'draft',
      metadata: {
        created: new Date(),
        modified: new Date(),
        tags: [],
        category: 'general'
      },
      version: 1
    };

    if (type === 'temporary') {
      this.temporaryWorkflows.set(id, workflow);
      console.log('✅ Added to temporary workflows:', id, 'Total:', this.temporaryWorkflows.size);
    } else {
      this.permanentWorkflows.set(id, workflow);
      console.log('✅ Added to permanent workflows:', id, 'Total:', this.permanentWorkflows.size);
    }

    return id;
  }

  loadWorkflow(id) {
    const workflow = this.temporaryWorkflows.get(id) ||
                    this.permanentWorkflows.get(id);
    
    if (workflow) {
      console.log('✅ Found workflow:', workflow.name);
      this.activeWorkflowId = id;
      this.activeWorkflow = { ...workflow }; // Shallow copy
      return true;
    } else {
      console.warn('⚠️ Workflow not found:', id);
      return false;
    }
  }

  addNode(node) {
    if (this.activeWorkflow) {
      if (!this.activeWorkflow.nodes) {
        this.activeWorkflow.nodes = [];
      }
      this.activeWorkflow.nodes.push(node);
      
      // Update the workflow in the map
      if (this.activeWorkflow.type === 'temporary') {
        this.temporaryWorkflows.set(this.activeWorkflowId, this.activeWorkflow);
      } else {
        this.permanentWorkflows.set(this.activeWorkflowId, this.activeWorkflow);
      }
      
      console.log('✅ Added node:', node.id, 'Total nodes:', this.activeWorkflow.nodes.length);
      return true;
    }
    console.warn('⚠️ No active workflow');
    return false;
  }

  getWorkflowById(id) {
    return this.temporaryWorkflows.get(id) ||
           this.permanentWorkflows.get(id);
  }
}

// Run tests
console.log('🧪 Testing Workflow Store Integration\n');
console.log('=' .repeat(50));

const store = new WorkflowStore();

// Test 1: Create workflow
console.log('\n📝 Test 1: Create Workflow');
const workflowId = store.createWorkflow(
  'Test Workflow',
  'temporary',
  'test-session'
);
console.log('Created workflow ID:', workflowId);

// Test 2: Load workflow
console.log('\n📂 Test 2: Load Workflow');
const loaded = store.loadWorkflow(workflowId);
console.log('Load successful:', loaded);
console.log('Active workflow:', store.activeWorkflow?.name);

// Test 3: Add nodes
console.log('\n📌 Test 3: Add Nodes');
const testNode1 = {
  id: 'node-1',
  type: 'transform',
  position: { x: 100, y: 100 },
  data: {
    type: 'transform',
    status: 'pending',
    config: {
      id: 'config-1',
      name: 'Test Node 1',
      description: 'First test node'
    }
  }
};

const testNode2 = {
  id: 'node-2',
  type: 'web-scraping',
  position: { x: 200, y: 200 },
  data: {
    type: 'web-scraping',
    status: 'pending',
    config: {
      id: 'config-2',
      name: 'Test Node 2',
      description: 'Second test node'
    }
  }
};

store.addNode(testNode1);
store.addNode(testNode2);

// Test 4: Verify persistence
console.log('\n🔍 Test 4: Verify Persistence');
const retrievedWorkflow = store.getWorkflowById(workflowId);
console.log('Retrieved workflow nodes:', retrievedWorkflow?.nodes?.length);
console.log('Node IDs:', retrievedWorkflow?.nodes?.map(n => n.id));

// Test 5: Create another workflow and switch
console.log('\n🔄 Test 5: Multiple Workflows');
const workflowId2 = store.createWorkflow(
  'Second Workflow',
  'permanent',
  null
);
store.loadWorkflow(workflowId2);
console.log('Switched to:', store.activeWorkflow?.name);
console.log('Nodes in second workflow:', store.activeWorkflow?.nodes?.length);

// Test 6: Switch back to first workflow
console.log('\n↩️ Test 6: Switch Back');
store.loadWorkflow(workflowId);
console.log('Switched back to:', store.activeWorkflow?.name);
console.log('Nodes preserved:', store.activeWorkflow?.nodes?.length);

// Summary
console.log('\n' + '=' .repeat(50));
console.log('📊 Summary:');
console.log('Temporary workflows:', store.temporaryWorkflows.size);
console.log('Permanent workflows:', store.permanentWorkflows.size);
console.log('Active workflow:', store.activeWorkflow?.name);
console.log('Active workflow nodes:', store.activeWorkflow?.nodes?.length);

console.log('\n✅ All tests completed!');