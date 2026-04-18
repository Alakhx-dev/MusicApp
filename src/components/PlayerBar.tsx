import { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Volume1, Loader2, Music2, Heart
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useAuth } from '@/contexts/AuthContext';
import { likeSong, unlikeSong, isSongLiked, trackRecentlyPlayed } from '@/services/musicData';
import { cn } from '@/lib/utils';
import FullscreenPlayer from './FullscreenPlayer';
import { Maximize2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type PlayerBarProps = {
  onSeek: (seconds: number) => void;
};

export default function PlayerBar({ onSeek }: PlayerBarProps) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    togglePlay,
    playNext,
    playPrev,
    setVolume,
    toggleMute,
  } = usePlayerStore();

  const { user, isGuest } = useAuth();
  const userId = isGuest ? null : user?.id || null;
  const [liked, setLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Check if current song is liked
  useEffect(() => {
    if (!currentSong) { setLiked(false); return; }
    if (!userId && !isGuest) { setLiked(false); return; }
    isSongLiked(userId, currentSong.id).then(setLiked).catch(() => setLiked(false));
  }, [userId, isGuest, currentSong?.id]);

  // Track recently played when song changes
  useEffect(() => {
    if (!currentSong) return;
    trackRecentlyPlayed(userId, currentSong).catch(() => {});
  }, [userId, currentSong?.id]);

  const handleLikeToggle = async () => {
    if (!currentSong) return;
    if (liked) {
      await unlikeSong(userId, currentSong.id);
      setLiked(false);
    } else {
      await likeSong(userId, currentSong);
      setLiked(true);
    }
  };

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect || !duration) return;
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(duration, pct * duration)));
  }, [duration, onSeek]);

  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = volumeRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = (e.clientX - rect.left) / rect.width;
    setVolume(Math.round(Math.max(0, Math.min(100, pct * 100))));
  }, [setVolume]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <>
      <AnimatePresence>
        {isFullscreen && <FullscreenPlayer onClose={() => setIsFullscreen(false)} />}
      </AnimatePresence>
      <motion.div
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
      <div className="max-w-screen-2xl mx-auto rounded-2xl bg-[#111]/80 backdrop-blur-2xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-4 py-3 flex items-center justify-between">
        
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          {currentSong ? (
            <>
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 shadow-lg">
                <img
                  src={currentSong.thumbnail}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 mr-1">
                <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
                <p className="text-xs text-white/50 truncate">{currentSong.artist}</p>
              </div>
              <button
                  onClick={handleLikeToggle}
                  className={cn(
                    "flex-shrink-0 transition-colors",
                    liked ? "text-primary" : "text-white/20 hover:text-white/50"
                  )}
                  title={liked ? 'Unlike' : 'Like'}
                >
                  <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                </button>
            </>
          ) : (
            <div className="flex items-center gap-3 text-white/30">
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                <Music2 className="w-5 h-5" />
              </div>
              <span className="text-sm">No song playing</span>
            </div>
          )}
        </div>

        {/* Center: Controls & Progress */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl px-6">
          <div className="flex items-center gap-6 mb-1">
            <button
              className="text-white/40 hover:text-white transition-colors"
              onClick={playPrev}
            >
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </button>

            <button
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              onClick={togglePlay}
              disabled={!currentSong}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
              )}
            </button>

            <button
              className="text-white/40 hover:text-white transition-colors"
              onClick={playNext}
            >
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </button>
          </div>

          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] text-white/30 tabular-nums w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group hover:h-2 transition-all relative"
            >
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-primary transition-colors"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <span className="text-[10px] text-white/30 tabular-nums w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Actions & Volume */}
        <div className="flex items-center justify-end gap-5 w-[30%] min-w-0">
          {currentSong && (
            <button
              onClick={handleLikeToggle}
              className={cn(
                "flex-shrink-0 transition-colors p-2 rounded-full hover:bg-white/5",
                liked ? "text-primary" : "text-white/30 hover:text-white"
              )}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart className="w-[18px] h-[18px]" fill={liked ? 'currentColor' : 'none'} />
            </button>
          )}
          <div className="flex items-center gap-2 group w-28">
            <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
              <VolumeIcon className="w-[18px] h-[18px]" />
            </button>
            <div
              ref={volumeRef}
              onClick={handleVolumeClick}
              className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer relative hidden sm:block"
            >
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-primary transition-colors"
                style={{ width: `${isMuted ? 0 : volume}%` }}
              />
            </div>
          </div>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="text-white/40 hover:text-white transition-colors ml-4 hidden sm:block"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
    </>
  );
}
