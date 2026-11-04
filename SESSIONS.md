## 2026-11-04 — Projects & allocation: table removed, share shown beside project names
- Dropped the Assigned projects table from the employee profile's Projects & allocation tab; the work calendar is now the tab's only content, so the allocation figures are no longer repeated in two places.
- EmployeeWorkCalendar takes the employee's allocation spans and prints each project's percentage next to its name in the legend (e.g. `ERP System Upgrade 58%`); the share is resolved for the period on screen — the month in Monthly view, the whole year in Yearly — so the number always matches the grid being read.
- Verified in the preview: legend reads 58% / 38% in both views, no Assigned projects table remains (only the header count tile keeps that label).

## 2026-11-04 — Add trip drawer: travelers dropdown + field distribution
- Travelers is now the shared MultiSelectField dropdown (no inline name list): trigger shows removable chips, popover lists checkbox rows with a "N selected / Clear all" footer.
- MultiSelectField popover fixed to render at the field's own width (`w-[var(--radix-popover-trigger-width)]` — the old `w-[--var]` form silently ignored it) and rows switched from nested buttons to `div[role=option]` to keep the markup valid.
- Add trip body re-sectioned into Travelers / Trip details / Destination / Dates / Costs with hairline dividers, plus a live Cost per traveler and Total cost summary; body now spreads its sections across the full drawer height (even 18px gaps, no empty band above the footer). Verified 620px drawer, 571px dropdown on 571px field.

