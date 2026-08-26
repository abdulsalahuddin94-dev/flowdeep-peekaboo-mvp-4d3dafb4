import { createFileRoute } from "@tanstack/react-router";
import { ProjectFormPage } from "@/components/project/ProjectFormPage";

export const Route = createFileRoute("/portfolio/new")({
  component: NewProjectPage,
  head: () => ({
    meta: [
      { title: "New Project — Nexus PMO" },
      { name: "description", content: "Create a new capital or commercial project in the enterprise portfolio." },
      { property: "og:title", content: "New Project — Nexus PMO" },
      { property: "og:description", content: "Set up project identity, classification, timeline and budget in one guided page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function NewProjectPage() {
  return <ProjectFormPage />;
}
