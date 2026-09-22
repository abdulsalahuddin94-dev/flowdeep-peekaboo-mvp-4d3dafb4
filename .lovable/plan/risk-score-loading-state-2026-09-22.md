# Risk score loading state

## What will change
- Show a compact spinner and “Calculating…” inside the Score field while the score badge response is pending.
- Hide the severity badge until the response completes, then show the calculated score and badge normally.
- Re-run the loading state whenever Probability or Impact changes and prevent stale responses from replacing newer selections.
- Keep the existing score calculation as the temporary response source so the UI works now and can be connected to the API later.
- Update the session log and verify the popup in the preview.

## Technical details
- Keep the loading behavior local to the shared Risk form, so it applies in both the standalone module and project details.
- Use an accessible loading indicator with an `aria-live` status and preserve the field’s fixed dimensions to avoid layout shifting.
