import { useCallback, useEffect, useState } from "react";

/**
 * Presentation-level active/deactivated flags for Organization master data.
 * Keyed as `scope:id` and persisted so the state survives navigation.
 */
const STORAGE_KEY = "pmo.org.deactivated";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

let cache: Set<string> | null = null;
const listeners = new Set<() => void>();

function current(): Set<string> {
  if (!cache) cache = read();
  return cache;
}

function persist(next: Set<string>) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    /* storage unavailable — keep in-memory only */
  }
  listeners.forEach((l) => l());
}

export function useOrgActive(scope: string) {
  const [, force] = useState(0);

  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener) as unknown as void;
  }, []);

  const isActive = useCallback(
    (id: string) => !current().has(`${scope}:${id}`),
    [scope],
  );

  const setActive = useCallback(
    (id: string, active: boolean) => {
      const next = new Set(current());
      const key = `${scope}:${id}`;
      if (active) next.delete(key);
      else next.add(key);
      persist(next);
    },
    [scope],
  );

  return { isActive, setActive };
}
