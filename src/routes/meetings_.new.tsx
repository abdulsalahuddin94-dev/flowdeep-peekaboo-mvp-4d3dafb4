import { createFileRoute } from "@tanstack/react-router";
import { MeetingFormPage } from "@/components/actions/MeetingFormPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/meetings_.new")({
  component: NewMeetingRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "New meeting · Nexus PMO" },
      { name: "description", content: "Record a meeting with its attendees, agenda and the actions it produced." },
      { property: "og:title", content: "New meeting · Nexus PMO" },
      { property: "og:description", content: "Record a meeting with its attendees, agenda and the actions it produced." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function NewMeetingRoute() {
  const { project, back } = Route.useSearch();
  return <MeetingFormPage lockedProject={project} back={back} />;
}
