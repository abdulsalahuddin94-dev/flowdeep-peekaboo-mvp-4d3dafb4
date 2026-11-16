type LinkedEmployee = { employmentTypeId: string; projects: string[]; allocations: { project: string }[] };

export function matchesEmploymentTypeEmployees(id: string, employees: LinkedEmployee[], presence: string, projects: string[]) {
  const linked = employees.filter((employee) => employee.employmentTypeId === id);
  if (presence === "with" && linked.length === 0) return false;
  if (presence === "without" && linked.length > 0) return false;
  return projects.length === 0 || linked.some((employee) => [...employee.projects, ...employee.allocations.map((allocation) => allocation.project)].some((project) => projects.includes(project)));
}