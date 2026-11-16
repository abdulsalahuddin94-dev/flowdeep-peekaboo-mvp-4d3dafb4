import { requestAssignees, type ResourceRequest } from "./projects-store";

export function matchesRequestEmployees(request: Pick<ResourceRequest, "assignees" | "assignedTo">, selected: string[]) {
  return selected.length === 0 || selected.includes(requestAssignees(request).length > 0 ? "with" : "without");
}