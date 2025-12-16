import React, { useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface InputAreaProps {
  text: string;
  setText: (text: string) => void;
  onImageUpload: (file: File) => void;
  isLoading: boolean;
  error?: string | null;
}

const InputArea: React.FC<InputAreaProps> = ({ text, setText, onImageUpload, isLoading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center px-1">
        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Source Content
        </label>
        {text && (
          <button 
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
          >
            <X size={14} /> Clear Text
          </button>
        )}
      </div>

      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here or upload an image to read..."
          className="w-full h-64 p-4 text-base md:text-lg leading-relaxed bg-white border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all shadow-sm placeholder:text-slate-300"
          disabled={isLoading}
        />
        
        {/* Floating Action Button for Upload (Desktop/Tablet) or Toolbar (Mobile) */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-medium hover:bg-blue-100 active:bg-blue-200 transition-all shadow-sm border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} />
            <span>Upload Image</span>
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-2 animate-fadeIn">
          <div className="mt-0.5"><FileText size={16} /></div>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default InputArea;