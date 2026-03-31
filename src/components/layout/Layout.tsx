import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 flex flex-col md:flex-row">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0 md:ml-64 min-h-screen w-full">
        <Outlet />
      </main>
    </div>
  );
};
