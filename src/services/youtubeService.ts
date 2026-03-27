const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyAntMH9VmZkhQnta55KYk8JF_SjOFoM858';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailURL: string;
  videoURL: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  viewsCount: number;
  createdAt: string;
  isYouTube: boolean;
}

export const fetchTrendingVideos = async (): Promise<YouTubeVideo[]> => {
  if (!API_KEY) {
    console.error('YouTube API Key is missing');
    return [];
  }
  
  try {
    const response = await fetch(
      `${BASE_URL}/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=20&key=${API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error (Trending):', errorData);
      return [];
    }

    const data = await response.json();
    
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailURL: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      videoURL: `https://www.youtube.com/watch?v=${item.id}`,
      authorId: item.snippet.channelId,
      authorName: item.snippet.channelTitle,
      authorPhoto: `https://api.dicebear.com/7.x/initials/svg?seed=${item.snippet.channelTitle}`,
      viewsCount: parseInt(item.statistics.viewCount),
      createdAt: item.snippet.publishedAt,
      isYouTube: true
    }));
  } catch (error) {
    console.error('Network error fetching YouTube videos:', error);
    return [];
  }
};

export const searchYouTubeVideos = async (query: string): Promise<YouTubeVideo[]> => {
  if (!API_KEY || !query) return [];
  
  try {
    const response = await fetch(
      `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error (Search):', errorData);
      return [];
    }

    const data = await response.json();
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailURL: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      videoURL: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      authorId: item.snippet.channelId,
      authorName: item.snippet.channelTitle,
      authorPhoto: `https://api.dicebear.com/7.x/initials/svg?seed=${item.snippet.channelTitle}`,
      viewsCount: 0,
      createdAt: item.snippet.publishedAt,
      isYouTube: true
    }));
  } catch (error) {
    console.error('Network error searching YouTube videos:', error);
    return [];
  }
};
