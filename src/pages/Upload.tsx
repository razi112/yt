import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { useAuth } from '../AuthContext';
import { Upload as UploadIcon, X, FileVideo, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Tech', 'Gaming', 'Music', 'Vlogs', 'Education'];

export default function Upload() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const onDropVideo = useCallback((acceptedFiles: File[]) => {
    setVideoFile(acceptedFiles[0]);
  }, []);

  const onDropThumbnail = useCallback((acceptedFiles: File[]) => {
    setThumbnailFile(acceptedFiles[0]);
  }, []);

  const { getRootProps: getVideoProps, getInputProps: getVideoInput, isDragActive: isVideoDrag } = useDropzone({
    onDrop: onDropVideo,
    accept: { 'video/*': [] },
    multiple: false
  });

  const { getRootProps: getThumbProps, getInputProps: getThumbInput, isDragActive: isThumbDrag } = useDropzone({
    onDrop: onDropThumbnail,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !thumbnailFile || !user || !profile) return;

    setUploading(true);
    setError('');

    try {
      // 1. Upload Video
      const videoRef = ref(storage, `videos/${user.uid}/${Date.now()}_${videoFile.name}`);
      const videoUploadTask = uploadBytesResumable(videoRef, videoFile);

      videoUploadTask.on('state_changed', (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      });

      await videoUploadTask;
      const videoURL = await getDownloadURL(videoRef);

      // 2. Upload Thumbnail
      const thumbRef = ref(storage, `thumbnails/${user.uid}/${Date.now()}_${thumbnailFile.name}`);
      await uploadBytesResumable(thumbRef, thumbnailFile);
      const thumbnailURL = await getDownloadURL(thumbRef);

      // 3. Save to Firestore
      const docRef = await addDoc(collection(db, 'videos'), {
        title,
        description,
        category,
        videoURL,
        thumbnailURL,
        authorId: user.uid,
        authorName: profile.displayName,
        authorPhoto: profile.photoURL,
        viewsCount: 0,
        likesCount: 0,
        dislikesCount: 0,
        createdAt: new Date().toISOString(),
      });

      navigate(`/video/${docRef.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
          <UploadIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Upload Video</h1>
          <p className="text-gray-400">Share your content with the world</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Video File</label>
            {!videoFile ? (
              <div
                {...getVideoProps()}
                className={`aspect-video border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
                  isVideoDrag ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <input {...getVideoInput()} />
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                  <FileVideo className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Drag & drop video</p>
                  <p className="text-xs text-gray-500">MP4, WebM or Ogg</p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 relative group">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="text-sm font-medium truncate max-w-[80%]">{videoFile.name}</p>
                <button
                  type="button"
                  onClick={() => setVideoFile(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Thumbnail</label>
            {!thumbnailFile ? (
              <div
                {...getThumbProps()}
                className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isThumbDrag ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <input {...getThumbInput()} />
                <ImageIcon className="w-6 h-6 text-gray-400" />
                <p className="text-xs font-medium text-gray-400">Upload thumbnail</p>
              </div>
            ) : (
              <div className="h-32 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 px-4 relative group">
                <img
                  src={URL.createObjectURL(thumbnailFile)}
                  alt="Thumbnail preview"
                  className="w-24 h-16 object-cover rounded-lg"
                />
                <p className="text-sm font-medium truncate flex-1">{thumbnailFile.name}</p>
                <button
                  type="button"
                  onClick={() => setThumbnailFile(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a catchy title"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Description</label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors appearance-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={uploading || !videoFile || !thumbnailFile}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? `Uploading ${Math.round(progress)}%...` : 'Publish Video'}
          </button>
        </div>
      </form>
    </div>
  );
}
