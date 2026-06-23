import { useState } from 'react';
import type { FormEvent } from 'react';
import { MessageSquare, Bell, Database, Save, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff, Palette, Video, Image, Blend, Square, Check } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useStaff } from '../contexts/StaffContext';
import { DASHBOARD_GRADIENTS } from '../constants/dashboardGradients';
import { DASHBOARD_IMAGES, getDashboardImageThumb } from '../constants/dashboardImages';
import { DASHBOARD_VIDEOS } from '../constants/dashboardVideos';
import { useAppearancePrefs } from '../hooks/useAppearancePrefs';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '../components/ConfirmationModal';

const NOTIFICATION_PREFS_KEY = 'edumanage_notification_prefs';

function loadNotificationPrefs() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { dailySummary?: boolean; demoAlerts?: boolean };
      return {
        dailySummary: parsed.dailySummary ?? true,
        demoAlerts: parsed.demoAlerts ?? true,
      };
    }
  } catch { /* ignore corrupt data */ }
  return { dailySummary: true, demoAlerts: true };
}

export default function Settings() {
  const { whatsappTemplates, updateWhatsAppTemplate, resetData } = useData();
  const { currentUser, hasPermission } = useAuth();
  const { updateStaffPin } = useStaff();
  const {
    dashboardBackground,
    dashboardVideoId,
    dashboardGradientId,
    dashboardImageId,
    setDashboardBackground,
    setDashboardVideo,
    setDashboardGradient,
    setDashboardImage,
  } = useAppearancePrefs();
  
  const [templates, setTemplates] = useState(whatsappTemplates);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState(loadNotificationPrefs);

  // PIN state
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Protected Route will handle actual blocking, this is a fallback
  if (!currentUser) return null;

  const handleSaveTemplates = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateWhatsAppTemplate('lead', templates.lead);
      updateWhatsAppTemplate('demo', templates.demo);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const handleUpdatePin = (e: FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      updateStaffPin(currentUser.name, newPin);
      setNewPin('');
      setPinSuccess(true);
      setTimeout(() => setPinSuccess(false), 3000);
    }
  };

  const handleResetData = () => {
    resetData();
    setShowResetConfirm(false);
  };

  const updateNotificationPref = (key: 'dailySummary' | 'demoAlerts', value: boolean) => {
    setNotificationPrefs(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl pb-24 lg:pb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#18181b] mb-1">Settings</h2>
        <p className="text-sm font-semibold text-[#71717a]">Manage your personal profile and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Main Content */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Security / PIN Section — available to all staff */}
          {hasPermission('change_own_pin') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#e4e4e7] rounded-[32px] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-[#18181b]">Account Security</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mt-0.5">Login Credentials</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdatePin} className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#18181b] ml-1">Change PIN</label>
                <div className="relative">
                  <input 
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="Enter new 4-digit PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#f4f4f5] border border-transparent rounded-2xl p-4 pr-12 text-sm font-black tracking-[0.2em] outline-none focus:bg-white focus:border-[#18181b] transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-[#18181b]"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button 
                  type="submit"
                  disabled={newPin.length < 4}
                  className="w-full sm:w-auto px-6 py-3.5 min-h-[48px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Update PIN
                </button>
                <AnimatePresence>
                  {pinSuccess && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm font-bold text-green-600 flex items-center gap-2">
                      <CheckCircle2 size={16} /> PIN Updated
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
          )}

          {/* WhatsApp Templates (Managers & Admins only) */}
          {hasPermission('settings_whatsapp') && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-[#e4e4e7] rounded-[32px] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-[#18181b]">WhatsApp Templates</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mt-0.5">Automated Messaging</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#18181b] ml-1">New Lead Follow-up</label>
                  <textarea 
                    value={templates.lead}
                    onChange={(e) => setTemplates({...templates, lead: e.target.value})}
                    className="w-full h-28 bg-[#f4f4f5] border border-transparent rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#18181b] resize-none transition-all leading-relaxed"
                  />
                  <p className="text-xs text-[#a1a1aa] font-medium px-2">Variables: {'{{name}}'}, {'{{class}}'}, {'{{subject}}'}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#18181b] ml-1">Demo Confirmation</label>
                  <textarea 
                    value={templates.demo}
                    onChange={(e) => setTemplates({...templates, demo: e.target.value})}
                    className="w-full h-28 bg-[#f4f4f5] border border-transparent rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-[#18181b] resize-none transition-all leading-relaxed"
                  />
                  <p className="text-xs text-[#a1a1aa] font-medium px-2">Variables: {'{{studentName}}'}, {'{{date}}'}, {'{{time}}'}, {'{{subject}}'}</p>
                </div>

                <button 
                  onClick={handleSaveTemplates}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 h-12 bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {isSaving ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                  ) : (
                    <>
                      <Save size={16} /> Save Templates
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {showSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100 overflow-hidden"
                    >
                      <CheckCircle2 size={16} />
                      <span className="text-sm font-bold">Templates updated successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-6">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-[#e4e4e7] rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
                <Palette size={18} />
              </div>
              <div>
                <h3 className="font-black text-[#18181b]">Appearance</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] mt-0.5">Dashboard background</p>
              </div>
            </div>
            <div className="bg-[#f4f4f5] rounded-2xl border border-[#e4e4e7] overflow-hidden divide-y divide-[#e4e4e7]">
              <button
                type="button"
                onClick={() => setDashboardBackground('video')}
                className="w-full min-h-[56px] flex items-center justify-between p-4 bg-transparent transition-colors text-left hover:bg-[#e4e4e7] active:bg-[#d4d4d8]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Video size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#18181b]">Video</p>
                    <p className="text-[11px] font-semibold text-[#71717a] mt-0.5">Animated gradient background</p>
                  </div>
                </div>
                {dashboardBackground === 'video' && <Check size={20} className="text-violet-600 shrink-0" strokeWidth={3} />}
              </button>
              <button
                type="button"
                onClick={() => setDashboardBackground('gradient')}
                className="w-full min-h-[56px] flex items-center justify-between p-4 bg-transparent transition-colors text-left hover:bg-[#e4e4e7] active:bg-[#d4d4d8]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Blend size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#18181b]">Gradient</p>
                    <p className="text-[11px] font-semibold text-[#71717a] mt-0.5">Curated CSS gradients</p>
                  </div>
                </div>
                {dashboardBackground === 'gradient' && <Check size={20} className="text-violet-600 shrink-0" strokeWidth={3} />}
              </button>
              <button
                type="button"
                onClick={() => setDashboardBackground('image')}
                className="w-full min-h-[56px] flex items-center justify-between p-4 bg-transparent transition-colors text-left hover:bg-[#e4e4e7] active:bg-[#d4d4d8]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Image size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#18181b]">Image</p>
                    <p className="text-[11px] font-semibold text-[#71717a] mt-0.5">Curated photos</p>
                  </div>
                </div>
                {dashboardBackground === 'image' && <Check size={20} className="text-violet-600 shrink-0" strokeWidth={3} />}
              </button>
              <button
                type="button"
                onClick={() => setDashboardBackground('static')}
                className="w-full min-h-[56px] flex items-center justify-between p-4 bg-transparent transition-colors text-left hover:bg-[#e4e4e7] active:bg-[#d4d4d8]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Square size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#18181b]">Classic</p>
                    <p className="text-[11px] font-semibold text-[#71717a] mt-0.5">Solid light gray background</p>
                  </div>
                </div>
                {dashboardBackground === 'static' && <Check size={20} className="text-violet-600 shrink-0" strokeWidth={3} />}
              </button>
            </div>
            {dashboardBackground === 'image' && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Image style</p>
                <div className="grid grid-cols-3 gap-2">
                  {DASHBOARD_IMAGES.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setDashboardImage(image.id)}
                      aria-label={image.label}
                      title={image.label}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        dashboardImageId === image.id
                          ? 'border-violet-600 ring-2 ring-violet-200'
                          : 'border-[#e4e4e7] hover:border-violet-300'
                      }`}
                    >
                      <img
                        src={getDashboardImageThumb(image.id)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {dashboardBackground === 'gradient' && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Gradient style</p>
                <div className="grid grid-cols-3 gap-2">
                  {DASHBOARD_GRADIENTS.map((gradient) => (
                    <button
                      key={gradient.id}
                      type="button"
                      onClick={() => setDashboardGradient(gradient.id)}
                      aria-label={gradient.label}
                      title={gradient.label}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        dashboardGradientId === gradient.id
                          ? 'border-violet-600 ring-2 ring-violet-200'
                          : 'border-[#e4e4e7] hover:border-violet-300'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${gradient.colors
                          .map((color, index) => `${color} ${(index / (gradient.colors.length - 1)) * 100}%`)
                          .join(', ')})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {dashboardBackground === 'video' && (
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]">Video style</p>
                <div className="grid grid-cols-3 gap-2">
                  {DASHBOARD_VIDEOS.map((video) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setDashboardVideo(video.id)}
                      aria-label={video.label}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        dashboardVideoId === video.id
                          ? 'border-violet-600 ring-2 ring-violet-200'
                          : 'border-[#e4e4e7] hover:border-violet-300'
                      }`}
                    >
                      <video
                        src={video.src}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-[#e4e4e7] rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#f4f4f5] text-[#18181b] rounded-xl flex items-center justify-center">
                <Bell size={18} />
              </div>
              <h3 className="font-black text-[#18181b]">Notifications</h3>
            </div>
            <div className="bg-[#f4f4f5] rounded-2xl border border-[#e4e4e7] overflow-hidden divide-y divide-[#e4e4e7]">
              <label className="flex items-center justify-between p-4 min-h-[56px] bg-transparent cursor-pointer group hover:bg-[#e4e4e7] transition-colors">
                <span className="text-sm font-bold text-[#18181b] group-hover:text-indigo-600 transition-colors">Daily Summary</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs.dailySummary}
                  onChange={(e) => updateNotificationPref('dailySummary', e.target.checked)}
                  className="w-5 h-5 rounded-md border-[#a1a1aa] text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 transition-colors cursor-pointer shadow-sm"
                />
              </label>
              <label className="flex items-center justify-between p-4 min-h-[56px] bg-transparent cursor-pointer group hover:bg-[#e4e4e7] transition-colors">
                <span className="text-sm font-bold text-[#18181b] group-hover:text-indigo-600 transition-colors">Demo Alerts</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs.demoAlerts}
                  onChange={(e) => updateNotificationPref('demoAlerts', e.target.checked)}
                  className="w-5 h-5 rounded-md border-[#a1a1aa] text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 transition-colors cursor-pointer shadow-sm"
                />
              </label>
            </div>
          </motion.div>

          {hasPermission('settings_all') && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-red-50 border border-red-100 rounded-[32px] p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="font-black text-red-900">Danger Zone</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mt-0.5">Admin Only</p>
                </div>
              </div>
              <p className="text-xs text-red-800 leading-relaxed mb-6 font-medium">
                This will permanently delete all leads, demos, and reset all mock data to factory defaults.
              </p>
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3.5 min-h-[48px] bg-white border-2 border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 interactive-element"
              >
                <AlertCircle size={16} /> Factory Reset
              </button>
            </motion.div>
          )}

        </div>
      </div>

      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetData}
        title="Factory Reset"
        message="This will permanently delete all leads, demos, and reset all data. This action cannot be undone."
        confirmLabel="Reset All Data"
      />
    </div>
  );
}
