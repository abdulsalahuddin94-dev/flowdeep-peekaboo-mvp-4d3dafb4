import type { CostEntry, Milestone, RevEntry } from "@/routes/portfolio.$projectId";

/** Demo schedule seed shared by the project page and the Change Request review page. */
export function seedMilestones(project: { pm: string; endDate: string }): Milestone[] {
  return [
    // ── Phase 1: Discovery — completed, all green, all assigned ──────────────
    { name: "Discovery & Requirements", kind: "Task", startDate: "2025-04-15", endDate: "2025-05-16", owner: "Sara Al-Rashid", rag: "amber", dep: "—", roles: [{ role: "Business Analyst", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DSC", amount: "$80K" }, progress: 20, parent: "Discovery Sign-off", weightScore: 8 },
    { name: "Stakeholder workshops", kind: "Task", startDate: "2025-04-15", endDate: "2025-04-25", owner: "Sara Al-Rashid", rag: "amber", dep: "—", roles: [{ role: "Business Analyst", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 40, parent: "Discovery & Requirements", assignee: "Sara Al-Rashid", weightScore: 5 },
    { name: "Requirements doc", kind: "Task", startDate: "2025-04-28", endDate: "2025-05-12", owner: "Sara Al-Rashid", rag: "amber", dep: "Stakeholder workshops", roles: [{ role: "Business Analyst", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Discovery & Requirements", assignee: "John Smith", weightScore: 5 },
    { name: "Discovery Sign-off", kind: "Milestone", startDate: "2025-05-16", endDate: "2025-05-16", owner: "Sara Al-Rashid", rag: "amber", dep: "Discovery & Requirements", dependencies: [{ predecessor: "Discovery & Requirements", relation: "FS", lag: 5 }], roles: [], payment: { kind: "Client Revenue", packageId: "FIN-R-ADV", amount: "$0.96M" }, extraPayments: [{ kind: "Package Cost", packageId: "FIN-C-LAB", amount: "$1.20M" }, { kind: "Client Revenue", packageId: "FIN-R-P1", amount: "$0.64M" }], progress: 20, assignee: "Sara Al-Rashid", milestoneType: "finish", requiresApproval: true, approvers: [{ id: "u-sara", name: "Sara Al-Rashid", role: "Director", department: "Engineering" }, { id: "u-john", name: "John Smith", role: "Project Manager", department: "IT" }] },

    // ── Phase 2: Design — at risk (amber), mixed assignee states ────────────
    { name: "Solution Design", kind: "Task", startDate: "2025-05-19", endDate: "2025-06-27", owner: "Mei Chen", rag: "amber", dep: "Discovery Sign-off", dependencies: [{ predecessor: "Discovery Sign-off", relation: "FS" }], roles: [{ role: "Solution Architect", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DSN", amount: "$150K" }, progress: 70, parent: "Design Approved", weightScore: 8 },
    { name: "Architecture blueprint", kind: "Task", startDate: "2025-05-19", endDate: "2025-06-06", owner: "Mei Chen", rag: "green", dep: "Discovery Sign-off", dependencies: [{ predecessor: "Discovery Sign-off", relation: "FS" }], roles: [{ role: "Solution Architect", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 100, parent: "Solution Design", assignee: "Mei Chen", weightScore: 4 },
    { name: "UX wireframes", kind: "Task", startDate: "2025-05-26", endDate: "2025-06-20", owner: "Mei Chen", rag: "amber", dep: "Architecture blueprint", roles: [{ role: "UX Designer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 60, parent: "Solution Design", assignee: "Waiting", weightScore: 4 },
    { name: "Security review", kind: "Task", startDate: "2025-06-09", endDate: "2025-06-27", owner: "Mei Chen", rag: "amber", dep: "Architecture blueprint", roles: [{ role: "Security Lead", skill: "Senior", fte: 0.5 }], payment: { kind: "None", amount: "" }, progress: 30, parent: "Solution Design", weightScore: 2 },
    { name: "Design Approved", kind: "Milestone", startDate: "2025-06-27", endDate: "2025-06-27", owner: "Mei Chen", rag: "amber", dep: "Solution Design", roles: [], payment: { kind: "Client Revenue", amount: "$180K" }, progress: 0, assignee: "Mei Chen", milestoneType: "finish" },

    // ── Phase 3: Build — in progress (blue), assignees fulfilled ────────────
    { name: "Build & Integration", kind: "Task", startDate: "2025-06-30", endDate: "2025-08-22", owner: "Priya Iyer", rag: "blue", dep: "Design Approved", roles: [{ role: "Integration Dev", skill: "Mid", fte: 2 }, { role: "Backend Dev", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-BLD", amount: "$320K" }, progress: 45, parent: "Build Complete", weightScore: 10 },
    { name: "Backend API", kind: "Task", startDate: "2025-06-30", endDate: "2025-07-25", owner: "Diego Ortiz", rag: "blue", dep: "Design Approved", roles: [{ role: "Backend Dev", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 65, parent: "Build & Integration", assignee: "Diego Ortiz", weightScore: 4 },
    { name: "Frontend UI", kind: "Task", startDate: "2025-07-07", endDate: "2025-08-08", owner: "Priya Iyer", rag: "blue", dep: "Backend API", roles: [{ role: "Frontend Dev", skill: "Mid", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 40, parent: "Build & Integration", assignee: "Priya Iyer", weightScore: 3 },
    { name: "Data migration scripts", kind: "Task", startDate: "2025-07-14", endDate: "2025-08-15", owner: "Diego Ortiz", rag: "amber", dep: "Backend API", roles: [{ role: "Data Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 25, parent: "Build & Integration", assignee: "Waiting", weightScore: 2 },
    { name: "Third-party integrations", kind: "Task", startDate: "2025-07-21", endDate: "2025-08-22", owner: "Priya Iyer", rag: "grey", dep: "Frontend UI", roles: [{ role: "Integration Dev", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Build & Integration", weightScore: 1 },
    { name: "Build Complete", kind: "Milestone", startDate: "2025-08-22", endDate: "2025-08-22", owner: "Priya Iyer", rag: "blue", dep: "Build & Integration", roles: [], payment: { kind: "Client Revenue", amount: "$250K" }, progress: 0, assignee: "Priya Iyer", milestoneType: "finish" },

    // ── Phase 4: Testing — blocked (red), waiting/unrequested mix ───────────
    { name: "Testing & QA", kind: "Task", startDate: "2025-08-25", endDate: "2025-09-19", owner: "Priya Iyer", rag: "red", dep: "Build Complete", roles: [{ role: "QA Engineer", skill: "Senior", fte: 2 }], payment: { kind: "Package Cost", packageId: "PKG-QA", amount: "$95K" }, progress: 10, parent: "UAT Sign-off", weightScore: 8 },
    { name: "SIT execution", kind: "Task", startDate: "2025-08-25", endDate: "2025-09-05", owner: "Priya Iyer", rag: "red", dep: "Build Complete", roles: [{ role: "QA Engineer", skill: "Senior", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 15, parent: "Testing & QA", assignee: "Waiting", weightScore: 4 },
    { name: "UAT execution", kind: "Task", startDate: "2025-09-08", endDate: "2025-09-19", owner: project.pm, rag: "red", dep: "SIT execution", roles: [{ role: "QA Lead", skill: "Lead", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Testing & QA", weightScore: 4 },
    { name: "Performance & load test", kind: "Task", startDate: "2025-09-01", endDate: "2025-09-12", owner: "Mei Chen", rag: "amber", dep: "Build Complete", roles: [{ role: "Performance Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 5, parent: "Testing & QA", assignee: "Waiting", weightScore: 2 },
    { name: "UAT Sign-off", kind: "Milestone", startDate: "2025-09-19", endDate: "2025-09-19", owner: project.pm, rag: "red", dep: "Testing & QA", roles: [], payment: { kind: "Client Revenue", amount: "$200K" }, progress: 0, milestoneType: "finish" },

    // ── Phase 5: Deploy — not started (grey), no skill requests yet ─────────
    { name: "Deployment & Hypercare", kind: "Task", startDate: "2026-09-22", endDate: "2026-10-17", owner: project.pm, rag: "amber", dep: "UAT Sign-off", roles: [{ role: "DevOps Engineer", skill: "Senior", fte: 1 }], payment: { kind: "Package Cost", packageId: "PKG-DPL", amount: "$60K" }, progress: 10, parent: "Go-Live", weightScore: 10 },
    { name: "Production cutover", kind: "Task", startDate: "2026-09-22", endDate: "2026-10-06", owner: project.pm, rag: "amber", dep: "UAT Sign-off", dependencies: [{ predecessor: "UAT Sign-off", relation: "FS" }, { predecessor: "Build Complete", relation: "FS", lag: 2 }, { predecessor: "Design Approved", relation: "FF" }, { predecessor: "Discovery Sign-off", relation: "SS", lag: 3 }, { predecessor: "Performance & load test", relation: "FS", lag: -1 }], roles: [{ role: "DevOps Engineer", skill: "Senior", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 25, parent: "Deployment & Hypercare", assignee: project.pm, weightScore: 5 },
    { name: "Hypercare support", kind: "Task", startDate: "2026-10-07", endDate: "2026-10-17", owner: project.pm, rag: "green", dep: "Production cutover", dependencies: [{ predecessor: "Production cutover", relation: "FS" }], roles: [{ role: "Support Lead", skill: "Mid", fte: 2 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 3 },
    { name: "Knowledge transfer", kind: "Task", startDate: "2026-10-06", endDate: "2026-10-17", owner: project.pm, rag: "green", dep: "Production cutover", dependencies: [{ predecessor: "Production cutover", relation: "SS" }], roles: [{ role: "Trainer", skill: "Mid", fte: 1 }], payment: { kind: "None", amount: "" }, progress: 0, parent: "Deployment & Hypercare", weightScore: 2 },
    { name: "Go-Live", kind: "Milestone", startDate: project.endDate, endDate: project.endDate, owner: project.pm, rag: "blue", dep: "Deployment & Hypercare", roles: [], payment: { kind: "Client Revenue", amount: "$500K" }, progress: 0, milestoneType: "finish" },
  ];
}

export function initialCostEntries(isNew: boolean): CostEntry[] {
  if (isNew) return [];
  return [
    { c: "Labour", cat: "Staff", b: 1.20, a: 0.84, color: "bg-rag-green", desc: "Core delivery team", ctype: "internal", classification: "opex", linkKind: "milestone", linkRef: "Build Complete", breakdown: [
      { name: "Backend engineers (3)", amount: 0.55, note: "6-month allocation" },
      { name: "Frontend engineers (2)", amount: 0.35 },
      { name: "QA (2)", amount: 0.30 },
    ] },
    { c: "Hardware", cat: "Contracts", b: 0.90, a: 0.62, color: "bg-rag-blue", desc: "On-prem servers + peripherals", ctype: "third-party", classification: "capex", linkKind: "fixed", linkRef: "2025-06-15" },
    { c: "Software licenses", cat: "Services", b: 0.40, a: 0.31, color: "bg-accent", desc: "Annual licenses", ctype: "third-party", classification: "opex", linkKind: "fixed", linkRef: "2025-05-01" },
    { c: "Business trips", cat: "Business Trips", b: 0.10, a: 0.07, color: "bg-rag-amber", desc: "Travel & accommodation", ctype: "internal", classification: "opex", linkKind: "milestone", linkRef: "Design Approved" },
    { c: "Contingency", cat: "Services", b: 0.60, a: 0.26, color: "bg-muted-foreground", desc: "Reserve", ctype: "internal", classification: "opex", linkKind: "fixed", linkRef: "" },
  ];
}

export function initialRevEntries(project: { endDate: string }, isNew: boolean): RevEntry[] {
  if (isNew) return [];
  return [
    { ms: "Discovery complete", evt: "Advance payment (30%)",  plan: 0.96, date: "02 May",        s: "green", sl: "Received", act: 0.96, linkKind: "fixed",
      actuals: [{ amount: 0.60, date: "02 May", note: "Invoice INV-0012" }, { amount: 0.36, date: "21 May", note: "Invoice INV-0018" }] },
    { ms: "Build phase 1",      evt: "Progress invoice (20%)", plan: 0.64, date: "30 Nov",        s: "amber", sl: "Pending",  act: 0.20, linkKind: "fixed",
      actuals: [{ amount: 0.20, date: "04 Jul", note: "Partial settlement" }] },
    { ms: "UAT Sign-off",       evt: "Progress invoice (25%)", plan: 0.80, date: project.endDate, s: "blue",  sl: "Planned",  act: null, linkKind: "milestone" },
    { ms: "Go-live",            evt: "Final payment (25%)",    plan: 0.80, date: "14 Dec",        s: "blue",  sl: "Planned",  act: null, linkKind: "fixed" },
  ];
}
