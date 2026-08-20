import type { FilterGroup, MultiFilterGroup } from "@/components/ds/PageToolbar";

/*
 * DS02 standard filter groups — every module reuses these so the filter drawer
 * shows the same vocabulary everywhere (Related Projects / Usage / Type / Status).
 * The toolbar hides the leading "All …" row when a group has only two real
 * choices, so each group keeps an explicit "all" reset value.
 */

export function relatedProjectsGroup(value: string, onChange: (v: string) => void): FilterGroup {
  return {
    key: "related",
    label: "Related Projects",
    value,
    onChange,
    options: [
      { value: "all", label: "All records" },
      { value: "with", label: "With Projects" },
      { value: "without", label: "No Projects" },
    ],
  };
}

export function usageGroup(value: string, onChange: (v: string) => void): FilterGroup {
  return {
    key: "usage",
    label: "Usage",
    value,
    onChange,
    options: [
      { value: "all", label: "All records" },
      { value: "in-use", label: "In Use" },
      { value: "unused", label: "Unused" },
    ],
  };
}

export function capexOpexGroup(value: string, onChange: (v: string) => void): FilterGroup {
  return {
    key: "type",
    label: "Types",
    value,
    onChange,
    options: [
      { value: "all", label: "All types" },
      { value: "CapEx", label: "CapEx" },
      { value: "OpEx", label: "OpEx" },
    ],
  };
}

export function statusGroup(value: string, onChange: (v: string) => void): FilterGroup {
  return {
    key: "status",
    label: "Status",
    value,
    onChange,
    options: [
      { value: "all", label: "All statuses" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Deactivated" },
    ],
  };
}

export function skillsGroup(value: string[], onChange: (v: string[]) => void, skills: string[]): MultiFilterGroup {
  return {
    key: "skill",
    label: "Skills",
    value,
    onChange,
    mode: "multi",
    options: [{ value: "all", label: "All skills" }, ...skills.map((s) => ({ value: s, label: s }))],
  };
}

/** Shared predicates so filtering behaves identically in every module. */
export const matchRelated = (filter: string, count: number) =>
  filter === "all" || (filter === "with" ? count > 0 : count === 0);

export const matchUsage = (filter: string, count: number) =>
  filter === "all" || (filter === "in-use" ? count > 0 : count === 0);

export const matchStatus = (filter: string, active: boolean) =>
  filter === "all" || (filter === "active" ? active : !active);
