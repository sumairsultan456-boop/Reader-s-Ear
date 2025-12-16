import React from 'react';
import { MessageSquare, Trash2, Plus, X, Clock } from 'lucide-react';
import { HistoryItem } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onNew: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  activeId, 
  onSelect, 
  onDelete,
  onNew
}) => {
  // Sort items by date (newest first)
  const sortedItems = [...items].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-slate-500" />
              Recents
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={() => {
                onNew();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-blue-500/20 shadow-lg active:scale-[0.98]"
            >
              <Plus size={20} />
              New Reading
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {sortedItems.length === 0 ? (
              <div className="text-center py-10 px-6 text-slate-400">
                <p className="text-sm">No history yet.</p>
                <p className="text-xs mt-1">Uploaded images and generated audio will be saved here.</p>
              </div>
            ) : (
              sortedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent ${
                    activeId === item.id 
                      ? 'bg-blue-50 border-blue-100 shadow-sm' 
                      : 'hover:bg-slate-50 hover:border-slate-100'
                  }`}
                >
                  <div className={`mt-1 p-1.5 rounded-lg ${activeId === item.id ? 'bg-blue-200/50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                    <MessageSquare size={14} />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-sm font-medium truncate ${activeId === item.id ? 'text-blue-900' : 'text-slate-700'}`}>
                      {item.preview || "Empty draft"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => onDelete(item.id, e)}
                    className="absolute right-2 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* Footer Info */}
          <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
            Items are saved for this session.
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;