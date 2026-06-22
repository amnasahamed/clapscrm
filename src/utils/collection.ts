import type { Lead } from '../types';

/** Default collection value (₹) applied to a JOINED lead with no recorded amount. */
export const JOINED_FALLBACK_AMOUNT = 800;

/** Collection value (₹) contributed by each completed demo. */
export const DEMO_COLLECTION_VALUE = 120;

/**
 * Collection (₹) attributable to a single lead once it JOINED.
 * Uses the recorded `amountCollected`, falling back to the legacy estimate
 * for leads created before amounts were captured.
 */
export function getLeadCollectedAmount(lead: Lead): number {
  return typeof lead.amountCollected === 'number' && lead.amountCollected > 0
    ? lead.amountCollected
    : JOINED_FALLBACK_AMOUNT;
}

/** Sum of collected amounts across a set of JOINED leads. */
export function sumJoinCollection(joinedLeads: Lead[]): number {
  return joinedLeads.reduce((sum, lead) => sum + getLeadCollectedAmount(lead), 0);
}

/**
 * Total collection for a period = collected amounts from JOINED leads +
 * the per-demo contribution for completed demos. Pre-amount leads fall
 * back to `JOINED_FALLBACK_AMOUNT`.
 */
export function computeCollection(leads: Lead[], completedDemoCount: number): number {
  return sumJoinCollection(leads) + completedDemoCount * DEMO_COLLECTION_VALUE;
}
