type LinkedEmployee = { employmentTypeId: string; role?: string; projects: string[]; allocations: { project: string }[] };

export function matchesEmploymentTypeEmployees(id: string, employees: LinkedEmployee[], presence: string, projects: string[], roles: string[] = []) {
  const linked = employees.filter((employee) => employee.employmentTypeId === id);
  if (presence === "with" && linked.length === 0) return false;
  if (presence === "without" && linked.length > 0) return false;
  if (projects.length === 0 && roles.length === 0) return true;
  return linked.some((employee) => (roles.length === 0 || roles.includes(employee.role ?? "")) && (projects.length === 0 || [...employee.projects, ...employee.allocations.map((allocation) => allocation.project)].some((project) => projects.includes(project))));
}