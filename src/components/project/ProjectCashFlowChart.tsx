import { useId, useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Tooltip as ControlTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { EmptyRegion } from "@/lib/empty-preview";
import { cashSeries, cashYearNavigation, type CashEvent } from "@/lib/financial-filters";
import { projectCashYears } from "@/lib/project-cash-flow";

const T = {
  en: { title: "Cash Flow Forecast", subtitle: "Expected collections vs payments from cost and revenue events", forecast: "forecast", previous: "Previous year", next: "Next year", navigation: "Cash flow year navigation", inflow: "Inflow", outflow: "Outflow", cumulative: "Cumulative net" },
  ar: { title: "توقعات التدفقات النقدية", subtitle: "التحصيلات المتوقعة مقابل المدفوعات من بنود التكلفة والإيرادات", forecast: "توقعات", previous: "السنة السابقة", next: "السنة التالية", navigation: "التنقل بين سنوات التدفقات النقدية", inflow: "التدفقات الداخلة", outflow: "التدفقات الخارجة", cumulative: "صافي التدفقات التراكمي" },
};

export function ProjectCashFlowChart({ events, startDate, endDate, isNew, lang = "en" }: {
  events: CashEvent[]; startDate: string; endDate: string; isNew: boolean; lang?: "en" | "ar";
}) {
  const t = T[lang];
  const today = new Date().toISOString().slice(0, 10);
  const years = projectCashYears(startDate, endDate, events, today);
  const [selectedYear, setSelectedYear] = useState("");
  const navigation = cashYearNavigation(years, selectedYear);
  const year = navigation.year ?? "";
  const id = useId().replace(/:/g, "");
  const data = useMemo(() => cashSeries([
    ...events,
    ...years.map((value) => ({ due: `${value}-01-01`, inflow: 0, outflow: 0 })),
  ], "monthly", year, today), [events, years.join(","), year, today]);
  const axis = { tick: { fill: "var(--chart-axis-tick)", fontSize: 11, fontFamily: "Poppins" }, axisLine: { stroke: "var(--chart-axis)" }, tickLine: false };

  return (
    <section className="glass-card min-w-0 p-4" aria-label={t.title}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="label-eyebrow">{t.title}</h3>
          <p className="text-xs text-muted-foreground">{t.subtitle} · $M{year && ` · FY${year}`} · * {t.forecast}</p>
        </div>
        {year && <div className="grid h-9 shrink-0 grid-cols-[36px_64px_36px] items-center" dir="ltr" aria-label={t.navigation}>
          <div>{navigation.previous && <ControlTooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={t.previous} onClick={() => { if (navigation.previous) setSelectedYear(navigation.previous); }}><ChevronLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t.previous}</TooltipContent></ControlTooltip>}</div>
          <span className="text-center text-sm font-medium" aria-live="polite">{year}</span>
          <div>{navigation.next && <ControlTooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={t.next} onClick={() => { if (navigation.next) setSelectedYear(navigation.next); }}><ChevronRight className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t.next}</TooltipContent></ControlTooltip>}</div>
        </div>}
      </div>
      <EmptyRegion id="financials-cash-flow" variant="card" force={isNew || events.length === 0} className="min-h-64 flex-wrap text-center [&_img]:h-32 [&_img]:w-32">
        <div className="h-64 min-w-0" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} stackOffset="sign" margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={`${id}-in`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--rag-green)" stopOpacity={0.42} /><stop offset="100%" stopColor="var(--rag-green)" stopOpacity={0.04} /></linearGradient>
                <linearGradient id={`${id}-out`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--rag-red)" stopOpacity={0.04} /><stop offset="100%" stopColor="var(--rag-red)" stopOpacity={0.42} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" {...axis} minTickGap={12} />
              <YAxis {...axis} />
              <ReferenceLine y={0} stroke="var(--chart-axis)" />
              <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "var(--chart-tooltip-label)" }} itemStyle={{ color: "var(--chart-tooltip-item)" }} formatter={(value: number) => `$${value.toFixed(2)}M`} />
              <Area type="monotone" dataKey="Inflow" name={t.inflow} stroke="var(--rag-green)" strokeWidth={2} fill={`url(#${id}-in)`} />
              <Area type="monotone" dataKey="Outflow" name={t.outflow} stroke="var(--rag-red)" strokeWidth={2} fill={`url(#${id}-out)`} />
              <Line type="monotone" dataKey="Cumulative" name={t.cumulative} stroke="var(--accent)" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </EmptyRegion>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rag-green" />{t.inflow}</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rag-red" />{t.outflow}</span>
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-4 bg-accent" />{t.cumulative}</span>
      </div>
    </section>
  );
}