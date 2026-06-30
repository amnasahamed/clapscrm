import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Phone, MessageCircle, Pencil, User, MapPin, Calendar, CheckSquare, Square, Star } from 'lucide-react';
import OverlayShell from './OverlayShell';
import { Z } from '../constants/overlays';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import EditLeadModal from './EditLeadModal';
import { STATUS_EMOJIS } from '../screens/Leads';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

export default function GlobalLeadModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const { leads, updateLead, addNoteToLead, leadSources, grades, subjects, syllabi, whatsappTemplates, addContactAttemptToLead } = useData();
  const { currentUser, hasPermission } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const lead = useMemo(() => leads.find(l => l.id === leadId), [leads, leadId]);

  const closeProfile = () => {
    setSearchParams(params => {
      params.delete('leadId');
      return params;
    }, { replace: true });
  };

  const handleSaveLead = (id: string, updates: any, newNote?: string) => {
    updateLead(id, updates);
    if (newNote) {
      const stamp = new Date().toISOString().split('T')[0];
      addNoteToLead(id, `${stamp} — ${newNote}`);
    }
    setIsEditing(false);
  };

  const handleWhatsApp = () => {
    if (!lead) return;
    const text = whatsappTemplates.lead.replace('{{name}}', lead.name).replace('{{class}}', lead.class).replace('{{subject}}', lead.subject || '');
    addContactAttemptToLead(lead.id, { date: new Date().toLocaleDateString(), type: 'WHATSAPP', outcome: 'Sent initial message' });
    window.open(`https://wa.me/${lead.phone.replace(/\\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCall = () => {
    if (!lead) return;
    addContactAttemptToLead(lead.id, { date: new Date().toLocaleDateString(), type: 'CALL', outcome: 'Initiated' });
    window.open(`tel:${lead.phone.replace(/\\D/g, '')}`, '_self');
  };

  const canEditLeadStatus = (l: any) =>
    hasPermission('edit_any_lead') ||
    l.createdBy === currentUser?.name ||
    l.assignedTo === currentUser?.name;

  if (!leadId) return null;

  return (
    <>
      <OverlayShell isOpen={!!lead && !isEditing} onClose={closeProfile} zIndex={Z.sheet} maxWidth="md">
        {lead && (
          <div className="flex flex-col h-full bg-white max-h-[85vh]">
            <div className="px-5 py-4 border-b border-[#e4e4e7] flex justify-between items-start bg-[#fafafa] shrink-0 relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#d4d4d8] rounded-full sm:hidden" />
              <div className="flex items-center gap-3 mt-1 sm:mt-0 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-black shrink-0 shadow-inner overflow-hidden border border-[#e4e4e7]"
                  style={{ backgroundColor: lead.country ? '#f4f4f5' : getAvatarColor(lead.name) }}
                >
                  {lead.country ? (
                    <img src={`https://hatscripts.github.io/circle-flags/flags/${lead.country.toLowerCase()}.svg`} alt={lead.country} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(lead.name)
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-[#18181b] truncate flex items-center gap-1.5">
                    {lead.name} {lead.isHot && <Star size={14} className="text-amber-500" fill="currentColor" />}
                  </h3>
                  <p className="text-xs text-[#71717a] font-semibold">{lead.phone}</p>
                </div>
              </div>
              <button
                onClick={closeProfile}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[#e4e4e7] shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5 overscroll-contain">
              {/* Badges / Quick Info */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border items-center gap-1.5 ${
                  lead.status === 'JOINED' ? 'bg-green-50 text-green-700 border-green-200' :
                  lead.status === 'LOST' ? 'bg-[#f4f4f5] text-[#71717a] border-[#e4e4e7]' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  <span>{STATUS_EMOJIS[lead.status]}</span>
                  <span>{lead.status}</span>
                </span>
                {lead.interestStatus && (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${
                    lead.interestStatus === 'Interested' ? 'bg-green-100 text-green-700' :
                    lead.interestStatus === 'Re-follow' ? 'bg-blue-100 text-blue-700' :
                    lead.interestStatus === 'Not Interested' ? 'bg-red-100 text-red-700' :
                    lead.interestStatus === 'Dead End' ? 'bg-zinc-800 text-zinc-100' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {lead.interestStatus}
                  </span>
                )}
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-1">Class & Subject</p>
                  <p className="text-sm font-bold text-[#18181b]">{lead.class} {lead.subject ? `· ${lead.subject}` : ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-1">Date added</p>
                  <p className="text-sm font-bold text-[#18181b]">{lead.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-1">Source</p>
                  <p className="text-sm font-bold text-[#18181b]">{lead.source}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-1">Ownership</p>
                  <p className="text-sm font-bold text-[#18181b] truncate">{lead.assignedTo || lead.createdBy}</p>
                </div>
                {lead.nextFollowUp && (
                  <div className="col-span-2 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Calendar size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-0.5">Scheduled Follow-Up</p>
                      <p className="text-sm font-bold text-blue-900">
                        {new Date(lead.nextFollowUp).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Timeline */}
              {(lead.notes?.length ?? 0) > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-[#e4e4e7]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-2">History & Notes</p>
                  <div className="space-y-3">
                    {lead.notes!.map((note: string, idx: number) => (
                      <div key={idx} className="bg-[#f4f4f5] p-3 rounded-xl border border-[#e4e4e7]">
                        <p className="text-xs text-[#71717a] font-medium leading-relaxed">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-[#e4e4e7] bg-[#fafafa] shrink-0 safe-bottom">
              <div className="flex gap-2">
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 py-3 min-h-[44px] bg-[#25D366] text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button
                  onClick={handleCall}
                  className="flex-1 py-3 min-h-[44px] bg-[#007AFF] text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Phone size={16} /> Call
                </button>
                {canEditLeadStatus(lead) && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-3 min-w-[44px] min-h-[44px] bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl flex items-center justify-center transition-colors"
                      title="Schedule Follow-Up"
                    >
                      <Calendar size={18} />
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-3 min-w-[44px] min-h-[44px] bg-white text-[#18181b] border border-[#e4e4e7] hover:border-[#18181b] rounded-xl flex items-center justify-center transition-colors"
                      title="Edit Lead"
                    >
                      <Pencil size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </OverlayShell>

      <EditLeadModal
        isOpen={isEditing}
        lead={lead || null}
        leads={leads}
        leadSources={leadSources}
        grades={grades}
        subjects={subjects}
        syllabi={syllabi}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveLead}
      />
    </>
  );
}
