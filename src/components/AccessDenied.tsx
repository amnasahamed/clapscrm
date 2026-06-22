import { motion } from 'motion/react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  requiredRole?: string;
}

export default function AccessDenied({ requiredRole }: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="mx-auto w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 shadow-sm border border-red-100">
          <ShieldAlert size={48} strokeWidth={1.5} />
        </div>
        
        <div>
          <h2 className="text-3xl font-black text-[#18181b] tracking-tight mb-2">Access Restricted</h2>
          <p className="text-[#71717a] text-sm leading-relaxed">
            You don't have the necessary permissions to view this page. 
            {requiredRole && ` This area requires ${requiredRole.toUpperCase()} level access.`}
          </p>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#18181b] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <ArrowLeft size={16} />
          Return to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
