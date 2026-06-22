import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lead, Demo, Reminder, ContactAttempt, AccessLogEntry, LeadTransferRequest, DEFAULT_LEAD_SOURCES, DEFAULT_GRADES, DEFAULT_SUBJECTS, DEFAULT_SYLLABI, generateId, ActivityKind } from '../types';
import { MOCK_LEADS, MOCK_DEMOS } from '../constants';
import { isLeadManagedBy, shouldHandoffLeadOnOffboard } from '../utils/leadAccess';
import { buildActivity, appendActivity } from '../utils/activityLog';

const DATA_STORAGE_KEY = 'edumanage_data';

interface DataStorage {
  leads: Lead[];
  demos: Demo[];
  reminders: Reminder[];
  whatsappTemplates: { lead: string; demo: string };
  accessLogs: AccessLogEntry[];
  leadTransfers: LeadTransferRequest[];
  leadSources: string[];
  grades: string[];
  subjects: string[];
  syllabi: string[];
}

interface DataContextType {
  leads: Lead[];
  demos: Demo[];
  reminders: Reminder[];
  whatsappTemplates: { lead: string; demo: string };
  accessLogs: AccessLogEntry[];
  leadTransfers: LeadTransferRequest[];
  leadSources: string[];
  grades: string[];
  subjects: string[];
  syllabi: string[];

  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  
  addDemo: (demo: Omit<Demo, 'id'>) => void;
  updateDemo: (id: string, updates: Partial<Demo>) => void;
  deleteDemo: (id: string) => void;
  
  addNoteToLead: (leadId: string, note: string) => void;
  updateNoteInLead: (leadId: string, noteIndex: number, newNote: string) => void;
  deleteNoteFromLead: (leadId: string, noteIndex: number) => void;
  
  addContactAttemptToLead: (leadId: string, attempt: Omit<ContactAttempt, 'id'>) => void;
  logReEnquiry: (leadId: string, payload: {
    source: string;
    date: string;
    class: string;
    subject?: string;
    syllabus?: string;
    email?: string;
    staffName: string;
  }) => void;
  updateWhatsAppTemplate: (type: 'lead' | 'demo', template: string) => void;
  
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;

  addAccessLog: (entry: Omit<AccessLogEntry, 'id' | 'timestamp'>) => void;
  createLeadTransfer: (leadId: string, fromStaff: string, toStaff: string) => boolean;
  requestLeadHandoff: (leadId: string, requestingStaff: string) => boolean;
  acceptLeadTransfer: (transferId: string) => void;
  rejectLeadTransfer: (transferId: string) => void;
  cancelLeadTransfer: (transferId: string) => void;
  reassignLead: (leadId: string, newStaff: string) => void;
  offboardStaff: (departingStaff: string, replacementStaff: string) => {
    leadsReassigned: number;
    leadsKept: number;
    demosLinked: number;
    transfersCancelled: number;
  };

  addLeadSource: (name: string) => boolean;
  updateLeadSource: (oldName: string, newName: string) => boolean;
  deleteLeadSource: (name: string) => boolean;

  addGrade: (name: string) => boolean;
  updateGrade: (oldName: string, newName: string) => boolean;
  deleteGrade: (name: string) => boolean;

  addSubject: (name: string) => boolean;
  updateSubject: (oldName: string, newName: string) => boolean;
  deleteSubject: (name: string) => boolean;

  addSyllabus: (name: string) => boolean;
  updateSyllabus: (oldName: string, newName: string) => boolean;
  deleteSyllabus: (name: string) => boolean;
  
  resetData: () => void;
}

const defaultTemplates = {
  lead: "Hi {{name}}, this is ClapsCRM. Regarding your enquiry for {{class}} {{subject}}...",
  demo: "Hi {{studentName}}, this is ClapsCRM. Confirming your demo session for {{subject}} on {{date}} at {{time}}."
};

function loadData(): DataStorage {
  try {
    const stored = localStorage.getItem(DATA_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DataStorage;
      
      const normalizeDate = (d: string) => {
        if (!d.includes('-')) {
          const date = new Date(d);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        }
        return d;
      };

      const leads = Array.isArray(parsed.leads) ? parsed.leads.map(l => ({...l, date: normalizeDate(l.date)})) : MOCK_LEADS;
      const demos = Array.isArray(parsed.demos) ? parsed.demos.map(d => ({...d, date: normalizeDate(d.date)})) : MOCK_DEMOS;
      
      return {
        leads,
        demos,
        reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
        whatsappTemplates: parsed.whatsappTemplates || defaultTemplates,
        accessLogs: Array.isArray(parsed.accessLogs) ? parsed.accessLogs : [],
        leadTransfers: Array.isArray(parsed.leadTransfers) ? parsed.leadTransfers : [],
        leadSources: Array.isArray(parsed.leadSources) && parsed.leadSources.length > 0
          ? parsed.leadSources
          : [...DEFAULT_LEAD_SOURCES],
        grades: Array.isArray(parsed.grades) && parsed.grades.length > 0
          ? parsed.grades
          : [...DEFAULT_GRADES],
        subjects: Array.isArray(parsed.subjects) && parsed.subjects.length > 0
          ? parsed.subjects
          : [...DEFAULT_SUBJECTS],
        syllabi: Array.isArray(parsed.syllabi) && parsed.syllabi.length > 0
          ? parsed.syllabi
          : [...DEFAULT_SYLLABI],
      };
    }
  } catch { /* ignore corrupt data */ }
  return {
    leads: MOCK_LEADS,
    demos: MOCK_DEMOS,
    reminders: [],
    whatsappTemplates: defaultTemplates,
    accessLogs: [],
    leadTransfers: [],
    leadSources: [...DEFAULT_LEAD_SOURCES],
    grades: [...DEFAULT_GRADES],
    subjects: [...DEFAULT_SUBJECTS],
    syllabi: [...DEFAULT_SYLLABI],
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataStorage>(loadData);

  useEffect(() => {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  /**
   * Helper: apply a mutation to a lead and also append an activity entry.
   * `patchFn` receives the lead and must return the updated lead fields.
   */
  const withActivity = (
    prev: DataStorage,
    leadId: string,
    kind: ActivityKind,
    summary: string,
    actor?: string,
    patchFn?: (lead: Lead) => Partial<Lead>
  ) => ({
    ...prev,
    leads: prev.leads.map(lead => {
      if (lead.id !== leadId) return lead;
      const entry = buildActivity(kind, summary, actor);
      const patch = patchFn ? patchFn(lead) : {};
      return {
        ...lead,
        ...patch,
        activity: appendActivity(lead.activity, entry),
      };
    }),
  });

  const addLead = (leadData: Omit<Lead, 'id'>) => {
    if (!leadData.phone?.trim()) return;

    const createdBy = leadData.createdBy ?? leadData.assignedTo ?? 'Unknown';
    const newLead: Lead = {
      ...leadData,
      name: leadData.name?.trim() || leadData.phone.trim(),
      id: generateId(),
      activity: [buildActivity('created', `Lead created as ${leadData.status}`, createdBy)],
    };
    setData(prev => ({ ...prev, leads: [newLead, ...prev.leads] }));
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setData(prev => {
      const lead = prev.leads.find(l => l.id === id);
      if (!lead) return prev;

      // Detect what kind of change this is for the activity log
      const parts: string[] = [];
      let kind: ActivityKind = 'edited';

      if (updates.status && updates.status !== lead.status) {
        kind = 'status_changed';
        parts.push(`Status: ${lead.status} → ${updates.status}`);
      }
      if (updates.isHot !== undefined && updates.isHot !== lead.isHot) {
        kind = 'hot_toggled';
        parts.push(updates.isHot ? 'Marked hot' : 'Unmarked hot');
      }
      if (updates.amountCollected !== undefined && updates.status === 'JOINED') {
        kind = 'joined';
        parts.push(`Joined — ₹${updates.amountCollected} collected`);
      } else if (updates.status === 'JOINED' && updates.status !== lead.status) {
        kind = 'joined';
        parts.push('Marked as joined');
      }
      if (parts.length === 0) {
        kind = 'edited';
        const fields = Object.keys(updates).filter(k => k !== 'activity');
        if (fields.length) parts.push(`Updated: ${fields.join(', ')}`);
      }

      if (parts.length === 0) return { ...prev, leads: prev.leads.map(l => l.id === id ? { ...l, ...updates } : l) };

      return withActivity(prev, id, kind, parts.join('. '), undefined, () => updates);
    });
  };

  const deleteLead = (id: string) => {
    setData(prev => ({
      ...prev,
      leads: prev.leads.filter(l => l.id !== id),
      // Cascade delete: remove linked demos and reminders
      demos: prev.demos.filter(d => d.leadId !== id),
      reminders: prev.reminders.filter(r => r.leadId !== id)
    }));
  };

  const addDemo = (demoData: Omit<Demo, 'id'>) => {
    const newDemo: Demo = {
      ...demoData,
      id: generateId()
    };
    setData(prev => ({ ...prev, demos: [newDemo, ...prev.demos] }));
  };

  const updateDemo = (id: string, updates: Partial<Demo>) => {
    setData(prev => ({
      ...prev,
      demos: prev.demos.map(demo => demo.id === id ? { ...demo, ...updates } : demo)
    }));
  };

  const deleteDemo = (id: string) => {
    setData(prev => ({
      ...prev,
      demos: prev.demos.filter(d => d.id !== id)
    }));
  };

  const addNoteToLead = (leadId: string, note: string) => {
    setData(prev => withActivity(prev, leadId, 'note_added', `Note added`, undefined, (lead) => ({
      notes: [...(lead.notes || []), note],
    })));
  };

  const updateNoteInLead = (leadId: string, noteIndex: number, newNote: string) => {
    setData(prev => withActivity(prev, leadId, 'note_updated', `Note #${noteIndex + 1} updated`, undefined, (lead) => ({
      notes: (lead.notes || []).map((note, idx) => idx === noteIndex ? newNote : note),
    })));
  };

  const deleteNoteFromLead = (leadId: string, noteIndex: number) => {
    setData(prev => withActivity(prev, leadId, 'note_deleted', `Note #${noteIndex + 1} deleted`, undefined, (lead) => ({
      notes: (lead.notes || []).filter((_, idx) => idx !== noteIndex),
    })));
  };

  const addContactAttemptToLead = (leadId: string, attemptData: Omit<ContactAttempt, 'id'>) => {
    const newAttempt: ContactAttempt = {
      ...attemptData,
      id: generateId()
    };
    setData(prev => withActivity(prev, leadId, 'contact_attempt', `Contact attempt: ${attemptData.type} — ${attemptData.outcome}`, undefined, (lead) => ({
      contactHistory: [newAttempt, ...(lead.contactHistory || [])],
    })));
  };

  const logReEnquiry = (
    leadId: string,
    payload: {
      source: string;
      date: string;
      class: string;
      subject?: string;
      syllabus?: string;
      email?: string;
      staffName: string;
    }
  ) => {
    const noteParts = [
      `Re-enquiry on ${payload.date} via ${payload.source}`,
      `Class: ${payload.class}`,
      payload.subject && `Subject: ${payload.subject}`,
      payload.syllabus && `Syllabus: ${payload.syllabus}`,
      payload.email && `Email: ${payload.email}`,
    ].filter(Boolean);

    setData(prev => {
      const lead = prev.leads.find(l => l.id === leadId);
      if (!lead) return prev;

      const contactHistory: ContactAttempt[] = [
        {
          id: generateId(),
          date: payload.date,
          type: 'OTHER',
          outcome: `Re-enquiry via ${payload.source} (logged by ${payload.staffName})`,
        },
        ...(lead.contactHistory || []),
      ];

      const patch: Partial<Lead> = {
        contactHistory,
        notes: [...(lead.notes || []), noteParts.join(' · ')],
        isHot: true,
      };

      if (lead.status === 'LOST') {
        patch.status = 'IN PROGRESS';
      }
      if (payload.email && !lead.email) {
        patch.email = payload.email;
      }

      const entry = buildActivity('re_enquiry', `Re-enquiry via ${payload.source} by ${payload.staffName}`, payload.staffName);
      return {
        ...prev,
        leads: prev.leads.map(l =>
          l.id === leadId
            ? { ...l, ...patch, activity: appendActivity(l.activity, entry) }
            : l
        ),
      };
    });
  };

  const updateWhatsAppTemplate = (type: 'lead' | 'demo', template: string) => {
    setData(prev => ({
      ...prev,
      whatsappTemplates: { ...prev.whatsappTemplates, [type]: template }
    }));
  };

  const addReminder = (reminderData: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: generateId()
    };
    setData(prev => ({ ...prev, reminders: [newReminder, ...prev.reminders] }));
  };

  const toggleReminder = (id: string) => {
    setData(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r)
    }));
  };

  const deleteReminder = (id: string) => {
    setData(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== id)
    }));
  };

  const addAccessLog = (entry: Omit<AccessLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AccessLogEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString()
    };
    setData(prev => ({
      ...prev,
      accessLogs: [newEntry, ...prev.accessLogs].slice(0, 500)
    }));
  };

  const createLeadTransfer = (leadId: string, fromStaff: string, toStaff: string): boolean => {
    const lead = data.leads.find(l => l.id === leadId);
    if (!lead || fromStaff === toStaff) return false;

    const existingPending = data.leadTransfers.find(
      t => t.leadId === leadId && t.status === 'pending'
    );
    if (existingPending) return false;

    const transfer: LeadTransferRequest = {
      id: generateId(),
      leadId,
      leadName: lead.name,
      fromStaff,
      toStaff,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setData(prev => withActivity(prev, leadId, 'transfer_requested', `Transfer requested: ${fromStaff} → ${toStaff}`, fromStaff, () => ({})));
    setData(prev => ({ ...prev, leadTransfers: [transfer, ...prev.leadTransfers] }));
    return true;
  };

  const requestLeadHandoff = (leadId: string, requestingStaff: string): boolean => {
    const lead = data.leads.find(l => l.id === leadId);
    if (!lead) return false;
    const owner = lead.assignedTo || lead.createdBy;
    if (!owner || owner === requestingStaff) return false;
    return createLeadTransfer(leadId, owner, requestingStaff);
  };

  const acceptLeadTransfer = (transferId: string) => {
    const transfer = data.leadTransfers.find(t => t.id === transferId);
    if (!transfer || transfer.status !== 'pending') return;

    setData(prev => ({
      ...prev,
      leads: prev.leads.map(l =>
        l.id === transfer.leadId
          ? {
              ...l,
              assignedTo: transfer.toStaff,
              createdBy: transfer.toStaff,
              activity: appendActivity(l.activity, buildActivity('transfer_accepted', `Transfer accepted — assigned to ${transfer.toStaff}`, transfer.toStaff)),
            }
          : l
      ),
      leadTransfers: prev.leadTransfers.map(t =>
        t.id === transferId
          ? { ...t, status: 'accepted' as const, resolvedAt: new Date().toISOString() }
          : t
      )
    }));
  };

  const rejectLeadTransfer = (transferId: string) => {
    const transfer = data.leadTransfers.find(t => t.id === transferId);
    if (!transfer) return;
    setData(prev => ({
      ...prev,
      leadTransfers: prev.leadTransfers.map(t =>
        t.id === transferId && t.status === 'pending'
          ? { ...t, status: 'rejected' as const, resolvedAt: new Date().toISOString() }
          : t
      )
    }));
    // Activity on the lead itself
    setData(prev => withActivity(prev, transfer.leadId, 'transfer_rejected', `Transfer to ${transfer.toStaff} rejected`, transfer.toStaff));
  };

  const cancelLeadTransfer = (transferId: string) => {
    const transfer = data.leadTransfers.find(t => t.id === transferId);
    if (!transfer) return;
    setData(prev => ({
      ...prev,
      leadTransfers: prev.leadTransfers.map(t =>
        t.id === transferId && t.status === 'pending'
          ? { ...t, status: 'cancelled' as const, resolvedAt: new Date().toISOString() }
          : t
      )
    }));
    setData(prev => withActivity(prev, transfer.leadId, 'transfer_cancelled', `Transfer cancelled`, transfer.fromStaff));
  };

  const reassignLead = (leadId: string, newStaff: string) => {
    setData(prev => withActivity(prev, leadId, 'reassigned', `Reassigned to ${newStaff}`, undefined, () => ({
      assignedTo: newStaff,
      createdBy: newStaff,
    })));
    // Also cancel any pending transfers for this lead
    setData(prev => ({
      ...prev,
      leadTransfers: prev.leadTransfers.map(t =>
        t.leadId === leadId && t.status === 'pending'
          ? { ...t, status: 'cancelled' as const, resolvedAt: new Date().toISOString() }
          : t
      )
    }));
  };

  const offboardStaff = (departingStaff: string, replacementStaff: string) => {
    if (departingStaff === replacementStaff) {
      return { leadsReassigned: 0, leadsKept: 0, demosLinked: 0, transfersCancelled: 0 };
    }

    const now = new Date().toISOString();
    let leadsReassigned = 0;
    let leadsKept = 0;
    let demosLinked = 0;
    let transfersCancelled = 0;
    const reassignedLeadIds = new Set<string>();

    setData(prev => {
      const leads = prev.leads.map((lead) => {
        if (!isLeadManagedBy(lead, departingStaff)) return lead;

        if (!shouldHandoffLeadOnOffboard(lead, departingStaff)) {
          leadsKept += 1;
          return lead;
        }

        leadsReassigned += 1;
        reassignedLeadIds.add(lead.id);
        return {
          ...lead,
          assignedTo: replacementStaff,
          notes: [
            ...(lead.notes || []),
            `Assigned to ${replacementStaff} from ${departingStaff} on ${now.split('T')[0]} (staff offboarding — active lead). Original creator: ${lead.createdBy || departingStaff}.`,
          ],
        };
      });

      demosLinked = prev.demos.filter(
        (demo) => demo.leadId && reassignedLeadIds.has(demo.leadId)
      ).length;

      const leadTransfers = prev.leadTransfers.map((transfer) => {
        if (transfer.status !== 'pending') return transfer;
        if (transfer.fromStaff === departingStaff || transfer.toStaff === departingStaff) {
          transfersCancelled += 1;
          return { ...transfer, status: 'cancelled' as const, resolvedAt: now };
        }
        return transfer;
      });

      return { ...prev, leads, leadTransfers };
    });

    return { leadsReassigned, leadsKept, demosLinked, transfersCancelled };
  };

  const addLeadSource = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (data.leadSources.some(s => s.toLowerCase() === trimmed.toLowerCase())) return false;
    setData(prev => ({ ...prev, leadSources: [...prev.leadSources, trimmed] }));
    return true;
  };

  const updateLeadSource = (oldName: string, newName: string): boolean => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return false;
    if (data.leadSources.some(s => s.toLowerCase() === trimmed.toLowerCase() && s !== oldName)) return false;
    setData(prev => ({
      ...prev,
      leadSources: prev.leadSources.map(s => s === oldName ? trimmed : s),
      leads: prev.leads.map(l => l.source === oldName ? { ...l, source: trimmed } : l)
    }));
    return true;
  };

  const deleteLeadSource = (name: string): boolean => {
    if (data.leadSources.length <= 1) return false;
    const fallback = data.leadSources.includes('Other') ? 'Other' : data.leadSources[0];
    setData(prev => ({
      ...prev,
      leadSources: prev.leadSources.filter(s => s !== name),
      leads: prev.leads.map(l => l.source === name ? { ...l, source: fallback } : l)
    }));
    return true;
  };

  const addCatalogItem = (
    key: 'grades' | 'subjects' | 'syllabi',
    name: string
  ): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (data[key].some(s => s.toLowerCase() === trimmed.toLowerCase())) return false;
    setData(prev => ({ ...prev, [key]: [...prev[key], trimmed] }));
    return true;
  };

  const updateCatalogItem = (
    key: 'grades' | 'subjects' | 'syllabi',
    leadField: 'class' | 'subject' | 'syllabus',
    oldName: string,
    newName: string
  ): boolean => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return false;
    if (data[key].some(s => s.toLowerCase() === trimmed.toLowerCase() && s !== oldName)) return false;
    setData(prev => ({
      ...prev,
      [key]: prev[key].map(s => s === oldName ? trimmed : s),
      leads: prev.leads.map(l =>
        l[leadField] === oldName ? { ...l, [leadField]: trimmed } : l
      ),
    }));
    return true;
  };

  const deleteCatalogItem = (
    key: 'grades' | 'subjects' | 'syllabi',
    leadField: 'class' | 'subject' | 'syllabus',
    name: string,
    fallbackPreference: string[]
  ): boolean => {
    if (data[key].length <= 1) return false;
    const fallback = fallbackPreference.find(f => data[key].includes(f)) ?? data[key][0];
    setData(prev => ({
      ...prev,
      [key]: prev[key].filter(s => s !== name),
      leads: prev.leads.map(l =>
        l[leadField] === name ? { ...l, [leadField]: fallback } : l
      ),
    }));
    return true;
  };

  const addGrade = (name: string) => addCatalogItem('grades', name);
  const updateGrade = (oldName: string, newName: string) =>
    updateCatalogItem('grades', 'class', oldName, newName);
  const deleteGrade = (name: string) =>
    deleteCatalogItem('grades', 'class', name, ['Class 8', 'Other']);

  const addSubject = (name: string) => addCatalogItem('subjects', name);
  const updateSubject = (oldName: string, newName: string) =>
    updateCatalogItem('subjects', 'subject', oldName, newName);
  const deleteSubject = (name: string) =>
    deleteCatalogItem('subjects', 'subject', name, ['General', 'Other']);

  const addSyllabus = (name: string) => addCatalogItem('syllabi', name);
  const updateSyllabus = (oldName: string, newName: string) =>
    updateCatalogItem('syllabi', 'syllabus', oldName, newName);
  const deleteSyllabus = (name: string) =>
    deleteCatalogItem('syllabi', 'syllabus', name, ['Other', 'CBSE']);

  const resetData = () => {
    setData({
      leads: MOCK_LEADS,
      demos: MOCK_DEMOS,
      reminders: [],
      whatsappTemplates: defaultTemplates,
      accessLogs: data.accessLogs,
      leadTransfers: [],
      leadSources: [...DEFAULT_LEAD_SOURCES],
      grades: [...DEFAULT_GRADES],
      subjects: [...DEFAULT_SUBJECTS],
      syllabi: [...DEFAULT_SYLLABI],
    });
  };

  return (
    <DataContext.Provider value={{
      leads: data.leads,
      demos: data.demos,
      reminders: data.reminders,
      whatsappTemplates: data.whatsappTemplates,
      accessLogs: data.accessLogs,
      leadTransfers: data.leadTransfers,
      leadSources: data.leadSources,
      grades: data.grades,
      subjects: data.subjects,
      syllabi: data.syllabi,
      addLead, updateLead, deleteLead,
      addDemo, updateDemo, deleteDemo,
      addNoteToLead, updateNoteInLead, deleteNoteFromLead,
      addContactAttemptToLead, logReEnquiry, updateWhatsAppTemplate,
      addReminder, toggleReminder, deleteReminder,
      addAccessLog, createLeadTransfer, requestLeadHandoff, acceptLeadTransfer,
      rejectLeadTransfer, cancelLeadTransfer, reassignLead, offboardStaff,
      addLeadSource, updateLeadSource, deleteLeadSource,
      addGrade, updateGrade, deleteGrade,
      addSubject, updateSubject, deleteSubject,
      addSyllabus, updateSyllabus, deleteSyllabus,
      resetData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
