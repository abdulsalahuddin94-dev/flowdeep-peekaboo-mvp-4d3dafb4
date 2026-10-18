# Project architecture rules

- Keep schedule health derived from item dates and progress, not manually stored, so WBS and Gantt always agree.
- Navigate linked-action counts through the project route's tab and actionRef search parameters, with a removable Action Tracker filter, so project and portfolio registers share the same destination.
- Meeting type options come from the Organization lookup store, persisted like other local master data; renames propagate to meeting records and unavailable types remain readable on existing meetings.
