import { createFileRoute } from "@tanstack/react-router";
import { RiskFormPage } from "@/components/risk/RiskFormPage";
import { recordSearch } from "@/lib/record-pages";

export const Route = createFileRoute("/risks_/$riskId")({
  component: EditRiskRoute,
  validateSearch: recordSearch,
  head: () => ({
    meta: [
      { title: "Edit risk · Nexus PMO" },
      { name: "description", content: "Update a risk's classification, scoring and mitigation actions." },
      { property: "og:title", content: "Edit risk · Nexus PMO" },
      { property: "og:description", content: "Update a risk's classification, scoring and mitigation actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function EditRiskRoute() {
  const { riskId } = Route.useParams();
  const { project, back } = Route.useSearch();
  return <RiskFormPage riskId={riskId} lockedProject={project} back={back} />;
}
