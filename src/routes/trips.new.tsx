import { createFileRoute } from "@tanstack/react-router";
import { TripFormPage } from "@/components/trips/TripFormPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/trips/new")({
  component: NewTripRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "Add a project trip · Nexus PMO" },
      { name: "description", content: "Plan a business trip for project team members: dates, travelers, destination and costs." },
      { property: "og:title", content: "Add a project trip · Nexus PMO" },
      { property: "og:description", content: "Plan a business trip for project team members: dates, travelers, destination and costs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function NewTripRoute() {
  const { project, back } = Route.useSearch();
  return <TripFormPage projectId={project} back={back} />;
}
