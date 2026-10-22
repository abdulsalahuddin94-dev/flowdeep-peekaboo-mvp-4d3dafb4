# Roadmap
- [x] Hide the change-count badge from the Change Plan banner.
- [x] Rule the changes table rows (header + between rows) in the Save baseline popup and approval review, and narrow that popup.
- [x] Bound action comments scrolling; apply natural-case/Poppins design rules and left-positioned search.
- [x] Risk Register: drop the Score column and show the score inside the severity tooltip.
- [x] Cap action comments to two visible cards before the list scrolls.
- [x] Attendee name field: plain text input for both Internal and External parties in the meetings composer.


- [x] Compact Project Schedule: stacked Duration dates, plain dependency/financial counts, and verify detail navigation at smaller laptop widths.

- [x] Add PMO-level Action Tracker module (all projects) in the sidebar before Approvals.
- [x] Add PMO-level Meetings module (all projects) in the sidebar before Approvals.
- [x] Log both modules in SESSIONS.md and verify with the browser.

- [x] Meeting side drawer reuses LinkedActions with hover Edit/Delete, update status, and delete confirmation.

- [x] Remove the Issue View CTA and open Issue details from the full row.
- [x] Move Status to the final column in Risk and Issue tables and swap it with actions on row hover.
- [x] Reorganize the Log/Edit Issue popup alignment and rename Target date for closure to Target closure date.
- [x] Update SESSIONS.md and verify the build and interactions.
- [x] Standardize every user-visible date: `DD MMM, YYYY` with year and `DD MMM` without year.
- [x] Document the date-display rule in the Design System and session log.
- [x] Verify date rendering across representative modules and both EN/AR layouts.
- [x] Show expected revenue beside the revenue plan total with a variance note.
- [x] Cap revenue Collected at 100% (block payments above planned, block lowering planned below received).
- [x] Show number labels in the risk status-update Probability/Impact dropdowns.
- [x] Show multiple predecessors clearly inside Progress Update task details, with a five-dependency demo.
- [x] Make Schedule Health distinguish On Track, Off Track, and Overdue across WBS and Gantt.
- [x] Update schedule demo data so all three health states are visible and verify the interactions.
- [x] Match the Progress Update dialog to the approved task-focused layout and remove the Close footer action.
- [x] Limit Progress Update to lowest-level tasks and remove the in-dialog task picker.
- [x] Move the Schedule health toggle beside the Project Schedule heading.
- [x] Keep the Status column unchanged when Schedule health highlighting is enabled.
- [x] Align the Approvals module with DS02 toolbar, table, pills, pagination, details drawer, and form dialog patterns.
- [x] Replace the Risk & Issues KPI for Open Risks with the Low Risks severity count.
- [x] Give the WBS burger menu its own narrow hover-only actions column and make the Financial Link chip clickable.
- [x] Show Planned % next to Actual % on Portfolio project cards with a planned marker on the progress bar.
- [x] Add a project Action Tracker tab (Risk / Issue / Meeting / General actions, owner, responsibility, due date, derived Overdue, filters, My actions, comments & updates).
- [x] Show linked actions in Risk and Issue drawers and rename their history to Comments & Updates.
- [x] Simplify project Issue/Risk summary labels, move Risks Summary left, and open selected risks from Overview.
- [x] Add search and filters to Cost Recognition and Revenue Recognition tables.
- [x] Dim plan-changing WBS row actions in view-only mode with the plain arrow cursor, show the hint tooltip only after a steady ~1s hover, and keep them inert while Progress Update remains available.
- [x] Central Responsibility Types lookup in Organization (English-only names, Internal/External, deactivate, delete guard) consumed by Action Tracker, Risk/Issue plans, and Meetings.
- [x] Remove the Color field and Color column from Responsibility Types entirely.
- [ ] Verify the Responsibility dropdowns list lookup values in Action Tracker / Mitigation plan / Meetings, then log in SESSIONS.md.
- [x] Replace action-row entry with the Official Holidays-style composer: add via +, then edit/delete from the scrollable list below.
- [x] Move the Action Tracker KPI cards below the search and filter toolbar (matching Cost Breakdown).
- [x] Confirm the baseline scope: Schedule/Cost/Revenue follow the Change Plan flow; Risk & Issues, Action Tracker, Meetings, Recent Activity, and Status Reports stay editable without a Change Plan.
- [x] (2026-10-06) Risk Register & Issues Log: move KPI cards below search/filter; cards react to filters. Also: action-composer commit button becomes a check icon while editing a row. (done)

- [x] Match Risk/Issue Add action popups to the compact inline Action plan reference and verify linked action creation.
- [x] Risk Register table: drop Probability/Impact columns, show them as a hover tooltip on Score/Severity badges.
- [x] Rename Mitigation plan column to Mitigation action; count shows the total only, hover shows X of Y.
- [x] Issues Log: remove the Impact column from the table (module and project views); impact stays in the issue details panel.
- [x] Approval review page: remove the change search field from all three plan tabs, keeping paging.
- [x] Approvals module: remove the reminder action from table rows, the details drawer, and the review page header.
- [x] Approval review header: remove the type/status tag badges and present Approvers inside the header alongside the other meta data.
- [x] Approvals: hide Approvers (table column, review header, drawer) temporarily and switch to a single-approver flow — one decision by any signed-in user resolves the request immediately.

- [x] Match Save new baseline popup changes to the Approvals table using a shared three-tab changes display.

- [x] Approval review: project basic info rendered as the project-page header layout (ProjectOverviewHeader).
- [x] Financials Overview: Actuals by Project Type badge shows the profit/loss amount instead of a percentage.

- [x] Add the item type column to the Project Schedule changes table only (baseline popup and approval review).
