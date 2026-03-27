import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Video, MessageSquare, Trash2, Shield, Eye, AlertCircle, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'videos'>('users');

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubVideos = onSnapshot(query(collection(db, 'videos'), orderBy('createdAt', 'desc')), (snap) => {
      setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubVideos();
    };
  }, []);

  const handleDeleteVideo = async (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await deleteDoc(doc(db, 'videos', videoId));
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500' },
    { label: 'Total Videos', value: videos.length, icon: Video, color: 'text-red-500' },
    { label: 'Total Views', value: videos.reduce((acc, v) => acc + (v.viewsCount || 0), 0), icon: Eye, color: 'text-green-500' },
    { label: 'Avg Likes', value: Math.round(videos.reduce((acc, v) => acc + (v.likesCount || 0), 0) / (videos.length || 1)), icon: TrendingUp, color: 'text-purple-500' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
    </div>
    <div className="h-96 bg-white/5 rounded-2xl" />
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your platform and content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#121212] border border-white/10 p-6 rounded-2xl flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'users' ? 'bg-white/5 text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'videos' ? 'bg-white/5 text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video className="w-5 h-5" />
            Videos
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'users' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-400 border-b border-white/10">
                    <th className="pb-4 font-medium">User</th>
                    <th className="pb-4 font-medium">Email</th>
                    <th className="pb-4 font-medium">Role</th>
                    <th className="pb-4 font-medium">Joined</th>
                    <th className="pb-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="text-sm group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <span className="font-medium">{u.displayName}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-400">{u.email}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                          u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.role)}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                          title={u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                        >
                          <Shield className={`w-5 h-5 ${u.role === 'admin' ? 'fill-current' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-400 border-b border-white/10">
                    <th className="pb-4 font-medium">Video</th>
                    <th className="pb-4 font-medium">Author</th>
                    <th className="pb-4 font-medium">Views</th>
                    <th className="pb-4 font-medium">Likes</th>
                    <th className="pb-4 font-medium">Date</th>
                    <th className="pb-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {videos.map((v) => (
                    <tr key={v.id} className="text-sm group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img src={v.thumbnailURL} alt="" className="w-12 h-8 rounded object-cover" />
                          <span className="font-medium truncate max-w-[200px]">{v.title}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-400">{v.authorName}</td>
                      <td className="py-4 text-gray-400">{v.viewsCount.toLocaleString()}</td>
                      <td className="py-4 text-gray-400">{v.likesCount.toLocaleString()}</td>
                      <td className="py-4 text-gray-400">
                        {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(v.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
