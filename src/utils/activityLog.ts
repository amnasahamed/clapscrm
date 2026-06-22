import type { ActivityEntry, ActivityKind } from '../types';
import { generateId } from '../types';

/**
 * Append a new activity entry to a lead's existing trail (newest last).
 * Keeps the trail bounded so it doesn't grow unbounded in localStorage.
 */
const MAX_ACTIVITY = 200;

export function buildActivity(
  kind: ActivityKind,
  summary: string,
  actor?: string,
  at: string = new Date().toISOString()
): ActivityEntry {
  return { id: generateId(), kind, at, summary, actor };
}

export function appendActivity(
  existing: ActivityEntry[] | undefined,
  entry: ActivityEntry
): ActivityEntry[] {
  const next = [...(existing ?? []), entry];
  return next.length > MAX_ACTIVITY ? next.slice(next.length - MAX_ACTIVITY) : next;
}
