import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RagBadge } from "@/components/RagBadge";
import { DEFAULT_ORG_RULES, loadOrgRules, saveOrgRules, type OrgRules } from "@/lib/org-rules";
import { toast } from "@/lib/toast";

function NumField({
  label, hint, value, onChange, suffix,
}: { label: string; hint?: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={String(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className={suffix ? "pr-10" : undefined}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function RulesThresholdsTab() {
  const [rules, setRules] = useState<OrgRules>(DEFAULT_ORG_RULES);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setRules(loadOrgRules()); }, []);

  const setRag = (patch: Partial<OrgRules["rag"]>) => { setRules((r) => ({ ...r, rag: { ...r.rag, ...patch } })); setDirty(true); };
  const setSchedule = (patch: Partial<OrgRules["schedule"]>) => { setRules((r) => ({ ...r, schedule: { ...r.schedule, ...patch } })); setDirty(true); };
  const setFin = (patch: Partial<OrgRules["financial"]>) => { setRules((r) => ({ ...r, financial: { ...r.financial, ...patch } })); setDirty(true); };
  const setRisk = (patch: Partial<OrgRules["risk"]>) => { setRules((r) => ({ ...r, risk: { ...r.risk, ...patch } })); setDirty(true); };

  function save() {
    saveOrgRules(rules);
    setDirty(false);
    toast.done("Rules & thresholds", "saved");
  }

  function reset() {
    setRules(DEFAULT_ORG_RULES);
    setDirty(true);
    toast.info("Restored recommended defaults — save to apply");
  }

  const weightTotal = rules.rag.scheduleWeight + rules.rag.costWeight + rules.rag.scopeWeight;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={reset}>Restore defaults</Button>
        <Button variant="primary" onClick={save} disabled={!dirty}>Save changes</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* 1 — RAG / Health */}
        <Card className="border-border bg-surface xl:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-medium">Project Health (RAG) Rules</CardTitle>
            <CardDescription>
              Defines when a project is reported as On Track, At Risk or Off-Track.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <RagBadge rag="green" /> below Amber
              <RagBadge rag="amber" className="ml-2" /> at/above Amber
              <RagBadge rag="red" className="ml-2" /> at/above Red
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumField label="Schedule slip → At Risk" suffix="%" value={rules.rag.scheduleAmberPct}
                onChange={(v) => setRag({ scheduleAmberPct: v })}
                hint="Slip vs baseline finish date." />
              <NumField label="Schedule slip → Off-Track" suffix="%" value={rules.rag.scheduleRedPct}
                onChange={(v) => setRag({ scheduleRedPct: v })} />
              <div className="hidden lg:block" />

              <NumField label="Cost overrun → At Risk" suffix="%" value={rules.rag.costAmberPct}
                onChange={(v) => setRag({ costAmberPct: v })}
                hint="Actual + committed vs approved budget." />
              <NumField label="Cost overrun → Off-Track" suffix="%" value={rules.rag.costRedPct}
                onChange={(v) => setRag({ costRedPct: v })} />
              <div className="hidden lg:block" />

              <NumField label="Progress gap → At Risk" suffix="%" value={rules.rag.progressAmberPct}
                onChange={(v) => setRag({ progressAmberPct: v })}
                hint="Difference between % Actual and % Plan." />
              <NumField label="Progress gap → Off-Track" suffix="%" value={rules.rag.progressRedPct}
                onChange={(v) => setRag({ progressRedPct: v })} />
            </div>

            <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Overall RAG calculation</Label>
                <Select value={rules.rag.rollup} onValueChange={(v) => setRag({ rollup: v as OrgRules["rag"]["rollup"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worst">Worst indicator wins</SelectItem>
                    <SelectItem value="weighted">Weighted score</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Weights apply only to the weighted method.
                </p>
              </div>
              <NumField label="Schedule weight" suffix="%" value={rules.rag.scheduleWeight} onChange={(v) => setRag({ scheduleWeight: v })} />
              <NumField label="Cost weight" suffix="%" value={rules.rag.costWeight} onChange={(v) => setRag({ costWeight: v })} />
              <NumField label="Scope weight" suffix="%" value={rules.rag.scopeWeight} onChange={(v) => setRag({ scopeWeight: v })}
                hint={weightTotal === 100 ? "Total 100%" : `Total ${weightTotal}% — should equal 100%`} />
            </div>
          </CardContent>
        </Card>

        {/* 2 — Schedule */}
        <Card className="border-border bg-surface">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-medium">Schedule Rules</CardTitle>
            <CardDescription>Lateness, reminders and baseline tolerance.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
            <NumField label="Grace period before “Late”" suffix="days" value={rules.schedule.lateGraceDays} onChange={(v) => setSchedule({ lateGraceDays: v })} />
            <NumField label="“Due soon” horizon" suffix="days" value={rules.schedule.dueSoonDays} onChange={(v) => setSchedule({ dueSoonDays: v })} />
            <NumField label="Mark data stale after" suffix="days" value={rules.schedule.staleUpdateDays} onChange={(v) => setSchedule({ staleUpdateDays: v })}
              hint="No progress update within this window." />
            <NumField label="Baseline drift tolerance" suffix="days" value={rules.schedule.baselineToleranceDays} onChange={(v) => setSchedule({ baselineToleranceDays: v })}
              hint="Above this a change request is required." />
            <NumField label="Default task duration" suffix="days" value={rules.schedule.defaultDurationDays} onChange={(v) => setSchedule({ defaultDurationDays: v })} />
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <Label className="text-xs font-medium text-foreground">Count weekends as working days</Label>
                <p className="text-[11px] text-muted-foreground">Off = follow the work calendar.</p>
              </div>
              <Switch checked={rules.schedule.countWeekends} onCheckedChange={(v) => setSchedule({ countWeekends: v })} />
            </div>
          </CardContent>
        </Card>

        {/* 3 — Financial */}
        <Card className="border-border bg-surface">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-medium">Financial Rules</CardTitle>
            <CardDescription>Budget alerts, margin floor and approval limits.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Reporting currency</Label>
              <Select value={rules.financial.currency} onValueChange={(v) => setFin({ currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["SAR", "AED", "EGP", "USD", "EUR"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NumField label="Budget consumed → warning" suffix="%" value={rules.financial.budgetWarnPct} onChange={(v) => setFin({ budgetWarnPct: v })} />
            <NumField label="Budget consumed → breach" suffix="%" value={rules.financial.budgetBreachPct} onChange={(v) => setFin({ budgetBreachPct: v })} />
            <NumField label="Minimum acceptable margin" suffix="%" value={rules.financial.minMarginPct} onChange={(v) => setFin({ minMarginPct: v })} />
            <NumField label="Default contingency" suffix="%" value={rules.financial.contingencyPct} onChange={(v) => setFin({ contingencyPct: v })} />
            <NumField label="CapEx threshold" suffix={rules.financial.currency} value={rules.financial.capexThreshold} onChange={(v) => setFin({ capexThreshold: v })}
              hint="Spend above this is classified as CapEx." />
            <NumField label="Cost approval threshold" suffix={rules.financial.currency} value={rules.financial.approvalThreshold} onChange={(v) => setFin({ approvalThreshold: v })}
              hint="Cost items above this need an approval." />
          </CardContent>
        </Card>

        {/* 4 — Risk & Issues */}
        <Card className="border-border bg-surface xl:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-medium">Risk & Issues Rules</CardTitle>
            <CardDescription>
              Probability and Impact are scored 1–5 and the risk score is Probability × Impact.
              The scale is a standard, but the severity bands differ per organization — set yours here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-0">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumField label="Score → Critical (at or above)" value={rules.risk.criticalMin} onChange={(v) => setRisk({ criticalMin: v })} />
              <NumField label="Score → High (at or above)" value={rules.risk.highMin} onChange={(v) => setRisk({ highMin: v })} />
              <NumField label="Score → Medium (at or above)" value={rules.risk.mediumMin} onChange={(v) => setRisk({ mediumMin: v })}
                hint="Anything below this is Low." />
            </div>

            <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">Probability scale (1 → 5)</Label>
                {rules.risk.probabilityLabels.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="num-mono w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <Input
                      value={l}
                      onChange={(e) => setRisk({
                        probabilityLabels: rules.risk.probabilityLabels.map((x, ix) => (ix === i ? e.target.value : x)),
                      })}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">Impact scale (1 → 5)</Label>
                {rules.risk.impactLabels.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="num-mono w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <Input
                      value={l}
                      onChange={(e) => setRisk({
                        impactLabels: rules.risk.impactLabels.map((x, ix) => (ix === i ? e.target.value : x)),
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}