import { supabase } from '@/lib/supabase';
import type { Song } from '@/store/playerStore';

// ==================== LIKED SONGS ====================

export async function getLikedSongs(userId: string): Promise<Song[]> {
  const { data } = await supabase
    .from('liked_songs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []).map((row: any) => ({
    id: row.song_id,
    title: row.title,
    artist: row.artist || 'Unknown',
    thumbnail: row.thumbnail_url || `https://img.youtube.com/vi/${row.song_id}/mqdefault.jpg`,
    duration: row.duration_sec || 0,
  }));
}

export async function likeSong(userId: string, song: Song): Promise<void> {
  await supabase.from('liked_songs').upsert({
    user_id: userId,
    song_id: song.id,
    title: song.title,
    artist: song.artist,
    thumbnail_url: song.thumbnail,
    duration_sec: song.duration,
  }, { onConflict: 'user_id,song_id' });
}

export async function unlikeSong(userId: string, songId: string): Promise<void> {
  await supabase
    .from('liked_songs')
    .delete()
    .eq('user_id', userId)
    .eq('song_id', songId);
}

export async function isSongLiked(userId: string, songId: string): Promise<boolean> {
  const { data } = await supabase
    .from('liked_songs')
    .select('id')
    .eq('user_id', userId)
    .eq('song_id', songId)
    .maybeSingle();
  return !!data;
}

// ==================== RECENTLY PLAYED ====================

export async function getRecentlyPlayed(userId: string, limit = 10): Promise<Song[]> {
  const { data } = await supabase
    .from('recently_played')
    .select('*')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit);

  return (data || []).map((row: any) => ({
    id: row.song_id,
    title: row.title,
    artist: row.artist || 'Unknown',
    thumbnail: row.thumbnail_url || `https://img.youtube.com/vi/${row.song_id}/mqdefault.jpg`,
    duration: row.duration_sec || 0,
  }));
}

export async function trackRecentlyPlayed(userId: string, song: Song): Promise<void> {
  await supabase.from('recently_played').upsert({
    user_id: userId,
    song_id: song.id,
    title: song.title,
    artist: song.artist,
    thumbnail_url: song.thumbnail,
    duration_sec: song.duration,
    played_at: new Date().toISOString(),
  }, { onConflict: 'user_id,song_id' });
}
