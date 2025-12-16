import React, { useState, useEffect, useRef } from 'react';
import { Ear, Sparkles, Menu } from 'lucide-react';
import InputArea from './components/InputArea';
import Player from './components/Player';
import Sidebar from './components/Sidebar';
import { extractTextFromImage, generateSpeechFromText } from './services/geminiService';
import { LoadingState, HistoryItem } from './types';
import { 
  saveHistoryToLocal, 
  loadHistoryFromLocal, 
  saveAudioBlob, 
  getAudioBlob, 
  deleteAudioBlob 
} from './utils/storage';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

export const App: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([{
    id: generateId(),
    text: '',
    audioUrl: null,
    createdAt: Date.now(),
    preview: '',
    hasAudio: false
  }]);
  
  const [activeId, setActiveId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history on mount
  useEffect(() => {
    const load = async () => {
      const savedItems = loadHistoryFromLocal();
      
      if (savedItems && savedItems.length > 0) {
        // Hydrate audio URLs from IndexedDB for items that have audio
        const hydratedItems = await Promise.all(savedItems.map(async (item) => {
          if (item.hasAudio) {
            try {
              const blob = await getAudioBlob(item.id);
              if (blob) {
                return { ...item, audioUrl: URL.createObjectURL(blob) };
              }
            } catch (e) {
              console.warn(`Failed to load audio for item ${item.id}`, e);
            }
            // If blob missing, reset flag
            return { ...item, hasAudio: false, audioUrl: null };
          }
          return item;
        }));
        
        setItems(hydratedItems);
        setActiveId(hydratedItems[0].id);
      } else {
        // Initialize default if empty
        const newId = generateId();
        setItems([{
          id: newId,
          text: '',
          audioUrl: null,
          createdAt: Date.now(),
          preview: '',
          hasAudio: false
        }]);
        setActiveId(newId);
      }
      setIsLoaded(true);
    };
    
    load();
  }, []);

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      saveHistoryToLocal(items);
    }, 1000); // Save 1s after last change

    return () => clearTimeout(timeoutId);
  }, [items, isLoaded]);

  // Derived state
  const activeItem = items.find(item => item.id === activeId) || items[0];

  const updateActiveItem = (updates: Partial<HistoryItem>) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === activeId) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  const createNewItem = () => {
    const newItem: HistoryItem = {
      id: generateId(),
      text: '',
      audioUrl: null,
      createdAt: Date.now(),
      preview: '',
      hasAudio: false
    };
    setItems(prev => [newItem, ...prev]);
    setActiveId(newItem.id);
    setError(null);
    setLoadingState(LoadingState.IDLE);
    // Sidebar on mobile should close in the Sidebar component logic, 
    // but we can ensure clean state here if needed.
  };

  const deleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const itemToDelete = items.find(i => i.id === id);
    
    // Cleanup audio resources
    if (itemToDelete?.audioUrl) {
      URL.revokeObjectURL(itemToDelete.audioUrl);
    }
    if (itemToDelete?.hasAudio) {
      deleteAudioBlob(id).catch(err => console.error("Failed to delete audio blob", err));
    }

    // Don't delete the last item, just clear it
    if (items.length === 1) {
      updateActiveItem({ 
        text: '', 
        audioUrl: null, 
        preview: '', 
        hasAudio: false 
      });
      return;
    }

    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);

    if (activeId === id) {
      setActiveId(newItems[0].id);
    }
  };

  const formatError = (err: any): string => {
    const defaultMsg = "An unexpected error occurred.";
    if (!err) return defaultMsg;
    if (typeof err.message === 'string' && err.message.startsWith('{')) {
      try {
        const parsed = JSON.parse(err.message);
        return parsed.error?.message || err.message;
      } catch (e) {
        return err.message;
      }
    }
    return err.message || defaultMsg;
  };

  const handleImageUpload = async (file: File) => {
    try {
      setLoadingState(LoadingState.EXTRACTING_TEXT);
      setError(null);
      
      // Invalidate old audio
      if (activeItem.audioUrl) {
        URL.revokeObjectURL(activeItem.audioUrl);
      }
      
      const extractedText = await extractTextFromImage(file);
      
      updateActiveItem({ 
        text: extractedText,
        preview: extractedText.substring(0, 50) + (extractedText.length > 50 ? '...' : ''),
        audioUrl: null,
        hasAudio: false
      });
      
    } catch (err: any) {
      console.error("Extraction error", err);
      setError(formatError(err));
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleGenerateAudio = async () => {
    if (!activeItem.text.trim()) return;

    try {
      setLoadingState(LoadingState.GENERATING_AUDIO);
      setError(null);
      
      if (activeItem.audioUrl) {
        URL.revokeObjectURL(activeItem.audioUrl);
      }

      const url = await generateSpeechFromText(activeItem.text);
      
      // Save to IndexedDB
      const blob = await fetch(url).then(r => r.blob());
      await saveAudioBlob(activeItem.id, blob);

      updateActiveItem({ 
        audioUrl: url,
        hasAudio: true
      });
      
    } catch (err: any) {
      console.error("Speech generation error", err);
      setError(formatError(err));
    } finally {
      setLoadingState(LoadingState.IDLE);
    }
  };

  const handleTextChange = (newText: string) => {
    const hasChanged = newText !== activeItem.text;
    
    let updates: Partial<HistoryItem> = {
      text: newText,
      preview: newText.substring(0, 50) + (newText.length > 50 ? '...' : '')
    };

    // Invalidate audio if text changes
    if (hasChanged && activeItem.audioUrl) {
      URL.revokeObjectURL(activeItem.audioUrl);
      updates.audioUrl = null;
      updates.hasAudio = false;
      // Note: We don't delete the blob immediately to avoid trashing DB on every keystroke.
      // It will be overwritten next generate or deleted on item delete.
    }

    updateActiveItem(updates);
  };

  // Prevent rendering until hydration is complete to avoid flicker
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
          <div className="text-slate-400 font-medium">Loading your library...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-48">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        items={items}
        activeId={activeId}
        onSelect={setActiveId}
        onDelete={deleteItem}
        onNew={createNewItem}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 transition-all">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-200">
                <Ear size={20} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">Reader's Ear</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100 flex items-center gap-1.5">
              <Sparkles size={14} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-700">AI Powered</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 transition-all">
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-800">
              {activeItem.preview ? 'Edit Reading' : 'New Reading'}
            </h2>
            <p className="text-slate-500 text-sm">
              Type, paste text, or upload an image. Your work is saved automatically.
            </p>
          </div>
          
          <InputArea 
            key={activeItem.id}
            text={activeItem.text} 
            setText={handleTextChange} 
            onImageUpload={handleImageUpload}
            isLoading={loadingState === LoadingState.EXTRACTING_TEXT}
            error={error}
          />

          {loadingState === LoadingState.EXTRACTING_TEXT && (
            <div className="flex items-center justify-center py-8 text-blue-600 animate-pulse">
              <span className="text-sm font-medium">Extracting text from image...</span>
            </div>
          )}
        </div>
      </main>

      {/* Player Section */}
      <Player 
        key={`player-${activeItem.id}-${activeItem.audioUrl}`}
        audioUrl={activeItem.audioUrl} 
        isLoading={loadingState === LoadingState.GENERATING_AUDIO}
        onGenerate={handleGenerateAudio}
        hasText={activeItem.text.trim().length > 0}
      />
    </div>
  );
};