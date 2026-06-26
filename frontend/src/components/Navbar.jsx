import React from 'react';
import { Search, Sun, Moon, LogOut, Upload, User, Menu } from 'lucide-react';

export default function Navbar({ search, setSearch, onUploadClick, onLogout, isDarkMode, setIsDarkMode, onMenuClick }) {
  const username = localStorage.getItem('username') || 'Library User';

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="h-20 border-b border-slate-200/60 dark:border-slate-800/40 px-6 flex items-center justify-between bg-white/60 dark:bg-dark-900/40 backdrop-blur-md sticky top-0 z-30 transition-all duration-300">
      
      {/* Search Input */}
      <div className="relative w-full max-w-md flex items-center">
        {/* Mobile Menu Toggle Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 mr-3 bg-white dark:bg-dark-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors shadow-sm"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, artist, album, genre..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-dark-950/80 border border-slate-200/60 dark:border-slate-800/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Upload Button */}
        <button
          onClick={onUploadClick}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-violet-500/10 active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Song</span>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-dark-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors shadow-sm"
          title="Toggle Light/Dark Mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
        </button>

        {/* User Badge */}
        <div className="h-10 border-r border-slate-200 dark:border-slate-800 hidden md:block"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold shadow-inner">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Logged In</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{username}</p>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all ml-1"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>

    </header>
  );
}
