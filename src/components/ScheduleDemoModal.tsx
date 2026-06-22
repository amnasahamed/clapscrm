import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { X, Calendar, Clock, User, Video, GraduationCap, Search } from 'lucide-react';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Lead } from '../types';
import { filterViewableLeads } from '../utils/leadAccess';

interface ScheduleDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onDemoScheduled?: () => void;
}

export default function ScheduleDemoModal({ isOpen, onClose, lead, onDemoScheduled }: ScheduleDemoModalProps) {
  const { addDemo, updateLead, leads } = useData();
  const { currentUser, hasPermission } = useAuth();
  
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [teacher, setTeacher] = useState('');
  const [meetLink, setMeetLink] = useState('');
  
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);

  // Reset form when modal opens with a new lead
  useEffect(() => {
    if (isOpen) {
      if (lead) {
        setSelectedLeadId(lead.id);
      } else {
        setSelectedLeadId('');
      }
      setDate('');
      setTime('');
      setTeacher('');
      setMeetLink('');
      setLeadSearchQuery('');
      setIsLeadDropdownOpen(false);
    }
  }, [isOpen, lead]);

  const activeLead = useMemo(() => {
    if (lead) return lead;
    return leads.find(l => l.id === selectedLeadId) || null;
  }, [lead, selectedLeadId, leads]);

  const selectableLeads = useMemo(() => {
    if (!currentUser) return [];
    return filterViewableLeads(leads, currentUser.name, hasPermission('view_all_leads'));
  }, [leads, currentUser, hasPermission]);

  const filteredLeads = useMemo(() => {
    return selectableLeads.filter(l => l.name.toLowerCase().includes(leadSearchQuery.toLowerCase()));
  }, [selectableLeads, leadSearchQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeLead || !date || !time || !teacher) return;

    // Create the demo record
    addDemo({
      leadId: activeLead.id,
      studentName: activeLead.name,
      phone: activeLead.phone,
      class: activeLead.class,
      subject: activeLead.subject || 'General',
      date,
      time,
      teacher,
      status: 'SCHEDULED',
      meetLink,
      createdBy: currentUser?.name
    });

    // Optionally move lead to IN PROGRESS if they are NEW
    if (activeLead.status === 'NEW') {
      updateLead(activeLead.id, { status: 'IN PROGRESS' });
    }

    if (onDemoScheduled) onDemoScheduled();
    onClose();
  };

  return (
    <OverlayShell isOpen={isOpen} onClose={onClose} zIndex={Z.nested} maxWidth="lg">
            <div className="px-6 py-5 border-b border-[#e4e4e7] flex justify-between items-center bg-[#fafafa] shrink-0 relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-[#e4e4e7] rounded-full sm:hidden" />
              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Video size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-[#18181b]">Schedule Demo</h2>
                  <p className="text-xs font-bold text-[#71717a] uppercase tracking-widest">{activeLead ? activeLead.name : 'Select Student'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-[#e4e4e7] rounded-full text-[#71717a]">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain">
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* Lead Selector if no lead is provided */}
                {!lead && (
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Select Lead</label>
                    
                    {!selectedLeadId ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={16} className="text-[#a1a1aa]" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Search students..."
                          value={leadSearchQuery}
                          onChange={e => {
                            setLeadSearchQuery(e.target.value);
                            setIsLeadDropdownOpen(true);
                          }}
                          onFocus={() => setIsLeadDropdownOpen(true)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-[#e4e4e7] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#18181b] shadow-sm transition-all"
                        />
                        
                        {isLeadDropdownOpen && (
                          <div className="absolute z-10 w-full mt-2 bg-white border border-[#e4e4e7] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {filteredLeads.length > 0 ? (
                              filteredLeads.map(l => (
                                <div 
                                  key={l.id}
                                  onClick={() => {
                                    setSelectedLeadId(l.id);
                                    setIsLeadDropdownOpen(false);
                                  }}
                                  className="px-4 py-3 hover:bg-[#f4f4f5] cursor-pointer transition-colors border-b border-[#f4f4f5] last:border-0"
                                >
                                  <p className="text-sm font-bold text-[#18181b]">{l.name}</p>
                                  <p className="text-xs text-[#71717a]">{l.phone} • {l.class}</p>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-[#71717a] text-center">No leads found</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-[#18181b]">{activeLead?.name}</p>
                          <p className="text-xs text-[#71717a]">{activeLead?.class} • {activeLead?.subject}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedLeadId('');
                            setLeadSearchQuery('');
                          }}
                          className="p-1 hover:bg-[#e4e4e7] rounded-md text-[#71717a] transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Class/Grade</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap size={16} className="text-[#a1a1aa]" />
                      </div>
                      <input type="text" disabled value={activeLead?.class || ''} placeholder="Select a lead..." className="w-full pl-10 pr-4 py-3 bg-[#f4f4f5] border border-transparent rounded-xl text-sm font-semibold text-[#a1a1aa] cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Subject</label>
                    <input type="text" disabled value={activeLead?.subject || 'General'} className="w-full px-4 py-3 bg-[#f4f4f5] border border-transparent rounded-xl text-sm font-semibold text-[#a1a1aa] cursor-not-allowed" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-[#a1a1aa]" />
                    </div>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#e4e4e7] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#18181b] shadow-sm transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock size={16} className="text-[#a1a1aa]" />
                    </div>
                    <input 
                      type="time" 
                      required
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#e4e4e7] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#18181b] shadow-sm transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Assigned Teacher</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-[#a1a1aa]" />
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      value={teacher}
                      onChange={e => setTeacher(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#e4e4e7] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#18181b] shadow-sm transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Meeting Link (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="https://zoom.us/j/..."
                    value={meetLink}
                    onChange={e => setMeetLink(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#e4e4e7] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#18181b] shadow-sm transition-all" 
                  />
                </div>

                <div className="pt-4 flex gap-3 shrink-0">
                  <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-[#f4f4f5] text-[#18181b] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#e4e4e7] transition-colors interactive-element">
                    Cancel
                  </button>
                  <button type="submit" disabled={!activeLead} className="flex-1 py-3.5 bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all interactive-element disabled:opacity-50 disabled:cursor-not-allowed">
                    Book Demo
                  </button>
                </div>
              </form>
            </div>
    </OverlayShell>
  );
}
