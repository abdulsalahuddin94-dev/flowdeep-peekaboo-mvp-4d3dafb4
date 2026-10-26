export function matchesProjectTypes(selected: readonly string[], projectType: string): boolean {
  return selected.length === 0 || selected.includes(projectType);
}