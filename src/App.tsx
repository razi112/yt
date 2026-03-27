import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import VideoPlayer from './pages/VideoPlayer';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0f0f0f] text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;

  return <>{children}</>;
};

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const { loading } = useAuth();

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#0f0f0f] text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex pt-14">
        <Sidebar isOpen={isSidebarOpen} />
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && window.innerWidth < 1024 && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'lg:ml-20 ml-0'} p-4 w-full overflow-x-hidden`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video/:id" element={<VideoPlayer />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/explore" element={<div className="p-8 text-center text-gray-400">Explore feature coming soon!</div>} />
            <Route path="/history" element={<div className="p-8 text-center text-gray-400">History feature coming soon!</div>} />
            <Route path="/settings" element={<div className="p-8 text-center text-gray-400">Settings feature coming soon!</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
