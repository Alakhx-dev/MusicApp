import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { searchYouTube } from '@/services/youtube';
import type { Song } from '@/store/playerStore';
import PremiumSongCard from './PremiumSongCard';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

interface LazySongRowProps {
  title: string;
  query: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
}

export default function LazySongRow({ title, query, icon, iconBgColor = 'bg-white/10', iconTextColor = 'text-white' }: LazySongRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '200px' });
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    let isMounted = true;
    
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        const results = await searchYouTube(query);
        if (isMounted) {
          setSongs(results);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Failed to load row: ${title}`, err);
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    fetchSongs();

    return () => {
      isMounted = false;
    };
  }, [isInView, query, title]);

  if (hasError && songs.length === 0) {
    return null; // hide the entire row if it utterly fails to load to keep the UI clean
  }

  return (
    <div ref={ref} className="mb-10 w-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2 rounded-xl ${iconBgColor} ${iconTextColor}`}>
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold tracking-tight text-white/90">{title}</h3>
        </div>
        {!isLoading && songs.length > 0 && (
          <button className="text-xs font-semibold text-white/40 hover:text-white transition-colors">SEE ALL</button>
        )}
      </div>

      <div className="relative">
        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-2"
        >
          {isLoading ? (
            // Skeletons
            Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={`skel-${i}`} 
                className="w-[160px] sm:w-[180px] md:w-[200px] flex-shrink-0 aspect-[4/5] rounded-2xl bg-white/5 animate-pulse border border-white/5"
              />
            ))
          ) : (
            // Cards
            songs.map((song) => (
              <PremiumSongCard key={song.id} song={song} allSongs={songs} />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
