import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useStaff } from '../contexts/StaffContext';
import { useData } from '../contexts/DataContext';
import { StaffMember } from '../types';
import { fetchClientIp } from '../utils/ip';
import { ChevronRight, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoginBackground from '../components/LoginBackground';

export default function LoginScreen() {
  const { login } = useAuth();
  const { staffList } = useStaff();
  const { addAccessLog } = useData();
  const navigate = useNavigate();

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleStaffSelect = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setPin('');
    setError(false);
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setIsAuthenticating(true);

    setTimeout(async () => {
      if (!selectedStaff.pin || pin !== selectedStaff.pin) {
        setError(true);
        setIsAuthenticating(false);
        return;
      }

      const ip = await fetchClientIp();
      addAccessLog({
        staffName: selectedStaff.name,
        role: selectedStaff.role,
        ipAddress: ip,
        action: 'login'
      });

      login(selectedStaff);
      navigate('/');
    }, 800);
  };

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4 safe-top safe-bottom">
      <LoginBackground />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm flex flex-col max-h-[92dvh]"
      >
        <div className="mb-6 shrink-0">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg flex items-center justify-center text-white text-sm font-semibold mb-4">
            C
          </div>
          <h1 className="text-2xl font-semibold text-white">ClapsCRM</h1>
          <p className="text-sm text-white/60 mt-1">Sign in with your profile</p>
        </div>

        <div className="overflow-hidden flex-1 min-h-0 flex flex-col rounded-2xl border border-white/10 bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/40">
          <AnimatePresence mode="wait">
            {!selectedStaff ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="divide-y divide-[#f4f4f5] overflow-y-auto overscroll-contain flex-1"
              >
                {staffList.map((staff, idx) => (
                  <motion.button
                    key={staff.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => handleStaffSelect(staff)}
                    className="w-full flex items-center justify-between p-4 min-h-[68px] hover:bg-[#fafafa] active:bg-[#f4f4f5] transition-colors group text-left interactive-element"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={staff.avatar}
                        alt={staff.name}
                        className="w-10 h-10 rounded-full border border-[#e4e4e7] object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#18181b] truncate">{staff.name}</p>
                        <p className="text-xs text-[#71717a] mt-0.5 capitalize">{staff.role}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[#d4d4d8] group-hover:text-[#71717a] transition-colors shrink-0" />
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.form
                key="pin"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="p-5 sm:p-6 flex flex-col relative flex-1"
              >
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="absolute top-4 left-4 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#71717a] hover:text-[#18181b] hover:bg-[#f4f4f5] rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowRight size={18} className="rotate-180" />
                </button>

                <div className="flex flex-col items-center pt-6 pb-5">
                  <motion.img
                    layoutId={`avatar-${selectedStaff.name}`}
                    src={selectedStaff.avatar}
                    alt={selectedStaff.name}
                    className="w-16 h-16 rounded-full border border-[#e4e4e7] mb-3"
                  />
                  <h3 className="text-base font-semibold text-[#18181b]">{selectedStaff.name}</h3>
                  <p className="text-sm text-[#71717a] mt-0.5">Enter your 4-digit PIN</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={16} className={error ? 'text-red-500' : 'text-[#a1a1aa]'} />
                    </div>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      autoFocus
                      autoComplete="one-time-code"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, ''));
                        setError(false);
                      }}
                      className={`w-full bg-[#f4f4f5] border ${error ? 'border-red-400' : 'border-transparent focus:border-[#18181b]/20'} rounded-xl py-3.5 pl-10 pr-4 text-center text-xl tracking-[0.35em] text-[#18181b] outline-none transition-all min-h-[52px]`}
                      placeholder="••••"
                    />
                  </div>
                  {error && <p className="text-red-600 text-xs font-medium text-center">Incorrect PIN. Try again.</p>}

                  <button
                    type="submit"
                    disabled={pin.length < 4 || isAuthenticating}
                    className="w-full bg-[#18181b] text-white py-3.5 min-h-[48px] rounded-xl text-sm font-medium hover:bg-[#27272a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 interactive-element"
                  >
                    {isAuthenticating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
