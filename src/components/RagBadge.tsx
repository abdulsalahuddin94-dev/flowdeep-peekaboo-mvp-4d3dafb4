import type { Rag } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const ragTone: Record<Rag, { label: string; dot: string; text: string; bg: string; border: string }> = {
  green: { label: "On Track", dot: "bg-rag-green", text: "text-rag-green", bg: "bg-rag-green/10", border: "border-rag-green/30" },
  amber: { label: "At Risk", dot: "bg-rag-amber", text: "text-rag-amber", bg: "bg-rag-amber/10", border: "border-rag-amber/30" },
  red: { label: "Off-Track", dot: "bg-rag-red pulse-dot", text: "text-rag-red", bg: "bg-rag-red/10", border: "border-rag-red/30" },
  blue: { label: "Not Started", dot: "bg-rag-blue", text: "text-rag-blue", bg: "bg-rag-blue/10", border: "border-rag-blue/30" },
  grey: { label: "On Hold", dot: "bg-rag-grey", text: "text-rag-grey", bg: "bg-rag-grey/10", border: "border-rag-grey/30" },
};

export function RagDot({ rag, className }: { rag: Rag; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", ragTone[rag].dot, className)} />;
}

/** `pill` is the project Health shape on portfolio cards/list: fully rounded, text only (tags carry the dots). */
export function RagBadge({ rag, label, className, pill = false }: { rag: Rag; label?: string; className?: string; pill?: boolean }) {
  const m = ragTone[rag];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 text-xs font-medium", pill ? "rounded-full" : "rounded-md", m.bg, m.text, m.border, className)}>
      {!pill && <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />}
      {label ?? m.label}
    </span>
  );
}
