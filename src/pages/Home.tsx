import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import VideoCard from '../components/VideoCard';
import { useSearchParams } from 'react-router-dom';
import { fetchTrendingVideos, searchYouTubeVideos, YouTubeVideo } from '../services/youtubeService';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailURL: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  viewsCount: number;
  createdAt: string;
  category: string;
  isYouTube?: boolean;
}

export default function Home() {
  const [videos, setVideos] = useState<(Video | YouTubeVideo)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q');

  useEffect(() => {
    setLoading(true);
    
    // Fetch Firebase videos
    const videosRef = collection(db, 'videos');
    const q = query(videosRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let firebaseVideos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
      
      let youtubeVideos: YouTubeVideo[] = [];
      if (queryParam) {
        // Search YouTube
        youtubeVideos = await searchYouTubeVideos(queryParam);
        // Filter Firebase
        firebaseVideos = firebaseVideos.filter(v => 
          v.title.toLowerCase().includes(queryParam.toLowerCase()) ||
          v.description.toLowerCase().includes(queryParam.toLowerCase())
        );
      } else {
        // Fetch Trending YouTube
        youtubeVideos = await fetchTrendingVideos();
      }
      
      // Filter by category if not 'All'
      let merged = [...firebaseVideos, ...youtubeVideos];
      if (selectedCategory !== 'All') {
        merged = merged.filter(v => {
          if ('category' in v) {
            return v.category === selectedCategory;
          }
          // For YouTube videos, we don't have a strict category mapping here, 
          // but we could potentially filter by title/description if we wanted to be clever.
          // For now, let's just show Firebase videos for specific categories.
          return false; 
        });
      }

      setVideos(merged);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [queryParam, selectedCategory]);

  const categories = ['All', 'Tech', 'Gaming', 'Music', 'Vlogs', 'Education'];

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex flex-col gap-3 animate-pulse">
        <div className="aspect-video bg-white/5 rounded-xl" />
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              cat === selectedCategory ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-xl font-medium">No videos found</p>
          <p className="text-sm">Try searching for something else</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
