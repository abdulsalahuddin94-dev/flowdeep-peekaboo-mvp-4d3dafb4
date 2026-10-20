import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { MeetingsTab } from "@/components/actions/Meetings";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings · Nexus PMO" },
      { name: "description", content: "PMO-wide meetings covering all projects, with attendees and actions." },
      { property: "og:title", content: "Meetings · Nexus PMO" },
      { property: "og:description", content: "PMO-wide meetings covering all projects, with attendees and actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Meetings" subtitle="All meetings across every project" />
      <MeetingsTab />
    </>
  ),
});
