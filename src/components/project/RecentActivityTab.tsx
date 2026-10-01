import { useMemo, useState } from "react";
import { useRiskRegister } from "@/lib/risk-store";
import { useActions } from "@/lib/action-store";
import { PageToolbar } from "@/components/ds/PageToolbar";
import { formatDateWithYear } from "@/lib/date-format";

/*
 * Project activity feed — derived on read from Risk, Issue and Action histories,
 * so it never drifts from the source records.
 */

type Kind = "Risk" | "Issue" | "Action";
type Activity = { id: string; kind: Kind; ref: string; title: string; text: string; by: string; at: string; change?: string };

const T = {
  en: { title: "Recent Activity", search: "Search activity...", type: "Type", all: "All", empty: "No activity matches.", none: "No activity on this project yet." },
  ar: { title: "النشاط الأخير", search: "ابحث في النشاط...", type: "النوع", all: "الكل", empty: "لا يوجد نشاط مطابق.", none: "لا يوجد نشاط على هذا المشروع بعد." },
};

const KIND_STYLE: Record<Kind, string> = {
  Risk: "border-rag-red/40 text-rag-red bg-rag-red/10",
  Issue: "border-rag-amber/40 text-rag-amber bg-rag-amber/10",
  Action: "border-accent/40 text-accent bg-accent/10",
};

export function RecentActivityTab({ project, lang = "en" }: { project: string; lang?: "en" | "ar" }) {
  const t = T[lang];
  const { risks, issues } = useRiskRegister();
  const { actions } = useActions();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");

  const items = useMemo<Activity[]>(() => {
    const out: Activity[] = [];
    risks.filter((r) => r.project === project).forEach((r) =>
      r.updates.forEach((u) => out.push({
        id: `${r.id}-${u.id}`, kind: "Risk", ref: r.id, title: r.title, text: u.comment, by: u.by, at: u.at,
        change: u.change?.status ? `${u.change.status[0]} → ${u.change.status[1]}` : u.change?.score ? `Score ${u.change.score[0]} → ${u.change.score[1]}` : undefined,
      })));
    issues.filter((i) => i.project === project).forEach((i) =>
      i.updates.forEach((u) => out.push({
        id: `${i.id}-${u.id}`, kind: "Issue", ref: i.id, title: i.title, text: u.comment, by: u.by, at: u.at,
        change: u.statusChange ? `${u.statusChange[0]} → ${u.statusChange[1]}` : undefined,
      })));
    actions.filter((a) => a.project === project).forEach((a) => {
      a.updates.forEach((u) => out.push({
        id: `${a.id}-${u.id}`, kind: "Action", ref: a.id, title: a.title, text: u.comment, by: u.by, at: u.at,
        change: u.statusChange ? `${u.statusChange[0]} → ${u.statusChange[1]}` : undefined,
      }));
      if (a.closedDate && !a.updates.some((u) => u.statusChange?.[1] === "Done")) {
        out.push({ id: `${a.id}-closed`, kind: "Action", ref: a.id, title: a.title, text: "Action closed", by: a.owner, at: a.closedDate, change: `→ ${a.status}` });
      }
    });
    return out.sort((x, y) => y.at.localeCompare(x.at));
  }, [risks, issues, actions, project]);

  const filtered = items.filter((a) => {
    if (kind !== "all" && a.kind !== kind) return false;
    const q = query.trim().toLowerCase();
    return !q || `${a.title} ${a.text} ${a.by} ${a.ref}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <PageToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t.search}
        filterGroups={[{
          key: "kind", label: t.type, value: kind, onChange: setKind,
          options: [{ value: "all", label: t.all }, { value: "Risk", label: "Risk" }, { value: "Issue", label: "Issue" }, { value: "Action", label: "Action" }],
        }]}
      />
      <div className="glass-card p-5">
        <div className="label-eyebrow mb-4">{t.title}</div>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{items.length ? t.empty : t.none}</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                <span className={`inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-medium ${KIND_STYLE[a.kind]}`}>{a.kind}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    <span className="num-mono me-2 text-xs text-muted-foreground">{a.ref}</span>{a.title}
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{a.text}</div>
                  <div className="mt-1 text-xs text-accent">
                    {a.by}{a.change && <span className="ms-2 text-muted-foreground">· {a.change}</span>}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDateWithYear(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
