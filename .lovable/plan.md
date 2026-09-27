# Align Approvals with DS02

## Goal
Bring the Approvals page into the same visual and interaction pattern as Resources, Organization, and the other updated modules without changing approval logic.

## Changes
- Replace the custom header controls with the shared page header and DS02 toolbar.
- Add search across request title, project, requester, and approval type.
- Move project, inbox view, status, and request type filtering into the standard filter drawer.
- Replace stacked approval cards with the shared table pattern, semantic status pills, hover row actions, empty row, and standard pagination.
- Keep request context accessible by opening a details drawer from the row, including change summary, approvers, decisions, comments, and reminders.
- Keep Approve, Reject, and Remind available from the table/detail view using existing approval behavior.
- Restyle the decision popup with the standard DS02 form-dialog structure and preserve required rejection comments.
- Preserve URL-based project filtering and all existing links, dates, notifications, and role-based approval rules.

## Verification
- Check pending-on-me, all-pending, and history filters.
- Check project deep-link filtering, search, pagination, row details, approve/reject validation, and reminders.
- Verify the page visually at the current desktop viewport and confirm a clean build.
- Record the change in `SESSIONS.md` and the DS02 changelog.
