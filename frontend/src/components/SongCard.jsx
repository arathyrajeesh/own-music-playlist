import React, { useState } from 'react';
import { API_BASE_URL } from '../api';
import { Play, Pause, Heart, Plus, Trash2, MoreVertical, Disc, Music } from 'lucide-react';

export default function SongCard({
  song,
  currentSongId,
  isPlaying,
  onPlay,
  onFavoriteToggle,
  favorites,
  playlists,
  onAddToPlaylist,
  onDelete
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const isCurrent = song.id === currentSongId;
  const isFavorited = favorites.some((id) => id === song.id);

  // Time format helper
  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const handlePlaylistClick = (playlistId) => {
    onAddToPlaylist(playlistId, song.id);
    setShowDropdown(false);
  };

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-zinc-950 border transition-all duration-300 group flex flex-col relative select-none ${
      isCurrent 
        ? 'border-green-500 shadow-lg shadow-green-500/20 dark:shadow-green-500/5 bg-green-50/30 dark:bg-green-950/10' 
        : 'border-slate-200/80 dark:border-zinc-800/60 shadow-md shadow-slate-200 dark:shadow-none hover:shadow-xl hover:shadow-slate-300/60 dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700/80 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 hover:-translate-y-0.5'
    }`}>
      
      {/* Album Cover Container */}
      <div className="aspect-square w-full rounded-xl bg-slate-50 dark:bg-black border border-slate-200/50 dark:border-zinc-800/50 overflow-hidden relative mb-4 shrink-0 flex items-center justify-center">
        {song.cover_image ? (
          <img 
            src={getAbsoluteUrl(song.cover_image)} 
            alt={song.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <Music className="w-12 h-12 text-slate-400 dark:text-slate-600" />
        )}

        {/* Hover / Active Overlay */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 flex items-center justify-center gap-3 ${
          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {isCurrent && isPlaying ? (
            <button
              onClick={() => onPlay(song, false)}
              className="w-12 h-12 bg-white text-green-600 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              title="Pause"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => onPlay(song, true)}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              title="Play"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          )}
        </div>

        {/* Floating Duration */}
        <span className="absolute bottom-2.5 right-2.5 px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white tracking-wider">
          {formatDuration(song.duration)}
        </span>
      </div>

      {/* Track Details */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-snug flex-1" title={song.title}>
            {song.title}
          </p>
          
          {/* Dropdown Action Trigger */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl py-1 z-20 text-slate-700 dark:text-slate-300 text-xs">
                  <p className="px-3 py-1.5 font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800">Add to Playlist</p>
                  
                  {playlists.length === 0 ? (
                    <p className="px-3 py-2 text-slate-400 dark:text-slate-500 italic">No playlists</p>
                  ) : (
                    playlists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => handlePlaylistClick(pl.id)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors truncate block"
                      >
                        {pl.name}
                      </button>
                    ))
                  )}

                  <div className="border-t border-slate-100 dark:border-zinc-800 my-1"></div>
                  <button
                    onClick={() => {
                      onDelete(song.id);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Track</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={song.artist}>
          {song.artist}
        </p>

        {/* Meta Pills (Album / Genre) */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {song.genre && (
            <span className="text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-black text-slate-500 dark:text-slate-400 rounded-full font-semibold border border-slate-200/20">
              {song.genre}
            </span>
          )}
          {song.album && (
            <span className="text-[10px] px-2 py-0.5 bg-green-500/5 text-green-600 dark:text-green-400 rounded-full font-semibold border border-green-500/10 truncate max-w-[120px]" title={song.album}>
              {song.album}
            </span>
          )}
        </div>
      </div>

      {/* Floating favorite overlay trigger */}
      <button
        onClick={() => onFavoriteToggle(song.id)}
        className={`absolute top-6 right-6 p-2 rounded-xl transition-all duration-300 shadow-md ${
          isFavorited
            ? 'bg-red-500 text-white opacity-100 scale-100'
            : 'bg-white/80 dark:bg-zinc-950/80 text-slate-400 dark:text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
        }`}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className="w-3.5 h-3.5 fill-current" />
      </button>

    </div>
  );
}
