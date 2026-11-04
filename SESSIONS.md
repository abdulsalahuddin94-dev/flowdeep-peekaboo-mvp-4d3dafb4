## 2026-11-04 — Add trip drawer: travelers dropdown + field distribution
- Travelers is now the shared MultiSelectField dropdown (no inline name list): trigger shows removable chips, popover lists checkbox rows with a "N selected / Clear all" footer.
- MultiSelectField popover fixed to render at the field's own width (`w-[var(--radix-popover-trigger-width)]` — the old `w-[--var]` form silently ignored it) and rows switched from nested buttons to `div[role=option]` to keep the markup valid.
- Add trip body re-sectioned into Travelers / Trip details / Destination / Dates / Costs with hairline dividers, plus a live Cost per traveler and Total cost summary; body now spreads its sections across the full drawer height (even 18px gaps, no empty band above the footer). Verified 620px drawer, 571px dropdown on 571px field.

