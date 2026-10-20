import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ActionTrackerTab } from "@/components/actions/ActionTracker";

export const Route = createFileRoute("/action-tracker")({
  head: () => ({
    meta: [
      { title: "Action Tracker · Nexus PMO" },
      { name: "description", content: "PMO-wide Action Tracker covering actions across all projects." },
      { property: "og:title", content: "Action Tracker · Nexus PMO" },
      { property: "og:description", content: "PMO-wide Action Tracker covering actions across all projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Action Tracker" subtitle="All actions across every project" />
      <ActionTrackerTab />
    </>
  ),
});
