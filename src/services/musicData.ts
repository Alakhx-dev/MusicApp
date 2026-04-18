import { supabase } from '@/lib/supabase';
import type { Song } from '@/store/playerStore';

const LIKED_KEY = 'sur_liked_songs';
const RECENT_KEY = 'sur_recently_played';
const MAX_RECENT = 20;

// ════════════════════════════════════════════════════════
//  LIKED SONGS
// ════════════════════════════════════════════════════════

/** Get liked songs — Supabase for auth users, localStorage for guests */
export async function getLikedSongs(userId: string | null): Promise<Song[]> {
  if (!userId) return getGuestLiked();

  const { data } = await supabase
    .from('liked_songs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []).map(rowToSong);
}

/** Like a song */
export async function likeSong(userId: string | null, song: Song): Promise<void> {
  if (!userId) { guestLike(song); return; }

  await supabase.from('liked_songs').upsert({
    user_id: userId,
    song_id: song.id,
    title: song.title,
    artist: song.artist,
    thumbnail_url: song.thumbnail,
    duration_sec: song.duration,
  }, { onConflict: 'user_id,song_id' });
}

/** Unlike a song */
export async function unlikeSong(userId: string | null, songId: string): Promise<void> {
  if (!userId) { guestUnlike(songId); return; }

  await supabase
    .from('liked_songs')
    .delete()
    .eq('user_id', userId)
    .eq('song_id', songId);
}

/** Check if a song is liked */
export async function isSongLiked(userId: string | null, songId: string): Promise<boolean> {
  if (!userId) return isGuestLiked(songId);

  const { data } = await supabase
    .from('liked_songs')
    .select('id')
    .eq('user_id', userId)
    .eq('song_id', songId)
    .maybeSingle();
  return !!data;
}

// ════════════════════════════════════════════════════════
//  RECENTLY PLAYED
// ════════════════════════════════════════════════════════

/** Get recently played songs */
export async function getRecentlyPlayed(userId: string | null, limit = 20): Promise<Song[]> {
  if (!userId) return getGuestRecent(limit);

  const { data } = await supabase
    .from('recently_played')
    .select('*')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit);

  return (data || []).map(rowToSong);
}

/** Track a song as recently played */
export async function trackRecentlyPlayed(userId: string | null, song: Song): Promise<void> {
  if (!userId) { guestTrackRecent(song); return; }

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

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════

function rowToSong(row: any): Song {
  return {
    id: row.song_id,
    title: row.title,
    artist: row.artist || 'Unknown',
    thumbnail: row.thumbnail_url || `https://img.youtube.com/vi/${row.song_id}/mqdefault.jpg`,
    duration: row.duration_sec || 0,
  };
}

// ════════════════════════════════════════════════════════
//  GUEST (localStorage) IMPLEMENTATIONS
// ════════════════════════════════════════════════════════

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or disabled
  }
}

// ─── Guest Liked ─────────────────────────
function getGuestLiked(): Song[] {
  return readStorage<Song[]>(LIKED_KEY, []);
}

function guestLike(song: Song): void {
  const liked = getGuestLiked().filter((s) => s.id !== song.id);
  liked.unshift(song); // newest first
  writeStorage(LIKED_KEY, liked);
}

function guestUnlike(songId: string): void {
  const liked = getGuestLiked().filter((s) => s.id !== songId);
  writeStorage(LIKED_KEY, liked);
}

function isGuestLiked(songId: string): boolean {
  return getGuestLiked().some((s) => s.id === songId);
}

// ─── Guest Recent ────────────────────────
function getGuestRecent(limit: number): Song[] {
  return readStorage<Song[]>(RECENT_KEY, []).slice(0, limit);
}

function guestTrackRecent(song: Song): void {
  const recent = readStorage<Song[]>(RECENT_KEY, []).filter((s) => s.id !== song.id);
  recent.unshift(song); // newest first, remove dupes
  writeStorage(RECENT_KEY, recent.slice(0, MAX_RECENT));
}
