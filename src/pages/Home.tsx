import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Heart, History, Flame, Music2, PartyPopper, Disc3, Sparkles } from 'lucide-react';
import { usePlayerStore, type Song } from '@/store/playerStore';
import { useAuth } from '@/contexts/AuthContext';
import { getLikedSongs, getRecentlyPlayed } from '@/services/musicData';
import { HINDI_HITS, PUNJABI_VIBES, BHOJPURI_BEATS, SOUTH_MIX } from '@/lib/indianCuratedData';
import PremiumSongCard from '@/components/PremiumSongCard';
import LazySongRow from '@/components/LazySongRow';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

function HorizontalRecentCard({ song, songs, index }: { song: Song; songs: Song[]; index: number }) {
  const setSong = usePlayerStore((s) => s.setSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => { setSong(song); setQueue(songs); }}
      className="flex-shrink-0 w-64 glass-panel p-3 flex items-center gap-4 cursor-pointer group hover:bg-white/5 transition-colors overflow-hidden relative"
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative bg-white/5">
        <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-5 h-5 text-white filter drop-shadow-md" fill="currentColor" />
        </div>
      </div>
      <div className="flex-1 min-w-0 z-10">
        <p className="text-sm font-semibold text-white truncate drop-shadow-sm">{song.title}</p>
        <p className="text-xs text-white/50 truncate font-medium">{song.artist}</p>
      </div>
    </motion.div>
  );
}

// Reusable Static Row for curated content
function StaticSongRow({ title, songs, icon, iconBgColor, iconTextColor }: { title: string, songs: Song[], icon?: React.ReactNode, iconBgColor?: string, iconTextColor?: string }) {
  if (!songs || songs.length === 0) return null;
  return (
    <div className="mb-10 w-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2 rounded-xl ${iconBgColor} ${iconTextColor}`}>
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold tracking-tight text-white/90">{title}</h3>
        </div>
        <button className="text-xs font-semibold text-white/40 hover:text-white transition-colors">SEE ALL</button>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "100px" }}
        className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-2"
      >
        {songs.map((song) => (
          <PremiumSongCard key={song.id} song={song} allSongs={songs} />
        ))}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { user, isGuest } = useAuth();
  const userId = isGuest ? null : user?.id || null;
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (!userId && !isGuest) return;
    getLikedSongs(userId).then(setLikedSongs).catch(() => {});
    getRecentlyPlayed(userId).then(setRecentSongs).catch(() => {});
  }, [userId, isGuest]);

  return (
    <div className="p-8 pb-40 overflow-y-auto h-full space-y-16">
      
      {/* 1. For You Section */}
      <section>
        <h2 className="text-3xl font-black tracking-tight text-white mb-6 drop-shadow-md">For You</h2>
        
        {/* Recently Played */}
        {recentSongs.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white/90">Jump Back In</h3>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x px-2">
              {recentSongs.slice(0, 10).map((song, i) => (
                <div key={song.id} className="snap-start">
                    <HorizontalRecentCard song={song} songs={recentSongs} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liked Songs Quick Access */}
        <StaticSongRow 
          title="From Your Liked" 
          songs={likedSongs.slice(0, 15)} 
          icon={<Heart className="w-5 h-5" fill="currentColor" />} 
          iconBgColor="bg-rose-500/10" 
          iconTextColor="text-rose-400" 
        />
        
        <LazySongRow 
          title="Based on your taste" 
          query="new indian hits 2024" 
        />
      </section>

      {/* 2. Language Section */}
      <section>
        <h2 className="text-3xl font-black tracking-tight text-white mb-6 drop-shadow-md">Regional</h2>
        <StaticSongRow title="Hindi Hits" songs={HINDI_HITS} icon={<TrendingUp className="w-5 h-5" />} iconBgColor="bg-rose-500/10" iconTextColor="text-rose-500" />
        <StaticSongRow title="Punjabi Vibes" songs={PUNJABI_VIBES} icon={<Flame className="w-5 h-5" />} iconBgColor="bg-orange-500/10" iconTextColor="text-orange-500" />
        <StaticSongRow title="Bhojpuri Beats" songs={BHOJPURI_BEATS} icon={<PartyPopper className="w-5 h-5" />} iconBgColor="bg-green-500/10" iconTextColor="text-green-500" />
        <StaticSongRow title="South Mix" songs={SOUTH_MIX} icon={<Music2 className="w-5 h-5" />} iconBgColor="bg-blue-500/10" iconTextColor="text-blue-500" />
      </section>

      {/* 3. Mood Section */}
      <section>
        <h2 className="text-3xl font-black tracking-tight text-white mb-6 drop-shadow-md">Moods & Activities</h2>
        <LazySongRow title="Romantic Hits" query="Hindi romantic songs" icon={<Heart className="w-5 h-5" />} iconBgColor="bg-pink-500/10" iconTextColor="text-pink-400" />
        <LazySongRow title="Heartbreak & Sad" query="Sad hindi songs" />
        <LazySongRow title="Party Anthems" query="Bollywood party songs" />
        <LazySongRow title="Chill & Lo-Fi" query="Indian lofi chill tracks" />
        <LazySongRow title="Gym & Workout" query="Punjabi workout gym songs" />
      </section>

      {/* 4. Trending Section */}
      <section>
        <h2 className="text-3xl font-black tracking-tight text-white mb-6 drop-shadow-md">Trending</h2>
        <LazySongRow title="Top Indian Songs" query="Top 10 Indian songs this week" icon={<TrendingUp className="w-5 h-5" />} iconBgColor="bg-primary/10" iconTextColor="text-primary" />
        <LazySongRow title="Viral on Reels" query="Viral indian reels songs" />
      </section>

      {/* 5. Mix Section */}
      <section>
        <h2 className="text-3xl font-black tracking-tight text-white mb-6 drop-shadow-md">Mixes for You</h2>
        <LazySongRow title="Arijit Singh Mix" query="Arijit Singh Best Songs" icon={<Disc3 className="w-5 h-5" />} iconBgColor="bg-purple-500/10" iconTextColor="text-purple-400" />
        <LazySongRow title="Diljit Dosanjh Flow" query="Diljit Dosanjh top hits" />
        <LazySongRow title="Early 2000s Nostalgia" query="2000s Bollywood Hit Songs" />
      </section>

    </div>
  );
}
