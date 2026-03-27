import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnailURL: string;
    authorId: string;
    authorName: string;
    authorPhoto: string;
    viewsCount: number;
    createdAt: string;
    isYouTube?: boolean;
  };
}

export default function VideoCard({ video, horizontal = false }: { video: any, horizontal?: boolean }) {
  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  const videoLink = `/video/${video.id}${video.isYouTube ? '?yt=true' : ''}`;
  const thumbnail = video.isYouTube 
    ? `https://img.youtube.com/vi/${video.id}/hqdefault.jpg` 
    : video.thumbnailURL;

  return (
    <div className={`flex gap-3 group ${horizontal ? 'flex-row items-start' : 'flex-col'}`}>
      <Link 
        to={videoLink} 
        className={`relative rounded-xl overflow-hidden bg-white/5 shrink-0 ${horizontal ? 'w-40 aspect-video' : 'w-full aspect-video'}`}
      >
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          10:00
        </div>
        {video.isYouTube && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            YouTube
          </div>
        )}
      </Link>
      
      <div className="flex gap-2 sm:gap-3 overflow-hidden flex-1">
        {!horizontal && (
          <Link to={`/profile/${video.authorId}`} className="shrink-0 mt-1">
            <img
              src={video.authorPhoto}
              alt={video.authorName}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </Link>
        )}
        <div className="flex flex-col gap-0.5 sm:gap-1 overflow-hidden flex-1">
          <Link to={videoLink}>
            <h3 className={`font-semibold leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 ${horizontal ? 'text-xs sm:text-sm' : 'text-sm'}`}>
              {video.title}
            </h3>
          </Link>
          <div className="flex flex-col text-[10px] sm:text-xs text-gray-400">
            <Link to={`/profile/${video.authorId}`} className="flex items-center gap-1 hover:text-white transition-colors truncate">
              {video.authorName}
              <CheckCircle2 className="w-3 h-3 text-gray-400" />
            </Link>
            <div className="flex items-center gap-1">
              <span>{formatViews(video.viewsCount)}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
