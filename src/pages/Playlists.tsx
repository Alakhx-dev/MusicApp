import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ListMusic, Trash2, Music2, X, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStore, type Song } from '@/store/playerStore';
import UpgradePrompt from '@/components/UpgradePrompt';

type Playlist = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  songs: Song[];
};

export default function Playlists() {
  const { user, isGuest } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const setSong = usePlayerStore((s) => s.setSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  // Guest gate
  if (isGuest) {
    return (
      <div className="p-6 pb-28 overflow-y-auto h-full flex flex-col items-center justify-center">
        <div className="glass-panel p-8 max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Playlists Locked</h2>
          <p className="text-sm text-white/50 mb-6">Sign in to create and manage your playlists.</p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl transition-all shadow-neon"
          >
            Sign In to Unlock
          </button>
        </div>
        <UpgradePrompt isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} feature="Playlists" />
      </div>
    );
  }

  // Fetch playlists
  useEffect(() => {
    if (!user) return;
    fetchPlaylists();
  }, [user]);

  async function fetchPlaylists() {
    const { data: pls } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (pls) {
      const enriched: Playlist[] = [];
      for (const pl of pls) {
        const { data: songs } = await supabase
          .from('playlist_songs')
          .select('*')
          .eq('playlist_id', pl.id)
          .order('added_at');
        enriched.push({
          ...pl,
          songs: (songs || []).map((s: any) => ({
            id: s.song_id,
            title: s.title,
            artist: s.artist || 'Unknown',
            thumbnail: s.thumbnail_url || '',
            duration: s.duration_sec || 0,
          })),
        });
      }
      setPlaylists(enriched);
    }
  }

  async function createPlaylist() {
    if (!newTitle.trim() || !user) return;
    await supabase.from('playlists').insert({
      user_id: user.id,
      title: newTitle,
      description: newDesc,
    });
    setNewTitle('');
    setNewDesc('');
    setShowCreate(false);
    fetchPlaylists();
  }

  async function deletePlaylist(id: string) {
    await supabase.from('playlists').delete().eq('id', id);
    if (selected?.id === id) setSelected(null);
    fetchPlaylists();
  }

  async function removeSong(playlistId: string, songId: string) {
    await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);
    fetchPlaylists();
  }

  return (
    <div className="p-6 pb-28 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Your Playlists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="glass-button px-4 py-2 flex items-center gap-2 text-sm text-primary"
        >
          <Plus className="w-4 h-4" /> New Playlist
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create Playlist</h2>
                <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Playlist name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 mb-3"
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 mb-4"
              />
              <button
                onClick={createPlaylist}
                className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl transition-all shadow-neon"
              >
                Create
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Grid */}
      {playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/20">
          <ListMusic className="w-16 h-16 mb-4" />
          <p className="text-lg">No playlists yet</p>
          <p className="text-sm mt-1">Create your first playlist above</p>
        </div>
      )}

      {!selected && playlists.length > 0 && (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <motion.div
              key={pl.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(pl)}
              className="glass-panel p-4 cursor-pointer group"
            >
              <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-3">
                <Music2 className="w-10 h-10 text-white/30" />
              </div>
              <p className="text-sm font-medium text-white truncate">{pl.title}</p>
              <p className="text-xs text-white/40">{pl.songs.length} songs</p>
              <button
                onClick={(e) => { e.stopPropagation(); deletePlaylist(pl.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Selected Playlist Detail */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => setSelected(null)}
            className="text-white/40 hover:text-white text-sm mb-4 flex items-center gap-1"
          >
            ← Back to playlists
          </button>
          <h2 className="text-xl font-bold mb-1">{selected.title}</h2>
          <p className="text-white/40 text-sm mb-6">{selected.description || 'Your playlist'}</p>

          {selected.songs.length === 0 && (
            <p className="text-white/20 text-center py-12">No songs yet. Search and add songs to this playlist.</p>
          )}

          <div className="space-y-2">
            {selected.songs.map((song) => (
              <div
                key={song.id}
                onClick={() => { setSong(song); setQueue(selected.songs); }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <img src={song.thumbnail} alt={song.title} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{song.title}</p>
                  <p className="text-xs text-white/40">{song.artist}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeSong(selected.id, song.id); }}
                  className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
