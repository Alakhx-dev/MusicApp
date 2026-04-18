import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Plus, Users, Crown, X, Play, Copy, Check, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioSync } from '@/hooks/useAudioSync';
import { usePlayerStore } from '@/store/playerStore';
import UpgradePrompt from '@/components/UpgradePrompt';

type Room = {
  id: string;
  name: string;
  host_id: string;
  is_public: boolean;
};

export default function Rooms() {
  const { user, isGuest } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const currentSong = usePlayerStore((s) => s.currentSong);

  const isHost = joinedRoom?.host_id === user?.id;
  useAudioSync(joinedRoom?.id || null, isHost);

  // Guest gate
  if (isGuest) {
    return (
      <div className="p-6 pb-28 overflow-y-auto h-full flex flex-col items-center justify-center">
        <div className="glass-panel p-8 max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Rooms Locked</h2>
          <p className="text-sm text-white/50 mb-6">Sign in to create and join listening rooms.</p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl transition-all shadow-neon"
          >
            Sign In to Unlock
          </button>
        </div>
        <UpgradePrompt isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} feature="Listening Rooms" />
      </div>
    );
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    if (data) setRooms(data);
  }

  async function createRoom() {
    if (!newName.trim() || !user) return;
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: newName, host_id: user.id })
      .select()
      .single();

    if (!error && data) {
      // Create initial room state
      await supabase.from('room_state').insert({
        room_id: data.id,
        current_song_id: currentSong?.id || null,
        is_playing: false,
        current_time: 0,
      });
      setJoinedRoom(data);
      setNewName('');
      setShowCreate(false);
      fetchRooms();
    }
  }

  function copyRoomLink(roomId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Room Detail View
  if (joinedRoom) {
    return (
      <div className="p-6 pb-28 overflow-y-auto h-full">
        <button
          onClick={() => setJoinedRoom(null)}
          className="text-white/40 hover:text-white text-sm mb-4 flex items-center gap-1"
        >
          ← Leave Room
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{joinedRoom.name}</h2>
              <p className="text-xs text-white/40 flex items-center gap-1">
                {isHost && <Crown className="w-3 h-3 text-yellow-400" />}
                {isHost ? 'You are the host' : 'Listening along'}
              </p>
            </div>
          </div>

          {/* Now Playing */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Now Playing</p>
            {currentSong ? (
              <div className="flex items-center gap-3">
                <img src={currentSong.thumbnail} alt="" className="w-12 h-12 rounded-lg" />
                <div>
                  <p className="text-sm font-medium">{currentSong.title}</p>
                  <p className="text-xs text-white/40">{currentSong.artist}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/30 flex items-center gap-2">
                <Play className="w-4 h-4" /> No song playing
              </p>
            )}
          </div>

          {/* Share */}
          <button
            onClick={() => copyRoomLink(joinedRoom.id)}
            className="w-full glass-button py-2.5 flex items-center justify-center gap-2 text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Room Link'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-28 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Listening Rooms</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="glass-button px-4 py-2 flex items-center gap-2 text-sm text-primary"
        >
          <Plus className="w-4 h-4" /> Create Room
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
                <h2 className="text-lg font-semibold">Create Room</h2>
                <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Room name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 mb-4"
              />
              <button
                onClick={createRoom}
                className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl transition-all shadow-neon"
              >
                Create & Join
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room List */}
      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/20">
          <Radio className="w-16 h-16 mb-4" />
          <p className="text-lg">No rooms available</p>
          <p className="text-sm mt-1">Create a room and invite friends</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ scale: 1.02 }}
            className="glass-panel p-4 cursor-pointer"
            onClick={() => setJoinedRoom(room)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{room.name}</p>
                <p className="text-xs text-white/40 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Public
                </p>
              </div>
            </div>
            <button className="w-full glass-button py-2 text-xs text-primary">Join Room</button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
