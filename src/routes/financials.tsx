import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projects, portfolioSummary } from "@/lib/mock-data";
import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/financials")({
  component: FinancialsPage,
  head: () => ({ meta: [{ title: "Financials â€” Nexus PMO" }, { name: "description", content: "Portfolio-wide budgets, CAPEX/OPEX split, change requests and milestone-linked revenue recognition." }] }),
});

function FinancialsPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => (currentYear - 2 + i).toString());

  return (
    <div>
      <PageHeader
        title="Financials"
        subtitle="Portfolio budgets, burn rates, CRs and revenue recognition"
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" />Export</Button>
            <Button variant="outline" size="sm"><FileSpreadsheet className="mr-1 h-4 w-4" />Open in Excel</Button>
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview (P&L)</TabsTrigger>
          <TabsTrigger value="cost">Cost Recognition</TabsTrigger>
          <TabsTrigger value="rev">Revenue Recognition</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { l: "Total Budget", v: `$${portfolioSummary.budgetTotal.toFixed(1)}M` },
              { l: "Total Spent", v: `$${portfolioSummary.budgetUsed.toFixed(1)}M`, c: "text-accent" },
              { l: "Remaining", v: `$${(portfolioSummary.budgetTotal - portfolioSummary.budgetUsed).toFixed(1)}M` },
              { l: "Burn / month", v: "$4.2M" },
              { l: "Projects > budget", v: "2", c: "text-rag-red" },
            ].map((k) => (
              <div key={k.l} className="glass-card p-4"><div className="label-eyebrow">{k.l}</div><div className={`mt-1 text-2xl font-medium num-mono ${k.c ?? "text-foreground"}`}>{k.v}</div></div>
            ))}
          </div>
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium">Filter by Year:</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0">
              <TableHead>Project</TableHead><TableHead>Business Line</TableHead><TableHead>Expected Revenue</TableHead><TableHead>Total Budget</TableHead>
              <TableHead>Spent</TableHead><TableHead>Profit</TableHead><TableHead>Margin %</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{projects.slice(0, 12).map((p) => {
              const revenue = p.budgetTotal * 1.15;
              const profit = revenue - p.budgetUsed;
              const margin = ((profit) / revenue) * 100;
              const burnPct = (p.budgetUsed / p.budgetTotal) * 100;
              return (
                <TableRow key={p.id} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.businessLine}</TableCell>
                  <TableCell className="num-mono">${revenue.toFixed(2)}M</TableCell>
                  <TableCell className="num-mono">${p.budgetTotal.toFixed(2)}M</TableCell>
                  <TableCell className="num-mono">${p.budgetUsed.toFixed(2)}M</TableCell>
                  <TableCell className={`num-mono text-xs ${profit > 0 ? "text-rag-green" : "text-rag-red"}`}>${profit.toFixed(2)}M</TableCell>
                  <TableCell className={`num-mono text-xs ${margin > 20 ? "text-rag-green" : margin > 10 ? "text-rag-amber" : "text-rag-red"}`}>{Math.round(margin)}%</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded text-[11px] font-medium ${burnPct > 90 ? "bg-rag-red/20 text-rag-red" : burnPct > 70 ? "bg-rag-amber/20 text-rag-amber" : "bg-rag-green/20 text-rag-green"}`}>{Math.round(burnPct)}%</span></TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="cost" className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="glass-card p-5">
            <div className="label-eyebrow">CapEx / OpEx split</div>
            <div className="mt-3 flex items-center justify-center">
              <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90">
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
          <div className="md:col-span-2">
            <div className="label-eyebrow mb-3">Cost breakdown by business line</div>
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent bg-transparent border-0"><TableHead>Business Line</TableHead><TableHead>CapEx</TableHead><TableHead>OpEx</TableHead><TableHead>Total</TableHead><TableHead>Category</TableHead></TableRow></TableHeader>
              <TableBody>{[
                ["Software Solutions", 6.2, 4.1, "Staff"], ["EPC", 22.4, 6.8, "Contracts"], ["Consultation", 1.1, 3.2, "Services"], ["Maintenance", 4.0, 5.8, "Business Trips"],
              ].map(([bl, c, o, cat]) => (
                <TableRow key={bl as string} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
                  <TableCell>{bl}</TableCell>
                  <TableCell className="num-mono">${c}M</TableCell>
                  <TableCell className="num-mono">${o}M</TableCell>
                  <TableCell className="num-mono">${((c as number) + (o as number)).toFixed(1)}M</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{cat}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
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
                <TableRow key={r.project} className="bg-[#1D1D23] hover:bg-[#252530] border-0">
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
