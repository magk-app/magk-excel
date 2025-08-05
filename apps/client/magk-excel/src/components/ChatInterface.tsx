import { AiChat } from '@nlux/react';
import '@nlux/themes/nova.css';
import { useMCPChat } from '../hooks/useMCPChat';
import { useMCPStore } from '../services/mcpService';


export function ChatInterface() {
  const { tools, enabledServers } = useMCPStore();
  const { callTool } = useMCPChat();

  console.log('🔍 ChatInterface: Current enabled servers:', enabledServers);
  console.log('🛠️ ChatInterface: Available tools:', tools.length);

  // Enhanced adapter with dynamic MCP server detection
  const mcpEnhancedAdapter = {
    streamText: (message: string, observer: any) => {
      console.log('🚀 Frontend: Starting MCP-enhanced chat request for message:', message);
      
      // Make the async request with MCP tool execution
      (async () => {
        try {
          console.log('📡 Frontend: Making fetch request to backend...');
          
          console.log('🛠️ Frontend: Using tools from enabled servers:', enabledServers);
          console.log('🔧 Frontend: All available tools:', tools);

          // Prepare dynamic MCP servers data (includes Smithery servers!)
          const mcpServers = enabledServers.reduce((acc, server) => {
            acc[server] = {
              enabled: true,
              tools: tools.filter(tool => tool.server === server)
            };
            return acc;
          }, {} as Record<string, any>);

          console.log('📊 Frontend: Dynamic MCP servers data:', mcpServers);

          // Send to backend for LLM processing with dynamic MCP tool context
          const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              history: [], // TODO: Implement proper history tracking
              mcpTools: tools, // Send ALL available MCP tools (including Smithery!)
              mcpServers: mcpServers // Dynamic server detection
            })
          });

          console.log('📨 Frontend: Received response with status:', response.status);

          if (!response.ok) {
            console.error('❌ Frontend: HTTP error:', response.status, response.statusText);
            observer.error(new Error(`HTTP Error ${response.status}: ${response.statusText}`));
            return;
          }

          const data = await response.json();
          console.log('📋 Frontend: Parsed response data:', data);
          
          if (data.status === 'error') {
            console.error('❌ Frontend: Backend returned error:', data.error);
            observer.error(new Error(`Backend Error: ${data.error || 'Unknown error occurred'}`));
            return;
          }

          // Handle LLM response with potential MCP tool calls
          if (data.mcpToolCalls && data.mcpToolCalls.length > 0) {
            console.log('🛠️ Frontend: LLM requested MCP tool calls:', data.mcpToolCalls);
            
            // Stream initial response
            if (data.response) {
              observer.next(`${data.response}\n\n`);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Show tool execution status
            observer.next('🔧 **Executing MCP Tools:**\n\n');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Execute each tool call and stream results
            for (const toolCall of data.mcpToolCalls) {
              try {
                observer.next(`⚡ Calling **${toolCall.tool}** from **${toolCall.server}**...\n`);
                await new Promise(resolve => setTimeout(resolve, 200));
                
                const result = await callTool(toolCall.server, toolCall.tool, toolCall.args);
                
                observer.next(`✅ **${toolCall.tool}** completed successfully:\n`);
                observer.next(`\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\n`);
                await new Promise(resolve => setTimeout(resolve, 300));
                
              } catch (error) {
                observer.next(`❌ **${toolCall.tool}** failed: ${error}\n\n`);
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            }
            
            // Stream final summary if provided
            if (data.summary) {
              observer.next('📊 **Summary:**\n');
              const summaryWords = data.summary.split(' ');
              for (const word of summaryWords) {
                observer.next(word + ' ');
                await new Promise(resolve => setTimeout(resolve, 30));
              }
            }
            
          } else {
            // Regular response without tool calls
            if (!data.response) {
              console.error('❌ Frontend: No response field in data:', data);
              observer.error(new Error('Backend did not return a response field'));
              return;
            }

            console.log('✅ Frontend: Successfully got response, starting to stream...');
            
            // Stream the response word by word for better UX
            const words = data.response.split(' ');
            console.log(`📝 Frontend: Streaming ${words.length} words...`);
            
            let streamedContent = '';
            for (const word of words) {
              streamedContent += word + ' ';
              observer.next(streamedContent);
              await new Promise(resolve => setTimeout(resolve, 30)); // Faster streaming
            }
          }
          
          console.log('✅ Frontend: Finished streaming response');
          observer.complete();

        } catch (error) {
          console.error('❌ Frontend: Chat adapter error:', error);
          console.error('❌ Frontend: Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          observer.error(new Error(`Connection Error: ${errorMessage}. Please make sure the workflow engine is running on http://localhost:3001`));
        }
      })();
    }
  };

  return (
    <div className="h-full w-full">
      <AiChat
        adapter={mcpEnhancedAdapter}
        displayOptions={{
          colorScheme: 'auto',
          width: '100%',
          height: '100%'
        }}
        conversationOptions={{
          historyPayloadSize: 'max'
        }}
        messageOptions={{
          showCodeBlockCopyButton: true,
          markdownLinkTarget: 'blank'
        }}
        composerOptions={{
          placeholder: 'Ask me to create an Excel workflow, extract PDF data, or scrape web content...',
          autoFocus: true
        }}
        personaOptions={{
          assistant: {
            name: 'MAGK Assistant',
            tagline: 'Excel Workflow Expert with MCP Tools',
            avatar: '🤖'
          }
        }}
      />
    </div>
  );
}