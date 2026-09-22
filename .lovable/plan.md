# Standardize Date Display Formats

## Goal
Apply one date-display rule across Nexus PMO:

- With year: `DD MMM, YYYY` — example: `22 Sep, 2026`
- Without year: `DD MMM` — example: `22 Sep`

## Implementation
1. Add shared date-format helpers so every screen uses the same output and gracefully handles empty or invalid values.
2. Replace user-visible date formatting across all MVP screens, tables, drawers, dialogs, cards, tooltips, and schedule views.
3. Keep database values, calculations, URL values, and native date-picker values in ISO format (`YYYY-MM-DD`); only the visible label changes.
4. Update shared date controls so selected dates display consistently wherever they are reused.
5. Add the official rule and examples to the canonical Design System and DS02 changelog.
6. Prepend a session-log entry, complete the roadmap items, and verify representative desktop/mobile and EN/AR views.

## Technical Details
- Use English three-letter month abbreviations as specified (`Jan`–`Dec`) in both layout directions.
- Zero-pad the day (`01`–`31`).
- Avoid timezone shifts for date-only ISO values by parsing them as calendar dates rather than UTC timestamps.
- Preserve month-only, date-time, and machine-readable values unless they are rendered as a user-facing calendar date.