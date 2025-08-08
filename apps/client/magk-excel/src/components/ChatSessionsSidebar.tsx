import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { useChatHistory, chatHistoryHelpers, ChatSession } from '../services/chatHistoryService';

interface ChatSessionsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSessionsSidebar({ isOpen, onToggle }: ChatSessionsSidebarProps) {
  const {
    sessions,
    activeSessionId,
    createSession,
    deleteSession,
    setActiveSession,
    updateSessionTitle,
    clearSession,
    exportSession,
    importSession
  } = useChatHistory();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');

  const handleNewChat = () => {
    const sessionId = createSession();
    console.log('Created new chat session:', sessionId);
  };

  const handleSessionClick = (sessionId: string) => {
    setActiveSession(sessionId);
    console.log('Switched to session:', sessionId);
  };

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveEdit = () => {
    if (editingSessionId && editingTitle.trim()) {
      updateSessionTitle(editingSessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleDelete = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      deleteSession(sessionId);
    }
  };



  const handleExport = (sessionId: string) => {
    try {
      const exportData = exportSession(sessionId);
      const session = sessions.find(s => s.id === sessionId);
      const filename = `${session?.title || 'chat'}-export.json`;
      
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = () => {
    try {
      setImportError('');
      importSession(importData);
      setImportData('');
      setImportDialogOpen(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  if (!isOpen) {
    return (
      <div className="w-12 border-r bg-muted/30 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
          title="Open chat sessions"
        >
          💬
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="h-8 w-8 p-0 mt-2"
          title="New chat"
        >
          ➕
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Chat Sessions</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
            title="Close sidebar"
          >
            ◀
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleNewChat}
            size="sm"
            className="flex-1"
          >
            ➕ New Chat
          </Button>
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" title="Import session">
                📥
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Chat Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste exported chat session JSON here..."
                  className="w-full h-32 p-2 border rounded-md resize-none font-mono text-sm"
                />
                {importError && (
                  <Alert variant="destructive">
                    <AlertDescription>{importError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={!importData.trim()}>
                    Import
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm">No chat sessions yet</p>
            <p className="text-xs">Create a new chat to get started</p>
          </div>
        ) : (
          sortedSessions.map((session) => {
            const stats = chatHistoryHelpers.getSessionStats(session);
            const isActive = session.id === activeSessionId;
            const isEditing = editingSessionId === session.id;

            return (
              <Card
                key={session.id}
                className={`group cursor-pointer transition-all hover:shadow-md ${
                  isActive 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => !isEditing && handleSessionClick(session.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    {isEditing ? (
                      <div className="flex-1 mr-2">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          onBlur={handleSaveEdit}
                          className="h-6 text-sm"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate" title={session.title}>
                          {session.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {chatHistoryHelpers.formatMessageTime(session.updatedAt)}
                        </p>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(session);
                          }}
                          title="Rename"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(session.id);
                          }}
                          title="Export"
                        >
                          📤
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(session.id);
                          }}
                          title="Delete"
                        >
                          🗑️
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                {!isEditing && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {stats.totalMessages} msgs
                      </Badge>
                      {stats.totalToolCalls > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {stats.totalToolCalls} tools
                        </Badge>
                      )}
                    </div>
                    
                    {session.messages.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {session.messages[session.messages.length - 1]?.content.slice(0, 80)}
                        {session.messages[session.messages.length - 1]?.content.length > 80 ? '...' : ''}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t bg-background/50 text-center">
        <p className="text-xs text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} • 
          {' '}{sessions.reduce((acc, s) => acc + s.messages.length, 0)} total messages
        </p>
      </div>
    </div>
  );
}