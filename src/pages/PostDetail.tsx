import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, getComments, addComment, likePost, unlikePost } from '../lib/db';
import { useAuth } from '../lib/auth';
import { motion } from 'motion/react';
import { Heart, MessageCircle, Share2, ArrowLeft, Send, MoreHorizontal, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserData } from '../lib/userCache';

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleTap = async () => {
    if (!isLiked) {
      await handleLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  useEffect(() => {
    const fetchPostData = async () => {
      if (!id) return;
      try {
        const postData: any = await getPost(id);
        if (postData) {
          setPost(postData);
          const authorData = await getUserData(postData.authorId);
          if (authorData) setAuthor(authorData);
          
          const commentsData = await getComments(id);
          // Fetch user data for comments
          const commentsWithUsers = await Promise.all(commentsData.map(async (c: any) => {
            const userData = await getUserData(c.authorId);
            return { ...c, user: userData };
          }));
          setComments(commentsWithUsers);

          if (user) {
            const likeDoc = await getDoc(doc(db, 'likes', `${user.uid}_${id}`));
            setIsLiked(likeDoc.exists());
          }
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostData();
  }, [id, user]);

  const handleLike = async () => {
    if (!user || !post) return navigate('/auth');
    try {
      if (isLiked) {
        await unlikePost(user.uid, post.id);
        setPost({ ...post, likesCount: post.likesCount - 1 });
      } else {
        await likePost(user.uid, post.id);
        setPost({ ...post, likesCount: post.likesCount + 1 });
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim()) return;
    try {
      const commentData = {
        postId: post.id,
        authorId: user.uid,
        text: newComment.trim(),
      };
      const commentId = await addComment(commentData);
      setComments([...comments, { id: commentId, ...commentData, createdAt: new Date() }]);
      setPost({ ...post, commentsCount: post.commentsCount + 1 });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) return <div className="text-center py-20">Post not found</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-500 hover:text-purple-500 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="flex flex-col md:flex-row bg-white dark:bg-black md:rounded-sm overflow-hidden md:border border-gray-200 dark:border-gray-800 max-w-5xl mx-auto">
        {/* Image Section */}
        <div 
          className="w-full md:w-[60%] bg-black flex items-center justify-center relative group cursor-pointer min-h-[300px]"
          onDoubleClick={handleDoubleTap}
        >
          <img
            src={post.imageUrl}
            alt={post.caption}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart size={120} className="fill-white text-white drop-shadow-2xl" />
            </motion.div>
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-[40%] flex flex-col h-auto md:h-[600px] border-l border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={author?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
                alt={author?.displayName}
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-800 object-cover"
              />
              <h3 className="font-semibold text-sm">{author?.username || 'user'}</h3>
            </div>
            <button className="p-1">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Comments/Caption Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {post.caption && (
              <div className="flex space-x-3">
                <img
                  src={author?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
                  alt={author?.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm mr-2">{author?.username}</span>
                  <span className="text-sm">{post.caption}</span>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase">
                    {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                  </p>
                </div>
              </div>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`}
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <span className="font-semibold text-sm mr-2">{comment.user?.username || `user_${comment.authorId.substring(0, 6)}`}</span>
                  <span className="text-sm">{comment.text}</span>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-[10px] text-gray-500 uppercase">
                      {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </p>
                    <button className="text-[10px] text-gray-500 font-semibold">Reply</button>
                  </div>
                </div>
                <button className="self-center">
                  <Heart size={12} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-4">
                <button onClick={handleLike} className="hover:text-gray-500 transition-colors">
                  <Heart
                    size={24}
                    className={isLiked ? 'fill-red-500 text-red-500' : 'stroke-[1.5px]'}
                  />
                </button>
                <button className="hover:text-gray-500 transition-colors">
                  <MessageCircle size={24} className="stroke-[1.5px]" />
                </button>
                <button className="hover:text-gray-500 transition-colors">
                  <Send size={24} className="stroke-[1.5px]" />
                </button>
              </div>
              <button className="hover:text-gray-500 transition-colors">
                <Bookmark size={24} className="stroke-[1.5px]" />
              </button>
            </div>
            <p className="font-semibold text-sm mb-1">{post.likesCount} likes</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-4">
              {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
            </p>

            {/* Comment Input */}
            <form onSubmit={handleComment} className="flex items-center border-t border-gray-200 dark:border-gray-800 pt-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent border-none px-0 py-1 outline-none focus:ring-0 text-sm"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="text-blue-500 font-semibold text-sm disabled:opacity-50 ml-2"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
