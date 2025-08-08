/**
 * Basic tests for ExecutorMCPTool functionality
 */

import { ExecutorMCPTool } from '../ExecutorMCPTool';

describe('ExecutorMCPTool Basic Tests', () => {
  let tool: ExecutorMCPTool;

  beforeEach(() => {
    tool = new ExecutorMCPTool();
  });

  it('should provide tool definitions', () => {
    const definitions = ExecutorMCPTool.getToolDefinitions();
    expect(definitions).toHaveLength(1);
    expect(definitions[0].name).toBe('run_ts');
    expect(definitions[0].description).toContain('ExcelJS');
  });

  it('should handle unknown tool names', async () => {
    const result = await tool.handleToolCall({
      name: 'unknown_tool',
      arguments: {}
    });
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown executor operation');
  });

  it('should require code parameter', async () => {
    const result = await tool.handleToolCall({
      name: 'run_ts',
      arguments: {}
    });
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Missing "code" string');
  });

  it('should create tool instance', () => {
    expect(tool).toBeInstanceOf(ExecutorMCPTool);
  });
});