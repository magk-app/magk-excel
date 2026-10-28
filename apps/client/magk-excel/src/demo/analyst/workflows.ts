import type { WorkflowNode, WorkflowEdge, NodeType, NodeConfig } from '@/types/workflow';

const node = (id: string, type: NodeType, x: number, y: number, config: Omit<NodeConfig, 'id'> & Record<string, unknown>): WorkflowNode =>
  ({
    id,
    type,
    position: { x, y },
    data: { type, status: 'pending', config: { id, ...config } as NodeConfig },
  }) as WorkflowNode;

const edge = (source: string, target: string): WorkflowEdge => ({ id: `${source}->${target}`, source, target });

export const COMPS_NODES: WorkflowNode[] = [
  node('find', 'web-scraping', 0, 0, {
    name: 'Find latest 10-K filings',
    description: 'EDGAR full-text index for AAPL, MSFT, GOOGL, AMZN, META',
    url: 'https://www.sec.gov/cgi-bin/browse-edgar',
    extractFormat: 'structured',
  }),
  node('extract', 'pdf-extraction', 430, 0, {
    name: 'Extract income statements',
    description: 'Revenue, operating income, net income, diluted EPS · current + prior year',
    filePath: '10-K filings (5)',
    tableDetection: 'auto',
    extractFormat: 'table',
  }),
  node('compute', 'transform', 860, 0, {
    name: 'Growth, margins & medians',
    description: 'YoY growth, operating / net margin, EPS growth, peer medians',
    operations: [
      { type: 'calculate', newField: 'op_margin', expression: 'operating_income / revenue' },
      { type: 'calculate', newField: 'yoy_growth', expression: 'revenue / revenue_prior - 1' },
      { type: 'aggregate', field: '*', expression: 'median' },
    ],
  }),
  node('export', 'excel-export', 1290, 0, {
    name: 'Export Peer_Comps.xlsx',
    description: 'Live formulas · Comps, Raw 10-K and Sources sheets',
    outputPath: '~/Downloads/MAGK-Excel/Peer_Comps.xlsx',
    sheetName: 'Comps',
  }),
];
export const COMPS_EDGES = [edge('find', 'extract'), edge('extract', 'compute'), edge('compute', 'export')];

export const VARIANCE_NODES: WorkflowNode[] = [
  node('budget', 'excel-input', 0, 0, {
    name: 'Read Q3_Budget.xlsx',
    description: 'Opex plan by cost center and GL account',
    filePath: 'Q3_Budget.xlsx',
    hasHeaders: true,
  }),
  node('actuals', 'excel-input', 0, 300, {
    name: 'Read NetSuite actuals',
    description: 'NetSuite_Actuals_Q3.csv · 1,284 journal lines',
    filePath: 'NetSuite_Actuals_Q3.csv',
    hasHeaders: true,
  }),
  node('merge', 'merge', 430, 150, {
    name: 'Match on GL account',
    description: 'Roll actuals up to cost center, join to budget',
    strategy: 'left',
    joinKeys: [{ leftField: 'gl', rightField: 'gl_account' }],
    conflictResolution: 'left',
  }),
  node('variance', 'transform', 860, 150, {
    name: 'Variance & ±10% flags',
    description: 'Variance $, variance %, flag lines beyond ±10%',
    operations: [{ type: 'calculate', newField: 'var_pct', expression: 'actual / budget - 1' }],
  }),
  node('report', 'excel-export', 1290, 0, {
    name: 'Export variance report',
    description: 'Q3_Variance_Report.xlsx with conditional formatting',
    outputPath: '~/Downloads/MAGK-Excel/Q3_Variance_Report.xlsx',
    sheetName: 'Variance',
  }),
  node('email', 'email-sender', 1290, 300, {
    name: 'Email the CFO',
    description: 'Summary of flagged lines + report attached',
  }),
];
export const VARIANCE_EDGES = [
  edge('budget', 'merge'),
  edge('actuals', 'merge'),
  edge('merge', 'variance'),
  edge('variance', 'report'),
  edge('variance', 'email'),
];
