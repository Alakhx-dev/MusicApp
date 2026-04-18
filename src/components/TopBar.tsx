import { SearchIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStore } from '@/store/playerStore';
import { useNavigate } from 'react-router-dom';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TopBar() {
  const { user, isGuest, guestName } = useAuth();
  const { searchQuery, setSearchQuery } = usePlayerStore();
  const navigate = useNavigate();

  const handleSearchFocus = () => {
    navigate('/search');
  };

  const displayName = isGuest ? guestName : user?.email?.split('@')[0] || 'User';
  const displayInitial = isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U');

  return (
    <div className="w-full h-20 px-6 flex items-center justify-between glass-panel !rounded-none !border-x-0 !border-t-0 z-40 sticky top-0 bg-background/40">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-white/40 font-medium tracking-wide uppercase">{getGreeting()}</p>
          <p className="text-sm font-semibold text-white/90">{displayName}</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl mx-8 relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search for songs, artists, or genres..."
          value={searchQuery}
          onFocus={handleSearchFocus}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 bg-white/5 border border-white/10 rounded-full py-2 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all text-sm"
        />
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-neon font-bold text-sm">
          {displayInitial}
        </div>
      </div>
    </div>
  );
}
