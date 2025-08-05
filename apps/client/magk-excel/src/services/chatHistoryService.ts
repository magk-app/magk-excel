import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: {
    name: string;
    type: 'pdf' | 'excel';
    size: number;
  }[];
  mcpToolCalls?: {
    server: string;
    tool: string;
    args: any;
    result?: any;
    error?: string;
    duration?: number;
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  isActive: boolean;
}

interface ChatHistoryState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  
  // Session management
  createSession: (title?: string) => string;
  deleteSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  
  // Message management
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  clearSession: (sessionId: string) => void;
  
  // Getters
  getActiveSession: () => ChatSession | null;
  getSessionHistory: (sessionId: string) => ChatMessage[];
  
  // Import/Export
  exportSession: (sessionId: string) => string;
  importSession: (sessionData: string) => void;
}

export const useChatHistory = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (title?: string) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const newSession: ChatSession = {
          id: sessionId,
          title: title || `Chat ${new Date().toLocaleDateString()}`,
          createdAt: now,
          updatedAt: now,
          messages: [],
          isActive: false
        };

        set(state => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: sessionId
        }));

        // Update all sessions to mark only this one as active
        set(state => ({
          sessions: state.sessions.map(session => ({
            ...session,
            isActive: session.id === sessionId
          }))
        }));

        return sessionId;
      },

      deleteSession: (sessionId: string) => {
        set(state => {
          const filteredSessions = state.sessions.filter(s => s.id !== sessionId);
          const newActiveId = state.activeSessionId === sessionId 
            ? (filteredSessions.length > 0 ? filteredSessions[0].id : null)
            : state.activeSessionId;

          return {
            sessions: filteredSessions.map(session => ({
              ...session,
              isActive: session.id === newActiveId
            })),
            activeSessionId: newActiveId
          };
        });
      },

      setActiveSession: (sessionId: string) => {
        set(state => ({
          sessions: state.sessions.map(session => ({
            ...session,
            isActive: session.id === sessionId
          })),
          activeSessionId: sessionId
        }));
      },

      updateSessionTitle: (sessionId: string, title: string) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, title, updatedAt: Date.now() }
              : session
          )
        }));
      },

      addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = Date.now();

        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [...session.messages, {
                    ...message,
                    id: messageId,
                    timestamp
                  }],
                  updatedAt: timestamp
                }
              : session
          )
        }));
      },

      updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: session.messages.map(message =>
                    message.id === messageId
                      ? { ...message, ...updates }
                      : message
                  ),
                  updatedAt: Date.now()
                }
              : session
          )
        }));
      },

      clearSession: (sessionId: string) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, messages: [], updatedAt: Date.now() }
              : session
          )
        }));
      },

      getActiveSession: () => {
        const state = get();
        return state.sessions.find(s => s.id === state.activeSessionId) || null;
      },

      getSessionHistory: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        return session?.messages || [];
      },

      exportSession: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) throw new Error('Session not found');
        
        return JSON.stringify({
          ...session,
          exportedAt: Date.now(),
          version: '1.0'
        }, null, 2);
      },

      importSession: (sessionData: string) => {
        try {
          const importedSession = JSON.parse(sessionData);
          const sessionId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const newSession: ChatSession = {
            id: sessionId,
            title: `${importedSession.title} (Imported)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: importedSession.messages || [],
            isActive: false
          };

          set(state => ({
            sessions: [...state.sessions, newSession]
          }));
        } catch (error) {
          console.error('Failed to import session:', error);
          throw new Error('Invalid session data');
        }
      }
    }),
    {
      name: 'magk-chat-history',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration if storage format changes
        if (version === 0) {
          // Initial migration from version 0 to 1
          return {
            sessions: [],
            activeSessionId: null,
            ...persistedState
          };
        }
        return persistedState;
      }
    }
  )
);

// Helper functions for easier usage
export const chatHistoryHelpers = {
  // Auto-generate session title from first message
  generateSessionTitle: (firstMessage: string): string => {
    const words = firstMessage.trim().split(' ').slice(0, 6);
    let title = words.join(' ');
    if (firstMessage.length > title.length) {
      title += '...';
    }
    return title || 'New Chat';
  },

  // Format message for display
  formatMessageTime: (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;
    
    return date.toLocaleDateString();
  },

  // Convert messages to NLUX history format
  toNLUXHistory: (messages: ChatMessage[]) => {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  },

  // Get session stats
  getSessionStats: (session: ChatSession) => {
    const userMessages = session.messages.filter(m => m.role === 'user').length;
    const assistantMessages = session.messages.filter(m => m.role === 'assistant').length;
    const totalToolCalls = session.messages.reduce((acc, m) => acc + (m.mcpToolCalls?.length || 0), 0);
    
    return {
      userMessages,
      assistantMessages,
      totalMessages: session.messages.length,
      totalToolCalls,
      duration: session.updatedAt - session.createdAt
    };
  }
};