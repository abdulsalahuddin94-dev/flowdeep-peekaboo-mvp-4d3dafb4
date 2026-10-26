import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { useProjects } from "@/lib/projects-store";

export const T = {
  en: { save: "Save", saveUpdate: "Save Update", cancel: "Cancel", portfolio: "Portfolio", risk: "Risk register", issue: "Issues log", meeting: "Meetings", action: "Action Tracker", details: "Action details", back: "Back to", breadcrumb: "Breadcrumb" },
  ar: { save: "حفظ", saveUpdate: "حفظ التحديث", cancel: "إلغاء", portfolio: "المحفظة", risk: "سجل المخاطر", issue: "سجل المشكلات", meeting: "الاجتماعات", action: "متابعة الإجراءات", details: "تفاصيل الإجراء", back: "العودة إلى", breadcrumb: "مسار التنقل" },
};

type Kind = "risk" | "issue" | "meeting" | "action";

export function RecordPageHeader({ kind, title, subtitle, back, actions }: {
  kind: Kind; title: string; subtitle?: string; back?: string; actions?: ReactNode;
}) {
  const { projects } = useProjects();
  const t = T.en;
  const fallback = kind === "issue" ? "/risks?tab=issues" : kind === "risk" ? "/risks?tab=register" : kind === "meeting" ? "/meetings" : "/action-tracker";
  const destination = new URL(back?.startsWith("/") && !back.startsWith("//") ? back : fallback, "https://local.invalid");
  const segments = destination.pathname.split("/").filter(Boolean);
  const project = segments[0] === "portfolio" ? projects.find((p) => p.id === segments[1]) : undefined;
  const label = segments[0] === "risks" ? destination.searchParams.get("tab") === "issues" ? t.issue : t.risk
    : segments[0] === "meetings" ? t.meeting : segments[0] === "portfolio" ? t.portfolio : t.action;
  const linkClass = "inline-flex items-center gap-2 text-sm text-breadcrumb-muted transition-colors hover:text-breadcrumb-hover";
  const target = segments[0] === "risks" ? "/risks" : segments[0] === "meetings" ? "/meetings" : segments[0] === "portfolio" ? "/portfolio" : "/action-tracker";
  const search = Object.fromEntries(destination.searchParams);
  return (
    <>
      {project ? (
        <nav aria-label={t.breadcrumb} className="mb-2 flex flex-wrap items-center gap-2 text-sm text-breadcrumb-muted">
          <Link to="/portfolio" className={linkClass}>{t.portfolio}</Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          <Link to="/portfolio/$projectId" params={{ projectId: project.id }} search={search} className={linkClass}>{project.name}</Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          <span className="text-breadcrumb-current">{title}</span>
        </nav>
      ) : segments[0] === "actions" && segments[1] && segments[1] !== "new" ? (
        <Link to="/actions/$actionId" params={{ actionId: segments[1] }} search={search} className={`${linkClass} mb-2`}>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />{t.back} {t.details}
        </Link>
      ) : (
        <Link to={target} search={search} className={`${linkClass} mb-2`}>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />{t.back} {label}
        </Link>
      )}
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
    </>
  );
}