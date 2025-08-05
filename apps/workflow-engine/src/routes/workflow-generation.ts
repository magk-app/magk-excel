import { Hono } from 'hono';
import { z } from 'zod';
import { WorkflowGenerator } from '../services/workflow-generator.js';
import { WorkflowExecutor } from '../services/workflow-executor.js';
import { WorkflowWebSocketService } from '../services/websocket-service.js';

const workflowRoute = new Hono();

// Initialize services
const workflowGenerator = new WorkflowGenerator();
let workflowExecutor: WorkflowExecutor;
let webSocketService: WorkflowWebSocketService;

// Mock MCP tool caller for now - will be integrated with real MCP service later
const mockMCPCallTool = async (server: string, tool: string, args: any): Promise<any> => {
  console.log(`🛠️ Mock MCP call: ${server}.${tool}`, args);
  
  // Simulate async work
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data based on tool type
  switch (tool) {
    case 'scrape_url':
      return {
        content: `Mock scraped content from ${args.url}`,
        data: [
          { column1: 'value1', column2: 'value2' },
          { column1: 'value3', column2: 'value4' }
        ]
      };
    case 'fetch':
      return {
        status: 200,
        data: { result: 'Mock API response' }
      };
    case 'extract_pdf_text':
      return {
        text: 'Mock PDF content',
        tables: [
          { headers: ['Name', 'Value'], rows: [['Item 1', '100'], ['Item 2', '200']] }
        ]
      };
    default:
      return { result: 'Mock tool result' };
  }
};

// Initialize services
const initializeServices = () => {
  if (!workflowExecutor) {
    workflowExecutor = new WorkflowExecutor(mockMCPCallTool);
  }
  
  if (!webSocketService) {
    webSocketService = new WorkflowWebSocketService(8000);
    
    // Connect executor events to WebSocket broadcasts
    workflowExecutor.on('workflow:start', (event) => {
      webSocketService.broadcastWorkflowEvent(event.workflowId, {
        type: 'workflow_start',
        data: event,
        timestamp: new Date()
      });
    });

    workflowExecutor.on('node:start', (event) => {
      webSocketService.broadcastWorkflowEvent(event.workflowId, {
        type: 'node_start',
        nodeId: event.nodeId,
        data: event,
        timestamp: new Date()
      });
    });

    workflowExecutor.on('node:progress', (event) => {
      webSocketService.broadcastWorkflowEvent(event.workflowId, {
        type: 'node_progress',
        nodeId: event.nodeId,
        data: event,
        timestamp: new Date()
      });
    });

    workflowExecutor.on('node:complete', (event) => {
      webSocketService.broadcastWorkflowEvent(event.workflowId, {
        type: 'node_complete',
        nodeId: event.nodeId,
        data: event,
        timestamp: new Date()
      });
    });

    workflowExecutor.on('node:error', (event) => {
      webSocketService.broadcastWorkflowEvent(event.workflowId, {
        type: 'node_error',
        nodeId: event.nodeId,
        data: event,
        timestamp: new Date()
      });
    });

    workflowExecutor.on('workflow:complete', (event) => {
      webSocketService.broadcastWorkflowEvent(event.workflowId, {
        type: 'workflow_complete',
        data: event,
        timestamp: new Date()
      });
    });

    workflowExecutor.on('workflow:error', (event) => {
      webSocketService.broadcastWorkflowEvent(event.workflowId, {
        type: 'workflow_error',
        data: event,
        timestamp: new Date()
      });
    });
  }
};

// Request schemas
const generateWorkflowSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  mcpTools: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    server: z.string().optional(),
    inputSchema: z.any().optional()
  })).optional().default([]),
  autoExecute: z.boolean().optional().default(false)
});

// const executeWorkflowSchema = z.object({
//   workflowId: z.string().min(1, 'Workflow ID is required')
// });

/**
 * Generate workflow from chat message
 */
workflowRoute.post('/generate', async (c) => {
  try {
    initializeServices();
    
    const body = await c.req.json();
    const { message, mcpTools, autoExecute } = generateWorkflowSchema.parse(body);

    console.log(`🎯 Generating workflow from message: "${message}"`);
    console.log(`🛠️ Available MCP tools: ${mcpTools.length}`);

    // Generate workflow
    const workflow = await workflowGenerator.generateFromChat(message, mcpTools);
    
    // Validate workflow
    if (!workflowGenerator.validateWorkflow(workflow)) {
      return c.json({
        success: false,
        error: 'Generated workflow is invalid'
      }, 400);
    }

    console.log(`✅ Generated workflow: ${workflow.name} (${workflow.nodes.length} nodes)`);

    // Auto-execute if requested
    let executionStatus = null;
    if (autoExecute) {
      console.log(`🚀 Auto-executing workflow: ${workflow.id}`);
      
      // Start execution asynchronously
      workflowExecutor.executeWorkflow(workflow).catch(error => {
        console.error('Workflow execution failed:', error);
      });
      
      executionStatus = {
        status: 'running',
        message: 'Workflow execution started'
      };
    }

    return c.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        metadata: workflow.metadata
      },
      execution: executionStatus,
      webSocketUrl: 'ws://localhost:8000',
      naturalLanguageDescription: generateNaturalLanguageDescription(workflow)
    });

  } catch (error) {
    console.error('❌ Workflow generation error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Invalid request format',
        details: error.errors
      }, 400);
    }

    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Execute existing workflow
 */
workflowRoute.post('/execute/:workflowId', async (c) => {
  try {
    initializeServices();
    
    const workflowId = c.req.param('workflowId');
    
    if (!workflowId) {
      return c.json({
        success: false,
        error: 'Workflow ID is required'
      }, 400);
    }

    console.log(`🚀 Executing workflow: ${workflowId}`);

    // For now, we'll need to store workflows to execute them later
    // This is a simplified implementation
    return c.json({
      success: false,
      error: 'Workflow execution from stored workflows not yet implemented'
    }, 501);

  } catch (error) {
    console.error('❌ Workflow execution error:', error);
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get workflow execution status
 */
workflowRoute.get('/status/:workflowId', async (c) => {
  try {
    initializeServices();
    
    const workflowId = c.req.param('workflowId');
    
    if (!workflowId) {
      return c.json({
        success: false,
        error: 'Workflow ID is required'
      }, 400);
    }

    const status = workflowExecutor.getExecutionStatus(workflowId);
    
    if (!status) {
      return c.json({
        success: false,
        error: 'Workflow not found'
      }, 404);
    }

    // Convert Map to object for JSON serialization
    const nodeStatuses: Record<string, any> = {};
    status.nodes.forEach((nodeStatus, nodeId) => {
      nodeStatuses[nodeId] = nodeStatus;
    });

    return c.json({
      success: true,
      status: {
        workflowId: status.workflowId,
        status: status.status,
        startTime: status.startTime,
        endTime: status.endTime,
        nodes: nodeStatuses,
        output: status.output
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Cancel workflow execution
 */
workflowRoute.post('/cancel/:workflowId', async (c) => {
  try {
    initializeServices();
    
    const workflowId = c.req.param('workflowId');
    
    if (!workflowId) {
      return c.json({
        success: false,
        error: 'Workflow ID is required'
      }, 400);
    }

    workflowExecutor.cancelWorkflow(workflowId);

    return c.json({
      success: true,
      message: 'Workflow cancellation requested'
    });

  } catch (error) {
    console.error('❌ Workflow cancellation error:', error);
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get WebSocket server statistics
 */
workflowRoute.get('/ws/stats', async (c) => {
  try {
    initializeServices();
    
    const stats = webSocketService.getStats();
    
    return c.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ WebSocket stats error:', error);
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Generate natural language description of workflow
 */
function generateNaturalLanguageDescription(workflow: any): string {
  const { name, nodes } = workflow;
  
  if (nodes.length === 0) {
    return `The "${name}" workflow has no steps.`;
  }

  const steps = nodes.map((node: any, index: number) => {
    const stepNum = index + 1;
    switch (node.type) {
      case 'web-scraping':
        return `Step ${stepNum}: Extract data from ${node.config.url || 'a webpage'}`;
      case 'api-call':
        return `Step ${stepNum}: Make an API call to retrieve data`;
      case 'pdf-extract':
        return `Step ${stepNum}: Extract text and tables from a PDF document`;
      case 'data-transform':
        return `Step ${stepNum}: Transform and filter the data`;
      case 'excel-export':
        return `Step ${stepNum}: Export the results to an Excel file`;
      default:
        return `Step ${stepNum}: ${node.label}`;
    }
  }).join(', then ');

  return `The "${name}" workflow will: ${steps}.`;
}

export { workflowRoute };