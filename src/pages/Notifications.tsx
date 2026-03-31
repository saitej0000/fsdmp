import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../lib/db';
import { motion } from 'motion/react';
import { Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getUserData } from '../lib/userCache';

export const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notifs = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        
        // Fetch sender details
        let actor = null;
        if (data.actorId) {
          actor = await getUserData(data.actorId);
        }

        // Fetch post details if applicable
        let post = null;
        if (data.postId) {
          const postSnap = await getDoc(doc(db, 'posts', data.postId));
          if (postSnap.exists()) {
            post = postSnap.data();
          }
        }

        return {
          id: d.id,
          ...data,
          actor,
          post
        };
      }));
      
      setNotifications(notifs);
      setLoading(false);
      
      // Mark all as read when viewing the page
      const hasUnread = snapshot.docs.some(d => !d.data().read);
      if (hasUnread) {
        markAllNotificationsAsRead(user.uid);
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getNotificationContent = (notif: any) => {
    switch (notif.type) {
      case 'like':
        return (
          <div className="flex items-center">
            <Heart className="w-4 h-4 text-red-500 mr-2 fill-current" />
            <span><span className="font-semibold">{notif.actor?.username || notif.actor?.displayName}</span> liked your post.</span>
          </div>
        );
      case 'comment':
        return (
          <div className="flex items-center">
            <MessageCircle className="w-4 h-4 text-blue-500 mr-2 fill-current" />
            <span><span className="font-semibold">{notif.actor?.username || notif.actor?.displayName}</span> commented on your post.</span>
          </div>
        );
      case 'follow':
        return (
          <div className="flex items-center">
            <UserPlus className="w-4 h-4 text-purple-500 mr-2" />
            <span><span className="font-semibold">{notif.actor?.username || notif.actor?.displayName}</span> started following you.</span>
          </div>
        );
      default:
        return <span>New notification</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto pt-8 px-4"
    >
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center">
            <Bell className="mr-2" /> Notifications
          </h1>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 flex items-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                onClick={() => {
                  if (!notif.read) markNotificationAsRead(notif.id);
                }}
              >
                <Link to={`/profile/${notif.actorId}`} className="flex-shrink-0 mr-4">
                  <img 
                    src={notif.actor?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actorId}`} 
                    alt={notif.actor?.username} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-800"
                  />
                </Link>
                
                <div className="flex-1 min-w-0 pt-1">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {getNotificationContent(notif)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                  </div>
                </div>
                
                {notif.post && (
                  <Link to={`/post/${notif.postId}`} className="flex-shrink-0 ml-4">
                    <img 
                      src={notif.post.imageUrl} 
                      alt="Post" 
                      className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-800"
                    />
                  </Link>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No notifications yet</h2>
              <p className="text-sm">When someone likes or comments on your post, it will show up here.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
