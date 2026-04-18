import { motion, type Variants } from 'framer-motion';
import { Play } from 'lucide-react';
import { usePlayerStore, type Song } from '@/store/playerStore';

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function PremiumSongCard({ song, allSongs }: { song: Song; allSongs: Song[] }) {
  const setSong = usePlayerStore((s) => s.setSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isCurrent = currentSong?.id === song.id;

  return (
    <motion.div
      variants={item}
      onClick={() => { setSong(song); setQueue(allSongs); }}
      className="group premium-card cursor-pointer overflow-hidden relative aspect-[4/5] flex flex-col justify-end p-4 w-[160px] sm:w-[180px] md:w-[200px] flex-shrink-0 snap-start"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={song.thumbnail}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        {/* Deep gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
      </div>

      {/* Hover Play Button */}
      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
        <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center shadow-neon">
          <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
        </div>
      </div>
      
      {isCurrent && isPlaying && (
        <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
            <div className="flex items-end justify-center gap-[2px] h-3">
              <span className="w-[3px] bg-primary rounded-full animate-bounce h-[80%]" style={{ animationDelay: '0ms' }} />
              <span className="w-[3px] bg-primary rounded-full animate-bounce h-full" style={{ animationDelay: '150ms' }} />
              <span className="w-[3px] bg-primary rounded-full animate-bounce h-[60%]" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
      )}

      <div className="relative z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-base font-bold text-white truncate drop-shadow-md">{song.title}</p>
        <p className="text-sm text-white/60 truncate font-medium">{song.artist}</p>
      </div>
    </motion.div>
  );
}
