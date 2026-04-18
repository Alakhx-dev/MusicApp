import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlayerStore } from '@/store/playerStore';

export type RoomPresenceRecord = {
  user_id: string;
  is_host: boolean;
  joined_at: string;
};

const DRIFT_THRESHOLD = 0.5; // Trigger a sync if drift > 500ms
const THROTTLE_MS = 300;     // Max broadcast frequency = ~3fps

export function useAudioSync(roomId: string | null, isHost: boolean, userId: string | null = null) {
  const lastBroadcast = useRef(0);
  const channelRef = useRef<any>(null);
  
  const [participants, setParticipants] = useState<RoomPresenceRecord[]>([]);

  const {
    currentSong,
    isPlaying,
    currentTime,
    setSong,
    setIsPlaying,
    setCurrentTime,
  } = usePlayerStore();

  // ─── Websocket Payload Broadcaster ───
  const broadcast = useCallback(async () => {
    if (!roomId || !isHost || !channelRef.current) return;
    const now = Date.now();
    
    // Throttle high-frequency updates to prevent flooding the socket
    if (now - lastBroadcast.current < THROTTLE_MS) return;
    lastBroadcast.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'sync',
      payload: {
        current_song: currentSong, // We broadcast the full song object so clients don't need to look it up
        is_playing: isPlaying,
        current_time: currentTime,
        timestamp: Date.now(),
      },
    });
    
    // Also backup to Postgres extremely rarely (every 5 seconds) just as a failsafe
    if (now % 5000 < THROTTLE_MS) {
       supabase.from('room_state').upsert({
         room_id: roomId,
         current_song_id: currentSong?.id || null,
         is_playing: isPlaying,
         current_time: currentTime,
         updated_at: new Date().toISOString(),
       }).then(); // fire and forget
    }

  }, [roomId, isHost, currentSong, isPlaying, currentTime]);

  // Host broadcasts state instantly whenever song or play state mutates
  useEffect(() => {
    if (isHost) broadcast();
  }, [isHost, currentSong?.id, isPlaying, broadcast]);

  // Host actively broadcasts the timeline every 1 second
  useEffect(() => {
    if (!isHost || !roomId) return;
    const interval = setInterval(broadcast, 1000);
    return () => clearInterval(interval);
  }, [isHost, roomId, broadcast]);

  // ─── Realtime Channel Setup ───
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { ack: true }, // Enable broadcast logic
        presence: { key: userId || 'anonymous' }
      }
    });
    
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: RoomPresenceRecord[] = [];
        for (const [key, presences] of Object.entries(state)) {
          if (presences.length > 0) {
             users.push(presences[0] as RoomPresenceRecord);
          }
        }
        setParticipants(users);
      })
      .on('broadcast', { event: 'sync' }, (payload: any) => {
        if (isHost) return; // Host ignores sync commands from others
        
        const data = payload.payload;
        if (!data) return;

        // 1. Sync the Track completely if it differs
        if (data.current_song && data.current_song.id !== currentSong?.id) {
          setSong(data.current_song);
        }

        // 2. Play/Pause state sync
        if (data.is_playing !== isPlaying) {
          setIsPlaying(data.is_playing);
        }

        // 3. Scrubbing/Time drift correction (> 500ms)
        // Add a tiny ping compensation factor to prevent stuttering
        const estimatedCurrentTime = data.current_time + (Date.now() - data.timestamp) / 1000;
        const drift = Math.abs(estimatedCurrentTime - currentTime);
        
        if (drift > DRIFT_THRESHOLD) {
          setCurrentTime(estimatedCurrentTime);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId || 'guest',
            is_host: isHost,
            joined_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, isHost, userId, currentSong?.id, isPlaying, currentTime, setSong, setIsPlaying, setCurrentTime]);

  return { broadcast, participants };
}
