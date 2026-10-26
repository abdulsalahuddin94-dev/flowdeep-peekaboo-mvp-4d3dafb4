import { createFileRoute } from "@tanstack/react-router";
import { ActionNewPage } from "@/components/actions/ActionNewPage";
import type { RecordSearch } from "@/lib/record-pages";

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

/** Only `project` and `back` are always known; the link to a risk/issue/meeting is optional. */
type ActionNewSearch = RecordSearch & {
  source?: string;
  ref?: string;
  meetingName?: string;
  meetingDate?: string;
};

export const Route = createFileRoute("/actions_/new")({
  component: ActionNewRoute,
  validateSearch: (search: Record<string, unknown>): ActionNewSearch => ({
    project: text(search.project),
    source: text(search.source),
    ref: text(search.ref),
    meetingName: text(search.meetingName),
    meetingDate: text(search.meetingDate),
    back: text(search.back),
  }),
  head: () => ({
    meta: [
      { title: "Add action · Nexus PMO" },
      { name: "description", content: "Record a new action with its owner, responsibility, due date and linked risk, issue or meeting." },
      { property: "og:title", content: "Add action · Nexus PMO" },
      { property: "og:description", content: "Record a new action with its owner, responsibility, due date and linked risk, issue or meeting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ActionNewRoute() {
  const s = Route.useSearch();
  return (
    <ActionNewPage
      project={s.project}
      source={s.source}
      sourceRef={s.ref}
      meetingName={s.meetingName}
      meetingDate={s.meetingDate}
      back={s.back}
    />
  );
}
