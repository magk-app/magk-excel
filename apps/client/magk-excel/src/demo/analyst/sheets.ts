import sec from './secFinancials.json';

export type CellTone = 'pos' | 'neg' | 'flag' | 'muted' | 'link';

export interface SheetCell {
  v: string;
  f?: string;
  align?: 'left' | 'right' | 'center';
  tone?: CellTone;
  bold?: boolean;
}

export interface SheetRow {
  kind: 'title' | 'note' | 'blank' | 'header' | 'data' | 'total';
  cells: SheetCell[];
}

export interface SheetModel {
  fileName: string;
  tabs: string[];
  activeTab: string;
  colWidths: number[];
  rows: SheetRow[];
}

const usdM = (v: number) => `$${Math.round(v / 1e6).toLocaleString('en-US')}`;
const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
const pct = (v: number) => `${v >= 0 ? '' : '-'}${Math.abs(v * 100).toFixed(1)}%`;
const signedPct = (v: number) => `${v >= 0 ? '+' : '-'}${Math.abs(v * 100).toFixed(1)}%`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fyLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export const COMPANIES = sec.companies.map((c) => ({
  ...c,
  revenueGrowth: c.revenue / c.revenuePrior - 1,
  opMargin: c.operatingIncome / c.revenue,
  netMargin: c.netIncome / c.revenue,
  epsGrowth: c.dilutedEps / c.dilutedEpsPrior - 1,
}));

const r = (i: number) => i + 5;

export function buildCompsSheet(): SheetModel {
  const data: SheetRow[] = COMPANIES.map((c, i) => ({
    kind: 'data',
    cells: [
      { v: c.ticker, bold: true },
      { v: c.name },
      { v: fyLabel(c.fiscalYearEnd), align: 'center', tone: 'muted' },
      { v: usdM(c.revenue), align: 'right', f: `='Raw 10-K'!D${r(i)}/1000000` },
      { v: signedPct(c.revenueGrowth), align: 'right', tone: c.revenueGrowth >= 0 ? 'pos' : 'neg', f: `='Raw 10-K'!D${r(i)}/'Raw 10-K'!E${r(i)}-1` },
      { v: usdM(c.operatingIncome), align: 'right', f: `='Raw 10-K'!F${r(i)}/1000000` },
      { v: pct(c.opMargin), align: 'right', f: `=F${r(i)}/D${r(i)}` },
      { v: usdM(c.netIncome), align: 'right', f: `='Raw 10-K'!H${r(i)}/1000000` },
      { v: pct(c.netMargin), align: 'right', f: `=H${r(i)}/D${r(i)}` },
      { v: `$${c.dilutedEps.toFixed(2)}`, align: 'right', f: `='Raw 10-K'!J${r(i)}` },
      { v: signedPct(c.epsGrowth), align: 'right', tone: c.epsGrowth >= 0 ? 'pos' : 'neg', f: `=J${r(i)}/'Raw 10-K'!K${r(i)}-1` },
    ],
  }));
  const last = r(COMPANIES.length - 1);
  const med = (col: string) => `=MEDIAN(${col}5:${col}${last})`;
  return {
    fileName: 'Peer_Comps.xlsx',
    tabs: ['Comps', 'Raw 10-K', 'Sources'],
    activeTab: 'Comps',
    colWidths: [74, 170, 96, 112, 100, 128, 100, 118, 100, 96, 104],
    rows: [
      { kind: 'title', cells: [{ v: 'Mega-cap tech peer comps · latest fiscal year (USD millions, except per share)' }] },
      { kind: 'note', cells: [{ v: 'Source: SEC EDGAR 10-K filings, extracted by MAGK · every value links to its filing on the Sources tab', tone: 'muted' }] },
      { kind: 'blank', cells: [] },
      {
        kind: 'header',
        cells: ['Ticker', 'Company', 'FY end', 'Revenue', 'YoY growth', 'Operating inc.', 'Op. margin', 'Net income', 'Net margin', 'Diluted EPS', 'EPS growth'].map(
          (v, i) => ({ v, align: i > 2 ? 'right' : i === 2 ? 'center' : 'left' }) as SheetCell
        ),
      },
      ...data,
      {
        kind: 'total',
        cells: [
          { v: 'Median' },
          { v: '' },
          { v: '' },
          { v: usdM(median(COMPANIES.map((c) => c.revenue))), align: 'right', f: med('D') },
          { v: signedPct(median(COMPANIES.map((c) => c.revenueGrowth))), align: 'right', f: med('E') },
          { v: usdM(median(COMPANIES.map((c) => c.operatingIncome))), align: 'right', f: med('F') },
          { v: pct(median(COMPANIES.map((c) => c.opMargin))), align: 'right', f: med('G') },
          { v: usdM(median(COMPANIES.map((c) => c.netIncome))), align: 'right', f: med('H') },
          { v: pct(median(COMPANIES.map((c) => c.netMargin))), align: 'right', f: med('I') },
          { v: `$${median(COMPANIES.map((c) => c.dilutedEps)).toFixed(2)}`, align: 'right', f: med('J') },
          { v: signedPct(median(COMPANIES.map((c) => c.epsGrowth))), align: 'right', f: med('K') },
        ],
      },
    ],
  };
}

export function compsHighlights() {
  const byMargin = [...COMPANIES].sort((a, b) => b.opMargin - a.opMargin)[0];
  const byGrowth = [...COMPANIES].sort((a, b) => b.revenueGrowth - a.revenueGrowth)[0];
  const epsDown = COMPANIES.filter((c) => c.epsGrowth < 0);
  return { byMargin, byGrowth, epsDown, pct, signedPct };
}

const VARIANCE_LINES = [
  { cc: 'Sales & Marketing', gl: '6100', budget: 4_200_000, actual: 4_756_000 },
  { cc: 'R&D Engineering', gl: '6200', budget: 6_850_000, actual: 6_912_000 },
  { cc: 'Cloud Infrastructure', gl: '6310', budget: 2_100_000, actual: 2_494_000 },
  { cc: 'General & Admin', gl: '6400', budget: 1_950_000, actual: 1_882_000 },
  { cc: 'Facilities', gl: '6500', budget: 980_000, actual: 1_003_000 },
  { cc: 'Travel & Entertainment', gl: '6610', budget: 410_000, actual: 352_000 },
  { cc: 'Professional Fees', gl: '6700', budget: 620_000, actual: 668_000 },
  { cc: 'Recruiting', gl: '6800', budget: 540_000, actual: 497_000 },
].map((l) => ({ ...l, varUsd: l.actual - l.budget, varPct: l.actual / l.budget - 1 }));

export const VARIANCE_FLAGS = VARIANCE_LINES.filter((l) => Math.abs(l.varPct) > 0.1);
export const VARIANCE_TOTAL = (() => {
  const budget = VARIANCE_LINES.reduce((s, l) => s + l.budget, 0);
  const actual = VARIANCE_LINES.reduce((s, l) => s + l.actual, 0);
  return { budget, actual, varUsd: actual - budget, varPct: actual / budget - 1 };
})();
export { signedPct, usd };

export function buildVarianceSheet(): SheetModel {
  const last = VARIANCE_LINES.length + 4;
  return {
    fileName: 'Q3_Variance_Report.xlsx',
    tabs: ['Variance', 'Budget', 'Actuals (NetSuite)'],
    activeTab: 'Variance',
    colWidths: [200, 80, 130, 130, 130, 100, 150],
    rows: [
      { kind: 'title', cells: [{ v: 'Northwind Corp · Q3 FY26 opex · budget vs. actuals by cost center' }] },
      { kind: 'note', cells: [{ v: 'Matched on GL account · lines beyond ±10% flagged for review', tone: 'muted' }] },
      { kind: 'blank', cells: [] },
      {
        kind: 'header',
        cells: ['Cost center', 'GL', 'Budget', 'Actual', 'Variance $', 'Variance %', 'Flag'].map(
          (v, i) => ({ v, align: i >= 2 && i <= 5 ? 'right' : i === 1 ? 'center' : 'left' }) as SheetCell
        ),
      },
      ...VARIANCE_LINES.map((l, i): SheetRow => {
        const row = i + 5;
        const flagged = Math.abs(l.varPct) > 0.1;
        return {
          kind: 'data',
          cells: [
            { v: l.cc, bold: true },
            { v: l.gl, align: 'center', tone: 'muted' },
            { v: usd(l.budget), align: 'right', f: `=SUMIFS(Budget!D:D,Budget!B:B,B${row})` },
            { v: usd(l.actual), align: 'right', f: `=SUMIFS('Actuals (NetSuite)'!F:F,'Actuals (NetSuite)'!C:C,B${row})` },
            { v: `${l.varUsd >= 0 ? '+' : '-'}${usd(Math.abs(l.varUsd))}`, align: 'right', tone: l.varUsd > 0 ? 'neg' : 'pos', f: `=D${row}-C${row}` },
            { v: signedPct(l.varPct), align: 'right', tone: l.varUsd > 0 ? 'neg' : 'pos', f: `=IF(C${row}=0,0,E${row}/C${row})` },
            {
              v: flagged ? (l.varUsd > 0 ? '▲ Over budget' : '▼ Under budget') : '',
              tone: flagged ? 'flag' : undefined,
              f: `=IF(ABS(F${row})>10%,IF(E${row}>0,"▲ Over budget","▼ Under budget"),"")`,
            },
          ],
        };
      }),
      {
        kind: 'total',
        cells: [
          { v: 'Total opex' },
          { v: '' },
          { v: usd(VARIANCE_TOTAL.budget), align: 'right', f: `=SUM(C5:C${last})` },
          { v: usd(VARIANCE_TOTAL.actual), align: 'right', f: `=SUM(D5:D${last})` },
          { v: `+${usd(VARIANCE_TOTAL.varUsd)}`, align: 'right', f: `=SUM(E5:E${last})` },
          { v: signedPct(VARIANCE_TOTAL.varPct), align: 'right', f: `=E${last + 1}/C${last + 1}` },
          { v: `${VARIANCE_FLAGS.length} lines flagged`, f: `=COUNTIF(G5:G${last},"?*")&" lines flagged"` },
        ],
      },
    ],
  };
}
