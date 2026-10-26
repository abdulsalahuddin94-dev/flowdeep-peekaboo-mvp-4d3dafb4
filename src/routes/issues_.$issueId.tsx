import { createFileRoute } from "@tanstack/react-router";
import { IssueFormPage } from "@/components/risk/IssueFormPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/issues_/$issueId")({
  component: EditIssueRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "Edit issue · Nexus PMO" },
      { name: "description", content: "Update an issue's details, dates and action plan." },
      { property: "og:title", content: "Edit issue · Nexus PMO" },
      { property: "og:description", content: "Update an issue's details, dates and action plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function EditIssueRoute() {
  const { issueId } = Route.useParams();
  const { project, back } = Route.useSearch();
  return <IssueFormPage issueId={issueId} lockedProject={project} back={back} />;
}
