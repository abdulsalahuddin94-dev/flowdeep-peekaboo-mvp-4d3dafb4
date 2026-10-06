import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { EmptyRegion } from "@/lib/empty-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { projects } from "@/lib/mock-data";
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Wallet, PiggyBank, GanttChartSquare, List } from "@/lib/icons";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import { formatDateWithYear } from "@/lib/date-format";

const FIN_YEAR = 2026;
// Demo contract markup per project type so profitability differs by line.
const MARKUP: Record<string, number> = { "Software Solutions": 1.32, EPC: 1.12, Maintenance: 1.22, Consultation: 1.45 };
const COST_TEMPLATES = [
  { item: "Licences & subscriptions", cat: "Software", type: "CapEx", share: 0.3 },
  { item: "Delivery labour", cat: "Staff", type: "OpEx", share: 0.4 },
  { item: "Subcontracted works", cat: "Contracts", type: "CapEx", share: 0.2 },
  { item: "Field travel", cat: "Business Trips", type: "OpEx", share: 0.1 },
] as const;
const REV_TEMPLATES = [
  { milestone: "Mobilisation payment", share: 0.3 },
  { milestone: "Mid-delivery acceptance", share: 0.4 },
  { milestone: "Final acceptance", share: 0.3 },
] as const;
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const TODAY = new Date().toISOString().slice(0, 10);

type CostItem = { id: string; projectId: string; project: string; businessLine: string; item: string; cat: string; type: string; planned: number; actual: number; due: string };
type RevenueItem = { id: string; projectId: string; project: string; businessLine: string; milestone: string; due: string; planned: number; collected: number };

const COST_ITEMS: CostItem[] = projects.slice(0, 12).flatMap((p, pi) =>
  COST_TEMPLATES.map((t, ti) => {
    const planned = +(p.budgetTotal * t.share).toFixed(2);
    const month = ((pi * 2 + ti * 3) % 18) + 1; // spread over FY2026 → mid-2027
    const due = iso(FIN_YEAR + (month > 12 ? 1 : 0), ((month - 1) % 12) + 1, 5 + ((pi + ti) % 20));
    const ratio = due < TODAY ? [1, 0.6, 0.85, 1][(pi + ti) % 4] : [0, 0.25, 0, 0][(pi + ti) % 4];
    return { id: `${p.id}-c${ti}`, projectId: p.id, project: p.name, businessLine: p.businessLine, item: t.item, cat: t.cat, type: t.type, planned, actual: +(planned * ratio).toFixed(2), due };
  }),
);
const REVENUE_ITEMS: RevenueItem[] = projects.slice(0, 12).flatMap((p, pi) =>
  REV_TEMPLATES.map((t, ti) => {
    const planned = +(p.budgetTotal * (MARKUP[p.businessLine] ?? 1.15) * t.share).toFixed(2);
    const month = ((pi * 2 + ti * 5 + 1) % 18) + 1;
    const due = iso(FIN_YEAR + (month > 12 ? 1 : 0), ((month - 1) % 12) + 1, 10 + ((pi + ti) % 15));
    const ratio = due < TODAY ? [1, 0.5, 0, 1][(pi + ti) % 4] : [0, 0.2, 0][(pi + ti) % 3];
    return { id: `${p.id}-r${ti}`, projectId: p.id, project: p.name, businessLine: p.businessLine, milestone: t.milestone, due, planned, collected: +(planned * ratio).toFixed(2) };
  }),
);
const costStatusOf = (c: CostItem) => (c.actual >= c.planned ? "Paid" : c.actual > 0 ? "Partially paid" : c.due < TODAY ? "Overdue" : "Planned");
const revStatusOf = (r: RevenueItem) => (r.collected >= r.planned ? "Collected" : r.collected > 0 ? "Partially collected" : r.due < TODAY ? "Overdue" : "Planned");
const statusPill = (st: string) =>
  st === "Paid" || st === "Collected" ? "border-rag-green/60 bg-rag-green/10 text-rag-green"
  : st.startsWith("Partially") ? "border-rag-amber/60 bg-rag-amber/10 text-rag-amber"
  : st === "Overdue" ? "border-rag-red/60 bg-rag-red/10 text-rag-red"
  : "border-border/60 bg-secondary/40 text-muted-foreground";
const money = (v: number) => `$${v.toFixed(2)}M`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthOptions = Array.from(new Set([...COST_ITEMS, ...REVENUE_ITEMS].map((x) => x.due.slice(0, 7)))).sort()
  .map((v) => ({ value: v, label: `${MONTHS[+v.slice(5, 7) - 1]}, ${v.slice(0, 4)}` }));

const FIN_TAB_LABELS: Record<string, string> = {
  overview: "Overview (P&L)", cost: "Cost Milestone", rev: "Revenue Milestone",
};

export const Route = createFileRoute("/financials")({
  component: FinancialsPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Financials — Nexus PMO" },
      { name: "description", content: "Portfolio-wide budgets, CAPEX/OPEX split, change requests and milestone-linked revenue recognition." },
      { property: "og:title", content: "Financials — Nexus PMO" },
      { property: "og:description", content: "Review portfolio budgets, CapEx and OpEx split, profit, and recognition status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function FinancialsPage() {
  const { tab = "overview" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const goProject = useNavigate();
  const [selectedYear, setSelectedYear] = useState("all");
  const [pnlQuery, setPnlQuery] = useState("");
  const [overviewView, setOverviewView] = useState<"charts" | "table">("charts");
  const [cashMode, setCashMode] = useState<"monthly" | "yearly">("monthly");
  const [costQuery, setCostQuery] = useState("");
  const [costMonth, setCostMonth] = useState("all");
  const [costLine, setCostLine] = useState("all");
  const [costCategory, setCostCategory] = useState<string[]>([]);
  const [costType, setCostType] = useState("all");
  const [costStatus, setCostStatus] = useState("all");
  const [revenueQuery, setRevenueQuery] = useState("");
  const [revMonth, setRevMonth] = useState("all");
  const [revLine, setRevLine] = useState("all");
  const [revStatus, setRevStatus] = useState("all");
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => (currentYear - 2 + i).toString());
  const lineOptions = [{ value: "all", label: "All project types" }, ...Array.from(new Set(projects.map((p) => p.businessLine))).map((v) => ({ value: v, label: v }))];

  const pnlRows = useMemo(
    () =>
      projects.slice(0, 12).map((p) => {
        const revenue = p.budgetTotal * (MARKUP[p.businessLine] ?? 1.15);
        const burnPct = (p.budgetUsed / p.budgetTotal) * 100;
        // Revenue earned so far tracks delivery burn, slightly lagging invoicing.
        const actualRevenue = revenue * Math.min(1, burnPct / 100) * 0.97;
        const expectedProfit = revenue - p.budgetTotal;
        const expectedProfitPct = (expectedProfit / revenue) * 100;
        const actualProfit = actualRevenue - p.budgetUsed;
        const margin = actualRevenue ? (actualProfit / actualRevenue) * 100 : 0;
        return { p, revenue, actualRevenue, expectedProfit, expectedProfitPct, actualProfit, margin, burnPct };
      }),
    [],
  );
  const tot = pnlRows.reduce((a, r) => ({
    budget: a.budget + r.p.budgetTotal, spent: a.spent + r.p.budgetUsed, revenue: a.revenue + r.revenue, actualRevenue: a.actualRevenue + r.actualRevenue,
  }), { budget: 0, spent: 0, revenue: 0, actualRevenue: 0 });
  const expProfit = tot.revenue - tot.budget;
  const actProfit = tot.actualRevenue - tot.spent;
  const expMargin = (expProfit / tot.revenue) * 100;
  const actMargin = tot.actualRevenue ? (actProfit / tot.actualRevenue) * 100 : 0;

  const profitability = useMemo(() => {
    const map = new Map<string, { name: string; Revenue: number; Cost: number; Profit: number }>();
    for (const r of pnlRows) {
      const cur = map.get(r.p.businessLine) ?? { name: r.p.businessLine, Revenue: 0, Cost: 0, Profit: 0 };
      cur.Revenue += r.revenue; cur.Cost += r.p.budgetTotal; cur.Profit += r.expectedProfit;
      map.set(r.p.businessLine, cur);
    }
    return Array.from(map.values()).map((x) => ({ name: x.name, Revenue: +x.Revenue.toFixed(2), Cost: +x.Cost.toFixed(2), Profit: +x.Profit.toFixed(2), margin: (x.Profit / x.Revenue) * 100 }));
  }, [pnlRows]);

  const cashFlow = useMemo(() => {
    const keyOf = (d: string) => (cashMode === "monthly" ? d.slice(0, 7) : d.slice(0, 4));
    const map = new Map<string, { key: string; Inflow: number; Outflow: number }>();
    if (cashMode === "monthly") for (let m = 1; m <= 12; m++) { const k = `${FIN_YEAR}-${String(m).padStart(2, "0")}`; map.set(k, { key: k, Inflow: 0, Outflow: 0 }); }
    for (const r of REVENUE_ITEMS) { const k = keyOf(r.due); if (cashMode === "monthly" && !map.has(k)) continue; const c = map.get(k) ?? { key: k, Inflow: 0, Outflow: 0 }; c.Inflow += r.planned; map.set(k, c); }
    for (const c of COST_ITEMS) { const k = keyOf(c.due); if (cashMode === "monthly" && !map.has(k)) continue; const e = map.get(k) ?? { key: k, Inflow: 0, Outflow: 0 }; e.Outflow += c.planned; map.set(k, e); }
    let cum = 0;
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key)).map((x) => {
      const net = x.Inflow - x.Outflow; cum += net;
      const label = cashMode === "monthly" ? MONTHS[+x.key.slice(5, 7) - 1] : `FY${x.key}`;
      const forecast = cashMode === "monthly" ? x.key > TODAY.slice(0, 7) : x.key > TODAY.slice(0, 4);
      return { label: forecast ? `${label}*` : label, Inflow: +x.Inflow.toFixed(2), Outflow: +(-x.Outflow).toFixed(2), Net: +net.toFixed(2), Cumulative: +cum.toFixed(2) };
    });
  }, [cashMode]);

  const costCategories = Array.from(new Set(COST_ITEMS.map((item) => item.cat)));
  const filteredCostItems = COST_ITEMS.filter((item) => {
    const query = costQuery.trim().toLowerCase();
    return (!query || [item.project, item.item].some((value) => value.toLowerCase().includes(query)))
      && (costMonth === "all" || item.due.startsWith(costMonth))
      && (costLine === "all" || item.businessLine === costLine)
      && (costCategory.length === 0 || costCategory.includes(item.cat))
      && (costType === "all" || item.type === costType)
      && (costStatus === "all" || costStatusOf(item) === costStatus);
  });
  const filteredRevenueItems = REVENUE_ITEMS.filter((item) => {
    const query = revenueQuery.trim().toLowerCase();
    return (!query || [item.project, item.milestone].some((value) => value.toLowerCase().includes(query)))
      && (revMonth === "all" || item.due.startsWith(revMonth))
      && (revLine === "all" || item.businessLine === revLine)
      && (revStatus === "all" || revStatusOf(item) === revStatus);
  });
  const costTot = filteredCostItems.reduce((a, c) => ({ planned: a.planned + c.planned, actual: a.actual + c.actual, capex: a.capex + (c.type === "CapEx" ? c.planned : 0), opex: a.opex + (c.type === "OpEx" ? c.planned : 0), overdue: a.overdue + (costStatusOf(c) === "Overdue" ? c.planned - c.actual : 0) }), { planned: 0, actual: 0, capex: 0, opex: 0, overdue: 0 });
  const revTot = filteredRevenueItems.reduce((a, r) => ({ planned: a.planned + r.planned, collected: a.collected + r.collected, overdue: a.overdue + (revStatusOf(r) === "Overdue" ? r.planned - r.collected : 0) }), { planned: 0, collected: 0, overdue: 0 });
  const capexPct = costTot.planned ? Math.round((costTot.capex / costTot.planned) * 100) : 0;
  const projCount = (rows: { projectId: string }[]) => new Set(rows.map((r) => r.projectId)).size;

  const kpis = [
    { label: "Total Budget", value: money(tot.budget), icon: Wallet, tint: "text-foreground", hint: `${pnlRows.length} projects` },
    { label: "Total Spent", value: money(tot.spent), icon: TrendingDown, tint: "text-accent", hint: `${Math.round((tot.spent / tot.budget) * 100)}% of budget` },
    { label: "Total Revenue", value: money(tot.revenue), icon: TrendingUp, tint: "text-foreground", hint: `${money(tot.actualRevenue)} earned to date` },
    { label: "Expected Profit", value: money(expProfit), icon: PiggyBank, tint: expProfit >= 0 ? "text-rag-green" : "text-rag-red", hint: `Margin ${expMargin.toFixed(1)}%` },
    { label: "Actual Profit", value: money(actProfit), icon: PiggyBank, tint: actProfit >= 0 ? "text-rag-green" : "text-rag-red", hint: `Margin ${actMargin.toFixed(1)}% · ${(actMargin - expMargin >= 0 ? "+" : "")}${(actMargin - expMargin).toFixed(1)} pts vs plan` },
  ];

  const chartTooltip = {
    contentStyle: { background: "var(--table-row-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "#CBD5E1" },
    itemStyle: { color: "#E2E8F0" },
  } as const;
  const axis = { tick: { fill: "#94A3B8", fontSize: 11 }, axisLine: { stroke: "rgba(255,255,255,0.08)" }, tickLine: false } as const;
  const Legendish = ({ items }: { items: [string, string][] }) => (
    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
      {items.map(([l, c]) => <span key={l} className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: c }} />{l}</span>)}
    </div>
  );
  const Strip = ({ cells }: { cells: { label: string; value: string; hint: string; tint?: string }[] }) => (
    <div className="glass-card mb-5 grid items-stretch p-0 sm:grid-cols-2 lg:grid-cols-4">
      {cells.map((c, i) => (
        <div key={c.label} className={`flex flex-col justify-center border-border px-5 py-4 ${i < cells.length - 1 ? "border-b lg:border-b-0 lg:border-r" : ""}`}>
          <div className="label-eyebrow">{c.label}</div>
          <div className={`mt-1 text-2xl font-semibold num-mono ${c.tint ?? "text-foreground"}`}>{c.value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
        </div>
      ))}
    </div>
  );
  const openProject = (projectId: string, projectTab: string) =>
    goProject({ to: "/portfolio/$projectId", params: { projectId }, search: { tab: projectTab } });

  return (
    <div>
      <PageHeader
        title="Financials"
        current={FIN_TAB_LABELS[tab] ?? "Overview (P&L)"}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" />Export</Button>
            <Button variant="outline" size="sm"><FileSpreadsheet className="mr-1 h-4 w-4" />Open in Excel</Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })}>

        <TabsContent value="overview" className="mt-5">
          <EmptyRegion id="financials-overview">
          {/* Income-statement headline */}
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="glass-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="label-eyebrow">{k.label}</div>
                    <Icon className={`h-4 w-4 ${k.tint}`} />
                  </div>
                  <div className={`mt-1 text-2xl font-medium num-mono ${k.tint}`}>{k.value}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{k.hint}</div>
                </div>
              );
            })}
          </div>

          <PageToolbar
            query={pnlQuery}
            onQueryChange={setPnlQuery}
            placeholder="Search project or project type…"
            filterGroups={[
              { key: "year", label: "Fiscal Year", value: selectedYear, onChange: setSelectedYear, options: [{ value: "all", label: "All years" }, ...years.map((y) => ({ value: y, label: `FY${y}` }))] },
            ]}
          />

          <div className="mb-5 grid gap-4 lg:grid-cols-5">
            <div className="glass-card p-4 lg:col-span-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="label-eyebrow">Profitability by Project Type</div>
                  <div className="text-xs text-muted-foreground">Expected revenue, cost and profit · $M</div>
                </div>
                <Legendish items={[["Revenue", "#51CAAD"], ["Cost", "#94A3B8"], ["Profit", "#D4A574"]]} />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitability} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" {...axis} />
                    <YAxis {...axis} />
                    <Tooltip {...chartTooltip} formatter={(v: number) => `$${v.toFixed(2)}M`} />
                    <Bar dataKey="Revenue" fill="#51CAAD" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Cost" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Profit" fill="#D4A574" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card p-4 lg:col-span-2">
              <div className="label-eyebrow">Margin by Project Type</div>
              <div className="mb-3 text-xs text-muted-foreground">Expected profit ÷ expected revenue</div>
              <div className="space-y-3">
                {[...profitability].sort((a, b) => b.margin - a.margin).map((x) => (
                  <div key={x.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-foreground">{x.name}</span>
                      <span className="num-mono text-muted-foreground">{money(x.Profit)} · <span className={x.margin > 15 ? "text-rag-green" : x.margin > 5 ? "text-rag-amber" : "text-rag-red"}>{x.margin.toFixed(1)}%</span></span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary/40"><div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, x.margin) * 4)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card mb-5 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="label-eyebrow">Cash Flow Forecast</div>
                <div className="text-xs text-muted-foreground">
                  Expected collections vs payments from cost and revenue milestones · $M · {cashMode === "monthly" ? `FY${FIN_YEAR}` : "by fiscal year"} · * forecast
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Legendish items={[["Inflow", "#51CAAD"], ["Outflow", "#F87171"], ["Cumulative net", "#D4A574"]]} />
                <div className="inline-flex rounded-lg border border-border p-0.5">
                  {(["monthly", "yearly"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setCashMode(m)}
                      className={`h-8 rounded-md px-3 text-xs font-medium ${cashMode === m ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {m === "monthly" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashFlow} stackOffset="sign" margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashInflowArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--rag-green)" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="var(--rag-green)" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="cashOutflowArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--rag-red)" stopOpacity={0.04} />
                      <stop offset="100%" stopColor="var(--rag-red)" stopOpacity={0.42} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" {...axis} />
                  <YAxis {...axis} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                  <Tooltip {...chartTooltip} formatter={(v: number) => `$${v.toFixed(2)}M`} />
                  <Area type="monotone" dataKey="Inflow" stroke="var(--rag-green)" strokeWidth={2} fill="url(#cashInflowArea)" />
                  <Area type="monotone" dataKey="Outflow" stroke="var(--rag-red)" strokeWidth={2} fill="url(#cashOutflowArea)" />
                  <Line type="monotone" dataKey="Cumulative" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="label-eyebrow mb-3">P&L — by project</div>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
              <TableHead>Project</TableHead><TableHead>Project Type</TableHead><TableHead>Total Budget</TableHead><TableHead>Spent</TableHead>
              <TableHead>Expected Revenue</TableHead><TableHead>Actual Revenue</TableHead><TableHead>Expected Profit</TableHead><TableHead>Expected Margin</TableHead><TableHead>Actual Profit</TableHead><TableHead>Actual Margin</TableHead>
            </TableRow></TableHeader>
            <TableBody>{pnlRows.filter(({ p }) => {
              const q = pnlQuery.trim().toLowerCase();
              return !q || p.name.toLowerCase().includes(q) || p.businessLine.toLowerCase().includes(q);
            }).map(({ p, revenue, actualRevenue, expectedProfit, expectedProfitPct, actualProfit, margin }) => (
              <TableRow key={p.id} className="cursor-pointer bg-table-row-bg hover:bg-table-row-hover border-0" onClick={() => openProject(p.id, "Overview")}>
                <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.businessLine}</TableCell>
                <TableCell className="num-mono">{money(p.budgetTotal)}</TableCell>
                <TableCell className="num-mono">{money(p.budgetUsed)}</TableCell>
                <TableCell className="num-mono">{money(revenue)}</TableCell>
                <TableCell className="num-mono">{money(actualRevenue)}</TableCell>
                <TableCell className={`num-mono text-xs ${expectedProfit > 0 ? "text-rag-green" : "text-rag-red"}`}>{money(expectedProfit)}</TableCell>
                <TableCell className="num-mono text-xs">{expectedProfitPct.toFixed(1)}%</TableCell>
                <TableCell className={`num-mono text-xs ${actualProfit >= 0 ? "text-rag-green" : "text-rag-red"}`}>{money(actualProfit)}</TableCell>
                <TableCell className={`num-mono text-xs ${margin >= expectedProfitPct ? "text-rag-green" : margin > 0 ? "text-rag-amber" : "text-rag-red"}`}>{margin.toFixed(1)}%</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
          </EmptyRegion>
        </TabsContent>

        <TabsContent value="cost" className="mt-5">
          <EmptyRegion id="financials-costs">
          <PageToolbar
            query={costQuery}
            onQueryChange={setCostQuery}
            placeholder="Search project or cost line…"
            filterGroups={[
              { key: "month", label: "Due month", value: costMonth, onChange: setCostMonth, options: [{ value: "all", label: "All months" }, ...monthOptions] },
              { key: "line", label: "Project Type", value: costLine, onChange: setCostLine, options: lineOptions },
              { key: "type", label: "CapEx / OpEx", value: costType, onChange: setCostType, options: [{ value: "all", label: "All types" }, { value: "CapEx", label: "CapEx" }, { value: "OpEx", label: "OpEx" }] },
              { key: "category", label: "Cost Category", mode: "multi", value: costCategory, onChange: setCostCategory, options: [{ value: "all", label: "All categories" }, ...costCategories.map((value) => ({ value, label: value }))] },
              { key: "status", label: "Payment Status", value: costStatus, onChange: setCostStatus, options: [{ value: "all", label: "All statuses" }, ...["Planned", "Partially paid", "Paid", "Overdue"].map((value) => ({ value, label: value }))] },
            ]}
          />
          <Strip cells={[
            { label: "Planned cost", value: money(costTot.planned), hint: `${filteredCostItems.length} lines · ${projCount(filteredCostItems)} projects` },
            { label: "Spent", value: money(costTot.actual), hint: `${costTot.planned ? Math.round((costTot.actual / costTot.planned) * 100) : 0}% of planned`, tint: "text-accent" },
            { label: "To be paid", value: money(costTot.planned - costTot.actual), hint: `${money(costTot.overdue)} overdue`, tint: costTot.overdue > 0 ? "text-rag-amber" : undefined },
            { label: "CapEx / OpEx", value: `${capexPct}% / ${100 - capexPct}%`, hint: `${money(costTot.capex)} CapEx · ${money(costTot.opex)} OpEx` },
          ]} />
          <div className="mb-3 text-xs text-muted-foreground">Read-only roll-up from all projects. Select a line to open its project and log actuals.</div>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
              <TableHead>Project</TableHead><TableHead>Project Type</TableHead><TableHead>Cost Line</TableHead><TableHead>Category</TableHead>
              <TableHead>Cost Type</TableHead><TableHead>Planned</TableHead><TableHead>Actual</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredCostItems.length === 0 && <EmptyRow colSpan={9} />}
              {filteredCostItems.map((c) => {
                const st = costStatusOf(c);
                return (
                  <TableRow key={c.id} className="cursor-pointer bg-table-row-bg hover:bg-table-row-hover border-0" onClick={() => openProject(c.projectId, "Cost Breakdown")}>
                    <TableCell className="font-medium">{c.project}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.businessLine}</TableCell>
                    <TableCell className="text-sm">{c.item}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.cat}</TableCell>
                    <TableCell>
                      <span className={`inline-flex h-7 items-center whitespace-nowrap rounded-full border px-3 text-xs font-medium ${c.type === "CapEx" ? "border-accent/60 bg-accent/10 text-accent" : "border-role-director/60 bg-role-director/10 text-role-director"}`}>{c.type}</span>
                    </TableCell>
                    <TableCell className="num-mono font-medium">{money(c.planned)}</TableCell>
                    <TableCell className="num-mono">{money(c.actual)}</TableCell>
                    <TableCell className="text-xs num-mono">{formatDateWithYear(c.due)}</TableCell>
                    <TableCell><span className={`inline-flex h-7 items-center whitespace-nowrap rounded-full border px-3 text-xs font-medium ${statusPill(st)}`}>{st}</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </EmptyRegion>
        </TabsContent>

        <TabsContent value="rev" className="mt-5">
          <EmptyRegion id="financials-revenue">
          <PageToolbar
            query={revenueQuery}
            onQueryChange={setRevenueQuery}
            placeholder="Search project or milestone…"
            filterGroups={[
              { key: "month", label: "Due month", value: revMonth, onChange: setRevMonth, options: [{ value: "all", label: "All months" }, ...monthOptions] },
              { key: "line", label: "Project Type", value: revLine, onChange: setRevLine, options: lineOptions },
              { key: "status", label: "Collection Status", value: revStatus, onChange: setRevStatus, options: [{ value: "all", label: "All statuses" }, ...["Planned", "Partially collected", "Collected", "Overdue"].map((value) => ({ value, label: value }))] },
            ]}
          />
          <Strip cells={[
            { label: "Planned revenue", value: money(revTot.planned), hint: `${filteredRevenueItems.length} milestones · ${projCount(filteredRevenueItems)} projects` },
            { label: "Collected", value: money(revTot.collected), hint: `${revTot.planned ? Math.round((revTot.collected / revTot.planned) * 100) : 0}% of planned`, tint: "text-rag-green" },
            { label: "To be collected", value: money(revTot.planned - revTot.collected), hint: "Outstanding on these milestones" },
            { label: "Overdue", value: money(revTot.overdue), hint: "Past due, not collected", tint: revTot.overdue > 0 ? "text-rag-red" : undefined },
          ]} />
          <div className="mb-3 text-xs text-muted-foreground">Read-only roll-up from all projects. Select a milestone to open its project and log collections.</div>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
              <TableHead>Project</TableHead><TableHead>Project Type</TableHead><TableHead>Milestone</TableHead><TableHead>Due</TableHead>
              <TableHead>Planned</TableHead><TableHead>Collected</TableHead><TableHead>Outstanding</TableHead><TableHead>% Collected</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
            {filteredRevenueItems.length === 0 && <EmptyRow colSpan={9} />}
            {filteredRevenueItems.map((r) => {
              const st = revStatusOf(r);
              const pct = r.planned ? Math.round((r.collected / r.planned) * 100) : 0;
              return (
                <TableRow key={r.id} className="cursor-pointer bg-table-row-bg hover:bg-table-row-hover border-0" onClick={() => openProject(r.projectId, "Revenue Breakdown")}>
                  <TableCell className="font-medium">{r.project}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.businessLine}</TableCell>
                  <TableCell className="text-sm">{r.milestone}</TableCell>
                  <TableCell className="text-xs num-mono">{formatDateWithYear(r.due)}</TableCell>
                  <TableCell className="num-mono font-medium">{money(r.planned)}</TableCell>
                  <TableCell className="num-mono text-accent">{money(r.collected)}</TableCell>
                  <TableCell className="num-mono">{money(r.planned - r.collected)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary/40"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
                      <span className="num-mono text-xs">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell><span className={`inline-flex h-7 items-center whitespace-nowrap rounded-full border px-3 text-xs font-medium ${statusPill(st)}`}>{st}</span></TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
          </EmptyRegion>
        </TabsContent>

      </Tabs>
    </div>
  );
}
