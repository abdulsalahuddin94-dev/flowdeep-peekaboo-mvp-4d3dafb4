# Project Overview Card-Level Empty States

## Overview
- Keep the existing two-column Overview layout and all six cards visible in empty mode.
- Replace only each card's content with a compact empty state while preserving its title, footprint, and position.
- Add tailored empty copy and existing DS02 artwork for Risks Summary, Stage Gates, Project Health, Next Milestones, Budget Status, and Recent Activity.
- Use the global empty-state preview switch to show all six card-level states together; keep normal populated content unchanged.

## Technical details
- Add six project Overview entries to the shared empty-state catalog.
- Extend the shared empty-state renderer with a compact, unframed card-content variant so it does not create nested cards.
- Wrap each Overview card body independently rather than wrapping the full Overview layout.
- Keep artwork responsive and sized for each card; reuse the existing cohesive illustration set, so no new images are required unless a missing visual role is discovered during implementation.

## Validation
- Verify the normal Overview remains unchanged.
- Enable empty preview and confirm every card remains visible in the original two-column layout with its own empty content.
- Check desktop and mobile layouts, current build status, and record the change in the session log.
