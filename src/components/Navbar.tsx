import { Menu, Search, Video, Bell, User, LogOut, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f] flex items-center justify-between px-2 sm:px-4 z-50 border-b border-white/10">
      <div className={`flex items-center gap-2 sm:gap-4 ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
        <button onClick={onMenuClick} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <div className="w-8 h-6 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[8px] border-l-white border-b-[4px] border-b-transparent ml-1" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tighter">VidStream</span>
        </Link>
      </div>

      <form 
        onSubmit={handleSearch} 
        className={`flex-1 max-w-[720px] items-center ml-2 sm:ml-10 ${isSearchOpen ? 'flex' : 'hidden sm:flex'}`}
      >
        {isSearchOpen && (
          <button 
            type="button" 
            onClick={() => setIsSearchOpen(false)}
            className="p-2 mr-2 hover:bg-white/10 rounded-full sm:hidden"
          >
            <Menu className="w-6 h-6 rotate-90" />
          </button>
        )}
        <div className="flex-1 flex items-center bg-[#121212] border border-white/10 rounded-l-full px-4 py-1.5 focus-within:border-blue-500">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search"
            autoFocus={isSearchOpen}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-white placeholder-gray-400 text-sm sm:text-base"
          />
        </div>
        <button type="submit" className="bg-white/10 border border-l-0 border-white/10 rounded-r-full px-3 sm:px-5 py-1.5 hover:bg-white/20 transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </form>

      <div className={`flex items-center gap-1 sm:gap-2 ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="sm:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
        {user ? (
          <>
            <Link to="/upload" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Create">
              <Video className="w-6 h-6" />
            </Link>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Notifications">
              <Bell className="w-6 h-6" />
            </button>
            {isAdmin && (
              <Link to="/admin" className="px-3 py-1 bg-red-600/20 text-red-500 rounded-full text-sm font-medium hover:bg-red-600/30 transition-colors">
                Admin
              </Link>
            )}
            <div className="relative group ml-2">
              <img
                src={profile?.photoURL || user.photoURL || ''}
                alt="Profile"
                className="w-8 h-8 rounded-full cursor-pointer object-cover"
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#282828] rounded-xl shadow-xl border border-white/10 hidden group-hover:block overflow-hidden">
                <Link to={`/profile/${user.uid}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                  <User className="w-5 h-5" />
                  <span>Your Channel</span>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-t border-white/10">
                  <LogOut className="w-5 h-5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <Link to="/login" className="flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full text-blue-400 hover:bg-blue-400/10 transition-colors">
            <LogIn className="w-5 h-5" />
            <span className="font-medium">Sign in</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
