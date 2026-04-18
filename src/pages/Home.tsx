import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Clock, Heart, History } from 'lucide-react';
import { usePlayerStore, type Song } from '@/store/playerStore';
import { useAuth } from '@/contexts/AuthContext';
import { getLikedSongs, getRecentlyPlayed } from '@/services/musicData';

const FEATURED_SONGS: Song[] = [
  { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', duration: 213 },
  { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg', duration: 282 },
  { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg', duration: 263 },
  { id: '60ItHLz5WEA', title: 'Faded', artist: 'Alan Walker', thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/mqdefault.jpg', duration: 212 },
  { id: 'RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/mqdefault.jpg', duration: 237 },
  { id: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/mqdefault.jpg', duration: 367 },
];

const HINDI_SONGS: Song[] = [
  { id: 'hoNb6HuNmU0', title: 'Tum Hi Ho', artist: 'Arijit Singh', thumbnail: 'https://img.youtube.com/vi/hoNb6HuNmU0/mqdefault.jpg', duration: 261 },
  { id: 'cYOB941gyXI', title: 'Kesariya', artist: 'Arijit Singh', thumbnail: 'https://img.youtube.com/vi/cYOB941gyXI/mqdefault.jpg', duration: 268 },
  { id: 'vGJTaP6anOU', title: 'Channa Mereya', artist: 'Arijit Singh', thumbnail: 'https://img.youtube.com/vi/vGJTaP6anOU/mqdefault.jpg', duration: 289 },
  { id: 'BddP6PYo2gs', title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal', thumbnail: 'https://img.youtube.com/vi/BddP6PYo2gs/mqdefault.jpg', duration: 235 },
];

const ALL_SONGS = [...FEATURED_SONGS, ...HINDI_SONGS];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function SongCard({ song, allSongs }: { song: Song; allSongs: Song[] }) {
  const setSong = usePlayerStore((s) => s.setSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  return (
    <motion.div
      variants={item}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        setSong(song);
        setQueue(allSongs);
      }}
      className="group cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden bg-white/5 aspect-square">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-neon">
            <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-white/90 truncate">{song.title}</p>
      <p className="text-xs text-white/40 truncate">{song.artist}</p>
    </motion.div>
  );
}

function SongRow({ song, songs, index }: { song: Song; songs: Song[]; index: number }) {
  const setSong = usePlayerStore((s) => s.setSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ x: 4 }}
      onClick={() => { setSong(song); setQueue(songs); }}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
        <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{song.title}</p>
        <p className="text-xs text-white/40 truncate">{song.artist}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Play className="w-4 h-4 text-primary" fill="currentColor" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (!user) return;
    getLikedSongs(user.id).then(setLikedSongs).catch(() => {});
    getRecentlyPlayed(user.id).then(setRecentSongs).catch(() => {});
  }, [user]);

  return (
    <div className="p-6 pb-28 overflow-y-auto h-full space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white">{getGreeting()}</h1>
        <p className="text-white/40 text-sm mt-1">What do you want to listen to?</p>
      </motion.div>

      {/* Recently Played */}
      {recentSongs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Recently Played</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-w-2xl">
            {recentSongs.slice(0, 8).map((song, i) => (
              <SongRow key={song.id} song={song} songs={recentSongs} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Liked Songs */}
      {likedSongs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary" fill="currentColor" />
            <h2 className="text-lg font-semibold text-white">Liked Songs</h2>
            <span className="text-xs text-white/30 ml-1">{likedSongs.length}</span>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {likedSongs.slice(0, 6).map((song) => (
              <SongCard key={song.id} song={song} allSongs={likedSongs} />
            ))}
          </motion.div>
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Trending Now</h2>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {FEATURED_SONGS.map((song) => (
            <SongCard key={song.id} song={song} allSongs={ALL_SONGS} />
          ))}
        </motion.div>
      </section>

      {/* Hindi */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Popular in Hindi</h2>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        >
          {HINDI_SONGS.map((song) => (
            <SongCard key={song.id} song={song} allSongs={ALL_SONGS} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
