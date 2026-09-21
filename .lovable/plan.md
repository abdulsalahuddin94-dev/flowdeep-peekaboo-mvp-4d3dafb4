# Edit dependency flow

## Scope
- Add an Edit icon beside each dependency in the View Dependencies popup.
- Open the dependency form prefilled with the selected predecessor, relationship type, and lead/lag.
- Save edits through the existing schedule update path and preserve dependency impact handling.
- When dependency-driven dates are locked in the item Edit popup, show: “Computed from dependency. Remove it to edit directly”.
- Verify editing, deletion confirmation, and locked-date guidance in the preview.

## Technical details
- Reuse the existing dependency dialog and schedule dependency model rather than introducing a second editor.
- Keep DS02 icon-button styling and accessible labels/tooltips.
- Update the session log and confirm the preview build is clean.
