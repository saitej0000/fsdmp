import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'motion/react';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white dark:bg-black p-10 border border-gray-300 dark:border-gray-800"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-instagram mb-2">
            Prism
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-semibold mt-4">
            {isLogin ? '' : 'Sign up to see photos and videos from your friends.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-2">
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-2 py-2 text-sm rounded-sm bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2 py-2 text-sm rounded-sm bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 mt-4 rounded-lg bg-[#0095f6] text-white text-sm font-semibold hover:bg-[#1877f2] transition-colors"
          >
            {isLogin ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between">
          <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
          <span className="px-4 text-sm font-semibold text-gray-500">OR</span>
          <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="mt-6 w-full py-2 flex items-center justify-center space-x-2 text-[#385185] dark:text-[#E0F1FF] font-semibold text-sm hover:opacity-70 transition-opacity"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Log in with Google</span>
        </button>

        {isLogin && (
          <div className="mt-4 text-center">
            <a href="#" className="text-xs text-[#00376b] dark:text-[#E0F1FF] hover:opacity-70">Forgot password?</a>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mt-4 bg-white dark:bg-black p-6 border border-gray-300 dark:border-gray-800 text-center text-sm"
      >
        {isLogin ? "Don't have an account? " : "Have an account? "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-[#0095f6] font-semibold hover:opacity-70"
        >
          {isLogin ? 'Sign up' : 'Log in'}
        </button>
      </motion.div>
    </div>
  );
};
