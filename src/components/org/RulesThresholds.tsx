import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RagBadge } from "@/components/RagBadge";
import { DEFAULT_ORG_RULES, loadOrgRules, saveOrgRules, type OrgRules } from "@/lib/org-rules";
import { toast } from "@/lib/toast";
import { PageActions } from "@/components/ds/PageActionsSlot";

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
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { setRules(loadOrgRules()); }, []);

  const setRag = (patch: Partial<OrgRules["rag"]>) => { setRules((r) => ({ ...r, rag: { ...r.rag, ...patch } })); setDirty(true); };
  const setFin = (patch: Partial<OrgRules["financial"]>) => { setRules((r) => ({ ...r, financial: { ...r.financial, ...patch } })); setDirty(true); };
  const setRisk = (patch: Partial<OrgRules["risk"]>) => { setRules((r) => ({ ...r, risk: { ...r.risk, ...patch } })); setDirty(true); };

  const setHealthBand = (band: "atRisk" | "offTrack", value: number) => {
    if (band === "atRisk") {
      setRag({ scheduleAmberPct: value, costAmberPct: value, progressAmberPct: value });
      return;
    }

    setRag({ scheduleRedPct: value, costRedPct: value, progressRedPct: value });
  };

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
  return (
    <div>
      <PageActions>
        <Button variant="outline" onClick={reset}>Restore defaults</Button>
        <Button variant="primary" onClick={save} disabled={!dirty}>Save changes</Button>
      </PageActions>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <NumField label="At Risk" suffix="%" value={rules.rag.scheduleAmberPct}
                onChange={(v) => setHealthBand("atRisk", v)} />
              <NumField label="Off-Track" suffix="%" value={rules.rag.scheduleRedPct}
                onChange={(v) => setHealthBand("offTrack", v)} />
            </div>
          </CardContent>
        </Card>

        {/* 2 — Financial */}
        <Card className="border-border bg-surface">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-medium">Financial Rules</CardTitle>
            <CardDescription>Reporting currency.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
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
          </CardContent>
        </Card>

        {/* 3 — Risk & Issues */}
        <Card className="border-border bg-surface">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-medium">Risk & Issues Rules</CardTitle>
            <CardDescription>
              Probability and Impact are scored 1–5 and the risk score is Probability × Impact.
              Set the severity bands for your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            <div className="grid items-start gap-4 sm:grid-cols-3">
              <NumField label="Critical" value={rules.risk.criticalMin} onChange={(v) => setRisk({ criticalMin: v })}
                hint="Score at or above" />
              <NumField label="High" value={rules.risk.highMin} onChange={(v) => setRisk({ highMin: v })}
                hint="Score at or above" />
              <NumField label="Medium" value={rules.risk.mediumMin} onChange={(v) => setRisk({ mediumMin: v })}
                hint="Score at or above — below this is Low" />
            </div>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}