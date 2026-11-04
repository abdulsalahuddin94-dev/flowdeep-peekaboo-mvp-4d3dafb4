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

