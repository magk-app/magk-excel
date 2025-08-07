import { useMCPStore } from '../services/mcpService';
import { MCPTool } from '../electron';

interface MCPToolCall {
  server: string;
  tool: string;
  args: any;
}

export function useMCPChat() {
  const { tools, callTool, readResource } = useMCPStore();

  // Parse message to detect tool calls
  const parseToolCalls = (message: string): MCPToolCall[] => {
    const toolCalls: MCPToolCall[] = [];
    
    // Simple pattern matching for now
    // In production, this would be handled by the LLM backend
    
    // Pattern: "use [tool_name] from [server_name] with [args]"
    const toolPattern = /use (\w+) from (\w+) with (.+)/gi;
    let match;
    
    while ((match = toolPattern.exec(message)) !== null) {
      const [, toolName, serverName, argsStr] = match;
      try {
        const args = JSON.parse(argsStr);
        toolCalls.push({
          server: serverName,
          tool: toolName,
          args
        });
      } catch {
        // If not valid JSON, treat as string argument
        toolCalls.push({
          server: serverName,
          tool: toolName,
          args: { input: argsStr.trim() }
        });
      }
    }
    
    return toolCalls;
  };

  // Execute tool calls from a message
  const executeToolCalls = async (toolCalls: MCPToolCall[]) => {
    const results = [];
    
    for (const call of toolCalls) {
      try {
        console.log(`🔧 Executing tool: ${call.server}/${call.tool}`, call.args);
        
        // Ensure the tool name is correctly mapped
        const toolName = call.tool || call.name;
        const serverName = call.server || 'excel';
        
        const result = await callTool(serverName, toolName, call.args);
        console.log(`✅ Tool result:`, result);
        
        results.push({
          success: true,
          server: serverName,
          tool: toolName,
          result
        });
      } catch (error) {
        console.error(`❌ Tool execution failed:`, error);
        results.push({
          success: false,
          server: call.server,
          tool: call.tool || call.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  };

  // Find tools that match a query
  const findRelevantTools = (query: string): MCPTool[] => {
    const lowerQuery = query.toLowerCase();
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(lowerQuery) ||
      (tool.description && tool.description.toLowerCase().includes(lowerQuery))
    );
  };

  // Format tool results for display
  const formatToolResults = (results: any[]): string => {
    return results.map(r => {
      if (r.success) {
        return `✅ ${r.tool} from ${r.server}: ${JSON.stringify(r.result, null, 2)}`;
      } else {
        return `❌ ${r.tool} from ${r.server} failed: ${r.error}`;
      }
    }).join('\n\n');
  };

  return {
    tools,
    parseToolCalls,
    executeToolCalls,
    findRelevantTools,
    formatToolResults,
    callTool,
    readResource
  };
}