import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ChevronDown } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import SimulatedVisualizer from './SimulatedVisualizer';
import { cn } from '@/lib/utils';
import { useRef, useCallback } from 'react';

function formatTime(seconds: number) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function FullscreenPlayer({ onClose }: { onClose: () => void }) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrev,
    setCurrentTime
  } = usePlayerStore();

  const progressRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(pct * duration);
  }, [duration, setCurrentTime]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentSong) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col"
    >
      {/* Dynamic blurred backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-cover bg-center blur-[120px] opacity-40 scale-125 transition-opacity duration-1000",
          isPlaying ? "opacity-60" : "opacity-30"
        )}
        style={{ backgroundImage: `url(${currentSong.thumbnail})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />

      {/* Header */}
      <div className="relative z-10 w-full p-6 flex justify-between items-center">
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors backdrop-blur-md"
        >
          <ChevronDown className="w-8 h-8 text-white" />
        </button>
        <div className="text-center">
           <p className="text-xs font-bold uppercase tracking-widest text-white/50">Playing from Sur</p>
        </div>
        <div className="w-12" /> {/* spacer for flex centering */}
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 w-full max-w-4xl mx-auto space-y-12">
        
        {/* Album Art (Bounces gently) */}
        <motion.div 
          animate={{ scale: isPlaying ? 1.02 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
          className="w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
        >
          <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover" />
        </motion.div>

        {/* Info */}
        <div className="text-center w-full px-4">
          <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-lg mb-2 truncate">{currentSong.title}</h1>
          <p className="text-xl text-white/60 font-medium truncate">{currentSong.artist}</p>
        </div>

        {/* Visualizer Area */}
        <div className="w-full h-[150px] sm:h-[200px] max-w-3xl">
          <SimulatedVisualizer isPlaying={isPlaying} />
        </div>
      </div>

      {/* Heavy Media Controls Footer */}
      <div className="relative z-10 w-full px-8 pb-12 pt-6 shrink-0 max-w-4xl mx-auto">
        {/* Scrubber */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-xs font-bold text-white/50 tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-2 bg-white/10 rounded-full cursor-pointer group hover:h-3 transition-all relative"
          >
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-primary transition-colors"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
          <span className="text-xs font-bold text-white/50 tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Huge Transport Controls */}
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          <button onClick={playPrev} className="text-white/40 hover:text-white transition-colors">
            <SkipBack className="w-10 h-10" fill="currentColor" />
          </button>

          <button
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="w-10 h-10" fill="currentColor" />
            ) : (
              <Play className="w-10 h-10 ml-2" fill="currentColor" />
            )}
          </button>

          <button onClick={playNext} className="text-white/40 hover:text-white transition-colors">
            <SkipForward className="w-10 h-10" fill="currentColor" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
