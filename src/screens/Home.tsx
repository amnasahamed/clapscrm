import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, Video, UserPlus, CreditCard, Bell, Trash2, CheckCircle, CheckSquare, Square, X, Check, Ban, BellRing, AlarmClock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useStaff } from '../contexts/StaffContext';
import SwipeableItem from '../components/SwipeableItem';
import { filterViewableLeads } from '../utils/leadAccess';
import { sumJoinCollection, DEMO_COLLECTION_VALUE } from '../utils/collection';
import { useReminderNotifications } from '../hooks/useReminderNotifications';

export default function Home() {
  const { currentUser, hasPermission } = useAuth();
  const { leads, demos, reminders, toggleReminder, deleteReminder, leadTransfers, acceptLeadTransfer, rejectLeadTransfer } = useData();
  const { staffList } = useStaff();
  const { permission, requestPermission, dueNow, dueSoon } = useReminderNotifications(reminders);

  if (!currentUser) return null;

  const incomingTransfers = leadTransfers.filter(
    t => t.toStaff === currentUser.name && t.status === 'pending'
  );

  const isOrgView = hasPermission('view_all_leads');

  const relevantLeads = isOrgView
    ? leads
    : filterViewableLeads(leads, currentUser.name, false);
  const relevantJoins = relevantLeads.filter(l => l.status === 'JOINED');
  const relevantDemos = isOrgView
    ? demos
    : demos.filter(d => relevantLeads.some(l => l.id === d.leadId));

  const collection = sumJoinCollection(relevantJoins) + demos.filter(d => d.status === 'COMPLETED' && (isOrgView || relevantLeads.some(l => l.id === d.leadId))).length * DEMO_COLLECTION_VALUE;
  const conversion = relevantLeads.length ? ((relevantJoins.length / relevantLeads.length) * 100).toFixed(1) : '0.0';

  const leaderboard = staffList.map(staff => {
    const sLeads = leads.filter(l => l.createdBy === staff.name);
    const sJoins = sLeads.filter(l => l.status === 'JOINED');
    const sDemos = demos.filter(d => d.status === 'COMPLETED' && sLeads.some(l => l.id === d.leadId));
    const sCollection = sumJoinCollection(sJoins) + sDemos.length * DEMO_COLLECTION_VALUE;
    return { ...staff, totalLeads: sLeads.length, collection: sCollection, joins: sJoins.length, demos: sDemos.length };
  }).sort((a, b) => b.collection - a.collection);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const stats = [
    { label: isOrgView ? 'Enquiries' : 'My enquiries', value: relevantLeads.length },
    { label: 'Demos done', value: relevantDemos.length },
    { label: 'Joinings', value: relevantJoins.length },
    { label: 'Conversion', value: `${conversion}%` },
    { label: 'Collection', value: `₹${(collection / 1000).toFixed(1)}k`, highlight: true },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5 flex flex-col lg:flex-1 lg:overflow-hidden"
    >
      {incomingTransfers.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2 shrink-0">
          {incomingTransfers.map(transfer => (
            <div key={transfer.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {transfer.fromStaff} wants to transfer {transfer.leadName} to you
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Accept to take ownership while they are on leave</p>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => acceptLeadTransfer(transfer.id)}
                  className="flex-1 sm:flex-none px-4 py-3 min-h-[44px] bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 interactive-element shadow-sm"
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={() => rejectLeadTransfer(transfer.id)}
                  className="flex-1 sm:flex-none px-4 py-3 min-h-[44px] bg-white border border-amber-300 text-amber-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 interactive-element shadow-sm"
                >
                  <Ban size={14} /> Decline
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Enable notifications prompt */}
      {permission === 'default' && (
        <motion.div variants={itemVariants} className="shrink-0">
          <div className="flex items-center justify-between gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="flex items-start gap-3">
              <BellRing size={18} className="text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">Turn on reminders</p>
                <p className="text-xs text-indigo-700 mt-0.5">Get a desktop notification when a follow-up is due.</p>
              </div>
            </div>
            <button
              onClick={requestPermission}
              className="px-4 py-2.5 min-h-[44px] bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 interactive-element shrink-0"
            >
              Enable
            </button>
          </div>
        </motion.div>
      )}

      {/* Due / overdue reminders */}
      {dueNow.length > 0 && (
        <motion.div variants={itemVariants} className="shrink-0 space-y-2">
          <div className="flex items-center gap-2 mb-1 px-1">
            <AlarmClock size={16} className="text-red-600" />
            <p className="text-sm font-bold text-red-900">
              {dueNow.length} follow-up{dueNow.length === 1 ? '' : 's'} due now
            </p>
          </div>
          <div className="space-y-2">
            {dueNow.slice(0, 4).map(r => (
              <button
                key={r.id}
                onClick={() => toggleReminder(r.id)}
                className="w-full flex items-center justify-between gap-3 text-left p-4 min-h-[48px] bg-red-50 border border-red-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] interactive-element active:scale-[0.98] transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-red-900 tracking-tight truncate">{r.leadName}</p>
                  <p className="text-[11px] font-semibold text-red-700/80 truncate mt-0.5">{r.text}</p>
                </div>
                <span className="text-[11px] font-bold text-red-600 shrink-0 tabular-nums bg-white px-2 py-1 rounded-lg border border-red-100">{r.time}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 shrink-0">
        <div>
          <p className="text-label">{todayStr}</p>
          <h2 className="text-xl font-semibold text-[#18181b] mt-0.5">
            Hi, {currentUser.name.split(' ')[0]}
          </h2>
          <p className="text-sm text-[#71717a] mt-0.5">
            {isOrgView ? 'Organization overview' : 'Your pipeline today'}
          </p>
        </div>
        {currentUser.avatar ? (
          <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full border border-[#e4e4e7] object-cover hidden sm:block" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#18181b] text-white flex items-center justify-center text-sm font-medium uppercase hidden sm:flex">
            {currentUser.name.charAt(0)}
          </div>
        )}
      </motion.div>

      {/* Inline stat bar — no icon chips, no uppercase micro-labels */}
      <motion.div variants={itemVariants} className="surface-panel p-0 overflow-hidden shrink-0">
        <div className="flex overflow-x-auto no-scrollbar scroll-fade-x divide-x divide-[#e4e4e7]">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`flex-1 min-w-[120px] px-4 py-3.5 sm:px-5 sm:py-4 ${stat.highlight ? 'bg-[#18181b] text-white' : ''}`}
            >
              <p className={`text-lg sm:text-xl font-semibold tabular-nums leading-none ${stat.highlight ? 'text-white' : 'text-[#18181b]'}`}>
                {stat.value}
              </p>
              <p className={`text-xs mt-1 ${stat.highlight ? 'text-zinc-400' : 'text-[#71717a]'}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 lg:min-h-0">
        <div className="surface-panel p-4 sm:p-5 flex flex-col overflow-hidden lg:min-h-0 lg:max-h-[calc(100vh-320px)]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-[#71717a]" />
              <h3 className="section-title">Tasks & follow-ups</h3>
            </div>
            <span className="text-xs font-medium text-[#71717a] bg-[#f4f4f5] px-2 py-0.5 rounded-md">
              {reminders.filter(r => !r.isCompleted).length} pending
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 pb-4">
            {reminders.length === 0 ? (
              <div className="text-center flex flex-col items-center justify-center h-full py-10 text-sm text-[#a1a1aa]">
                <CheckCircle size={22} className="mb-2 text-[#d4d4d8]" />
                No tasks scheduled
              </div>
            ) : (
              <AnimatePresence>
                {reminders.map(r => (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <SwipeableItem
                      leftAction={{
                        icon: r.isCompleted ? <Square size={20} /> : <CheckSquare size={20} />,
                        label: r.isCompleted ? 'Undo' : 'Complete',
                        colorClass: r.isCompleted ? 'bg-[#f4f4f5] text-[#18181b] rounded-2xl' : 'bg-green-600 text-white rounded-2xl',
                        onAction: () => toggleReminder(r.id)
                      }}
                      rightAction={{
                        icon: <Trash2 size={20} />,
                        label: 'Delete',
                        colorClass: 'bg-red-500 text-white rounded-2xl',
                        onAction: () => deleteReminder(r.id)
                      }}
                    >
                      <div className={`group flex items-start p-3 bg-white border border-[#e4e4e7] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all ${r.isCompleted ? 'opacity-50' : ''}`}>
                        <button onClick={() => toggleReminder(r.id)} className={`p-1 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1 shrink-0 transition-colors ${r.isCompleted ? 'text-green-600' : 'text-[#a1a1aa] hover:text-[#18181b]'}`}>
                          {r.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <div className="flex-1 min-w-0 pt-0.5 pl-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-bold tracking-tight truncate ${r.isCompleted ? 'line-through text-[#a1a1aa]' : 'text-[#18181b]'}`}>{r.leadName}</p>
                            <p className="text-[10px] font-bold text-[#a1a1aa] shrink-0 tabular-nums">{r.time}</p>
                          </div>
                          <p className="text-xs font-medium text-[#71717a] line-clamp-1 mt-0.5">{r.text}</p>
                        </div>
                        <button onClick={() => deleteReminder(r.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1 text-[#a1a1aa] hover:text-red-500 transition-colors opacity-60 sm:opacity-0 sm:group-hover:opacity-100">
                          <X size={16} />
                        </button>
                      </div>
                    </SwipeableItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {reminders.some(r => r.isCompleted) && (
            <button onClick={() => reminders.filter(r => r.isCompleted).forEach(r => deleteReminder(r.id))} className="mt-3 py-3 min-h-[44px] px-2 -ml-2 text-xs font-bold text-[#a1a1aa] hover:text-[#18181b] self-start transition-colors shrink-0">
              Clear completed
            </button>
          )}
        </div>

        <div className="surface-panel p-4 sm:p-5 flex flex-col overflow-hidden lg:min-h-0 lg:max-h-[calc(100vh-320px)]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[#71717a]" />
              <h3 className="section-title">Team performance</h3>
            </div>
            <span className="text-xs text-[#71717a]">This month</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-2 py-2 text-xs font-medium text-[#a1a1aa] mb-1 sticky top-0 bg-white z-10 border-b border-[#f4f4f5]">
              <div className="col-span-4">Counselor</div>
              <div className="col-span-2 text-center">Leads</div>
              <div className="col-span-2 text-center">Demos</div>
              <div className="col-span-2 text-center">Joins</div>
              <div className="col-span-2 text-right">Collection</div>
            </div>
            <div className="bg-[#f4f4f5] sm:bg-transparent rounded-2xl sm:rounded-none border border-[#e4e4e7] sm:border-0 overflow-hidden divide-y divide-[#e4e4e7] sm:divide-y-0 sm:space-y-0">
              {leaderboard.map((staff, i) => (
                <div key={staff.name} className={`flex sm:grid sm:grid-cols-12 items-center gap-3 sm:gap-2 py-3 px-3 sm:py-2.5 sm:px-2 bg-white sm:bg-transparent sm:border-b sm:border-[#f4f4f5] sm:last:border-0 transition-colors ${staff.name === currentUser.name ? 'bg-indigo-50/50 sm:bg-[#fafafa] sm:-mx-2 sm:px-4 sm:rounded-lg' : ''}`}>
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 text-center text-[10px] font-bold shrink-0 tabular-nums ${i < 3 ? 'text-[#18181b]' : 'text-[#a1a1aa]'}`}>{i + 1}</span>
                    <img src={staff.avatar} className="w-8 h-8 rounded-full border border-[#e4e4e7] object-cover shrink-0 shadow-sm" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold tracking-tight text-[#18181b] truncate">{staff.name}</p>
                      <p className="text-[11px] font-semibold text-[#71717a] mt-0.5 sm:hidden">{staff.joins} joins · {staff.demos} demos</p>
                    </div>
                  </div>

                  <div className="col-span-2 hidden sm:block text-center text-sm tabular-nums text-[#18181b]">{staff.totalLeads}</div>
                  <div className="col-span-2 hidden sm:block text-center text-sm tabular-nums text-[#18181b]">{staff.demos}</div>
                  <div className="col-span-2 hidden sm:block text-center text-sm tabular-nums text-green-700">{staff.joins}</div>
                  <div className="col-span-2 text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums text-[#18181b]">₹{(staff.collection / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
