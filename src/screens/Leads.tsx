import { useState, useMemo, useEffect, useRef } from 'react';
import type React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronRight, Info, ArrowUpDown, LayoutGrid, List as ListIcon, Phone, MessageCircle, Star, Trash2, X, CheckSquare, Video, MoreHorizontal, ArrowRightLeft, UserCog, Check, Ban, Plus, Pencil, Download, History } from 'lucide-react';
import { Lead } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useStaff } from '../contexts/StaffContext';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// @hello-pangea/dnd's DraggableProps omits React's special `key` attribute, so we
// widen it via a typed alias to allow the standard `key` on mapped elements.
const DraggableKeyed = Draggable as unknown as React.ComponentType<
  React.ComponentProps<typeof Draggable> & { key?: string | number }
>;
import FilterLeadsModal, { LeadFilters } from '../components/FilterLeadsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ScheduleDemoModal from '../components/ScheduleDemoModal';
import TransferLeadModal from '../components/TransferLeadModal';
import ReassignLeadModal from '../components/ReassignLeadModal';
import EditLeadModal from '../components/EditLeadModal';
import MarkJoinedModal from '../components/MarkJoinedModal';
import BottomSheet from '../components/BottomSheet';
import SwipeableItem from '../components/SwipeableItem';
import { useIsMobile } from '../hooks/useIsMobile';
import { MOBILE_BULK_BAR_BOTTOM, MOBILE_CONTENT_PB } from '../constants/layout';
import { filterViewableLeads } from '../utils/leadAccess';
import { isInDateRange } from '../utils/dateFilter';
import { JOINED_FALLBACK_AMOUNT } from '../utils/collection';
import { exportLeadsCsv } from '../utils/exporters';

type SortField = 'date' | 'name' | 'status';
type ViewMode = 'list' | 'board';
const COLUMNS = ['NEW', 'IN PROGRESS', 'JOINED', 'LOST'] as const;
type LeadStatus = Lead['status'];

const STATUS_COLORS: Record<LeadStatus, string> = {
  'NEW': 'bg-blue-50 text-blue-700 border-blue-200',
  'IN PROGRESS': 'bg-amber-50 text-amber-700 border-amber-200',
  'JOINED': 'bg-green-50 text-green-700 border-green-200',
  'LOST': 'bg-[#f4f4f5] text-[#71717a] border-[#e4e4e7]',
};

export const STATUS_EMOJIS: Record<LeadStatus, string> = {
  'NEW': '🆕',
  'IN PROGRESS': '📞',
  'JOINED': '🎉',
  'LOST': '❌',
};

function FollowUpTracker({ followUpCount, onIncrement }: { followUpCount: number; onIncrement: () => void }) {
  const count = followUpCount || 0;
  return (
    <div className="w-full mt-1" title={`${count}/5 Follow-ups`}>
      <div className="flex items-center gap-1 w-full p-1 bg-[#f4f4f5] rounded-xl border border-[#e4e4e7] shadow-inner">
        {[1, 2, 3, 4, 5].map((step) => {
          const isCompleted = step <= count;
          const isNext = step === count + 1;
          return (
            <button
              key={step}
              onClick={(e) => {
                e.stopPropagation();
                if (isNext) onIncrement();
              }}
              disabled={!isNext}
              className={`flex-1 h-10 rounded-lg flex items-center justify-center transition-all ${
                isCompleted 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : isNext 
                    ? 'bg-white text-blue-600 shadow-sm cursor-pointer hover:bg-blue-50 ring-1 ring-inset ring-black/5 interactive-element' 
                    : 'bg-transparent text-[#a1a1aa] cursor-not-allowed'
              }`}
            >
              {isCompleted ? <Check size={16} strokeWidth={4} /> : <span className="text-sm font-bold">{step}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LeadStatusControl({
  status,
  onChange,
  editable,
  className = '',
  followUpCount = 0,
}: {
  status: LeadStatus;
  onChange: (status: LeadStatus) => void;
  editable: boolean;
  className?: string;
  followUpCount?: number;
}) {
  if (!editable) {
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border items-center gap-1.5 ${STATUS_COLORS[status]} ${className}`}>
        <span>{STATUS_EMOJIS[status]}</span>
        <span>{status === 'IN PROGRESS' ? 'Follow-up' : status}</span>
      </span>
    );
  }

  return (
    <select
      value={status}
      onChange={(e) => {
        const val = e.target.value as LeadStatus;
        if (status === 'IN PROGRESS' && val === 'LOST' && (followUpCount || 0) < 5) {
          alert(`You must log 5 follow-ups before marking this lead as LOST. Currently at ${followUpCount || 0}/5.`);
          e.target.value = status;
          return;
        }
        onChange(val);
      }}
      onClick={(e) => e.stopPropagation()}
      className={`appearance-none px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer outline-none focus:ring-2 focus:ring-[#18181b]/20 ${STATUS_COLORS[status]} ${className}`}
    >
      {COLUMNS.map(c => (
        <option key={c} value={c}>
          {STATUS_EMOJIS[c]} {c === 'IN PROGRESS' ? 'Follow-up' : c}
        </option>
      ))}
    </select>
  );
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase();
}

export default function Leads() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();
  const { staffNames } = useStaff();
  const {
    leads, updateLead, deleteLead, whatsappTemplates, addContactAttemptToLead, addNoteToLead,
    incrementLeadFollowUp,
    leadTransfers, createLeadTransfer, acceptLeadTransfer, rejectLeadTransfer,
    cancelLeadTransfer, reassignLead, leadSources, grades, subjects, syllabi
  } = useData();
  
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced Filters
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [leadFilters, setLeadFilters] = useState<LeadFilters>({
    dateRange: 'ALL',
    status: [],
    createdBy: 'ALL',
    source: 'ALL',
    followUpCount: 'ALL'
  });

  const [showHotOnly, setShowHotOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
  const [transferringLead, setTransferringLead] = useState<Lead | null>(null);
  const [reassigningLead, setReassigningLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  // Pending JOINED transition — captured so we can prompt for the collected amount.
  const [pendingJoin, setPendingJoin] = useState<Lead | null>(null);

  // High Volume State
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [visibleListCount, setVisibleListCount] = useState(50);
  const [visibleBoardCounts, setVisibleBoardCounts] = useState<Record<string, number>>({
    'NEW': 20, 'IN PROGRESS': 20, 'JOINED': 20, 'LOST': 20
  });

  // Mobile specific state
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState<typeof COLUMNS[number]>('NEW');
  const [selectedMobileLead, setSelectedMobileLead] = useState<Lead | null>(null);
  const [highlightLeadId, setHighlightLeadId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  const canViewAllLeads = hasPermission('view_all_leads');

  const viewableLeads = useMemo(() => {
    if (!currentUser) return [];
    return filterViewableLeads(leads, currentUser.name, canViewAllLeads);
  }, [leads, currentUser, canViewAllLeads]);

  useEffect(() => {
    const state = location.state as { highlightLeadId?: string } | null;
    const leadId = state?.highlightLeadId;
    if (!leadId) return;

    const lead = viewableLeads.find(l => l.id === leadId);
    if (!lead) {
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (isMobile) {
      setActiveMobileTab(lead.status);
      setSelectedMobileLead(lead);
    } else {
      setViewMode('list');
    }

    setHighlightLeadId(leadId);
    navigate(location.pathname, { replace: true, state: null });

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightLeadId(null);
    }, 3000);

    window.setTimeout(() => {
      document.getElementById(`lead-row-${leadId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [location.state, viewableLeads, isMobile, navigate, location.pathname]);

  const filteredLeads = useMemo(() => {
    return viewableLeads.filter(lead => {
      // Search
      const matchesSearch = !searchQuery || 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        lead.phone.includes(searchQuery);
      
      // Status
      const matchesStatus = leadFilters.status.length === 0 || leadFilters.status.includes(lead.status);
      
      // Source
      const matchesSource = leadFilters.source === 'ALL' || lead.source === leadFilters.source;
      
      // Created By (Owner)
      const matchesCreator = leadFilters.createdBy === 'ALL' || lead.createdBy === leadFilters.createdBy;
      
      // Date Range
      const matchesDate = isInDateRange(lead.date, leadFilters.dateRange);

      // Follow-up Count
      let matchesFollowUp = true;
      if (leadFilters.followUpCount !== 'ALL') {
        const count = lead.followUpCount || 0;
        matchesFollowUp = count === leadFilters.followUpCount;
      }

      // Hot Only
      const matchesHot = showHotOnly ? lead.isHot : true;

      return matchesSearch && matchesStatus && matchesSource && matchesCreator && matchesDate && matchesFollowUp && matchesHot;
    }).sort((a, b) => {
      if (sortField === 'date') {
        if (a.isHot && !b.isHot) return -1;
        if (!a.isHot && b.isHot) return 1;
      }
      let comparison = 0;
      if (sortField === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortField === 'status') comparison = a.status.localeCompare(b.status);
      else comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [viewableLeads, searchQuery, leadFilters, showHotOnly, sortField, sortOrder]);

  const incomingTransfers = useMemo(() => {
    if (!currentUser) return [];
    return leadTransfers.filter(t => t.toStaff === currentUser.name && t.status === 'pending');
  }, [leadTransfers, currentUser]);

  const outgoingTransfers = useMemo(() => {
    if (!currentUser) return [];
    return leadTransfers.filter(t => t.fromStaff === currentUser.name && t.status === 'pending');
  }, [leadTransfers, currentUser]);

  const canEditLeadStatus = (lead: Lead) =>
    hasPermission('edit_any_lead') ||
    lead.createdBy === currentUser?.name ||
    lead.assignedTo === currentUser?.name;

  const canEditLead = canEditLeadStatus;

  /**
   * Centralized status change. Moving a lead INTO JOINED opens the amount
   * prompt first; everything else updates immediately. Moving a lead OUT of
   * JOINED leaves the previously recorded amount intact.
   */
  const handleStatusChange = (lead: Lead, nextStatus: LeadStatus) => {
    if (nextStatus === lead.status) return;
    if (nextStatus === 'JOINED') {
      setPendingJoin(lead);
      return;
    }
    updateLead(lead.id, { status: nextStatus });
  };

  const confirmJoin = (leadId: string, amountCollected: number) => {
    updateLead(leadId, {
      status: 'JOINED',
      amountCollected,
      joinedDate: new Date().toISOString(),
    });
    setPendingJoin(null);
    setSelectedMobileLead(null);
  };

  const handleSaveLead = (leadId: string, updates: Partial<Lead>, newNote?: string) => {
    updateLead(leadId, updates);
    if (newNote) {
      const stamp = new Date().toISOString().split('T')[0];
      addNoteToLead(leadId, `${stamp} — ${newNote}`);
    }
    const fresh = leads.find((l) => l.id === leadId);
    if (fresh && selectedMobileLead?.id === leadId) {
      setSelectedMobileLead({ ...fresh, ...updates });
    }
    setEditingLead(null);
  };

  const canTransferLead = (lead: Lead) =>
    hasPermission('transfer_leads') &&
    (lead.assignedTo === currentUser?.name || lead.createdBy === currentUser?.name);

  const handleTransfer = (leadId: string, toStaff: string) =>
    createLeadTransfer(leadId, currentUser!.name, toStaff);

  const handleReassign = (leadId: string, newStaff: string) => {
    reassignLead(leadId, newStaff);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const toggleLeadSelection = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  const toggleAllSelections = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBulkStatusChange = (status: string) => {
    if (!hasPermission('bulk_operations')) return;
    const isJoining = status === 'JOINED';
    selectedLeads.forEach(id => {
      const lead = leads.find(l => l.id === id);
      if (lead && canEditLeadStatus(lead) && lead.status !== status) {
        if (isJoining) {
          updateLead(id, {
            status: 'JOINED' as LeadStatus,
            amountCollected: typeof lead.amountCollected === 'number' && lead.amountCollected > 0
              ? lead.amountCollected
              : JOINED_FALLBACK_AMOUNT,
            joinedDate: new Date().toISOString(),
          });
        } else {
          updateLead(id, { status: status as LeadStatus });
        }
      }
    });
    setSelectedLeads(new Set());
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedLeads.size} leads?`)) {
      selectedLeads.forEach(id => deleteLead(id));
      setSelectedLeads(new Set());
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
    setSelectedMobileLead(null);
  };
  const handleDeleteConfirmed = () => { 
    if (deleteId) { 
      deleteLead(deleteId); 
      setDeleteId(null); 
      setSelectedMobileLead(null);
    } 
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const lead = leads.find(l => l.id === draggableId);
    if (!lead || !canEditLeadStatus(lead)) return;
    handleStatusChange(lead, destination.droppableId as LeadStatus);
  };

  const handleWhatsApp = (lead: Lead) => {
    const text = whatsappTemplates.lead.replace('{{name}}', lead.name).replace('{{class}}', lead.class).replace('{{subject}}', lead.subject || '');
    addContactAttemptToLead(lead.id, { date: new Date().toLocaleDateString(), type: 'WHATSAPP', outcome: 'Sent initial message' });
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const MobilePipeline = () => {
    const mobileLeads = filteredLeads.filter(l => l.status === activeMobileTab);
    const visibleMobileLeads = mobileLeads.slice(0, visibleListCount);
    
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl border border-[#e4e4e7] overflow-hidden shadow-sm">
        {/* Lead Pipeline Summary */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-fade-x">
            {COLUMNS.map(col => {
              const count = filteredLeads.filter(l => l.status === col).length;
              const shortName = col === 'NEW' ? 'New' : col === 'IN PROGRESS' ? 'Prog' : col === 'JOINED' ? 'Join' : 'Lost';
              return (
                <div key={col} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold whitespace-nowrap bg-white ${STATUS_COLORS[col].split(' ').filter(c => c.startsWith('border-') || c.startsWith('text-')).join(' ')} shadow-sm`}>
                  <span>{STATUS_EMOJIS[col]}</span>
                  <span>{shortName}</span>
                  <span className="opacity-70 ml-0.5">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* iOS Segmented Control */}
        <div className="shrink-0 bg-white px-4 pb-3 border-b border-[#f4f4f5]">
          <div className="flex bg-[#f4f4f5] p-1 rounded-xl items-center w-full">
            {COLUMNS.map(col => {
              const count = filteredLeads.filter(l => l.status === col).length;
              const isActive = activeMobileTab === col;
              const shortName = col === 'NEW' ? 'New' : col === 'IN PROGRESS' ? 'Progress' : col === 'JOINED' ? 'Joined' : 'Lost';
              return (
                <button
                  key={col}
                  onClick={() => { setActiveMobileTab(col); setVisibleListCount(50); }}
                  className={`flex-1 py-2.5 min-h-[44px] text-xs font-bold rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-[#18181b] shadow-sm'
                      : 'text-[#a1a1aa] active:bg-[#e4e4e7]'
                  }`}
                >
                  {shortName} {count}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lead List */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-4 space-y-0 pt-1 overscroll-contain"
          style={{ paddingBottom: MOBILE_CONTENT_PB }}
        >
          <div className="flex items-center justify-between py-3 mb-1">
            <h2 className="text-sm font-black text-[#18181b]">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
            </h2>
          </div>

          {mobileLeads.length === 0 ? (
            <div className="py-12 text-center text-[#a1a1aa]">
              <p className="font-bold">No leads in {activeMobileTab}</p>
            </div>
          ) : (
            visibleMobileLeads.map((lead) => (
              <div key={lead.id} id={`lead-row-${lead.id}`} className="mb-3">
              <SwipeableItem
                leftAction={{
                  icon: <MessageCircle size={24} />,
                  label: "WhatsApp",
                  colorClass: "bg-[#25D366] text-white rounded-2xl",
                  onAction: () => handleWhatsApp(lead)
                }}
                rightAction={{
                  icon: <Phone size={24} />,
                  label: "Call",
                  colorClass: "bg-[#007AFF] text-white rounded-2xl",
                  onAction: () => {
                    addContactAttemptToLead(lead.id, { date: new Date().toLocaleDateString(), type: 'CALL', outcome: 'Initiated' });
                    window.open(`tel:${lead.phone.replace(/\D/g, '')}`, '_self');
                  }
                }}
              >
                <div 
                  onClick={() => {
                    setSelectedMobileLead(lead);
                  }}
                  className={`flex items-start gap-3.5 p-4 bg-white rounded-2xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all relative cursor-pointer min-h-[72px] active:scale-[0.98] ${highlightLeadId === lead.id ? 'border-[#18181b] ring-1 ring-[#18181b] bg-amber-50/20' : 'border-[#e4e4e7]'}`}
                >

                  
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-black shrink-0 shadow-inner" style={{ backgroundColor: getAvatarColor(lead.name) }}>
                    {getInitials(lead.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-black tracking-tight text-[#18181b] truncate text-base">{lead.name}</h4>
                        {lead.isHot && <Star size={14} className="text-amber-500 shrink-0" fill="currentColor" />}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedMobileLead(lead); }} className="p-2 -mr-2 -mt-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#a1a1aa] active:bg-[#f4f4f5] rounded-xl shrink-0">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-[#71717a] truncate mb-2">{lead.class} • {lead.subject || 'General'}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[11px] font-bold text-[#a1a1aa]">{lead.date}</span>
                      {lead.status === 'IN PROGRESS' && (
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg ring-1 ring-inset ring-blue-100">
                          {lead.followUpCount || 0}/5 Follow-ups
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SwipeableItem>
              </div>
            ))
          )}
          
          {visibleMobileLeads.length < mobileLeads.length && (
            <button 
              onClick={() => setVisibleListCount(prev => prev + 50)}
              className="w-full py-4 text-sm font-bold text-[#18181b] bg-[#f4f4f5] rounded-xl hover:bg-[#e4e4e7] transition-colors mt-4"
            >
              Load More ({mobileLeads.length - visibleMobileLeads.length} remaining)
            </button>
          )}
        </div>
      </div>
    );
  };

  const visibleDesktopLeads = filteredLeads.slice(0, visibleListCount);

  return (
    <div className="space-y-4 flex flex-col min-h-0 flex-1 relative">

      {/* Pending Transfer Requests */}
      {incomingTransfers.length > 0 && (
        <div className="shrink-0 space-y-2">
          {incomingTransfers.map(transfer => (
            <div key={transfer.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Transfer request from {transfer.fromStaff}
                </p>
                <p className="text-xs text-amber-700">
                  {transfer.leadName} — accept to add to your pipeline
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptLeadTransfer(transfer.id)}
                  className="px-4 py-2.5 min-h-[44px] bg-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={() => rejectLeadTransfer(transfer.id)}
                  className="px-4 py-2.5 min-h-[44px] bg-white border border-amber-300 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Ban size={14} /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {outgoingTransfers.length > 0 && (
        <div className="shrink-0 space-y-2">
          {outgoingTransfers.map(transfer => (
            <div key={transfer.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-blue-900">
                  Pending transfer: {transfer.leadName} → {transfer.toStaff}
                </p>
                <p className="text-xs text-blue-700">Waiting for acceptance</p>
              </div>
              <button
                onClick={() => cancelLeadTransfer(transfer.id)}
                className="px-4 py-2 bg-white border border-blue-300 text-blue-800 rounded-xl text-xs font-bold"
              >
                Cancel Request
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Header Controls */}
      {isMobile ? (
        <div className="flex flex-col gap-3 shrink-0 mb-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-[#a1a1aa]" />
            </div>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f4f4f5] border-transparent focus:bg-white border focus:border-[#18181b] rounded-xl text-sm font-semibold transition-all outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setShowHotOnly(!showHotOnly)}
              className={`px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${showHotOnly ? 'bg-amber-100 text-amber-700' : 'bg-transparent text-[#71717a]'}`}
            >
              <Star size={14} fill={showHotOnly ? 'currentColor' : 'none'} /> Hot Leads
            </button>
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-transparent text-[#18181b]"
            >
              Filters {(leadFilters.status.length > 0 || leadFilters.source !== 'ALL' || leadFilters.createdBy !== 'ALL' || leadFilters.dateRange !== 'ALL') && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex bg-[#f4f4f5] p-1 rounded-2xl border border-[#e4e4e7]">
              <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-[#18181b] shadow-sm' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}>
                <ListIcon size={18} />
              </button>
              <button onClick={() => setViewMode('board')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'board' ? 'bg-white text-[#18181b] shadow-sm' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}>
                <LayoutGrid size={18} />
              </button>
            </div>
            
            <div className="relative flex-1 lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-[#a1a1aa]" />
              </div>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#e4e4e7] rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#18181b] shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setShowHotOnly(!showHotOnly)}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 border interactive-element ${showHotOnly ? 'bg-amber-100 text-amber-600 border-amber-200 shadow-inner' : 'bg-white text-[#18181b] border-[#e4e4e7] hover:border-[#18181b]'}`}
            >
              <Star size={14} fill={showHotOnly ? 'currentColor' : 'none'} /> Hot Leads
            </button>

            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="px-4 py-3 bg-white border border-[#e4e4e7] hover:border-[#18181b] rounded-xl text-xs font-bold text-[#18181b] shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              Filters
              {(leadFilters.status.length > 0 || leadFilters.source !== 'ALL' || leadFilters.createdBy !== 'ALL' || leadFilters.dateRange !== 'ALL') && (
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              )}
            </button>

            {hasPermission('export_data') && (
              <button
                onClick={() => exportLeadsCsv(filteredLeads)}
                disabled={filteredLeads.length === 0}
                title={`Export ${filteredLeads.length} leads to CSV`}
                className="px-4 py-3 bg-white border border-[#e4e4e7] hover:border-[#18181b] rounded-xl text-xs font-bold text-[#18181b] shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed interactive-element"
              >
                <Download size={14} /> Export
              </button>
            )}

          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {isMobile ? (
          <MobilePipeline />
        ) : (
          viewMode === 'board' ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-4 custom-scrollbar">
                {COLUMNS.map(colId => {
                  const colLeads = filteredLeads.filter(l => l.status === colId);
                  const visibleColLeads = colLeads.slice(0, visibleBoardCounts[colId]);

                  return (
                    <div key={colId} className="w-[320px] shrink-0 flex flex-col min-h-0 recessed-tray p-4">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-black text-[#18181b] text-sm uppercase tracking-widest">{colId}</h3>
                        <span className="bg-white text-[#18181b] text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm border border-[#e4e4e7]">
                          {colLeads.length}
                        </span>
                      </div>
                      
                      <Droppable droppableId={colId}>
                        {(provided, snapshot) => (
                          <div 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 p-1 transition-colors rounded-2xl ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                          >
                            {/* In high volume mode, we don't use heavy framer-motion layout inside the board to save frames */}
                            {visibleColLeads.map((lead, index) => (
                              <DraggableKeyed draggableId={lead.id} index={index} key={lead.id} isDragDisabled={!canEditLeadStatus(lead)}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white border border-[#e4e4e7] p-3.5 rounded-xl transition-colors group relative ${
                                      snapshot.isDragging ? 'shadow-md ring-2 ring-[#18181b]/20 z-50' : 'hover:border-[#d4d4d8]'
                                    } ${selectedLeads.has(lead.id) ? 'ring-2 ring-[#18181b]/30 bg-[#fafafa]' : ''}`}
                                  >
                                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedLeads.has(lead.id)}
                                        onChange={() => toggleLeadSelection(lead.id)}
                                        className="w-4 h-4 rounded border-[#e4e4e7] accent-[#18181b] cursor-pointer"
                                      />
                                    </div>

                                    <div className="flex justify-between items-start mb-2 pr-6">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <h4 className="font-bold text-[#18181b] truncate">{lead.name}</h4>
                                        {lead.isHot && <span className="bg-amber-100 text-amber-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ring-1 ring-amber-200 shrink-0">Hot</span>}
                                      </div>
                                    </div>
                                    <p className="text-xs font-semibold text-[#71717a] mb-3 truncate">{lead.class} • {lead.subject || 'General'}</p>

                                    <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                                      <LeadStatusControl
                                        status={lead.status}
                                        onChange={(status) => handleStatusChange(lead, status)}
                                        editable={canEditLeadStatus(lead)}
                                        followUpCount={lead.followUpCount}
                                      />
                                      {lead.status === 'IN PROGRESS' && (
                                        <FollowUpTracker 
                                          followUpCount={lead.followUpCount} 
                                          onIncrement={() => incrementLeadFollowUp(lead.id)} 
                                        />
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-[#f4f4f5]">
                                      <div className="flex items-center gap-2">
                                        {hasPermission('view_all_leads') && lead.assignedTo && lead.assignedTo !== lead.createdBy && (
                                          <div 
                                            className="w-5 h-5 rounded-full bg-[#f4f4f5] text-[#18181b] flex items-center justify-center text-[8px] font-black shrink-0 border border-[#e4e4e7]"
                                            title={`Assigned to ${lead.assignedTo} (created by ${lead.createdBy})`}
                                          >
                                            {lead.assignedTo.charAt(0)}
                                          </div>
                                        )}
                                        <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest">{lead.date}</span>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                        {canEditLead(lead) && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setEditingLead(lead); }}
                                            className="p-1.5 bg-[#f4f4f5] text-[#18181b] hover:bg-[#e4e4e7] rounded-lg transition-colors interactive-element"
                                            title="Edit Lead"
                                          >
                                            <Pencil size={14} />
                                          </button>
                                        )}
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setSchedulingLead(lead); }}
                                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors interactive-element"
                                          title="Schedule Demo"
                                        >
                                          <Video size={14} />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(lead); }}
                                          className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors interactive-element"
                                          title="WhatsApp"
                                        >
                                          <MessageCircle size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DraggableKeyed>
                            ))}
                            {provided.placeholder}
                            
                            {visibleColLeads.length < colLeads.length && (
                              <button 
                                onClick={() => setVisibleBoardCounts(prev => ({...prev, [colId]: prev[colId] + 20}))}
                                className="w-full py-3 text-xs font-bold text-[#18181b] bg-white border border-[#e4e4e7] rounded-xl shadow-sm hover:bg-[#f4f4f5] transition-colors mt-2"
                              >
                                Load More
                              </button>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-2">
               <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white rounded-xl border border-[#e4e4e7] mb-4 sticky top-0 z-10 shadow-sm">
                <div className="col-span-1 flex items-center">
                   <input type="checkbox" onChange={toggleAllSelections} checked={selectedLeads.size > 0 && selectedLeads.size === filteredLeads.length} className="w-4 h-4 rounded border-[#e4e4e7] accent-[#18181b] cursor-pointer" />
                </div>
                <div className={canViewAllLeads ? 'col-span-2' : 'col-span-3'}><SortButton field="name" label="Student Details" currentSort={sortField} order={sortOrder} onClick={handleSort} /></div>
                <div className="col-span-2"><span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Course</span></div>
                <div className="col-span-2"><SortButton field="status" label="Status" currentSort={sortField} order={sortOrder} onClick={handleSort} /></div>
                <div className="col-span-2"><SortButton field="date" label="Added Date" currentSort={sortField} order={sortOrder} onClick={handleSort} /></div>
                {canViewAllLeads && (
                  <div className="col-span-2"><span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Added By</span></div>
                )}
                <div className={`text-right ${canViewAllLeads ? 'col-span-1' : 'col-span-2'}`}><span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Actions</span></div>
              </div>
  
              {visibleDesktopLeads.map((lead) => (
                <LeadCardList 
                  key={lead.id}
                  id={`lead-row-${lead.id}`}
                  isHighlighted={highlightLeadId === lead.id}
                  lead={lead} 
                  isSelected={selectedLeads.has(lead.id)}
                  onToggleSelect={() => toggleLeadSelection(lead.id)}
                  onDelete={() => confirmDelete(lead.id)}
                  onUpdateStatus={(status: LeadStatus) => handleStatusChange(lead, status)}
                  onToggleHot={() => updateLead(lead.id, { isHot: !lead.isHot })}
                  canDelete={hasPermission('delete_lead')}
                  canEditStatus={canEditLeadStatus(lead)}
                  onWhatsApp={() => handleWhatsApp(lead)}
                  onScheduleDemo={() => setSchedulingLead(lead)}
                  showOwner={hasPermission('view_all_leads')}
                  canTransfer={canTransferLead(lead)}
                  canReassign={hasPermission('reassign_leads')}
                  onTransfer={() => setTransferringLead(lead)}
                  onReassign={() => setReassigningLead(lead)}
                  onEdit={() => setEditingLead(lead)}
                  canEdit={canEditLead(lead)}
                  onIncrementFollowUp={() => incrementLeadFollowUp(lead.id)}
                />
              ))}

              {visibleDesktopLeads.length < filteredLeads.length && (
                <div className="py-6 flex justify-center">
                  <button 
                    onClick={() => setVisibleListCount(prev => prev + 50)}
                    className="px-6 py-3 text-sm font-bold text-[#18181b] bg-white border border-[#e4e4e7] rounded-2xl shadow-sm hover:bg-[#f4f4f5] transition-colors interactive-element"
                  >
                    Load More Leads ({filteredLeads.length - visibleDesktopLeads.length} remaining)
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedLeads.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bg-[#18181b] border border-white/10 text-white px-4 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center justify-center gap-3 z-[100]"
            style={{ bottom: isMobile ? MOBILE_BULK_BAR_BOTTOM : '7rem' }}
          >
            <span className="font-bold text-sm bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
              <CheckSquare size={16} /> {selectedLeads.size} Selected
            </span>
            <div className="h-6 w-px bg-white/20 mx-1" />
            
            <div className="flex items-center gap-3">
              {hasPermission('bulk_operations') && (
              <select 
                onChange={(e) => handleBulkStatusChange(e.target.value)}
                className="bg-white/10 border border-white/20 hover:bg-white/20 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer transition-colors appearance-none"
                defaultValue=""
              >
                <option value="" disabled className="text-black">Change status</option>
                {COLUMNS.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
              </select>
              )}
              {hasPermission('delete_lead') && (
                <button onClick={handleBulkDelete} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors interactive-element">
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={() => setSelectedLeads(new Set())} className="p-2 hover:bg-white/10 text-[#a1a1aa] rounded-xl transition-colors interactive-element ml-2">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
      />

      <ScheduleDemoModal 
        isOpen={!!schedulingLead} 
        lead={schedulingLead} 
        onClose={() => setSchedulingLead(null)} 
      />

      <FilterLeadsModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={leadFilters}
        onApplyFilters={setLeadFilters}
        availableCreators={Array.from(new Set(leads.map(l => l.createdBy).filter(Boolean)))}
        availableSources={leadSources}
        availableStatuses={COLUMNS as any as string[]}
        isAdmin={hasPermission('view_all_leads')}
      />

      <TransferLeadModal
        isOpen={!!transferringLead}
        lead={transferringLead}
        staffOptions={staffNames}
        currentUserName={currentUser?.name || ''}
        onClose={() => setTransferringLead(null)}
        onTransfer={handleTransfer}
      />

      <ReassignLeadModal
        isOpen={!!reassigningLead}
        lead={reassigningLead}
        staffOptions={staffNames}
        onClose={() => setReassigningLead(null)}
        onReassign={handleReassign}
      />

      <EditLeadModal
        isOpen={!!editingLead}
        lead={editingLead}
        leads={leads}
        leadSources={leadSources}
        grades={grades}
        subjects={subjects}
        syllabi={syllabi}
        onClose={() => setEditingLead(null)}
        onSave={handleSaveLead}
      />

      <MarkJoinedModal
        isOpen={!!pendingJoin}
        lead={pendingJoin}
        onClose={() => setPendingJoin(null)}
        onConfirm={confirmJoin}
      />

      {/* Mobile lead detail bottom sheet */}
      <BottomSheet
        isOpen={!!selectedMobileLead && selectedLeads.size === 0}
        onClose={() => setSelectedMobileLead(null)}
        title={selectedMobileLead?.name}
        subtitle={selectedMobileLead ? `${selectedMobileLead.phone} · ${selectedMobileLead.class}` : undefined}
        footer={selectedMobileLead ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleWhatsApp(selectedMobileLead)}
                className="flex items-center justify-center gap-2 py-3.5 min-h-[48px] bg-[#25D366] text-white rounded-xl font-bold text-sm interactive-element"
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
              <button
                onClick={() => {
                  addContactAttemptToLead(selectedMobileLead.id, { date: new Date().toLocaleDateString(), type: 'CALL', outcome: 'Initiated' });
                  window.open(`tel:${selectedMobileLead.phone.replace(/\D/g, '')}`, '_self');
                }}
                className="flex items-center justify-center gap-2 py-3.5 min-h-[48px] bg-[#007AFF] text-white rounded-xl font-bold text-sm interactive-element"
              >
                <Phone size={18} /> Call
              </button>
            </div>
            <button
              onClick={() => { setSchedulingLead(selectedMobileLead); setSelectedMobileLead(null); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 min-h-[48px] bg-[#18181b] text-white rounded-xl font-bold text-sm interactive-element"
            >
              <Video size={18} /> Schedule Demo
            </button>
          </div>
        ) : undefined}
      >
        {selectedMobileLead && (
          <div className="p-4 space-y-6 pb-8">
            {hasPermission('view_all_leads') && selectedMobileLead.assignedTo && selectedMobileLead.assignedTo !== selectedMobileLead.createdBy && (
              <div className="flex items-start gap-2 bg-[#f4f4f5] p-3 rounded-xl border border-[#e4e4e7]">
                <Info size={16} className="text-[#71717a] mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-[#71717a] leading-relaxed">
                  Assigned to <span className="font-bold text-[#18181b]">{selectedMobileLead.assignedTo}</span> (from {selectedMobileLead.createdBy})
                </p>
              </div>
            )}
            
            {canEditLeadStatus(selectedMobileLead) ? (
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-black text-[#a1a1aa] mb-3">Pipeline stage</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {COLUMNS.map(col => {
                    const isSelected = selectedMobileLead.status === col;
                    return (
                      <button
                        key={col}
                        onClick={() => {
                          if (selectedMobileLead.status === 'IN PROGRESS' && col === 'LOST' && (selectedMobileLead.followUpCount || 0) < 5) {
                            alert(`You must log 5 follow-ups before marking this lead as LOST. Currently at ${selectedMobileLead.followUpCount || 0}/5.`);
                            return;
                          }
                          if (col === 'JOINED') {
                            setPendingJoin(selectedMobileLead);
                          } else {
                            handleStatusChange(selectedMobileLead, col);
                            setSelectedMobileLead(null);
                          }
                        }}
                        disabled={isSelected}
                        className={`py-3 min-h-[44px] rounded-xl text-xs font-bold interactive-element flex items-center justify-center gap-1.5 transition-all ${
                          isSelected 
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 shadow-sm' 
                            : 'bg-[#f4f4f5] text-[#71717a] hover:bg-[#e4e4e7]'
                        }`}
                      >
                        <span className="text-sm">{STATUS_EMOJIS[col]}</span> {col === 'IN PROGRESS' ? 'In progress' : col.charAt(0) + col.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
                {selectedMobileLead.status === 'IN PROGRESS' && (
                  <div className="mt-5">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-[#a1a1aa] mb-3">Follow-ups Logged</h4>
                    <FollowUpTracker 
                      followUpCount={selectedMobileLead.followUpCount} 
                      onIncrement={() => {
                        incrementLeadFollowUp(selectedMobileLead.id);
                        setSelectedMobileLead({ ...selectedMobileLead, followUpCount: (selectedMobileLead.followUpCount || 0) + 1 });
                      }} 
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-black text-[#a1a1aa] mb-3">Pipeline stage</h4>
                <LeadStatusControl status={selectedMobileLead.status} onChange={() => {}} editable={false} followUpCount={selectedMobileLead.followUpCount} />
                {selectedMobileLead.status === 'IN PROGRESS' && (
                  <div className="mt-5">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-[#a1a1aa] mb-3">Follow-ups Logged</h4>
                    <FollowUpTracker 
                      followUpCount={selectedMobileLead.followUpCount} 
                      onIncrement={() => {
                        incrementLeadFollowUp(selectedMobileLead.id);
                        setSelectedMobileLead({ ...selectedMobileLead, followUpCount: (selectedMobileLead.followUpCount || 0) + 1 });
                      }} 
                    />
                  </div>
                )}
              </div>
            )}

            {/* Inset Grouped Action Menu */}
            <div className="bg-white border border-[#e4e4e7] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] divide-y divide-[#e4e4e7]">
              {canEditLead(selectedMobileLead) && (
                <button
                  onClick={() => { setEditingLead(selectedMobileLead); setSelectedMobileLead(null); }}
                  className="w-full py-4 px-4 text-[#18181b] bg-transparent font-bold flex items-center gap-3 active:bg-[#fafafa] transition-colors text-sm text-left"
                >
                  <Pencil size={18} className="text-[#71717a]" />
                  <span className="flex-1">Edit details</span>
                  <ChevronRight size={16} className="text-[#d4d4d8]" />
                </button>
              )}
              {canTransferLead(selectedMobileLead) && (
                <button
                  onClick={() => { setTransferringLead(selectedMobileLead); setSelectedMobileLead(null); }}
                  className="w-full py-4 px-4 text-[#18181b] bg-transparent font-bold flex items-center gap-3 active:bg-[#fafafa] transition-colors text-sm text-left"
                >
                  <ArrowRightLeft size={18} className="text-amber-500" />
                  <span className="flex-1">Transfer Lead</span>
                  <ChevronRight size={16} className="text-[#d4d4d8]" />
                </button>
              )}
              {hasPermission('reassign_leads') && (
                <button
                  onClick={() => { setReassigningLead(selectedMobileLead); setSelectedMobileLead(null); }}
                  className="w-full py-4 px-4 text-[#18181b] bg-transparent font-bold flex items-center gap-3 active:bg-[#fafafa] transition-colors text-sm text-left"
                >
                  <UserCog size={18} className="text-indigo-500" />
                  <span className="flex-1">Reassign Lead</span>
                  <ChevronRight size={16} className="text-[#d4d4d8]" />
                </button>
              )}
              {hasPermission('delete_lead') && (
                <button
                  onClick={() => confirmDelete(selectedMobileLead.id)}
                  className="w-full py-4 px-4 text-red-600 bg-transparent font-bold flex items-center gap-3 active:bg-red-50 transition-colors text-sm text-left"
                >
                  <Trash2 size={18} className="text-red-500" />
                  <span className="flex-1">Delete Lead</span>
                </button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function SortButton({ field, label, currentSort, order, onClick }: any) {
  const isActive = currentSort === field;
  return (
    <button onClick={() => onClick(field)} className={`flex items-center gap-1.5 py-3 -my-3 text-[10px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-[#18181b]' : 'text-[#a1a1aa] hover:text-[#71717a]'}`}>
      {label} <ArrowUpDown size={12} className={isActive ? 'opacity-100' : 'opacity-30'} />
    </button>
  );
}

function LeadCardList({ id, isHighlighted, lead, isSelected, onToggleSelect, onDelete, onUpdateStatus, onToggleHot, canDelete, canEditStatus, canEdit, onWhatsApp, onScheduleDemo, showOwner, canTransfer, canReassign, onTransfer, onReassign, onEdit, onIncrementFollowUp }: any) {
  return (
    <div id={id} className={`bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center group cursor-pointer transition-colors premium-hover ${isSelected ? 'border-[#18181b] bg-[#fafafa]' : 'border-[#e4e4e7]'} ${isHighlighted ? 'ring-2 ring-[#18181b]/30 bg-amber-50/40' : ''}`}>
      <div className="hidden md:flex col-span-1 items-center">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-[#e4e4e7] accent-[#18181b] cursor-pointer shrink-0"
        />
      </div>
      <div className={`col-span-1 flex items-center gap-4 ${showOwner ? 'md:col-span-2' : 'md:col-span-3'}`}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-[#e4e4e7] accent-[#18181b] cursor-pointer shrink-0 md:hidden"
        />
        <button onClick={onToggleHot} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all interactive-element shrink-0 ${lead.isHot ? 'bg-amber-100 text-amber-500 shadow-inner' : 'bg-white border border-[#e4e4e7] text-[#a1a1aa] hover:border-[#18181b] shadow-sm'}`}>
          <Star size={14} fill={lead.isHot ? 'currentColor' : 'none'} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-[#18181b] text-sm truncate">{lead.name}</h3>
            {lead.isHot && <span className="bg-amber-100 text-amber-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ring-1 ring-amber-200 shrink-0">Hot</span>}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#71717a] truncate">
            <Phone size={10}/> {lead.phone}
          </div>
        </div>
      </div>
      <div className="col-span-1 md:col-span-2 hidden md:block min-w-0">
        <p className="text-xs font-bold text-[#18181b] truncate">{lead.class}</p>
        <p className="text-[10px] font-medium text-[#71717a] truncate">{lead.subject || 'No subject'}</p>
      </div>
      <div className="col-span-1 md:col-span-2 flex flex-col items-start justify-center">
        <LeadStatusControl
          status={lead.status}
          onChange={onUpdateStatus}
          editable={canEditStatus}
          followUpCount={lead.followUpCount}
        />
        {lead.status === 'IN PROGRESS' && (
          <FollowUpTracker 
            followUpCount={lead.followUpCount} 
            onIncrement={onIncrementFollowUp} 
          />
        )}
      </div>
      <div className={`col-span-1 md:col-span-2 hidden md:block min-w-0`}>
        <p className="text-xs font-bold text-[#18181b]">{lead.date}</p>
        <p className="text-[10px] font-medium text-[#71717a] truncate">{lead.source}</p>
      </div>
      {showOwner && (
        <div className="col-span-1 md:col-span-2 hidden md:flex items-center gap-2 min-w-0">
          {lead.assignedTo && lead.assignedTo !== lead.createdBy ? (
            <>
              <div className="w-6 h-6 rounded-full bg-[#f4f4f5] text-[#18181b] flex items-center justify-center text-[10px] font-black shrink-0 border border-[#e4e4e7]" title={`Assigned to ${lead.assignedTo} (created by ${lead.createdBy})`}>
                {lead.assignedTo.charAt(0)}
              </div>
              <p className="text-xs font-bold text-[#18181b] truncate">{lead.assignedTo} <span className="text-[10px] text-[#71717a] font-normal">(from {lead.createdBy})</span></p>
            </>
          ) : null}
        </div>
      )}
      <div className={`col-span-1 flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity mt-4 md:mt-0 ${showOwner ? 'md:col-span-1' : 'md:col-span-2'}`}>
        {canEdit && (
          <button onClick={onEdit} className="p-2 bg-[#f4f4f5] text-[#18181b] hover:bg-[#e4e4e7] rounded-lg transition-colors interactive-element" title="Edit Lead">
            <Pencil size={16} />
          </button>
        )}
        {canTransfer && (
          <button onClick={onTransfer} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors interactive-element" title="Transfer Lead">
            <ArrowRightLeft size={16} />
          </button>
        )}
        {canReassign && (
          <button onClick={onReassign} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors interactive-element" title="Reassign Lead">
            <UserCog size={16} />
          </button>
        )}
        <button onClick={onScheduleDemo} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors interactive-element" title="Schedule Demo">
          <Video size={16} />
        </button>
        <button onClick={onWhatsApp} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors interactive-element" title="WhatsApp">
          <MessageCircle size={16} />
        </button>
        {canDelete && (
          <button onClick={onDelete} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors interactive-element">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
