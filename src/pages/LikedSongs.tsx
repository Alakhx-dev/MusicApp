import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Pause, Trash2, Music2, Shuffle } from 'lucide-react';
import { usePlayerStore, type Song } from '@/store/playerStore';
import { useAuth } from '@/contexts/AuthContext';
import { getLikedSongs, unlikeSong } from '@/services/musicData';
import { cn } from '@/lib/utils';

function formatDuration(sec: number): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LikedSongs() {
  const { user, isGuest } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setSong = usePlayerStore((s) => s.setSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const userId = isGuest ? null : user?.id || null;

  const fetchLiked = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLikedSongs(userId);
      setSongs(data);
    } catch {
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLiked();
  }, [fetchLiked]);

  const handlePlay = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setSong(song);
      setQueue(songs);
    }
  };

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setSong(shuffled[0]);
    setQueue(shuffled);
  };

  const handleUnlike = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    await unlikeSong(userId, songId);
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  return (
    <div className="p-6 pb-28 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-rose-500 to-purple-600 flex items-center justify-center shadow-neon flex-shrink-0">
          <Heart className="w-9 h-9 text-white" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Liked Songs</h1>
          <p className="text-sm text-white/40 mt-1">
            {loading ? '...' : `${songs.length} song${songs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Actions */}
      {songs.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setSong(songs[0]); setQueue(songs); }}
            className="bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-neon"
          >
            <Play className="w-4 h-4" fill="currentColor" /> Play All
          </button>
          <button
            onClick={handleShuffle}
            className="glass-button px-5 py-2.5 rounded-full flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Shuffle className="w-4 h-4" /> Shuffle
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-5 h-4 rounded bg-white/5" />
              <div className="w-12 h-12 rounded-lg bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/5 rounded-lg w-2/3" />
                <div className="h-3 bg-white/5 rounded-lg w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && songs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-white/15"
        >
          <Heart className="w-20 h-20 mb-5" strokeWidth={1} />
          <p className="text-xl font-medium mb-1">No liked songs yet</p>
          <p className="text-sm">Songs you like will appear here</p>
        </motion.div>
      )}

      {/* Song List */}
      {!loading && songs.length > 0 && (
        <div className="space-y-0.5">
          <AnimatePresence>
            {songs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => handlePlay(song)}
                  className={cn(
                    "flex items-center gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
                    isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-white/5"
                  )}
                >
                  {/* Index / Playing indicator */}
                  <div className="w-6 text-center flex-shrink-0">
                    {isCurrentPlaying ? (
                      <div className="flex items-center justify-center gap-[2px]">
                        <span className="w-[3px] h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-[3px] h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-[3px] h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <>
                        <span className="text-xs text-white/20 group-hover:hidden">{idx + 1}</span>
                        <Play className="w-4 h-4 text-white hidden group-hover:block mx-auto" fill="currentColor" />
                      </>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" loading="lazy" />
                    {isCurrent && isCurrentPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Pause className="w-4 h-4 text-white" fill="currentColor" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", isCurrent ? "text-primary" : "text-white")}>{song.title}</p>
                    <p className="text-xs text-white/40 truncate">{song.artist}</p>
                  </div>

                  {/* Duration */}
                  {song.duration > 0 && (
                    <span className="text-xs text-white/20 tabular-nums flex-shrink-0">{formatDuration(song.duration)}</span>
                  )}

                  {/* Unlike */}
                  <button
                    onClick={(e) => handleUnlike(e, song.id)}
                    className="flex-shrink-0 text-primary opacity-60 hover:opacity-100 group-hover:opacity-80 transition-opacity"
                    title="Remove from liked"
                  >
                    <Heart className="w-4 h-4" fill="currentColor" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
