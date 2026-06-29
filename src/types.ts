import type { ReactNode } from 'react';

// ─── Role-Based Access ───────────────────────────────────────────────
export type UserRole = 'admin' | 'manager' | 'counselor';

export type Permission =
  | 'view_all_leads'
  | 'create_lead'
  | 'edit_any_lead'
  | 'delete_lead'
  | 'bulk_operations'
  | 'view_analytics'
  | 'admin_dashboard'
  | 'manage_staff'
  | 'settings_all'
  | 'settings_whatsapp'
  | 'change_own_pin'
  | 'view_access_logs'
  | 'transfer_leads'
  | 'reassign_leads'
  | 'export_data'
  | 'schedule_demo'
  | 'delete_demo';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_all_leads', 'create_lead', 'edit_any_lead', 'delete_lead',
    'bulk_operations', 'view_analytics', 'admin_dashboard', 'manage_staff',
    'settings_all', 'settings_whatsapp', 'change_own_pin', 'view_access_logs',
    'transfer_leads', 'reassign_leads', 'export_data', 'schedule_demo', 'delete_demo'
  ],
  manager: [
    'view_all_leads', 'create_lead', 'edit_any_lead',
    'bulk_operations', 'view_analytics',
    'settings_whatsapp', 'change_own_pin', 'transfer_leads',
    'export_data', 'schedule_demo', 'delete_demo'
  ],
  counselor: [
    'create_lead', 'schedule_demo', 'change_own_pin', 'transfer_leads', 'view_analytics'
  ]
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  counselor: 1
};

export interface StaffMember {
  name: string;
  role: UserRole;
  avatar: string;
  pin?: string;
}

// ─── Data Models ─────────────────────────────────────────────────────
export type InterestStatus = 'Interested' | 'Not Interested' | 'No Reply' | 'Dead End' | 'Re-follow';

export interface ContactAttempt {
  id: string;
  date: string;
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'OTHER';
  outcome: string;
  interestStatus?: InterestStatus;
}

export type ActivityKind =
  | 'created'
  | 'status_changed'
  | 'edited'
  | 'note_added'
  | 'note_updated'
  | 'note_deleted'
  | 'contact_attempt'
  | 're_enquiry'
  | 'transfer_requested'
  | 'transfer_accepted'
  | 'transfer_rejected'
  | 'transfer_cancelled'
  | 'reassigned'
  | 'joined'
  | 'hot_toggled'
  | 'deleted';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  /** ISO timestamp of when the activity happened. */
  at: string;
  /** Staff member who performed the action, if known. */
  actor?: string;
  /** Human-readable summary, e.g. "Status changed to JOINED". */
  summary: string;
  interestStatus?: InterestStatus;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  status: 'NEW' | 'JOINED' | 'IN PROGRESS' | 'LOST';
  class: string;
  subject?: string;
  syllabus?: string;
  source: string;
  country: string;
  notes?: string[];
  assignedTo?: string;
  isHot?: boolean;
  contactHistory?: ContactAttempt[];
  followUpCount?: number;
  isPostDemo?: boolean;
  createdBy?: string;
  interestStatus?: InterestStatus;
  /** Amount collected (₹) when the lead becomes JOINED. Falls back to ₹800 if unset. */
  amountCollected?: number;
  /** ISO date the lead was marked JOINED. */
  joinedDate?: string;
  /** Chronological audit trail of lead mutations. */
  activity?: ActivityEntry[];
  parentName?: string;
  lostReason?: string;
}

export interface TeacherEnquiry {
  id: string;
  phone: string;
  date: string;
  source: string;
  staffName: string;
  notes?: string;
}

export interface Demo {
  id: string;
  leadId?: string;
  studentName: string;
  phone?: string;
  date: string;
  time: string;
  teacher: string;
  subject: string;
  class: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED' | 'ATTENDED' | 'JOINED';
  meetLink?: string;
  createdBy?: string;
  schedulingNotes?: string;
}

export interface StaffPerformance {
  name: string;
  role: UserRole;
  collection: number;
  joins: number;
  conversion: number;
  avatar: string;
}

export interface Reminder {
  id: string;
  leadId: string;
  leadName: string;
  date: string;
  time: string;
  text: string;
  isCompleted: boolean;
}

export interface AccessLogEntry {
  id: string;
  staffName: string;
  role: UserRole;
  ipAddress: string;
  action: 'login' | 'app_open';
  timestamp: string;
}

export type TransferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface LeadTransferRequest {
  id: string;
  leadId: string;
  leadName: string;
  fromStaff: string;
  toStaff: string;
  status: TransferStatus;
  createdAt: string;
  resolvedAt?: string;
}

// ─── UI Component Props ──────────────────────────────────────────────
export interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: string;
  isPos?: boolean;
  icon: ReactNode;
  isDark?: boolean;
  variant?: 'blue' | 'green' | 'orange' | 'red' | 'default';
}

// ─── Country Data ────────────────────────────────────────────────────
export interface CountryEntry {
  name: string;
  dialCode: string;
  isoCode: string;
}

export const COUNTRIES: CountryEntry[] = [
  { name: 'India', dialCode: '+91', isoCode: 'IN' },
  { name: 'UAE', dialCode: '+971', isoCode: 'AE' },
  { name: 'Saudi Arabia', dialCode: '+966', isoCode: 'SA' },
  { name: 'Qatar', dialCode: '+974', isoCode: 'QA' },
  { name: 'Oman', dialCode: '+968', isoCode: 'OM' },
  { name: 'Kuwait', dialCode: '+965', isoCode: 'KW' },
  { name: 'Bahrain', dialCode: '+973', isoCode: 'BH' },
  { name: 'United States', dialCode: '+1', isoCode: 'US' },
  { name: 'United Kingdom', dialCode: '+44', isoCode: 'GB' },
  { name: 'Canada', dialCode: '+1', isoCode: 'CA' },
  { name: 'Australia', dialCode: '+61', isoCode: 'AU' },
  { name: 'Singapore', dialCode: '+65', isoCode: 'SG' },
  { name: 'Germany', dialCode: '+49', isoCode: 'DE' },
  { name: 'France', dialCode: '+33', isoCode: 'FR' },
];

// ─── Source Options ──────────────────────────────────────────────────
export const DEFAULT_LEAD_SOURCES = [
  'Meta Ads',
  'Google Ads',
  'Instagram',
  'WhatsApp',
  'Website',
  'Referral',
  'Direct Outreach',
  'TikTok Ads',
  'Other'
] as const;

export const DEFAULT_GRADES = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
] as const;

export const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Science',
  'Social Science',
  'Computer Science',
  'General',
] as const;

export const DEFAULT_SYLLABI = [
  'CBSE',
  'ICSE',
  'State Board',
  'IB',
  'IGCSE',
  'Other',
] as const;

/** @deprecated use leadSources from DataContext */
export const LEAD_SOURCES = DEFAULT_LEAD_SOURCES;

export type LeadSource = string;

// ─── Utility ─────────────────────────────────────────────────────────
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}
