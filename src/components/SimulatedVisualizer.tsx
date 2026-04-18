import { useEffect, useRef } from 'react';

// Math utility for smooth interpolation
const lerp = (start: number, end: number, amt: number) => {
  return (1 - amt) * start + amt * end;
};

// Generates a bell curve multiplier from 0.0 to 1.0 based on x position (0 to 1)
const getBellCurve = (x: number) => {
  return Math.sin(x * Math.PI);
};

export default function SimulatedVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<{ 
    targets: number[], 
    current: number[],
    lastBeat: number,
    beatMultiplier: number,
  }>({
    targets: Array(64).fill(0),
    current: Array(64).fill(0),
    lastBeat: 0,
    beatMultiplier: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    let animationId: number;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect() || { width: 800, height: 300 };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    const BARS = 64; // High density visualizer

    const renderLoop = () => {
      const state = audioContextRef.current;
      const now = Date.now();
      
      // Clear entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      const barWidth = (width / BARS) * 0.7; // 70% width, 30% gap
      const gap = (width / BARS) * 0.3;
      
      // Calculate beat logic (120 BPM = 500ms per beat)
      // We randomly trigger beats or follow a strict tempo
      if (isPlaying) {
        if (now - state.lastBeat > 480 + (Math.random() * 40)) { // Add tiny jitter to feel organic
          state.lastBeat = now;
          state.beatMultiplier = 1.4 + Math.random() * 0.4; // Spike the volume
          
          // Generate new target heights for all bars
          for (let i = 0; i < BARS; i++) {
             // Normalized position (0.0 to 1.0)
             const nx = i / (BARS - 1); 
             // Shape the EQ like a real song (low bass high, mids varied, highs tapering)
             // We use a mix of bell curves and noise
             const bell = getBellCurve(nx);
             const noise = Math.random() * 0.6 + 0.4;
             
             // Base height
             state.targets[i] = bell * noise;
          }
        }
      } else {
        // Flatten if paused
        for (let i = 0; i < BARS; i++) {
           state.targets[i] = 0.02; // Tiny nub
        }
      }

      // Decay the global beat multiplier rapidly
      state.beatMultiplier = lerp(state.beatMultiplier, 1.0, 0.1);

      // Create stunning gradient
      const gradient = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.7);
      gradient.addColorStop(0, '#f43f5e'); // Rose
      gradient.addColorStop(0.5, '#d946ef'); // Fuchsia
      gradient.addColorStop(1, '#8b5cf6'); // Violet

      // Draw bars
      for (let i = 0; i < BARS; i++) {
        // Jiggle target slightly if playing for high-refresh shimmer
        let jiggle = isPlaying ? (Math.random() * 0.1 - 0.05) : 0;
        let finalTarget = Math.max(0, state.targets[i] + jiggle) * state.beatMultiplier;
        
        // Smooth interpolate actual height towards target
        state.current[i] = lerp(state.current[i], finalTarget, isPlaying ? 0.2 : 0.05);
        
        // Map 0.0-1.0 to pixel height (max 60% of canvas height)
        const maxBarHeight = height * 0.55;
        const barHeight = Math.max(2, state.current[i] * maxBarHeight);
        
        const x = i * (barWidth + gap);
        const y = (height * 0.7) - barHeight; // Base sits at 70% down

        // Glow effects
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(217, 70, 239, 0.4)';
        ctx.fillStyle = gradient;

        // Draw main bar (rounded rect)
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [ barWidth/2, barWidth/2, 0, 0 ]);
        ctx.fill();

        // Turn off shadow for reflection
        ctx.shadowBlur = 0;

        // Draw Reflection
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.25 - (state.current[i] * 0.1); // Fades out the taller it is
        ctx.beginPath();
        ctx.roundRect(x, height * 0.7 + 2, barWidth, barHeight * 0.5, [ 0, 0, barWidth/2, barWidth/2 ]);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block" 
        style={{ filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))' }}
      />
    </div>
  );
}
