import { useEffect, useMemo, useRef, useState } from 'react';
import type { Reminder } from '../types';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function getPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Parse a reminder's date ("YYYY-MM-DD") + time ("HH:MM" or "h:mm AM/PM")
 * into an epoch millisecond value. Returns NaN if it can't be parsed.
 */
export function getReminderTimestamp(reminder: Pick<Reminder, 'date' | 'time'>): number {
  const datePart = reminder.date?.includes('T') ? reminder.date.split('T')[0] : reminder.date;
  if (!datePart) return NaN;

  let timePart = reminder.time?.trim() ?? '';
  // Normalize "3:45 PM" / "15:45" → 24h "HH:MM"
  const meridiemMatch = timePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (meridiemMatch) {
    let hours = parseInt(meridiemMatch[1], 10) % 12;
    if (/PM/i.test(meridiemMatch[3])) hours += 12;
    timePart = `${String(hours).padStart(2, '0')}:${meridiemMatch[2]}`;
  }
  if (!/^\d{1,2}:\d{2}$/.test(timePart)) return NaN;

  const [h, m] = timePart.split(':').map(Number);
  const d = new Date(`${datePart}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export interface ReminderNotificationsResult {
  permission: NotificationPermissionState;
  requestPermission: () => Promise<void>;
  /** Reminders that are pending, due now or overdue (not completed). */
  dueNow: Reminder[];
  /** Reminders becoming due within the next hour (not yet due). */
  dueSoon: Reminder[];
}

/**
 * Watches pending reminders and fires native OS notifications as they become due,
 * plus exposes permission state and due/overdue reminders for inline UI banners.
 *
 * Local-first: notifications only fire while the app is open. The same reminder
 * will not notify twice in one session (tracked by id).
 */
export function useReminderNotifications(reminders: Reminder[]): ReminderNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermissionState>(getPermissionState);
  const notifiedRef = useRef<Set<string>>(new Set());

  // Re-evaluate permission if the user changes it elsewhere.
  useEffect(() => {
    if (permission === 'unsupported') return;
    const interval = window.setInterval(() => {
      const next = getPermissionState();
      setPermission((prev) => (prev === next ? prev : next));
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [permission]);

  const now = Date.now();
  const pending = useMemo(() => reminders.filter((r) => !r.isCompleted), [reminders]);

  const { dueNow, dueSoon } = useMemo(() => {
    const due: Reminder[] = [];
    const soon: Reminder[] = [];
    const soonWindow = 60 * 60 * 1000; // 1 hour
    for (const r of pending) {
      const ts = getReminderTimestamp(r);
      if (Number.isNaN(ts)) continue;
      if (ts <= now) due.push(r);
      else if (ts - now <= soonWindow) soon.push(r);
    }
    return { dueNow: due, dueSoon: soon };
    // `now` is intentionally not a dependency — recompute is driven by the tick below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);
    } catch {
      /* ignore — some browsers use the callback form only */
    }
  };

  // Fire a system notification for each reminder that just crossed its due time.
  useEffect(() => {
    if (permission !== 'granted') return;
    for (const r of dueNow) {
      if (notifiedRef.current.has(r.id)) continue;
      notifiedRef.current.add(r.id);
      try {
        const n = new Notification(`Follow-up: ${r.leadName}`, {
          body: r.text || 'Reminder is due now.',
          tag: r.id,
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
        /* notification construction can throw on some browsers */
      }
    }
  }, [dueNow, permission]);

  return { permission, requestPermission, dueNow, dueSoon };
}
