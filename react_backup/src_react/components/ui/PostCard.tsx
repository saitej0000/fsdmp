import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getUserData } from '../../lib/userCache';

export const PostCard = ({ post }: { post: any }) => {
  const [author, setAuthor] = useState<any>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!post.authorId) return;
      const data = await getUserData(post.authorId);
      if (data) {
        setAuthor(data);
      }
    };
    fetchAuthor();
  }, [post.authorId]);

  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 md:border md:rounded-sm md:mb-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Link to={`/profile/${post.authorId}`} className="flex items-center space-x-3">
          <img
            src={author?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
            alt={author?.username || 'User'}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-800"
          />
          <span className="font-semibold text-sm">{author?.username || 'loading...'}</span>
        </Link>
        <button className="p-1">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Image */}
      <div className="relative w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center min-h-[300px]">
        <img
          src={post.imageUrl}
          alt={post.caption || 'Post'}
          className="w-full h-auto max-h-[600px] object-contain"
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button className="hover:text-gray-500 transition-colors">
              <Heart size={24} className="stroke-[1.5px]" />
            </button>
            <Link to={`/post/${post.id}`} className="hover:text-gray-500 transition-colors">
              <MessageCircle size={24} className="stroke-[1.5px]" />
            </Link>
            <button className="hover:text-gray-500 transition-colors">
              <Send size={24} className="stroke-[1.5px]" />
            </button>
          </div>
          <button className="hover:text-gray-500 transition-colors">
            <Bookmark size={24} className="stroke-[1.5px]" />
          </button>
        </div>

        {/* Likes */}
        <div className="font-semibold text-sm mb-1">
          {post.likesCount || 0} likes
        </div>

        {/* Caption */}
        <div className="text-sm mb-1">
          <Link to={`/profile/${post.authorId}`} className="font-semibold mr-2">
            {author?.username || 'user'}
          </Link>
          <span>{post.caption}</span>
        </div>

        {/* Comments Link */}
        {(post.commentsCount > 0) && (
          <Link to={`/post/${post.id}`} className="text-gray-500 text-sm mb-1 block">
            View all {post.commentsCount} comments
          </Link>
        )}

        {/* Timestamp */}
        <div className="text-gray-500 text-[10px] uppercase tracking-wide mt-2">
          {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
        </div>
      </div>
    </div>
  );
};
