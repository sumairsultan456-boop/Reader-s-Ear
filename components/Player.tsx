import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Settings2, Rabbit, Turtle, Volume2 } from 'lucide-react';
import { PlaybackState } from '../types';

interface PlayerProps {
  audioUrl: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  hasText: boolean;
}

const Player: React.FC<PlayerProps> = ({ audioUrl, isLoading, onGenerate, hasText }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1.0,
  });

  // Effect to handle audio URL changes and setup listeners
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setPlayback(prev => ({ ...prev, currentTime: audio.currentTime }));
    };
    
    const handleLoadedMetadata = () => {
      setPlayback(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      setPlayback(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Effect to sync play/pause and speed state with audio element
  useEffect(() => {
    if (!audioRef.current) return;
    if (playback.isPlaying) {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
    } else {
      audioRef.current.pause();
    }
  }, [playback.isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playback.speed;
    }
  }, [playback.speed]);

  // Handlers
  const togglePlay = () => {
    setPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), playback.duration);
    audioRef.current.currentTime = newTime;
    setPlayback(prev => ({ ...prev, currentTime: newTime }));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayback(prev => ({ ...prev, speed: parseFloat(e.target.value) }));
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If no audio generated yet
  if (!audioUrl) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-xl mx-auto">
          <button
            onClick={onGenerate}
            disabled={!hasText || isLoading}
            className={`w-full py-4 rounded-2xl text-lg font-bold shadow-lg transition-all transform active:scale-[0.98] ${
              hasText && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Volume2 size={24} />
                Generate Audio
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Audio Player UI
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-8 md:p-6 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-50 rounded-t-3xl">
      <audio ref={audioRef} src={audioUrl} className="hidden" />
      
      <div className="max-w-xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>{formatTime(playback.currentTime)}</span>
            <span>{formatTime(playback.duration)}</span>
          </div>
          <div 
            className="h-2 bg-slate-100 rounded-full overflow-hidden cursor-pointer relative group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              if (audioRef.current && playback.duration) {
                const newTime = percent * playback.duration;
                audioRef.current.currentTime = newTime;
                setPlayback(prev => ({ ...prev, currentTime: newTime }));
              }
            }}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-orange-500 rounded-full transition-all duration-100"
              style={{ width: `${(playback.currentTime / (playback.duration || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex justify-between items-center px-4">
          <button 
            onClick={() => skip(-10)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 active:scale-95 transition-all"
            aria-label="Skip back 10 seconds"
          >
            <RotateCcw size={28} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">10 SEC</span>
          </button>

          <button 
            onClick={togglePlay}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
              playback.isPlaying 
                ? 'bg-slate-100 text-slate-800' 
                : 'bg-blue-600 text-white shadow-blue-500/30'
            }`}
          >
            {playback.isPlaying ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1" />
            )}
          </button>

          <button 
            onClick={() => skip(10)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 active:scale-95 transition-all"
            aria-label="Skip forward 10 seconds"
          >
            <RotateCw size={28} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">10 SEC</span>
          </button>
        </div>

        {/* Speed Control */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider min-w-[60px]">
            Speed
          </div>
          <div className="flex-1 flex items-center gap-3">
            <Turtle size={16} className="text-slate-400" />
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.25"
              value={playback.speed}
              onChange={handleSpeedChange}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <Rabbit size={16} className="text-slate-400" />
          </div>
          <div className="text-right min-w-[40px] font-bold text-slate-700 text-sm">
            {playback.speed.toFixed(1)}x
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;