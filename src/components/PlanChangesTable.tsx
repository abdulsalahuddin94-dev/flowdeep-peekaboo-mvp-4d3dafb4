import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StyledTable, StyledTableBody, StyledTableCell, StyledTableHead, StyledTableHeader, StyledTableHeaderRow, StyledTableRow } from "@/components/StyledTable";
import { formatDateWithYear } from "@/lib/date-format";

export type PlanSectionChange = { item: string; field: string; before?: string; after?: string; type?: string };

const T = {
  en: { item: "Item", type: "Type", field: "Field", before: "Before", after: "After", changes: "changes", empty: "No changes in", page: "Page", of: "of", previous: "Previous", next: "Next" },
  ar: { item: "البند", type: "النوع", field: "الحقل", before: "قبل", after: "بعد", changes: "تغييرات", empty: "لا توجد تغييرات في", page: "صفحة", of: "من", previous: "السابق", next: "التالي" },
};

function displayValue(value?: string) {
  if (!value) return "—";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDateWithYear(value) : value;
}

/** Schedule item kind as a pill — Milestone is accented, Task stays neutral. */
function TypePill({ type }: { type?: string }) {
  if (!type) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className={type === "Milestone" ? "border-accent/40 bg-accent-dim text-accent" : "border-border text-muted-foreground"}>
      {type}
    </Badge>
  );
}

export function PlanChangesTable({ changes, label, lang = "en", compact = false, showType = false }: { changes: PlanSectionChange[]; label: string; lang?: keyof typeof T; compact?: boolean; showType?: boolean }) {
  const [page, setPage] = useState(0);
  const t = T[lang];
  const pages = Math.max(1, Math.ceil(changes.length / 25));
  const current = Math.min(page, pages - 1);
  const rows = changes.slice(current * 25, current * 25 + 25);
  const colCount = showType ? 5 : 4;

  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-sm font-medium text-foreground">{label} {t.changes} ({changes.length})</h3>
      <div className={compact ? "max-h-[380px] overflow-y-auto" : undefined}>
        <StyledTable
          wrapperClassName=""
          className="[&]:border-spacing-y-0 [&_thead_th]:border-b [&_thead_th]:border-border [&_tbody_td]:border-b [&_tbody_td]:border-border [&_tbody_tr:last-child_td]:border-b-0"
        >
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead>{t.item}</StyledTableHead>
              {showType && <StyledTableHead>{t.type}</StyledTableHead>}
              <StyledTableHead>{t.field}</StyledTableHead>
              <StyledTableHead>{t.before}</StyledTableHead>
              <StyledTableHead>{t.after}</StyledTableHead>
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <StyledTableBody>
            {rows.length === 0 ? (
              <StyledTableRow><StyledTableCell colSpan={colCount} className="py-8 text-center text-sm text-muted-foreground">{t.empty} {label}.</StyledTableCell></StyledTableRow>
            ) : rows.map((change, index) => (
              <StyledTableRow key={`${change.item}-${change.field}-${index}`}>
                <StyledTableCell className="whitespace-normal break-words"><span className="font-medium text-foreground">{change.item}</span></StyledTableCell>
                {showType && <StyledTableCell><TypePill type={change.type} /></StyledTableCell>}
                <StyledTableCell className="whitespace-normal break-words">{change.field}</StyledTableCell>
                <StyledTableCell className="whitespace-normal break-words text-muted-foreground">{displayValue(change.before)}</StyledTableCell>
                <StyledTableCell className="whitespace-normal break-words text-foreground">{displayValue(change.after)}</StyledTableCell>
              </StyledTableRow>
            ))}
          </StyledTableBody>
        </StyledTable>
      </div>
      {pages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>{t.page} {current + 1} {t.of} {pages} · {changes.length} {t.changes}</span>
          <Button variant="secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>{t.previous}</Button>
          <Button variant="secondary" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>{t.next}</Button>
        </div>
      )}
    </section>
  );
}
