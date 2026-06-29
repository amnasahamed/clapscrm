import { Lead, Demo, COUNTRIES } from '../types';
import { isInDateRange } from './dateFilter';
import { computeStaffMetrics } from './staffMetrics';
import { sumJoinCollection, DEMO_COLLECTION_VALUE } from './collection';

export function normalizeLeadDate(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value;
}

function countryLabel(isoCode: string): string {
  return COUNTRIES.find(c => c.isoCode === isoCode)?.name ?? (isoCode || 'Unknown');
}

export interface PeriodKpis {
  leads: number;
  joins: number;
  demosCompleted: number;
  conversionRate: number;
  collection: number;
}

export interface PeriodComparison {
  current: PeriodKpis;
  previous: PeriodKpis;
  leadsDelta: number;
  joinsDelta: number;
  conversionDelta: number;
}

function computeKpis(leads: Lead[], demos: Demo[]): PeriodKpis {
  const joinedLeads = leads.filter(l => l.status === 'JOINED');
  const joins = joinedLeads.length;
  const demosCompleted = demos.filter(d => d.status === 'CONVERTED').length;
  const conversionRate = leads.length ? Number(((joins / leads.length) * 100).toFixed(1)) : 0;
  const collection = sumJoinCollection(joinedLeads) + demosCompleted * DEMO_COLLECTION_VALUE;

  return { leads: leads.length, joins, demosCompleted, conversionRate, collection };
}

export function compareDailyPerformance(leads: Lead[], demos: Demo[]): PeriodComparison {
  const currentLeads = leads.filter(l => isInDateRange(l.date, 'TODAY'));
  const previousLeads = leads.filter(l => {
    const d = normalizeLeadDate(l.date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = yesterday.toISOString().split('T')[0];
    return d === iso;
  });
  const currentDemos = demos.filter(d => isInDateRange(d.date, 'TODAY'));
  const previousDemos = demos.filter(d => {
    const iso = normalizeLeadDate(d.date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return iso === yesterday.toISOString().split('T')[0];
  });

  const current = computeKpis(currentLeads, currentDemos);
  const previous = computeKpis(previousLeads, previousDemos);

  return {
    current,
    previous,
    leadsDelta: current.leads - previous.leads,
    joinsDelta: current.joins - previous.joins,
    conversionDelta: Number((current.conversionRate - previous.conversionRate).toFixed(1)),
  };
}

export function compareMonthlyPerformance(leads: Lead[], demos: Demo[]): PeriodComparison {
  const currentLeads = leads.filter(l => isInDateRange(l.date, 'THIS_MONTH'));
  const currentDemos = demos.filter(d => isInDateRange(d.date, 'THIS_MONTH'));

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const previousLeads = leads.filter(l => {
    const d = startOfDay(parseLeadDate(l.date));
    return d >= lastMonth && d <= lastMonthEnd;
  });
  const previousDemos = demos.filter(d => {
    const date = startOfDay(parseLeadDate(d.date));
    return date >= lastMonth && date <= lastMonthEnd;
  });

  const current = computeKpis(currentLeads, currentDemos);
  const previous = computeKpis(previousLeads, previousDemos);

  return {
    current,
    previous,
    leadsDelta: current.leads - previous.leads,
    joinsDelta: current.joins - previous.joins,
    conversionDelta: Number((current.conversionRate - previous.conversionRate).toFixed(1)),
  };
}

function parseLeadDate(value: string): Date {
  return value.includes('T') ? new Date(value) : new Date(value + 'T12:00:00');
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function buildDailyTimeline(leads: Lead[], days = 14) {
  const today = startOfDay(new Date());
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const iso = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayLeads = leads.filter(l => normalizeLeadDate(l.date) === iso);
    const joins = dayLeads.filter(l => l.status === 'JOINED').length;
    return { label, iso, leads: dayLeads.length, joins };
  });
}

export function buildMonthlyTimeline(leads: Lead[], months = 6) {
  const now = new Date();
  return Array.from({ length: months }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const monthLeads = leads.filter(l => {
      const ld = parseLeadDate(l.date);
      return ld.getMonth() === month && ld.getFullYear() === year;
    });
    const joins = monthLeads.filter(l => l.status === 'JOINED').length;
    return { label, leads: monthLeads.length, joins };
  });
}

export interface RegionalRow {
  region: string;
  isoCode: string;
  leads: number;
  joins: number;
  conversionRate: number;
  share: number;
}

export function computeRegionalBreakdown(leads: Lead[], range: 'THIS_MONTH' | 'ALL' = 'THIS_MONTH'): RegionalRow[] {
  const filtered = range === 'ALL' ? leads : leads.filter(l => isInDateRange(l.date, 'THIS_MONTH'));
  const total = filtered.length || 1;

  const byCountry = new Map<string, Lead[]>();
  for (const lead of filtered) {
    const key = lead.country || 'Unknown';
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(lead);
  }

  return Array.from(byCountry.entries())
    .map(([isoCode, countryLeads]) => {
      const joins = countryLeads.filter(l => l.status === 'JOINED').length;
      return {
        region: countryLabel(isoCode),
        isoCode,
        leads: countryLeads.length,
        joins,
        conversionRate: countryLeads.length
          ? Number(((joins / countryLeads.length) * 100).toFixed(1))
          : 0,
        share: Number(((countryLeads.length / total) * 100).toFixed(1)),
      };
    })
    .sort((a, b) => b.leads - a.leads);
}

export interface SourcePerformanceRow {
  source: string;
  leads: number;
  joins: number;
  inProgress: number;
  lost: number;
  conversionRate: number;
  collection: number;
}

export function computeSourcePerformance(
  leads: Lead[],
  demos: Demo[],
  range: 'THIS_MONTH' | 'ALL' = 'THIS_MONTH'
): SourcePerformanceRow[] {
  const filtered = range === 'ALL' ? leads : leads.filter(l => isInDateRange(l.date, 'THIS_MONTH'));
  const filteredDemos = range === 'ALL' ? demos : demos.filter(d => isInDateRange(d.date, 'THIS_MONTH'));

  const sources = new Map<string, Lead[]>();
  for (const lead of filtered) {
    const key = lead.source || 'Other';
    if (!sources.has(key)) sources.set(key, []);
    sources.get(key)!.push(lead);
  }

  return Array.from(sources.entries())
    .map(([source, sourceLeads]) => {
      const joinedLeads = sourceLeads.filter(l => l.status === 'JOINED');
      const joins = joinedLeads.length;
      const inProgress = sourceLeads.filter(l => l.status === 'IN PROGRESS').length;
      const lost = sourceLeads.filter(l => l.status === 'LOST').length;
      const leadIds = new Set(sourceLeads.map(l => l.id));
      const demosCompleted = filteredDemos.filter(
        d => d.status === 'CONVERTED' && leadIds.has(d.leadId || '')
      ).length;

      return {
        source,
        leads: sourceLeads.length,
        joins,
        inProgress,
        lost,
        conversionRate: sourceLeads.length
          ? Number(((joins / sourceLeads.length) * 100).toFixed(1))
          : 0,
        collection: sumJoinCollection(joinedLeads) + demosCompleted * DEMO_COLLECTION_VALUE,
      };
    })
    .sort((a, b) => b.leads - a.leads);
}

export function computeMonthlyLeaderboard(
  staffList: { name: string; role: string }[],
  leads: Lead[],
  demos: Demo[]
) {
  return computeStaffMetrics(staffList, leads, demos, {
    staffName: 'ALL',
    dateRange: 'THIS_MONTH',
  });
}

export const MONTHLY_SCORING_EXPLANATION = {
  title: 'How monthly performance is calculated',
  points: [
    'Leads and demos are counted by their enquiry / demo date within the selected calendar month.',
    'A join is any lead with status JOINED created in that month.',
    'Conversion % = joins ÷ total leads in the period × 100.',
    'Demo completion % = completed demos ÷ all demos scheduled in the period × 100.',
    'Efficiency score (0–100) = conversion × 50% + demo completion × 30% + join bonus (up to 30) + demo bonus (up to 20), capped at 100.',
    'Estimated collection = collected amounts from joined leads + (completed demos × ₹120). Joins with no recorded amount fall back to ₹800.',
    'Monthly leaderboard ranks staff by efficiency score for the current month.',
  ],
};
