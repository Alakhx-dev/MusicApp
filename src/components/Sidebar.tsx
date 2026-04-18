import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Search, Heart, ListMusic, Users, Radio, MessageSquare, Sparkles, LogOut, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/liked', icon: Heart, label: 'Liked Songs' },
  { to: '/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/rooms', icon: Radio, label: 'Rooms' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/ai', icon: Sparkles, label: 'AI DJ' },
];

export default function Sidebar() {
  const { isGuest } = useAuth();

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className="w-[240px] h-full flex-shrink-0 glass-panel !rounded-none !border-y-0 !border-l-0 border-r border-white/5 flex flex-col z-50 bg-background/50"
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
                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-white shadow-[0_0_20px_rgba(225,29,72,0.1)] border border-primary/20"
                  : "text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn(
                  "w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-primary filter drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]" : ""
                )} />
                <span className="tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
}
