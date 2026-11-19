## 2026-11-19 — Leave summary cards removed from Capacity
- Employee Details → Capacity: the three summary cards (Annual entitlement, Leave used, Days remaining) are gone from both the Capacity and Leave records subtabs. The tab now opens straight on the Capacity / Leave records switch, then the year selector and the table. Removed the now-unused KpiCard import, the vacationBalance import and the vacation value; the leave calculations themselves are untouched.
- Verified in the preview on EMP-001: none of the three labels appear on either subtab, the Capacity table renders all 12 months with no leftover gap, and the typecheck passes.

## 2026-11-18 — Outside-allocation task list: name above dates, row separators

## 2026-11-18 — Dashboard open requests also use DS date format

## 2026-11-18 — Team assign dialogs use DS date format (dd MMM, yyyy)

## 2026-11-18 — Seniority hidden from Employee Info
- Removed the Seniority field from the Employee Details → Employee Info card so the grid shows nine fields in a clean 3×3 layout (Phone number, Email, National ID, Date of birth, Hiring date, Employee ID, Role, Department, Employment type). Seniority stays available in the employee add/edit form.
- Verified in the preview on EMP-001: the label no longer appears, the other nine fields render with no gap, and there are no page errors.

## 2026-11-18 — Delete leave confirmation
- Employee Details → Capacity → Leave records: the row trash button no longer deletes immediately. It opens the shared DS02 danger ConfirmDialog titled "Delete this leave record?" with the record's type, from/until dates and days (or hours) listed, plus Cancel / Delete. Only Delete removes the entry and shows "Leave removed". Arabic copy added for the new title and description.
- Verified in the preview on EMP-001: dialog shows the record details, Cancel keeps all 4 rows, Delete leaves 3.

## 2026-11-18 — Employee Details empty states
- Added shared DS02 empty states for Employee Info, Salary, Capacity, Leave records, Projects & allocation, Assigned tasks and Trips. Real empty data shows the appropriate state and actions; the topbar empty-state preview can also review every tab without changing employee data.

## 2026-11-18 — Employee Capacity split into inner tabs
- Employee Details → Capacity now keeps the year selector and annual leave KPIs above two DS02 inner tabs: Capacity and Leave records. The monthly capacity table and leave register retain their existing actions and calculations.

## 2026-11-18 — Request drawer Outcome redesign
- Outcome lists assigned people; hover/focus swaps allocation card (project share from Full/Part time, total utilization, over-allocation note). Removed duplicate Assigned section and allocation row.

## 2026-11-17 — Capacity column renamed to Available Capacity
- The employee Capacity tab column header now reads "Available Capacity" instead of "Available" (Arabic: "السعة المتاحة"), matching the Suggested wording. Header cell wraps normally, so the longer label does not clip or shift the hour values underneath. Verified in the preview on EMP-001.

## 2026-11-17 — WBS requests reuse the Team role-request popup
- "Role not in the team? Request new role" now opens the shared Team Request role popup instead of the old reduced WBS form. Request for is locked to Specific task, Task is locked to the item that opened it, and Employees needed is locked to 1; role, seniority, employment, priority and notes remain editable.
- Added "Pick from the team instead" below Notes to return to the team-member picker. Submitted requests keep the task's exact dates and the entered priority/notes, and appear in Team → Requests and Resources. Added explicit disabled-select display text so locked values show their labels.
- Verified in the preview on Site device rollout: all three fixed fields were disabled, the return link worked, and a Business Analyst request with notes saved and appeared in Requests. Added a default-value test; full suite passes.

## 2026-11-17 — Assignee naming in the WBS schedule
- Renamed the staffing affordance from role to assignee: the row action menu now reads "Add Assignee" / "Edit Assignee", the dialog title matches, the schedule column header is "Assignee" (also in the Columns show/hide menu), and the request-mode field label reads "Assignee" with placeholder "Select an assignee". Helper copy about requesting a role is unchanged. Verified in the preview: menu item, dialog title, Columns menu entry and header all show the new wording, with no leftover "Role" header.

## 2026-11-17 — Allocation-period warning moved to its own popup
- The out-of-window notice in "Assign to task" no longer sits inline in the dialog. Clicking Assign with an out-of-period task now closes the picker and opens a separate confirmation popup listing the affected tasks and dates, with Cancel and "Assign anyway"; assigning proceeds unchanged. Verified in the preview on Mei Chen (allocated 2026-10-01 → 2026-11-30) with "Stabilisation & Optimisation" (ends 2026-12-11): the popup appeared, "Assign anyway" assigned the task and the card count rose from 3 to 4.

## 2026-11-17 — Team tasks popup: progress percentage removed
- Dropped the right-hand progress percentage from every row of the "Member · Tasks" popup; rows now show only the task name and its planned date range. Task progress data itself is untouched and still shows elsewhere.

## 2026-11-17 — Removed Assign to task reassignment hint
- Dropped the amber "Currently assigned to …; it will be reassigned." line from the Assign to task dialog; the dialog now shows only the Tasks multi-select and Cancel/Assign. Reassignment still happens silently on Assign.

## 2026-11-17 — Team multi-task assignment
- Team card Assign to task now uses the shared multi-select field and assigns every selected task to the same member in one schedule update. English and Arabic copy supports singular and plural results.

## 2026-11-16 — Requests Has employees filter
- Added the supplied searchable checkbox design (All / With employees / Without employees) to Requests. Presence is derived from assigned people, including partially fulfilled Pending requests and legacy single assignments, independently of Status. Added three logic tests; no records or statuses changed.

## 2026-11-16 — Requests Project and Role filters
- Added searchable multi-select Project and Role to the Resources Requests drawer shown by the user; both combine with Status, Priority and search. Employment Types filters remain available separately. Added a combined request-filter test.

## 2026-11-16 — Employment Types filters
- Added searchable multi-select Role; combined Project and Role selections must match the same linked employee. Added role and combined-filter tests.
- Added Has employees (All / With employees / Without employees) and searchable multi-project filters in the shared drawer. Project filtering derives type membership from employees' assigned projects and allocations; counts remain the total linked employees. Added four filter logic tests.

## 2026-11-16 — Requests Period display
- Swept request details, Fulfill, Team Requests and employee request-task references to reuse precise period display; drawer retains its inline arrow. New WBS and Team requests preserve actual dates separately from staffing buckets. No settled records or allocation calculations changed.
- Added precise demo display values to Solution Design (5h 30m), Site Mobilisation (11h), and UAT Execution (43h across two dates) so the new behavior is visible on the first Requests page; staffing allocation buckets are unchanged.
- Same-day precise periods show one ISO date and hours/minutes; different-day periods show stacked actual dates with exact values and available duration in the shared hover tooltip.
- Legacy month-only ranges remain unchanged; date-only data does not invent hours. Added tests for 5h 30m, 11h, midnight crossing, and 16/40/43 recorded work hours.

## 2026-11-16 — Employees filter drawer matches supplied designs
- Six groups in order: Assigned Projects, Job role, Seniority level, Employment type, Department, Status; removed the duplicate project-presence filter.
- All groups support multiple selections; the first five are searchable with an All reset. Status offers plain Active/Inactive checkboxes without search. Shared Apply/Cancel draft behavior retained.
- Added employee filter tests and scoped PageToolbar options so other module filters keep their existing behavior.

## 2026-11-15 — Team Requests: actions replace the status pill on hover
- The Requests table's Status column is now the last column and hosts the row actions: at rest it shows the status pill, on row hover the pill steps aside for Edit/Delete (shared `TableRowActions` `statusNode` pattern, same as Organization).
- Fulfilled and Declined rows keep the pill only — hovering them shows no actions.

## 2026-11-15 — Employee tabs, capacity working days, WBS Role+Assignee, Team card actions, editable pending requests
- Employee Details: Salary and Capacity tabs now sit right after Employee Info; Absence days column removed from the Capacity table; Set capacity popup adds "Working days in month" (default 20) used to prorate absence.
- WBS: Assignee column merged into Role (name on top, role below, no headcount number since one role per function); Add/Edit role in the row menu is always available without Change Plan, like Progress update.
- Project Team: task count opens a popup of that member's tasks; new card button (secondary variant) assigns the member to another task; Pending requests (no one assigned yet) can be edited or deleted.

## 2026-11-15 — Employee Details: removed header capacity and certification badges
- Removed the **Capacity / month** badge and the **Certified** tag from the employee header, leaving the remaining tags such as **Senior** in place.
- Monthly capacity remains available in the header metrics grid and Capacity tab; underlying employee data is unchanged.

## 2026-11-15 — Employee Details: clarified monthly vs yearly utilization
- Renamed the two header metrics to **Utilization for this month** and **Yearly average utilization** (Arabic: الاستغلال لهذا الشهر / متوسط الاستغلال السنوي), following the supplied reference.
- Kept the cards compact without secondary period lines. Calculations and color thresholds are unchanged.

## 2026-11-15 — Employee Details: "Vacation remaining" replaced by "Average utilization"
- The header metric grid's last card now shows the year's **Average utilization** instead of the vacation balance, so the card keeps its slot and the grid stays 4 × 2.
- `averageUtilization()` in `src/lib/employee-finance.ts` is the mean of each month's effective utilization across the months the employee was already hired — months before joining are excluded, idle months inside the year count as 0. Tone follows the same >100 red / >90 amber thresholds as the monthly card.
- EN/AR labels added (`Average utilization` / `متوسط الاستغلال`); the now-unused `Vacation remaining` key was dropped from both dictionaries. Vacation data itself is untouched and still lives on the Capacity tab (Annual entitlement / Leave used / Days remaining + Leave records).
- Verified in preview on EMP-001: header reads `Average utilization 112%`, no `Vacation remaining` anywhere; Capacity tab still shows `Annual entitlement` and `Leave records`. Tests: `src/lib/employee-finance.test.ts` 10 pass.

## 2026-11-15 — Employees: "Related Projects" renamed to "Assigned Projects"
- Employees table column header, its Filter-drawer group, and the count popup caption now read "Assigned Projects", matching the employee profile's existing "Assigned projects" section.
- `relatedProjectsGroup()` in `src/components/ds/filters.ts` takes an optional `label` (default still "Related Projects"), so Organization, Clients & Vendors and Meeting Types keep their master-data wording.
- Verified in preview: header reads `Assigned Projects`, drawer group is `Assigned Projects` with no `Related Projects` left on the page, popup shows `Sara Al-Rashid (Assigned Projects)`.

## 2026-11-15 — Team tab: designed empty states for both sub-tabs
- Team sub-tab now has two conditions. Nothing asked for yet → `people` art, "No team members yet". Requests open but nobody assigned → `clock` art, "Waiting on Resources" with the pending count, plus a "View requests" button that jumps to the Requests sub-tab.
- Requests sub-tab gets its own copy and `note` art: "No requests yet" / "Ask Resources for people — for the whole project, a specific task, or a period of time." It previously reused the Team description and `role` art.
- `teamEmptyVariant()` in `ProjectTeamTab.tsx` picks the variant; the sub-tab `Tabs` is now controlled (`value`/`onValueChange`) so the empty state can switch sub-tabs. Catalogued as `project-team-members` / `project-team-waiting` / `project-team-requests` in `src/lib/empty-states.ts`.
- Verified in preview: p-003 (no requests) shows the two distinct empty states; p-004 shows "Waiting on Resources — 2 requests are with Resources…" and "View requests" switches to the Requests sub-tab; p-005 (declined request only) shows "No team members yet".

## 2026-11-12 — Requests period dates stacked, "Submitted On" label
- Requests table Period column shows `from` and `until` on separate lines (arrow removed); the table cell is `whitespace-nowrap` so a date never breaks at its hyphen. The request drawer keeps the single-line `from → until` format.
- Label rename only, values untouched: table header and drawer row `Submitted by` → `Submitted On`. The drawer keeps its separate `Submitted` date row.
- Verified in preview: header reads `Submitted On`, Period cell is 75px wide with `2026-12` / `2027-04` on two clean lines, drawer shows `2026-12 → 2027-04` on one line.

## 2026-11-12 — Requests: quantity label, single/multi Fulfill picker, selection carousel, big demo pool
- Requests table second line shows `4x Mid` (no "0 / 4 filled"); Fulfill summary drops the filled count too.
- Fulfill uses a normal searchable dropdown when one person remains; multi-select only when more are needed.
- Options read `Name - Sr PM 60%` (`employeeShortTitle`); selected people show as a left/right scrollable pill carousel, clicking one switches the utilization card.
- ~96 demo employees across 12 specialisms (storage v13).

## 2026-11-12 — Multi-person Fulfill
- Fulfill dialog: multiselect assign, candidates filtered to the request's job role, capped at remaining headcount; each option shows period utilization before → after; over-allocation warns but allows.
- Request drawer: new "Assigned (N/M)" section with progress bar, avatar/name/role/utilization per person, each opening the employee profile; per-person utilization stored in `utilByPerson`.
- Fulfill dialog: restored the Peak utilization / After this assignment card; it follows the most recently selected person.
- Demo: RR-031 asks for 4 Full time Frontend Developers on Customer Portal v3; five demo Frontend Developers added (two already partly allocated); employees storage v12.
- MultiSelectField gained optional `max`, `renderOptionMeta`, `emptyText`.

## 2026-11-11 — Team tab split into Team / Requests sub-tabs (Risk & Issues style segmented control)

## 2026-11-11 — Employees carry a seniority level
- `Employee.seniority?` (Junior / Mid / Senior / Lead — the same four levels resource requests use) is now part of the employee record, with `SENIORITY_LEVELS` exported from `src/lib/employees-store.ts` so the form and the request dialog can't drift apart.
- Add / Edit Employee (Employment info section) gains an optional **Seniority** select directly after Job role; the value saves with the other fields and prefills when editing.
- The employee profile's Employee Info rows show **Seniority** between Role and Department (Arabic: الخبرة). Demo employees are seeded with a level, so storage key bumped to `pmo.employees.v11`.
- Tests in `src/lib/employee-seniority.test.ts`: the levels list, and every demo employee holding a valid level.

## 2026-11-11 — Employment types list opens its employees
- The Employees count in Organization → Employment Types is now a clickable number: it opens a centered popup titled with the type name and lists that type's employees (avatar or initials, name, role, chevron), scrollable past 8 rows; a type with no employees shows a plain muted 0 and stays inert.
- Clicking a name in the popup closes it and opens that employee's profile (`/resources/employees/$employeeId`), the same destination used by the Employees table, Team cards and trip travelers.
- Popup subtitle (employee count) stays screen-reader only per the DS02 rule that popup subtitles are hidden globally.

## 2026-11-11 — Requests table column Type renamed to Request for
- The project Team tab's Requests table header now reads **Request for** (same label as the dialog field) instead of Type, and its values read **Project / Task / Period** instead of Team / Task, matching the three options the request dialog offers. Arabic: الطلب لـ with المشروع / مهمة / الفترة.
- Same wording applied to the Resources → Requests table header and the Fulfill dialog summary line, so both registers agree.
- `ResourceRequest.coverage?: "project" | "task" | "period"` records what the request was raised for (the dialog passes it through); `requestCoverage()` derives it for older rows from scope/task, so period requests are distinguishable from full-project ones. Test in `src/components/project-team.test.ts`.

## 2026-11-11 — Team requests table gains a Notes column
- The project Team tab's Requests table now shows the note typed in **Request role** (Role / Type / Task / Employment / Priority / **Notes** / Status), muted text that wraps up to 288px and "—" when empty, so the note is readable where the request was raised instead of only inside Resources (request drawer + Fulfill dialog).

## 2026-11-11 — Team card status reads Active / Inactive
- Project Team cards now use the shared `StatusPill` (green Active / amber Inactive) instead of the custom "Working now" / "Not working now" outline pill, so the Team tab matches the status wording and styling used in the Employees, Clients & Vendors and Organization lists. Arabic labels follow the employee profile ("نشط" / "غير نشط").
- Same derived rule underneath: a member is Active while they hold a task in progress (task dates + progress), Inactive otherwise (`isWorkingNow` unchanged).

## 2026-11-11 — Role requests carry a headcount (employees needed)
- `ResourceRequest.quantity?` (default 1) + `assignees?: string[]`; helpers `requestQuantity` / `requestAssignees` in projects-store. Request role dialog (Team tab) gains an "Employees needed" number field (1–99).
- Fulfill assigns one person per action and appends to `assignees`; the request stays **Pending** until all seats are filled (statuses unchanged), showing "n / N filled" in the Team tab requests table, Resources requests table, Fulfill dialog and request drawer. Already-assigned people are excluded from the Fulfill dropdown.
- `projectTeam` counts assignees of partially filled requests too, so filled seats join the Team immediately. Manpower Planning demand = FTE × quantity, supply = FTE × filled seats; Skill Demand counts only remaining seats. Seed: RR-030 (Smart Grid Pilot, 3 × QA Engineer). Tests: `src/lib/resource-demand.test.ts`, `src/components/project-team.test.ts`.

## 2026-11-11 — Employees list gains project and job role filters
- Resources → Employees filter drawer now carries **Project name** and **Job role** multi-select groups (`projectNameGroup` / `jobRoleGroup` in `src/components/ds/filters.ts`, applied through `matchAnySelected`: empty selection = all, otherwise any selected value matches).
- Job role options come from the Organization Job roles lookup plus any role still carried by an employee, so retired/renamed roles stay filterable; project options come from the portfolio project names.
- Seed fix: one employee allocation referenced the literal "Self-Service BI" instead of project `p-021`, leaving that employee's Related Projects unlinked (store key bumped to `pmo.employees.v10`). Tests: `src/lib/employee-list-filters.test.ts`.

## 2026-11-11 — Employment types gain optional description
- `EmploymentType.description?` in employees-store; Add/Edit dialog has an optional textarea, the list shows a muted Description column ("—" when empty), and search matches description too — matching the other Organization lookup lists. Seeded types carry demo descriptions (store key bumped to `pmo.employees.v9`).

## 2026-11-11 — Approved change requests show new baseline version
- `ApprovalRequest.baselineVersion` set on approval (first = V5 after demo V4); outcome banner shows "New baseline: V5". Milestone gates unaffected. Test: `src/lib/nextBaselineVersion.test.ts`.

## 2026-11-10 — Tab strip scrollbar hidden, arrows are the only affordance
- Added unlayered `.no-scrollbar` (styles.css) because the global unlayered `* { scrollbar-width: thin }` beat Tailwind's layered `[scrollbar-width:none]` utility; `ScrollableTabs` now uses it, so the tab row shows only edge fades + arrow buttons.

## 2026-11-09 — Employee profile back link honors the Team tab
- Team cards carry `from=team&projectId`, so Employee Details shows "Back to team" and returns to that project's Team tab; arriving from the Employees list still shows "Back to Employees" (`src/lib/employee-back.ts`, `src/routes/resources_.employees.$employeeId.tsx`, `src/components/ProjectTeamTab.tsx`, `src/routes/portfolio.$projectId.tsx`).

## 2026-11-09 — Team-based staffing
- Added project Team tab (team from fulfilled requests, Working now / Not working now from task dates, request list) and Request role dialog (Full time / Part time).
- WBS Add role now picks a team member (name + role) or requests a new role dated by the task.
- Resource requests carry scope (Team/Task) and employment; Fulfill defaults to 100% / 50%.

## 2026-11-09 — Resources data aligned with Team-based staffing
- Fulfill dialog: removed the free Allocation slider; allocation is fixed by the request (Full time 100% / Part time 50%), utilization preview uses the peak over the request period. Removed the unused direct-assign dialog.
- Demo data: request seeds carry scope/employment with valid FTE (1 / 0.5); employee allocations reseeded as 100%/50% periods matching fulfilled requests; list utilization derived from allocations (storage v7).
- Utilization Heatmap now shows real monthly allocation % per year; Manpower Planning and Skill Demand are derived from requests and employees (`src/lib/resource-demand.ts`), with tests.

## 2026-11-05 — Work calendar Yearly view restored to month cards

- `src/components/EmployeeWorkCalendar.tsx`: replaced the project×month chip table in the Yearly view with the previous 12-card grid — each card shows the month name, utilization % (red with a red-tinted border when over 100%), a stacked per-project bar, allocated vs available hours, absence days, and the per-project percentage split.
- Added a `MonthStats` type and a `monthStats(monthKey)` prop so the cards reuse the same `employeeMonth` figures as the Salary/Capacity tabs; the route (`src/routes/resources_.employees.$employeeId.tsx`) passes `(m) => employeeMonth(employee, m)`.
- The project/leave/weekend legend now renders only in the Monthly view; the yearly empty state is unchanged.

## 2026-11-05 — Temporary baseline-popup gallery removed

- Deleted `src/routes/validations-preview.tsx`: the nine Save-baseline popups it collected were transferred to Figma, and nothing in the app linked to the route (no sidebar entry, no button, no `Link`), so removal changes no user-facing surface.
- Kept the pattern: a hidden static route that mirrors the real confirm-dialog card and lists every popup of a module side by side, rebuilt on request for other modules and deleted the same way.
- `src/routeTree.gen.ts` regenerated on its own; the route file was the only thing removed.

- 2026-11-05: Baseline save checks now also block circular dependencies and schedule items outside project start/end dates (portfolio.$projectId.tsx, lib/schedule-validation.ts + test).
## 2026-11-04 — Save baseline: summary step removed, confirmation pop-up only
- Change Plan no longer opens the "Save new baseline (vN)" review dialog with its per-section change tables; clicking Save baseline now goes straight to the DS02 confirmation pop-up — "Save a new baseline?" / "This will be the active baseline once it's approved. Current version will be the available version until approval." with Cancel / Save baseline.
- The diff logic that dialog carried moved out of the component into module-level `computeBaselineChanges(baselineSnapshot, currentMilestones, extraChanges)`, and `buildBaselineChangeRequest()` in the route assembles the same ChangeRequest payload, so the approvals detail (Project Info / Project Schedule / Cost / Revenue tables) is unchanged — the review simply happens in the Change Requests module instead of before saving.
- Validations still gate the pop-up: the "Fix before saving the baseline" box keeps listing every blocker first, so nothing became saveable that wasn't before.
- The schedule tab's `setCrDialogOpen` prop became `onRequestBaselineChange`, wired to `requestSaveBaselineChange`, so its approval-gated change path runs the same validation → confirm flow.
- Verified in the preview: edit → Save baseline → the pop-up shows only the two lines above; confirming raises "New baseline sent for approval", switches the header to "Waiting for Approval", and the request appears in Change Requests with its Project Info detail (Name: ERP System Upgrade → ERP System Upgrade II).
- Left as-is deliberately: the first baseline on an unlocked project still saves immediately (no approval involved), so the pop-up's approval wording would not apply there.

## 2026-11-04 — Change Plan Save baseline always clickable; validation dialog lists all errors incl. "No changes".

## 2026-11-04 — Trips tab: heading moved into the pinned period slot
- Trips now reads like Projects & allocation: the `Trips` heading renders in the shared slot row under the tab line (left) beside the year stepper (right), and the duplicate heading inside the tab body was removed, which is what left a full-width empty band above the table.
- Tab body is now just the trips table (`min-w-0`, no extra heading row), so the table starts directly under the slot row.
- Verified in the preview: Trips heading sits at x=280/y=581 with the stepper at x=1374/y=577 — the exact coordinates the allocation heading and stepper occupy — and the table begins at y=647 with no gap.

## 2026-11-04 — Employee tabs: one date control per screen
- Projects & allocation no longer shows the tab-header year: the work calendar already carries its own month/year stepper, so the two date controls were stacked one above the other and repeated the same period.
- The calendar's stepper stays fully bounded by the available years and rolls the year itself (December steps into January of the next year), so nothing was lost by dropping the header copy; the header year remains on Salary, Capacity and Trips, which have no control of their own.
- Verified in the preview: allocation shows only `October 2026`; three forward steps land on `January 2027` and Salary/Capacity/Trips follow to 2027; those three tabs keep their single header year.

## 2026-11-04 — Employee tabs: year control anchored to the divider line
- The tab divider moved from TabsList to the row that holds the tabs and the year control, so the line now runs the full width instead of stopping short of the year; TabsList is overridden with `border-b-0` (resolved by `cn`/tailwind-merge).
- The year control dropped its `xl:pb-1` lift and took the same 40px height as the tab triggers, so its text sits on the same baseline as the tab labels and its bottom is flush with the line.
- Verified in the preview: line spans to the year control's right edge, active underline stays continuous, and the line still renders on the tabs that carry no year (Employee Info, Assigned tasks).

## 2026-11-04 — Header tiles: utilization share moved beside its bar
- The Utilization tile now renders its stacked bar and its percentage on one line (bar flexes, number stays right) instead of the number above a full-width bar, so every one of the eight header tiles carries exactly a label line plus a 20px content line.
- Non-bar tiles switched from wrapping to truncating their value, which keeps a long figure (e.g. `160h / 153.6h`) from adding a second line and breaking the row.
- Measured in the preview: all eight tiles are 64px tall with identical 20px content rows; no overlap or clipping.

## 2026-11-04 — Projects & allocation: table removed, share shown beside project names
- Dropped the Assigned projects table from the employee profile's Projects & allocation tab; the work calendar is now the tab's only content, so the allocation figures are no longer repeated in two places.
- EmployeeWorkCalendar takes the employee's allocation spans and prints each project's percentage next to its name in the legend (e.g. `ERP System Upgrade 58%`); the share is resolved for the period on screen — the month in Monthly view, the whole year in Yearly — so the number always matches the grid being read.
- Verified in the preview: legend reads 58% / 38% in both views, no Assigned projects table remains (only the header count tile keeps that label).

## 2026-11-04 — Add trip drawer: travelers dropdown + field distribution
- Travelers is now the shared MultiSelectField dropdown (no inline name list): trigger shows removable chips, popover lists checkbox rows with a "N selected / Clear all" footer.
- MultiSelectField popover fixed to render at the field's own width (`w-[var(--radix-popover-trigger-width)]` — the old `w-[--var]` form silently ignored it) and rows switched from nested buttons to `div[role=option]` to keep the markup valid.
- Add trip body re-sectioned into Travelers / Trip details / Destination / Dates / Costs with hairline dividers, plus a live Cost per traveler and Total cost summary; body now spreads its sections across the full drawer height (even 18px gaps, no empty band above the footer). Verified 620px drawer, 571px dropdown on 571px field.


## 2026-11-04 — Employee over-utilization alert moved into tab row (right), dismissible with X; resets on year change.

## 2026-11-04 — Removed employee over-utilization alert and Trips hint text.
- 2026-11-04: Change Request approval blocked when a deleted schedule item received actuals after submission (src/lib/cr-conflicts.ts).
- 2026-11-05: Added temporary /validations-preview page with all Save baseline validation popups for Figma handoff (to be deleted).
- 2026-11-09: Employee profile Assigned tasks tab now uses the shared PageToolbar (search + Filter drawer) instead of an inline search + project dropdown.

## 2026-11-09 — Project Team cards
- Team tab shows members as cards with avatar (uploaded photo or initials), member count pill, and click-through to the employee profile.
- Demo data: added 4 employees and 10 fulfilled team requests so ERP System Upgrade has a 12-member team (allocations mirror requests, 100%/50%).
- ERP demo plan: added a current "Stabilisation & Optimisation" phase (Oct–Dec 2026) with one active task per team member so Team cards show Working now.

## 2026-11-10 — Project tabs overflow (temporary)
- Project detail tab row: hidden scrollbar, edge fades and left/right arrow buttons via new ScrollableTabs.

## 2026-11-11 — Request role coverage
- Team tab Request role dialog: "Request for" Full project / Specific task (task dropdown) / Period of time (start & end dates); dates saved on the request.

## 2026-11-17 — Team assign: soft warning when task dates fall outside the member allocation period (non-blocking, "Assign anyway").

## 2026-11-17 — Team demo: Sara full project, Mei Chen period (Oct–Nov 2026), Omar Haddad specific task; task-only members have no + assign button.
- 2026-11-17: Allocation-period warning now uses shared DS02 ConfirmDialog (warning tone).
