import { useEffect, useState, useCallback, useRef } from 'react';
import { PostCard } from '../components/ui/PostCard';
import { getPosts } from '../lib/db';
import { motion } from 'motion/react';

export const Home = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    
    try {
      setLoadingMore(true);
      const data = await getPosts(lastDoc);
      
      if (data.posts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
        setLastDoc(data.lastDoc);
        setHasMore(!!data.lastDoc);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc]);

  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, loadMorePosts]);

  const fetchInitialPosts = async () => {
    try {
      setLoading(true);
      const data = await getPosts();
      setPosts(data.posts);
      setLastDoc(data.lastDoc);
      setHasMore(!!data.lastDoc);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto pt-4 md:pt-8"
    >
      <div className="flex flex-col space-y-4 md:space-y-6">
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <div key={post.id} ref={isLast ? lastPostElementRef : null}>
              <PostCard post={post} />
            </div>
          );
        })}
      </div>
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </motion.div>
  );
};
