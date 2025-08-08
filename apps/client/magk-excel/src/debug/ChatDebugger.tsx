import React, { useEffect } from 'react';
import { useChatHistory } from '../services/chatHistoryService';

export function ChatDebugger() {
  const { sessions, activeSessionId, getActiveSession } = useChatHistory();
  
  useEffect(() => {
    console.log('🔍 DEBUG: ChatDebugger mounted');
    console.log('📊 Sessions:', sessions);
    console.log('🆔 Active Session ID:', activeSessionId);
    console.log('💬 Active Session:', getActiveSession());
  }, [sessions, activeSessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const session = getActiveSession();
      if (session) {
        console.log(`⏱️ [${new Date().toLocaleTimeString()}] Messages:`, session.messages.length);
        if (session.messages.length > 0) {
          const lastMessage = session.messages[session.messages.length - 1];
          console.log('   Last message:', {
            role: lastMessage.role,
            content: lastMessage.content.substring(0, 50) + '...',
            timestamp: new Date(lastMessage.timestamp).toLocaleTimeString()
          });
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [getActiveSession]);

  return null;
}