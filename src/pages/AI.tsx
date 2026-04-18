import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Disc3, Wand2, Play } from 'lucide-react';
import { usePlayerStore, type Song } from '@/store/playerStore';

// --- AI PLACEHOLDER FUNCTIONS ---

/** AI Search Helper: enhances queries with context */
function aiSearchHelper(query: string): string {
  const moods: Record<string, string> = {
    'happy': 'upbeat pop dance party songs',
    'sad': 'melancholic emotional ballads',
    'chill': 'lo-fi ambient relaxing beats',
    'energetic': 'high energy workout EDM songs',
    'romantic': 'love songs romantic duets bollywood',
    'study': 'instrumental focus lo-fi study beats',
    'party': 'dance EDM club bangers 2024',
  };
  return moods[query.toLowerCase()] || query;
}

/** Mood Playlist Generator: returns songs matching a mood */
function generateMoodPlaylist(mood: string): Song[] {
  const playlists: Record<string, Song[]> = {
    'Happy': [
      { id: 'ZbZSe6N_BXs', title: 'Happy', artist: 'Pharrell Williams', thumbnail: 'https://img.youtube.com/vi/ZbZSe6N_BXs/mqdefault.jpg', duration: 233 },
      { id: 'nfWlot6h_JM', title: 'Shake It Off', artist: 'Taylor Swift', thumbnail: 'https://img.youtube.com/vi/nfWlot6h_JM/mqdefault.jpg', duration: 242 },
      { id: 'ru0K8uYEZWw', title: 'Can\'t Stop the Feeling', artist: 'Justin Timberlake', thumbnail: 'https://img.youtube.com/vi/ru0K8uYEZWw/mqdefault.jpg', duration: 236 },
    ],
    'Chill': [
      { id: '5qap5aO4i9A', title: 'Lofi Hip Hop Mix', artist: 'ChilledCow', thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg', duration: 3600 },
      { id: 'lTRiuFIWV54', title: 'Blinding Lights', artist: 'The Weeknd', thumbnail: 'https://img.youtube.com/vi/lTRiuFIWV54/mqdefault.jpg', duration: 202 },
    ],
    'Romantic': [
      { id: 'hoNb6HuNmU0', title: 'Tum Hi Ho', artist: 'Arijit Singh', thumbnail: 'https://img.youtube.com/vi/hoNb6HuNmU0/mqdefault.jpg', duration: 261 },
      { id: 'vGJTaP6anOU', title: 'Channa Mereya', artist: 'Arijit Singh', thumbnail: 'https://img.youtube.com/vi/vGJTaP6anOU/mqdefault.jpg', duration: 289 },
      { id: 'bo_efYhYU2A', title: 'Kal Ho Naa Ho', artist: 'Sonu Nigam', thumbnail: 'https://img.youtube.com/vi/bo_efYhYU2A/mqdefault.jpg', duration: 326 },
    ],
    'Party': [
      { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg', duration: 282 },
      { id: 'RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa', thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/mqdefault.jpg', duration: 237 },
    ],
  };
  return playlists[mood] || playlists['Happy'] || [];
}

/** AI DJ: picks next song based on current */
function aiDJNextSong(currentId: string): Song {
  // Simple recommendation logic placeholder
  const pool: Song[] = [
    { id: '60ItHLz5WEA', title: 'Faded', artist: 'Alan Walker', thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/mqdefault.jpg', duration: 212 },
    { id: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/mqdefault.jpg', duration: 367 },
    { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg', duration: 263 },
    { id: 'cYOB941gyXI', title: 'Kesariya', artist: 'Arijit Singh', thumbnail: 'https://img.youtube.com/vi/cYOB941gyXI/mqdefault.jpg', duration: 268 },
  ];
  return pool.filter((s) => s.id !== currentId)[Math.floor(Math.random() * (pool.length - 1))] || pool[0];
}

// --- MOOD OPTIONS ---
const moods = ['Happy', 'Chill', 'Romantic', 'Party'];

export default function AIPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodSongs, setMoodSongs] = useState<Song[]>([]);
  const [djSuggestion, setDjSuggestion] = useState<Song | null>(null);
  const setSong = usePlayerStore((s) => s.setSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);

  function handleMood(mood: string) {
    setSelectedMood(mood);
    const songs = generateMoodPlaylist(mood);
    setMoodSongs(songs);
    setDjSuggestion(null);
  }

  function handleDJ() {
    const next = aiDJNextSong(currentSong?.id || '');
    setDjSuggestion(next);
  }

  return (
    <div className="p-6 pb-28 overflow-y-auto h-full space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI DJ</h1>
          <p className="text-white/40 text-sm">Let AI curate your perfect playlist</p>
        </div>
      </motion.div>

      {/* Mood Selector */}
      <section>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" /> Mood Playlists
        </h2>
        <div className="flex flex-wrap gap-3">
          {moods.map((mood) => (
            <motion.button
              key={mood}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMood(mood)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedMood === mood
                  ? 'bg-primary text-white shadow-neon'
                  : 'glass-button text-white/60'
              }`}
            >
              {mood}
            </motion.button>
          ))}
        </div>

        {moodSongs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
            {moodSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => { setSong(song); setQueue(moodSongs); }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <img src={song.thumbnail} alt={song.title} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{song.title}</p>
                  <p className="text-xs text-white/40">{song.artist}</p>
                </div>
                <Play className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </motion.div>
        )}
      </section>

      {/* AI DJ */}
      <section>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-cyan-400" /> AI DJ - Next Song
        </h2>
        <button
          onClick={handleDJ}
          className="glass-button px-6 py-3 flex items-center gap-2 text-sm group"
        >
          <Wand2 className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
          Suggest Next Song
        </button>

        {djSuggestion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 glass-panel p-4 max-w-sm"
          >
            <p className="text-xs text-purple-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Recommends
            </p>
            <div
              onClick={() => setSong(djSuggestion)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img src={djSuggestion.thumbnail} alt="" className="w-14 h-14 rounded-lg" />
              <div>
                <p className="text-sm font-semibold">{djSuggestion.title}</p>
                <p className="text-xs text-white/40">{djSuggestion.artist}</p>
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}
