import { useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck, UserPlus, Users, ChevronDown, CheckCircle2, KeyRound, Eye, EyeOff, ChevronRight, Tag, ScrollText, BarChart3, LineChart, BookOpen, UserMinus } from 'lucide-react';
import { useStaff } from '../contexts/StaffContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import BottomSheet from '../components/BottomSheet';
import AdminOffboardModal from '../components/AdminOffboardModal';
import { useIsMobile } from '../hooks/useIsMobile';
import AdminSourcesSection from './admin/AdminSourcesSection';
import AdminAccessLogsSection from './admin/AdminAccessLogsSection';
import AdminStaffPerformanceSection from './admin/AdminStaffPerformanceSection';
import AdminAnalyticsSection from './admin/AdminAnalyticsSection';
import AdminAcademicSection from './admin/AdminAcademicSection';

type AdminTab = 'team' | 'analytics' | 'academic' | 'sources' | 'logs' | 'performance';

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: 'team', label: 'Team', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'academic', label: 'Academic', icon: BookOpen },
  { id: 'sources', label: 'Sources', icon: Tag },
  { id: 'logs', label: 'Access Logs', icon: ScrollText },
  { id: 'performance', label: 'Staff KPIs', icon: BarChart3 },
];

export default function Admin() {
  const { staffList, addStaff, deleteStaff, updateStaffRole, updateStaffPin } = useStaff();
  const { currentUser, requireRole } = useAuth();
  const { accessLogs, offboardStaff } = useData();
  
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('counselor');
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [pinModalStaff, setPinModalStaff] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [showPinValue, setShowPinValue] = useState(false);
  const [offboardTarget, setOffboardTarget] = useState<string | null>(null);
  const [offboardSuccess, setOffboardSuccess] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const [selectedMobileStaff, setSelectedMobileStaff] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('team');

  if (!requireRole('admin')) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl">
        <h2 className="font-bold text-xl">Access Denied</h2>
        <p>Admin privileges required.</p>
      </div>
    );
  }

  const handleAddStaff = (e: FormEvent) => {
    e.preventDefault();
    if (newStaffName.trim()) {
      addStaff(newStaffName.trim(), newStaffRole);
      setNewStaffName('');
      setNewStaffRole('counselor');
    }
  };

  const handleSetPin = (e: FormEvent) => {
    e.preventDefault();
    if (!pinModalStaff || newPinValue.length !== 4) return;
    updateStaffPin(pinModalStaff, newPinValue);
    setPinModalStaff(null);
    setNewPinValue('');
    setShowPinValue(false);
  };

  const openPinModal = (name: string) => {
    setPinModalStaff(name);
    setNewPinValue('');
    setShowPinValue(false);
    setShowRoleMenu(null);
    setSelectedMobileStaff(null);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'counselor': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-10">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#18181b] mb-1">Admin Command</h2>
        <p className="text-sm font-semibold text-[#71717a]">Team, analytics, academic catalog, sources, logs, and staff KPIs.</p>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-fade-x pb-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full text-xs font-bold uppercase tracking-widest transition-all interactive-element ${
                isActive ? 'bg-[#18181b] text-white shadow-md' : 'bg-white text-[#71717a] border border-[#e4e4e7] hover:border-[#18181b]'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {offboardSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-800 font-semibold"
        >
          {offboardSuccess}
        </motion.div>
      )}

      {activeTab === 'analytics' && <AdminAnalyticsSection />}
      {activeTab === 'academic' && <AdminAcademicSection />}
      {activeTab === 'sources' && <AdminSourcesSection />}
      {activeTab === 'logs' && <AdminAccessLogsSection />}
      {activeTab === 'performance' && <AdminStaffPerformanceSection />}

      {activeTab === 'team' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-panel overflow-hidden"
          >
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-[#f4f4f5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#f4f4f5] text-[#18181b] rounded-lg flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="section-title text-base">Team members</h3>
                  <p className="text-xs text-[#71717a] mt-0.5">{staffList.length} active accounts</p>
                </div>
              </div>
            </div>

            <div className="bg-[#f4f4f5] rounded-3xl p-1 mx-4 mb-4 sm:mx-6 sm:mb-6 mt-2">
              <div className="bg-white rounded-2xl divide-y divide-[#e4e4e7] overflow-hidden">
                <AnimatePresence>
                {staffList.map((staff, idx) => (
                  <motion.div 
                    key={staff.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => isMobile ? setSelectedMobileStaff(staff.name) : undefined}
                    className={`p-4 sm:p-6 flex items-center justify-between group transition-colors ${
                      isMobile ? 'active:bg-[#f4f4f5] cursor-pointer min-h-[72px]' : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <img src={staff.avatar} alt={staff.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#e4e4e7] shadow-sm shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                          <p className="font-bold text-[#18181b] text-sm sm:text-base">{staff.name}</p>
                          {staff.name === currentUser?.name && (
                            <span className="bg-[#18181b] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${getRoleColor(staff.role)}`}>
                          {staff.role}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {staff.name !== currentUser?.name && (
                        <>
                          <button
                            onClick={() => openPinModal(staff.name)}
                            className="px-3 py-2 bg-white border border-[#e4e4e7] rounded-xl text-xs font-bold text-[#18181b] hover:border-[#18181b] transition-colors flex items-center gap-1.5 shadow-sm interactive-element"
                          >
                            <KeyRound size={14} /> Set PIN
                          </button>
                          <div className="relative">
                            <button 
                              onClick={() => setShowRoleMenu(showRoleMenu === staff.name ? null : staff.name)}
                              className="px-3 py-2 bg-white border border-[#e4e4e7] rounded-xl text-xs font-bold text-[#18181b] hover:border-[#18181b] transition-colors flex items-center gap-1.5 shadow-sm interactive-element"
                            >
                              Change Role <ChevronDown size={14} />
                            </button>
                            {showRoleMenu === staff.name && (
                              <div className="absolute right-0 top-full mt-2 w-40 bg-[#18181b] rounded-2xl shadow-2xl overflow-hidden z-20 border border-white/10">
                                {(['admin', 'manager', 'counselor'] as UserRole[]).map(role => (
                                  <button
                                    key={role}
                                    onClick={() => {
                                      updateStaffRole(staff.name, role);
                                      setShowRoleMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white uppercase tracking-wider flex items-center justify-between"
                                  >
                                    {role}
                                    {staff.role === role && <CheckCircle2 size={14} className="text-green-400" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => setOffboardTarget(staff.name)}
                            className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm interactive-element"
                          >
                            <UserMinus size={14} /> Offboard
                          </button>
                        </>
                      )}
                      {staff.name === currentUser?.name && (
                        <button
                          onClick={() => openPinModal(staff.name)}
                          className="px-3 py-2 bg-white border border-[#e4e4e7] rounded-xl text-xs font-bold text-[#18181b] hover:border-[#18181b] transition-colors flex items-center gap-1.5 shadow-sm interactive-element"
                        >
                          <KeyRound size={14} /> Set PIN
                        </button>
                      )}
                    </div>
                    {isMobile && (
                      <ChevronRight size={18} className="text-[#a1a1aa] shrink-0" />
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="surface-panel p-6"
          >
            <h3 className="font-black text-[#18181b] mb-6 flex items-center gap-2">
              <UserPlus size={18} className="text-indigo-600" /> Invite Member
            </h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] transition-all shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] ml-1">Account Role</label>
                <div className="relative">
                  <select 
                    value={newStaffRole}
                    onChange={e => setNewStaffRole(e.target.value as UserRole)}
                    className="w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3.5 text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b] transition-all appearance-none pr-10 shadow-inner"
                  >
                    <option value="counselor">Counselor (Sales)</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] pointer-events-none" />
                </div>
              </div>
              <button 
                type="submit"
                disabled={!newStaffName.trim()}
                className="w-full h-12 bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 interactive-element"
              >
                Create Account
              </button>
            </form>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#18181b] border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none" />
            <h3 className="font-black text-white mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-indigo-400" /> Security Audit
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              RBAC is active. All login and app-open events are logged with IP addresses for audit purposes.
            </p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white">System Status</span>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Secure
              </span>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-xs font-bold text-white">Total Logged Events</span>
              <p className="text-2xl font-black text-white mt-1">{accessLogs.length}</p>
            </div>
          </motion.div>

        </div>
      </div>
      )}

      {/* Set PIN — bottom sheet on mobile */}
      <BottomSheet
        isOpen={!!pinModalStaff}
        onClose={() => { setPinModalStaff(null); setNewPinValue(''); }}
        title="Set PIN"
        subtitle={pinModalStaff ? `For ${pinModalStaff}` : undefined}
        footer={
          pinModalStaff ? (
            <div className="flex gap-3">
              <button type="button" onClick={() => setPinModalStaff(null)} className="flex-1 py-3.5 min-h-[48px] bg-[#f4f4f5] rounded-xl text-xs font-bold uppercase">Cancel</button>
              <button type="submit" form="admin-pin-form" disabled={newPinValue.length !== 4} className="flex-1 py-3.5 min-h-[48px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50">Save PIN</button>
            </div>
          ) : undefined
        }
      >
        {pinModalStaff && (
          <form id="admin-pin-form" onSubmit={handleSetPin} className="p-4">
            <div className="relative">
              <input
                type={showPinValue ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                value={newPinValue}
                onChange={e => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="w-full bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-4 pr-12 text-sm font-black tracking-[0.2em] outline-none focus:bg-white focus:border-[#18181b] min-h-[52px]"
              />
              <button type="button" onClick={() => setShowPinValue(!showPinValue)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#a1a1aa]">
                {showPinValue ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Mobile staff actions */}
      <BottomSheet
        isOpen={!!selectedMobileStaff}
        onClose={() => setSelectedMobileStaff(null)}
        title={selectedMobileStaff || ''}
        subtitle={staffList.find(s => s.name === selectedMobileStaff)?.role}
      >
        {selectedMobileStaff && (
          <div className="p-4 space-y-2">
            <button
              onClick={() => openPinModal(selectedMobileStaff)}
              className="w-full py-4 min-h-[52px] bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 interactive-element"
            >
              <KeyRound size={18} /> Set PIN
            </button>
            {selectedMobileStaff !== currentUser?.name && (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] pt-2 px-1">Change Role</p>
                {(['admin', 'manager', 'counselor'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => { updateStaffRole(selectedMobileStaff, role); setSelectedMobileStaff(null); }}
                    className={`w-full py-3.5 min-h-[48px] rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-between px-4 interactive-element ${
                      staffList.find(s => s.name === selectedMobileStaff)?.role === role
                        ? 'bg-[#18181b] text-white'
                        : 'bg-[#f4f4f5] text-[#18181b] active:bg-[#e4e4e7]'
                    }`}
                  >
                    {role} {staffList.find(s => s.name === selectedMobileStaff)?.role === role && '✓'}
                  </button>
                ))}
                <button
                  onClick={() => { setOffboardTarget(selectedMobileStaff); setSelectedMobileStaff(null); }}
                  className="w-full py-4 min-h-[52px] mt-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl font-bold flex items-center justify-center gap-2 interactive-element"
                >
                  <UserMinus size={18} /> Offboard member
                </button>
              </>
            )}
          </div>
        )}
      </BottomSheet>

      <AdminOffboardModal
        isOpen={!!offboardTarget}
        departingStaff={offboardTarget}
        staffOptions={staffList.map((s) => s.name)}
        onClose={() => setOffboardTarget(null)}
        onOffboard={offboardStaff}
        onRemoveAccount={deleteStaff}
        onComplete={({ leadsReassigned, leadsKept, demosLinked, transfersCancelled, accountRemoved }) => {
          const parts = [
            `${leadsReassigned} active lead${leadsReassigned === 1 ? '' : 's'} reassigned`,
            leadsKept > 0 ? `${leadsKept} joined/lost lead${leadsKept === 1 ? '' : 's'} kept for tracking` : null,
            demosLinked > 0 ? `${demosLinked} linked demo${demosLinked === 1 ? '' : 's'} stay attached` : null,
            transfersCancelled > 0 ? `${transfersCancelled} pending transfer${transfersCancelled === 1 ? '' : 's'} cancelled` : null,
            accountRemoved ? 'login removed' : 'login kept active',
          ].filter(Boolean);
          setOffboardSuccess(`Offboarding complete — ${parts.join(', ')}.`);
          window.setTimeout(() => setOffboardSuccess(null), 8000);
        }}
      />
    </div>
  );
}
