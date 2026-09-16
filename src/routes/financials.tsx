import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { PageToolbar, EmptyRow } from "@/components/ds/PageToolbar";
import { EmptyRegion } from "@/lib/empty-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projects, portfolioSummary } from "@/lib/mock-data";
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Wallet, Flame, AlertTriangle, PiggyBank } from "@/lib/icons";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const COST_ITEMS = [
  { project: "ERP Upgrade", item: "SAP licensing (Y1)", cat: "Software", type: "CapEx", amount: "$1.2M", milestone: "Kickoff", due: "Feb 10", status: "Recognised" },
  { project: "ERP Upgrade", item: "Integration labour", cat: "Staff", type: "OpEx", amount: "$0.8M", milestone: "UAT Sign-off", due: "Jun 15", status: "Pending" },
  { project: "Refinery Expansion", item: "Civil works — Phase 1", cat: "Contracts", type: "CapEx", amount: "$8.4M", milestone: "Civil phase complete", due: "Sep 22", status: "In progress" },
  { project: "Refinery Expansion", item: "Site supervision", cat: "Services", type: "OpEx", amount: "$1.1M", milestone: "Fixed monthly", due: "Monthly", status: "Recurring" },
  { project: "Customer Portal v3", item: "Dev sprint capacity", cat: "Staff", type: "OpEx", amount: "$0.6M", milestone: "Production cutover", due: "Aug 30", status: "Pending" },
  { project: "Salesforce Migration", item: "SF platform fees", cat: "Software", type: "CapEx", amount: "$0.9M", milestone: "Hypercare exit", due: "Jul 22", status: "Recognised" },
  { project: "Smart Grid Pilot", item: "Field engineers travel", cat: "Business Trips", type: "OpEx", amount: "$0.3M", milestone: "Fixed date", due: "Aug 05", status: "Pending" },
];

const FIN_TAB_LABELS: Record<string, string> = {
  overview: "Overview (P&L)", cost: "Cost Recognition", rev: "Revenue Recognition",
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
  const [selectedYear, setSelectedYear] = useState("all");
  const [pnlQuery, setPnlQuery] = useState("");
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => (currentYear - 2 + i).toString());

  const pnlRows = useMemo(
    () =>
      projects.slice(0, 12).map((p) => {
        const revenue = p.budgetTotal * 1.15;
        const expectedProfit = revenue - p.budgetTotal;
        const expectedProfitPct = (expectedProfit / p.budgetTotal) * 100;
        const actualProfit = revenue - p.budgetUsed;
        const margin = (actualProfit / revenue) * 100;
        const burnPct = (p.budgetUsed / p.budgetTotal) * 100;
        return { p, revenue, expectedProfit, expectedProfitPct, actualProfit, margin, burnPct };
      }),
    [],
  );

  const budgetVsSpent = pnlRows.map((r) => ({
    name: r.p.name.length > 14 ? r.p.name.slice(0, 12) + "…" : r.p.name,
    Budget: +r.p.budgetTotal.toFixed(2),
    Spent: +r.p.budgetUsed.toFixed(2),
    Revenue: +r.revenue.toFixed(2),
  }));

  const businessLineAgg = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    for (const p of projects) {
      const cur = map.get(p.businessLine) ?? { name: p.businessLine, value: 0 };
      cur.value += p.budgetTotal;
      map.set(p.businessLine, cur);
    }
    return Array.from(map.values()).map((x) => ({ ...x, value: +x.value.toFixed(2) }));
  }, []);

  const monthlyTrend = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const totalBudget = portfolioSummary.budgetTotal;
    const totalSpent = portfolioSummary.budgetUsed;
    return months.map((m, i) => {
      const progress = (i + 1) / 12;
      const plan = +(totalBudget * progress).toFixed(2);
      // simulate slight over/under burn curve
      const noise = Math.sin(i / 1.6) * 0.04 + 0.02;
      const actual = +(totalSpent * Math.min(1, progress + noise)).toFixed(2);
      const revenue = +(totalBudget * 1.15 * Math.max(0, progress - 0.08)).toFixed(2);
      return { month: m, Plan: plan, Actual: actual, Revenue: revenue };
    });
  }, []);

  const overBudgetCount = pnlRows.filter((r) => r.burnPct > 100).length;
  const totalRemaining = portfolioSummary.budgetTotal - portfolioSummary.budgetUsed;
  const utilization = (portfolioSummary.budgetUsed / portfolioSummary.budgetTotal) * 100;

  const kpis = [
    {
      label: "Total Budget",
      value: `$${portfolioSummary.budgetTotal.toFixed(1)}M`,
      icon: Wallet,
      tint: "text-foreground",
      hint: `${projects.length} projects`,
    },
    {
      label: "Total Spent",
      value: `$${portfolioSummary.budgetUsed.toFixed(1)}M`,
      icon: TrendingUp,
      tint: "text-accent",
      hint: `${utilization.toFixed(0)}% utilised`,
    },
    {
      label: "Remaining",
      value: `$${totalRemaining.toFixed(1)}M`,
      icon: PiggyBank,
      tint: totalRemaining < 0 ? "text-rag-red" : "text-rag-green",
      hint: `${(100 - utilization).toFixed(0)}% of budget`,
    },
    {
      label: "Burn / month",
      value: "$4.2M",
      icon: Flame,
      tint: "text-foreground",
      hint: "Avg last 3 mo",
      trend: -3.4,
    },
    {
      label: "Projects > budget",
      value: `${overBudgetCount || 2}`,
      icon: AlertTriangle,
      tint: "text-rag-red",
      hint: "Need attention",
    },
  ];

  const donutColors = ["#D4A574", "#0EA5E9", "#51CAAD", "#A78BFA", "#F472B6", "#FBBF24"];

  const chartTooltip = {
    contentStyle: {
      background: "var(--table-row-bg)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      fontSize: 12,
    },
    labelStyle: { color: "#CBD5E1" },
    itemStyle: { color: "#E2E8F0" },
  } as const;

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

      {/* Subpages live in the sidebar (?tab=) */}
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })}>

        <TabsContent value="overview" className="mt-5">
          <EmptyRegion id="financials-overview">
          {/* KPI row */}

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
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    {typeof k.trend === "number" && (
                      <span className={`inline-flex items-center gap-0.5 ${k.trend < 0 ? "text-rag-green" : "text-rag-red"}`}>
                        {k.trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {Math.abs(k.trend).toFixed(1)}%
                      </span>
                    )}
                    <span>{k.hint}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search + filters (DS02 toolbar) */}
          <PageToolbar
            query={pnlQuery}
            onQueryChange={setPnlQuery}
            placeholder="Search project or business line…"
            filterGroups={[
              { key: "year", label: "Fiscal Year", value: selectedYear, onChange: setSelectedYear, options: [{ value: "all", label: "All years" }, ...years.map((y) => ({ value: y, label: `FY${y}` }))] },
            ]}
          />

          {/* Charts row */}
          <div className="mb-5 grid gap-4 lg:grid-cols-3">
            <div className="glass-card p-4 lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="label-eyebrow">Budget vs Spent vs Revenue</div>
                  <div className="text-xs text-muted-foreground">Per project · $M</div>
                </div>
                <div className="flex gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#94A3B8]" />Budget</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-accent" />Spent</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#51CAAD]" />Revenue</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetVsSpent} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                    <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="Budget" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Spent" fill="#D4A574" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Revenue" fill="#51CAAD" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="label-eyebrow">Budget by Project Type</div>
              <div className="text-xs text-muted-foreground">Portfolio distribution</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={businessLineAgg}
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      stroke="rgba(11,17,32,0.6)"
                    >
                      {businessLineAgg.map((_, i) => (
                        <Cell key={i} fill={donutColors[i % donutColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltip} formatter={(v: number) => `$${v.toFixed(1)}M`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                {businessLineAgg.map((bl, i) => (
                  <div key={bl.name} className="flex items-center gap-1 text-muted-foreground">
                    <span className="h-2 w-2 rounded-sm" style={{ background: donutColors[i % donutColors.length] }} />
                    <span className="truncate">{bl.name}</span>
                    <span className="ml-auto num-mono text-foreground">${bl.value.toFixed(1)}M</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cumulative burn trend */}
          <div className="glass-card mb-5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="label-eyebrow">Portfolio burn — Plan vs Actual vs Revenue</div>
                <div className="text-xs text-muted-foreground">Cumulative · $M · FY{selectedYear === "all" ? currentYear : selectedYear}</div>
              </div>
              <div className="flex gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#94A3B8]" />Plan</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-accent" />Actual</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#51CAAD]" />Revenue</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillPlan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A574" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#D4A574" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#51CAAD" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#51CAAD" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} tickLine={false} />
                  <Tooltip {...chartTooltip} formatter={(v: number) => `$${v.toFixed(1)}M`} />
                  <Area type="monotone" dataKey="Plan" stroke="#94A3B8" strokeWidth={2} fill="url(#fillPlan)" />
                  <Area type="monotone" dataKey="Actual" stroke="#D4A574" strokeWidth={2} fill="url(#fillActual)" />
                  <Area type="monotone" dataKey="Revenue" stroke="#51CAAD" strokeWidth={2} fill="url(#fillRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="label-eyebrow mb-3">P&L — by project</div>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
              <TableHead>Project</TableHead><TableHead>Project Type</TableHead><TableHead>Expected Revenue</TableHead><TableHead>Total Budget</TableHead>
              <TableHead>Spent</TableHead><TableHead>Expected Profit</TableHead><TableHead>Expected Profit %</TableHead><TableHead>Margin %</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{pnlRows.filter(({ p }) => {
              const q = pnlQuery.trim().toLowerCase();
              return !q || p.name.toLowerCase().includes(q) || p.businessLine.toLowerCase().includes(q);
            }).map(({ p, revenue, expectedProfit, expectedProfitPct, margin, burnPct }) => {
              return (
                <TableRow key={p.id} className="bg-table-row-bg hover:bg-table-row-hover border-0">
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.businessLine}</TableCell>
                  <TableCell className="num-mono">${revenue.toFixed(2)}M</TableCell>
                  <TableCell className="num-mono">${p.budgetTotal.toFixed(2)}M</TableCell>
                  <TableCell className="num-mono">${p.budgetUsed.toFixed(2)}M</TableCell>
                  <TableCell className={`num-mono text-xs ${expectedProfit > 0 ? "text-rag-green" : "text-rag-red"}`}>${expectedProfit.toFixed(2)}M</TableCell>
                  <TableCell className={`num-mono text-xs ${expectedProfitPct > 15 ? "text-rag-green" : expectedProfitPct > 5 ? "text-rag-amber" : "text-rag-red"}`}>{Math.round(expectedProfitPct)}%</TableCell>
                  <TableCell className={`num-mono text-xs ${margin > 20 ? "text-rag-green" : margin > 10 ? "text-rag-amber" : "text-rag-red"}`}>{Math.round(margin)}%</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-[11px] font-medium ${burnPct > 90 ? "bg-rag-red/20 text-rag-red" : burnPct > 70 ? "bg-rag-amber/20 text-rag-amber" : "bg-rag-green/20 text-rag-green"}`}>{Math.round(burnPct)}%</span></TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
          </EmptyRegion>
        </TabsContent>

        <TabsContent value="cost" className="mt-5">
          <div className="mb-5 grid gap-4 md:grid-cols-4">
            <div className="glass-card p-5">
              <div className="label-eyebrow">CapEx / OpEx split</div>
              <div className="mt-3 flex items-center justify-center">
                <svg viewBox="0 0 42 42" className="h-32 w-32 -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#51CAAD" strokeWidth="6" strokeDasharray="64 36" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#0EA5E9" strokeWidth="6" strokeDasharray="36 64" strokeDashoffset="-64" />
                </svg>
              </div>
              <div className="mt-3 flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />CapEx 64%</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-role-director" />OpEx 36%</span>
              </div>
            </div>
            <div className="glass-card p-4"><div className="label-eyebrow">Total CapEx</div><div className="mt-1 text-2xl font-medium num-mono text-accent">$33.7M</div><div className="text-xs text-muted-foreground mt-1">Across 12 projects</div></div>
            <div className="glass-card p-4"><div className="label-eyebrow">Total OpEx</div><div className="mt-1 text-2xl font-medium num-mono">$19.9M</div><div className="text-xs text-muted-foreground mt-1">Across 12 projects</div></div>
            <div className="glass-card p-4"><div className="label-eyebrow">Recognised YTD</div><div className="mt-1 text-2xl font-medium num-mono">$21.4M</div><div className="text-xs text-muted-foreground mt-1">40% of total</div></div>
          </div>

          <div className="label-eyebrow mb-3">Cost items — recognition schedule</div>
          <EmptyRegion id="financials-costs">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
              <TableHead>Project</TableHead><TableHead>Cost Item</TableHead><TableHead>Category</TableHead>
              <TableHead>Cost Type</TableHead><TableHead>Amount</TableHead>
              <TableHead>Linked Milestone</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{COST_ITEMS.map((c) => (
              <TableRow key={`${c.project}-${c.item}`} className="bg-table-row-bg hover:bg-table-row-hover border-0">
                <TableCell className="font-medium">{c.project}</TableCell>
                <TableCell className="text-sm">{c.item}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.cat}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${c.type === "CapEx" ? "bg-accent/20 text-accent" : "bg-role-director/20 text-role-director"}`}>{c.type}</span>
                </TableCell>
                <TableCell className="num-mono font-medium">{c.amount}</TableCell>
                <TableCell className="text-xs">{c.milestone}</TableCell>
                <TableCell className="text-xs num-mono">{c.due}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-[11px] font-medium ${
                    c.status === "Recognised" ? "bg-rag-green/20 text-rag-green" :
                    c.status === "In progress" ? "bg-rag-amber/20 text-rag-amber" :
                    c.status === "Recurring" ? "bg-role-director/20 text-role-director" :
                    "bg-secondary/40 text-muted-foreground"
                  }`}>{c.status}</span>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
          </EmptyRegion>
        </TabsContent>

        <TabsContent value="rev" className="mt-5">
          <div className="label-eyebrow mb-4">Milestone-linked revenue آ· FY2026</div>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Project</TableHead><TableHead>Milestone</TableHead><TableHead>Due</TableHead><TableHead>Total Contract</TableHead><TableHead>Recognised</TableHead><TableHead>Pending</TableHead><TableHead>% Realized</TableHead><TableHead>Payment</TableHead><TableHead>Days</TableHead></TableRow></TableHeader>
            <TableBody>{([
              { project: "ERP Upgrade", milestone: "UAT Sign-off", due: "Jun 15", contract: "$10.0M", recognised: "$0.4M", pending: "$0.8M", pct: 33, payment: "Invoiced", days: "+5d" },
              { project: "Customer Portal v3", milestone: "Production cutover", due: "Aug 30", contract: "$6.0M", recognised: "$0.6M", pending: "$0.2M", pct: 75, payment: "Paid", days: "25d" },
              { project: "Refinery Expansion", milestone: "Civil phase complete", due: "Sep 22", contract: "$22.0M", recognised: "$8.0M", pending: "$4.2M", pct: 65, payment: "Partial", days: "75d" },
              { project: "Salesforce Migration", milestone: "Hypercare exit", due: "Jul 22", contract: "$2.0M", recognised: "$0.9M", pending: "$0.1M", pct: 90, payment: "Paid", days: "0d" },
            ]).map((r) => {
              const daysNum = parseInt(String(r.days ?? "").replace(/[^\d-]/g, ''), 10);
              const daysStatus = daysNum < 0 ? "text-rag-red" : daysNum < 7 ? "text-rag-amber" : "text-rag-green";
              const payment = r.payment ?? "";
              return (
                <TableRow key={r.project} className="bg-table-row-bg hover:bg-table-row-hover border-0">
                  <TableCell className="font-medium">{r.project}</TableCell>
                  <TableCell className="text-sm">{r.milestone}</TableCell>
                  <TableCell className="text-xs">{r.due}</TableCell>
                  <TableCell className="num-mono font-medium">{r.contract}</TableCell>
                  <TableCell className="num-mono text-accent">{r.recognised}</TableCell>
                  <TableCell className="num-mono">{r.pending}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-secondary/40 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="num-mono text-xs">{r.pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className={`inline-block px-2 py-1 rounded text-[11px] font-medium ${
                      payment.includes("Paid") ? "bg-rag-green/20 text-rag-green" :
                      payment.includes("Invoiced") ? "bg-rag-amber/20 text-rag-amber" :
                      "bg-secondary/40 text-muted-foreground"
                    }`}>
                      {payment}
                    </span>
                  </TableCell>
                  <TableCell className={`num-mono text-xs font-medium ${daysStatus}`}>{r.days}</TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
