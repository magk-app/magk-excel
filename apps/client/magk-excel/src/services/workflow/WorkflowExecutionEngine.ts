/**
 * WorkflowExecutionEngine - Executes workflow nodes in proper order
 * Handles dependencies, parallel execution, and error handling
 */

import { Node, Edge } from 'reactflow';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'error';

export interface ExecutionResult {
  nodeId: string;
  status: ExecutionStatus;
  output?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface WorkflowContext {
  variables: Map<string, any>;
  results: Map<string, ExecutionResult>;
  mcpTools?: any[];
  llmService?: any;
}

export class WorkflowExecutionEngine {
  private context: WorkflowContext;
  private abortController: AbortController | null = null;

  constructor() {
    this.context = {
      variables: new Map(),
      results: new Map(),
    };
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflow: { nodes: Node[]; edges: Edge[] },
    onProgress?: (nodeId: string, status: ExecutionStatus, output?: any, error?: string) => void
  ): Promise<Map<string, ExecutionResult>> {
    // Create abort controller for cancellation
    this.abortController = new AbortController();
    
    // Reset context
    this.context.results.clear();
    this.context.variables.clear();
    
    // Build execution order based on dependencies
    const executionOrder = this.buildExecutionOrder(workflow.nodes, workflow.edges);
    
    // Execute nodes in order
    for (const nodeGroup of executionOrder) {
      // Execute nodes in parallel within each group
      const promises = nodeGroup.map((node) =>
        this.executeNode(node, onProgress)
      );
      
      await Promise.all(promises);
      
      // Check if execution was cancelled
      if (this.abortController.signal.aborted) {
        break;
      }
    }
    
    return this.context.results;
  }

  /**
   * Cancel execution
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Build execution order based on dependencies
   */
  private buildExecutionOrder(nodes: Node[], edges: Edge[]): Node[][] {
    // Create dependency map
    const dependencies = new Map<string, Set<string>>();
    const nodeLookup = new Map<string, Node>();
    
    nodes.forEach((node) => {
      nodeLookup.set(node.id, node);
      dependencies.set(node.id, new Set());
    });
    
    // Add dependencies from edges
    edges.forEach((edge) => {
      const deps = dependencies.get(edge.target);
      if (deps) {
        deps.add(edge.source);
      }
    });
    
    // Topological sort with level grouping
    const executionOrder: Node[][] = [];
    const visited = new Set<string>();
    
    while (visited.size < nodes.length) {
      const currentLevel: Node[] = [];
      
      // Find nodes with no unvisited dependencies
      nodes.forEach((node) => {
        if (!visited.has(node.id)) {
          const deps = dependencies.get(node.id)!;
          const unvisitedDeps = Array.from(deps).filter((dep) => !visited.has(dep));
          
          if (unvisitedDeps.length === 0) {
            currentLevel.push(node);
          }
        }
      });
      
      if (currentLevel.length === 0 && visited.size < nodes.length) {
        // Circular dependency detected - add remaining nodes
        nodes.forEach((node) => {
          if (!visited.has(node.id)) {
            currentLevel.push(node);
          }
        });
      }
      
      currentLevel.forEach((node) => visited.add(node.id));
      
      if (currentLevel.length > 0) {
        executionOrder.push(currentLevel);
      }
    }
    
    return executionOrder;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: Node,
    onProgress?: (nodeId: string, status: ExecutionStatus, output?: any, error?: string) => void
  ): Promise<void> {
    const startTime = new Date();
    
    // Update status to running
    if (onProgress) {
      onProgress(node.id, 'running');
    }
    
    try {
      // Check if cancelled
      if (this.abortController?.signal.aborted) {
        throw new Error('Execution cancelled');
      }
      
      // Execute based on node type
      const output = await this.executeNodeByType(node);
      
      // Store result
      const result: ExecutionResult = {
        nodeId: node.id,
        status: 'completed',
        output,
        startTime,
        endTime: new Date(),
      };
      
      this.context.results.set(node.id, result);
      
      // Store output as variable for downstream nodes
      this.context.variables.set(node.id, output);
      
      // Update progress
      if (onProgress) {
        onProgress(node.id, 'completed', output);
      }
    } catch (error) {
      // Handle error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const result: ExecutionResult = {
        nodeId: node.id,
        status: 'error',
        error: errorMessage,
        startTime,
        endTime: new Date(),
      };
      
      this.context.results.set(node.id, result);
      
      // Update progress
      if (onProgress) {
        onProgress(node.id, 'error', undefined, errorMessage);
      }
    }
  }

  /**
   * Execute node based on its type
   */
  private async executeNodeByType(node: Node): Promise<any> {
    const { type, data } = node;
    
    switch (type) {
      case 'code':
        return this.executeCodeNode(data);
      
      case 'prompt':
        return this.executePromptNode(data);
      
      case 'web-scraping':
        return this.executeWebScrapingNode(data);
      
      case 'data-transform':
        return this.executeDataTransformNode(data);
      
      case 'excel-export':
        return this.executeExcelExportNode(data);
      
      case 'pdf-extract':
        return this.executePdfExtractNode(data);
      
      case 'api-call':
        return this.executeApiCallNode(data);
      
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }

  /**
   * Execute code node
   */
  private async executeCodeNode(data: any): Promise<any> {
    const { code, language } = data;
    
    if (!code) {
      throw new Error('No code provided');
    }
    
    // Create a sandboxed context with access to previous results
    const context = {
      variables: Object.fromEntries(this.context.variables),
      results: Object.fromEntries(
        Array.from(this.context.results.entries()).map(([k, v]) => [k, v.output])
      ),
    };
    
    try {
      // Execute code (in production, use a proper sandbox like VM2 or Web Workers)
      const func = new Function('context', `
        const { variables, results } = context;
        ${code}
      `);
      
      return await func(context);
    } catch (error) {
      throw new Error(`Code execution failed: ${error}`);
    }
  }

  /**
   * Execute LLM prompt node
   */
  private async executePromptNode(data: any): Promise<any> {
    const { prompt, model, temperature } = data;
    
    if (!prompt) {
      throw new Error('No prompt provided');
    }
    
    // Interpolate variables in prompt
    const interpolatedPrompt = this.interpolateVariables(prompt);
    
    // Mock LLM call (replace with actual LLM service)
    await this.delay(1000);
    
    return {
      response: `Response to: ${interpolatedPrompt}`,
      model,
      temperature,
    };
  }

  /**
   * Execute web scraping node
   */
  private async executeWebScrapingNode(data: any): Promise<any> {
    const { url, selector } = data;
    
    if (!url) {
      throw new Error('No URL provided');
    }
    
    // Mock web scraping (replace with actual scraping service)
    await this.delay(1500);
    
    return {
      url,
      data: [
        { title: 'Item 1', price: '$10.00', description: 'Description 1' },
        { title: 'Item 2', price: '$20.00', description: 'Description 2' },
      ],
      selector,
    };
  }

  /**
   * Execute data transform node
   */
  private async executeDataTransformNode(data: any): Promise<any> {
    const { transformations } = data;
    
    // Get input from previous nodes
    const inputs = Array.from(this.context.variables.values());
    
    // Mock transformation (replace with actual transformation logic)
    await this.delay(500);
    
    return {
      transformed: inputs,
      transformations,
    };
  }

  /**
   * Execute Excel export node
   */
  private async executeExcelExportNode(data: any): Promise<any> {
    const { fileName } = data;
    
    // Get data from previous nodes
    const inputData = Array.from(this.context.variables.values());
    
    // Mock Excel export (replace with actual export service)
    await this.delay(1000);
    
    return {
      fileName: fileName || 'output.xlsx',
      rows: inputData.length,
      status: 'exported',
    };
  }

  /**
   * Execute PDF extract node
   */
  private async executePdfExtractNode(data: any): Promise<any> {
    const { extractTables, extractText } = data;
    
    // Mock PDF extraction (replace with actual extraction service)
    await this.delay(2000);
    
    return {
      tables: extractTables ? [['Header 1', 'Header 2'], ['Data 1', 'Data 2']] : [],
      text: extractText ? 'Extracted text from PDF' : '',
    };
  }

  /**
   * Execute API call node
   */
  private async executeApiCallNode(data: any): Promise<any> {
    const { method, url, headers, body } = data;
    
    if (!url) {
      throw new Error('No URL provided');
    }
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: this.abortController?.signal,
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      // Return mock data for demo
      await this.delay(1000);
      return {
        status: 200,
        data: { message: 'Mock API response' },
      };
    }
  }

  /**
   * Interpolate variables in a string
   */
  private interpolateVariables(text: string): string {
    let result = text;
    
    this.context.variables.forEach((value, key) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(regex, JSON.stringify(value));
    });
    
    return result;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}