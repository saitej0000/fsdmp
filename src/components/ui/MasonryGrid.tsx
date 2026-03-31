import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  dominantColor?: string;
  likesCount: number;
  commentsCount: number;
}

interface MasonryGridProps {
  posts: Post[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

const LazyImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="w-full h-full relative">
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
    </div>
  );
};

export const MasonryGrid = ({ posts, onLoadMore, hasMore, loadingMore }: MasonryGridProps) => {
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && onLoadMore) {
        onLoadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, onLoadMore]);

  return (
    <div className="flex flex-col">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 p-4">
        {posts.map((post, index) => {
          const isLast = index === posts.length - 1;
          return (
            <motion.div
              ref={isLast ? lastPostElementRef : null}
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-lg cursor-pointer mb-4 p-[2px] bg-gradient-to-br from-transparent to-transparent hover:from-purple-500 hover:to-pink-500 transition-all duration-500"
            >
              <div className="relative rounded-2xl overflow-hidden h-full w-full" style={{ backgroundColor: post.dominantColor || '#1f2937' }}>
                <Link to={`/post/${post.id}`} className="block w-full h-full">
                  <LazyImage
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="text-white text-sm line-clamp-2 mb-3">{post.caption}</p>
                    <div className="flex items-center space-x-4 text-white/90">
                      <div className="flex items-center space-x-1">
                        <Heart size={18} className="fill-current" />
                        <span className="text-sm font-medium">{post.likesCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={18} className="fill-current" />
                        <span className="text-sm font-medium">{post.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
