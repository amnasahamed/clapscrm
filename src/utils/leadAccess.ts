import type { Lead } from '../types';

export const ACTIVE_LEAD_STATUSES = ['NEW', 'IN PROGRESS'] as const;

export function isActiveLeadStatus(status: Lead['status']): boolean {
  return status === 'NEW' || status === 'IN PROGRESS';
}

export function getLeadOwnerName(lead: Lead): string {
  return lead.assignedTo || lead.createdBy || 'Unknown';
}

/** Whether a counselor currently manages this lead (assignment, or creator if unassigned). */
export function isLeadManagedBy(lead: Lead, staffName: string): boolean {
  return lead.assignedTo === staffName || (!lead.assignedTo && lead.createdBy === staffName);
}

/** Active pipeline leads that should move to a replacement on offboarding. */
export function shouldHandoffLeadOnOffboard(lead: Lead, departingStaff: string): boolean {
  return isActiveLeadStatus(lead.status) && isLeadManagedBy(lead, departingStaff);
}

/** Whether a counselor owns or is assigned this lead. */
export function isLeadOwner(lead: Lead, userName: string): boolean {
  return lead.assignedTo === userName || lead.createdBy === userName;
}

/** Whether a counselor owns or is assigned this lead. */
export function isLeadVisibleToUser(lead: Lead, userName: string): boolean {
  return isLeadOwner(lead, userName);
}

export function filterViewableLeads(
  leads: Lead[],
  userName: string,
  canViewAll: boolean
): Lead[] {
  if (canViewAll) return leads;
  return leads.filter(l => isLeadVisibleToUser(l, userName));
}
