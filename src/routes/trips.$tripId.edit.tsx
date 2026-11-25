import { createFileRoute } from "@tanstack/react-router";
import { TripFormPage } from "@/components/trips/TripFormPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/trips/$tripId/edit")({
  component: EditTripRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "Edit project trip · Nexus PMO" },
      { name: "description", content: "Update a project trip's dates, travelers, destination and costs." },
      { property: "og:title", content: "Edit project trip · Nexus PMO" },
      { property: "og:description", content: "Update a project trip's dates, travelers, destination and costs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function EditTripRoute() {
  const { tripId } = Route.useParams();
  const { project, back } = Route.useSearch();
  return <TripFormPage projectId={project} back={back} tripId={tripId} />;
}
