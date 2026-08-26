import { createFileRoute, Link } from "@tanstack/react-router";
import { ProjectFormPage } from "@/components/project/ProjectFormPage";
import { useProjects } from "@/lib/projects-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portfolio/$projectId_/edit")({
  component: EditProjectPage,
  head: () => ({
    meta: [
      { title: "Edit Project — Nexus PMO" },
      { name: "description", content: "Update project identity, classification, timeline and budget details." },
      { property: "og:title", content: "Edit Project — Nexus PMO" },
      { property: "og:description", content: "Update project identity, classification, timeline and budget details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function EditProjectPage() {
  const { projectId } = Route.useParams();
  const { projects } = useProjects();
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
        <p className="text-sm text-muted-foreground">This project could not be found.</p>
        <Button asChild variant="primary"><Link to="/portfolio">Back to Portfolio</Link></Button>
      </div>
    );
  }

  return <ProjectFormPage project={project} />;
}
