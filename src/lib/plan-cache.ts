/**
 * In-memory cache of each project's working plan (schedule + financials),
 * written by the project detail route so other pages (e.g. the Change Request
 * review page) can render the same plan read-only.
 */
export const PLAN_CACHE = new Map<string, unknown>();
