import { useState, FormEvent } from 'react';
import { Calendar, Phone, Globe, ChevronDown, Send, User, Info, CheckCircle2, Mail, RotateCcw, UserPlus, MessageCircle, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Lead, COUNTRIES } from '../types';
import { isLeadOwner, getLeadOwnerName } from '../utils/leadAccess';

export default function EnquiryForm() {
  const { currentUser, hasPermission } = useAuth();
  const { addLead, logReEnquiry, addContactAttemptToLead, requestLeadHandoff, leads, leadSources, grades, subjects, syllabi } = useData();
  const navigate = useNavigate();

  const canManageDuplicateLead = (lead: Lead) =>
    hasPermission('view_all_leads') ||
    (currentUser ? isLeadOwner(lead, currentUser.name) : false);

  const defaultSource = leadSources[0] ?? 'Other';

  const defaultGrade = grades.includes('Class 8') ? 'Class 8' : (grades[0] ?? 'Class 8');
  const defaultSubject = subjects[0] ?? 'General';
  const defaultSyllabus = syllabi[0] ?? '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    class: defaultGrade,
    subject: defaultSubject,
    syllabus: defaultSyllabus,
    date: new Date().toISOString().split('T')[0],
    country: 'IN', // Store ISO code
    dialCode: '+91',
    source: defaultSource
  });

  const [duplicationStatus, setDuplicationStatus] = useState<null | 'YES' | 'NO'>(null);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [duplicateIntent, setDuplicateIntent] = useState<null | 'reenquiry' | 'sibling'>(null);
  const [phoneStepComplete, setPhoneStepComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMode, setSuccessMode] = useState<'created' | 'reenquiry' | 'contact' | 'handoff' | null>(null);
  const [selectedExistingLeadId, setSelectedExistingLeadId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form data if component remounts or user clicks "add another"
  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', class: defaultGrade, subject: defaultSubject, syllabus: defaultSyllabus,
      date: new Date().toISOString().split('T')[0], country: 'IN', dialCode: '+91', source: defaultSource
    });
    setDuplicationStatus(null);
    setDuplicateLead(null);
    setDuplicateIntent(null);
    setSelectedExistingLeadId(null);
    setPhoneStepComplete(false);
    setErrors({});
  };

  const getFullPhoneDigits = (dialCode = formData.dialCode, phone = formData.phone) =>
    (dialCode + phone).replace(/\D/g, '');

  const findDuplicateLeads = (dialCode = formData.dialCode, phone = formData.phone) => {
    const fullInputCleaned = getFullPhoneDigits(dialCode, phone);
    if (fullInputCleaned.length < 8) return [];
    return leads.filter(l => l.phone.replace(/\D/g, '') === fullInputCleaned);
  };

  const findDuplicateLead = (dialCode = formData.dialCode, phone = formData.phone) =>
    findDuplicateLeads(dialCode, phone)[0] ?? null;

  const validatePhone = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim() || formData.phone.length < 5) {
      newErrors.phone = 'Valid phone number required';
    } else if (getFullPhoneDigits().length < 8) {
      newErrors.phone = 'Enter a complete phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updatePhone = (val: string) => {
    let detectedDialCode = '';
    let detectedCountryIso = '';
    let cleanedVal = val.trim();

    if (cleanedVal.startsWith('+')) {
      const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
      for (const country of sortedCountries) {
        if (cleanedVal.startsWith(country.dialCode)) {
          detectedDialCode = country.dialCode;
          detectedCountryIso = country.isoCode;
          break;
        }
      }
    }

    let numberPart = val;

    if (detectedDialCode) {
      numberPart = cleanedVal.substring(detectedDialCode.length).trim();
      setFormData(prev => ({
        ...prev,
        dialCode: detectedDialCode,
        country: detectedCountryIso,
        phone: numberPart
      }));
    } else {
      setFormData(prev => ({ ...prev, phone: val }));
    }
  };

  const handlePhoneContinue = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!validatePhone()) return;

    const matches = findDuplicateLeads();
    if (matches.length > 0) {
      setDuplicationStatus('YES');
      setDuplicateLead(matches[0]);
      setSelectedExistingLeadId(matches[0].id);
      setDuplicateIntent(null);
    } else {
      setDuplicationStatus('NO');
      setDuplicateLead(null);
      setDuplicateIntent(null);
      setSelectedExistingLeadId(null);
    }
    setPhoneStepComplete(true);
    setErrors({});
  };

  const handleChangeNumber = () => {
    setPhoneStepComplete(false);
    setDuplicationStatus(null);
    setDuplicateLead(null);
    setDuplicateIntent(null);
    setSelectedExistingLeadId(null);
    setErrors({});
  };

  const handleDialCodeChange = (code: string) => {
    const matchedCountry = COUNTRIES.find(c => c.dialCode === code.trim());
    const updatedCountryIso = matchedCountry ? matchedCountry.isoCode : formData.country;

    setFormData(prev => ({ ...prev, dialCode: code, country: updatedCountryIso }));
    if (phoneStepComplete) handleChangeNumber();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !phoneStepComplete) return;
    if (duplicationStatus === 'YES' && duplicateIntent !== 'sibling') return;
    if (!validateDetails()) return;
    
    setIsSubmitting(true);

    setTimeout(() => {
      const phone = `${formData.dialCode} ${formData.phone}`.trim();
      addLead({
        name: formData.name.trim() || phone,
        email: formData.email || undefined,
        phone,
        class: formData.class,
        subject: formData.subject,
        syllabus: formData.syllabus,
        date: formData.date,
        status: 'NEW',
        source: formData.source,
        country: formData.country,
        assignedTo: currentUser?.name,
        createdBy: currentUser?.name,
        notes: []
      });
      
      setIsSubmitting(false);
      setSuccessMode('created');
      
      setTimeout(() => {
        navigate('/leads');
      }, 1500);
    }, 800);
  };

  const handleLogReEnquiry = () => {
    if (!duplicateLead || !currentUser || isSubmitting) return;
    if (!canManageDuplicateLead(duplicateLead)) return;
    if (!validateDetails()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      logReEnquiry(duplicateLead.id, {
        source: formData.source,
        date: formData.date,
        class: formData.class,
        subject: formData.subject || undefined,
        syllabus: formData.syllabus || undefined,
        email: formData.email || undefined,
        staffName: currentUser.name,
      });

      setIsSubmitting(false);
      setSuccessMode('reenquiry');

      setTimeout(() => {
        navigate('/leads', { state: { highlightLeadId: duplicateLead.id } });
      }, 1500);
    }, 600);
  };

  const isDuplicate = phoneStepComplete && duplicationStatus === 'YES' && !!duplicateLead;
  const existingLeadsAtPhone = isDuplicate ? findDuplicateLeads() : [];
  const selectedExistingLead =
    existingLeadsAtPhone.find((lead) => lead.id === selectedExistingLeadId) ?? duplicateLead;
  const canLogReEnquiry = isDuplicate && !!selectedExistingLead && canManageDuplicateLead(selectedExistingLead);
  const showDuplicateChoice = isDuplicate && canLogReEnquiry && !duplicateIntent;
  const showSharedStaffOptions =
    isDuplicate && !!selectedExistingLead && currentUser && !canManageDuplicateLead(selectedExistingLead) && !duplicateIntent;
  const showReEnquiryForm = isDuplicate && duplicateIntent === 'reenquiry' && canLogReEnquiry;
  const showDetailsForm =
    phoneStepComplete && (duplicationStatus === 'NO' || duplicateIntent === 'sibling');
  const formattedPhone = `${formData.dialCode} ${formData.phone}`.trim();

  const handleLogWhatsAppContact = () => {
    const targetLead = selectedExistingLead;
    if (!targetLead || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      addContactAttemptToLead(targetLead.id, {
        date: formData.date,
        type: 'WHATSAPP',
        outcome: `WhatsApp conversation logged by ${currentUser.name} (shared business inbox)`,
      });
      setIsSubmitting(false);
      setSuccessMode('contact');
      setTimeout(() => {
        navigate('/leads', { state: { highlightLeadId: targetLead.id } });
      }, 1500);
    }, 400);
  };

  const handleRequestHandoff = () => {
    const targetLead = selectedExistingLead;
    if (!targetLead || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const ok = requestLeadHandoff(targetLead.id, currentUser.name);
      setIsSubmitting(false);
      if (ok) {
        setSuccessMode('handoff');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setErrors({ handoff: 'A handoff is already pending for this student.' });
      }
    }, 400);
  };

  const inputStyles = "w-full bg-[#f4f4f5]/60 border border-transparent rounded-2xl px-4 py-3.5 text-sm font-semibold text-[#18181b] outline-none focus:bg-white focus:ring-2 focus:ring-[#18181b]/10 focus:border-[#18181b]/20 transition-all";
  const errorStyles = "border-red-500 focus:border-red-500 bg-red-50 focus:ring-red-500/10";

  return (
    <div className="max-w-xl mx-auto pb-12 space-y-8">
      {/* Current Staff Indicator */}
      {currentUser && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-1"
        >
          <div className="inline-flex items-center gap-2 bg-[#18181b] rounded-lg py-1.5 px-3 text-white text-xs font-medium">
            <User size={14} className="text-zinc-300" />
            Recording for <span className="text-white">{currentUser.name}</span>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {successMode ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-panel border-green-200 p-10 text-center flex flex-col items-center"
          >
            <div className="absolute inset-0 bg-green-50/50 -z-10" />
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 border border-green-100 shadow-sm animate-pulse">
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-semibold text-[#18181b] mb-2">
              {successMode === 'reenquiry'
                ? 'Re-enquiry logged'
                : successMode === 'contact'
                  ? 'WhatsApp contact logged'
                  : successMode === 'handoff'
                    ? 'Handoff requested'
                    : 'Lead captured'}
            </h2>
            <p className="text-[#71717a] font-medium">
              {successMode === 'reenquiry'
                ? 'Existing lead updated. Redirecting...'
                : successMode === 'contact'
                  ? 'Contact added to the student record. Redirecting...'
                  : successMode === 'handoff'
                    ? 'The assigned counselor will be notified to accept. Redirecting...'
                    : 'Redirecting to your pipeline...'}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="surface-panel p-6 sm:p-7 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[#18181b] mb-1">New enquiry</h2>
                <p className="text-sm text-[#71717a]">
                  {phoneStepComplete
                    ? isDuplicate
                      ? duplicateIntent === 'sibling'
                        ? 'Add the new child\'s details below.'
                        : duplicateIntent === 'reenquiry'
                          ? 'Log a follow-up on the existing student.'
                          : 'This number is already registered. Who is this enquiry for?'
                      : 'Number verified. Add the remaining details below.'
                    : 'Start with the WhatsApp number to check if this lead is new.'}
                </p>
              </div>

              <div className="space-y-4">
                {phoneStepComplete ? (
                  <div className="flex items-center justify-between gap-3 p-4 bg-[#f4f4f5]/60 rounded-2xl border border-[#e4e4e7]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#18181b] shrink-0 border border-[#e4e4e7]">
                        <Phone size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">WhatsApp Number</p>
                        <p className="text-sm font-bold text-[#18181b] truncate">{formattedPhone}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-label ml-1">Country</label>
                      <div className="relative flex items-center group">
                        <div className="absolute left-4 z-10 flex items-center justify-center">
                          <Globe size={16} className="text-[#a1a1aa] group-focus-within:text-[#18181b] transition-colors" />
                        </div>
                        <select
                          value={formData.dialCode}
                          onChange={(e) => handleDialCodeChange(e.target.value)}
                          className={`${inputStyles} pl-11 appearance-none pr-10 relative z-0`}
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.name} value={c.dialCode}>{c.name} ({c.dialCode})</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 text-[#a1a1aa] pointer-events-none z-10" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-label ml-1">WhatsApp Number <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone size={16} className="text-[#a1a1aa] group-focus-within:text-[#18181b] transition-colors" />
                          <span className="text-sm font-bold text-[#18181b] ml-2 mr-1">{formData.dialCode}</span>
                        </div>
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          value={formData.phone}
                          onChange={(e) => {
                            updatePhone(e.target.value);
                            if (errors.phone) setErrors({ ...errors, phone: '' });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handlePhoneContinue();
                            }
                          }}
                          className={`${inputStyles} pl-[84px] ${errors.phone ? errorStyles : ''}`}
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs font-bold pl-1">{errors.phone}</p>}
                    </div>
                  </div>
                )}

                {showDetailsForm && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label ml-1">Student name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={16} className="text-[#a1a1aa] group-focus-within:text-[#18181b] transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="John Doe (optional)"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({...formData, name: e.target.value});
                          if (errors.name) setErrors({...errors, name: ''});
                        }}
                        className={`${inputStyles} pl-11 ${errors.name ? errorStyles : ''}`}
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs font-bold pl-1">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-label ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={16} className="text-[#a1a1aa] group-focus-within:text-[#18181b] transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({...formData, email: e.target.value});
                          if (errors.email) setErrors({...errors, email: ''});
                        }}
                        className={`${inputStyles} pl-11 ${errors.email ? errorStyles : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs font-bold pl-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label ml-1">Grade</label>
                    <div className="relative">
                      <select 
                        value={formData.class}
                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                        className={`${inputStyles} appearance-none pr-10`}
                      >
                        {grades.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label ml-1">Subject</label>
                    <div className="relative">
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={`${inputStyles} appearance-none pr-10`}
                      >
                        {subjects.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label ml-1">Syllabus</label>
                    <div className="relative">
                      <select 
                        value={formData.syllabus}
                        onChange={(e) => setFormData({...formData, syllabus: e.target.value})}
                        className={`${inputStyles} appearance-none pr-10`}
                      >
                        {syllabi.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label ml-1">Date</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar size={16} className="text-[#a1a1aa] group-focus-within:text-[#18181b] transition-colors" />
                      </div>
                      <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className={`${inputStyles} pl-11`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label ml-1">Source</label>
                    <div className="relative">
                      <select 
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        className={`${inputStyles} appearance-none pr-10`}
                      >
                        {leadSources.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f4f4f5] mt-2" />

                {duplicateIntent === 'sibling' && (
                  <button
                    type="button"
                    onClick={() => setDuplicateIntent(null)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    ← Back to options
                  </button>
                )}

                <div className="bg-green-50 border border-green-200 rounded-[24px] p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  </div>
                  <p className="text-green-800 text-sm font-semibold">
                    {duplicateIntent === 'sibling'
                      ? 'Adding another child on this number. Fill in their details below.'
                      : 'Number is verified and unique. Fill in the details below.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  className="w-full h-14 bg-[#18181b] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 interactive-element"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Send size={18} />
                      Add to Pipeline
                    </>
                  )}
                </button>
                  </form>
                )}

                {showReEnquiryForm && (
                  <div className="space-y-4 pt-2 border-t border-[#f4f4f5]">
                    <p className="text-sm text-[#71717a]">
                      Same student returning
                      {duplicateLead?.status === 'LOST' && ' — lead will reopen to In Progress.'}
                      {duplicateLead?.status === 'JOINED' && ' — status stays Joined, note only.'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label ml-1">Grade</label>
                        <div className="relative">
                          <select
                            value={formData.class}
                            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                            className={`${inputStyles} appearance-none pr-10`}
                          >
                            {grades.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label ml-1">Subject</label>
                        <div className="relative">
                          <select
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className={`${inputStyles} appearance-none pr-10`}
                          >
                            {subjects.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label ml-1">Syllabus</label>
                        <div className="relative">
                          <select
                            value={formData.syllabus}
                            onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                            className={`${inputStyles} appearance-none pr-10`}
                          >
                            {syllabi.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-label ml-1">Date</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar size={16} className="text-[#a1a1aa] group-focus-within:text-[#18181b] transition-colors" />
                          </div>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className={`${inputStyles} pl-11`}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label ml-1">Source</label>
                        <div className="relative">
                          <select
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            className={`${inputStyles} appearance-none pr-10`}
                          >
                            {leadSources.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {isDuplicate && duplicateLead && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-orange-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={16} className="text-orange-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#71717a]">Duplication</span>
                      </div>
                      <p className="text-lg font-black text-orange-600">YES</p>
                      <p className="text-xs text-[#71717a] mt-1">Number already registered</p>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={16} className="text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#71717a]">Lead status</span>
                      </div>
                      {selectedExistingLead ? (
                        <>
                          <p className="text-lg font-black text-[#18181b]">
                            {canManageDuplicateLead(selectedExistingLead) ? selectedExistingLead.status : 'On file'}
                          </p>
                          <p className="text-xs text-[#71717a] mt-1">
                            Counselor: {getLeadOwnerName(selectedExistingLead)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-[#71717a]">Unknown</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-[24px] p-6 overflow-hidden shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shrink-0 mt-1">
                        <Info size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-orange-800 font-bold mb-1">Existing lead found</h3>
                        <p className="text-orange-600/80 text-sm mb-4">
                          {showSharedStaffOptions
                            ? 'WhatsApp Business is shared — another counselor may own this student. Log your chat or request a handoff.'
                            : 'Parents often share one WhatsApp number across children. Choose whether this is the same student calling again, or a different child.'}
                        </p>
                        {existingLeadsAtPhone.length > 0 && (
                          <div className="bg-white/60 rounded-xl p-4 border border-orange-200/50 space-y-2 mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">
                              Students on this number ({existingLeadsAtPhone.length})
                            </p>
                            {existingLeadsAtPhone.map((lead) => (
                              <label
                                key={lead.id}
                                className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer ${
                                  selectedExistingLeadId === lead.id ? 'bg-orange-100/60' : ''
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="existingLead"
                                  checked={selectedExistingLeadId === lead.id}
                                  onChange={() => setSelectedExistingLeadId(lead.id)}
                                  className="mt-1"
                                />
                                <div>
                                  <p className="font-bold text-[#18181b]">{lead.name}</p>
                                  <p className="text-xs font-semibold text-[#71717a]">
                                    {lead.class} • {lead.subject || 'General'} • {lead.status}
                                  </p>
                                  <p className="text-xs text-[#a1a1aa] mt-0.5">
                                    Counselor: {getLeadOwnerName(lead)}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                        {errors.handoff && (
                          <p className="text-red-600 text-xs font-bold">{errors.handoff}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {!phoneStepComplete ? (
              <button
                type="button"
                onClick={() => handlePhoneContinue()}
                className="w-full h-14 bg-[#18181b] text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 interactive-element"
              >
                <Phone size={18} />
                Check Number
              </button>
            ) : showSharedStaffOptions ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleLogWhatsAppContact}
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[#18181b] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 interactive-element"
                >
                  <MessageCircle size={18} />
                  Log WhatsApp contact
                </button>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleRequestHandoff}
                    disabled={isSubmitting}
                    className="w-full sm:flex-1 h-14 bg-white border border-[#e4e4e7] text-[#18181b] rounded-xl text-sm font-medium transition-colors hover:bg-[#f4f4f5] disabled:opacity-50 flex items-center justify-center gap-2 interactive-element"
                  >
                    <ArrowRightLeft size={18} />
                    Request handoff
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateIntent('sibling')}
                    className="w-full sm:flex-1 h-14 bg-white border border-[#e4e4e7] text-[#18181b] rounded-xl text-sm font-medium transition-colors hover:bg-[#f4f4f5] flex items-center justify-center gap-2 interactive-element"
                  >
                    <UserPlus size={18} />
                    Another child
                  </button>
                </div>
              </div>
            ) : showDuplicateChoice ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setDuplicateIntent('reenquiry')}
                  className="w-full sm:flex-1 h-14 bg-white border border-[#e4e4e7] text-[#18181b] rounded-xl text-sm font-medium transition-colors hover:bg-[#f4f4f5] flex items-center justify-center gap-2 interactive-element"
                >
                  <RotateCcw size={18} />
                  Same student
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateIntent('sibling')}
                  className="w-full sm:flex-1 h-14 bg-[#18181b] text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 interactive-element"
                >
                  <UserPlus size={18} />
                  Another child
                </button>
              </div>
            ) : showReEnquiryForm ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setDuplicateIntent(null)}
                  className="w-full sm:flex-1 h-14 bg-white border border-[#e4e4e7] text-[#18181b] rounded-xl text-sm font-medium transition-colors hover:bg-[#f4f4f5] flex items-center justify-center gap-2 interactive-element"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/leads', { state: { highlightLeadId: duplicateLead!.id } })}
                  className="w-full sm:flex-1 h-14 bg-white border border-[#e4e4e7] text-[#18181b] rounded-xl text-sm font-medium transition-colors hover:bg-[#f4f4f5] flex items-center justify-center gap-2 interactive-element"
                >
                  View Lead
                </button>
                <button
                  type="button"
                  onClick={handleLogReEnquiry}
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  className="w-full sm:flex-1 h-14 bg-[#18181b] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 interactive-element"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <RotateCcw size={18} />
                      Log Re-enquiry
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
