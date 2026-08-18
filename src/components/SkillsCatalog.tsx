import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSkills } from "@/lib/projects-store";

/** Multi-select skills chooser backed by the organization skills lookup. */
export function SkillsSelect({ value, onChange }: { value: string[]; onChange: (skills: string[]) => void }) {
  const { skillsCatalog } = useSkills();
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <ScrollArea className="h-40 rounded-md border border-input">
      <div className="space-y-1 p-2">
        {skillsCatalog.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">No skills in the lookup yet — add some with “Add Skills”.</p>
        )}
        {skillsCatalog.map((s) => {
          const on = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s)}
              className="flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left text-sm text-foreground hover:bg-secondary/40"
            >
              <Checkbox checked={on} className="pointer-events-none" />
              <span className="truncate">{s}</span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
