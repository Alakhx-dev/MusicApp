import type { Song } from '@/store/playerStore';

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.fdn.fr',
  'https://inv.nadeko.net',
];

// ─── Search Query Enhancement ────────────────────────
function enhanceQuery(query: string): string {
  const q = query.toLowerCase().trim();
  
  // If user explicitly searched for english context, don't append hindi.
  if (q.includes('english') || q.includes('pop') || q.includes('hollywood') || q.includes('lofi')) {
    return `${query} official audio`;
  }
  
  // Don't double-append if user already typed these
  if (q.includes('hindi') || q.includes('punjabi') || q.includes('tamil') || q.includes('telugu') || q.includes('song')) {
    return `${query} official music video`;
  }
  
  // Automatically force it to be an Indian song
  return `${query} hindi song official music video`;
}

// ─── Exclusion Keywords ──────────────────────────────
const EXCLUDE_KEYWORDS = [
  'full album', 'mix', 'playlist', 'lofi', 'lo-fi', 'live',
  'concert', 'reaction', 'cover', 'remix', '8d audio', '8d',
  'slowed', 'reverb', 'slowed + reverb', 'karaoke', 'instrumental',
  'behind the scenes', 'making of', 'tutorial', 'lesson', 'how to',
  'mashup', 'unplugged', 'acoustic cover', 'parody', 'ringtone',
  'status video', 'whatsapp status', 'shorts', 'tiktok',
];

// ─── Quality Scoring ─────────────────────────────────
function scoreResult(title: string, channel: string, query: string): number {
  const t = title.toLowerCase();
  const c = channel.toLowerCase();
  const q = query.toLowerCase().replace('official music video', '').trim();
  let score = 0;

  // ── Exclusion check (heavy penalty) ──
  for (const kw of EXCLUDE_KEYWORDS) {
    if (t.includes(kw)) {
      score -= 10;
    }
  }

  // ── Official indicators ──
  if (t.includes('official music video')) score += 8;
  else if (t.includes('official video')) score += 7;
  else if (t.includes('official audio')) score += 6;
  else if (t.includes('official')) score += 5;

  // ── Indian Label & Channel supremacy ──
  if (c.includes('t-series')) score += 20;
  if (c.includes('zee music')) score += 18;
  if (c.includes('sony music india')) score += 18;
  if (c.includes('saregama') || c.includes('tips official')) score += 15;
  if (c.includes('speed records') || c.includes('desh')) score += 15;
  if (c.includes('vevo')) score += 6; // standard global bump

  // ── Indian Keywords ──
  if (t.includes('hindi') || t.includes('punjabi') || t.includes('bhojpuri') || t.includes('tamil') || t.includes('telugu')) {
    score += 10;
  }
  
  // ── English Penalty (unless specified) ──
  // If the query didn't specifically ask for english, penalize english generic titles that lack indian artists
  if (!query.toLowerCase().includes('english')) {
    if (t.match(/^[a-zA-Z0-9\s.,!?]+$/) && !c.match(/t-series|zee|sony|saregama/i)) {
      score -= 15; // heavy penalty for generic non-indian sounding videos
    }
  }

  // ── Title contains "song" or "video" ──
  if (t.includes('full song') || t.includes('full video')) score += 5;
  if (t.includes('song') && !t.includes('full album')) score += 3;
  if (t.includes('lyric') || t.includes('lyrics')) score += 2;

  // ── Artist/query match ──
  const queryWords = q.split(/\s+/).filter(w => w.length > 2);
  for (const word of queryWords) {
    if (t.includes(word)) score += 2;
    if (c.includes(word)) score += 3; // Artist channel match is strong
  }

  return score;
}

// ─── Check if result is "Official" ───────────────────
export function isOfficialResult(title: string, channel: string): boolean {
  const t = title.toLowerCase();
  const c = channel.toLowerCase();
  return (
    t.includes('official') ||
    c.includes('vevo') ||
    c.includes('t-series') ||
    c.includes('yrf') ||
    c.includes('zee music') ||
    c.includes('sony music india') ||
    c.includes('tips official') ||
    c.includes('saregama') ||
    c.includes('speed records') ||
    c.includes('records')
  );
}

// ─── Filter & Rank Results ───────────────────────────
function filterAndRank(results: Song[], query: string, limit = 10): Song[] {
  const scored = results
    .map((song) => ({
      song,
      score: scoreResult(song.title, song.artist, query),
    }))
    // Remove results with very negative scores (too many exclusion hits)
    .filter((s) => s.score > -5)
    // Sort by score descending
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.song);
}

// ─── Primary Search ──────────────────────────────────
export async function searchYouTube(query: string): Promise<Song[]> {
  const enhanced = enhanceQuery(query);

  // 1) YouTube Data API v3
  if (YT_API_KEY) {
    try {
      const results = await searchViaYouTubeAPI(enhanced);
      if (results.length > 0) return filterAndRank(results, query);
    } catch (err) {
      console.warn('YouTube API failed:', err);
    }
  }

  // 2) Invidious API (free)
  try {
    const results = await searchViaInvidious(enhanced);
    if (results.length > 0) return filterAndRank(results, query);
  } catch (err) {
    console.warn('Invidious failed:', err);
  }

  // 3) Curated fallback
  return filterAndRank(await fallbackSearch(query), query);
}

// ─── YouTube Data API v3 ─────────────────────────────
async function searchViaYouTubeAPI(query: string): Promise<Song[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    q: query,
    maxResults: '25', // Fetch extra so filtering has room
    key: YT_API_KEY,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const data = await res.json();

  return (data.items || [])
    .filter((item: any) => item.id?.videoId)
    .map((item: any) => ({
      id: item.id.videoId,
      title: decodeHTMLEntities(item.snippet.title),
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
      duration: 0,
    }));
}

// ─── Invidious API ───────────────────────────────────
async function searchViaInvidious(query: string): Promise<Song[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const params = new URLSearchParams({
        q: query,
        type: 'video',
        sort_by: 'relevance',
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${instance}/api/v1/search?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;

      const data = await res.json();
      return (data || [])
        .filter((item: any) => item.type === 'video' && item.videoId)
        .slice(0, 25)
        .map((item: any) => ({
          id: item.videoId,
          title: item.title || 'Unknown',
          artist: item.author || 'Unknown',
          thumbnail: item.videoThumbnails?.[3]?.url || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
          duration: item.lengthSeconds || 0,
        }));
    } catch {
      continue;
    }
  }
  return [];
}

function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// ─── Curated Fallback (40+ songs) ────────────────────
const SONG_POOL: Song[] = [
  { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up (Official Music Video)', artist: 'Rick Astley', thumbnail: '', duration: 213 },
  { id: 'kJQP7kiw5Fk', title: 'Despacito (Official Music Video)', artist: 'Luis Fonsi ft. Daddy Yankee', thumbnail: '', duration: 282 },
  { id: 'JGwWNGJdvx8', title: 'Shape of You (Official Music Video)', artist: 'Ed Sheeran', thumbnail: '', duration: 263 },
  { id: 'YQHsXMglC9A', title: 'Hello (Official Music Video)', artist: 'Adele', thumbnail: '', duration: 367 },
  { id: 'lTRiuFIWV54', title: 'Blinding Lights (Official Video)', artist: 'The Weeknd', thumbnail: '', duration: 202 },
  { id: 'nfWlot6h_JM', title: 'Shake It Off (Official Music Video)', artist: 'Taylor Swift', thumbnail: '', duration: 242 },
  { id: 'ZbZSe6N_BXs', title: 'Happy (Official Music Video)', artist: 'Pharrell Williams', thumbnail: '', duration: 233 },
  { id: 'ru0K8uYEZWw', title: "Can't Stop the Feeling (Official Video)", artist: 'Justin Timberlake', thumbnail: '', duration: 236 },
  { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody (Official Video)', artist: 'Queen', thumbnail: '', duration: 354 },
  { id: 'hLQl3WQQoQ0', title: 'Someone Like You (Official Music Video)', artist: 'Adele', thumbnail: '', duration: 285 },
  { id: 'RgKAFK5djSk', title: 'See You Again (Official Video)', artist: 'Wiz Khalifa ft. Charlie Puth', thumbnail: '', duration: 237 },
  { id: 'OPf0YbXqDm0', title: 'Uptown Funk (Official Video)', artist: 'Mark Ronson ft. Bruno Mars', thumbnail: '', duration: 270 },
  { id: 'CevxZvSJLk8', title: 'Roar (Official Music Video)', artist: 'Katy Perry', thumbnail: '', duration: 263 },
  { id: 'e-ORhEE9VVg', title: 'Baby Shark (Official Music Video)', artist: 'Pinkfong', thumbnail: '', duration: 136 },
  { id: '60ItHLz5WEA', title: 'Faded (Official Music Video)', artist: 'Alan Walker', thumbnail: '', duration: 212 },
  { id: 'IcrbM1l_BoI', title: 'Roses (Imanbek Remix - Official Video)', artist: 'SAINt JHN', thumbnail: '', duration: 177 },
  { id: '2zNSgSzhBfM', title: 'Lean On (Official Music Video)', artist: 'Major Lazer & DJ Snake', thumbnail: '', duration: 176 },
  { id: 'QYh6mYIJG2Y', title: 'Thinking Out Loud (Official Music Video)', artist: 'Ed Sheeran', thumbnail: '', duration: 281 },
  // Hindi / Bollywood
  { id: 'hoNb6HuNmU0', title: 'Tum Hi Ho - Official Full Song', artist: 'Arijit Singh — T-Series', thumbnail: '', duration: 261 },
  { id: 'cYOB941gyXI', title: 'Kesariya - Official Full Video', artist: 'Arijit Singh — T-Series', thumbnail: '', duration: 268 },
  { id: 'vGJTaP6anOU', title: 'Channa Mereya - Official Full Song Video', artist: 'Arijit Singh — T-Series', thumbnail: '', duration: 289 },
  { id: 'BddP6PYo2gs', title: 'Raataan Lambiyan - Official Video', artist: 'Jubin Nautiyal — T-Series', thumbnail: '', duration: 235 },
  { id: 'bo_efYhYU2A', title: 'Kal Ho Naa Ho - Official Full Song', artist: 'Sonu Nigam — Sony Music', thumbnail: '', duration: 326 },
  { id: 'AtBg0yA1EuM', title: 'Tere Bina - Official Video', artist: 'A.R. Rahman', thumbnail: '', duration: 305 },
  { id: 'DzUp26_hVao', title: 'Phir Le Aya Dil - Official Full Song', artist: 'Arijit Singh — YRF', thumbnail: '', duration: 309 },
  { id: 'G3sHE2sIXEg', title: 'Tera Ban Jaunga - Official Video', artist: 'Akhil Sachdeva — T-Series', thumbnail: '', duration: 234 },
  { id: 'elVFnos4BFo', title: 'Apna Bana Le - Official Full Song', artist: 'Arijit Singh — T-Series', thumbnail: '', duration: 265 },
  { id: 'i3dXPjli8Mw', title: 'Tujhe Kitna Chahein Aur - Official Video', artist: 'Jubin Nautiyal — T-Series', thumbnail: '', duration: 240 },
  { id: 'F6sNSJZTt9g', title: 'Tera Hone Laga Hoon - Official Full Song', artist: 'Atif Aslam — T-Series', thumbnail: '', duration: 284 },
  { id: 'WypJglxZ0ew', title: 'Kabira - Official Full Song', artist: 'Arijit Singh & Tochi Raina — YRF', thumbnail: '', duration: 234 },
  { id: 'v7AYKMP6rOE', title: 'Agar Tum Saath Ho - Official Full Song', artist: 'Arijit Singh & Alka Yagnik — T-Series', thumbnail: '', duration: 345 },
  { id: 'jHNNMj5bNQw', title: 'Bekhayali - Official Full Song', artist: 'Sachet Tandon — T-Series', thumbnail: '', duration: 367 },
  // Punjabi
  { id: 'mGkl3L22AHU', title: 'Excuses (Official Video)', artist: 'AP Dhillon', thumbnail: '', duration: 208 },
  { id: 'DG6VJe6L-90', title: 'Brown Munde (Official Video)', artist: 'AP Dhillon', thumbnail: '', duration: 233 },
  { id: 'NlBr0YpBnzg', title: 'Lover (Official Music Video)', artist: 'Diljit Dosanjh', thumbnail: '', duration: 207 },
  // Classical / Indie
  { id: 'hW0cGswfbcI', title: 'Kun Faya Kun - Official Full Song', artist: 'A.R. Rahman & Mohit Chauhan — T-Series', thumbnail: '', duration: 474 },
  { id: 'LKBt0MFHuDU', title: 'Ilahi - Official Full Song', artist: 'Arijit Singh — YRF', thumbnail: '', duration: 185 },
].map(s => ({ ...s, thumbnail: s.thumbnail || `https://img.youtube.com/vi/${s.id}/mqdefault.jpg` }));

async function fallbackSearch(query: string): Promise<Song[]> {
  await new Promise((r) => setTimeout(r, 250));
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored = SONG_POOL.map((song) => {
    const title = song.title.toLowerCase();
    const artist = song.artist.toLowerCase();
    let score = 0;

    if (title === q) score += 100;
    else if (title.startsWith(q)) score += 80;
    else if (title.includes(q)) score += 60;

    if (artist === q) score += 90;
    else if (artist.startsWith(q)) score += 70;
    else if (artist.includes(q)) score += 50;

    const words = q.split(/\s+/);
    for (const word of words) {
      if (word.length < 2) continue;
      if (title.includes(word)) score += 20;
      if (artist.includes(word)) score += 15;
    }
    return { song, score };
  });

  const matches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.song);

  if (matches.length === 0) {
    return [...SONG_POOL].sort(() => Math.random() - 0.5).slice(0, 10);
  }
  return matches.slice(0, 15);
}

// ─── Spelling Corrections ────────────────────────────
export function correctSpelling(query: string): string {
  const corrections: Record<string, string> = {
    'arjit': 'arijit singh',
    'arjit sing': 'arijit singh',
    'arjit singh': 'arijit singh',
    'kesria': 'kesariya',
    'tum he ho': 'tum hi ho',
    'channa merea': 'channa mereya',
    'senorita': 'señorita',
    'despacitoo': 'despacito',
    'adel': 'adele',
    'ed sheran': 'ed sheeran',
    'alan walkr': 'alan walker',
    'tayler swift': 'taylor swift',
    'ap dhilon': 'ap dhillon',
    'diljeet': 'diljit dosanjh',
    'juben': 'jubin nautiyal',
    'arjit sad': 'arijit singh sad songs',
    'arjit romantic': 'arijit singh romantic songs',
  };
  return corrections[query.toLowerCase()] || query;
}

export function getCuratedSongs(): Song[] {
  return SONG_POOL;
}
