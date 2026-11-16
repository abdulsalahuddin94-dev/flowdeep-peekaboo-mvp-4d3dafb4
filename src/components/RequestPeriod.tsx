import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { requestPeriod } from "@/lib/request-period";

const T = {
  en: { start: "Start", end: "End", duration: "Duration" },
  ar: { start: "البداية", end: "النهاية", duration: "المدة" },
};

export function RequestPeriod({ from, until, durationHours, lang = "en", inline = false }: { from: string; until: string; durationHours?: number; lang?: "en" | "ar"; inline?: boolean }) {
  const period = requestPeriod(from, until, durationHours);
  const t = T[lang];
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-block whitespace-nowrap num-mono text-xs text-muted-foreground" dir="ltr">
            {inline ? period.lines.join(period.duration && period.lines[1] === period.duration ? " · " : " → ") : period.lines.map((line, i) => <span className="block" key={i}>{line || "—"}</span>)}
          </span>
        </TooltipTrigger>
        <TooltipContent className="whitespace-normal text-left">
          <div>{t.start}: <span dir="ltr">{from.replace("T", " ")}</span></div>
          <div>{t.end}: <span dir="ltr">{until.replace("T", " ")}</span></div>
          {period.duration && <div>{t.duration}: <span dir="ltr">{period.duration}</span></div>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}