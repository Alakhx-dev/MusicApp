import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlayerStore } from '@/store/playerStore';

type RoomState = {
  current_song_id: string | null;
  is_playing: boolean;
  current_time: number;
};

const DRIFT_THRESHOLD = 2; // seconds
const THROTTLE_MS = 1000;

export function useAudioSync(roomId: string | null, isHost: boolean) {
  const lastBroadcast = useRef(0);
  const {
    currentSong,
    isPlaying,
    currentTime,
    setSong,
    setIsPlaying,
    setCurrentTime,
  } = usePlayerStore();

  // Broadcast state as host
  const broadcast = useCallback(async () => {
    if (!roomId || !isHost) return;
    const now = Date.now();
    if (now - lastBroadcast.current < THROTTLE_MS) return;
    lastBroadcast.current = now;

    await supabase.from('room_state').upsert({
      room_id: roomId,
      current_song_id: currentSong?.id || null,
      is_playing: isPlaying,
      current_time: currentTime,
      updated_at: new Date().toISOString(),
    });
  }, [roomId, isHost, currentSong?.id, isPlaying, currentTime]);

  // Host broadcasts on changes
  useEffect(() => {
    if (isHost) broadcast();
  }, [isHost, currentSong?.id, isPlaying, broadcast]);

  // Host broadcasts time periodically
  useEffect(() => {
    if (!isHost || !roomId) return;
    const interval = setInterval(broadcast, 2000);
    return () => clearInterval(interval);
  }, [isHost, roomId, broadcast]);

  // Listener subscribes to realtime changes
  useEffect(() => {
    if (!roomId || isHost) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_state',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          const state: RoomState = payload.new;
          if (!state) return;

          // Sync song
          if (state.current_song_id && state.current_song_id !== currentSong?.id) {
            setSong({
              id: state.current_song_id,
              title: 'Synced Song',
              artist: 'Room',
              thumbnail: `https://img.youtube.com/vi/${state.current_song_id}/mqdefault.jpg`,
              duration: 0,
            });
          }

          // Sync play state
          if (state.is_playing !== isPlaying) {
            setIsPlaying(state.is_playing);
          }

          // Drift correction
          const drift = Math.abs(state.current_time - currentTime);
          if (drift > DRIFT_THRESHOLD) {
            setCurrentTime(state.current_time);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost]);

  return { broadcast };
}
