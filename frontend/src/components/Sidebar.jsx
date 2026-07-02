import React from 'react';
import { Music, Heart, Plus, ListMusic, Disc, Headphones, Upload, User, LogOut, Sun, Moon } from 'lucide-react';

export default function Sidebar({ playlists, activeFilter, setActiveFilter, onCreatePlaylistClick, onUploadClick, onLogout, isDarkMode, setIsDarkMode, isOpen, onClose }) {
  const username = localStorage.getItem('username') || 'Library User';

  const handleSelectFilter = (filter) => {
    setActiveFilter(filter);
    if (onClose) onClose();
  };

  const handleCreatePlaylistClick = () => {
    onCreatePlaylistClick();
    if (onClose) onClose();
  };

  const handleUploadSongClick = () => {
    onUploadClick();
    if (onClose) onClose();
  };

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
    <>
      {/* Mobile drawer backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-slate-200/80 dark:border-zinc-800/60 bg-white dark:bg-zinc-950/90 h-screen flex flex-col transition-all duration-300 shrink-0 select-none md:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        
        {/* Brand Logo */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-200/60 dark:border-zinc-800/40">
          <div className="w-10 h-10 bg-gradient-to-tr from-green-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">Own Music</h1>
            <span className="text-[10px] text-green-500 dark:text-green-400 font-bold uppercase tracking-widest mt-1 block">Library App</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-7">

          {/* Mobile Upload Button */}
          <div className="md:hidden px-1 mb-2">
            <button
              onClick={handleUploadSongClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-500 hover:to-yellow-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-green-500/10 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Song</span>
            </button>
          </div>
          
          {/* Discover Section */}
          <div className="space-y-2">
            <p className="px-3 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Discover</p>
            <div className="space-y-1">
              <button
                onClick={() => handleSelectFilter('all')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  activeFilter === 'all'
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>All Tracks</span>
              </button>

              <button
                onClick={() => handleSelectFilter('favorites')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  activeFilter === 'favorites'
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </button>
            </div>
          </div>

          {/* Playlists Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Playlists</p>
              <button
                onClick={handleCreatePlaylistClick}
                className="p-1 rounded-md text-slate-400 hover:text-green-500 hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-all"
                title="Create New Playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 max-h-[30vh] overflow-y-auto pr-1">
              {playlists.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400 dark:text-slate-600 italic">No playlists created</p>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleSelectFilter(`playlist-${playlist.id}`)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition-all group ${
                      activeFilter === `playlist-${playlist.id}`
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/10'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <ListMusic className="w-4 h-4 shrink-0" />
                      <span className="truncate">{playlist.name}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeFilter === `playlist-${playlist.id}`
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-dark-700'
                    }`}>
                      {playlist.songs_count || playlist.songs?.length || 0}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer: Profile on mobile / tagline on desktop */}
        <div className="border-t border-slate-200/60 dark:border-zinc-800/40">

          {/* Mobile Profile Section */}
          <div className="md:hidden p-4 space-y-3">
            {/* User Info Row */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-yellow-500 flex items-center justify-center shadow-md shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Logged In</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{username}</p>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all hover:bg-slate-50 dark:hover:bg-dark-700 active:scale-95"
              >
                {isDarkMode
                  ? <><Sun className="w-4 h-4 text-amber-500" /><span>Light Mode</span></>
                  : <><Moon className="w-4 h-4 text-yellow-500" /><span>Dark Mode</span></>}
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold transition-all active:scale-95"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Desktop Footer Tagline */}
          <div className="hidden md:flex p-4 bg-slate-50/50 dark:bg-black/20 items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Disc className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Listening is everything</span>
          </div>

        </div>

      </aside>
    </>
  );
}
