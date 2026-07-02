import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api';
import SongCard from './SongCard';
import { Play, Filter, RefreshCw, Trash2, ListMusic, Music, History } from 'lucide-react';

export default function Dashboard({
  activeFilter,
  setActiveFilter,
  search,
  songs,
  setSongs,
  currentSong,
  isPlaying,
  onPlay,
  onFavoriteToggle,
  favorites,
  playlists,
  onAddToPlaylist,
  onDeleteSong,
  onDeletePlaylist,
  triggerReload
}) {
  const [filterData, setFilterData] = useState({ artists: [], albums: [], genres: [] });
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  
  const [recentPlays, setRecentPlays] = useState([]);
  const [playlistDetail, setPlaylistDetail] = useState(null);

  // Fetch filter options (artists, albums, genres)
  const fetchFilters = async () => {
    try {
      const res = await api.get('/api/songs/filters/');
      setFilterData(res.data);
    } catch (err) {
      console.error('Failed to fetch filters:', err);
    }
  };

  // Fetch recently played songs
  const fetchRecentPlays = async () => {
    try {
      const res = await api.get('/api/history/');
      setRecentPlays(res.data);
    } catch (err) {
      console.error('Failed to fetch play history:', err);
    }
  };

  // Fetch songs based on active filter, search, and selected dropdown filters
  const fetchSongs = async () => {
    try {
      let url = '/api/songs/';
      const params = {};

      if (search) params.search = search;

      if (activeFilter === 'all') {
        if (selectedArtist) params.artist = selectedArtist;
        if (selectedAlbum) params.album = selectedAlbum;
        if (selectedGenre) params.genre = selectedGenre;
      } else if (activeFilter === 'favorites') {
        url = '/api/favorites/';
      } else if (activeFilter.startsWith('playlist-')) {
        const id = activeFilter.split('-')[1];
        url = `/api/playlists/${id}/`;
      }

      const res = await api.get(url, { params });
      
      if (activeFilter === 'all') {
        setSongs(res.data);
        setPlaylistDetail(null);
      } else if (activeFilter === 'favorites') {
        // favorites API returns { id, song_details: {...} }
        const mapped = res.data.map(item => item.song_details).filter(Boolean);
        setSongs(mapped);
        setPlaylistDetail(null);
      } else if (activeFilter.startsWith('playlist-')) {
        // playlist detail API returns { id, name, songs: [...] }
        setSongs(res.data.songs || []);
        setPlaylistDetail(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch songs:', err);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, [activeFilter, search, selectedArtist, selectedAlbum, selectedGenre, triggerReload]);

  useEffect(() => {
    fetchFilters();
    fetchRecentPlays();
  }, [songs.length, triggerReload]);

  // Handle playing song from history row
  const handleHistoryPlay = (song) => {
    onPlay(song, true);
  };

  const clearFilters = () => {
    setSelectedArtist('');
    setSelectedAlbum('');
    setSelectedGenre('');
  };

  const getAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-8 bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* 1. Recently Played Pane (if available) */}
      {recentPlays.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <History className="w-5 h-5 text-green-500" />
            <h4 className="text-base font-bold tracking-tight">Recently Played</h4>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {recentPlays.map((entry) => {
              const s = entry.song_details;
              if (!s) return null;
              return (
                <div 
                  key={entry.id}
                  onClick={() => handleHistoryPlay(s)}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl hover:shadow-md cursor-pointer transition-all shrink-0 w-60 group text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-black border overflow-hidden shrink-0 flex items-center justify-center relative">
                    {s.cover_image ? (
                      <img src={getAbsoluteUrl(s.cover_image)} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                      <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                    </span>
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-green-500 transition-colors">{s.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{s.artist}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Filter Bar (Only shown on 'All Songs' view) */}
      {activeFilter === 'all' && (
        <section className="p-4 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/60 rounded-2xl flex flex-wrap gap-4 items-end shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-auto py-1">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>

          {/* Artist Select */}
          <div className="flex-1 min-w-[150px] text-left">
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1.5">Artist</label>
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-green-500"
            >
              <option value="">All Artists</option>
              {filterData.artists.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Album Select */}
          <div className="flex-1 min-w-[150px] text-left">
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1.5">Album</label>
            <select
              value={selectedAlbum}
              onChange={(e) => setSelectedAlbum(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-green-500"
            >
              <option value="">All Albums</option>
              {filterData.albums.map((al) => <option key={al} value={al}>{al}</option>)}
            </select>
          </div>

          {/* Genre Select */}
          <div className="flex-1 min-w-[150px] text-left">
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1.5">Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-green-500"
            >
              <option value="">All Genres</option>
              {filterData.genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Clear Button */}
          {(selectedArtist || selectedAlbum || selectedGenre) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </section>
      )}

      {/* 3. Main Catalog View */}
      <section className="space-y-5">
        
        {/* Header Title / actions */}
        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50 pb-4">
          <div className="text-left">
            <h2 className="text-2xl font-bold tracking-tight">
              {activeFilter === 'all' && 'All Songs'}
              {activeFilter === 'favorites' && 'Favorite Songs'}
              {activeFilter.startsWith('playlist-') && (playlistDetail?.name || 'Playlist')}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">
              {songs.length} {songs.length === 1 ? 'track' : 'tracks'} available
            </p>
          </div>

          {/* Playlist Delete Trigger */}
          {activeFilter.startsWith('playlist-') && playlistDetail && (
            <button
              onClick={() => onDeletePlaylist(playlistDetail.id)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Playlist</span>
            </button>
          )}
        </div>

        {/* Songs Grid */}
        {songs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-5">
              <ListMusic className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No tracks found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {activeFilter === 'all'
                ? "Your library doesn't contain any songs matching the filters. Try clearing filters or upload your first song!"
                : activeFilter === 'favorites'
                ? "You haven't favorited any songs yet. Click the heart icon on any song card to add it here!"
                : "This playlist is empty. Add songs by clicking the triple dot menu on any song card."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                currentSongId={currentSong?.id}
                isPlaying={isPlaying}
                onPlay={onPlay}
                onFavoriteToggle={onFavoriteToggle}
                favorites={favorites}
                playlists={playlists}
                onAddToPlaylist={onAddToPlaylist}
                onDelete={onDeleteSong}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
