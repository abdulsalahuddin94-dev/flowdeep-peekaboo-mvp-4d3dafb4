import { createFileRoute } from "@tanstack/react-router";
import { RiskFormPage } from "@/components/risk/RiskFormPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/risks_/new")({
  component: NewRiskRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "Log a new risk · Nexus PMO" },
      { name: "description", content: "Record a potential event, assess its likelihood and impact, and define mitigation actions." },
      { property: "og:title", content: "Log a new risk · Nexus PMO" },
      { property: "og:description", content: "Record a potential event, assess its likelihood and impact, and define mitigation actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function NewRiskRoute() {
  const { project, back } = Route.useSearch();
  return <RiskFormPage lockedProject={project} back={back} />;
}
