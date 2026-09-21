# Risk & Issues row interaction update

## What will change
- Remove the View icon from the Issues table.
- Open the Issue details side drawer when the user clicks anywhere on an Issue row, matching the Risk table.
- Move Status to the final column in both Risk and Issues tables.
- Show the row actions in place of the Status badge on hover or keyboard focus, matching the Organization table behavior.
- Keep action clicks isolated so Edit, status update, and Delete do not also open the details drawer.

## Technical details
- Extend the shared table-row actions presentation to accept each table's own status badge while preserving existing Organization behavior.
- Update the shared Risk & Issues table component, so the behavior applies both in the standalone module and inside project details.
- Update the session log and verify the build plus both table interactions in the preview.
