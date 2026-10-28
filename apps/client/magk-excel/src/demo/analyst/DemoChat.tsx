import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle2, FileSpreadsheet, Loader2, Paperclip, Send, Sparkles, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DemoToolCall {
  label: string;
  status: 'running' | 'done';
}

export interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: string[];
  tools?: DemoToolCall[];
  thinking?: boolean;
}

interface Props {
  messages: DemoMessage[];
  input: string;
  pendingAttachments: string[];
}

export function DemoChat({ messages, input, pendingAttachments }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Analyst Chat
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 font-normal">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> 5 MCP servers
          </Badge>
          <Badge variant="secondary" className="font-normal">Excel · PDF · Web</Badge>
        </div>
      </div>

      <div ref={scroller} className="flex-1 overflow-hidden px-5 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn('flex gap-3', m.role === 'user' && 'justify-end')}
            >
              {m.role === 'assistant' && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-violet-600 text-white flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-[15px] leading-relaxed max-w-[88%]',
                  m.role === 'user' ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-muted/60 border rounded-bl-sm'
                )}
              >
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {m.attachments.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs">
                        <FileSpreadsheet className="h-3 w-3" /> {a}
                      </span>
                    ))}
                  </div>
                )}
                {m.thinking && !m.content ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Planning workflow…
                  </div>
                ) : (
                  <div className="demo-md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                )}
                {m.tools && m.tools.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {m.tools.map((t) => (
                      <motion.div
                        key={t.label}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs font-mono"
                      >
                        <Wrench className="h-3 w-3 text-slate-400" />
                        <span className="flex-1 truncate">{t.label}</span>
                        {t.status === 'running' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t p-4">
        {pendingAttachments.length > 0 && (
          <div className="flex gap-2 mb-2">
            {pendingAttachments.map((a) => (
              <motion.span
                key={a}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 rounded-md border bg-emerald-50 text-emerald-800 px-2 py-1 text-xs"
              >
                <FileSpreadsheet className="h-3 w-3" /> {a}
              </motion.span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border bg-background px-3 py-2.5 shadow-sm">
          <Paperclip className="h-4 w-4 text-muted-foreground mb-1" />
          <div className={cn('flex-1 text-[15px] min-h-[24px]', !input && 'text-muted-foreground')}>
            {input || 'Ask me to create Excel files, extract data from PDFs, or scrape websites…'}
            {input && <span className="inline-block w-[2px] h-4 bg-foreground ml-0.5 align-middle animate-pulse" />}
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center" data-demo="send">
            <Send className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
