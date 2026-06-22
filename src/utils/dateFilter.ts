export type DateRangeFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export interface CustomDateRange {
  start: string;
  end: string;
}

function parseDate(value: string): Date {
  const d = value.includes('T') ? new Date(value) : new Date(value + 'T12:00:00');
  return d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isInDateRange(
  dateValue: string,
  range: DateRangeFilter,
  custom?: CustomDateRange
): boolean {
  if (range === 'ALL') return true;

  const date = startOfDay(parseDate(dateValue));
  const today = startOfDay(new Date());

  if (range === 'TODAY') {
    return date.getTime() === today.getTime();
  }

  if (range === 'THIS_WEEK') {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return date >= start && date <= today;
  }

  if (range === 'THIS_MONTH') {
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  if (range === 'CUSTOM' && custom?.start && custom?.end) {
    const start = startOfDay(parseDate(custom.start));
    const end = startOfDay(parseDate(custom.end));
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }

  return true;
}
