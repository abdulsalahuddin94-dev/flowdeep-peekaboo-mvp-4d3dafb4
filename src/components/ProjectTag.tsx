import { cn } from "@/lib/utils";

/**
 * Project tag: a neutral pill with a small dot in the tag's color. The color lives
 * only in the dot because users pick any tag color, and dark ones (navy, black)
 * would disappear as text or fill on the dark surface.
 */
export function ProjectTag({ name, color, className }: { name: string; color?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-secondary/50 text-foreground", className)}>
      <TagDot color={color} />
      {name}
    </span>
  );
}

export function TagDot({ color, className }: { color?: string; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", !color && "bg-muted-foreground", className)} style={color ? { backgroundColor: color } : undefined} />;
}
