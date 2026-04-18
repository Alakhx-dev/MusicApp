import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, Play, Pause, Sparkles, X,
  Heart, Loader2, Music2, ListPlus
} from 'lucide-react';
import { usePlayerStore, type Song } from '@/store/playerStore';
import { searchYouTube, correctSpelling, isOfficialResult } from '@/services/youtube';
import { useAuth } from '@/contexts/AuthContext';
import { likeSong } from '@/services/musicData';
import { cn } from '@/lib/utils';

// ─── Debounce Hook ───────────────────────────────────
function useDebounce(fn: (...args: any[]) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: any[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ─── Skeleton Loader ─────────────────────────────────
function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="w-5 h-4 rounded bg-white/5" />
          <div className="w-14 h-14 rounded-lg bg-white/5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded-lg" style={{ width: `${60 + Math.random() * 30}%` }} />
            <div className="h-3 bg-white/5 rounded-lg" style={{ width: `${30 + Math.random() * 20}%` }} />
          </div>
          <div className="w-10 h-4 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Format Duration ─────────────────────────────────
function formatDuration(sec: number): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Song Result Row ─────────────────────────────────
function SongRow({
  song,
  index,
  isCurrentlyPlaying,
  isActive,
  isOfficial,
  onPlay,
  onLike,
  onAddToQueue,
  showLike,
}: {
  song: Song;
  index: number;
  isCurrentlyPlaying: boolean;
  isActive: boolean;
  isOfficial: boolean;
  onPlay: () => void;
  onLike: (e: React.MouseEvent) => void;
  onAddToQueue: (e: React.MouseEvent) => void;
  showLike: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      onClick={onPlay}
      className={cn(
        "flex items-center gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-white/5"
      )}
    >
      {/* Index / Now Playing Indicator */}
      <div className="w-6 text-center flex-shrink-0">
        {isCurrentlyPlaying ? (
          <div className="flex items-center justify-center gap-[2px]">
            <span className="w-[3px] h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-[3px] h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-[3px] h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <span className="text-xs text-white/20 group-hover:hidden">{index + 1}</span>
        )}
        {!isCurrentlyPlaying && (
          <Play className="w-4 h-4 text-white hidden group-hover:block mx-auto" fill="currentColor" />
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {isActive && isCurrentlyPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Pause className="w-4 h-4 text-white" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-primary" : "text-white"
          )}>
            {song.title}
          </p>
          {isOfficial && (
            <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              ✓ Official
            </span>
          )}
        </div>
        <p className="text-xs text-white/40 truncate">{song.artist}</p>
      </div>

      {/* Duration */}
      {song.duration > 0 && (
        <span className="text-xs text-white/20 tabular-nums flex-shrink-0">
          {formatDuration(song.duration)}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {showLike && (
          <button
            onClick={onLike}
            className="p-1.5 text-white/20 hover:text-primary transition-colors"
            title="Like"
          >
            <Heart className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onAddToQueue}
          className="p-1.5 text-white/20 hover:text-white/60 transition-colors"
          title="Add to queue"
        >
          <ListPlus className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Search Page ────────────────────────────────
export default function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Zustand store
  const {
    searchResults,
    searchQuery,
    isSearching,
    currentSong,
    isPlaying,
    setSearchResults,
    setSearchQuery,
    setIsSearching,
    clearSearch,
    playSongFromResults,
    togglePlay,
    addToQueue,
  } = usePlayerStore();

  const [aiSuggestion, setAiSuggestion] = useState('');

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search function
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setAiSuggestion('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Spelling correction
    const corrected = correctSpelling(q);
    if (corrected.toLowerCase() !== q.toLowerCase()) {
      setAiSuggestion(corrected);
    } else {
      setAiSuggestion('');
    }

    try {
      const results = await searchYouTube(corrected);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [setSearchResults, setIsSearching]);

  const debouncedSearch = useDebounce(performSearch, 300);

  // Watch global searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setAiSuggestion('');
      setIsSearching(false);
    } else {
      setIsSearching(true);
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, debouncedSearch, setSearchResults, setIsSearching, setAiSuggestion]);

  const handleClear = () => {
    clearSearch();
    setAiSuggestion('');
  };

  const handlePlaySong = (song: Song) => {
    // If clicking the currently playing song, toggle play/pause
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSongFromResults(song);
    }
  };

  const handleLike = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (!user) return;
    await likeSong(user.id, song);
  };

  return (
    <div className="p-6 pb-32 overflow-y-auto h-full w-full max-w-4xl mx-auto flex flex-col items-center">
      
      {/* Search Header for visual feedback since input is in topbar */}
      <div className="mb-8 text-center w-full">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Search Results</h1>
        <p className="text-sm text-white/50">
          {searchQuery ? `Showing results for "${searchQuery}"` : "Type in the top bar to find songs"}
        </p>
      </div>

      {/* AI Spelling Correction */}
      <AnimatePresence>
        {aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto mb-5 flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-white/40">
              Showing results for <button onClick={() => setSearchQuery(aiSuggestion)} className="text-white font-medium hover:text-primary transition-colors">"{aiSuggestion}"</button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        {/* Loading State */}
        {isSearching && <SearchSkeleton />}

        {/* Results */}
        {!isSearching && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/30">{searchResults.length} results</p>
              {currentSong && searchResults.some(s => s.id === currentSong.id) && (
                <div className="flex items-center gap-1.5 text-xs text-primary/60">
                  <Music2 className="w-3 h-3" />
                  <span>Now playing from results</span>
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              {searchResults.map((song, idx) => (
                <SongRow
                  key={`${song.id}-${idx}`}
                  song={song}
                  index={idx}
                  isCurrentlyPlaying={currentSong?.id === song.id && isPlaying}
                  isActive={currentSong?.id === song.id}
                  isOfficial={isOfficialResult(song.title, song.artist)}
                  onPlay={() => handlePlaySong(song)}
                  onLike={(e) => handleLike(e, song)}
                  onAddToQueue={(e) => { e.stopPropagation(); addToQueue(song); }}
                  showLike={!!user}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isSearching && !searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-white/15"
          >
            <SearchIcon className="w-20 h-20 mb-5" strokeWidth={1} />
            <p className="text-xl font-medium mb-1">Search for music</p>
            <p className="text-sm">Find songs, artists, albums</p>
          </motion.div>
        )}

        {/* No Results */}
        {!isSearching && searchQuery && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-white/20"
          >
            <SearchIcon className="w-14 h-14 mb-4" strokeWidth={1.5} />
            <p className="text-lg font-medium mb-1">No results found</p>
            <p className="text-sm">Try different keywords or check your spelling</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
