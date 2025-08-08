/**
 * Chat Session Hook
 * Issue #11: Fix chat session typing glitch on retrieval
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChatHistory } from '../services/chatHistoryService';

export interface ChatSessionState {
  isTyping: boolean;
  inputValue: string;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useChatSession() {
  const [state, setState] = useState<ChatSessionState>({
    isTyping: false,
    inputValue: '',
    sessionId: null,
    isLoading: false,
    error: null
  });
  
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const sessionLoadedRef = useRef(false);
  
  const { activeSessionId, getActiveSession } = useChatHistory();
  
  // Handle session changes
  useEffect(() => {
    if (activeSessionId && activeSessionId !== state.sessionId) {
      setState(prev => ({
        ...prev,
        sessionId: activeSessionId,
        isLoading: true,
        error: null
      }));
      
      // Add a small delay to ensure UI is ready
      const loadTimeout = setTimeout(() => {
        sessionLoadedRef.current = false;
        
        try {
          const session = getActiveSession();
          if (session) {
            // Reset input state when session loads
            setState(prev => ({
              ...prev,
              inputValue: '',
              isTyping: false,
              isLoading: false
            }));
            
            // Focus input after session loads
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(0, 0);
              }
              sessionLoadedRef.current = true;
            }, 100);
          }
        } catch (error) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Failed to load session'
          }));
        }
      }, 50);
      
      return () => clearTimeout(loadTimeout);
    }
  }, [activeSessionId, state.sessionId, getActiveSession]);
  
  // Handle input changes
  const handleInputChange = useCallback((value: string) => {
    if (!sessionLoadedRef.current && state.isLoading) {
      // Prevent typing while session is loading
      return;
    }
    
    setState(prev => ({
      ...prev,
      inputValue: value,
      isTyping: value.length > 0
    }));
  }, [state.isLoading]);
  
  // Handle sending message
  const handleSendMessage = useCallback((message: string) => {
    if (!message.trim() || state.isLoading) {
      return;
    }
    
    setState(prev => ({
      ...prev,
      inputValue: '',
      isTyping: false
    }));
    
    // Return the message to be processed
    return message;
  }, [state.isLoading]);
  
  // Reset session
  const resetSession = useCallback(() => {
    setState({
      isTyping: false,
      inputValue: '',
      sessionId: null,
      isLoading: false,
      error: null
    });
    sessionLoadedRef.current = false;
  }, []);
  
  // Force refresh input
  const refreshInput = useCallback(() => {
    if (inputRef.current) {
      const currentValue = inputRef.current.value;
      inputRef.current.value = '';
      inputRef.current.value = currentValue;
      inputRef.current.focus();
    }
  }, []);
  
  return {
    ...state,
    inputRef,
    handleInputChange,
    handleSendMessage,
    resetSession,
    refreshInput,
    isReady: sessionLoadedRef.current && !state.isLoading
  };
}

export default useChatSession;