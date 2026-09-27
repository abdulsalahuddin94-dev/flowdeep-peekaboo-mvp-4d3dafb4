# Schedule dependencies and health demo

## What will change
- In **Progress Update → Task details**, replace the single truncated “Depends on” value with a compact dependency list that shows each predecessor and its relationship/lead-lag value.
- Keep the details area tidy for five or more dependencies using a bounded, scrollable list and a visible dependency count.
- Add one demo task with five valid predecessors so the layout can be reviewed immediately.

## Schedule Health
- Update **Schedule health** to show three clear states across both the WBS rows and Gantt bars:
  - **On Track** — green
  - **Off Track** — amber
  - **Overdue** — red
- Define Overdue as an unfinished item whose end date has passed; use progress-versus-planned variance for Off Track; all remaining items are On Track.
- Add the three states to the Gantt legend while Schedule health is enabled.
- Update the existing schedule demo dates/progress only where needed so all three states are visible together without changing real user-created data.

## Verification and records
- Verify the five-dependency task details and all three Schedule Health colors in the live project schedule.
- Check WBS and Gantt behavior at the current desktop viewport, confirm the build is clean, and prepend the change to `SESSIONS.md`.
