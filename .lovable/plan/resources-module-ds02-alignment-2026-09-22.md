# Resources module — DS02 alignment

## Goal
Bring every Resources subpage into the same Nexus DS02 structure used across Organization, Financials, and Risk & Issues, while preserving all existing resource workflows and data.

## What will change
- Keep Poppins, the existing dark theme, semantic tokens, and neutral-lavender emphasis selected in the design direction.
- Standardize the page hierarchy: Resources title with contextual action, KPI strip, 36px Search + Filter toolbar, then the primary operational surface.
- Correct the subpage rendering so each sidebar URL displays its intended content: Requests, People, Utilization Heatmap, Manpower Planning, and Skill Demand.
- Convert People, Requests, Manpower Planning, and Skill Demand to the shared DS02 table treatment:
  - semantic row colors and `#46464F` hover token
  - compact headers and consistent cell spacing
  - final Status column where relevant, replaced by row actions on hover
  - shared pagination and empty-result behavior
- Add tab-appropriate search and side-drawer filters using the shared toolbar; preserve assignment, fulfillment, decline, import, and add-resource actions.
- Restyle the heatmap as an unframed DS02 data surface with the existing utilization logic and legend.
- Keep all dialogs and controls on the existing shared DS02 components; only adjust layout and presentation where inconsistent.
- Preserve current business logic and mock data. No backend or schema changes.

## Technical details
- Main implementation: `src/routes/resources.tsx`.
- Reuse `PageHeader`, `PageToolbar`, `StyledTable`, `TableRowActions`, `TablePagination`, `KpiCard`, `Badge/Pill`, and existing form controls.
- Use existing semantic classes and tokens only; no new hardcoded component colors.
- Update `SESSIONS.md`, then verify every Resources URL and key dialog at desktop and mobile widths, plus the latest build status.
