import { AiChat } from '@nlux/react';

// Mock adapter - returns dummy responses for now
const mockAdapter = {
  streamText: async function* (_message: string) {
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const responses = [
      "I understand you want to work with Excel workflows. Let me help you create a data extraction workflow.",
      "I can help you extract data from web pages, PDFs, or Excel files. What would you like to work with?",
      "Great! I'll create a workflow to extract that data and export it to Excel for you.",
      "Let me analyze your request and generate a workflow plan..."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Stream the response word by word
    const words = response.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
};

export function ChatInterface() {
  return (
    <div className="h-full w-full">
      <AiChat
        adapter={mockAdapter}
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