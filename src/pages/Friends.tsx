import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, X, Users, Music2, Radio, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import UpgradePrompt from '@/components/UpgradePrompt';

type Friend = {
  id: string;
  friendId: string;
  email: string;
  status: 'pending' | 'accepted' | 'blocked';
  isIncoming: boolean;
};

export default function Friends() {
  const { user, isGuest } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Guest gate
  if (isGuest) {
    return (
      <div className="p-6 pb-28 overflow-y-auto h-full flex flex-col items-center justify-center">
        <div className="glass-panel p-8 max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Friends Locked</h2>
          <p className="text-sm text-white/50 mb-6">Sign in to add friends and see their activity.</p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl transition-all shadow-neon"
          >
            Sign In to Unlock
          </button>
        </div>
        <UpgradePrompt isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} feature="Friends" />
      </div>
    );
  }

  useEffect(() => {
    if (!user) return;
    fetchFriends();
  }, [user]);

  async function fetchFriends() {
    if (!user) return;
    const { data: sent } = await supabase
      .from('friends')
      .select('*, friend:profiles!friends_friend_id_fkey(email)')
      .eq('user_id', user.id);

    const { data: received } = await supabase
      .from('friends')
      .select('*, user:profiles!friends_user_id_fkey(email)')
      .eq('friend_id', user.id);

    const list: Friend[] = [];
    (sent || []).forEach((r: any) => {
      list.push({ id: r.id, friendId: r.friend_id, email: r.friend?.email || '', status: r.status, isIncoming: false });
    });
    (received || []).forEach((r: any) => {
      list.push({ id: r.id, friendId: r.user_id, email: r.user?.email || '', status: r.status, isIncoming: true });
    });
    setFriends(list);
  }

  async function sendRequest() {
    if (!friendEmail.trim() || !user) return;
    // Look up user by email
    const { data: target } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', friendEmail)
      .single();

    if (!target) {
      setMessage('User not found');
      return;
    }

    const { error } = await supabase.from('friends').insert({
      user_id: user.id,
      friend_id: target.id,
      status: 'pending',
    });

    if (error) setMessage(error.message);
    else {
      setMessage('Request sent!');
      setFriendEmail('');
      fetchFriends();
    }
  }

  async function acceptRequest(id: string) {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', id);
    fetchFriends();
  }

  async function rejectRequest(id: string) {
    await supabase.from('friends').delete().eq('id', id);
    fetchFriends();
  }

  const pending = friends.filter((f) => f.status === 'pending' && f.isIncoming);
  const accepted = friends.filter((f) => f.status === 'accepted');

  return (
    <div className="p-6 pb-28 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      {/* Add Friend */}
      <div className="glass-panel p-4 mb-6 max-w-lg">
        <div className="flex gap-2">
          <input
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            placeholder="Enter friend's email"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={sendRequest}
            className="glass-button px-4 py-2 text-primary flex items-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" /> Add
          </button>
        </div>
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-primary mt-2"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Pending Requests</h2>
          <div className="space-y-2">
            {pending.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between glass-panel p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold">
                    {f.email[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-white/80">{f.email}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(f.id)} className="text-green-400 hover:text-green-300">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => rejectRequest(f.id)} className="text-red-400 hover:text-red-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Accepted Friends */}
      <section>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Your Friends</h2>
        {accepted.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <Users className="w-14 h-14 mx-auto mb-3" />
            <p>No friends yet — add someone above!</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accepted.map((f) => (
            <motion.div
              key={f.id}
              whileHover={{ scale: 1.02 }}
              className="glass-panel p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-sm font-bold">
                {f.email[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{f.email}</p>
                <p className="text-xs text-green-400/70 flex items-center gap-1">
                  <Music2 className="w-3 h-3" /> Online
                </p>
              </div>
              <button className="glass-button px-3 py-1.5 text-xs text-primary flex items-center gap-1">
                <Radio className="w-3 h-3" /> Join
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
