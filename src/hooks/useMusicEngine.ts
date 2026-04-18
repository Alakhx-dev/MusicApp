import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';

// YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiLoaded = false;
let apiLoading = false;
const apiReadyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiLoaded) {
      resolve();
      return;
    }
    apiReadyCallbacks.push(resolve);
    if (apiLoading) return;
    apiLoading = true;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      apiReadyCallbacks.forEach((cb) => cb());
      apiReadyCallbacks.length = 0;
    };
  });
}

export function useMusicEngine(containerId: string) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setLoading,
    setError,
    playNext,
  } = usePlayerStore();

  // Initialize YT player
  useEffect(() => {
    let cancelled = false;

    loadYouTubeAPI().then(() => {
      if (cancelled) return;
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(containerId, {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setLoading(false);
          },
          onStateChange: (event: any) => {
            switch (event.data) {
              case window.YT.PlayerState.PLAYING:
                setIsPlaying(true);
                setLoading(false);
                break;
              case window.YT.PlayerState.PAUSED:
                setIsPlaying(false);
                break;
              case window.YT.PlayerState.ENDED:
                playNext();
                break;
              case window.YT.PlayerState.BUFFERING:
                setLoading(true);
                break;
            }
          },
          onError: (event: any) => {
            setError(`YouTube Error: ${event.data}`);
            setLoading(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [containerId]);

  // Load video when song changes
  useEffect(() => {
    if (!currentSong || !playerRef.current?.loadVideoById) return;
    setLoading(true);
    playerRef.current.loadVideoById(currentSong.id);
  }, [currentSong?.id]);

  // Play / Pause sync
  useEffect(() => {
    const p = playerRef.current;
    if (!p?.getPlayerState) return;
    try {
      if (isPlaying) {
        p.playVideo();
      } else {
        p.pauseVideo();
      }
    } catch {
      // Player not ready yet
    }
  }, [isPlaying]);

  // Volume sync
  useEffect(() => {
    const p = playerRef.current;
    if (!p?.setVolume) return;
    try {
      p.setVolume(volume);
      if (isMuted) p.mute();
      else p.unMute();
    } catch {
      // Player not ready
    }
  }, [volume, isMuted]);

  // Time tracking interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const p = playerRef.current;
        if (p?.getCurrentTime) {
          setCurrentTime(p.getCurrentTime());
          if (p.getDuration) {
            setDuration(p.getDuration());
          }
        }
      }, 250);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const seekTo = useCallback((seconds: number) => {
    const p = playerRef.current;
    if (p?.seekTo) {
      p.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  }, []);

  return { seekTo, playerRef };
}
