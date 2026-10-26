import { createFileRoute } from "@tanstack/react-router";
import { MeetingFormPage } from "@/components/actions/MeetingFormPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/meetings_/$meetingId")({
  component: EditMeetingRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "Edit meeting · Nexus PMO" },
      { name: "description", content: "Update a meeting's details, attendees and the actions linked to it." },
      { property: "og:title", content: "Edit meeting · Nexus PMO" },
      { property: "og:description", content: "Update a meeting's details, attendees and the actions linked to it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function EditMeetingRoute() {
  const { meetingId } = Route.useParams();
  const { project, back } = Route.useSearch();
  return <MeetingFormPage meetingId={meetingId} lockedProject={project} back={back} />;
}
