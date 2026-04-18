import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Heart, Clock, ArrowLeft } from 'lucide-react';
import { usePlayerStore, type Song } from '@/store/playerStore';
import { REGIONAL_PLAYLISTS } from '@/lib/indianCuratedData';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLikedSongs, likeSong, unlikeSong } from '@/services/musicData';

function formatTime(seconds: number) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function RegionalPlaylist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playlist = id ? REGIONAL_PLAYLISTS[id] : null;

  const { user, isGuest } = useAuth();
  const userId = isGuest ? null : user?.id || null;
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());

  const setSong = usePlayerStore((s) => s.setSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  useEffect(() => {
    if (!userId && !isGuest) return;
    getLikedSongs(userId).then((songs) => {
      setLikedSongIds(new Set(songs.map(s => s.id)));
    }).catch(() => {});
  }, [userId, isGuest]);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
        <h2 className="text-2xl font-bold">Playlist Not Found</h2>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          Go Home
        </button>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.songs.length === 0) return;
    setQueue(playlist.songs);
    setSong(playlist.songs[0]);
  };

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setQueue(playlist.songs);
      setSong(song);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (!userId && !isGuest) return;
    
    // Optimistic update
    const newLiked = new Set(likedSongIds);
    const isCurrentlyLiked = newLiked.has(song.id);
    
    if (isCurrentlyLiked) {
      newLiked.delete(song.id);
      setLikedSongIds(newLiked);
      await unlikeSong(userId, song.id);
    } else {
      newLiked.add(song.id);
      setLikedSongIds(newLiked);
      await likeSong(userId, song);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-32">
      {/* Massive Gradient Banner */}
      <div className={cn("relative pt-24 pb-8 px-8", `bg-gradient-to-b ${playlist.color}`)}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center transition-colors z-20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="relative z-10 flex items-end gap-6 max-w-6xl mx-auto">
          {/* Main Thumbnail */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-48 h-48 sm:w-60 sm:h-60 rounded-sm shadow-2xl overflow-hidden flex-shrink-0"
          >
            <img src={playlist.image} alt={playlist.title} className="w-full h-full object-cover" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0 pb-2"
          >
            <p className="text-sm font-bold tracking-widest uppercase text-white/80 mb-2">Playlist</p>
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter shadow-sm mb-4 line-clamp-2">
              {playlist.title}
            </h1>
            <p className="text-lg text-white/70 font-medium mb-3">{playlist.subtitle}</p>
            <div className="flex items-center gap-2 text-sm text-white/50 font-semibold">
              <span className="text-white">Sur Curated</span>
              <span>•</span>
              <span>{playlist.songs.length} songs</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-8 relative z-20 -mt-2">
        {/* Play Action Row */}
        <div className="py-6 flex items-center gap-6">
          <button 
            onClick={handlePlayAll}
            className="w-14 h-14 rounded-full bg-primary hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shadow-[0_8px_20px_rgba(225,29,72,0.4)]"
          >
            <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
          </button>
        </div>

        {/* List Header */}
        <div className="grid grid-cols-[16px_1fr_40px] sm:grid-cols-[16px_4fr_3fr_40px] items-center gap-4 px-4 py-2 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">
          <span>#</span>
          <span>Title</span>
          <span className="hidden sm:block">Album / Artist</span>
          <Clock className="w-4 h-4 mx-auto" />
        </div>

        {/* Songs List */}
        <div className="space-y-1">
          {playlist.songs.map((song, index) => {
            const isActive = currentSong?.id === song.id;
            const isLiked = likedSongIds.has(song.id);

            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                key={song.id}
                onClick={() => handlePlaySong(song)}
                className={cn(
                  "group grid grid-cols-[16px_1fr_40px] sm:grid-cols-[16px_4fr_3fr_40px] items-center gap-4 px-4 py-2.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer",
                  isActive ? "bg-white/5" : ""
                )}
              >
                {/* Index / Play Button */}
                <div className="text-center">
                  {isActive && isPlaying ? (
                    <div className="flex items-end justify-center gap-[2px] h-3">
                      <span className="w-[3px] bg-primary rounded-full animate-bounce h-[80%]" style={{ animationDelay: '0ms' }} />
                      <span className="w-[3px] bg-primary rounded-full animate-bounce h-full" style={{ animationDelay: '150ms' }} />
                      <span className="w-[3px] bg-primary rounded-full animate-bounce h-[60%]" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <>
                      <span className={cn("text-base group-hover:hidden font-medium", isActive ? "text-primary" : "text-white/40")}>
                        {index + 1}
                      </span>
                      <Play className="w-4 h-4 text-white hidden group-hover:block ml-0.5" fill="currentColor" />
                    </>
                  )}
                </div>

                {/* Title & Thumbnail */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-white/10 rounded-sm overflow-hidden flex-shrink-0">
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-base font-semibold truncate", isActive ? "text-primary" : "text-white")}>
                      {song.title}
                    </p>
                    {/* Show artist on mobile under title */}
                    <p className="text-xs text-white/50 truncate sm:hidden">
                      {song.artist}
                    </p>
                  </div>
                </div>

                {/* Artist (Desktop) */}
                <div className="text-sm font-medium text-white/60 truncate hidden sm:block group-hover:text-white/90 transition-colors">
                  {song.artist}
                </div>

                {/* Duration & Like */}
                <div className="flex items-center justify-end gap-2 text-sm text-white/50 tabular-nums">
                  <button 
                    onClick={(e) => handleLikeToggle(e, song)}
                    className={cn(
                      "p-2 opacity-0 group-hover:opacity-100 transition-opacity", 
                      isLiked ? "opacity-100 text-primary" : "hover:text-white"
                    )}
                  >
                    <Heart className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
                  </button>
                  <span className="w-10 text-right">{formatTime(song.duration)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
