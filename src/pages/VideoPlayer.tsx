import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../AuthContext';
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, CheckCircle2, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VideoCard from '../components/VideoCard';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailURL: string;
  videoURL: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  category: string;
  isYouTube?: boolean;
}

interface Comment {
  id: string;
  videoId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: string;
}

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isYT = searchParams.get('yt') === 'true';
  const { user, profile } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLike, setUserLike] = useState<'like' | 'dislike' | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!id) return;

    if (isYT) {
      // For YouTube videos, we fetch details from the API or just mock it for now
      // Since we don't have a full YouTube video fetcher yet, we'll just use the ID
      setVideo({
        id,
        title: 'YouTube Video',
        description: 'This is a video from YouTube.',
        thumbnailURL: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        videoURL: `https://www.youtube.com/embed/${id}`,
        authorId: 'youtube',
        authorName: 'YouTube Creator',
        authorPhoto: 'https://api.dicebear.com/7.x/initials/svg?seed=YouTube',
        viewsCount: 0,
        likesCount: 0,
        dislikesCount: 0,
        createdAt: new Date().toISOString(),
        category: 'YouTube',
        isYouTube: true
      });
      setLoading(false);
    } else {
      // Fetch Firebase video details
      const videoRef = doc(db, 'videos', id);
      const fetchVideo = async () => {
        try {
          const snap = await getDoc(videoRef);
          if (snap.exists()) {
            setVideo({ id: snap.id, ...snap.data() } as Video);
            // Increment views
            await updateDoc(videoRef, { viewsCount: increment(1) });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `videos/${id}`);
        }
        setLoading(false);
      };
      fetchVideo();
    }

    // Fetch related videos
    const videosRef = collection(db, 'videos');
    const qRelated = query(videosRef, where('id', '!=', id), orderBy('id'), orderBy('createdAt', 'desc'));
    const unsubRelated = onSnapshot(qRelated, (snap) => {
      setRelatedVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videos');
    });

    // Fetch comments
    const commentsRef = collection(db, 'videos', id, 'comments');
    const qComments = query(commentsRef, orderBy('createdAt', 'desc'));
    const unsubComments = onSnapshot(qComments, (snap) => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `videos/${id}/comments`);
    });

    // Check user like/dislike
    let unsubLike = () => {};
    if (user) {
      const likeId = `${user.uid}_${id}`;
      unsubLike = onSnapshot(doc(db, 'likes', likeId), (snap) => {
        if (snap.exists()) {
          setUserLike(snap.data()?.type as 'like' | 'dislike');
        } else {
          setUserLike(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `likes/${likeId}`);
      });
    }

    // Check subscription
    let unsubSub = () => {};
    if (user && video?.authorId && video.authorId !== 'youtube') {
      const subId = `${user.uid}_${video.authorId}`;
      unsubSub = onSnapshot(doc(db, 'subscriptions', subId), (snap) => {
        setIsSubscribed(snap.exists());
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `subscriptions/${subId}`);
      });
    }

    return () => {
      unsubRelated();
      unsubComments();
      unsubLike();
      unsubSub();
    };
  }, [id, user, video?.authorId, isYT]);

  const handleLike = async (type: 'like' | 'dislike') => {
    if (!user || !id) return;
    if (isYT) {
      alert('Liking YouTube videos is not supported yet.');
      return;
    }
    const likeId = `${user.uid}_${id}`;
    const likeRef = doc(db, 'likes', likeId);
    const videoRef = doc(db, 'videos', id);

    try {
      if (userLike === type) {
        // Remove like/dislike
        await deleteDoc(likeRef);
        await updateDoc(videoRef, {
          [type === 'like' ? 'likesCount' : 'dislikesCount']: increment(-1)
        });
      } else {
        // Add or change like/dislike
        if (userLike) {
          // Change from like to dislike or vice versa
          await updateDoc(videoRef, {
            [userLike === 'like' ? 'likesCount' : 'dislikesCount']: increment(-1),
            [type === 'like' ? 'likesCount' : 'dislikesCount']: increment(1)
          });
        } else {
          // New like/dislike
          await updateDoc(videoRef, {
            [type === 'like' ? 'likesCount' : 'dislikesCount']: increment(1)
          });
        }
        await setDoc(likeRef, { uid: user.uid, videoId: id, type });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `likes/${likeId}`);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !video) return;
    if (video.authorId === 'youtube') {
      alert('Subscribing to YouTube creators is not supported yet.');
      return;
    }
    const subId = `${user.uid}_${video.authorId}`;
    const subRef = doc(db, 'subscriptions', subId);
    const authorRef = doc(db, 'users', video.authorId);

    try {
      if (isSubscribed) {
        await deleteDoc(subRef);
        await updateDoc(authorRef, { subscribersCount: increment(-1) });
      } else {
        await setDoc(subRef, { subscriberUid: user.uid, targetUid: video.authorId });
        await updateDoc(authorRef, { subscribersCount: increment(1) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `subscriptions/${subId}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !id || !newComment.trim()) return;

    const commentsRef = collection(db, 'videos', id, 'comments');
    try {
      await addDoc(commentsRef, {
        id: Date.now().toString(),
        videoId: id,
        authorId: user.uid,
        authorName: profile.displayName,
        authorPhoto: profile.photoURL,
        text: newComment,
        createdAt: new Date().toISOString(),
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `videos/${id}/comments`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'videos', id, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `videos/${id}/comments/${commentId}`);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="aspect-video bg-white/5 rounded-2xl" />
    <div className="h-8 bg-white/5 rounded w-3/4" />
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/5 rounded w-1/4" />
        <div className="h-3 bg-white/5 rounded w-1/6" />
      </div>
    </div>
  </div>;

  if (!video) return <div className="text-center py-20">Video not found</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
          {video.isYouTube ? (
            <iframe
              src={video.videoURL}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <video
              src={video.videoURL}
              controls
              autoPlay
              className="w-full h-full"
              poster={video.thumbnailURL}
            />
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-xl font-bold leading-tight">{video.title}</h1>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to={`/profile/${video.authorId}`} className="shrink-0">
                <img src={video.authorPhoto} alt={video.authorName} className="w-10 h-10 rounded-full object-cover" />
              </Link>
              <div className="flex flex-col">
                <Link to={`/profile/${video.authorId}`} className="font-bold flex items-center gap-1 hover:text-blue-400 transition-colors">
                  {video.authorName}
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                </Link>
                <span className="text-xs text-gray-400">1.2M subscribers</span>
              </div>
              <button
                onClick={handleSubscribe}
                className={`ml-4 px-4 py-2 rounded-full font-medium transition-colors ${
                  isSubscribed ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/10 rounded-full overflow-hidden">
                <button
                  onClick={() => handleLike('like')}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors border-r border-white/10 ${userLike === 'like' ? 'text-blue-400' : ''}`}
                >
                  <ThumbsUp className={`w-5 h-5 ${userLike === 'like' ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{video.likesCount}</span>
                </button>
                <button
                  onClick={() => handleLike('dislike')}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors ${userLike === 'dislike' ? 'text-red-400' : ''}`}
                >
                  <ThumbsDown className={`w-5 h-5 ${userLike === 'dislike' ? 'fill-current' : ''}`} />
                </button>
              </div>
              <button className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
              <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 text-sm space-y-1">
            <div className="flex gap-2 font-bold">
              <span>{video.viewsCount.toLocaleString()} views</span>
              <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
            </div>
            <p className="whitespace-pre-wrap">{video.description}</p>
          </div>
        </div>

        <div className="space-y-6 pt-6">
          <h3 className="text-xl font-bold">{comments.length} Comments</h3>
          
          {user && (
            <form onSubmit={handleAddComment} className="flex gap-4">
              <img src={profile?.photoURL} alt="Your profile" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-transparent border-b border-white/10 py-1 outline-none focus:border-white transition-colors"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setNewComment('')} className="px-4 py-2 hover:bg-white/10 rounded-full text-sm font-medium">Cancel</button>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <img src={comment.authorPhoto} alt={comment.authorName} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">@{comment.authorName.replace(/\s+/g, '').toLowerCase()}</span>
                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                  <div className="flex items-center gap-4 pt-1">
                    <button className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs">0</span>
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button className="text-xs font-bold text-gray-400 hover:text-white transition-colors">Reply</button>
                  </div>
                </div>
                {(user?.uid === comment.authorId || user?.uid === video.authorId || profile?.role === 'admin') && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">Related Videos</h3>
        <div className="flex flex-col gap-4">
          {relatedVideos.map((v) => (
            <VideoCard key={v.id} video={v} horizontal />
          ))}
        </div>
      </div>
    </div>
  );
}
