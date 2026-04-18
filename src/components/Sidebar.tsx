import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Search, ListMusic, Users, Radio, MessageSquare, Sparkles, LogOut, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/rooms', icon: Radio, label: 'Rooms' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/ai', icon: Sparkles, label: 'AI DJ' },
];

export default function Sidebar() {
  const { signOut, user, isGuest, guestName } = useAuth();

  const displayName = isGuest ? guestName : user?.email;
  const displayInitial = isGuest ? 'G' : (user?.email?.[0]?.toUpperCase() || 'U');

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className="w-[240px] h-full flex-shrink-0 glass-panel rounded-none border-r border-white/5 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold neon-text tracking-tight">Sur.</h1>
        <p className="text-[11px] text-white/30 mt-0.5">Music, elevated</p>
      </div>

      {/* Guest Mode Badge */}
      {isGuest && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium text-purple-300">Guest Mode</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_20px_rgba(225,29,72,0.05)]"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
            isGuest
              ? "bg-gradient-to-br from-purple-400 to-indigo-500"
              : "bg-gradient-to-br from-primary to-purple-500"
          )}>
            {displayInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/80 truncate">{displayName}</p>
            {isGuest && <p className="text-[10px] text-purple-400/60">Limited access</p>}
          </div>
          <button
            onClick={signOut}
            className="text-white/30 hover:text-primary transition-colors"
            title={isGuest ? 'Exit guest mode' : 'Sign out'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
