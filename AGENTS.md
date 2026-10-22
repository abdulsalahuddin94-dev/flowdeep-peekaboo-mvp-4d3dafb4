# Project architecture rules

- Keep schedule health derived from item dates and progress, not manually stored, so WBS and Gantt always agree.
- Keep schedule column auto-fit measurements aligned with rendered cell content and adapt widths to the table viewport; this preserves readable compact layouts and existing detail navigation.
- Navigate linked-action counts through the project route's tab and actionRef search parameters, with a removable Action Tracker filter, so project and portfolio registers share the same destination.
- Meeting type options come from the Organization lookup store, persisted like other local master data; renames propagate to meeting records and unavailable types remain readable on existing meetings.
- Route project approvals (milestone gates and change requests) to the un-nested approval review page; keep calendar approvals in the drawer because they are organization-wide rather than project-plan reviews.

- Basic-info edits made during Change Plan are diffed against a snapshot taken on entry and sent with the change request under the "Info · " label prefix, so approvals cover the whole plan change.
- Reuse PlanChangesTable for baseline submission and approval review changes so both show the same Item/Field/Before/After presentation and date formatting; the Item type column belongs to the schedule section only, so item kind stays opt-in per section.
