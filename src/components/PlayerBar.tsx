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

  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Check if current song is liked
  useEffect(() => {
    if (!user || !currentSong) { setLiked(false); return; }
    isSongLiked(user.id, currentSong.id).then(setLiked).catch(() => setLiked(false));
  }, [user, currentSong?.id]);

  // Track recently played when song changes
  useEffect(() => {
    if (!user || !currentSong) return;
    trackRecentlyPlayed(user.id, currentSong).catch(() => {});
  }, [user, currentSong?.id]);

  const handleLikeToggle = async () => {
    if (!user || !currentSong) return;
    if (liked) {
      await unlikeSong(user.id, currentSong.id);
      setLiked(false);
    } else {
      await likeSong(user.id, currentSong);
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
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-xl border-t border-white/5"
    >
      {/* Progress bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="w-full h-1 bg-white/5 cursor-pointer group hover:h-2 transition-all relative"
      >
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-rose-400"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-neon opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 7px)` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 max-w-screen-2xl mx-auto">
        {/* Song Info + Like */}
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
              {user && (
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
              )}
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

        {/* Playback Controls */}
        <div className="flex flex-col items-center gap-0.5 w-[40%]">
          <div className="flex items-center gap-5">
            <button
              onClick={playPrev}
              className="text-white/50 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentSong}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                currentSong
                  ? "bg-white text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  : "bg-white/20 text-white/40 cursor-not-allowed"
              )}
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
              onClick={playNext}
              className="text-white/50 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/30 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end gap-2 w-[30%]">
          <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
            <VolumeIcon className="w-5 h-5" />
          </button>
          <div
            ref={volumeRef}
            onClick={handleVolumeClick}
            className="w-24 h-1.5 bg-white/10 rounded-full cursor-pointer group relative"
          >
            <div
              className="h-full bg-white/50 rounded-full transition-all group-hover:bg-white/70"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
