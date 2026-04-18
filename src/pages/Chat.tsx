import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Message = {
  id: string;
  content: string;
  user_id: string;
  user_email?: string;
  created_at: string;
};

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // For demo, we use a fixed room. In real app, this is tied to a room.
  const DEMO_ROOM_ID = 'global-chat';

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages via realtime
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user) return;

    await supabase.from('messages').insert({
      room_id: DEMO_ROOM_ID,
      user_id: user.id,
      content: input.trim(),
    });
    setInput('');
  }

  return (
    <div className="flex flex-col h-full pb-20">
      <div className="p-6 pb-3">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-xs text-white/40 mt-1">Real-time messages with listeners</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <MessageSquare className="w-14 h-14 mb-3" />
            <p>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-primary/20 text-white border border-primary/20 rounded-br-md'
                    : 'bg-white/5 text-white/80 border border-white/5 rounded-bl-md'
                }`}
              >
                {!isMe && (
                  <p className="text-xs text-white/30 mb-1 font-medium">
                    {msg.user_email || msg.user_id.slice(0, 8)}
                  </p>
                )}
                <p>{msg.content}</p>
                <p className="text-[10px] text-white/20 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 px-6">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-primary hover:bg-primary/80 flex items-center justify-center transition-all disabled:opacity-30 shadow-neon"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
