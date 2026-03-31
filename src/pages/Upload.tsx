import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { createPost } from '../lib/db';
import { getSupabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

export const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  } as any);

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setProgress(0);
    
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`;

      // Upload to Supabase Storage
      const supabase = getSupabase();
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Simple dominant color extraction (mocked for now)
      const dominantColor = ['#ff7eb3', '#ff758c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'][Math.floor(Math.random() * 6)];

      await createPost({
        authorId: user.uid,
        imageUrl: publicUrl,
        caption,
        dominantColor,
        likesCount: 0,
        commentsCount: 0,
      });

      setUploading(false);
      navigate('/');
    } catch (err: any) {
      console.error('Error starting upload:', err);
      setUploading(false);
      
      if (err.message === 'Bucket not found' || err.message.includes('Bucket not found')) {
        alert('Supabase Bucket Not Found!\n\nPlease go to your Supabase Dashboard:\n1. Click "Storage" on the left menu.\n2. Click "New Bucket".\n3. Name it exactly "images".\n4. Toggle "Public bucket" to ON.\n5. Click Save and try uploading again.');
      } else {
        alert(`Failed to upload: ${err.message}. Please ensure you have configured Supabase URL and Anon Key in the environment variables, and created a public 'images' bucket.`);
      }
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Sign in to upload</h2>
        <button onClick={() => navigate('/auth')} className="px-6 py-2 bg-purple-500 text-white rounded-full">Sign In</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-8"
    >
      <div className="bg-white dark:bg-[#111] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold mx-auto">Create new post</h2>
          {preview && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="absolute right-8 text-blue-500 font-semibold hover:text-blue-600 disabled:opacity-50"
            >
              {uploading ? 'Sharing...' : 'Share'}
            </button>
          )}
        </div>

        <div className="p-0 md:p-6">
          {!preview ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors m-6 ${
                isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <ImageIcon size={64} className="text-gray-400" />
                <p className="text-xl font-medium">Drag photos and videos here</p>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                  Select from computer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full md:h-[500px]">
              <div className="w-full md:w-3/5 relative bg-gray-100 dark:bg-gray-900 flex items-center justify-center border-r border-gray-200 dark:border-gray-800">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="w-full md:w-2/5 flex flex-col bg-white dark:bg-[#111]">
                <div className="flex items-center space-x-3 p-4 border-b border-gray-200 dark:border-gray-800">
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-semibold">{user.displayName || 'User'}</span>
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full flex-1 p-4 bg-transparent border-none focus:ring-0 outline-none resize-none text-base"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
