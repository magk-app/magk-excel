import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { Background, BackgroundVariant, MarkerType, ReactFlowInstance, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Blocks, CalendarClock, CheckCircle2, FileSpreadsheet, GitBranch, Library, Loader2, Mail, MessageSquare,
  MousePointer2, Play, Save, Settings, Sparkles, Workflow, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { nodeTypes } from '@/components/workflow/NodeRegistry';
import { STATUS_COLORS } from '@/components/workflow/animations/nodeAnimations';
import type { NodeStatus, WorkflowEdge, WorkflowNode } from '@/types/workflow';
import { DemoChat, DemoMessage } from './DemoChat';
import { DemoSpreadsheet } from './DemoSpreadsheet';
import { buildCompsSheet, buildVarianceSheet, compsHighlights, SheetModel, signedPct, usd, VARIANCE_FLAGS, VARIANCE_TOTAL } from './sheets';
import { COMPS_EDGES, COMPS_NODES, VARIANCE_EDGES, VARIANCE_NODES } from './workflows';
import './analystDemo.css';

type Stage = 'canvas' | 'sheet' | 'library';

interface LibraryTool {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: number;
  lastRun: string;
  isNew?: boolean;
  running?: number | null;
}

const params = new URLSearchParams(window.location.search);
const speed = Number(params.get('speed') || '1');
const demoWindow = window as unknown as { __magkDemoStart?: boolean; __magkDemoDone?: boolean };
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms / speed));

const BASE_TOOLS: LibraryTool[] = [
  { id: 'bs', name: '10-Q Balance Sheet → Model', description: 'PDF balance sheet into the 3-statement model template', trigger: 'Manual', steps: 3, lastRun: 'Oct 21' },
  { id: 'kpi', name: 'Earnings KPI Tracker', description: 'Scrapes IR pages for guidance and KPIs after earnings', trigger: 'After earnings calls', steps: 4, lastRun: 'Oct 24' },
];

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'chat-workflow', label: 'Chat + Workflow', icon: Sparkles },
  { id: 'editor', label: 'Workflow Editor', icon: GitBranch },
  { id: 'library', label: 'Workflow Library', icon: Library },
  { id: 'blocks', label: 'Block Library', icon: Blocks },
  { id: 'mcp', label: 'MCP Settings', icon: Settings },
];

export function AnalystDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([]);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [runState, setRunState] = useState<'draft' | 'ready' | 'running' | 'completed'>('draft');
  const [stage, setStage] = useState<Stage>('canvas');
  const [sheet, setSheet] = useState<SheetModel | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [caption, setCaption] = useState<{ step: string; title: string } | null>(null);
  const [overlay, setOverlay] = useState<'title' | 'outro' | 'email' | null>('title');
  const [tools, setTools] = useState<LibraryTool[]>(BASE_TOOLS);
  const [toast, setToast] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ x: 1500, y: 700, visible: false, down: false });
  const rf = useRef<ReactFlowInstance | null>(null);
  const started = useRef(false);

  const fit = useCallback((duration = 600) => {
    setTimeout(() => rf.current?.fitView({ padding: 0.14, duration, maxZoom: 0.95 }), 60);
  }, []);

  const typeInput = useCallback(async (text: string) => {
    for (let i = 1; i <= text.length; i += 2) {
      setInput(text.slice(0, i));
      await sleep(22);
    }
    setInput(text);
    await sleep(350);
  }, []);

  const moveCursor = useCallback(async (selector: string, click = true) => {
    const el = document.querySelector(`[data-demo="${selector}"]`);
    if (!el) return;
    const b = el.getBoundingClientRect();
    setCursor((c) => ({ ...c, visible: true, x: b.left + b.width / 2, y: b.top + b.height / 2 }));
    await sleep(850);
    if (click) {
      setCursor((c) => ({ ...c, down: true }));
      await sleep(180);
      setCursor((c) => ({ ...c, down: false }));
      await sleep(150);
    }
  }, []);

  const send = useCallback(async (text: string, attachments: string[] = []) => {
    await typeInput(text);
    await moveCursor('send');
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', content: text, attachments }]);
    setInput('');
    setPendingAttachments([]);
    await sleep(500);
  }, [typeInput, moveCursor]);

  const patchMsg = useCallback((id: string, patch: Partial<DemoMessage> | ((m: DemoMessage) => Partial<DemoMessage>)) => {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)));
  }, []);

  const stream = useCallback(async (id: string, text: string, append = false) => {
    let base = '';
    setMessages((ms) => {
      const existing = ms.find((m) => m.id === id);
      if (!existing) return [...ms, { id, role: 'assistant', content: '' }];
      base = append ? existing.content : '';
      return ms;
    });
    await sleep(0);
    for (let i = 0; i <= text.length; i += 4) {
      const chunk = base + text.slice(0, i);
      patchMsg(id, { content: chunk, thinking: false });
      await sleep(16);
    }
    patchMsg(id, { content: base + text, thinking: false });
  }, [patchMsg]);

  const addTool = useCallback(async (id: string, label: string, ms = 500) => {
    patchMsg(id, (m) => ({ tools: [...(m.tools ?? []), { label, status: 'running' }] }));
    await sleep(ms);
    patchMsg(id, (m) => ({ tools: (m.tools ?? []).map((t) => (t.label === label ? { ...t, status: 'done' } : t)) }));
  }, [patchMsg]);

  const setNode = useCallback((id: string, patch: Partial<WorkflowNode['data']>) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, []);

  const runNode = useCallback(async (id: string, ms: number, total: number, unit: string, rows: number) => {
    const startedAt = new Date();
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const current = Math.round((total * s) / steps);
      setNode(id, {
        status: 'running',
        progress: { current, total, percentage: Math.round((s / steps) * 100), message: `${current} / ${total} ${unit}`, startTime: startedAt },
      });
      await sleep(ms / steps);
    }
    setNode(id, {
      status: 'completed',
      progress: undefined,
      metadata: { executionTime: Math.round(ms * (0.9 + Math.random() * 0.2)), rowsProcessed: rows },
      result: { rowCount: rows },
    });
    await sleep(250);
  }, [setNode]);

  const buildWorkflow = useCallback(async (msgId: string, ns: WorkflowNode[], es: WorkflowEdge[]) => {
    for (const n of ns) {
      setNodes((prev) => [...prev, n]);
      setEdges(es.filter((e) => [...ns.slice(0, ns.indexOf(n) + 1)].some((x) => x.id === e.target) && ns.slice(0, ns.indexOf(n) + 1).some((x) => x.id === e.source)));
      fit(500);
      await addTool(msgId, `workflow.add_node(${n.data.type}: "${n.data.config.name}")`, 420);
      await sleep(180);
    }
  }, [addTool, fit]);

  const revealSheet = useCallback(async (model: SheetModel) => {
    setSheet(model);
    setRevealed(0);
    setSelected(null);
    await moveCursor('tab-sheet');
    setStage('sheet');
    await sleep(500);
    for (let i = 1; i <= model.rows.length; i++) {
      setRevealed(i);
      await sleep(140);
    }
  }, [moveCursor]);

  const showFormulas = useCallback(async (cells: Array<[number, number]>, dwell = 1500) => {
    for (const [r, c] of cells) {
      setSelected({ r, c });
      await sleep(dwell);
    }
  }, []);

  const resetSession = useCallback(async () => {
    setMessages([]);
    setNodes([]);
    setEdges([]);
    setRunState('draft');
    setStage('canvas');
    setSheet(null);
    setSelected(null);
    await sleep(500);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      // ?record=1 holds on the title card until the recorder sets window.__magkDemoStart
      while (params.has('record') && !demoWindow.__magkDemoStart) await sleep(100);
      await sleep(4000);
      setOverlay(null);
      await sleep(700);

      // Workflow 1 — peer comps from SEC filings
      setCaption({ step: 'Workflow 1 of 3', title: 'Peer comps from SEC filings' });
      setWorkflowName('Peer Comps · Mega-cap Tech');
      await send('Build a peer comps sheet for AAPL, MSFT, GOOGL, AMZN and META from their latest 10-K filings: revenue growth, operating and net margins, EPS growth, plus peer medians.');
      const a1 = 'a1';
      setMessages((m) => [...m, { id: a1, role: 'assistant', content: '', thinking: true }]);
      await sleep(1100);
      await stream(a1, "On it. I'll pull each company's latest **10-K** from SEC EDGAR, extract the income statement, and build the comps with live Excel formulas.");
      await buildWorkflow(a1, COMPS_NODES, COMPS_EDGES);
      setRunState('ready');
      await stream(a1, '\n\nThe workflow is ready. Hit **Run** and I\'ll execute it step by step.', true);
      await sleep(400);
      await moveCursor('run');
      setRunState('running');
      await runNode('find', 2200, 5, 'filings', 5);
      await runNode('extract', 3000, 5, 'income statements', 40);
      await runNode('compute', 1800, 5, 'companies', 30);
      await runNode('export', 1600, 3, 'sheets', 6);
      setRunState('completed');
      const h = compsHighlights();
      const a2 = 'a2';
      await stream(
        a2,
        `**Peer_Comps.xlsx** is ready. Every number links back to its 10-K.\n\n- Highest operating margin: **${h.byMargin.ticker} ${h.pct(h.byMargin.opMargin)}**\n- Fastest revenue growth: **${h.byGrowth.ticker} ${h.signedPct(h.byGrowth.revenueGrowth)}**` +
          (h.epsDown.length ? `\n- EPS down YoY: **${h.epsDown.map((c) => `${c.ticker} ${h.signedPct(c.epsGrowth)}`).join(', ')}**` : '')
      );
      await revealSheet(buildCompsSheet());
      await showFormulas([[4, 4], [5, 6], [9, 6]], 1600);
      await sleep(800);

      // Workflow 2 — budget vs actuals variance
      await resetSession();
      setCaption({ step: 'Workflow 2 of 3', title: 'Budget vs. actuals variance report' });
      setWorkflowName('Q3 Opex Variance');
      setPendingAttachments(['Q3_Budget.xlsx', 'NetSuite_Actuals_Q3.csv']);
      await sleep(700);
      await send(
        "Here's our Q3 opex budget and the NetSuite actuals export. Build a variance report by cost center, flag anything off by more than 10%, and email it to the CFO.",
        ['Q3_Budget.xlsx', 'NetSuite_Actuals_Q3.csv']
      );
      const b1 = 'b1';
      setMessages((m) => [...m, { id: b1, role: 'assistant', content: '', thinking: true }]);
      await sleep(1000);
      await stream(b1, "Got it. I'll match both files on GL account, compute $ and % variance, flag lines beyond **±10%**, and send the report to the CFO.");
      await buildWorkflow(b1, VARIANCE_NODES, VARIANCE_EDGES);
      setRunState('ready');
      await sleep(300);
      await moveCursor('run');
      setRunState('running');
      await Promise.all([runNode('budget', 1300, 8, 'cost centers', 8), runNode('actuals', 1700, 1284, 'journal lines', 1284)]);
      await runNode('merge', 1600, 1284, 'lines matched', 1284);
      await runNode('variance', 1400, 8, 'cost centers', 8);
      await Promise.all([runNode('report', 1300, 3, 'sheets', 9), runNode('email', 1600, 1, 'email', 1)]);
      setRunState('completed');
      await stream(
        'b2',
        `Done. Total opex came in **${signedPct(VARIANCE_TOTAL.varPct)}** vs. budget (${usd(VARIANCE_TOTAL.varUsd)}). **${VARIANCE_FLAGS.length} lines** are beyond ±10%: ${VARIANCE_FLAGS.map((f) => `${f.cc} ${signedPct(f.varPct)}`).join(', ')}. Report emailed to the CFO.`
      );
      await revealSheet(buildVarianceSheet());
      await showFormulas([[6, 5], [6, 6]], 1500);
      setOverlay('email');
      await sleep(4200);
      setOverlay(null);
      await sleep(500);

      // Workflow 3 — save as reusable tools
      setCaption({ step: 'Workflow 3 of 3', title: 'Save once, rerun forever' });
      await send('Perfect. Save both as tools: rerun the comps whenever one of these companies files a new 10-K or 10-Q, and send the variance report on business day 3 every month.');
      const c1 = 'c1';
      setMessages((m) => [...m, { id: c1, role: 'assistant', content: '', thinking: true }]);
      await sleep(900);
      await addTool(c1, 'library.save_tool("Peer Comps Refresh")', 500);
      await addTool(c1, 'scheduler.on_filing(EDGAR: AAPL, MSFT, GOOGL, AMZN, META)', 500);
      await addTool(c1, 'scheduler.cron("Monthly · business day 3 · 8:00 AM")', 500);
      await stream(c1, 'Saved **2 one-click tools** to your Workflow Library. No prompt needed next time: they run on their own triggers, or with one click.');
      await moveCursor('tab-library');
      setStage('library');
      await sleep(600);
      setTools((t) => [
        { id: 'comps', name: 'Peer Comps Refresh', description: 'SEC 10-K / 10-Q → comps workbook with live formulas', trigger: 'On new EDGAR filing', steps: 4, lastRun: 'Just now', isNew: true },
        { id: 'var', name: 'Monthly Budget vs. Actuals', description: 'Budget + NetSuite export → variance report → CFO email', trigger: 'Monthly · BD3 · 8:00 AM', steps: 6, lastRun: 'Just now', isNew: true },
        ...t,
      ]);
      await sleep(1800);
      await moveCursor('run-comps');
      for (let p = 0; p <= 4; p++) {
        setTools((t) => t.map((x) => (x.id === 'comps' ? { ...x, running: p } : x)));
        await sleep(650);
      }
      setTools((t) => t.map((x) => (x.id === 'comps' ? { ...x, running: null, lastRun: 'Just now · 2.6s' } : x)));
      setToast('Peer_Comps.xlsx refreshed · 5 filings checked · no changes since last run');
      setCursor((c) => ({ ...c, visible: false }));
      await sleep(3000);
      setToast(null);
      setCaption(null);
      setOverlay('outro');
      await sleep(5000);
      demoWindow.__magkDemoDone = true;
    })();
  }, [addTool, buildWorkflow, fit, moveCursor, resetSession, revealSheet, runNode, send, showFormulas, stream]);

  const flowEdges: Edge[] = edges.map((e) => {
    const src = nodes.find((n) => n.id === e.source)?.data.status ?? 'pending';
    const tgt = nodes.find((n) => n.id === e.target)?.data.status ?? 'pending';
    const live = tgt === 'running';
    const color = live ? STATUS_COLORS.running : src === 'completed' ? STATUS_COLORS.completed : STATUS_COLORS.pending;
    return {
      ...e,
      type: 'smoothstep',
      animated: live || (src === 'completed' && tgt === 'pending' && runState === 'running'),
      style: { stroke: color, strokeWidth: src === 'completed' ? 3 : 2, strokeDasharray: src === 'pending' && !live ? '8 4' : undefined },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 20, height: 20 },
    };
  });

  const counts = nodes.reduce((acc, n) => ({ ...acc, [n.data.status]: (acc[n.data.status] ?? 0) + 1 }), {} as Record<NodeStatus, number>);
  const activeTab = stage === 'library' ? 'library' : 'chat-workflow';

  return (
    <div className="analyst-demo h-screen w-screen flex flex-col bg-background overflow-hidden relative select-none">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">MAGK Excel</h1>
            <Badge variant="outline" className="ml-2">v0.1.2</Badge>
          </div>
          <Badge variant="secondary">38 MCP tools</Badge>
          <Badge variant="default">{tools.length} workflows</Badge>
        </div>
        <Button size="sm" className="gap-1">+ New Workflow</Button>
      </header>
      <div className="border-b px-6 py-2 bg-muted/30 flex gap-1">
        {TABS.map((t) => (
          <div
            key={t.id}
            data-demo={t.id === 'library' ? 'tab-library' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground',
              activeTab === t.id && 'bg-background text-foreground shadow-sm'
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </div>
        ))}
      </div>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-[560px] shrink-0 border-r">
          <DemoChat messages={messages} input={input} pendingAttachments={pendingAttachments} />
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          {stage !== 'library' && (
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
              <div className="flex items-center gap-1">
                <div className={cn('inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm', stage === 'canvas' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground')}>
                  <GitBranch className="h-4 w-4" /> {workflowName || 'Workflow'}
                </div>
                {sheet || runState === 'completed' ? (
                  <div
                    data-demo="tab-sheet"
                    className={cn('inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm', stage === 'sheet' ? 'bg-background shadow-sm font-medium text-[#217346]' : 'text-muted-foreground')}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-[#217346]" />
                    {runState === 'completed' ? (workflowName.startsWith('Peer') ? 'Peer_Comps.xlsx' : 'Q3_Variance_Report.xlsx') : sheet?.fileName}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {nodes.length > 0 && (
                  <Badge variant="outline" className="gap-2 font-normal">
                    <span className="text-emerald-600">{counts.completed ?? 0} done</span>·
                    <span className="text-blue-600">{counts.running ?? 0} running</span>·
                    <span className="text-slate-500">{counts.pending ?? 0} pending</span>
                  </Badge>
                )}
                <Button size="sm" variant="outline" className="gap-1" disabled={runState !== 'completed'}>
                  <Save className="h-4 w-4" /> Save as tool
                </Button>
                <Button size="sm" data-demo="run" className={cn('gap-1 min-w-[96px]', runState === 'completed' && 'bg-emerald-600 hover:bg-emerald-600')} disabled={runState === 'draft'}>
                  {runState === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : runState === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {runState === 'running' ? 'Running' : runState === 'completed' ? 'Completed' : 'Run'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 relative">
            <div className={cn('absolute inset-0 transition-opacity duration-500', stage === 'canvas' ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
              <ReactFlow
                nodes={nodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                onInit={(i) => (rf.current = i)}
                nodesDraggable={false}
                nodesConnectable={false}
                zoomOnScroll={false}
                panOnDrag={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} />
              </ReactFlow>
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Workflow className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    Describe a task in chat. MAGK builds the workflow here.
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {stage === 'sheet' && sheet && (
                <motion.div key={sheet.fileName} className="absolute inset-0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
                  <DemoSpreadsheet sheet={sheet} revealedRows={revealed} selected={selected} />
                </motion.div>
              )}
              {stage === 'library' && (
                <motion.div key="lib" className="absolute inset-0 p-8 bg-muted/20 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold">Workflow Library</h2>
                      <p className="text-muted-foreground">Reusable tools your team can run in one click</p>
                    </div>
                    <Badge variant="outline" className="text-sm">{tools.length} saved tools</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <AnimatePresence initial={false}>
                      {tools.map((t) => (
                        <motion.div
                          key={t.id}
                          layout
                          initial={{ opacity: 0, scale: 0.92, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                          className={cn('rounded-xl border bg-card p-5 shadow-sm', t.isNew && 'border-violet-300 ring-2 ring-violet-200')}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-lg bg-[#217346]/10 text-[#217346] flex items-center justify-center">
                                {t.id === 'var' ? <Mail className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 font-semibold text-lg">
                                  {t.name}
                                  {t.isNew && <Badge className="bg-violet-600 hover:bg-violet-600">NEW</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">{t.description}</p>
                              </div>
                            </div>
                            <Button size="sm" data-demo={`run-${t.id}`} className="gap-1 shrink-0">
                              {t.running != null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                              {t.running != null ? 'Running' : 'Run now'}
                            </Button>
                          </div>
                          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                              {t.trigger.startsWith('On new') ? <Zap className="h-3.5 w-3.5 text-amber-500" /> : <CalendarClock className="h-3.5 w-3.5 text-violet-500" />}
                              {t.trigger}
                            </span>
                            <span>{t.steps} steps</span>
                            <span>·</span>
                            <span>Last run {t.lastRun}</span>
                          </div>
                          {t.running != null && (
                            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div className="h-full bg-emerald-500" animate={{ width: `${(t.running / 4) * 100}%` }} transition={{ duration: 0.5 }} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {caption && (
                <motion.div
                  key={caption.title}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 rounded-full bg-slate-900/90 text-white px-5 py-2.5 shadow-xl flex items-center gap-3"
                >
                  <span className="text-xs uppercase tracking-wider text-violet-300">{caption.step}</span>
                  <span className="font-medium">{caption.title}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {overlay === 'email' && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute right-8 bottom-24 z-30 w-[560px] rounded-xl border bg-card shadow-2xl overflow-hidden"
                >
                  <div className="px-5 py-3 border-b bg-muted/40 flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-red-500" /> Sent by MAGK · email-sender
                  </div>
                  <div className="px-5 py-4 space-y-2 text-sm">
                    <div><span className="text-muted-foreground w-16 inline-block">To</span>cfo@northwind.com</div>
                    <div><span className="text-muted-foreground w-16 inline-block">Subject</span><b>Q3 opex variance: {VARIANCE_FLAGS.length} lines beyond ±10%</b></div>
                    <div className="pt-2 border-t space-y-1">
                      <p>Total opex {signedPct(VARIANCE_TOTAL.varPct)} vs. budget ({usd(VARIANCE_TOTAL.varUsd)}). Lines to review:</p>
                      <ul className="list-disc ml-5">
                        {VARIANCE_FLAGS.map((f) => (
                          <li key={f.gl}>{f.cc}: <b className={f.varUsd > 0 ? 'text-red-600' : 'text-emerald-700'}>{signedPct(f.varPct)}</b> ({f.varUsd > 0 ? '+' : '-'}{usd(Math.abs(f.varUsd))})</li>
                        ))}
                      </ul>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-md border bg-emerald-50 text-emerald-800 px-2 py-1 text-xs mt-1">
                      <FileSpreadsheet className="h-3 w-3" /> Q3_Variance_Report.xlsx
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {toast && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-8 bottom-8 z-30 rounded-lg bg-emerald-600 text-white px-5 py-3 shadow-xl flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between px-6 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <span>{runState === 'running' ? 'Executing workflow…' : 'Ready'}</span>
        <span>Excel · PDF · Puppeteer · Fetch · Filesystem MCP servers connected</span>
      </footer>

      <AnimatePresence>
        {(overlay === 'title' || overlay === 'outro') && (
          <motion.div
            key={overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md text-white"
          >
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }} className="text-center">
              <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-600 flex items-center justify-center shadow-2xl">
                <Workflow className="h-10 w-10" />
              </div>
              <h1 className="text-6xl font-bold tracking-tight">MAGK Excel</h1>
              <p className="mt-4 text-2xl text-slate-300">
                {overlay === 'title' ? 'AI workflows for financial analysts' : 'Describe it once. Run it every quarter.'}
              </p>
              {overlay === 'outro' && (
                <div className="mt-8 flex justify-center gap-3 text-slate-300">
                  {['SEC filings → comps', 'Budget vs. actuals', 'One-click reusable tools'].map((t) => (
                    <span key={t} className="rounded-full border border-white/20 px-4 py-1.5 text-sm">{t}</span>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[60]"
        animate={{ x: cursor.x - 4, y: cursor.y - 2, opacity: cursor.visible ? 1 : 0, scale: cursor.down ? 0.85 : 1 }}
        transition={{ x: { duration: 0.8, ease: 'easeInOut' }, y: { duration: 0.8, ease: 'easeInOut' }, scale: { duration: 0.12 }, opacity: { duration: 0.3 } }}
      >
        <MousePointer2 className="h-7 w-7 fill-slate-900 text-white drop-shadow-lg" strokeWidth={1.5} />
        {cursor.down && <span className="absolute -left-3 -top-3 h-10 w-10 rounded-full bg-violet-500/30 animate-ping" />}
      </motion.div>
    </div>
  );
}

export default AnalystDemo;
