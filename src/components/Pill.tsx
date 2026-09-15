import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Generic rounded outline tag/badge (DS02): border/bg/text tone classes in, pill out.
 * Shared across Risk severity, RAG-tinted type tags, and similar enum-driven labels.
 */
export function Pill({ label, tone, className }: { label: string; tone: string; className?: string }) {
  return <Badge variant="outline" className={cn("rounded-full", tone, className)}>{label}</Badge>;
}

export default Pill;
