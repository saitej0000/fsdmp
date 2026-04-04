import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Settings, Grid, Bookmark, X, Camera } from 'lucide-react';
import { followUser, unfollowUser, checkIsFollowing, updateUserProfile } from '../lib/db';
import { getSupabase } from '../lib/supabase';

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    photoURL: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }

        const q = query(
          collection(db, 'posts'),
          where('authorId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        
        if (user && user.uid !== id) {
          const following = await checkIsFollowing(user.uid, id);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id, user]);

  const handleFollowToggle = async () => {
    if (!user || !id || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.uid, id);
        setIsFollowing(false);
        setProfile((prev: any) => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 0) - 1) }));
      } else {
        await followUser(user.uid, id);
        setIsFollowing(true);
        setProfile((prev: any) => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      username: profile.username || '',
      displayName: profile.displayName || '',
      bio: profile.bio || '',
      photoURL: profile.photoURL || ''
    });
    setProfileImageFile(null);
    setProfileImagePreview(profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`);
    setIsEditing(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSavingProfile(true);
    try {
      let updatedPhotoURL = editForm.photoURL;

      if (profileImageFile) {
        const fileExt = profileImageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `profiles/${user.uid}/${fileName}`;

        const supabase = getSupabase();
        const { error } = await supabase.storage
          .from('images')
          .upload(filePath, profileImageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
          
        updatedPhotoURL = publicUrl;
      }

      const finalData = { ...editForm, photoURL: updatedPhotoURL };
      await updateUserProfile(user.uid, finalData);
      setProfile((prev: any) => ({ ...prev, ...finalData }));
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return <div className="text-center py-20">User not found</div>;

  const isOwnProfile = user?.uid === id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 py-8"
    >
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-start mb-12 md:px-12">
        <div className="flex-shrink-0 mr-0 md:mr-20 mb-6 md:mb-0 flex justify-center md:block">
          <img
            src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`}
            alt={profile.displayName}
            className="w-24 h-24 md:w-36 md:h-36 rounded-full border border-gray-200 dark:border-gray-800 object-cover"
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl mr-6 mb-4 md:mb-0">{profile.username || profile.displayName}</h1>
            <div className="flex items-center space-x-2">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={handleEditProfile}
                    className="px-4 py-1.5 bg-gray-100 dark:bg-[#363636] text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-[#262626] transition-colors"
                  >
                    Edit profile
                  </button>
                  <button className="px-4 py-1.5 bg-gray-100 dark:bg-[#363636] text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-[#262626] transition-colors">
                    View archive
                  </button>
                  <button className="p-1.5 hover:text-gray-500 transition-colors">
                    <Settings size={24} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-6 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                      isFollowing 
                        ? 'bg-gray-100 dark:bg-[#363636] text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#262626]' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <Link 
                    to={`/messages/${id}`}
                    className="px-4 py-1.5 bg-gray-100 dark:bg-[#363636] text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-[#262626] transition-colors"
                  >
                    Message
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex space-x-10 mb-6">
            <div><span className="font-semibold">{posts.length}</span> posts</div>
            <div><span className="font-semibold">{profile.followersCount || 0}</span> followers</div>
            <div><span className="font-semibold">{profile.followingCount || 0}</span> following</div>
          </div>

          <div className="text-sm">
            <p className="font-semibold">{profile.displayName}</p>
            <p className="whitespace-pre-wrap">{profile.bio || 'No bio yet.'}</p>
          </div>
        </div>
      </div>

      {/* Mobile Stats (Instagram puts these below bio on mobile) */}
      <div className="flex md:hidden justify-around border-t border-gray-200 dark:border-gray-800 py-3 mb-4">
        <div className="text-center"><span className="font-semibold block">{posts.length}</span> <span className="text-gray-500 text-sm">posts</span></div>
        <div className="text-center"><span className="font-semibold block">{profile.followersCount || 0}</span> <span className="text-gray-500 text-sm">followers</span></div>
        <div className="text-center"><span className="font-semibold block">{profile.followingCount || 0}</span> <span className="text-gray-500 text-sm">following</span></div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-t border-gray-200 dark:border-gray-800 mb-4">
        <button className="flex items-center space-x-2 px-8 py-4 border-t border-black dark:border-white text-sm font-semibold tracking-widest uppercase">
          <Grid size={16} />
          <span className="hidden md:inline">Posts</span>
        </button>
        {isOwnProfile && (
          <button className="flex items-center space-x-2 px-8 py-4 border-t border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 text-sm font-semibold tracking-widest uppercase transition-colors">
            <Bookmark size={16} />
            <span className="hidden md:inline">Saved</span>
          </button>
        )}
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {posts.map((post) => (
            <Link to={`/post/${post.id}`} key={post.id} className="relative aspect-square group bg-gray-100 dark:bg-gray-900">
              <img
                src={post.imageUrl}
                alt={post.caption || 'Post'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-6 text-white">
                <div className="flex items-center font-bold">
                  <span className="mr-2">♥</span> {post.likesCount || 0}
                </div>
                <div className="flex items-center font-bold">
                  <span className="mr-2">💬</span> {post.commentsCount || 0}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 mb-4">
            <Grid size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Posts Yet</h2>
          <p className="text-gray-500">When you share photos, they will appear on your profile.</p>
        </div>
      )}
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#262626] rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img
                    src={profileImagePreview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`}
                    alt="Profile Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-sm text-blue-500 font-semibold hover:text-blue-600"
                >
                  Change Profile Photo
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  placeholder="Write a bio..."
                />
              </div>
              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {savingProfile ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
