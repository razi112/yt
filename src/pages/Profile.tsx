import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import VideoCard from '../components/VideoCard';
import { CheckCircle2, MoreHorizontal, Search, Bell } from 'lucide-react';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    if (!id) return;

    // Fetch profile
    const profileRef = doc(db, 'users', id);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setLoading(false);
    });

    // Fetch user's videos
    const videosRef = collection(db, 'videos');
    const q = query(videosRef, where('authorId', '==', id), orderBy('createdAt', 'desc'));
    const unsubVideos = onSnapshot(q, (snap) => {
      setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProfile();
      unsubVideos();
    };
  }, [id]);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-48 bg-white/5 rounded-2xl" />
    <div className="flex gap-8">
      <div className="w-32 h-32 rounded-full bg-white/5" />
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-white/5 rounded w-1/4" />
        <div className="h-4 bg-white/5 rounded w-1/6" />
      </div>
    </div>
  </div>;

  if (!profile) return <div className="text-center py-20">User not found</div>;

  const tabs = ['Home', 'Videos', 'Playlists', 'Community', 'Channels', 'About'];

  return (
    <div className="space-y-8">
      <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10">
        <div className="absolute inset-0 flex items-center justify-center text-white/10 font-bold text-6xl select-none">
          {profile.displayName.toUpperCase()}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start px-4">
        <img
          src={profile.photoURL}
          alt={profile.displayName}
          className="w-32 h-32 rounded-full border-4 border-[#0f0f0f] -mt-16 relative z-10 object-cover"
        />
        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {profile.displayName}
                <CheckCircle2 className="w-5 h-5 text-gray-400" />
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>@{profile.displayName.replace(/\s+/g, '').toLowerCase()}</span>
                <span>•</span>
                <span>{profile.subscribersCount || 0} subscribers</span>
                <span>•</span>
                <span>{videos.length} videos</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentUser?.uid === id ? (
                <>
                  <button className="px-4 py-2 bg-white/10 rounded-full font-medium hover:bg-white/20 transition-colors">Customize channel</button>
                  <button className="px-4 py-2 bg-white/10 rounded-full font-medium hover:bg-white/20 transition-colors">Manage videos</button>
                </>
              ) : (
                <>
                  <button className="px-4 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors">Subscribe</button>
                  <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <Bell className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-400 max-w-2xl">
            Welcome to my channel! I share videos about {profile.displayName.split(' ')[0]}'s life and interests.
          </p>
        </div>
      </div>

      <div className="border-b border-white/10">
        <div className="flex gap-8 px-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
            </button>
          ))}
          <button className="pb-3 text-gray-400 hover:text-white">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4">
        {activeTab === 'Videos' || activeTab === 'Home' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No content in {activeTab}</p>
          </div>
        )}
      </div>
    </div>
  );
}
