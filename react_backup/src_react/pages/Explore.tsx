import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../lib/db';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { MasonryGrid } from '../components/ui/MasonryGrid';

export const Explore = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredPosts = posts.filter(post => 
    post.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-12 max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg transition-all"
            placeholder="Search for inspiration, colors, or tags..."
          />
        </div>
      </div>

      <div className="flex space-x-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
        {['Photography', 'Art', 'Design', 'Nature', 'Architecture', 'Fashion', 'Travel'].map((tag) => (
          <button
            key={tag}
            onClick={() => setSearchQuery(tag)}
            className="px-6 py-2 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 whitespace-nowrap hover:border-purple-500 hover:text-purple-500 transition-colors font-medium shadow-sm"
          >
            {tag}
          </button>
        ))}
      </div>

      {filteredPosts.length > 0 ? (
        <MasonryGrid 
          posts={filteredPosts} 
          onLoadMore={loadMorePosts} 
          hasMore={hasMore && !searchQuery} 
          loadingMore={loadingMore} 
        />
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">No results found</h2>
          <p className="text-gray-500">Try searching for something else.</p>
        </div>
      )}
    </motion.div>
  );
};
