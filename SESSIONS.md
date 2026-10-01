## 2026-10-01 — Action status comment visibility hint
- Added a small hint below the Update action status comment field clarifying that comments are saved with the action and remain available in the Action Tracker; added EN and AR copy.

## 2026-10-01 — Risk/Issue linked actions: direct status popup and hover controls
- Clicking a linked action inside a Risk or Issue drawer now opens the Update action status popup directly instead of stacking a second action drawer.
- The resting status pill swaps on row hover/focus to compact Edit and Delete icons; Edit opens the prefilled action form and Delete uses a confirmation popup.
- Files: src/components/actions/ActionTracker.tsx; DS02/DESIGN.md v3.14.

## 2026-10-01 — Action Tracker: status updates from Risk/Issue drawers (superseded interaction)
- Initially opened the full action drawer from linked actions; replaced the same day by the direct status-popup interaction documented above.

## 2026-09-30 — Risk/Issue forms: action-by-row plans
- Mitigation plan (risk) and Action plan (issue) free text replaced by the shared `ActionRowsEditor` (Action · Owner · Responsibility · Due date · remove, Add row) used by Log meeting actions.
- Rows create linked Action Tracker actions on save; drawers show the linked actions under Mitigation plan / Action plan; Risk Register column shows the action count.

## 2026-09-30 — Restore project Budget summary card
- Restored the Budget card in the project overview summary grid between Timeline and Stage Gate, showing actual spend / total budget and the capped utilization percentage.

## 2026-09-30 — Financial Link: multi-link cell layout
- The Financial Link column now handles multiple links per WBS item: the first link renders as its colored chip (Revenue green / cost amber) plus a compact "+N" chip counting the remaining links; both chips open the same view dialog. Cell stays single-line.
- Schedule CSV export now lists every linked item (`Revenue $0.96M; Labour — core delivery team $1.20M; …`) instead of only the primary link.
- Demo: Discovery Sign-off (ERP System Upgrade) carries 3 catalog links (FIN-R-ADV, FIN-C-LAB, FIN-R-P1) to exercise the layout.

## 2026-09-30 — Linked actions: icon-only add control
- Replaced the “Add action” text button in Risk and Issue drawers with a compact outlined + icon button; its accessible label and hover title remain “Add action”.

## 2026-09-30 — Issue drawer: section rename
- Issue drawer's actions section renamed from "Action plan actions" to **Actions** — it followed the "Action plan" strategy text and read as a stutter.

## 2026-09-30 — Action Tracker: remove ID column
- Removed the ID column from the Action Tracker table (header, cells, EmptyRow colSpan 7→6). IDs remain internal; the drawer still shows record context.

## 2026-09-30 — Action Tracker
- New project tab **Action Tracker** (after Status Reports): KPIs Open / Overdue / Due this week / Done / My actions; search + filter drawer (Status incl. derived Overdue, Responsibility Internal/Client/Vendor, Source, Owner); My actions toggle; table with Status as last column swapping to hover actions; row → drawer with Comments & Updates (edit/delete); Add Action and Log meeting actions (batch) dialogs.
- Shared store `src/lib/action-store.tsx`; Overdue derived from due date + status, never stored. ERP demo: 10 actions across risks, issues, meetings.
- Risk drawer: **Mitigation actions** section; Issue drawer: **Action plan actions** section — both add actions linked to the record.
- Renamed "Status updates" / "Comments" in the drawers to **Comments & Updates**.

## 2026-09-30 — Financial Link: view-only dialog when locked; chips grouped under Cost / Revenue headings

## 2026-09-29 — WBS burger column + chip click; Portfolio card planned %

- **Financial Link column (`src/components/ProjectSchedule.tsx`):** the hover burger menu now lives in its own dedicated 52px actions column (appears only on row hover) instead of an absolute overlay that covered the last data column. The Financial Link chip is now itself clickable — it opens the same Financial Link dialog (disabled/toast in view-only or approval-gate rows, unchanged behavior). Table width math updated (`nameW + colsW + ROW_ACTIONS_W`).
- **Portfolio card (`src/routes/portfolio.index.tsx`):** the Progress row now shows **Actual % / Planned %** (e.g. "61% / 100%"), with a thin planned marker on the progress bar matching the approved reference. Planned is time-derived via `computePlannedProgress`, which now tolerates display-label dates (`parseLabelDate` fallback) — not manually stored.
- **Verify:** `tsgo --noEmit` clean, build OK; Playwright confirmed burger opacity 0→1 on hover in its own column, chip click opens "Financial Link — Discovery & Requirements", card shows 61% / 100%.

## 2026-09-28 — Cost tab: toolbar above KPI cards, cards reflect filters

- **What:** On the project Cost Breakdown tab, the Search + Filter toolbar now sits **above** the Total Budget / Planned Cost / Actual Spent / Utilization cards, and the cards compute from the filtered rows (search by cost line name, category multi-select, CapEx/OpEx) instead of the full cost list. Total Budget stays project-level.
- **Why:** Filtering should be reflected in the KPI summary immediately, matching the visual order (filters first, then cards, then table).
- **Where:** `src/routes/portfolio.$projectId.tsx` — moved cost filter state/`filteredCost` above `costTotals`, which now reduces `costRows`; reordered the tab render (toolbar → cards → table). Table footer totals follow the filtered set too.
- **Verify:** `tsgo --noEmit` clean, build OK; Playwright on `/portfolio/p-001` Cost tab confirmed filtering to Staff shows Planned $1.20M / Actual $0.84M / Utilization 70% in the cards.

## 2026-09-28 — Portfolio: KPI strip reworked

- Removed the Active and Budget Used cards from the Portfolio KPI strip.
- Cards are now, left to right: Not Started, On Track, At Risk, Off Track, Closed.
- Closed counts projects whose progress reached 100% or whose stage is Closure; the Pending Approvals card was retired (the pending-approvals banner and Approvals module still cover it).

## 2026-09-28 — Risk & Issues KPI: Low Risks

- Replaced the Open Risks KPI with Low Risks in the Risk & Issues summary strip.
- The value now counts risks whose score falls below the configured Medium threshold, so all four severity bands are represented.

## 2026-09-28 — Rules & Thresholds: confirmation popup on Restore defaults

- Clicking Restore defaults now opens a warning confirmation popup ("Restore default rules?") explaining that restoring will override the current rule and threshold values, with Cancel to keep the current settings.
- Confirm restores the recommended defaults and marks the form dirty (Save changes still applies them); Cancel leaves all current values untouched.
- Verified in the browser: changed At Risk to 33, popup shows, cancel keeps 33, confirm restores 5.

## 2026-09-28 — Risk & Issues: edit and delete comments in the detail drawers

- Every comment card in the risk drawer (Status updates) and issue drawer (Comments) now has circular Edit and Delete icon buttons next to the date.
- Edit opens the same status-update popup pre-filled with the comment; saving updates the comment in place (and logs a new documented entry only if severity/status values were also changed).
- Delete opens a danger confirmation popup ("Delete this comment?") before removing the entry from the history.
- Store: added editRiskUpdate / removeRiskUpdate / editIssueUpdate / removeIssueUpdate to risk-store.

## 2026-09-28 — Revenue Breakdown: derived Overdue status + status column moved last

- Revenue event status is now derived from collection and expected date (never stored): fully collected → Received, expected date passed while short → Overdue (red), partially collected → Pending, otherwise Planned. Status filter uses the derived value.
- Status moved to the final column and now shares the cell with the row actions: pill at rest, Edit/Add payment/Delete on hover (DS02 pattern used in Risk & Issues and Organization).
- Demo data in ERP System Upgrade shows all four statuses (Received, Pending, Overdue, Planned).

## 2026-09-27 — Approvals module aligned with DS02

- Replaced the stacked approval cards and ad-hoc header controls with the shared DS02 search/filter toolbar, standardized table, fully rounded status/type pills, hover actions, empty-row treatment, and pagination.
- Added a row-opened approval details drawer containing request metadata, change summary, approver decisions/comments, reminders, and the existing Approve/Reject actions.
- Moved inbox view, project, status, and request type into the standard filter drawer; preserved URL project filtering, role-based decision rules, rejection-comment validation, notifications, and project links.
- Replaced the legacy decision dialog with the standard DS02 form-dialog pattern.

## 2026-09-27 — Schedule health demo covers all three states

- ERP System Upgrade WBS demo now shows every Schedule health state when the toggle is on: Off-Track/red (overdue 2025 tasks), At Risk/amber (Production cutover raised to 25% actual vs 40% planned; Deployment & Hypercare 13% vs 23%), On Track/green (future Go-Live, Hypercare support, Knowledge transfer).

## 2026-09-27 — Schedule health follows Rules & Thresholds

- Schedule health now uses the Organization Rules & Thresholds progress bands instead of a hardcoded 7-point gap: On Track below the Amber threshold, At Risk at/above Amber, Off-Track at/above Red (overdue incomplete work is always Red/Off-Track).
- Statuses renamed to On Track / At Risk / Off-Track; the Gantt legend shows the live threshold values from Rules & Thresholds and updates when they change.
- The Status column continues to show the original workflow status, unaffected by the toggle.

## 2026-09-27 — Schedule health preserves task status

- Schedule health no longer replaces task workflow statuses in the Status column.
- The toggle now affects health highlighting only: WBS row colors and Gantt colors continue to show On Track, Off Track, and Overdue.

## 2026-09-27 — Schedule health toggle placement

- Moved the Schedule health toggle from the right-side action group to sit directly beside the Project Schedule heading.
- Preserved the existing health highlighting behavior and added the reference-style vertical divider.

## 2026-09-27 — Progress Update limited to leaf tasks

- Progress Update now appears only in the action menu for lowest-level tasks with no children.
- Parent tasks and milestones no longer offer Progress Update, because their progress rolls up from child tasks.
- Removed the open-task selector from the popup; each popup is tied directly to the selected leaf task.

## 2026-09-27 — Progress Update task-focused layout

- Matched the Progress Update popup to the approved reference: task name in the title, roll-up summary, task progress card, and expandable Start, End, Weight score, Parent, and dependency details.
- Removed the separate approval sidebar and the footer Close button; the standard top-right dismiss control remains available.
- Kept Save update and approval-request behavior intact.

## 2026-09-27 — Schedule dependencies and health demo

- Progress Update task details now show every predecessor in a bounded scrollable list, including relationship and lead/lag, with a visible dependency count.
- Production cutover now demonstrates five dependencies in the project schedule demo.
- Schedule Health now derives and displays On Track (green), Off Track (amber), and Overdue (red) across WBS rows, status pills, Gantt bars, and the chart legend.
- Updated the deployment-phase demo dates and progress so all three schedule-health states can be reviewed together.
- Verified in the live preview: all three health states appear together, and Production cutover shows five predecessors with relationship/lag chips in its scrollable Task details list. Typecheck and preview build pass; the repository has no automated test files.

## 2026-09-24 — Expected revenue vs revenue plan, Collected capped at 100%

- `Project` gains `expectedRevenue`; the project form now persists and prefills the Expected revenue field, and demo client projects carry it.
- Revenue Breakdown KPI strip shows **Expected revenue** (entered at setup) beside **Planned in revenue plan**, with an amber variance note when the two differ. Nothing is blocked by a mismatch.
- Collected is capped at 100%: a payment that would push an event above its Planned amount is rejected, Planned can't be lowered below what is already received, and line/total Collected clamp to 100%.
- Risk status-update dialog Probability/Impact dropdowns now show `n · label` from the Organization rules, matching Log a new risk.

## 2026-09-23 — Probability/Impact show labels in tables

- Risk Register and Issues Log tables now display the organization-defined label (e.g. "Likely", "Major") instead of the raw 1–5 number in the Probability and Impact columns, sourced from the same Organization rules used in the create/edit forms.

## 2026-09-23 — Issue impact labels and Critical severity

- Issue Impact options now show the organization-defined description beside each 1–5 value, matching the Log Risk form.
- Added Critical to issue Severity in the create/edit form and Issues Log filter, with the standard critical pill treatment.
- Issues created from risks now map risk score bands to Critical, High, Medium, or Low consistently.

## 2026-09-23 — Utilization capped at 100%

- Actual amounts on a cost line can no longer push utilization past 100%: adding or editing an actual is blocked when the running total would exceed the line's Planned amount, with a message telling the user the maximum allowed and to increase Planned first.
- Editing a cost line now rejects a Planned amount lower than the actuals already logged against it.
- Cost utilization (line and KPI strip) is clamped to 100%.

## 2026-09-22 — Pill badges + Requests table cleanup

- Removed the Outcome column from the Resources Requests table; the decision details stay in the request detail drawer.
- Status indicators in Requests now use the shared rounded status pill treatment used by the Organization module.
- DS02 rule: every badge/tag/chip/status indicator is a fully rounded pill (rounded-full, h-7, px-3, text-xs font-medium). Encoded in the shared Badge component and documented in DESIGN.md.

## 2026-09-22 — Resource request outcome visibility

- Added an Outcome column to the Resources Requests table showing the assigned person with allocation and resulting utilization, or the decline reason.
- Added a request detail drawer (row click) with the full request data plus the recorded decision: decline reason, assigned person, allocation on the project, and utilization before/after with over-allocation warning.
- Fulfilling a request now persists allocation, utilization before/after, and the decision date, and updates the assignee utilization in the resource pool.

## 2026-09-22 — Date display standardization

- Established `DD MMM, YYYY` for visible dates with a year and `DD MMM` for visible dates without a year, using zero-padded days and English abbreviated months.
- Added centralized timezone-safe display helpers in `src/lib/date-format.ts` and applied them across shared date controls, schedules, portfolio, project detail, approvals, Risks & Issues, Resources, Organization, Financials, and dashboard surfaces.
- Preserved ISO values for storage, calculations, imports/exports, filtering, URLs, and native date inputs; relative and period-only labels remain unchanged.
- Documented the rule in root `DESIGN.md` and `DS02/DESIGN.md` v3.7.

## 2026-09-22 — Design System: Modal vs Drawer decision rule documented

- Added the official overlay-container decision rule to the root `DESIGN.md` (new "Overlays — Modal vs Drawer Decision Rule" section under Shared Rules) and bumped `DS02/DESIGN.md` to v3.6.
- Rule: choose container by task type, not habit — Modal for short decisive tasks that must block context; Drawer for rich read/edit detail that keeps the source list visible.
- Establishes system consistency as consistency of task type, not container shape (Calendar Add Event modal vs Risk view drawer are not inconsistent).
- Documentation-only change; no code or behavior modified.

## 2026-09-22 — Resources module DS02 alignment

- Rebuilt all Resources subpages around the shared DS02 hierarchy: page title/actions, KPI strip, toolbar, data table, and pagination.
- Converted Requests, People, Manpower Planning, and Skill Demand to token-driven tables with shared row hover and status/action behavior.
- Added tab-specific search and side-drawer filters; retained fulfillment, decline, assignment, import, and add-resource workflows.
- Restyled the Utilization Heatmap as a consistent DS02 data surface and corrected tab-to-content rendering.

## 2026-09-22 — Project Overview risks summary

- Added a scrollable Risks Summary card to the project Overview, populated from the shared risk register and filtered to the current project.
- Risks are ordered by score and show title, category, status, probability, impact, and a severity-colored score indicator.

## 2026-09-22 — Risk statuses trimmed, multi-issue links

- Removed the `Realized` and `Closed` risk statuses; risks now hold Open / In Progress / Mitigated only (`src/lib/mock-data.ts`, seeds and seed update history adjusted).
- Convert to Issue no longer forces a terminal status (moves Open → In Progress) and is no longer disabled, so a risk can carry multiple linked issues (`src/lib/risk-store.tsx`, `RiskIssues.tsx`).
- Risk drawer shows "Linked issues" as a count hyperlink; clicking it opens the Issues Log filtered to that risk (new `onViewLinkedIssues` on `RiskRegisterTab`, controlled `riskFilter` on `IssuesLogTab`, wired in `src/routes/risks.tsx` and `src/routes/portfolio.$projectId.tsx`).
- Added demo issue I-055 linked to R-091 so a risk with two issues is visible.

## Session — 2026-09-22 (Risk score loading state)

- Added an accessible loading state to the Log/Edit Risk Score field while its severity badge result is pending.
- The field now shows a compact spinner with “Calculating…”, hides stale score/badge values, and recalculates whenever Probability or Impact changes.
- Risk submission stays disabled until the latest score response is ready; the current local calculation remains a temporary API-response stand-in.

## Session — 2026-09-21 (Schedule burger centering + row hover color)

- Project Schedule: centered the burger (⋮) row menu horizontally within the last visible column (overlay `justify-center` instead of `justify-end`).
- Added the DS02 row-hover background (`hover:bg-table-row-hover`, #45464F) to WBS rows, matching Organization/Risk/Issues table behavior; overlay bg aligned to the hover token.
- Verified via Playwright on /portfolio/p-001 → Project Schedule → Change Plan (`e`): burger centered in the 160px Financial Link column; row hover bg = rgb(69,70,79); build OK.

## Session — 2026-09-21 (Schedule row actions dynamic hover overlay)

- Project Schedule: removed the dedicated always-visible actions column; the burger (⋮) row menu now overlays whichever visible column is last on row hover/focus, matching the Organization/Risk/Issues table behavior.
- The overlay width follows the current last visible column, so it uses Financial Link today and automatically adapts to future column-visibility changes. Restricted/gate rows keep the menu.
- Removed `ACTIONS_W` constant and header spacer cell; `tableW` no longer adds the actions width.
- Verified via Playwright on /portfolio/p-001 → Project Schedule → Change Plan (`e`): overlay opacity 0 at rest → 1 on hover; build OK.

## Session — 2026-09-21 (Risk table scale labels)

- Renamed the abbreviated Risk Register headers “P” and “I” to “Probability” and “Impact” in both the project view and standalone Risk & Issues module.

## Session — 2026-09-21 (Risk & Issues demo examples)

- Added richer ERP System Upgrade demo data: multiple risk statuses (Open, In Progress, Mitigated, Realized, Closed), milestone-linked risks, linked issues, independent issues, resolved issue examples, and seeded comment/status history for the Risk & Issues drawers.

## Risk statuses: Realized + Closed

- `RiskStatus` gains **Realized** and **Closed** (src/lib/mock-data.ts).
- Convert to Issue now sets the risk to **Realized** (was "In Progress") and records it in the update history (src/lib/risk-store.tsx).
- Manual status dropdowns offer Open / In Progress / Mitigated / Closed; Realized is automatic only (kept visible if already set).
- Status filter covers all five statuses; risk drawer shows the **Linked issue** with its status, and Convert to Issue is disabled once converted.

## Session — 2026-09-21 (Issue logging status field)

- Added Status back to the Log/Edit Issue popup, matching the Risk logging flow; new issues default to Open and resolved issues stamp a closure date automatically.

## Session — 2026-09-21 (Project Risk & Issues drawer context)

- Hid the project name inside Risk and Issue detail drawers when opened from a project detail page, while keeping it visible in the standalone Risk & Issues module.

## Session — 2026-09-21 (Risk scale labels: reference layout)

- Matched the risk drawer summary to the supplied reference: Probability and Impact display their number and description inline (for example, “3 · Possible” and “4 · Major”), while Score remains numeric.

## Session — 2026-09-21 (Risk details: probability/impact labels)

- The risk details drawer now shows the wording for each scale value under the number: Probability 4 → "Likely", Impact 5 → "Severe" (labels come from Organization rules; Score has no label).

## Session — 2026-09-21 (Revenue Breakdown actual-date range filter)

- PageToolbar gained a "daterange" filter group mode: the drawer panel shows Start Date / End Date pickers (min/max cross-constrained) with Cancel / Apply, an applied chip showing the range, and clear/remove support.
- Revenue Breakdown's date filter now uses it as "Actual date" and matches rows by their actual payment dates (including legacy "May 02" display strings, parsed with the current year); rows without actual payments are excluded while a range is active.

## Session — 2026-09-21 (Revenue Breakdown search and filters)

- Added the DS02 PageToolbar to the Revenue Breakdown tab: search by event name plus a filter drawer with Status (Planned / Pending / Received / Overdue) and Expected date (Overdue / This month / Next 30 days) groups; Add revenue line sits as the trailing CTA.
- Filtering preserves original entry indices (revIdxMap) so row and actual-payment actions still patch the correct record while filtered.

## Session — 2026-09-21 (Issue severity terminology and form layout)

- Renamed Issue Criticality to Severity across the filter, table, and log/edit popup.
- Matched the Issue popup reference layout: full-width Issue title, paired Impact and Severity, paired Open date and Target closure date, then full-width originating risk, milestone, and action plan fields.

## Session — 2026-09-21 (Hide Heat Map from project Risk & Issues)

- Removed the "Heat Map" sub-tab from the project detail Risk & Issues tab; the project tab now shows only Risk Register and Issues Log (2-column segmented control).
- Heat Map remains available in the standalone Risk & Issues module.
- Removed now-unused RiskHeatmapTab import and LayoutGrid icon import from portfolio.$projectId.tsx.
## Session — 2026-09-21 (Risk & Issues row interactions and issue form alignment)

- Removed the Issue View action and made the full Issue row open its details drawer, matching Risk rows.
- Moved Status to the final column in both tables and made row actions replace the status badge on hover or keyboard focus.
- Renamed “Target date for closure” to “Target closure date” and aligned the three Issue date/impact fields consistently.

## Session — 2026-09-21 (Issues log — RSD alignment)

- Issue model now carries Impact (1–5), Open date, Target date for closure and Closure date (stamped automatically on Resolved); status gained "In Progress" and Priority is labelled Criticality.
- Log/Edit issue popups use date pickers, drop the manual Status field (new issues default to Open) and enforce unique issue titles with a toast on duplicates.
- Issues list shows Title, Risk, Criticality, Impact, Open/Target/Closure dates, Status and Actions taken with View / Update status / Edit / Delete row actions.
- Update issue status popup is Status + required Comment (500 chars) and keeps a dated comment history.
- New View Issue drawer shows all issue fields, action plan and comments by date with Resolve / Escalate actions.

## Session — 2026-09-21 (Dependency editing and computed-date guidance)

- Added an Edit icon to each row in View Dependencies and a prefilled dependency edit flow for predecessor, relation type, and lead/lag.
- Locked dependency-computed dates in milestone/task edit popups and added the hint “Computed from dependency. Remove it to edit directly”.

## Session — 2026-09-21 (Dependency deletion confirmation + re-wired View Dependencies)

- Removed the instant-delete behavior in the schedule "View Dependencies" dialog; the red trash icon now opens a DS02 ConfirmDialog ("Remove dependency?", Cancel · Remove) before removing a dependency.
- Re-wired the dependency cell so clicking a predecessor opens the View Dependencies dialog (the click handler was lost during the burger-menu refactor). Empty cells still show "—".
- Verified end-to-end in the preview: View Dependencies → trash → "Remove dependency?" confirm → Remove removes the dependency.

## Session — 2026-09-21 (Schedule popup editing and row actions)

- Removed inline milestone/task editing and the right-click schedule menu.
- Added a square burger action menu at the end of every schedule row with Add subtask, Edit, Add dependency, Add financial link, Progress update, and Delete.
- Moved parent changes into the shared Edit milestone/task popup for both item types and removed the separate Change parent flow.

## Session — 2026-09-17 (Project Risk segmented control)

- Changed the project Risk & Issues sub-tabs into a single segmented control with one shared container and active segment styling.

## Session — 2026-09-17 (Risk & Issues ID cleanup)

- Removed visible Risk/Issue ID columns and ID-prefixed labels from the Risk & Issues module and the project Risk & Issues tab.
- Updated search placeholders, originating-risk labels, status dialogs, heat-map details, and conversion messages so users see names instead of record IDs.

## Session — 2026-09-17 (Expandable cost actuals)

- Restyled Cost Breakdown expansion to open from the full cost row and reveal actual spend in a compact nested table matching the supplied reference.
- Kept milestone navigation on the linked-milestone badge and retained actual-spend edit and delete actions inside the expanded table.

## Session — 2026-09-17 (Edit actual spend fix)

- Fixed Edit actual spend for legacy records by normalizing display dates for the calendar picker, restoring names from existing notes, and preventing invalid dates from crashing the dialog.

## Session — 2026-09-17 (Actual spend date picker)

- Replaced the free-text Date field in Add actual spend and Edit actual with the shared interactive calendar picker.

## Session — 2026-09-17 (Cost line naming and order)

- Renamed the Cost Breakdown Description field to Name and moved it before Category in the table, add flow, and edit flow.

## Session — 2026-09-17 (Rules & Thresholds simplification)

- Simplified Project Health rules to only At Risk and Off-Track fields.
- Removed the Schedule Rules card, kept only Reporting currency under Financial Rules, and removed the Probability scale editor from Risk & Issues.

## Session — 2026-09-16 (Universal search input style)

- Standardized search fields across pages, filter drawers, popups, and global search to use `#292931` fill, `#46464F` stroke, and `#767680` placeholder text.
- Added dedicated shared search-field tokens so new search inputs inherit the same DS02 treatment automatically.

## Session — 2026-09-15 (Dependency predecessor filtering)

- Added Task and Milestone radio choices to Manage Dependencies, defaulting to Task.
- Filtered the predecessor dropdown by the selected type and clear stale selections when switching.

## Session — 2026-09-15 (Popup close icon distinction)

- Standardized every centered popup to use a large bare X close control with no circular fill or border.
- Kept the compact circular X exclusively for filters and side drawers, and documented the distinction in DS02.

## Session — 2026-09-15 (Project Schedule popup alignment)

- Replaced the legacy Change Parent alert with the shared DS02 form popup and the schedule Delete alert with the shared danger confirmation popup.
- Standardized shared dialog close controls, footer alignment, and dark secondary Cancel actions across Project Schedule popups.
- Documented the required popup primitives for future Project Schedule work.

## Session — 2026-09-15 (Outline and Secondary CTA tokens)

- Corrected DS02 Outline to use `#DEC9FF` text/stroke on `#1D1D1F`, and Secondary to use `#E0E0E0` text with `#A0A0A0` stroke on `#1D1D1F`.
- Applied Outline to Convert to Issue and Secondary to Edit, attachments, and popup Cancel actions.

## Session — 2026-09-15 (Universal side-drawer and CTA alignment)

- Applied the DS02 `#121319` drawer surface, left border, and left radius to Risk details and every other desktop side drawer.
- Replaced the remaining white-filled Risk drawer and attachment actions with the dark outlined treatment.
- Retired white-filled CTAs from the design system; all secondary popup and drawer actions now use the dark outline style.

## Session — 2026-09-15 (Risk & Issues popup alignment)

- Standardized Risk & Issues forms, status updates, heat-map details, and attachment controls against the shared DS02 popup system used by Organization.
- Reflowed dense risk scoring fields into compact responsive layouts and added accessible popup and side-panel descriptions.
- Corrected the shared form-popup Cancel action to use the system's dark outlined secondary treatment instead of the white variant.
- Recorded the dark outlined Cancel treatment as a permanent DS02 rule for every popup and aligned confirmation popups with it.

## Session — 2026-09-13 (Project grid and baseline lifecycle)

- Made Portfolio cards render three columns by default, four above 1690px, and five from 2030px.
- Added explicit pre-baseline and locked project stages: new projects remain editable until Save Baseline, while locked projects use Change Plan.
- Simplified the project actions menu and moved compact Pending/Waiting indicators to the left of the Latest version selector.

## Session — 2026-09-10 (Risk & Issues row actions)

- Grouped status, edit, and delete into the shared DS02 table-row action component with consistent 36px circular controls and spacing.
- Removed the oversized gap between Risk & Issues row actions and replaced the remaining hardcoded inactive icon color with a semantic token.

## Session — 2026-09-10 (Gantt controls refined)

- Kept the right-edge arrow as a second Gantt access point alongside the top control (double access).
- Replaced the large Show/Hide Gantt text button with a compact chart icon + chevron that lights (primary) when open and dims (outline) when closed.
- Made the bottom legend bar persist in both states to avoid layout shift; it shows full legend markers + Range when the Gantt is open, and a "Gantt chart collapsed" hint when closed.
- Days/Weeks/Months scale remains hidden while the Gantt is closed.
- Fixed a JSX `>` escape (`>`) in the legend. Typecheck clean; build OK; Playwright verified closed/open states.

## Session — 2026-09-10

- Replaced the ambiguous edge arrow with a labeled Show/Hide Gantt button and chart icon.
- Hid the Days, Weeks, and Months scale selector while the Gantt chart is closed.
- Made the Gantt legend larger and clearer, and only show it with the open chart.

## Session — 2026-09-09

- Rebuilt the Project Details header and compact overview information layout to match the supplied reference, removing the subtitle and oversized summary cards.

- Redesigned the Project Overview summary into six modern cards: Progress, Open Issues, Open Risks, Timeline, Budget, and Stage Gate.
- Added live weighted progress versus plan, issue/risk counts, timeline duration, budget utilization, and stage checklist completion.

## Session — 2026-09-08

- Corrected weekday/date column alignment in the shared calendar and changed range selection to one continuous highlight with distinct start/end caps.
- Calendar range band geometry: 36×36 cells, start day rounded LEFT only (8px), end day rounded RIGHT only (8px), middle square, single-day fully rounded. Set via inline `border-radius` on `DayButton` (beats the unlayered DS02 `[data-ui=control]` 8px baseline + button `rounded-md`); opted day button out of the control baseline via `data-ds-size="auto"`. Schedule picker cell override set to `2.25rem` (36px).
- Redesigned the Project Schedule date editor as a compact two-month range picker with Start Date, Due Date, and Duration controls matching the approved reference.

## Session — 2026-09-06

- Standardized secondary CTAs across the app with a `#1D1D1F` fill and `#767680` border while preserving the primary CTA style.
- Restyled the shared date picker to the current DS02 calendar pattern and replaced legacy browser date inputs across task creation, milestones, Gantt, financial due dates, and business-case forms.
- Kept the Progress Update popup height stable by removing the 100% approval notice and changing the existing Save Update button into the approval request action.
- Redesigned the Progress Update popup into a compact asymmetric workspace with a full-width roll-up, inline task progress editing, collapsible task metadata, and a narrower approval-gate panel.
- Standardized mandatory-field validation as inline red field highlighting and error text instead of error toasts.
- Extended the shared validation behavior to page forms and popup fields, including inputs, dropdowns, and text areas.
- Replaced the Project Details delete prompt with the standard DS02 danger confirmation popup.
- Removed the colored background container behind search and filter controls across all shared page toolbars and the Portfolio toolbar.

# PMO Project â€” Session Log

> Every session that touches this project is logged here. Newest session at the top.

---
## Session 48 — 2026-09-06

**What was done:**
1. Rebuilt the Portfolio filter as an inline expandable panel matching the supplied reference.
2. Added compact selectable chips for Project Types, Departments, RAG, Stage, Tags, Years, Clients, and Bases.
3. Added applied-filter chips, a live filter count, clear controls, and an internal right-side scrollbar.
4. Kept search, filter, and view controls aligned inside the existing toolbar surface.

**Files updated:**
- `src/routes/portfolio.index.tsx` — inline scrollable Portfolio filter experience.

---
## Session 47 — 2026-08-25

**What was done:**
1. Updated DS02 breadcrumb behavior so breadcrumbs only render on third-level pages.
2. Kept project detail pages on a simple "Back to Portfolio" link instead of a breadcrumb.
3. Added semantic breadcrumb color tokens for muted parents, current page, and hover state.
4. Set the back/breadcrumb text sizing to 14px via `text-sm`.
5. Completed route-level social metadata and removed root-level preview images so leaf routes own their metadata.

**Files updated:**
- `src/components/ds/PageShell.tsx` — third-level breadcrumb trail logic.
- `src/components/PageHeader.tsx` — header behavior aligned to the new breadcrumb rule.
- `src/routes/portfolio.$projectId.tsx` — project detail back link styling.
- `src/routes/index.tsx`, `src/routes/portfolio.index.tsx`, `src/routes/resources.tsx`, `src/routes/financials.tsx`, `src/routes/clients-vendors.tsx`, `src/routes/organization.tsx`, `src/routes/auth.tsx`, `src/routes/__root.tsx` — route metadata cleanup.
- `src/styles.css` — breadcrumb semantic Tailwind tokens.

---
## Session 46 — 2026-08-25

**What was done:**
1. Migrated `Project.department` from a single string to a `string[]` array to support multi-department projects.
2. Added a `DepartmentPicker` multi-select component in the New/Edit Project dialog with checkbox options, selected chips, and a "Clear all" action.
3. Updated Portfolio grid/list/slide-over, Project Detail subtitle/charter, Organization related-projects dialog, and global search to render departments as joined strings.
4. Updated Organization department linking logic to use `.includes(name)` against the array.

**Files updated:**
- `src/lib/mock-data.ts` — `Project.department` typed as `string[]`.
- `src/routes/portfolio.index.tsx` — `DepartmentPicker`, multi-select state, filter `flatMap`, display joins, create/edit payloads.
- `src/routes/portfolio.$projectId.tsx` — subtitle and charter now join department arrays.
- `src/routes/organization.tsx` — department counts and related projects use `.includes()`.
- `src/components/AppTopbar.tsx` — search value joins department array.

---
## Session 45 — 2026-08-17

**What was done:**
1. Tightened collapsed-sidebar alignment to match DS02 specs: 122px rail width, 24×24px icons, 28px vertical gaps.
2. Centered all module icons vertically; added a small chevron beside items with children that flips when the sub-page menu is open.
3. Hid sub-page labels in collapsed mode; they now appear in a floating popover with dot-bullets and the lavender active state.
4. Updated `SidebarMenuButton` base sizing (40px height / 8px radius) and made sure leaf and parent items share the same centered alignment in the collapsed rail.

**Files updated:**
- `src/components/AppSidebar.tsx` — collapsed layout, icon/chevron alignment, popover children.
- `src/components/ui/sidebar.tsx` — `SIDEBAR_WIDTH` 280px, `SIDEBAR_WIDTH_ICON` 122px.
- `src/styles.css` — verified sidebar tokens used by collapsed states.

---


## Session 44 — 2026-08-17

**What was done:**
1. Created a styled `DatePicker` component (`src/components/ui/date-picker.tsx`) using the shadcn Calendar + Popover.
2. Replaced native `Input type="date"` fields in the New Project dialog with the new styled date pickers.
3. Polished the Calendar component styling to match DS02 tokens (selected day, today highlight, hover states, disabled days).
4. Date picker supports Clear, Today, and min/max constraints (e.g., end date cannot be before start date).

**Files updated:**
- `src/components/ui/date-picker.tsx` — new reusable date picker component.
- `src/components/ui/calendar.tsx` — refined calendar styling for DS02 tokens.
- `src/routes/portfolio.index.tsx` — New Project dialog uses DatePicker for Start date and Target end date.

---

## Session 43 — 2026-08-13

**What was done:**
1. Renamed all "Usage" / "Usage in Projects" columns to "Active Projects" in the Organization module.
2. Aligned Job Roles and Cost Categories tables with the Departments "Active Projects" pattern.
3. Updated related filter labels and empty-state text to use "Active Projects" terminology.
4. Updated tag cards to show "X active projects" instead of "Used by X projects".

**Files updated:**
- `src/routes/organization.tsx`

---

## Session 42 — 2026-07-12

**What was done:**
1. Fixed the milestone approval progress CTA flow.
2. `Waiting for the Approval` now appears only after clicking `Save and Send Approval Request`.
3. New/edit milestone approval setup no longer starts in pending state automatically.
4. Verified in preview that entering 100% shows `Save and Send Approval Request` and does not show waiting first.

**Files updated:**
- `src/routes/portfolio.$projectId.tsx` — Approval state initialization and progress dialog CTA logic.

---

## Session 41 â€” 2026-07-08

**What was done:** 
1. Standardized table styling across entire app (all 6 modules)
2. Created reusable StyledTable component for design system
3. Enhanced Revenue Recognition tab with profitability metrics and payment status
4. Fixed Revenue Recognition array index bug (r[6], r[7], r[8] instead of r[7], r[8], r[9])
5. Synced PMO-Full Revenue Recognition with PMO-MVP (9 columns, consistent styling)
6. Updated DS02 design system to v2.6 with component documentation

**Files updated (Local & GitHub):**
- `src/routes/financials.tsx` â€” Enhanced & fixed Revenue Recognition tab (MVP & Full)
- `src/routes/resources.tsx` â€” Standardized table styling (MVP & Full)
- `src/routes/portfolio.index.tsx` â€” Standardized table styling (MVP & Full)
- `src/routes/portfolio.$projectId.tsx` â€” Standardized table styling (MVP & Full)
- `src/routes/organization.tsx` â€” Standardized table styling (MVP & Full)
- `src/routes/clients-vendors.tsx` â€” Standardized table styling (MVP & Full)
- `src/components/StyledTable.tsx` â€” New reusable component (MVP & Full)
- `DS02/DESIGN.md` â€” Updated to v2.6 with StyledTable documentation
- `SESSIONS.md` â€” This session log (updated with all fixes)

**Changes:**

### Part 1: Standardized Table Styling (All 6 Routes)
- Applied uniform dark background to table rows: `bg-[#1D1D23] hover:bg-[#252530] border-0`
- Applied transparent header styling: `hover:bg-transparent bg-transparent border-0`
- Removed outer `glass-card p-5` container wrappers from all tables
- Table rows now serve as their own visual container (cleaner hierarchy)
- Scope: 6 routes أ— 2 editions = 12 files updated

### Part 2: StyledTable Component (New Design System)
- Created `src/components/StyledTable.tsx` with re-exportable components
- `StyledTable`, `StyledTableHeader`, `StyledTableBody`, `StyledTableRow`, `StyledTableHeaderRow`, `StyledTableCell`, `StyledTableHead`
- Includes usage documentation and accessibility guidelines
- Foundation for future table enhancements (sorting, filtering, pagination)
- Added to DS02 component library documentation (v2.6)

### Part 3: Revenue Recognition Tab Enhancement & Bug Fixes
- **Initial Enhancement (Commit: 21c07b0 / fb0cd3e):**
  - Added 9 columns: Project | Milestone | Due | Total Contract | Recognised | Pending | % Realized | Payment | Days
  - Progress bars for % Realized metric
  - Color-coded payment status badges
  
- **Array Index Bug Fix (Commit: 4e4721a / 49d4bdf):**
  - Fixed: r[7], r[9] â†’ Corrected to: r[6], r[8]
  - Resolved: "Cannot read properties of undefined (reading 'replace')" error
  - Guard clause added for safe string parsing
  
- **Full Edition Sync (Commit: 2aaaf64):**
  - Synced PMO-Full with PMO-MVP Revenue Recognition implementation
  - Removed deprecated `glass-card p-5` wrapper
  - Now both editions have identical 9-column layout with consistent styling

### Part 4: Design System Update (DS02 â†’ v2.6)
- Updated version number and last modified date to 2026-07-08
- Added new section: "Data Table (StyledTable Component)" under Component Specifications
- Documented implementation details, styling, color values, and accessibility guidelines
- Updated Component Library Status to reflect StyledTable as standard component
- Added comprehensive changelog entry for v2.6 covering all changes
- Updated file references and related documentation

**Git commits (Total: 18):**

*Initial Enhancements:*
- MVP Financials: `21c07b0` â€” Enhanced Revenue Recognition tab with new columns
- Full Financials: `fb0cd3e` â€” Enhanced Revenue Recognition tab with new columns
- MVP StyledTable: `da817d2` â€” New reusable component
- Full StyledTable: `d7e0652` â€” New reusable component
- MVP Table Styling (5 files): `5322060`, `d6df4ee`, `83e8779`, `ba875f0`, `5b24e77`
- Full Table Styling (5 files): `1d8f521`, `1451afc`, `3b89e63`, `326a48c`, `bb666ff`
- DS02 DESIGN.md: `0069a73` (MVP), `4521675` (Full)
- SESSIONS.md: `6caafad` (MVP), `1f21f29` (Full)

*Bug Fixes & Sync:*
- MVP Financials Fix: `4e4721a` â€” Fixed array indices (r[6], r[8] instead of r[7], r[9])
- Full Financials Fix: `49d4bdf` â€” Fixed array indices
- Full Financials Sync: `2aaaf64` â€” Synced 9-column layout with MVP

**Editions Affected:** Both PMO-MVP and PMO-Full fully synchronized

**Branch:** main (both repos)

**Testing:** Verified in Lovable that both editions now display identical Revenue Recognition layout with all 9 columns and consistent styling

---

## Session 40 â€” 2026-07-07

**What was done:** Fixed Dashboard grid layout gaps in MVP â€” Recent Activity and Action Items sections now fill available space without whitespace.

**Files updated:**
- `PMO-MVP/flowdeep-peekaboo-mvp/src/routes/index.tsx` â€” Fixed grid column spans

**Changes:**
- Recent Activity tile: `col-span-12 lg:col-span-5` â†’ `col-span-12` (full width)
- My Action Items: `col-span-12 lg:col-span-4` â†’ `col-span-12 lg:col-span-5` (balances grid: 5 + 7 = 12 columns)
- UI layout now properly fills 12-column grid without whitespace gaps

**Git commits:** 
- `5b92a01` â€” Fix: Recent Activity width to fill container (MVP)
- `0d896c5` â€” Fix: Action Items width to balance grid (MVP)
**Branch:** main (PMO-MVP)

---

## Session 38 â€” 2026-07-07

**What was done:** 
1. Removed Documents and Change Requests tabs from Portfolio Project Detail page
2. Removed Show Columns option from Project Schedule (all columns now visible by default)
3. Fixed logical flow inconsistencies by clarifying MVP approval process and terminology
4. Made changes compatible with Full Version by adding context notes

**Files updated:**
- `PMO-MVP/flowdeep-peekaboo-mvp/src/routes/portfolio.$projectId.tsx` â€” Removed tabs, updated terminology, added scope note
- `PMO-MVP/flowdeep-peekaboo-mvp/src/components/ProjectSchedule.tsx` â€” Removed Show Columns dropdown
- `PMO-MVP/flowdeep-peekaboo-mvp/src/routes/portfolio.index.tsx` â€” Updated Business Case flow text
- `PMO-MVP/flowdeep-peekaboo-mvp/src/routes/index.tsx` â€” Updated Dashboard action items
- `PMO-Full/flowdeep-peekaboo/src/routes/portfolio.$projectId.tsx` â€” Added link to Risk & Issues module

**Changes:**

### Part 1: Tab & Column Cleanup
- Removed "Documents" tab (was Tab 7)
- Removed "Change Requests" tab (was Tab 9)
- Removed "Show Columns" dropdown from Project Schedule (28 lines)
- All columns now visible by default in Project Schedule
- New TABS array: 11 tabs instead of 13

### Part 2: Logical Flow Fixes (MVP Approval & Scope Clarity)
**Business Case Intake:**
- Dialog text: "enter the Pipeline for scoring and approval routing" â†’ "be reviewed by Portfolio Director for approval"
- BusinessCases tab stages: cleaned up to MVP-appropriate flow (Submitted | Under Review | Approved | Rejected)
- Removed Pipeline-related stages: "Deferred", "Revision Requested"

**Project Risks Terminology:**
- "Risks & Issues" tab â†’ "Project Risks" (clarifies project-scoped, not enterprise-wide)
- "Open RAID Items" â†’ "Open Project Risks" (consistent terminology)
- RisksTab header: "RAID register" â†’ "Project Risks & Issues"
- Charter references: "RAID register" â†’ "Project Risks tab"

**Dashboard Action Items:**
- "Approve BC-018" â†’ "Review 2 business cases" (clearer action, no Pipeline reference)

**Scope Clarity:**
- Risks are now clearly project-level only (not RAID/enterprise-wide)
- Business Cases follow Portfolio approval flow (no Pipeline dependency)
- All module references are logical within MVP scope

### Part 3: Version-Specific Context (Compatible Across Both)

**MVP - Project Risks Note:**
- Added banner: "Project-level risks and issues. Log concerns that impact this project's timeline, budget, or scope."
- Clarifies that MVP risks are contained within single project scope
- No reference to enterprise-wide Risk & Issues module (doesn't exist in MVP)

**Full - Risk & Issues Context:**
- Added banner with link to `/risks` full Risk & Issues module
- Text: "Project-level Risks & Issues. View enterprise-wide Risk & Issues in the Risk & Issues module for portfolio-wide RAID management."
- Full version references the enterprise module that MVP doesn't have

**Business Case Flow (Version-Appropriate):**
- âœ… MVP: "be reviewed by Portfolio Director for approval" (simple flow)
- âœ… Full: "enter the Pipeline for scoring and approval routing" (multi-level approval)
- Both authentic to their module scope

**Git commits:** 
- `d4fb736` â€” Remove Documents/Change Requests tabs
- `3ac1334` â€” Fix logical flow
- `2b3fbed` â€” Add Project Risks scope note (MVP)
- `a669e31` â€” Add Risk & Issues module link (Full)

**Result:** âœ… Both versions logically consistent with their module count and scope
**Branch:** main (PMO-MVP + PMO-Full)

---

## Session 39 â€” 2026-07-07

**What was done:** Removed Quick Create section entirely from Dashboard in both MVP and Full versions.

**Files updated:**
- `PMO-MVP/flowdeep-peekaboo-mvp/src/routes/index.tsx` â€” Removed QuickCreate component, QUICK_CREATE_BY_ROLE, useNavigate import
- `PMO-Full/flowdeep-peekaboo/src/routes/index.tsx` â€” Removed QuickCreate component, QUICK_CREATE_BY_ROLE

**Changes:**

### Complete Removal
- Removed `<QuickCreate role={role} />` from Dashboard component
- Deleted entire QuickCreate component function (27 lines in Full, ~30 lines in MVP)
- Deleted QUICK_CREATE_BY_ROLE constant with all role-based actions
- Cleaned up unused imports (useNavigate in MVP)
- Simplified ResourceView signature back to no props

**Result:** 
âœ… Quick Create section completely removed from both versions
âœ… Dashboard now shows only role-specific views
âœ… Cleaner, simpler Dashboard interface

**Git commits:** 
- MVP: `e37a2bc` â€” Remove Quick Create from Dashboard (MVP)
- Full: `26b9a50` â€” Remove Quick Create from Dashboard (Full)
**Branch:** main (both PMO-MVP + PMO-Full)

---

## Session 37 â€” 2026-07-06

**What was done:** Split product-spec.md into two separate versions with clear dual-track documentation. Created product-spec-mvp.md (2600+ lines, MVP modules only) and product-spec-full-complete.md (Full version with all 13 modules). Added Dual-Track Model notes to both files explaining that MVP module changes auto-sync to Full.

**Files created:**
- `product-spec-mvp.md` (v17-MVP) â€” 2632 lines, 111KB â€” 6 MVP modules only
- `product-spec-full-complete.md` (v17-Full) â€” 4093 lines, 181KB â€” All 13 modules
- Updated `product-spec-full.md` â€” Summary/index file explaining editions

**Structure:**
- Both files include shared sections 1-5 (Vision, Design System, App Shell, Auth, RBAC)
- MVP file: Dashboard (MVP views only), Portfolio, Resources, Clients & Vendors, Financials, Organization
- Full file: All MVP modules + Pipeline, Risk & Issues, Procurement, Reports, Settings, Roles & Permissions, Help & Docs, Client Portal
- Both files have Dual-Track Model note at top
- Updated headers: "v17-MVP" and "v17-Full" for clarity

**Rule documented:**
"Changes made to MVP module specifications in PMO-MVP repo automatically sync to PMO-Full repo"

---

## Session 36 â€” 2026-07-06

**What was done:** Cleaned up PMO-MVP to contain ONLY 5 essential modules (Portfolio, Resources, Clients & Vendors, Financials, Organization). Removed all Full-only modules and Dashboard sections referencing Pipeline/Risk.

**Files updated:**
- `PMO-MVP/flowdeep-peekaboo-mvp/src/routes/index.tsx` â€” Dashboard: Removed Pipeline & Risk sections from all role views
- `PMO-MVP/flowdeep-peekaboo-mvp/src/components/AppSidebar.tsx` â€” Navigation: Keep only 5 MVP modules
- `PMO-MVP/flowdeep-peekaboo-mvp/src/routes/` â€” Deleted 6 Full-only route files

**Changes:**
- Deleted Full-only routes: pipeline.tsx, procurement.tsx, reports.tsx, risks.tsx, roles.tsx, settings.tsx
- Updated AppSidebar: Navigation now shows only Dashboard + 5 MVP modules (removed Pipeline, Risk & Issues, Procurement, Reports, Settings, Help & Docs)
- Updated Dashboard:
  - DirectorView: Removed "Approval Queue", "Top Risks" tiles; removed "Open risks" metric
  - ExecutiveView: Removed "Risk Score" and "Top Pipeline Bets" tiles
  - PMView: Removed "Open RAID" section
- Dashboard now data-driven: Shows only metrics from MVP modules (Portfolio health, Budget, Resources, Milestones, Notifications)
- Committed to GitHub: `b49e5c2`

---

## Session 35 â€” 2026-07-06

**What was done:** Resolved GitHub documentation visibility issue. CLAUDE.md and README.md files were committed but GitHub CDN had cache delay. Fixed by moving README.md files into repos and re-committing. All documentation now live on GitHub.

**Files updated:** 
- `PMO-Full/flowdeep-peekaboo/README.md` (added to repo root)
- `PMO-MVP/flowdeep-peekaboo-mvp/README.md` (added to repo root)
- Both repos pushed to GitHub with new commits

**Changes:**
- Identified that CLAUDE.md files WERE on GitHub, but GitHub CDN had caching delay
- Fresh clone confirmed both CLAUDE.md files present in both repos
- Moved README.md files from folder parents into repo roots
- Committed and pushed README.md to both Full and MVP repos
- Verified all documentation now accessible from GitHub fresh clones

---

## Session 34 â€” 2026-07-06

**What was done:** Implemented dual-track project structure (PMO-Full + PMO-MVP), organized folders, updated CLAUDE.md files across all repos, created comprehensive documentation for handoff.

**Files updated:** 
- `CLAUDE.md` (root level)
- `PMO-Full/README.md`
- `PMO-MVP/README.md`
- `PMO-Full/flowdeep-peekaboo/CLAUDE.md`
- `PMO-MVP/flowdeep-peekaboo-mvp/CLAUDE.md`
- `flowdeep-peekaboo/CLAUDE.md`
- Memory files: `project_structure.md`, `project_repos_dual.md`
- Updated `MEMORY.md` index
- `SESSIONS.md`

**Changes:**

### ًں“پ Folder Structure Reorganized
1. **PMO-Full/** â€” Full edition (13 modules)
   - `flowdeep-peekaboo/` â€” repo: `flowdeep-peekaboo-8a63f52d`
   - All modules: Portfolio, Pipeline, Organization, Resources, Clients & Vendors, Financials, Reports, Risk & Issues, Procurement, Settings, Roles & Permissions, Help

2. **PMO-MVP/** â€” MVP edition (6 essential modules)
   - `flowdeep-peekaboo-mvp/` â€” repo: `flowdeep-peekaboo-mvp`
   - Only: Portfolio, Resources, Clients & Vendors, Financials, Organization, (Dashboard core)

3. **Root level CLAUDE.md** â€” Explains dual-track model

### ًں”„ Sync Model Defined
- **Shared modules** flow from MVP â†’ Full automatically
- **Full-only modules** (Pipeline, Procurement, RAID, Reports, etc.) stay in Full
- Single source of truth for: Portfolio, Resources, Clients & Vendors, Financials, Organization

### ًں“‌ Documentation Created
1. **CLAUDE.md Files** (3 versions):
   - Root: explains dual-track setup, repos, folder structure, rules
   - PMO-Full: complete feature list, dev workflow, all 13 modules
   - PMO-MVP: explains scope reduction, sync mechanism, 6 essentials

2. **README Files**:
   - `PMO-Full/README.md` â€” Getting started, structure, synced modules
   - `PMO-MVP/README.md` â€” MVP goal, excluded features, sync explanation

3. **Memory Files**:
   - `project_structure.md` â€” Dual-track model & sync strategy
   - `project_repos_dual.md` â€” Repos, git configs, folder paths
   - Updated `MEMORY.md` â€” New entries for tracking

### ًںژ¯ Key Points Documented
- Why two repos? MVP for fast iteration, Full for enterprise
- How sync works? Shared modules auto-propagate, reduces duplication
- Git remotes: PMO-Full on 8a63f52d, MVP on flowdeep-peekaboo-mvp
- Development workflow: test in MVP first, changes sync to Full
- Handoff ready: Developer reads CLAUDE.md â†’ understands model â†’ can contribute

### âœ… Repos Updated
- `flowdeep-peekaboo-8a63f52d` (PMO-Full) â€” CLAUDE.md committed âœ…
- `flowdeep-peekaboo-mvp` (PMO-MVP) â€” CLAUDE.md added âœ…
- Both repos have comprehensive docs for onboarding

---

## Session 33 â€” 2026-06-28

**What was done:** Updated Financials page with year filter, reordered table columns, and replaced Forecast with Margin metric. Created v17 product spec with patch file.

**Files updated:** `src/routes/financials.tsx` آ· `product-spec.md` آ· `product-spec-patch-v17.md` آ· `SESSIONS.md`

**Changes:**

### Financials Page Updates
1. **Year filter dropdown** added to "By Project" tab
   - Populated with current year آ± 2 years (2024â€“2026)
   - Filter state: `const [selectedYear, setSelectedYear] = useState("2026")`
   - Selection persists in localStorage

2. **Table columns reordered and restructured:**
   - Before: Project | Business Line | Budget | Spent | Burn | Variance | Forecast
   - After: Project | Business Line | Revenue | Budget | Spent | Burn | Variance | Margin
   
3. **Revenue column added:**
   - Calculated as Budget أ— 1.15 (15% premium pricing model)
   - Provides contract/revenue reference for profitability calculations

4. **Forecast â†’ Margin replacement:**
   - Removed: Forecast column (Budget أ— 1.04)
   - Added: Margin % column = (Revenue âˆ’ Spent) / Revenue أ— 100
   - Color-coding: Green >20%, Amber 10â€“20%, Red <10%
   - Emphasizes profitability tracking over burn forecasts

### Git Commit
- **Commit:** `ce788b9` (2026-06-28)
- **Message:** "Added year filter and Margin column to Financials page â€” reordered columns (Revenue before Budget)"
- **Files changed:** `src/routes/financials.tsx` (+25 lines)

### Product Spec Updates
- **Version bumped:** v16 â†’ **v17**
- **Last updated:** 2026-06-28
- **Patch file:** `product-spec-patch-v17.md` created with complete change summary and implementation notes
- **Spec sections updated:** Module 5 â€” Financials Tab 1 table structure and filter definition

---

## Session 32 â€” 2026-06-25

**What was done:** Synced extensive Lovable updates to DS02 and product-spec documentation. Added Calendar component, planned vs actual progress tracking, stacked progress bars, and UI refinements. Created v16 patch file with complete feature specifications.

**Files updated:** `DS02/DESIGN.md` آ· `product-spec.md` آ· `product-spec-patch-v16.md` آ· `SESSIONS.md`

**Changes:**

### Latest Lovable Updates (2026-06-24, 82 commits from 09:37â€“12:34 UTC)

**Key Feature Commits:**
1. **c0a6775** (12:34 UTC) â€” Added shadcn Calendar popover
   - Calendar popover enhancement with month/week views
   - Event list display in popover (59 lines to organization.tsx)

2. **44b06c6** (12:25 UTC) â€” Added Calendar tab & data
   - Calendar tab in Organization module (152 lines)
   - Mock event data (47 lines in mock-data.ts)
   - Calendar state management (18 lines in projects-store.tsx)
   - Portfolio page integration (15 lines)

3. **641a98e** (09:57 UTC) â€” Added stacked progress bars
   - Layered progress visualization (57 lines in ProjectSchedule)
   - Visual stacking for multiple progress metrics

4. **3f99c42** (09:41 UTC) â€” Implemented planned vs actual
   - Dual-axis progress tracking (109 lines in ProjectSchedule)
   - Portfolio detail enhancements (276 lines in portfolio.$projectId)

5. **29f885b** (10:44 UTC) â€” Updated modal bar colors & width
   - Modal header styling refinements
   - Border and shadow adjustments

6. **ecad6a0** (11:15 UTC) â€” Updated dialog labels by scope
   - Clarified field labels across dialogs
   - Scope-specific labeling (intake, portfolio, project)

7. **3c99e93** (11:33 UTC) â€” Renamed "business lines" field
   - Standardized terminology across modules

### Files Modified (6 total)
- `src/routes/organization.tsx` â€” Major refactor, 201 lines (Calendar tab: 152 + popover: 79)
- `src/components/ProjectSchedule.tsx` â€” Progress visualization, 126 lines (stacked bars: 57 + planned/actual: 69)
- `src/routes/portfolio.$projectId.tsx` â€” Calendar + progress dashboard, 329 lines
- `src/routes/portfolio.index.tsx` â€” Calendar integration, 15 lines
- `src/lib/mock-data.ts` â€” Calendar event data, 47 lines
- `src/lib/projects-store.tsx` â€” Calendar state management, 18 lines

### DS02 Documentation Updates:
- **Version:** Bumped DS02.v2.4 â†’ **DS02.v2.5**
- **Latest Commit:** Updated to c0a6775 (2026-06-24 12:34 UTC)
- **New Changelog Entry:** v2.5 section with Calendar, Progress, and UI refinements
- **Component Documentation:** Detailed specifications for Calendar and StackedProgressBar
- **File References:** Updated organization.tsx, ProjectSchedule.tsx, portfolio pages with latest dates

### Product Spec Updates:
- **Version:** Bumped v15 â†’ **v16** in `product-spec.md`
- **New Patch File:** Created `product-spec-patch-v16.md` with:
  - Calendar component specifications (month/week views, event types, data integration)
  - Planned vs Actual progress calculation algorithm
  - Stacked progress bar component API and usage
  - Modal bar styling updates (colors, width, shadow depth)
  - Field renaming and dialog label updates documentation
  - Comprehensive testing checklist (functional, UX, accessibility, design system)
  - Design system (DS02.v2.5) alignment verification
- **Version Table:** Updated with v16 entry summarizing all changes

**Testing Status:**
- âœ… Calendar component verified with event indicators
- âœ… Planned vs Actual progress calculation validated
- âœ… Stacked progress bars rendering correctly
- âœ… Modal bar styling applied consistently
- âœ… Dialog labels updated across modules
- âœ… Dark/light mode support confirmed

**Net Changes:** 663 insertions, 73 deletions â€” significant feature expansion for project visibility and progress tracking

**Design Philosophy (DS02.v2.5):**
- Calendar events use semantic color tokens (teal/lavender/amber/green/slate)
- Progress bars use RAG-based colors (blue planned, green/amber/red actual)
- All components respect dark/light mode toggle
- Stacked progress visualization increases data density for enterprise users
- Modal styling improvements enhance visual hierarchy and usability

---

## Session 31 â€” 2026-06-24

**What was done:** Synced latest Lovable updates to DS02 and product-spec documentation. Added Project Schedule features (right-click actions, export, health logic), toggle visibility fix. Created v15 patch file with detailed feature specifications.

**Files updated:** `DS02/DESIGN.md` آ· `product-spec.md` آ· `product-spec-patch-v15.md` آ· `SESSIONS.md`

**Changes:**

### Latest Lovable Updates (2026-06-24, 35 commits from 07:30â€“08:06 UTC)

**Key Feature Commits:**
1. **229e152** (08:06 UTC) â€” Fixed toggle visibility
   - Switch component visibility improvements in `ui/switch.tsx`
   - Better toggle display on light/dark modes

2. **5f84387** (07:40 UTC) â€” Updated export formats
   - ProjectSchedule.tsx enhanced with multiple export format options
   - Export-related UX improvements (94 lines added)

3. **a1a79be** (07:36 UTC) â€” Added Export & health logic
   - ProjectSchedule.tsx expanded with export features and health status calculations
   - 144 lines added for new logic

4. **3b5ebfc** (07:33 UTC) â€” Added right-click actions
   - ProjectSchedule.tsx: 72+ lines for context menu support
   - portfolio.$projectId.tsx: 140+ lines for right-click action integration
   - Quick-access actions via right-click on rows

### Files Modified (5 total)
- `src/components/ProjectSchedule.tsx` â€” Major refactor, 303 lines added (right-click actions, export, health logic)
- `src/routes/portfolio.$projectId.tsx` â€” Right-click actions support, 140 lines added
- `src/components/ui/switch.tsx` â€” Toggle visibility fix, 5 lines
- `package.json` â€” Dependency bump (1 line)
- `bun.lock` â€” Lock file updates (19 lines)

### DS02 Documentation Updates:
- **Version:** Bumped DS02.v2.3 â†’ **DS02.v2.4**
- **Latest Commit:** Updated to 229e152 (2026-06-24 08:06 UTC)
- **New Changelog Entry:** v2.4 section with all feature additions documented
- **File References:** Updated ProjectSchedule.tsx and portfolio.$projectId.tsx with latest dates
- **Component Updates:** Documented new right-click actions, export features, and health logic

### Product Spec Updates:
- **Version:** Bumped v14 â†’ **v15** in `product-spec.md`
- **New Patch File:** Created `product-spec-patch-v15.md` with:
  - Right-click context menu specifications (12 actions defined)
  - Export functionality details (CSV/Excel/JSON formats)
  - Health status calculation algorithm and indicators
  - UI/switch toggle visibility fixes
  - Component specifications and testing checklist
  - Dark/light mode compliance verification
  - Design system (DS02.v2.4) alignment
- **Version Table:** Updated with v15 entry summarizing all changes

**Testing Status:**
- âœ… Right-click context menu verified in ProjectSchedule
- âœ… Export functionality integrated and tested
- âœ… Health status logic implemented
- âœ… Toggle visibility fix confirmed
- âœ… All styling consistent with DS02.v2.4 standards

**Net Changes:** 416 insertions, 52 deletions â€” significant feature expansion for schedule management and project operations

---

## Session 30 â€” 2026-06-23

**What was done:** Updated DS02 DESIGN.md with latest Lovable changes (v2.3): TabsTrigger consistency, AppSidebar refactoring, token-driven architecture consolidation.

**Files updated:** `DS02/DESIGN.md` آ· `SESSIONS.md`

**Changes:**

### Latest Lovable Updates (Commit 9409441 â€” 2026-06-21)
1. **TabsTrigger Consistency** â€” Applied accent color borders across all 10 route pages
   - Portfolio, Pipeline, Clients & Vendors, Organization, Procurement, Resources, Risks, Financials, Settings
   - Pattern: `data-[state=active]:border-accent data-[state=active]:text-foreground`
   - Matches Dashboard role selector styling for visual cohesion

2. **AppSidebar Refactoring** â€” Simplified component architecture
   - Removed inline styles and hardcoded colors
   - Now uses CSS tokens exclusively: `var(--sidebar-*)`
   - Code reduced from 201â†’~130 lines for maintainability
   - Enforces token-driven architecture: "Do NOT add hex/rgba literals"

3. **Color Tokens Expansion** â€” All route files refactored
   - Sidebar tokens: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, etc.
   - Header tokens: `--header`, `--header-foreground`, `--header-border`
   - Cards: Using base tokens with theme variables

4. **Navigation & Layout** â€” Bottom navigation expanded to full page width
5. **Theme Persistence** â€” Improved dark/light mode toggle and data-theme sync in localStorage
6. **Visual Refinement** â€” Header & card colors refined for contrast consistency

### DS02 Documentation Updates:
- **Version bumped:** DS02.v1 â†’ DS02.v2.3 (latest commit: 9409441, 2026-06-21)
- **New Changelog Entry:** v2.3 section with all changes documented
- **Tabs Component:** Updated with consistency note and pattern breakdown
- **File References:** Updated all "Last Updated" dates and paths to reflect v2.3 state
- **Repo Reference:** Updated to new repo `flowdeep-peekaboo-afe086d6`

**Testing Status:**
- âœ… All 10 route pages verified with consistent TabsTrigger styling
- âœ… AppSidebar token-driven refactoring verified
- âœ… CSS variable architecture fully documented
- âœ… Dark/light mode persistence working

---

## Session 29 â€” 2026-06-21

**What was done:** Synced Lovable styling refactors to DS02 documentation. Updated Tabs component design pattern, documented token-driven architecture, added header & badge token specs.

**Files updated:** `DS02/DESIGN.md` آ· `SESSIONS.md`

**Changes:**

### Lovable Styling Updates Discovered:
1. **Tabs Redesign** (commit 6847378 "Updated Tabs styling")
   - Changed from `data-[state=active]:bg-accent` (pill) to `data-[state=active]:border-accent` (underline)
   - Active tab: Bottom border in accent color, standard text (not inverted)
   - Cleaner underline pattern vs background highlight
   - Applied to all 10 modules

2. **Token-Driven Refactor** (commit f7d2694 "Refactored colors to tokens")
   - Sidebar: All colors removed from hardcoded hex â†’ CSS `--sidebar-*` variables
   - New badge tokens: `--sidebar-badge-bg/fg` (normal) + `--sidebar-badge-danger-bg/fg` (red)
   - New header tokens: `--header`, `--header-foreground`, `--header-border`
   - Comment added: "Do NOT add hex/rgba literals or inline color styles"

3. **TabsList Updates** (commit de11f3e "طھظ…ط¯ط¯طھ ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط³ظپظ„ظ‰")
   - TabsList now uses full width behavior
   - Bottom border: `border-b border-border` (base line)
   - No background styling

### DS02 Documentation Updates:
- Section 2.6: New **Tabs Component** subsection (border-bottom pattern, implementation details)
- Section 14: New **Token-Driven Architecture** (complete token reference, best practices)
- Changelog: v2.2 entry documenting all changes
- Added: "How to Update Colors" guide (point to CSS tokens, not component code)

### Token Reference Added:
- Header tokens (--header, --header-foreground, --header-border)
- Sidebar badge tokens (normal + danger variants)
- Complete list of all CSS custom properties with usage notes

**Testing Status:**
- âœ… Tabs underline pattern confirmed (all modules)
- âœ… Token-driven sidebar verified (no hardcoded colors)
- âœ… Badge colors using new tokens
- âœ… Header styling using new tokens

**Design Philosophy (DS02.v2.2):**
- Single source of truth: CSS variables in `styles.css`
- No hex/rgba literals in component files
- Token names map directly to Tailwind classes (e.g., `--sidebar-badge-bg` â†’ `bg-sidebar-badge`)
- Easier maintenance and color updates going forward

---

## Session 28 â€” 2026-06-21

**What was done:** Synced Lovable updates to DS02 design system documentation. Applied new scrollbar styling, confirmed dark mode default, and updated DS02/DESIGN.md v2.1 with all recent changes.

**Files updated:** `DS02/DESIGN.md` آ· `flowdeep-peekaboo/src/styles.css` (reviewed) آ· `flowdeep-peekaboo/src/components/AppTopbar.tsx` (reviewed)

**Changes:**

### Lovable Updates Integrated:
- **Themed Scrollbars (New):** Firefox + WebKit scrollbars now follow DS02 theme
  - Main content: accent color (45% opacity default, full on hover)
  - Sidebar: light colors (rgba(255,255,255,0.18â€“0.32)) for dark background visibility
  - Transition: 200ms ease
  - Corner: transparent

- **Dark Mode Default (Confirmed):** `data-theme="dark"` now set by default on `<html>` element in __root.tsx
  - Light mode still accessible via toggle
  - localStorage persistence working (key: `ds02-theme`)

### DS02 Documentation Updates:
- Added Section 8.5: Scrollbar Styling (Firefox + WebKit implementations)
- Updated Section 6: Dark/Light Mode Toggle (clarified default behavior)
- Version bumped: DS02.v2 â†’ DS02.v2.1
- Added scrollbar behavior table (default, hover, sidebar states)

### Bug Fixes Applied (Previous Session):
- âœ… Fixed Dark Mode toggle useEffect (now syncs data-theme attribute on state change)
- âœ… Added support for explicit `data-theme="light"` selector in CSS
- âœ… Resolved git conflict markers in styles.css (dark mode sidebar colors)
- âœ… Updated button colors: Light #515B92 (blue) | Dark #DEC9FF (lavender)

**Testing Status:**
- âœ… Dark mode toggle works (background + buttons change)
- âœ… Scrollbars now themed (tested in Chrome/Firefox)
- âœ… Sidebar scrollbars visible (light colors on dark background)
- âœ… localStorage persistence confirmed (refresh maintains theme/state)
- âœ… All component colors match Figma selection (verified via Figma Console MCP)

---

## Session 27 â€” 2026-06-17
**What was done:** Implemented DS02 Sidebar + TeamSmart Design System Integration. Applied 4 sequential steps: (1) Font migration (Inter â†’ Roboto/Poppins in Sidebar), (2) Color palette from TeamSmart (lavender #A78BFA active state, golden accents), (3) Collapsed + Expanded variants, (4) React implementation + global CSS.
**Files updated:** `product-spec.md` آ· `product-spec-patch-v14.md` (new) آ· `flowdeep-peekaboo/src/components/AppSidebar.tsx` آ· `flowdeep-peekaboo/src/styles.css` آ· `SESSIONS.md`
**Changes:**
- **Typography (آ§2.2):** Sidebar uses Poppins 14px (warm, friendly); General UI keeps Inter (data-dense); Headings use Roboto (bold, enterprise). Active state: 600 Semibold. Hover: 500 Medium.
- **Color Tokens (آ§2.1):** Sidebar always dark #0F1729. Nav items: #94A3B8 (default) â†’ #CBD5E1 (hover) â†’ #FFFFFF (on active). Active pill: Lavender #A78BFA (TeamSmart accent-619). Hover: Golden tint rgba(212,165,116,0.08). Disabled: #475569.
- **Sidebar Variants (آ§2.5.1):** Expanded (280px, full labels/badges/logo) | Collapsed (122px, icons only, tooltips, larger 24أ—24px icons). Height 40px, gap 12px (expanded) / 28px (collapsed). Radius 12px. Collapse toggle in header (ChevronLeft/Right). localStorage persistence.
- **React Component (AppSidebar.tsx):** Refactored with SIDEBAR_COLORS token object. Poppins font forced via inline style + global CSS. Interactive hover states (onMouseEnter/Leave). Lavender active pill + white text. Collapsed variant: labels hidden, profile card hidden. Badge styling (red vs neutral). User profile only in expanded mode.
- **Global Styles (styles.css):** Added Google Fonts import (Inter, Poppins, Roboto). New .ds02-sidebar class: Poppins forced, dark bg, subtle borders, active state styling (#A78BFA + white + 600 weight), hover state (#CBD5E1 + golden tint), 200ms transition.
- **Responsive:** Desktop: expanded (280px) by default. Tablet: collapsed (122px) by default. Mobile: hidden, hamburger opens overlay (280px).
- **Testing:** Expanded/collapsed states verified. Active nav item: lavender pill + white text. Hover: golden tint background. User profile visibility toggles. Icons visible in collapsed mode. Poppins font loads correctly. Colors match TeamSmart + DS02 specs.

---

## Session 26 â€” 2026-06-17
**What was done:** Implemented Design System 02 (DS02) â€” switched from DS01 (teal/dark blue) to DS02 (warm light + dark / Inter font / golden accent). Dark mode now default with optional light mode toggle.
**Files updated:** `flowdeep-peekaboo/src/styles.css` آ· `product-spec.md` آ· `product-spec-patch-v13.md` (new)
**Changes:**
- **DS02 Design System Applied:**
  - Tailwind custom variant: dark now targets `[data-theme="dark"]` (inverted logic â€” dark is DEFAULT, light is optional via `[data-theme="light"]`)
  - Font: switched from Outfit to Inter (cleaner, tighter spacing for data-dense views)
  - Primary accent: changed from teal `#51CAAD` to golden `#D4A574` (warmer, more professional for enterprise)
  - Sidebar: dark mode always (no light variant); active nav item uses lavender pill (`#A78BFA`)
  - Sidebar labels: removed group category headers (Navigation, Config, Admin) for cleaner compact view
  - Dark/Light toggle button: persisted in TopBar (top-right before user menu); state saved to localStorage `theme` key
- **Color Palette v2 (DS02):**
  - Warm Light mode: `#F8F5F0` bg (warm beige) | `#2C2C2C` text (near black)
  - Dark mode (default): `#0B1120` bg (blue-black) | `#E2E8F0` text (silver)
  - Golden accent: `#D4A574` (primary CTAs, active states, focus rings)
  - Accent dim: `rgba(212,165,116,0.12)` (warm gold tint)
  - Status colors: Green `#10B981` آ· Amber `#F59E0B` آ· Red `#EF4444` آ· Blue `#3B82F6` (unchanged)
- **Component Updates:**
  - AppSidebar: background always dark (`bg-slate-950`), active nav item uses lavender fill + rounded pill, no section labels
  - AppTopbar: dark/light theme toggle button (sun/moon icon), position before user avatar menu
  - All buttons: golden accent on primary actions (was teal)
  - Input focus rings: golden border (was teal)
  - Hover states: subtle golden glow on cards (was teal)
  - Links: golden text on dark, warm brown on light (was teal)
  - Tags/badges: golden background, dark text
- **CSS Custom Variant Fix:**
  - Old: `@custom-variant dark (&:is([data-theme="dark"] *))`  â†گ explicitly targets dark theme
  - New: `@custom-variant dark (&:not([data-theme="light"] *))` â†گ defaults to dark, only excludes light mode
  - Comment updated: "Active Design System: DS02 â€” Dark default / Light optional"
- **Testing notes:** Toggle tested on Dashboard, Portfolio, Sidebar, TopBar â€” all components reflect theme switch immediately. localStorage persistence verified (refresh maintains theme choice).
- **Pending for next session:** Apply DS02 styling to remaining pages (Pipeline, Procurement, Reports, Risk & Issues, Settings); verify RTL behavior in light mode; test accessibility contrast ratios in both themes.

---

## Session 25 â€” 2026-06-07
**What was done:** Migrated active repo to new Lovable workspace repo. Pulled Lovable's dashboard redesign.
**Files updated:** `flowdeep-peekaboo` remote URL (local git config only)
**Changes:**
- New repo: `https://github.com/abdulsalahuddin94-dev/flowdeep-peekaboo-afe086d6.git`
- Old repo: `https://github.com/abdulsalahuddin94-dev/flowdeep-peekaboo.git` (archived, no longer used)
- Pulled 6 Lovable commits: full Dashboard redesign (`src/routes/index.tsx` 495â†’678 lines)
  - Live data via `useProjects()`, `useNotifications()`, `useResourceRequests()` hooks
  - Director view: 12-column bento grid, live KPI band, Budget Burn tile, Risk/Notifications/Resources panels
  - New shared components: `Tile`, `Stat`, `MiniStat`, `HealthBar`, `useLiveSummary()` hook
  - All other files (pipeline.tsx etc.) carried forward intact

---

## Session 24 â€” 2026-06-04
**What was done:** Split Pipeline Approval Queue â€” removed standalone tab, embedded inline under Capital and Commercial tabs. Added Comment action and Commercial Award/Mark Lost queue.
**Files updated:** `product-spec.md`, `product-spec-patch-v12.md`, `flowdeep-peekaboo/src/routes/pipeline.tsx`
**Changes:**
- Sub-Tab D (Awaiting Decision) removed from Pipeline tab bar
- Capital sub-tab: new "Awaiting Decision Panel" (Director+ only) â€” amber collapsible banner above Kanban/Table showing Capital items in "Awaiting DoA" state with Approve/Defer/Reject/Comment actions
- Commercial sub-tab: same panel for Commercial items at "Bid/No-Bid Decision" stage with Approve Bid/Defer/Reject/Comment actions
- `Comment` action added to both panels â€” posts to activity log + notifies PM without changing item status/stage
- Sub-Tab C (All) note added: approval panels not shown there
- Pipeline RBAC table updated with split panel rows + Comment permission
- Sidebar nav: badge now on Pipeline item (combined count), no separate Approval Queue nav item
- product-spec.md bumped to v12; patch file created

---

## Session 23 â€” 2026-06-03
**What was done:** Reordered sidebar nav and moved Roles & Permissions into Settings as a tab.
**Files updated:** `src/components/AppSidebar.tsx`, `src/routes/settings.tsx`
**Changes:**
- Sidebar reordered to: Dashboard, Portfolio, Pipeline, Risk & Issues, Resources, Clients & Vendors, Procurement, Financials, Reports, Organization
- "Roles & Permissions" removed from sidebar mgmt section
- Settings page: added "Roles & Permissions" tab with full role table, permission matrix Sheet (10 domains أ— 7 actions), New Role dialog

---

## Session 22 â€” 2026-06-03

**What was done:** Added "Project Charter" tab to project detail page, between Overview and Planning.
**Files updated:** `src/routes/portfolio.$projectId.tsx`
**Changes:**
- New `CharterTab` component with two-column layout (purpose/constraints left, identity/approval right)
- Pre-filled from project data: name, PM, department, budget, end date, client
- Editable fields via Edit/Save toggle: objective, scope, success criteria, constraints, assumptions, risks, sponsor, PM, dates, budget
- Approval status badge (Pending Approval â†’ Approved) with "Approve Charter" one-click button
- Approval record table: Executive Sponsor, Portfolio Director, PM, Finance Manager with date + tick/pending indicator

---

## Session 21 â€” 2026-06-03

**What was done:** Implemented all sprint items #4â€“#12 â€” full interactivity and shared cross-route state.
**Files updated:** `src/lib/projects-store.tsx`, `src/components/AppTopbar.tsx`, `src/routes/portfolio.$projectId.tsx`, `src/routes/procurement.tsx`, `src/routes/resources.tsx`, `src/routes/index.tsx`, `src/routes/reports.tsx`, `src/routes/settings.tsx`, `src/routes/pipeline.tsx`
**Changes:**
- **#4 Notifications** â€” Bell badge shows live unread count; opening the panel marks all read; notifications rendered from shared context
- **#5 Status Reportâ†’RAG** â€” `StatusReportsTab` calls `onRagChange(rag)` on submit, which calls `updateProject` + `addNotification` in context so the portfolio badge updates live
- **#6 Send for Tenderingâ†’Procurement** â€” `PlanningTab.sendForTendering` now calls `addRfp` so the new RFP appears in Procurement module's table immediately
- **#7 Request Resourceâ†’Resources** â€” New `RequestResourceDialog` in Team Members tab calls `addResourceRequest`; `resources.tsx` replaced local state with `useResourceRequests()` hook
- **#8 My Tasks** â€” `TeamMemberView` in Dashboard now uses `useState` for completed task IDs; clicking toggles done state with strikethrough + counter
- **#9 Report Preview** â€” `ReportsPage` "Run" button opens a `Dialog` with a KPI table of report content; Download also triggers the preview
- **#10 Add Team Member** â€” Team Members sub-tab is now stateful; "Add Member" dialog picks from resource pool; "Request Resource" dialog fills the cross-route request
- **#11 User Management** â€” Settings "Users" tab added with live table, `InviteUserDialog`, and remove action
- **#12 Export** â€” Project detail page has "Export" button calling `window.print()`
- `projects-store.tsx` expanded to full `AppContext` covering projects, notifications, RFPs, and resource requests in a single provider

---

## Session 20 â€” 2026-06-03

**What was done:** Sprint 1 Item 3 â€” Global search bar wired to live data with navigation.

**Files updated:** `flowdeep-peekaboo/src/components/AppTopbar.tsx` آ· `SESSIONS.md`

**Changes:**

- Projects group: all projects from shared context, RAG dot + PM + stage; selecting navigates to `/portfolio/$projectId`
- Pipeline group: all 8 business cases with score badge; selecting navigates to `/pipeline`
- People group: all 8 resources with role and utilization % (color-coded); selecting navigates to `/resources`
- Quick Actions: links to pipeline, portfolio, reports, risks
- Ctrl/Cmd+K keyboard shortcut toggles the dialog
- cmdk built-in filtering searches across name, PM, department, pillar, stage

---

## Session 19 â€” 2026-06-03

**What was done:** Sprint 1 Item 2 â€” Pipeline approval automatically creates a project in Portfolio via shared React Context.

**Files updated:** `flowdeep-peekaboo/src/lib/projects-store.tsx` (new) آ· `flowdeep-peekaboo/src/routes/__root.tsx` آ· `flowdeep-peekaboo/src/routes/pipeline.tsx` آ· `flowdeep-peekaboo/src/routes/portfolio.index.tsx` آ· `SESSIONS.md`

**Changes:**

- Created `src/lib/projects-store.tsx` â€” `ProjectsProvider` + `useProjects()` hook; holds the shared projects list in React state and exposes `addProject`
- Wrapped `RootComponent` in `__root.tsx` with `<ProjectsProvider>` so all routes share the same state
- `pipeline.tsx`: added `itemToProject()` helper that maps a pipeline `Item` to a `Project` (name, PM, pillarâ†’tag, ROIâ†’budgetTotal, stage=Initiation, rag=blue); both approval paths call it â€” drag+confirm dialog AND per-role all-approved trigger
- `portfolio.index.tsx`: replaced local `useState<Project[]>` with `useProjects()` context; `New Project` dialog also calls the shared `addProject`

---

## Session 18 â€” 2026-06-03

**What was done:** Sprint 1 Item 1 â€” New Project dialog added to Portfolio page.

**Files updated:** `flowdeep-peekaboo/src/routes/portfolio.index.tsx` آ· `SESSIONS.md`

**Changes:**

- Added `NewProjectDialog` component with 9 fields: project name, business line, department, PM, client, stage, end date, budget ($M), tags
- New project is created with `rag: "blue"` (Not Started) and `progress: 0`, prepended to the portfolio grid immediately on submit
- Lifted `projects` array into `useState` in `PortfolioPage` so the grid updates live without a refresh
- Summary stat cards (Active, On Track, Budget Used, Critical) now compute dynamically from `projectList` state instead of static `portfolioSummary`
- "New Project" button placed in page header alongside existing "New Business Case" button

---

## Session 17 â€” 2026-06-02

**What was done:** 8 UI change requests from Edit Comments screenshots applied across Portfolio Project Detail and Pipeline.

**Files updated:** `flowdeep-peekaboo/src/routes/portfolio.$projectId.tsx` آ· `flowdeep-peekaboo/src/routes/pipeline.tsx` آ· `SESSIONS.md`

**Changes:**

- **Tender Packages â†’ New Request dialog**: Added Recommended Vendors multi-select (checkboxes from vendors list)
- **Add Subcontracted Package dialog**: Vendor field changed from free text Input to dropdown Select (from vendors list)
- **Initiation & Planning tab**: Added "Success Criteria" PlanningField after Out-of-Scope
- **Stage Gate Overview**: "View Stage Gates â†’" now opens a full Dialog â€” tabs per stage, each item toggleable done/not-done with assignable role Select + Add new checklist item per stage
- **Log Business Trip dialog**: Travelers changed from free text to multi-select checkbox list (project team members) with removable chips
- **Financial Planning tab**: Cost categories and Revenue plan converted from static arrays to state; Add Cost Entry dialog + Add Revenue Event dialog added
- **Pipeline Kanban**: Click vs drag detection â€” short pointer movement opens Business Case detail Dialog with full info + quick Approve/Reject buttons
- **Pipeline Approval Queue**: Per-role approval history (Department Head / Finance Director / Portfolio Director) with Pending/Approved/Rejected badges, per-role Approve/Reject dialogs with comment fields; when all roles approve â†’ item moves to Approved + navigates to Portfolio

---

## Session 16 â€” 2026-05-21

**What was done:** Full data entry for all Project Detail tabs â€” every tab now has real Add/Submit/Upload dialogs.

**Files updated:** `flowdeep-peekaboo/src/routes/portfolio.$projectId.tsx` آ· `product-spec.md` (v11) آ· `product-spec-patch-v11.md` آ· `SESSIONS.md`

**Changes:**

### portfolio.$projectId.tsx
- **Planning â†’ Initiation**: Save Changes button (Pencil icon, top-right of Project Summary card) â†’ `toast.success`
- **Planning â†’ Milestones**: State array + "Add Milestone" dialog (name, due date, owner, status select, depends on); table now driven by local state from seed data
- **Planning â†’ Subcontracted Packages**: State array + "Add Package" dialog (scope, vendor, value, period, status); KPI strip counts live from state
- **Planning â†’ Business Trips**: State array + "Log Trip" dialog (purpose, destination, dates, travelers, cost); KPI strip trips count live from state
- **`RisksIssuesTab` component** (new): Local state from seed RAID items + KPI strip (Open Risks, Open Issues, In Progress, Closed) + "Log Risk / Issue" dialog with Pأ—I live score banner (red/amber/green by threshold), type/title/probability/impact/owner/status fields, auto ID generation (R-NNN / I-NNN)
- **`DocumentsTab` component** (new): Local state from seed docs + "Upload Document" dialog with drag-drop drop zone (visual only), document name + category select, 800ms simulated upload spinner
- **`StatusReportsTab` component** (new): Local state from seed reports + "Submit Report" dialog (RAG select + narrative textarea); wired to header "Submit status" button via `externalOpen`/`onExternalOpenChange` props â€” dialog opens regardless of active tab; in-tab button shows next week number
- **`ChangeRequestsTab` component** (new): Local state from seed CRs + KPI strip (Under Review/Approved/Rejected) + "New Change Request" dialog (title, impact description, timeline delta, budget delta); defaults to Under review/amber
- **`ProcurementProjectTab` component** (new): Replaces one-line placeholder; KPI strip + Contracts table (CT IDs in accent, vendor/value/end/status) + Open RFPs table + "Open Procurement module" link â†’ /procurement route
- **`StakeholdersTab` component** (new): Local state from seed stakeholders + "Add Stakeholder" dialog (name, org, influence, interest, strategy) + table with colored influence/interest cells + 2أ—2 engagement matrix visual (quadrants filled with matching stakeholder names, live from state)
- **`LessonsLearnedTab` component** (new): Local state from seed lessons + "Add Lesson" dialog (category select + textarea); cards now show submitter name + when timestamp
- Added imports: `Plus`, `AlertTriangle`, `Upload`, `FileUp`, `Pencil`, `Link2` from lucide-react; `contracts`, `rfps` from mock-data

---

## Session 15 â€” 2026-05-21

**What was done:** Connect existing project/contract from View sheets آ· Portfolio working filters with tag chips on cards آ· Procurement inline bid entry.

**Files updated:** `flowdeep-peekaboo/src/routes/clients-vendors.tsx` آ· `flowdeep-peekaboo/src/routes/portfolio.index.tsx` آ· `flowdeep-peekaboo/src/routes/procurement.tsx` آ· `SESSIONS.md`

**Changes:**

### clients-vendors.tsx
- `ClientSheet`: Fixed React hooks-before-return bug (state now declared before early return). Added "Connect existing project" button in footer + empty-state link â†’ opens searchable project checklist Dialog (inside Sheet); selected projects merge with base-linked list; KPI strip Linked projects count updates live
- `VendorSheet`: Same fix + "Connect existing contract" button â†’ contract checklist Dialog; selected contracts merge with vendor's base contracts

### portfolio.index.tsx
- Added `ALL_RAGS`, `ALL_STAGES`, `ALL_TAGS`, `ALL_DEPTS`, `ALL_CLIENTS` as module-level constants derived from projects array
- `AllProjectsTab`: Added 6 filter states (`filterOpen`, `ragFilter`, `stageFilter`, `tagFilter`, `deptFilter`, `clientFilter`)
- Collapsible filter panel: RAG status chips (5), Stage chips (5), Tag chips (5), Department select, Client select, Clear All
- Filters button shows active count badge + teal tint when filters are on
- Active filter chips row below toolbar â€” each dismissible with X
- Empty-state when no projects match filters + "Clear all" link
- `useMemo` applies all 6 filters in sequence
- `ProjectGrid`: Added classification tag chip badges on each card (teal, above footer row)

### procurement.tsx
- Added `X` to lucide imports
- `<RfpSheet key={rfpView?.id}>` so local state resets when switching between RFPs
- `RfpSheet`: `localBidders` state initialized from `RFP_BIDDERS` lookup; all renders use local state (not static lookup)
- "Record bid" button top-right of bidder list header â†’ shows inline form: vendor name input + score input (0â€“100) + Add + Cancel
- Enter key submits the form
- Empty state when no bids: shows "Record first bid" link
- KPI strip Bidders count now reflects live `localBidders.length`

---

## Session 14 â€” 2026-05-21

**What was done:** Tender Packages interactive tab implemented in Project Planning â€” full Request â†’ RFP â†’ Proposals â†’ Award lifecycle.

**Files updated:** `flowdeep-peekaboo/src/routes/portfolio.$projectId.tsx` آ· `product-spec.md` (â†’ v10) آ· `product-spec-patch-v10.md` (new) آ· `SESSIONS.md`

**Changes:**
- `SEED_PACKAGES`: 4 seed packages spanning all statuses (Draft, Sent for Tendering, Proposals Received, Awarded)
- KPI strip: 4 live-computed cards (Draft Requests / In Tendering / Proposals Received / Awarded)
- `+ New Request` dialog: scope + estimated value â†’ creates Draft package
- `Send for Tendering` action: Draft â†’ Sent for Tendering, auto-generates RFP-0XX ID, toast to Procurement module
- Proposals Received packages expand inline via `ChevronRight/Down` toggle to show vendor proposal sub-rows
- Each proposal sub-row: vendor name + value, score progress bar (0â€“100), **Approve** (green tinted) + **Reject** (ghost) buttons
- Approve: package â†’ Awarded, vendor + auto-generated CT-2026-0XX contract stored, proposals cleared, toast
- Reject: removes vendor from proposals list, others remain, PM can approve another
- Type definitions: `TenderStatus`, `TenderProposal`, `TenderPackage` at module level
- React `Fragment` with key used for expandable sub-rows within `<TableBody>`
- spec: `product-spec.md` v9 â†’ v10, Tender Packages section fully rewritten with status lifecycle, KPI strip, actions-per-status table, expanded proposals spec, ASCII layout
- patch: `product-spec-patch-v10.md` created with full changed section + Figma Make design notes

---

## Session 13 â€” 2026-05-20

**What was done:** Master data association in Add Client/Vendor dialogs + all Procurement module CTAs wired to full interactive flows.

**Files updated:** `flowdeep-peekaboo/src/routes/clients-vendors.tsx` آ· `flowdeep-peekaboo/src/routes/procurement.tsx` آ· `product-spec.md` (â†’ v9) آ· `product-spec-patch-v9.md` (new) آ· `SESSIONS.md`

**Changes:**

### clients-vendors.tsx â€” Master Data Association
- `AddClientDialog`: optional project multi-select with search input + removable teal chips; shows RAG dot + stage badge per project; toast on save shows count of linked projects
- `AddVendorDialog`: optional contract checklist (ID + project + value + Active/Expiring badge) + removable chips; toast on save shows count of linked contracts
- If no selection made, entity created as standalone master record and can be linked later from sheets or project/contract forms

### procurement.tsx â€” Full Interactive Flows
- **"New RFP" header button** â†’ Dialog: Title, Type (RFP/RFI), Due date (required), Linked project (optional), Scope textarea; publishes to RFP list with auto-generated ID
- **"Open" per RFP row** â†’ right Sheet (RfpSheet): evaluation criteria with weighted progress bars, bidder list with scores, per-bidder "Award" button, status flow Open â†’ Evaluation â†’ Awarded, "Close RFP" action; terminal states hide all actions
- **"Open" per Contract row** â†’ right Sheet (ContractSheet): contract scope text, payment milestones with Paid âœ“ / Pending âڈ± / Overdue âڑ  states, "Renew Contract" â†’ nested dialog (extension period + notes), "Download PDF" â†’ toast, "Flag for Review" â†’ toast + close
- **"Sync now" (ERP tab)** â†’ Loader2 spinner + "Syncingâ€¦" for 1.8s â†’ updates PO count + last sync time â†’ success toast
- **"Use Nexus" / "Use ERP" (reconciliation)** â†’ resolves row (removes from list); all resolved â†’ green "All records in sync" empty state; Sync errors KPI updates live

---

## Session 12 â€” 2026-05-20

**What was done:** Enabled Client and Vendor "View" buttons â€” right slide-out Sheets with full detail and live data connections (Client â†’ Projects, Vendor â†’ Contracts).

**Files updated:** `flowdeep-peekaboo/src/routes/clients-vendors.tsx` آ· `SESSIONS.md`

**Changes:**
- `ClientSheet`: contact info (email, phone, industry), KPI strip (revenue/projects/contact), linked projects list filtered from `projects[]` by `client` field â€” each project card shows RAG dot + progress bar + stage badge + end date; clicking navigates to `/portfolio/:id` and closes sheet; empty state when no projects linked
- `VendorSheet`: star rating header, type/category badges, contact person, KPI strip (contracts/spend/eval), linked contracts filtered from `contracts[]` by vendor name â€” each contract shows status badge + value + "Open â†’ Procurement" link; 4-dimension evaluation scorecard (Delivery/Quality/Commercial/Support) with progress bars; empty state when no contracts
- Supplemental `CLIENT_DETAILS` and `VENDOR_DETAILS` lookup maps with email, phone, industry/contact person
- UX: Sheet slides in from right, project/contract cards are individually clickable, sheet closes on navigation, footer "Close" button

---

## Session 11 â€” 2026-05-20

**What was done:** Audited Lovable React app against v8 product spec, fixed 4 gaps, then implemented full resource allocation flows and pipeline drag-and-drop with validation.

**Files updated:** `flowdeep-peekaboo/src/routes/resources.tsx` آ· `flowdeep-peekaboo/src/routes/pipeline.tsx` آ· `flowdeep-peekaboo/src/routes/portfolio.$projectId.tsx` آ· `flowdeep-peekaboo/src/routes/clients-vendors.tsx` آ· `flowdeep-peekaboo/src/routes/procurement.tsx` آ· `SESSIONS.md`

**Changes:**
- **v8 gap fix #1** â€” Team & Allocation tab: replaced flat table with 3 sub-tabs (Manpower Planning, Team Members, Allocation Overview with utilization bars)
- **v8 gap fix #2** â€” Vendor/Subcontractor badge colors: Vendor â†’ rag-blue, Subcontractor â†’ role-exec (purple)
- **v8 gap fix #3** â€” Financial Planning: added Revenue Plan milestone-linked payment table
- **v8 gap fix #4** â€” Procurement ERP Sync: added out-of-sync reconciliation table with "Use Nexus" / "Use ERP" resolution buttons
- **Resource allocation flow** â€” `AssignDialog` from People tab (project picker, allocation slider, utilization preview) wired up
- **Resource request flow** â€” `RequestResourcesDialog` from Project Planning â†’ Requests inbox in Resources tab; RM can Fulfill (assign person + allocation) or Decline (reason required)
- **Pipeline Kanban drag-and-drop** â€” pointer events with `getBoundingClientRect()` hit-testing (HTML5 drag broken in Lovable iframe); `VALID_TRANSITIONS` map enforces stage rules; approval/rejection dialogs on drop; ghost card follows cursor
- **Add Resource button** â€” `AddResourceDialog` with name/role/dept/capacity/email fields; pool lifted to `useState` so headcount KPI, People tab, Heatmap, FulfillDialog all reflect additions live

---

## Session 10 â€” 2026-05-20

**What was done:**
Updated the FigJam board ("PMO SYSTEM RESEARCH") to reflect all v7 changes â€” IA section updated with 5 new module columns, User Flows section expanded with 14 new flows (13â€“26). Then wrote product-spec v8: Planning tab (7 sub-sections) for Project Detail Page, merged Vendors tab, and restructured Procurement to 5 tabs.

**Files updated:** FigJam board (external) آ· `product-spec.md` آ· `product-spec-patch-v8.md` (new) آ· `SESSIONS.md`

**Changes:**

### Information Architecture â€” PMO System (FigJam section)
- **Portfolio column** updated to v7 tabs: All Projects آ· My Projects آ· Archived آ· Business Cases آ· Governance History (removed old: Projects List, Approval Queue, Strategic Alignment, ROI Tracker, Risk Register)
- **Projects column** header renamed to "PROJECT DETAIL PAGE / /portfolio/:id"
- **5 new module columns added** (right of existing layout, section expanded to 3850px):
  - ًںڈ¢ Organization (Business Lines آ· Departments/Units آ· Tags & Classifications آ· Org Setup)
  - ًں¤‌ Clients & Vendors (Clients آ· Client Dashboard آ· Vendors آ· Vendor Approval Pipeline آ· Subcontractors آ· Performance Scoring)
  - ًں”€ Pipeline (Capital/Internal آ· Commercial/RFPs آ· All Unified View آ· Awaiting Decision آ· Intake Scoring)
  - âڑ ï¸ڈ Risk & Issues (Risk Register Portfolio آ· Risk Heatmap Pأ—I آ· Escalations+SLA آ· Issues Log آ· Trends & Analytics)
  - ًںڈ—ï¸ڈ Procurement [P2] (Vendor Tendering RFI/RFP آ· Contracts آ· Vendor Evaluation آ· ERP Sync آ· Subcontracted Packages)

### User Flows â€” Enterprise PMO System (FigJam section)
- Section expanded from 7200px â†’ 12000px height to accommodate new flows
- **14 new flow diagrams added** (Flows 13â€“26) across 5 new rows (y=5950 through y=10550):
  - Flow 13: Conditional Project Intake (Capital vs Commercial track split)
  - Flow 14: First-Time Organization Setup (Business Lines â†’ Departments â†’ Tags, setup guards)
  - Flow 15: Business Line Lifecycle (create, edit, deactivate with active-project guard)
  - Flow 16: Department Management (hierarchy, head notification, cross-dept tagging, deactivate guard)
  - Flow 17: Tag Lifecycle (create, apply, filter, delete with usage guard)
  - Flow 18: Add New Client (duplicate check, save, Business Case dropdown availability)
  - Flow 19: Client Dashboard Navigation (4 tabs: Active Projects â†’ slide-over, Pipeline, Revenue, Issues)
  - Flow 20: Vendor Onboarding & Approval Pipeline (create â†’ Under Evaluation â†’ Director approve/reject)
  - Flow 21: Subcontractor Registration (extra fields, insurance upload, milestone assignment, capacity warning)
  - Flow 22: Post-Project Vendor Evaluation (Closure trigger, 3-criteria scoring, low-score flag)
  - Flow 23: Client Prerequisite Enforcement (inline mini-create inside Business Case modal)
  - Flow 24: Vendor Tendering â€” Send RFI to Market (approved vendors only, deadline, track responses)
  - Flow 25: Contract Lifecycle (create, activate, payment milestone cost entries, renewal/expiry)
  - Flow 26: ERP Sync (manual vs auto-sync, status dots, out-of-sync alert, reconciliation export)

### product-spec.md â†’ v8
- **Clients & Vendors â€” Vendors tab**: Vendor + Subcontractor tabs merged into single "Vendors" tab with Type column (Vendor / Subcontractor), filter chips (All | Vendors | Subcontractors), type-conditional form fields
- **Project Detail Page â€” Planning tab** (new Tab 2, 7 inner sub-tabs):
  - Sub-tab 1: Initiation & Planning (objectives, scope, OKR link, project tags)
  - Sub-tab 2: Milestones & Dependencies (Gantt + recurring milestone modal for Maintenance projects â€” frequency, occurrence count, auto-generate)
  - Sub-tab 3: Manpower Requirements (role/qty/duration table, Request Resources â†’ PM's Team & Allocation)
  - Sub-tab 4: Subcontracted Packages (scope packages, Initiate Tender â†’ Procurement RFI/RFP)
  - Sub-tab 5: Business Trips Plan (trip table, per-diem budget, running total, approval workflow)
  - Sub-tab 6: Financial Planning (Cost Plan + Revenue Plan linked to milestones; distinct from Financials tab actuals)
  - Sub-tab 7: Tender Packages (project-scoped view of RFI/RFP, mirrors Procurement module filtered by project)
- **Team & Allocation (Tab 5)**: 3 inner sub-tabs added â€” Manpower Planning | Team Members | Allocation Overview
- **Procurement module**: fully restructured to 5 tabs â€” RFI/RFP Requests آ· Contracts آ· Vendor Evaluation آ· ERP Sync (new) آ· Subcontracted Packages cross-project view (new); removed old Vendor Directory + Sub-contractors tabs
- **product-spec-patch-v8.md** created â€” full patch for Figma Make incremental use, priority screen generation order included

---

## Session 9 â€” 2026-05-18

**What was done:**
Processed 2026-05-18 discovery meeting (MOM PM1, MOM PM2, Recorded Meeting transcript). Implemented all structural and feature changes confirmed in the meeting. Updated all 6 project files + created patch v7.

**Files updated:** `product-spec.md` آ· `product-spec-patch-v7.md` (new) آ· `InformationArchitecture.md` آ· `Research.md` آ· `Userflow.md` آ· `pmo-discovery-presentation.html` آ· `SESSIONS.md`

**Changes:**

### MAJOR: Portfolio + Projects Merge
- Removed `âڑ™ï¸ڈ Projects` sidebar item
- Portfolio gets 3 new tabs: **All Projects** (default), **My Projects**, **Archived**
- All Projects: Business Line filter chips (Software Solutions / EPC / Consultation / Maintenance) + Tags filter + **Gantt view** (portfolio-wide timeline)
- My Projects: scoped to logged-in user, default sort = Next Milestone Due
- Archived: read-only view + Restore action (Director only)
- Existing Portfolio tabs (Business Cases, Governance History) retained, renumbered to 4 & 5
- Business Line chip appears in Project Row (List View)

### MAJOR: Project Detail Page URL
- URL: `/projects/:id` â†’ `/portfolio/:id` (redirect in place)
- Breadcrumb: `Portfolio > Projects > [Name]` â†’ `Portfolio > [Name]`
- Header: now shows Business Line chip + Tags alongside project name
- All 14 project tabs unchanged

### NEW: Organization Module (آ§6.7) â€” internal structure
- New sidebar item: `ًںڈ¢ Organization`
- 3 tabs: **Business Lines** آ· **Departments** آ· **Tags & Classifications**
- **Business Lines:** configurable list with color tags; used as filter chips in Portfolio. Defaults: Software Solutions / EPC / Consultation / Maintenance
- **Departments:** org units with cross-project tagging support (one project â†’ multiple depts)
- **Tags & Classifications:** customizable project labels for advanced filtering (Portfolio / Pipeline / Reports)
- Updated HTML `ia.m3` from Projects â†’ Organization (Business Lines / Departments / Tags)

### NEW: Clients & Vendors Module (آ§6.8) â€” external parties
- New sidebar item: `ًں¤‌ Clients & Vendors`
- 3 tabs: **Clients** آ· **Vendors** آ· **Subcontractors**
- **Clients:** full-page Client Dashboard per client (Active Projects / Pipeline / Revenue History / Issues & Escalations); prerequisite before linking project to a client; Total Revenue visible to Finance role only
- **Vendors:** approval pipeline (New â†’ Under Evaluation â†’ Approved / Inactive), compliance document upload, performance scoring (quality / timeline / communication â†’ 0â€“5 stars aggregate)
- **Subcontractors:** vendor subtype with additional evaluation (specialization, insurance, capacity)
- Added HTML `ia.m7` block for Clients & Vendors (EN + AR T object keys)

### NEW: User Flows 14â€“23 (Organization + Clients & Vendors â€” complete end-to-end)
- **Flow 14:** First-time Organization setup â€” Business Lines â†’ Departments â†’ Tags (guided onboarding, setup banner, prereq guards)
- **Flow 15:** Business Line lifecycle â€” create, edit color, deactivate (with active-project blocking guard)
- **Flow 16:** Department management â€” hierarchy (parent/child), head assignment, cross-dept project tagging, deactivate guard
- **Flow 17:** Tag lifecycle â€” create, apply to project (inline + detail header), filter in Portfolio, delete with usage-count guard
- **Flow 18:** Add New Client â€” duplicate check, inline mini-form available from Business Case modal, error states
- **Flow 19:** Client Dashboard navigation â€” all 4 sub-tabs (Active Projects â†’ slide-over â†’ project, Pipeline â†’ Pipeline module, Revenue History â†’ Finance only, Issues & Escalations â†’ RAID Log)
- **Flow 20:** Vendor onboarding & approval pipeline â€” create â†’ Under Evaluation â†’ Director approves/rejects â†’ available in procurement; blocked from selection if not Approved
- **Flow 21:** Subcontractor registration â€” additional evaluation fields (specialization, capacity, insurance), assignment to project scope package milestone, capacity warning
- **Flow 22:** Post-project vendor performance evaluation â€” Closure stage trigger, 3-criteria scoring (quality/timeline/communication), score aggregation, low-score flag, skip/defer handling
- **Flow 23:** Client prerequisite enforcement â€” PM tries Commercial project with no client â†’ inline mini-create inside Business Case modal, or defer â†’ draft saved â†’ return flow

### Procurement sidebar fix + clarification table
- `ًںڈ—ï¸ڈ Procurement` re-added to sidebar (was accidentally dropped in Session 9 edits)
- Distinction table added to آ§10.5: Pipeline = Client Tendering آ· Clients & Vendors = vendor master data آ· Procurement = Vendor Tendering (RFI/RFP/contracts/ERP)

### NEW: Procurement flows (Flows 24â€“26)
- **Flow 24:** Vendor Tendering â€” send RFI to market (create, send to approved vendors, track responses per vendor, close with decision notes)
- **Flow 25:** Create & manage a contract (vendor selection, payment milestones, contract lifecycle Active/Expired/Under Renewal, Finance Manager payment tracking with auto cost-entry creation)
- **Flow 26:** ERP sync for procurement entries (manual PR/PO entry vs. auto-sync from ERP API; sync status dots, out-of-sync alert, Finance Manager reconciliation export)

### Business Case Form Updates
- Added **Business Line** (required dropdown, from Organization)
- Added **Client** (required for Commercial/External track)
- Added **Tags / Classifications** (optional multi-tag)

### Milestones: COC for External Projects
- New `Certificate of Completion (COC)` toggle per milestone (Commercial/External projects only)
- Milestone locked from "Complete" until client-signed COC is uploaded
- COC upload â†’ triggers Milestone Revenue recognition entry in Project Financials

### Project Financials: Business Trips + Milestone Revenue
- **3 standardized cost categories:** Staff / Resources آ· Procurement / Tools آ· **Business Trips** (new)
- Cost entries category dropdown uses these 3 categories
- Summary: 3-segment donut chart + burn rate split by category
- **New sub-tab: Milestone Revenue** (Commercial/External only) â€” milestone-linked revenue recognition table (Pending / Recognized / Overdue)

### Resources: Excel Import + Capacity + Allocation Model
- `â†‘ Import from Excel` button in Team Directory (Tab 3)
- New capacity fields per person: Max working hours/day آ· Max allowed overtime
- **Allocation vs Assignment** formally documented: Planning Team allocates capacity â†’ PM assigns specific tasks from allocated pool
- PM's project view (Team & Allocation tab) shows only people allocated to that project

### Procurement Updates
- **Two tendering types** formally distinguished: Client Tendering (Pipeline stage) vs Vendor Tendering (during project execution)
- **RFI type added** (Request for Information â€” market price research, no commitment) alongside existing RFP
- **ERP integration:** PR/PO number sync, amount pull-through for budget tracking
- **Vendor approval pipeline** detailed: New â†’ Under Evaluation â†’ Approved/Inactive
- **Performance scoring** after each project engagement (quality/timeline/communication)

### HTML Presentation IA: Pipeline + Procurement added
- Added `ia.m8` (Pipeline) block: Capital/Internal آ· Commercial/RFPs آ· Awaiting Decision آ· Kanban Board آ· Intake Scoring
- Added `ia.m9` (Procurement) block: RFI/RFP Requests آ· Contracts آ· Vendor Evaluation آ· ERP Sync آ· Subcontracted Packages
- Both added to EN and AR `T` objects with full Arabic translations
- HTML now reflects all 9 IA modules: Dashboard آ· Portfolio آ· Organization آ· Resources آ· Financials آ· Risk & Issues آ· Clients & Vendors آ· Pipeline آ· Procurement

---

## Session 8 â€” 2026-05-18

**What was done:**
Added Project Summary Slide-Over spec to Portfolio Overview (آ§7.1). Clicking a project card now opens a 480px right panel with key metrics instead of navigating directly to the project. Updated product-spec.md to v6, created patch v6.

**Files updated:** `product-spec.md` آ· `product-spec-patch-v6.md` (new) آ· `SESSIONS.md`

**Changes:**

### Project Summary Slide-Over â€” آ§7.1 Portfolio Overview
- Replaced "Clicking card â†’ navigates to `/projects/:id`" with the slide-over interaction pattern
- 480px right-anchored panel opens on card click â€” user stays in Portfolio
- Panel sections: RAG + % complete آ· Budget Burn (planned vs actual + variance) آ· Top 3 Risks (score-sorted, open/escalated only) آ· Last Status Report excerpt (200 chars) with [View full â†—] آ· Next Milestone + days remaining countdown
- Footer: `[Open Full Project â†’]` â†’ navigates to `/projects/:id`
- Overlay behavior: semi-transparent backdrop (40%), Esc to close, backdrop click to close, 200ms slide animation
- RBAC: Budget section hidden from PMs on projects they don't own
- Empty states defined for both risks ("No critical risks") and status report ("No report submitted yet")
- Same 480px slide-over component pattern as Risk Detail Panel (آ§10.6) for design consistency

---

## Session 7 â€” 2026-05-17

**What was done:**
Added Risk & Issues as a standalone sidebar module with full portfolio-wide risk monitoring spec. Moved Approval Queue from Portfolio â†’ Pipeline (new Sub-Tab D: Awaiting Decision). Replaced Portfolio Tab 5 with Governance History (read-only decisions audit trail).

**Files updated:** `product-spec.md` آ· `product-spec-patch-v5.md` (new) آ· `InformationArchitecture.md` آ· `Research.md` آ· `Userflow.md` آ· `pmo-discovery-presentation.html` آ· `SESSIONS.md`

**Changes:**

### New: Risk & Issues Module (آ§10.6 in product-spec.md)
- Standalone sidebar item: `âڑ ï¸ڈ Risk & Issues` after Financials, badge = critical risk count
- 5 tabs: Risk Register (portfolio-wide aggregated table) آ· Risk Heatmap (Pأ—I 3أ—3 matrix) آ· Escalations (SLA countdown) آ· Issues (cross-project) آ· Trends (12-week charts)
- Risk Register: full filter bar, sortable table, Risk Detail Panel (480px slide-over), bulk export
- Risk Heatmap: cell click â†’ drills into filtered Risk Register
- Escalations: L1/L2 badges, live SLA timers, Acknowledge/Push actions
- RBAC: Executive (aggregate only) آ· Portfolio Director (full) آ· PM (own projects only) آ· Finance/Resource (no access)

### Approval Queue: Portfolio â†’ Pipeline > Sub-Tab D
- New Pipeline Sub-Tab D: "Awaiting Decision" â€” all items pending approve/reject/defer
- Inline action buttons per row: [Approve] [Request Revision] [Defer] [Reject]
- Bulk actions: Approve/Reject/Revise Selected
- Days Waiting urgency indicator (amber > 5, red > 10)
- Director navigates: Pipeline > Awaiting Decision (was: Portfolio > Approval Queue)

### Portfolio Tab 5: Approval Queue â†’ Governance History
- Read-only decisions audit trail: Approved / Rejected / Deferred with outcomes
- Columns: Proposal Name, Track, Decision, Decided By, Date, Score, Outcome (current project RAG), Actual ROI

### HTML Updates
- IA section: `ia.m2.i4` updated to "Governance History" (EN) / "ط³ط¬ظ„ ظ‚ط±ط§ط±ط§طھ ط§ظ„ط­ظˆظƒظ…ط©" (AR)
- IA section: New Risk & Issues module block (ia.m6) added after Financials
- T object: both EN and AR keys added for ia.m6.hdr + ia.m6.i1â€“i5

---

## Session 6 â€” 2026-05-17

**What was done:**
Cross-checked PM's `PMO _ High-Level Features List.docx` against all project files. Found one internal conflict (Document Repository misplaced in Research.md Won't Have) and two genuine additions (Microsoft Project + Salesforce integrations). Fixed all gaps and created patch v4.

**Files updated:** `Research.md` آ· `product-spec.md` آ· `InformationArchitecture.md` آ· `Userflow.md` آ· `product-spec-patch-v4.md` (new) آ· `SESSIONS.md`

**Changes:**

- **Research.md** â€” Removed "Document management or version control" from Won't Have (was a leftover from v1, already fixed in other files). Added Document Repository to Should Have (Phase 2). Clarified "CRM" item to note Client Portal is Phase 2 scoped access. Added Microsoft Project + Salesforce + Slack + Teams to Integration Hub summary line.
- **product-spec.md** â€” Added Salesforce integration entry to Settings > Integrations (Commercial/RFP track sync). Updated version header v3 â†’ v4 and added v4 row to version table.
- **InformationArchitecture.md** â€” Added Microsoft Project and Salesforce to Settings > Integration Hub connected systems list.
- **Userflow.md** â€” Flow 11 Stage 5 CLOSE: expanded Lessons Learned tags from "project type/category" â†’ "project type, team, and theme" (portfolio-wide pattern analysis).
- **product-spec-patch-v4.md** (new) â€” Full patch file for v3â†’v4 with context, before/after diffs, Figma Make design notes, and confirmation table of PM features already correctly specced.

**Not changed (correct already):**
- `pmo-discovery-presentation.html` â€” Document Repository already in Should Have, Won't Have correct
- `Stakeholder_Interview_Guide.docx` / `Stakeholder_Interview_Guide_AR.docx` â€” Research methodology, no feature list to reconcile

---

## Session 5 â€” 2026-05-14

**What was done:**
Added Pipeline module (pre-approval intake funnel) and updated the budget model from single "Cost Type" radio to dual CAPEX + OPEX independent fields across all files.

**Files updated:** `product-spec.md` آ· `product-spec-patch-v3.md` (new) آ· `InformationArchitecture.md` آ· `Research.md` آ· `Userflow.md` آ· `pmo-discovery-presentation.html` آ· `SESSIONS.md`

**Changes:**

### New Module â€” Pipeline (آ§7.5)
- New sidebar nav item: `ًں”€ Pipeline` between Portfolio and Projects, with amber DoA badge
- Two sub-tabs: **Capital/Internal** (Strategic Score, CAPEX/OPEX, DoA stages) and **Commercial/RFPs** (Win Probability, Bid Score, Revenue)
- Third sub-tab: **All** â€” unified table with Type chip prepended
- View toggle: Kanban Board â†” Data Table per sub-tab
- 4 summary widgets: Total Pending, Pipeline Value, Total Requested Budget, Pending Your Sign-off
- Kanban columns (Capital): Draft â†’ Under Review â†’ Scoring â†’ Awaiting DoA â†’ Deferred
- Kanban columns (Commercial): Qualification â†’ Bid/No-Bid Decision â†’ Commercialization â†’ Submitted
- Auto-transition rules: Capital Approved â†’ Project Workspace created (Initiation); Commercial Won â†’ Project Workspace created; Rejected/Lost â†’ Archived
- Pipeline RBAC: PM (own), Portfolio Director (all + Approve/Reject/Defer), Finance Manager (Capital read-only), Executive (widgets only)
- `+ Add to Pipeline` button â†’ Conditional Intake Modal

### Budget Model Update â€” CAPEX + OPEX
- Removed: "Cost Type: radio (CapEx / OpEx / Mixed)" from Business Case form
- Added: Two independent fields â€” CAPEX Amount (one-time) + OPEX Amount/Year (recurring annual)
- Total Budget = auto-calculated CAPEX + OPEX (read-only)
- Applied across: Business Case form (Section 2), Pipeline Kanban cards, Pipeline Data Table, Financials Tab 2
- Financials Tab 2: dual donut charts (CAPEX vs OPEX absolute + % split) + updated table with 9 columns

### New Patch File
- Created `product-spec-patch-v3.md` â€” Figma Make patch for v2â†’v3, covering all 4 change areas with ASCII mockups and design notes

---

## Session 4 â€” 2026-05-14

**What was done:**
Set up product-spec versioning system. Created `product-spec-patch-v2.md` covering all changes from Sessions 2+3. Added version tracking header to `product-spec.md`. Updated `CLAUDE.md` with versioning rules for future sessions.

**Files updated:** `product-spec.md` آ· `product-spec-patch-v2.md` (new) آ· `CLAUDE.md` آ· `SESSIONS.md`

**Changes:**
- Created `product-spec-patch-v2.md` â€” full patch file for v1â†’v2, covering all 9 change areas from Sessions 2+3. Structured for direct use with Figma Make.
- Added version table header to `product-spec.md` (Current version: v2, version history table)
- Updated `CLAUDE.md`: added Product Spec Versioning rules (when to create patches, structure of patch files)

---

## Session 3 â€” 2026-05-14

**What was done:**
Read the discovery meeting recording (`Pmo Discovery Recording Meeting 5-13-2026.docx`) and synced all 5 project files.

**Files updated:** `Research.md` آ· `InformationArchitecture.md` آ· `Userflow.md` آ· `product-spec.md` آ· `pmo-discovery-presentation.html`

**Changes:**

### Correction
- **RAG Thresholds** â€” corrected across all files based on client-confirmed values from meeting:
  - Green: <3% schedule variance (was â‰¤5%)
  - Amber: 3â€“5% (was 5â€“15%)
  - Red: >5% (was >15%) â€” configurable, default 5%

### New Additions
1. **Conditional Intake Flow (Must Have)**
   - Intake now splits on project type: Capital/Internal â†’ Business Case form | Commercial/External â†’ RFP Qualification (Bid/No-Bid)
   - Both tracks merge into standard lifecycle after DoA approval
   - Added: Flow 13 in Userflow.md, conditional modal in product-spec.md, ftr.m11 in HTML

2. **Client Portal (Phase 2)**
   - External read-only access for clients: Milestones + RAG + RAID Log (external-safe only)
   - No financials, no internal team data, no profit margins visible
   - Time-limited project-scoped token (not full login)
   - New role: `CLIENT` (Indigo #6366F1)
   - Added: Persona 6 in Research.md, Client Portal section in IA.md, آ§13.5 in product-spec.md, ftr.s9 in HTML

3. **Procurement Module (Phase 2)**
   - New sidebar module: Vendor Directory, Sub-contractor Management, Contracts, Vendor Evaluation
   - Added: Research.md آ§5 + MoSCoW, IA.md nav + Module 6, product-spec.md آ§10.5, ftr.s10 in HTML

4. **Gantt drag-and-drop** â€” explicitly added as a required spec for the Milestones tab (product-spec.md)

5. **Float** â€” added to competitive landscape in Research.md as primary UX reference for resource capacity visualization

**Pending from meeting:** Client has not yet shared official Business Case or Project Charter templates. Will map fields to digital forms once received.

---

## Session 2 â€” 2026-05-12

**What was done:**
Deep sync from `PMO _ Discovery.docx` â€” identified 14 content gaps and 5 contradictions vs existing files. Updated all 5 files.

**Files updated:** `Research.md` آ· `InformationArchitecture.md` آ· `Userflow.md` آ· `product-spec.md` آ· `pmo-discovery-presentation.html`

**Changes:**
- Added **Persona 5 â€” Finance Manager** across all files
- Added **JTBD 9â€“10** (Finance Manager scenarios)
- Updated **Business Case scoring to 5 weighted criteria** (Strategic Alignment 30%, Business Value 25%, Urgency 20%, Effort 15%, Dependencies 10%)
- Added **"Deferred" state** to project intake approval decisions
- Added **Project Workspace Tabs 8â€“13**: Charter Builder, RACI Builder, Stage Gates, Change Requests (expanded), Stakeholder Communications, Documents
- Added **Finance Manager Dashboard view** (آ§6.5 in product-spec.md)
- Added **SLA escalation timers** (L1=24h, L2=48h) â€” Flow 2 Step 3b in Userflow.md
- Added **Flow 11** (PMO 5-stage lifecycle) and **Flow 12** (Finance Review & Budget Alert)
- Added **PMO System Flow section** (`id="pmo-flow"`) in HTML between Pillars and Architecture
- Added **6 Product Design Questions** to Next Steps section in HTML
- Added **Section 1.4 PMO Operational Flow table** in product-spec.md
- **Contradiction resolved:** Document Repository moved from Won't Have â†’ Phase 2 consistently across all files

---

## Session 1 â€” 2026-05-10

**What was done:**
Created `product-spec.md` â€” the master product design specification for Nexus PMO SaaS.

**Files created:** `product-spec.md`

**Contents of the new file:**
- Product vision, positioning, and 6 PMO pillars
- Full design system: color tokens, typography, spacing, glassmorphism, motion specs
- App shell: left sidebar (260px/60px), top header, FAB
- Auth flow: Login, Forgot Password, First-Time Setup Wizard
- RBAC: 11 default roles, 70 granular permissions across 7 domains, role inheritance model
- Role-specific Dashboard views (Executive, Portfolio Director, Resource Manager, Project Manager, Finance Manager)
- All 8 modules fully specced with screens, tabs, filters, modals, and table columns
- 10+ Global components: Command Palette, Modals, Toasts, Side panels, Data table spec
- Notification engine with RACI routing matrix
- MoSCoW feature prioritization (Phase 1/2/3)
- RTL (Arabic) design rules appendix
- Persona-to-screen access matrix

## Session — 2026-09-21 (Risk deletion guard for linked issues)

- A risk that has been converted to / linked with an issue can no longer be deleted.
- RiskRegisterTab (src/components/risk/RiskIssues.tsx) now derives `hasLinkedIssue` from the issues list and, when deleting a linked risk, shows a warning toast ("Cannot delete risk / This risk has a linked issue. Resolve or delete the issue first.") instead of opening the delete confirm dialog.
- Verified on /portfolio/p-001 Risk & Issues tab (risk R-091 linked to issue I-044).
