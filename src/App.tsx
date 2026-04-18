import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useMusicEngine } from '@/hooks/useMusicEngine';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import PlayerBar from '@/components/PlayerBar';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import SearchPage from '@/pages/Search';
import LikedSongs from '@/pages/LikedSongs';
import Playlists from '@/pages/Playlists';
import RegionalPlaylist from '@/pages/RegionalPlaylist';
import Friends from '@/pages/Friends';
import Rooms from '@/pages/Rooms';
import Chat from '@/pages/Chat';
import AIPage from '@/pages/AI';

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isGuest } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-white/30 text-sm">Loading Sur...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Main Layout with Sidebar + Player
function MainLayout({ children }: { children: React.ReactNode }) {
  const { seekTo } = useMusicEngine('yt-player');

  return (
    <div className="flex h-screen w-full overflow-hidden relative vignette">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
      {/* Hidden YouTube player container */}
      <div id="yt-player" className="fixed -top-[9999px] -left-[9999px]" />
      <PlayerBar onSeek={seekTo} />
    </div>
  );
}

function AppRoutes() {
  // Generate random particles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    width: Math.random() * 4 + 1 + 'px',
    height: Math.random() * 4 + 1 + 'px',
    left: Math.random() * 100 + 'vw',
    top: Math.random() * 100 + 'vh',
    animationDuration: Math.random() * 10 + 10 + 's',
    animationDelay: Math.random() * 5 + 's',
  }));

  return (
    <div className="w-full h-screen bg-background relative selection:bg-primary/30 overflow-hidden">
      {/* Background ambient lighting - Mesh Gradient */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] opacity-60 pointer-events-none animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px] opacity-60 pointer-events-none animate-pulse mix-blend-screen" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px] opacity-40 pointer-events-none animate-pulse mix-blend-screen" style={{ animationDuration: '10s' }} />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div key={i} className="particle" style={p} />
        ))}
      </div>

      <main className="relative z-10 w-full h-full">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/liked" element={<LikedSongs />} />
                    <Route path="/playlists" element={<Playlists />} />
                    <Route path="/playlist/:id" element={<RegionalPlaylist />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/room/:id" element={<Rooms />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/ai" element={<AIPage />} />
                    <Route path="*" element={
                      <div className="flex items-center justify-center h-full text-white/20 text-lg">
                        404 — Page not found
                      </div>
                    } />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
