import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Database, RefreshCw, BookOpen, Fingerprint } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export default function AdminTeachersSection() {
  const { teachers, lastTeacherSync, fetchAndSyncTeachers } = useData();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await fetchAndSyncTeachers();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6">
      {/* Database Sync Status Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-panel overflow-hidden"
      >
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-[#f4f4f5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Database size={18} />
            </div>
            <div>
              <h3 className="section-title text-base">Teacher Database Sync</h3>
              <p className="text-xs text-[#71717a] mt-0.5">Manage synchronization with the external MySQL database</p>
            </div>
          </div>
          <button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="px-4 py-2 bg-[#18181b] hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 interactive-element"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
        
        <div className="bg-white p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mb-1">Last Successfully Synced</p>
            {lastTeacherSync ? (
              <p className="text-base font-bold text-[#18181b]">
                {new Date(lastTeacherSync).toLocaleString(undefined, { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </p>
            ) : (
              <p className="text-sm font-bold text-amber-600">Never synced (No data)</p>
            )}
          </div>
          
          <div className="bg-[#f4f4f5] px-4 py-3 rounded-xl border border-[#e4e4e7] shrink-0 text-xs font-semibold text-[#71717a]">
            {teachers.length} teachers currently loaded in system
          </div>
        </div>
      </motion.div>

      {/* Teachers List Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="surface-panel overflow-hidden"
      >
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-[#f4f4f5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="section-title text-base">Active Teachers</h3>
              <p className="text-xs text-[#71717a] mt-0.5">List of teachers fetched from the database</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-1 mx-4 mb-4 sm:mx-6 sm:mb-6 mt-2">
          {teachers.length === 0 ? (
            <div className="text-center py-12 text-[#a1a1aa] font-semibold text-sm">
              No teachers available. Click "Sync Now" to fetch from database.
            </div>
          ) : (
            <div className="divide-y divide-[#e4e4e7]">
              {teachers.map((teacher) => (
                <div key={teacher.teacher_code || teacher.id} className="p-4 sm:p-6 hover:bg-[#fafafa] transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#18181b]">{teacher.teacher_name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#71717a] font-medium">
                        <Fingerprint size={12} /> Code: {teacher.teacher_code}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 sm:text-right">
                    {teacher.subject && (
                      <div className="bg-[#f4f4f5] px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-[#71717a]">
                        <BookOpen size={12} /> {teacher.subject}
                      </div>
                    )}
                    {teacher.type && (
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold">
                        {teacher.type}
                      </div>
                    )}
                    {teacher.medium && (
                      <div className="bg-[#f4f4f5] px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-[#71717a]">
                        {teacher.medium}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
