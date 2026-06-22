import { Lead, Demo } from '../types';
import { DateRangeFilter, CustomDateRange, isInDateRange } from './dateFilter';
import { sumJoinCollection, DEMO_COLLECTION_VALUE } from './collection';

export interface StaffMetricsRow {
  name: string;
  role: string;
  totalLeads: number;
  activeLeads: number;
  joins: number;
  lost: number;
  conversionRate: number;
  demosScheduled: number;
  demosCompleted: number;
  demoCompletionRate: number;
  efficiencyScore: number;
  collection: number;
}

export interface MetricsFilters {
  staffName: string;
  dateRange: DateRangeFilter;
  customRange?: CustomDateRange;
}

function filterLeadsByDate(leads: Lead[], range: DateRangeFilter, custom?: CustomDateRange) {
  return leads.filter(l => isInDateRange(l.date, range, custom));
}

function filterDemosByDate(demos: Demo[], range: DateRangeFilter, custom?: CustomDateRange) {
  return demos.filter(d => isInDateRange(d.date, range, custom));
}

export function computeStaffMetrics(
  staffList: { name: string; role: string }[],
  leads: Lead[],
  demos: Demo[],
  filters: MetricsFilters
): StaffMetricsRow[] {
  const rangedLeads = filterLeadsByDate(leads, filters.dateRange, filters.customRange);
  const rangedDemos = filterDemosByDate(demos, filters.dateRange, filters.customRange);

  const staffToCompute = filters.staffName === 'ALL'
    ? staffList
    : staffList.filter(s => s.name === filters.staffName);

  return staffToCompute.map(staff => {
    const sLeads = rangedLeads.filter(l => l.createdBy === staff.name || l.assignedTo === staff.name);
    const sLeadIds = new Set(sLeads.map(l => l.id));
    const sDemos = rangedDemos.filter(d =>
      sLeadIds.has(d.leadId || '') || d.createdBy === staff.name
    );

    const joinedLeads = sLeads.filter(l => l.status === 'JOINED');
    const joins = joinedLeads.length;
    const lost = sLeads.filter(l => l.status === 'LOST').length;
    const activeLeads = sLeads.filter(l => l.status === 'NEW' || l.status === 'IN PROGRESS').length;
    const demosScheduled = sDemos.filter(d => d.status === 'SCHEDULED' || d.status === 'RESCHEDULED').length;
    const demosCompleted = sDemos.filter(d => d.status === 'COMPLETED').length;

    const conversionRate = sLeads.length ? (joins / sLeads.length) * 100 : 0;
    const demoCompletionRate = sDemos.length ? (demosCompleted / sDemos.length) * 100 : 0;

    const efficiencyScore = Math.round(
      conversionRate * 0.5 +
      demoCompletionRate * 0.3 +
      Math.min(joins * 10, 30) +
      Math.min(demosCompleted * 5, 20)
    );

    const collection = sumJoinCollection(joinedLeads) + demosCompleted * DEMO_COLLECTION_VALUE;

    return {
      name: staff.name,
      role: staff.role,
      totalLeads: sLeads.length,
      activeLeads,
      joins,
      lost,
      conversionRate: Number(conversionRate.toFixed(1)),
      demosScheduled,
      demosCompleted,
      demoCompletionRate: Number(demoCompletionRate.toFixed(1)),
      efficiencyScore: Math.min(100, efficiencyScore),
      collection
    };
  }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
}

export function computeTeamTotals(rows: StaffMetricsRow[]) {
  const totalLeads = rows.reduce((s, r) => s + r.totalLeads, 0);
  const joins = rows.reduce((s, r) => s + r.joins, 0);
  const demosCompleted = rows.reduce((s, r) => s + r.demosCompleted, 0);
  return {
    totalLeads,
    joins,
    demosCompleted,
    conversionRate: totalLeads ? Number(((joins / totalLeads) * 100).toFixed(1)) : 0,
    avgEfficiency: rows.length
      ? Number((rows.reduce((s, r) => s + r.efficiencyScore, 0) / rows.length).toFixed(1))
      : 0,
    collection: rows.reduce((s, r) => s + r.collection, 0)
  };
}
