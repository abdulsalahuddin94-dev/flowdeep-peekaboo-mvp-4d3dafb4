import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  RiskRegisterTab, RiskHeatmapTab, IssuesLogTab, RiskKpiStrip,
} from "@/components/risk/RiskIssues";

export const Route = createFileRoute("/risks")({
  component: RisksPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Risk & Issues — Nexus PMO" },
      { name: "description", content: "Portfolio-wide risk register, probability × impact heat map and the live issues log." },
      { property: "og:title", content: "Risk & Issues — Nexus PMO" },
      { property: "og:description", content: "Track risks, mitigation plans and open issues across the whole portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TAB_LABEL: Record<string, string> = {
  register: "Risk Register",
  heatmap: "Heat Map",
  issues: "Issues Log",
};

function RisksPage() {
  const { tab = "register" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <div>
      <PageHeader title="Risk & Issues" current={TAB_LABEL[tab] ?? "Risk Register"} />

      <RiskKpiStrip />

      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v } })}>
        <TabsContent value="register" className="mt-0">
          <RiskRegisterTab />
        </TabsContent>
        <TabsContent value="heatmap" className="mt-0">
          <RiskHeatmapTab />
        </TabsContent>
        <TabsContent value="issues" className="mt-0">
          <IssuesLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
