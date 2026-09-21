# Schedule row actions and popup editing

## What will change
- Make the schedule table read-only for milestone/task fields; editing starts only from the row action menu.
- Add a fixed actions column at the end of every schedule row with a square three-line menu button.
- Replace the right-click menu entirely with the row menu.
- Show these actions in order: Add subtask, Edit, Add dependency, Add financial link, Progress update, Delete.
- Keep approval-gate rows protected and keep plan-lock rules applied to actions that change the plan.

## Edit popup
- Reuse the existing milestone/task popup for Edit.
- Include Parent in that same popup for both tasks and milestones, with top-level and valid parent choices.
- Exclude the edited item and its descendants from parent choices to prevent cycles.
- Preserve the existing task-only and milestone-only fields, validation, date boundaries, financial links, and approval settings.
- Remove the separate Change parent popup and its state.

## Interaction details
- Add subtask opens the existing task creation popup with the selected row as parent.
- Add dependency, Add financial link, and Progress update open their existing popups directly.
- Delete keeps the current confirmation and descendant-delete behavior.
- Locked schedules keep Progress update available; plan-changing actions prompt the existing Change Plan guidance.

## Verification and records
- Verify the row menu, popup-only editing, parent changes, action order, locked-state behavior, and delete confirmation in the live preview.
- Confirm the project builds cleanly and prepend the change to the session log.
