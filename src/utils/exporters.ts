import type { Lead, Demo } from '../types';
import { downloadCsv } from './csv';
import { getLeadCollectedAmount } from './collection';

function dateSlug(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Export a set of leads to a CSV file. Only the leads passed in are included,
 * so callers can pre-filter (e.g. by current filters / selection).
 */
export function exportLeadsCsv(leads: Lead[]) {
  const headers = [
    'Name',
    'Phone',
    'Email',
    'Status',
    'Grade',
    'Subject',
    'Syllabus',
    'Source',
    'Country',
    'Enquiry Date',
    'Joined Date',
    'Amount Collected',
    'Hot',
    'Assigned To',
    'Created By',
    'Notes',
  ];

  const rows = leads.map((lead) => [
    lead.name,
    lead.phone,
    lead.email ?? '',
    lead.status,
    lead.class,
    lead.subject ?? '',
    lead.syllabus ?? '',
    lead.source,
    lead.country ?? '',
    lead.date,
    lead.joinedDate ? lead.joinedDate.split('T')[0] : '',
    lead.status === 'JOINED' ? String(getLeadCollectedAmount(lead)) : '',
    lead.isHot ? 'Yes' : 'No',
    lead.assignedTo ?? '',
    lead.createdBy ?? '',
    (lead.notes ?? []).join(' | '),
  ]);

  downloadCsv(`clapscrm-leads-${dateSlug()}.csv`, headers, rows);
}

/**
 * Export a set of demos to a CSV file.
 */
export function exportDemosCsv(demos: Demo[]) {
  const headers = [
    'Student Name',
    'Phone',
    'Subject',
    'Grade',
    'Teacher',
    'Status',
    'Date',
    'Time',
    'Meet Link',
    'Created By',
  ];

  const rows = demos.map((demo) => [
    demo.studentName,
    demo.phone ?? '',
    demo.subject,
    demo.class,
    demo.teacher,
    demo.status,
    demo.date,
    demo.time,
    demo.meetLink ?? '',
    demo.createdBy ?? '',
  ]);

  downloadCsv(`clapscrm-demos-${dateSlug()}.csv`, headers, rows);
}
