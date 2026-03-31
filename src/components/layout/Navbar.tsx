import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Home, Compass, PlusSquare, User, LogOut, Moon, Sun, Search, Heart, MessageCircle } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const Navbar = () => {
  const { user, profile } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
  };

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label, active, badge }: { to: string, icon: any, label: string, active?: boolean, badge?: number }) => (
    <Link to={to} className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors ${active ? 'font-bold' : ''}`}>
      <div className="relative">
        <Icon size={28} className={active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-black">
            {badge > 9 ? '9+' : badge}
          </div>
        )}
      </div>
      <span className="hidden md:block text-lg">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <nav className="md:hidden fixed top-0 w-full z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-3xl font-instagram tracking-tighter mt-1">
          Prism
        </Link>
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun size={24} className="stroke-[1.5px]" /> : <Moon size={24} className="stroke-[1.5px]" />}
          </button>
          <Link to="/notifications" className="relative">
            <Heart size={24} className="stroke-[1.5px]" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-black" />
            )}
          </Link>
          <Link to="/messages">
            <MessageCircle size={24} className="stroke-[1.5px]" />
          </Link>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed top-0 left-0 h-screen w-64 z-50 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex-col py-8 px-4">
        <Link to="/" className="text-4xl font-instagram tracking-tighter mb-10 px-3 mt-2">
          Prism
        </Link>
        <div className="flex flex-col space-y-2 flex-1">
          <NavItem to="/" icon={Home} label="Home" active={isActive('/')} />
          <NavItem to="/explore" icon={Search} label="Search" active={isActive('/explore')} />
          <NavItem to="/explore" icon={Compass} label="Explore" />
          <NavItem to="/messages" icon={MessageCircle} label="Messages" active={isActive('/messages')} />
          <NavItem to="/notifications" icon={Heart} label="Notifications" active={isActive('/notifications')} badge={unreadCount} />
          <NavItem to="/upload" icon={PlusSquare} label="Create" active={isActive('/upload')} />
          
          {user ? (
            <Link to={`/profile/${user.uid}`} className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors ${isActive(`/profile/${user.uid}`) ? 'font-bold' : ''}`}>
              <img
                src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                alt="Profile"
                className={`w-7 h-7 rounded-full object-cover ${isActive(`/profile/${user.uid}`) ? 'border-2 border-black dark:border-white' : ''}`}
              />
              <span className="hidden md:block text-lg">Profile</span>
            </Link>
          ) : (
            <NavItem to="/auth" icon={User} label="Profile" active={isActive('/auth')} />
          )}
        </div>
        
        <div className="flex flex-col space-y-2 mt-auto">
          <button onClick={() => setIsDark(!isDark)} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors w-full text-left">
            {isDark ? <Sun size={28} className="stroke-[1.5px]" /> : <Moon size={28} className="stroke-[1.5px]" />}
            <span className="hidden md:block text-lg">Switch Theme</span>
          </button>
          {user && (
            <button onClick={handleLogout} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors w-full text-left text-red-500">
              <LogOut size={28} className="stroke-[1.5px]" />
              <span className="hidden md:block text-lg">Log out</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 px-6 h-12 flex items-center justify-between pb-safe">
        <Link to="/">
          <Home size={28} className={isActive('/') ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
        </Link>
        <Link to="/explore">
          <Search size={28} className={isActive('/explore') ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
        </Link>
        <Link to="/upload">
          <PlusSquare size={28} className={isActive('/upload') ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
        </Link>
        {user ? (
          <Link to={`/profile/${user.uid}`}>
            <img
              src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
              alt="Profile"
              className={`w-7 h-7 rounded-full object-cover ${isActive(`/profile/${user.uid}`) ? 'border-2 border-black dark:border-white' : ''}`}
            />
          </Link>
        ) : (
          <Link to="/auth">
            <User size={28} className={isActive('/auth') ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
          </Link>
        )}
      </nav>
    </>
  );
};
