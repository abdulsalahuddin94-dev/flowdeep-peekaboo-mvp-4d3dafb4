# Project Grid and Baseline Lifecycle

## What will change

1. **Responsive project cards**
   - Keep three cards per row at normal desktop widths.
   - Switch to four cards when the available viewport is wider than 1690px.
   - Switch to five cards at 2030px and above.
   - Preserve the existing mobile and tablet behavior.

2. **Two project lifecycle stages**
   - New projects start unlocked and fully editable across Schedule, Cost, and Revenue.
   - Their actions menu shows: `Edit Basic Info`, `Save Baseline`, and `Delete Project`.
   - Saving the baseline snapshots and locks the project plan.
   - Locked projects, including ERP System Upgrade, show only `Change Plan` and a disabled `Delete Project`.
   - Remove `Update Status` from the three-dot menu; the existing `Submit status` button remains.
   - Change Plan temporarily unlocks planning edits, then submits them through the existing approval flow.

3. **Version and approval indicators**
   - Place `Pending` and `Waiting for Approval` indicators immediately to the left of the version dropdown.
   - Restyle both as compact DS02 status indicators with consistent height, spacing, iconography, and semantic colors.
   - Keep Change Plan submission and cancellation actions accessible while editing.

## Technical details

- Use Tailwind arbitrary min-width breakpoints for the 1690px and 2030px grid thresholds.
- Derive edit permissions from the project baseline lock instead of treating every current version as locked.
- Keep the demo ERP project pre-baselined while newly created projects begin without a baseline.
- Reuse the existing schedule snapshot, version selector, and approval request flow rather than creating a second workflow.
- Verify the unlocked and locked action menus, planning editability, status placement, and card counts at representative viewport widths.