import { useState, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface AdminCatalogListProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconClassName?: string;
  items: string[];
  onAdd: (name: string) => boolean;
  onUpdate: (oldName: string, newName: string) => boolean;
  onDelete: (name: string) => boolean;
  getUsageCount: (name: string) => number;
  addLabel?: string;
  placeholder?: string;
  deleteMessage: (name: string) => string;
}

export default function AdminCatalogList({
  title,
  subtitle,
  icon,
  iconClassName = 'bg-indigo-50 text-indigo-600',
  items,
  onAdd,
  onUpdate,
  onDelete,
  getUsageCount,
  addLabel = 'Add',
  placeholder = 'New option...',
  deleteMessage,
}: AdminCatalogListProps) {
  const [newValue, setNewValue] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    if (!onAdd(newValue)) {
      setError('Name is empty or already exists.');
      return;
    }
    setNewValue('');
  };

  const startEdit = (item: string) => {
    setEditingItem(item);
    setEditValue(item);
    setError('');
  };

  const saveEdit = () => {
    if (!editingItem) return;
    if (!onUpdate(editingItem, editValue)) {
      setError('Could not update — name may be empty or duplicate.');
      return;
    }
    setEditingItem(null);
    setEditValue('');
  };

  return (
    <div className="surface-panel overflow-hidden">
      <div className="px-6 py-5 border-b border-black/5 flex items-center gap-3 bg-white/50">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClassName}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight text-[#18181b]">{title}</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newValue}
            onChange={e => { setNewValue(e.target.value); setError(''); }}
            placeholder={placeholder}
            className="flex-1 bg-[#f4f4f5] border border-transparent rounded-xl px-4 py-3 min-h-[48px] text-sm font-semibold outline-none focus:bg-white focus:border-[#18181b]"
          />
          <button
            onClick={handleAdd}
            disabled={!newValue.trim()}
            className="px-5 py-3 min-h-[48px] bg-[#18181b] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 interactive-element"
          >
            <Plus size={16} /> {addLabel}
          </button>
        </div>
        {error && <p className="text-xs font-bold text-red-600">{error}</p>}

        <div className="divide-y divide-[#f4f4f5] border border-[#e4e4e7] rounded-2xl overflow-hidden max-h-[320px] overflow-y-auto">
          {items.map(item => (
            <div key={item} className="flex items-center justify-between gap-3 p-4 min-h-[64px] hover:bg-[#fafafa] transition-colors">
              {editingItem === item ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="flex-1 bg-white border border-[#18181b] rounded-lg px-3 py-2 text-sm font-semibold outline-none"
                  />
                  <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check size={18} /></button>
                  <button onClick={() => setEditingItem(null)} className="p-2 text-[#71717a] hover:bg-[#f4f4f5] rounded-lg"><X size={18} /></button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-bold text-sm text-[#18181b]">{item}</p>
                    <p className="text-[10px] text-[#71717a] font-medium">{getUsageCount(item)} leads</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(item)} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] rounded-xl interactive-element">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      disabled={items.length <= 1}
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

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) onDelete(deleteTarget); setDeleteTarget(null); }}
        title={`Delete ${title.replace(/s$/, '')}`}
        message={deleteTarget ? deleteMessage(deleteTarget) : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
