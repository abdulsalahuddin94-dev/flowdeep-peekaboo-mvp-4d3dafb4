import { createFileRoute } from "@tanstack/react-router";
import { ActionDetailsPage } from "@/components/actions/ActionDetailsPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/actions_/$actionId")({
  component: ActionDetailsRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "Action details · Nexus PMO" },
      { name: "description", content: "One page for an action: details, owner, due date, status updates and comment history." },
      { property: "og:title", content: "Action details · Nexus PMO" },
      { property: "og:description", content: "One page for an action: details, owner, due date, status updates and comment history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ActionDetailsRoute() {
  const { actionId } = Route.useParams();
  const { back } = Route.useSearch();
  return <ActionDetailsPage actionId={actionId} back={back} />;
}
