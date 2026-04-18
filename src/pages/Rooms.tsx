import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Plus, Users, Crown, X, Play, Copy, Check, Lock, Send, LogOut, Disc3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioSync, type RoomPresenceRecord } from '@/hooks/useAudioSync';
import { usePlayerStore } from '@/store/playerStore';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Room = {
  id: string;
  name: string;
  host_id: string;
  is_public: boolean;
};

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
};

export default function Rooms() {
  const { id: urlRoomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  
  const [joinedRoom, setJoinedRoom] = useState<Room | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const isHost = joinedRoom?.host_id === user?.id;
  const { participants } = useAudioSync(joinedRoom?.id || null, isHost, user?.id);

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

  // Handle URL Direct Join
  useEffect(() => {
    if (urlRoomId && !joinedRoom) {
      supabase.from('rooms').select('*').eq('id', urlRoomId).single().then(({ data }) => {
        if (data) setJoinedRoom(data);
        else navigate('/rooms', { replace: true });
      });
    }
  }, [urlRoomId, joinedRoom, navigate]);

  // Fetch Available Rooms
  useEffect(() => {
    if (!joinedRoom) {
      fetchRooms();
    }
  }, [joinedRoom]);

  // Realtime Chat Subscription
  useEffect(() => {
    if (!joinedRoom) return;

    const fetchInitialMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`*, profiles(username, avatar_url)`)
        .eq('room_id', joinedRoom.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data as Message[]);
    };

    fetchInitialMessages();

    const channel = supabase
      .channel(`chat_${joinedRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${joinedRoom.id}` }, async (payload) => {
        // Fetch profile data for the new message
        const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.user_id).single();
        const fullMessage = { ...payload.new, profiles: data } as Message;
        setMessages((prev) => [...prev, fullMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [joinedRoom]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      await supabase.from('room_state').insert({
        room_id: data.id,
        current_song_id: currentSong?.id || null,
        is_playing: false,
        current_time: 0,
      });
      navigate(`/room/${data.id}`);
      setNewName('');
      setShowCreate(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !joinedRoom || !user) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    
    await supabase.from('messages').insert({
      room_id: joinedRoom.id,
      user_id: user.id,
      content,
    });
  }

  function copyRoomLink(roomId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── ROOM DETAIL UI ───
  if (joinedRoom) {
    return (
      <div className="h-full flex flex-col pt-8 px-6 pb-28 max-w-[1400px] mx-auto overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg">
              <Radio className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white">{joinedRoom.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-semibold text-white/50 flex items-center gap-1">
                  {isHost && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                  {isHost ? 'You are Hosting' : 'Listening Along'}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {participants.length || 1} online
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button
              onClick={() => copyRoomLink(joinedRoom.id)}
              className="glass-button px-4 py-2 flex items-center gap-2 text-sm text-white/80 hover:text-white"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Invite'}
            </button>
            <button
              onClick={() => navigate('/rooms')}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Leave
            </button>
          </div>
        </div>

        {/* Main Interface */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 pb-4">
          
          {/* Left Side: Cinematic Player Display */}
          <div className="flex-1 glass-panel rounded-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden group">
             {/* Dynamic Backdrop */}
             {currentSong && (
                <div 
                  className={cn(
                    "absolute inset-0 bg-cover bg-center blur-[100px] opacity-20 scale-150 transition-opacity duration-1000",
                    isPlaying ? "opacity-40" : "opacity-10"
                  )} 
                  style={{ backgroundImage: `url(${currentSong.thumbnail})` }} 
                />
             )}
             
             <div className="relative z-10 flex flex-col items-center text-center">
                {currentSong ? (
                  <>
                    <motion.div 
                      key={currentSong.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "w-64 h-64 md:w-80 md:h-80 rounded-2xl shadow-2xl mb-8 overflow-hidden border border-white/10 transition-transform duration-1000",
                        isPlaying ? "scale-105" : "scale-100"
                      )}
                    >
                      <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover" />
                    </motion.div>
                    
                    <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg mb-2 line-clamp-1">{currentSong.title}</h2>
                    <p className="text-lg text-white/60 font-medium">{currentSong.artist}</p>
                    
                    {/* Synchronized Label */}
                    <div className="mt-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", isPlaying ? "bg-green-500 animate-pulse" : "bg-white/30")} />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                         {isPlaying ? 'Live Streaming' : 'Paused by Host'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-white/30">
                     <Disc3 className="w-32 h-32 mb-6 animate-pulse" />
                     <h2 className="text-2xl font-bold">Waiting for Host...</h2>
                     <p className="text-sm">The DJ hasn't queued a song yet</p>
                  </div>
                )}
             </div>
          </div>

          {/* Right Side: Chat Module */}
          <div className="w-full md:w-[400px] glass-panel rounded-3xl flex flex-col overflow-hidden border border-white/10 bg-black/40 xl:bg-white/5">
             <div className="px-5 py-4 border-b border-white/10 bg-white/5">
               <h3 className="font-bold text-white tracking-wide">Live Chat</h3>
             </div>
             
             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
                    <Radio className="w-8 h-8" />
                    <p className="text-sm font-medium">Say hello to the room!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.user_id === user?.id;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id} 
                        className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                      >
                         <div className="flex items-end gap-2 max-w-[85%]">
                            {!isMe && (
                               msg.profiles?.avatar_url ? (
                                 <img src={msg.profiles.avatar_url} className="w-6 h-6 rounded-full flex-shrink-0 object-cover" />
                               ) : (
                                 <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                                   {msg.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                 </div>
                               )
                            )}
                            
                            <div>
                               {!isMe && <span className="text-[10px] text-white/40 ml-1 mb-1 block">{msg.profiles?.username}</span>}
                               <div className={cn(
                                 "px-3 py-2 rounded-2xl text-sm leading-snug",
                                 isMe 
                                  ? "bg-primary text-white rounded-br-sm" 
                                  : "bg-white/10 text-white/90 rounded-bl-sm border border-white/5"
                               )}>
                                 {msg.content}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
             </div>

             {/* Input Area */}
             <form onSubmit={handleSendMessage} className="p-3 bg-black/20 border-t border-white/10 flex items-center gap-2">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Chat in room..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform shadow-neon"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
             </form>
          </div>
          
        </div>
      </div>
    );
  }

  // ─── ROOMS LIST (Not Joined) ───
  return (
    <div className="p-6 pb-28 overflow-y-auto h-full max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white drop-shadow-md mb-1">Live Rooms</h1>
          <p className="text-white/50 text-sm font-medium">Join friends and listen securely in real-time.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary hover:bg-primary/80 transition-colors px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold text-white shadow-[0_4px_15px_rgba(225,29,72,0.4)]"
        >
          <Plus className="w-5 h-5" /> Create Room
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 w-full max-w-md border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Start a Room</h2>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name your party... (e.g. Lofi Chill)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 mb-6 font-medium"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createRoom()}
              />
              <button
                onClick={createRoom}
                disabled={!newName.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl transition-all shadow-neon font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create & Join
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-white/20 glass-panel border border-white/5 rounded-3xl mt-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
             <Radio className="w-10 h-10" />
          </div>
          <p className="text-2xl font-bold text-white/40">No public rooms</p>
          <p className="text-sm text-white/30 mt-2 font-medium">Be the first to start a listening party</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ scale: 1.02 }}
            className="group glass-panel p-5 cursor-pointer relative overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
            onClick={() => navigate(`/room/${room.id}`)}
          >
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full blur-[40px] group-hover:bg-primary/20 transition-colors" />
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-cyan-500 flex flex-col items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">{room.name}</p>
                <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Now
                </p>
              </div>
            </div>
            
            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors relative z-10">
              Join Room
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
