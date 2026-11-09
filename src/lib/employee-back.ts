export type EmployeeBackTarget = { kind: "team"; projectId: string } | { kind: "employees" };

/**
 * An employee profile opened from a project's Team tab goes back to that team,
 * not to the employee list — the reader came from the project, not from Resources.
 */
export function employeeBackTarget(search: { from?: string; projectId?: string }): EmployeeBackTarget {
  if (search.from === "team" && search.projectId) return { kind: "team", projectId: search.projectId };
  return { kind: "employees" };
}
