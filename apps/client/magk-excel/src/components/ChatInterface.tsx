import { AiChat } from '@nlux/react';
import '@nlux/themes/nova.css';

// Real adapter - connects to our Hono.js backend with Claude
// Using correct @nlux observer pattern interface
const realAdapter = {
  streamText: (message: string, observer: any) => {
    console.log('🚀 Frontend: Starting chat request for message:', message);
    
    // Make the async request
    (async () => {
      try {
        console.log('📡 Frontend: Making fetch request to backend...');
        
        const response = await fetch('http://localhost:3001/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            history: [] // TODO: Implement proper history tracking
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

        if (!data.response) {
          console.error('❌ Frontend: No response field in data:', data);
          observer.error(new Error('Backend did not return a response field'));
          return;
        }

        console.log('✅ Frontend: Successfully got response, starting to stream...');
        
        // Stream the response word by word for better UX
        const words = data.response.split(' ');
        console.log(`📝 Frontend: Streaming ${words.length} words...`);
        
        for (const word of words) {
          observer.next(word + ' ');
          await new Promise(resolve => setTimeout(resolve, 30)); // Faster streaming
        }
        
        console.log('✅ Frontend: Finished streaming response');
        observer.complete();

      } catch (error) {
        console.error('❌ Frontend: Chat adapter error:', error);
        console.error('❌ Frontend: Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        observer.error(new Error(`Connection Error: ${error.message}. Please make sure the workflow engine is running on http://localhost:3001`));
      }
    })();
  }
};

export function ChatInterface() {
  return (
    <div className="h-full w-full">
      <AiChat
        adapter={realAdapter}
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
          placeholder: 'Ask me to create an Excel workflow...',
          autoFocus: true
        }}
        personaOptions={{
          assistant: {
            name: 'MAGK Assistant',
            tagline: 'Excel Workflow Expert',
            avatar: '🤖'
          }
        }}
      />
    </div>
  );
}