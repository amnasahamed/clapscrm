import { Lead, Demo, StaffPerformance, UserRole } from './types';

// ─── Dynamic date helpers ────────────────────────────────────────────
function formatDateForInput(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDateForInput(d);
}

function today(): string {
  return formatDateForInput(new Date());
}

// ─── Default Staff Roles ─────────────────────────────────────────────
export const DEFAULT_STAFF_ROLES: Record<string, UserRole> = {
  'Fazil 🧔🏻‍♂️': 'admin',
  'Sarah 👩🏻‍💼': 'manager',
  'Ahmed 👨🏽‍💻': 'counselor',
  'Priya 👩🏾‍🔬': 'counselor'
};

// ─── Mock Data ───────────────────────────────────────────────────────
export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-001',
    name: 'Arjun Sharma',
    phone: '+91 98765 43210',
    email: 'arjun@example.com',
    date: daysAgo(12),
    status: 'NEW',
    class: '10th CBSE',
    subject: 'Mathematics',
    syllabus: 'CBSE',
    source: 'Website',
    country: 'IN',
    notes: ['Interested in home tuition', 'Wants trial tomorrow'],
    assignedTo: 'Fazil 🧔🏻‍♂️',
    createdBy: 'Fazil 🧔🏻‍♂️'
  },
  {
    id: 'lead-002',
    name: 'Priya Varma',
    phone: '+91 87654 32109',
    email: 'priya@example.com',
    date: daysAgo(14),
    status: 'JOINED',
    class: '8th ICSE',
    subject: 'Physics',
    syllabus: 'ICSE',
    source: 'Instagram',
    country: 'IN',
    notes: ['Joined for Physics'],
    assignedTo: 'Sarah 👩🏻‍💼',
    createdBy: 'Sarah 👩🏻‍💼'
  },
  {
    id: 'lead-003',
    name: 'Karan Malhotra',
    phone: '+91 76543 21098',
    email: 'karan@example.com',
    date: daysAgo(16),
    status: 'IN PROGRESS',
    class: '12th JEE',
    subject: 'Chemistry',
    syllabus: 'CBSE',
    source: 'Referral',
    country: 'IN',
    notes: ['Demo scheduled for Monday'],
    assignedTo: 'Ahmed 👨🏽‍💻',
    createdBy: 'Ahmed 👨🏽‍💻'
  },
  {
    id: 'lead-004',
    name: 'Sneha Kapoor',
    phone: '+91 65432 10987',
    email: 'sneha@example.com',
    date: daysAgo(19),
    status: 'NEW',
    class: '6th CBSE',
    subject: 'English',
    syllabus: 'CBSE',
    source: 'Meta Ads',
    country: 'IN',
    notes: [],
    assignedTo: 'Fazil 🧔🏻‍♂️',
    isHot: true,
    createdBy: 'Fazil 🧔🏻‍♂️'
  }
];

export const MOCK_DEMOS: Demo[] = [
  {
    id: 'demo-001',
    leadId: 'lead-001',
    studentName: 'Arjun Sharma',
    phone: '+91 98765 43210',
    date: today(),
    time: '10:30 AM',
    teacher: 'Mr. Rajesh Kumar',
    subject: 'Mathematics',
    class: '10th CBSE',
    status: 'SCHEDULED',
    createdBy: 'Fazil 🧔🏻‍♂️'
  },
  {
    id: 'demo-002',
    leadId: 'lead-002',
    studentName: 'Priya Varma',
    phone: '+91 87654 32109',
    date: today(),
    time: '02:00 PM',
    teacher: 'Ms. Anjali Singh',
    subject: 'Physics',
    class: '8th ICSE',
    status: 'CONVERTED',
    createdBy: 'Sarah 👩🏻‍💼'
  },
  {
    id: 'demo-003',
    leadId: 'lead-003',
    studentName: 'Karan Malhotra',
    phone: '+91 76543 21098',
    date: daysAgo(-1),
    time: '11:15 AM',
    teacher: 'Dr. Vikram Mehra',
    subject: 'Chemistry',
    class: '12th JEE',
    status: 'SCHEDULED',
    createdBy: 'Ahmed 👨🏽‍💻'
  },
  {
    id: 'demo-004',
    studentName: 'Sanya Gupta',
    date: daysAgo(-1),
    time: '04:30 PM',
    teacher: 'Mrs. Shalini Gupta',
    subject: 'English',
    class: '9th CBSE',
    status: 'SCHEDULED',
    createdBy: 'Priya 👩🏾‍🔬'
  }
];

export const MOCK_PERFORMANCE: StaffPerformance[] = [
  {
    name: 'Fazil 🧔🏻‍♂️',
    role: 'admin',
    collection: 28500,
    joins: 45,
    conversion: 13.1,
    avatar: 'https://ui-avatars.com/api/?name=Fazil&background=18181b&color=fff'
  },
  {
    name: 'Sarah 👩🏻‍💼',
    role: 'manager',
    collection: 21200,
    joins: 38,
    conversion: 13.3,
    avatar: 'https://ui-avatars.com/api/?name=Sarah&background=18181b&color=fff'
  },
  {
    name: 'Ahmed 👨🏽‍💻',
    role: 'counselor',
    collection: 19800,
    joins: 32,
    conversion: 10.3,
    avatar: 'https://ui-avatars.com/api/?name=Ahmed&background=18181b&color=fff'
  },
  {
    name: 'Priya 👩🏾‍🔬',
    role: 'counselor',
    collection: 14700,
    joins: 31,
    conversion: 10.6,
    avatar: 'https://ui-avatars.com/api/?name=Priya&background=18181b&color=fff'
  }
];
