# Project architecture rules

- Keep Cash Flow Forecast project-type selection chart-local and combine it with overview filters; an empty selection means All and must include every type.
- Derive cash-flow year bounds and monthly/yearly buckets from filtered event dates; carry cumulative net across years before selecting the displayed month's year.
- Keep Financials overview empty states inside each chart's data area using the shared EmptyRegion card variant; preserve chart headings, controls and overview filters in empty preview.

- Keep schedule health derived from item dates and progress, not manually stored, so WBS and Gantt always agree.
- Keep schedule column auto-fit measurements aligned with rendered cell content and adapt widths to the table viewport; this preserves readable compact layouts and existing detail navigation.
- Navigate linked-action counts through the project route's tab and actionRef search parameters, with a removable Action Tracker filter, so project and portfolio registers share the same destination.
- Meeting type options come from the Organization lookup store, persisted like other local master data; renames propagate to meeting records and unavailable types remain readable on existing meetings.
- Route project approvals (milestone gates and change requests) to the un-nested approval review page; keep calendar approvals in the drawer because they are organization-wide rather than project-plan reviews.

- Basic-info edits made during Change Plan are diffed against a snapshot taken on entry and sent with the change request under the "Info · " label prefix, so approvals cover the whole plan change.
- Reuse ProjectFormPage in an embedded mode for Change Plan basic info; persist valid edits into the existing draft and keep the form mounted across tabs so the standalone editor and plan editor share fields without duplicate save flows.
- Reuse PlanChangesTable for baseline submission and approval review changes so both show the same Item/Field/Before/After presentation and date formatting; the Item type column belongs to the schedule section only, so item kind stays opt-in per section.

- Keep employees and employment-type lookups in one persisted browser store with stable IDs, so list/detail navigation and lookup renames retain identity. Employee details are read-only; allocations retain their project, period and task for monthly salary attribution.

- Employee detail navigation and panels share one Tabs root so selection and accessibility stay synchronized; keep layout changes independent of employee financial calculations.
- Standalone record pages share RecordPageHeader for contextual list back links or project breadcrumbs and shared form CTA labels; use full-width unframed forms to avoid narrow popup-style layouts.
