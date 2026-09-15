# Dependency predecessor type selector

## Changes
- Add a radio choice above the predecessor dropdown: **Predecessor Task** and **Predecessor Milestone**.
- Default the choice to **Predecessor Task** whenever the popup opens.
- Filter the dropdown to show only tasks or only milestones based on the selected radio option.
- Clear any selected predecessor when switching the type to prevent retaining an invalid hidden choice.

## Validation
- Confirm both radio options filter the dropdown correctly.
- Confirm the default and reset behavior, then check the preview build.
