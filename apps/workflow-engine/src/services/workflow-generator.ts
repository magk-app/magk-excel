import { LLMService } from './llm-service.js';

// Workflow schema types
export interface WorkflowNode {
  id: string;
  type: 'web-scraping' | 'api-call' | 'pdf-extract' | 'data-transform' | 'excel-export';
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  status?: 'pending' | 'running' | 'completed' | 'error';
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowSchema {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    generatedFrom: 'chat' | 'manual';
    naturalLanguageQuery?: string;
  };
}

// Chat to workflow intent mapping
interface WorkflowIntent {
  action: string;
  source: string;
  target: string;
  transformations?: string[];
  filters?: string[];
}

export class WorkflowGenerator {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Generate workflow from chat message
   */
  async generateFromChat(message: string, mcpTools: any[]): Promise<WorkflowSchema> {
    console.log('🎯 Generating workflow from chat:', message);

    // Extract workflow intent
    const intent = await this.extractWorkflowIntent(message);
    
    // Map intent to nodes
    const nodes = this.createWorkflowNodes(intent, mcpTools);
    
    // Create edges to connect nodes
    const edges = this.createWorkflowEdges(nodes);

    // Generate workflow schema
    const workflow: WorkflowSchema = {
      id: `wf-${Date.now()}`,
      name: this.generateWorkflowName(intent),
      description: `Generated from: "${message}"`,
      nodes,
      edges,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedFrom: 'chat',
        naturalLanguageQuery: message
      }
    };

    console.log('✅ Generated workflow:', workflow);
    return workflow;
  }

  /**
   * Extract workflow intent from natural language
   */
  private async extractWorkflowIntent(message: string): Promise<WorkflowIntent> {
    const prompt = `Extract the workflow intent from this message. Identify:
    1. Main action (scrape, extract, transform, export)
    2. Data source (URL, PDF, API, etc.)
    3. Target format (Excel, JSON, etc.)
    4. Any transformations or filters
    
    Message: "${message}"
    
    Respond in JSON format:
    {
      "action": "scrape|extract|transform|export",
      "source": "source description",
      "target": "target format",
      "transformations": ["list of transformations"],
      "filters": ["list of filters"]
    }`;

    const response = await this.llmService.chatWithSystem(
      'You are a workflow intent extractor. Extract structured intent from natural language.',
      prompt,
      []
    );

    try {
      return JSON.parse(response);
    } catch {
      // Fallback to basic intent
      return {
        action: 'extract',
        source: message,
        target: 'excel',
        transformations: [],
        filters: []
      };
    }
  }

  /**
   * Create workflow nodes based on intent
   */
  private createWorkflowNodes(intent: WorkflowIntent, mcpTools: any[]): WorkflowNode[] {
    const nodes: WorkflowNode[] = [];
    let nodeIndex = 0;
    let yPosition = 100;

    // Source node based on intent
    if (intent.source.includes('http') || intent.action === 'scrape') {
      nodes.push({
        id: `node-${nodeIndex++}`,
        type: 'web-scraping',
        label: 'Web Scraping',
        config: {
          url: this.extractUrl(intent.source) || 'https://example.com',
          selector: 'table',
          mcpTool: mcpTools.find(t => t.name === 'scrape_url')
        },
        position: { x: 100, y: yPosition }
      });
      yPosition += 150;
    } else if (intent.source.includes('pdf')) {
      nodes.push({
        id: `node-${nodeIndex++}`,
        type: 'pdf-extract',
        label: 'PDF Extraction',
        config: {
          source: 'upload',
          mcpTool: mcpTools.find(t => t.name === 'extract_pdf_text')
        },
        position: { x: 100, y: yPosition }
      });
      yPosition += 150;
    } else if (intent.source.includes('api')) {
      nodes.push({
        id: `node-${nodeIndex++}`,
        type: 'api-call',
        label: 'API Call',
        config: {
          method: 'GET',
          url: 'https://api.example.com',
          mcpTool: mcpTools.find(t => t.name === 'fetch')
        },
        position: { x: 100, y: yPosition }
      });
      yPosition += 150;
    }

    // Transformation nodes
    if (intent.transformations && intent.transformations.length > 0) {
      nodes.push({
        id: `node-${nodeIndex++}`,
        type: 'data-transform',
        label: 'Data Transformation',
        config: {
          transformations: intent.transformations,
          filters: intent.filters
        },
        position: { x: 300, y: yPosition }
      });
      yPosition += 150;
    }

    // Export node
    if (intent.target.includes('excel') || intent.target.includes('xlsx')) {
      nodes.push({
        id: `node-${nodeIndex++}`,
        type: 'excel-export',
        label: 'Excel Export',
        config: {
          format: 'xlsx',
          includeHeaders: true,
          autoFormat: true
        },
        position: { x: 500, y: yPosition }
      });
    }

    return nodes;
  }

  /**
   * Create edges to connect workflow nodes
   */
  private createWorkflowEdges(nodes: WorkflowNode[]): WorkflowEdge[] {
    const edges: WorkflowEdge[] = [];
    
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge-${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        label: `Step ${i + 1} → ${i + 2}`
      });
    }

    return edges;
  }

  /**
   * Generate workflow name from intent
   */
  private generateWorkflowName(intent: WorkflowIntent): string {
    const action = intent.action.charAt(0).toUpperCase() + intent.action.slice(1);
    const source = intent.source.split(' ').slice(0, 3).join(' ');
    return `${action} ${source}`;
  }

  /**
   * Extract URL from text
   */
  private extractUrl(text: string): string | null {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  /**
   * Validate generated workflow
   */
  validateWorkflow(workflow: WorkflowSchema): boolean {
    // Must have at least one node
    if (workflow.nodes.length === 0) return false;

    // All edges must connect valid nodes
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert workflow to executable format
   */
  toExecutableWorkflow(workflow: WorkflowSchema): any {
    return {
      id: workflow.id,
      name: workflow.name,
      steps: workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        config: node.config,
        dependencies: workflow.edges
          .filter(e => e.target === node.id)
          .map(e => e.source)
      }))
    };
  }
}