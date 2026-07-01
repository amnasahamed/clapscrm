import { motion } from 'motion/react';
import { Phone, Tag, Calendar, User } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export default function AdminTeacherEnquiriesSection() {
  const { teacherEnquiries } = useData();
  return (
    <div className="space-y-6">

      {/* Teacher Enquiries Panel */}
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
              <h3 className="section-title text-base">Teacher Enquiries</h3>
              <p className="text-xs text-[#71717a] mt-0.5">Enquiries from potential teachers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-1 mx-4 mb-4 sm:mx-6 sm:mb-6 mt-2">
          {teacherEnquiries.length === 0 ? (
            <div className="text-center py-12 text-[#a1a1aa] font-semibold text-sm">
              No teacher enquiries logged yet.
            </div>
          ) : (
            <div className="divide-y divide-[#e4e4e7]">
              {teacherEnquiries.map((enq) => (
                <div key={enq.id} className="p-4 sm:p-6 hover:bg-[#fafafa] transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone size={14} className="text-[#a1a1aa]" />
                      <span className="font-bold text-[#18181b]">{enq.phone}</span>
                    </div>
                    {enq.notes && (
                      <p className="text-sm text-[#71717a] mt-1">{enq.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-3 sm:text-right">
                    <div className="bg-[#f4f4f5] px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-[#71717a]">
                      <Calendar size={12} /> {enq.date}
                    </div>
                    <div className="bg-[#f4f4f5] px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-[#71717a]">
                      <Tag size={12} /> {enq.source}
                    </div>
                    <div className="bg-[#f4f4f5] px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-[#71717a]">
                      <User size={12} /> {enq.staffName}
                    </div>
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
