import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag, Check, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminSourcesSection() {
  const { leadSources, addLeadSource, updateLeadSource, deleteLeadSource, leads } = useData();
  const [newSource, setNewSource] = useState('');
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [error, setError] = useState('');

  const getUsageCount = (source: string) => leads.filter(l => l.source === source).length;

  const handleAdd = () => {
    setError('');
    if (!addLeadSource(newSource)) {
      setError('Source already exists or name is empty.');
      return;
    }
    setNewSource('');
  };

  const startEdit = (source: string) => {
    setEditingSource(source);
    setEditValue(source);
    setError('');
  };

  const saveEdit = () => {
    if (!editingSource) return;
    if (!updateLeadSource(editingSource, editValue)) {
      setError('Could not update — name may be empty or duplicate.');
      return;
    }
    setEditingSource(null);
    setEditValue('');
  };

  return (
    <div className="surface-panel overflow-hidden">
      <div className="px-6 py-5 border-b border-black/5 flex items-center gap-3 bg-white/50">
        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
          <Tag size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight text-[#18181b]">Lead Sources</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mt-0.5">
            Manage enquiry source options
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newSource}
            onChange={e => { setNewSource(e.target.value); setError(''); }}
            placeholder="New source name..."
            className="flex-1 bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b]"
          />
          <button
            onClick={handleAdd}
            disabled={!newSource.trim()}
            className="px-5 py-3 min-h-[48px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 interactive-element"
          >
            <Plus size={16} /> Add Source
          </button>
        </div>
        {error && <p className="text-xs font-bold text-red-600">{error}</p>}

        <div className="bg-[#f4f4f5] rounded-3xl p-1">
          <div className="bg-white rounded-2xl divide-y divide-[#e4e4e7] overflow-hidden">
            {leadSources.map(source => (
              <div key={source} className="flex items-center justify-between gap-3 p-4 min-h-[64px] hover:bg-[#fafafa] transition-colors">
                {editingSource === source ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="flex-1 bg-white border border-[#18181b] rounded-lg px-3 py-2 text-sm font-semibold outline-none"
                    />
                    <button onClick={saveEdit} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-green-600 hover:bg-green-50 rounded-lg"><Check size={18} /></button>
                    <button onClick={() => setEditingSource(null)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] rounded-lg"><X size={18} /></button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-bold text-sm text-[#18181b]">{source}</p>
                      <p className="text-[10px] text-[#71717a] font-medium">{getUsageCount(source)} leads</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(source)} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] rounded-xl interactive-element">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(source)}
                        disabled={leadSources.length <= 1}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-30 interactive-element"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteLeadSource(deleteTarget); setDeleteTarget(null); }}
        title="Delete Source"
        message={`Delete "${deleteTarget}"? Leads using this source will be moved to a fallback source.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
