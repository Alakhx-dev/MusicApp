import { create } from 'zustand';

export type Song = {
  id: string;          // YouTube video ID
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;    // seconds
};

type PlayerState = {
  // Playback
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;

  // Search
  searchResults: Song[];
  searchQuery: string;
  isSearching: boolean;

  // Playback Actions
  setSong: (song: Song) => void;
  playSongFromResults: (song: Song) => void;
  setQueue: (songs: Song[]) => void;
  addToQueue: (song: Song) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Search Actions
  setSearchResults: (results: Song[]) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
  clearSearch: () => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  isMuted: false,
  isLoading: false,
  error: null,

  searchResults: [],
  searchQuery: '',
  isSearching: false,

  setSong: (song) => set({ currentSong: song, isPlaying: true, currentTime: 0, error: null }),

  // Play a song from search results — also sets the results as queue for next/prev
  playSongFromResults: (song) => {
    const { searchResults } = get();
    set({
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      error: null,
      queue: searchResults.length > 0 ? searchResults : [song],
    });
  },

  setQueue: (songs) => set({ queue: songs }),

  addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),

  playNext: () => {
    const { queue, currentSong } = get();
    const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
    if (currentIndex < queue.length - 1) {
      set({ currentSong: queue[currentIndex + 1], currentTime: 0, isPlaying: true });
    }
  },

  playPrev: () => {
    const { queue, currentSong } = get();
    const currentIndex = queue.findIndex((s) => s.id === currentSong?.id);
    if (currentIndex > 0) {
      set({ currentSong: queue[currentIndex - 1], currentTime: 0, isPlaying: true });
    }
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: false }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  clearSearch: () => set({ searchResults: [], searchQuery: '', isSearching: false }),
}));
