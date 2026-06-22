import { useEffect, useMemo, useState } from 'react';
import { User, Mail, Phone, ChevronDown, X, Pencil } from 'lucide-react';
import { Lead, COUNTRIES } from '../types';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';
import { JOINED_FALLBACK_AMOUNT } from '../utils/collection';
import {
  detectPhoneInput,
  formatStoredPhone,
  getFullPhoneDigits,
  parseStoredPhone,
} from '../utils/phoneFormat';

interface EditLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  leads: Lead[];
  leadSources: string[];
  grades: string[];
  subjects: string[];
  syllabi: string[];
  onClose: () => void;
  onSave: (leadId: string, updates: Partial<Lead>, newNote?: string) => void;
}

const inputStyles =
  'w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3.5 min-h-[48px] text-sm font-semibold text-[#18181b] outline-none focus:bg-white focus:border-[#18181b] transition-all';
const errorStyles = 'border-red-300 bg-red-50 focus:border-red-400';

export default function EditLeadModal({
  isOpen,
  lead,
  leads,
  leadSources,
  grades,
  subjects,
  syllabi,
  onClose,
  onSave,
}: EditLeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dialCode: '+91',
    country: 'IN',
    class: '',
    subject: '',
    syllabus: '',
    source: '',
  });
  const [amountCollected, setAmountCollected] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!lead) return;
    const parsed = parseStoredPhone(lead.phone, lead.country);
    setFormData({
      name: lead.name === lead.phone ? '' : lead.name,
      email: lead.email || '',
      phone: parsed.phone,
      dialCode: parsed.dialCode,
      country: lead.country || parsed.country,
      class: lead.class,
      subject: lead.subject || subjects[0] || 'General',
      syllabus: lead.syllabus || syllabi[0] || '',
      source: lead.source,
    });
    setAmountCollected(
      typeof lead.amountCollected === 'number' && lead.amountCollected > 0
        ? String(lead.amountCollected)
        : String(JOINED_FALLBACK_AMOUNT)
    );
    setNewNote('');
    setErrors({});
  }, [lead, subjects, syllabi]);

  const classOptions = useMemo(() => {
    const options = [...grades];
    if (lead?.class && !options.includes(lead.class)) options.unshift(lead.class);
    return options;
  }, [grades, lead?.class]);

  const subjectOptions = useMemo(() => {
    const options = [...subjects];
    if (lead?.subject && !options.includes(lead.subject)) options.unshift(lead.subject);
    return options;
  }, [subjects, lead?.subject]);

  const syllabusOptions = useMemo(() => {
    const options = [...syllabi];
    if (lead?.syllabus && !options.includes(lead.syllabus)) options.unshift(lead.syllabus);
    return options;
  }, [syllabi, lead?.syllabus]);

  const handleDialCodeChange = (code: string) => {
    const matchedCountry = COUNTRIES.find((c) => c.dialCode === code.trim());
    setFormData((prev) => ({
      ...prev,
      dialCode: code,
      country: matchedCountry ? matchedCountry.isoCode : prev.country,
    }));
  };

  const handlePhoneChange = (val: string) => {
    const detected = detectPhoneInput(val, {
      dialCode: formData.dialCode,
      country: formData.country,
    });
    setFormData((prev) => ({
      ...prev,
      dialCode: detected.dialCode,
      country: detected.country,
      phone: detected.phone,
    }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.phone.trim() || formData.phone.length < 5) {
      nextErrors.phone = 'Valid phone number required';
    } else if (getFullPhoneDigits(formData.dialCode, formData.phone).length < 8) {
      nextErrors.phone = 'Enter a complete phone number';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Invalid email address';
    }

    const formattedPhone = formatStoredPhone(formData.dialCode, formData.phone);
    const duplicate = leads.find(
      (l) =>
        l.id !== lead?.id &&
        l.phone.replace(/\D/g, '') === formattedPhone.replace(/\D/g, '')
    );
    if (duplicate) {
      nextErrors.phone = `This number belongs to ${duplicate.name}`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!lead || !validate()) return;

    const formattedPhone = formatStoredPhone(formData.dialCode, formData.phone);
    const trimmedName = formData.name.trim();

    onSave(
      lead.id,
      {
        name: trimmedName || formattedPhone,
        email: formData.email.trim() || undefined,
        phone: formattedPhone,
        class: formData.class,
        subject: formData.subject,
        syllabus: formData.syllabus || undefined,
        source: formData.source,
        country: formData.country,
        ...(lead.status === 'JOINED'
          ? { amountCollected: Math.max(0, Math.round(Number(amountCollected) || 0)) }
          : {}),
      },
      newNote.trim() || undefined
    );
  };

  const handleClose = () => {
    setErrors({});
    setNewNote('');
    onClose();
  };

  if (!lead) return null;

  return (
    <OverlayShell isOpen={isOpen} onClose={handleClose} zIndex={Z.nested} maxWidth="lg">
      <div className="px-5 py-4 border-b border-[#e4e4e7] flex justify-between items-start bg-[#fafafa] shrink-0 relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#d4d4d8] rounded-full sm:hidden" />
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <div className="w-10 h-10 bg-[#18181b] text-white rounded-xl flex items-center justify-center">
            <Pencil size={18} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#18181b]">Edit lead</h3>
            <p className="text-xs text-[#71717a]">Add or update details after enquiry</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#e4e4e7]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">
              Student name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="Optional"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={`${inputStyles} pl-11`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
              <input
                type="email"
                placeholder="Optional"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={`${inputStyles} pl-11 ${errors.email ? errorStyles : ''}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs font-bold pl-1">{errors.email}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">
            WhatsApp / Mobile
          </label>
          <div className="flex gap-2">
            <div className="relative w-[140px] shrink-0">
              <select
                value={formData.dialCode}
                onChange={(e) => handleDialCodeChange(e.target.value)}
                className={`${inputStyles} appearance-none pr-8 text-xs`}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.isoCode} value={c.dialCode}>
                    {c.dialCode}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
            </div>
            <div className="relative flex-1">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`${inputStyles} pl-11 ${errors.phone ? errorStyles : ''}`}
              />
            </div>
          </div>
          {errors.phone && <p className="text-red-500 text-xs font-bold pl-1">{errors.phone}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Grade</label>
            <div className="relative">
              <select
                value={formData.class}
                onChange={(e) => setFormData((prev) => ({ ...prev, class: e.target.value }))}
                className={`${inputStyles} appearance-none pr-10`}
              >
                {classOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Subject</label>
            <div className="relative">
              <select
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                className={`${inputStyles} appearance-none pr-10`}
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Syllabus</label>
            <div className="relative">
              <select
                value={formData.syllabus}
                onChange={(e) => setFormData((prev) => ({ ...prev, syllabus: e.target.value }))}
                className={`${inputStyles} appearance-none pr-10`}
              >
                {syllabusOptions.map((s) => (
                  <option key={s} value={s}>{s || 'None'}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Source</label>
          <div className="relative">
            <select
              value={formData.source}
              onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
              className={`${inputStyles} appearance-none pr-10`}
            >
              {leadSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
          </div>
        </div>

        {lead.status === 'JOINED' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">
              Amount collected (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#a1a1aa]">₹</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={amountCollected}
                onChange={(e) => setAmountCollected(e.target.value)}
                className={`${inputStyles} pl-9`}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">
            Add note (optional)
          </label>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="e.g. Parent prefers evening classes, wants CBSE Maths..."
            rows={3}
            className={`${inputStyles} min-h-[88px] resize-none`}
          />
        </div>

        {(lead.notes?.length ?? 0) > 0 && (
          <div className="p-3 bg-[#fafafa] rounded-xl border border-[#f4f4f5] space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Previous notes</p>
            {lead.notes!.slice(-3).map((note, idx) => (
              <p key={idx} className="text-xs text-[#71717a]">{note}</p>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#e4e4e7] bg-[#fafafa] shrink-0 safe-bottom">
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 min-h-[48px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest interactive-element"
        >
          Save changes
        </button>
      </div>
    </OverlayShell>
  );
}
