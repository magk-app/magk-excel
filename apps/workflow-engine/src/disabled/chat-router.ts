import { WorkflowService } from './workflow-service.js';
import { WorkflowExecutor } from './workflow-executor.js';

export type ChatAction = 
  | 'create-workflow' 
  | 'change-workflow' 
  | 'delete-workflow' 
  | 'execute-workflow' 
  | 'continue-conversation';

export interface ChatResult {
  response: string;
  action: ChatAction;
  workflowId?: string;
  requiresConfirmation?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatRouter {
  private workflowService = new WorkflowService();
  private workflowExecutor = new WorkflowExecutor();

  async processMessage(message: string, history: ChatMessage[]): Promise<ChatResult> {
    // Analyze the message to determine intent
    const intent = this.analyzeIntent(message, history);
    
    console.log(`🧠 Detected intent: ${intent}`);

    switch (intent) {
      case 'create-workflow':
        return await this.handleCreateWorkflow(message, history);
      
      case 'change-workflow':
        return await this.handleChangeWorkflow(message, history);
      
      case 'delete-workflow':
        return await this.handleDeleteWorkflow(message, history);
      
      case 'execute-workflow':
        return await this.handleExecuteWorkflow(message, history);
      
      default:
        return await this.handleContinueConversation(message, history);
    }
  }

  private analyzeIntent(message: string, history: ChatMessage[]): ChatAction {
    const lowerMessage = message.toLowerCase();
    
    // Check for workflow creation keywords
    if (this.containsAny(lowerMessage, [
      'create', 'build', 'make', 'generate', 'new workflow',
      'extract data', 'scrape', 'export to excel', 'get data from'
    ])) {
      return 'create-workflow';
    }
    
    // Check for workflow modification keywords
    if (this.containsAny(lowerMessage, [
      'change', 'modify', 'update', 'edit', 'alter', 'adjust'
    ]) && this.containsAny(lowerMessage, ['workflow', 'step', 'parameter'])) {
      return 'change-workflow';
    }
    
    // Check for workflow deletion keywords
    if (this.containsAny(lowerMessage, [
      'delete', 'remove', 'cancel', 'stop'
    ]) && this.containsAny(lowerMessage, ['workflow'])) {
      return 'delete-workflow';
    }
    
    // Check for execution keywords
    if (this.containsAny(lowerMessage, [
      'run', 'execute', 'start', 'begin', 'launch', 'go ahead', 'do it'
    ])) {
      return 'execute-workflow';
    }
    
    return 'continue-conversation';
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private async handleCreateWorkflow(message: string, history: ChatMessage[]): Promise<ChatResult> {
    try {
      // Generate workflow based on user request
      const workflow = await this.workflowService.generateWorkflow(message);
      
      return {
        response: `I've created a workflow for you: "${workflow.name}"\n\n${workflow.natural_language_plan.overview}\n\nHere's what I'll do:\n${workflow.natural_language_plan.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nWould you like me to execute this workflow or would you like to modify it first?`,
        action: 'create-workflow',
        workflowId: workflow.id,
        requiresConfirmation: false
      };
    } catch (error) {
      return {
        response: `I had trouble creating that workflow. Could you provide more details about what data you want to extract and from where?`,
        action: 'continue-conversation',
        requiresConfirmation: false
      };
    }
  }

  private async handleChangeWorkflow(message: string, history: ChatMessage[]): Promise<ChatResult> {
    // Find the most recent workflow from conversation context
    const workflowId = this.extractWorkflowIdFromHistory(history);
    
    if (!workflowId) {
      return {
        response: `I'd be happy to help you modify a workflow! Which workflow would you like to change? Please create a workflow first or specify which existing workflow you want to modify.`,
        action: 'continue-conversation',
        requiresConfirmation: false
      };
    }

    return {
      response: `I understand you want to modify the workflow. This is a significant change that could affect the results. Are you sure you want to proceed with these modifications?\n\n**Please confirm**: Type "yes, modify it" to proceed or "no, keep it as is" to cancel.`,
      action: 'change-workflow',
      workflowId,
      requiresConfirmation: true
    };
  }

  private async handleDeleteWorkflow(message: string, history: ChatMessage[]): Promise<ChatResult> {
    const workflowId = this.extractWorkflowIdFromHistory(history);
    
    if (!workflowId) {
      return {
        response: `I don't see a workflow to delete. Would you like me to show you your saved workflows so you can choose which one to remove?`,
        action: 'continue-conversation',
        requiresConfirmation: false
      };
    }

    return {
      response: `⚠️ **Are you sure you want to delete this workflow?** This action cannot be undone.\n\n**Please confirm**: Type "yes, delete it" to permanently remove this workflow or "no, keep it" to cancel.`,
      action: 'delete-workflow',
      workflowId,
      requiresConfirmation: true
    };
  }

  private async handleExecuteWorkflow(message: string, history: ChatMessage[]): Promise<ChatResult> {
    const workflowId = this.extractWorkflowIdFromHistory(history);
    
    if (!workflowId) {
      return {
        response: `I don't see a workflow to execute. Would you like me to create one first? Just tell me what data you want to extract and from where.`,
        action: 'continue-conversation',
        requiresConfirmation: false
      };
    }

    try {
      // Start workflow execution
      const execution = await this.workflowExecutor.startExecution(workflowId);
      
      return {
        response: `🚀 **Starting workflow execution!**\n\nExecution ID: ${execution.id}\n\nI'm now working on your request. You'll see real-time updates as I progress through each step. This should take about ${execution.estimatedDuration} to complete.`,
        action: 'execute-workflow',
        workflowId,
        requiresConfirmation: false
      };
    } catch (error) {
      return {
        response: `I encountered an issue starting the workflow execution. Let me try to fix this... ${error instanceof Error ? error.message : 'Unknown error'}`,
        action: 'continue-conversation',
        requiresConfirmation: false
      };
    }
  }

  private async handleContinueConversation(message: string, history: ChatMessage[]): Promise<ChatResult> {
    // Generate contextual response based on conversation history
    const response = this.generateConversationalResponse(message, history);
    
    return {
      response,
      action: 'continue-conversation',
      requiresConfirmation: false
    };
  }

  private generateConversationalResponse(message: string, history: ChatMessage[]): string {
    const responses = [
      "I'm here to help you create Excel workflows for data extraction. You can ask me to:\n\n• **Extract data** from websites, PDFs, or other sources\n• **Create workflows** for repetitive data tasks\n• **Export results** to Excel with custom formatting\n\nWhat would you like to work on?",
      
      "I specialize in automating data extraction and Excel workflows. I can help you scrape websites, process PDFs, call APIs, and organize everything into clean Excel files.\n\nWhat data source are you working with?",
      
      "Let me help you build a workflow! I can extract data from:\n\n• **Web pages** - scrape tables, lists, product data\n• **PDFs** - extract tables and structured data\n• **APIs** - fetch data from web services\n• **Excel files** - process and transform existing data\n\nWhat would you like to extract?",
      
      "I can create custom workflows that automatically extract, transform, and export data to Excel. Just describe what you want to accomplish and I'll build it for you.\n\nFor example: 'Extract product prices from Amazon' or 'Get weather data and export to Excel'"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private extractWorkflowIdFromHistory(history: ChatMessage[]): string | null {
    // Look for workflow IDs in recent assistant messages
    // This is a simplified implementation - in practice, you'd maintain context properly
    for (let i = history.length - 1; i >= 0; i--) {
      const message = history[i];
      if (message.role === 'assistant' && message.content.includes('workflow-')) {
        const match = message.content.match(/workflow-[a-f0-9-]+/);
        if (match) return match[0];
      }
    }
    return null;
  }
}