import { EventEmitter } from 'events';
import { WorkflowSchema, WorkflowNode } from './workflow-generator.js';

// Execution status types
export interface NodeExecutionStatus {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: {
    current: number;
    total: number;
    message: string;
  };
  result?: any;
  error?: {
    message: string;
    recoverable: boolean;
  };
  startTime?: Date;
  endTime?: Date;
}

export interface WorkflowExecutionStatus {
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  nodes: Map<string, NodeExecutionStatus>;
  startTime?: Date;
  endTime?: Date;
  output?: any;
}

// Natural language progress messages
const PROGRESS_MESSAGES = {
  'web-scraping': {
    start: 'Starting to scrape the webpage...',
    progress: 'Extracting data from the webpage...',
    complete: 'Successfully scraped data from the webpage!',
    error: 'Failed to scrape the webpage'
  },
  'api-call': {
    start: 'Making API request...',
    progress: 'Waiting for API response...',
    complete: 'API call completed successfully!',
    error: 'API call failed'
  },
  'pdf-extract': {
    start: 'Opening PDF document...',
    progress: 'Extracting text and tables from PDF...',
    complete: 'PDF data extracted successfully!',
    error: 'Failed to extract PDF data'
  },
  'data-transform': {
    start: 'Starting data transformation...',
    progress: 'Applying transformations and filters...',
    complete: 'Data transformation completed!',
    error: 'Data transformation failed'
  },
  'excel-export': {
    start: 'Creating Excel file...',
    progress: 'Writing data to Excel spreadsheet...',
    complete: 'Excel file created successfully!',
    error: 'Failed to create Excel file'
  }
};

export class WorkflowExecutor extends EventEmitter {
  private executions: Map<string, WorkflowExecutionStatus> = new Map();
  private mcpCallTool: (server: string, tool: string, args: any) => Promise<any>;

  constructor(mcpCallTool: (server: string, tool: string, args: any) => Promise<any>) {
    super();
    this.mcpCallTool = mcpCallTool;
  }

  /**
   * Execute a workflow with real-time updates
   */
  async executeWorkflow(workflow: WorkflowSchema): Promise<WorkflowExecutionStatus> {
    const execution: WorkflowExecutionStatus = {
      workflowId: workflow.id,
      status: 'running',
      nodes: new Map(),
      startTime: new Date()
    };

    // Initialize node statuses
    for (const node of workflow.nodes) {
      execution.nodes.set(node.id, {
        nodeId: node.id,
        status: 'pending'
      });
    }

    this.executions.set(workflow.id, execution);
    
    // Emit workflow start
    this.emit('workflow:start', {
      workflowId: workflow.id,
      name: workflow.name,
      message: `Starting workflow: ${workflow.name}`
    });

    try {
      // Execute nodes in order (simplified - real implementation would handle dependencies)
      const results = new Map<string, any>();
      
      for (const node of workflow.nodes) {
        const result = await this.executeNode(workflow.id, node, results);
        results.set(node.id, result);
      }

      // Update execution status
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.output = results.get(workflow.nodes[workflow.nodes.length - 1].id);

      // Emit workflow complete
      this.emit('workflow:complete', {
        workflowId: workflow.id,
        message: `Workflow completed successfully!`,
        output: execution.output
      });

    } catch (error) {
      execution.status = 'error';
      execution.endTime = new Date();

      // Emit workflow error
      this.emit('workflow:error', {
        workflowId: workflow.id,
        message: `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      });
    }

    return execution;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    workflowId: string, 
    node: WorkflowNode, 
    previousResults: Map<string, any>
  ): Promise<any> {
    const nodeStatus = this.getNodeStatus(workflowId, node.id);
    if (!nodeStatus) throw new Error(`Node ${node.id} not found`);

    // Update status to running
    nodeStatus.status = 'running';
    nodeStatus.startTime = new Date();

    // Emit node start with natural language message
    this.emit('node:start', {
      workflowId,
      nodeId: node.id,
      type: node.type,
      message: PROGRESS_MESSAGES[node.type]?.start || `Starting ${node.label}...`
    });

    try {
      // Simulate progress updates
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        if (progress <= 80) {
          nodeStatus.progress = {
            current: progress,
            total: 100,
            message: PROGRESS_MESSAGES[node.type]?.progress || `Processing...`
          };

          this.emit('node:progress', {
            workflowId,
            nodeId: node.id,
            progress: nodeStatus.progress,
            message: `${node.label}: ${progress}% complete`
          });
        }
      }, 500);

      // Execute based on node type
      let result: any;
      
      switch (node.type) {
        case 'web-scraping':
          result = await this.executeWebScraping(node);
          break;
        case 'api-call':
          result = await this.executeApiCall(node);
          break;
        case 'pdf-extract':
          result = await this.executePdfExtract(node);
          break;
        case 'data-transform':
          result = await this.executeDataTransform(node, previousResults);
          break;
        case 'excel-export':
          result = await this.executeExcelExport(node, previousResults);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      clearInterval(progressInterval);

      // Update node status
      nodeStatus.status = 'completed';
      nodeStatus.endTime = new Date();
      nodeStatus.result = result;
      nodeStatus.progress = {
        current: 100,
        total: 100,
        message: PROGRESS_MESSAGES[node.type]?.complete || `${node.label} completed!`
      };

      // Emit node complete
      this.emit('node:complete', {
        workflowId,
        nodeId: node.id,
        message: PROGRESS_MESSAGES[node.type]?.complete || `${node.label} completed successfully!`,
        result
      });

      return result;

    } catch (error) {
      // Update node status
      nodeStatus.status = 'error';
      nodeStatus.endTime = new Date();
      nodeStatus.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true
      };

      // Emit node error
      this.emit('node:error', {
        workflowId,
        nodeId: node.id,
        message: PROGRESS_MESSAGES[node.type]?.error || `${node.label} failed`,
        error
      });

      throw error;
    }
  }

  /**
   * Execute web scraping node
   */
  private async executeWebScraping(node: WorkflowNode): Promise<any> {
    const { url, mcpTool } = node.config;

    if (mcpTool) {
      // Use MCP tool if available
      return await this.mcpCallTool(mcpTool.server, mcpTool.name, {
        url,
        formats: ['markdown', 'html']
      });
    }

    // Fallback implementation
    return {
      url,
      data: `Mock scraped data from ${url}`,
      timestamp: new Date()
    };
  }

  /**
   * Execute API call node
   */
  private async executeApiCall(node: WorkflowNode): Promise<any> {
    const { method, url, headers, mcpTool } = node.config;

    if (mcpTool) {
      return await this.mcpCallTool(mcpTool.server, mcpTool.name, {
        url,
        method,
        headers
      });
    }

    // Fallback
    return {
      status: 200,
      data: { message: 'Mock API response' }
    };
  }

  /**
   * Execute PDF extraction node
   */
  private async executePdfExtract(node: WorkflowNode): Promise<any> {
    const { source, mcpTool } = node.config;

    if (mcpTool) {
      return await this.mcpCallTool(mcpTool.server, mcpTool.name, {
        source
      });
    }

    // Fallback
    return {
      text: 'Mock PDF content',
      tables: []
    };
  }

  /**
   * Execute data transformation node
   */
  private async executeDataTransform(
    node: WorkflowNode, 
    previousResults: Map<string, any>
  ): Promise<any> {
    const { transformations } = node.config;
    
    // Get input data from previous node
    const inputData = Array.from(previousResults.values()).pop();

    // Apply transformations (simplified)
    let transformedData = inputData;
    
    if (transformations && transformations.length > 0) {
      // Apply each transformation
      for (const transform of transformations) {
        // Simplified transformation logic
        transformedData = this.applyTransformation(transformedData, transform);
      }
    }

    return transformedData;
  }

  /**
   * Execute Excel export node
   */
  private async executeExcelExport(
    node: WorkflowNode,
    previousResults: Map<string, any>
  ): Promise<any> {
    const { format } = node.config;
    
    // Get input data
    const inputData = Array.from(previousResults.values()).pop();

    // Generate Excel file (mock)
    return {
      filename: `export-${Date.now()}.${format}`,
      size: 1024,
      rows: Array.isArray(inputData) ? inputData.length : 1,
      downloadUrl: `https://example.com/download/export-${Date.now()}.${format}`
    };
  }

  /**
   * Apply a transformation to data
   */
  private applyTransformation(data: any, _transformation: string): any {
    // Simplified transformation logic
    return data;
  }

  /**
   * Get node execution status
   */
  private getNodeStatus(workflowId: string, nodeId: string): NodeExecutionStatus | undefined {
    const execution = this.executions.get(workflowId);
    return execution?.nodes.get(nodeId);
  }

  /**
   * Cancel workflow execution
   */
  cancelWorkflow(workflowId: string): void {
    const execution = this.executions.get(workflowId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();

      this.emit('workflow:cancelled', {
        workflowId,
        message: 'Workflow execution cancelled'
      });
    }
  }

  /**
   * Get execution status
   */
  getExecutionStatus(workflowId: string): WorkflowExecutionStatus | undefined {
    return this.executions.get(workflowId);
  }

  /**
   * Convert execution events to natural language
   */
  formatProgressMessage(event: any): string {
    switch (event.type) {
      case 'workflow:start':
        return `🚀 ${event.message}`;
      case 'node:start':
        return `⚡ ${event.message}`;
      case 'node:progress':
        return `⏳ ${event.message}`;
      case 'node:complete':
        return `✅ ${event.message}`;
      case 'node:error':
        return `❌ ${event.message}`;
      case 'workflow:complete':
        return `🎉 ${event.message}`;
      case 'workflow:error':
        return `⛔ ${event.message}`;
      default:
        return event.message || 'Processing...';
    }
  }
}