import { createFileRoute } from "@tanstack/react-router";
import { IssueFormPage } from "@/components/risk/IssueFormPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/issues_/new")({
  component: NewIssueRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "Log a new issue · Nexus PMO" },
      { name: "description", content: "Record a realized event that needs immediate corrective action and an action plan." },
      { property: "og:title", content: "Log a new issue · Nexus PMO" },
      { property: "og:description", content: "Record a realized event that needs immediate corrective action and an action plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function NewIssueRoute() {
  const { project, back } = Route.useSearch();
  return <IssueFormPage lockedProject={project} back={back} />;
}
