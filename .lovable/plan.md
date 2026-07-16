# Extend Baseline & Change Request concept to all Project Details tabs

Currently Project Schedule tab has:
- Version dropdown (v1…vN + "Current")
- Change Plan toggle (locks/unlocks editing)
- Editing banner + keyboard shortcuts (Esc / ⌘S)
- Change Request dialog with grouped diffs + approvers
- Compare-with-Current for historical versions

We will apply the **same UX** to three more tabs, each with its **own independent** baseline, versions, and CR history:

- Project Charter
- Team & Allocation
- Financials

Project Schedule stays as-is (it's already the reference implementation).

---

## Approach: shared shell, per-tab state

Extract the reusable chrome into a single component so each tab only supplies its data + diff formatter:

```
src/components/BaselineShell.tsx
  props:
    tabKey: "charter" | "team" | "financials"
    versions: { version: number; createdAt: string; author: string }[]
    activeVersion: "latest" | `v${n}`
    onChangeVersion(v)
    editMode: "viewing" | "editing"
    onEnterEdit() / onCancelEdit() / onSubmit()
    changeCount: number
    children  // the tab body, which reads a BaselineContext to know if locked
```

`BaselineContext` exposes `{ locked: boolean; tabKey }` so child inputs can render read-only chips vs editable controls, mirroring the Schedule behavior.

Each tab keeps its **own** local state:
- `charterVersions`, `charterEditMode`, `charterDraft`, `charterBaseline`
- `teamVersions`, `teamEditMode`, `teamDraft`, `teamBaseline`
- `finVersions`, `finEditMode`, `finDraft`, `finBaseline`

A shared `ChangeRequestDialog` (already in the file) is generalized to accept a `diffRows` array so each tab computes its own diff:

- Charter: title, sponsor, objectives, success criteria, scope in/out, assumptions, constraints
- Team & Allocation: member add/remove/role change, FTE change per role in Manpower Plan
- Financials: budget lines (CapEx/OpEx), forecast rows, contingency %

Approver selection stays the same per-CR (multi-select of stakeholders).

---

## What's editable without a CR

Same principle as Schedule (progress + assignee swap don't need CR). Per tab:

- **Charter**: nothing — every field is CR-guarded (this is the contract).
- **Team & Allocation**:
  - No-CR: reassigning a specific person to an already-approved role slot (swap of names within same role/FTE)
  - CR-required: adding/removing roles, changing FTE, changing skill level
- **Financials**:
  - No-CR: forecast re-estimates within ±5% of baseline for the current period
  - CR-required: baseline budget changes, adding/removing budget lines, contingency changes

---

## UI additions per tab (same as Schedule)

1. Header row with:
   - `Current Version (vN) ⭐` dropdown showing `date · by Author`
   - `Change Plan` button (turns into `Send Change Request` / `Cancel` while editing)
   - Historical versions show `📖 View Only` + `Compare with Current`
2. Amber "You're editing" banner with change counter and shortcut hints
3. Discard confirmation on Esc when there are unsaved edits
4. Grouped diff summary in the CR dialog
5. Approver multi-select in the CR dialog

---

## Files to touch

- `src/components/BaselineShell.tsx` — new: dropdown + banner + shortcuts + shared context
- `src/components/BaselineChangeRequestDialog.tsx` — new: generalized version of Schedule's CR dialog (accepts `diffRows` + `approvers`)
- `src/routes/portfolio.$projectId.tsx`:
  - Wrap Charter tab in `<BaselineShell>` and add per-field lock/unlock, draft state, diff builder
  - Wrap Team & Allocation similarly (Manpower Plan + Team Members subtabs)
  - Wrap Financials similarly (budget + forecast tables)
  - Refactor Schedule's existing CR dialog to reuse the new generalized dialog (behavior unchanged)

Mock data: each tab seeds 2–3 prior versions with plausible authors/dates so the dropdown and Compare view feel real.

---

## Out of scope

- Overview, Status Reports, Documents, Lessons Learned, Risks, Procurement, Business Trips, Stakeholders (not requested)
- Real backend persistence — versions/CRs live in component state as with Schedule
