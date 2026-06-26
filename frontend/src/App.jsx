import React, { useState, useEffect } from 'react';
import api from './api';
import AuthModal from './components/AuthModal';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MusicPlayer from './components/MusicPlayer';
import UploadModal from './components/UploadModal';
import PlaylistModal from './components/PlaylistModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
  
  // App Data states
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]); // List of favorited song IDs
  
  // Player states
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [playQueue, setPlayQueue] = useState([]); // Currently active queue list

  // Navigation states
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [triggerReload, setTriggerReload] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Sync theme class on mount
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch initial playlists and favorites upon authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
      fetchFavorites();
    }
  }, [isAuthenticated, triggerReload]);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get('/api/playlists/');
      setPlaylists(res.data);
    } catch (err) {
      console.error('Error fetching playlists:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/api/favorites/');
      // Map favorite objects to just song IDs for faster lookup
      const ids = res.data.map(item => item.song).filter(Boolean);
      setFavorites(ids);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setTriggerReload(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    
    // Clear all user states
    setSongs([]);
    setPlaylists([]);
    setFavorites([]);
    setCurrentSong(null);
    setIsPlaying(false);
    setPlayQueue([]);
    setActiveFilter('all');
    setSearch('');
  };

  // Favorite/unfavorite song toggle handler
  const handleFavoriteToggle = async (songId) => {
    try {
      const res = await api.post('/api/favorites/', { song: songId });
      if (res.data.status === 'unfavorited') {
        setFavorites(prev => prev.filter(id => id !== songId));
      } else {
        setFavorites(prev => [...prev, songId]);
      }
      setTriggerReload(prev => prev + 1);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Create playlist
  const handleCreatePlaylist = async (name) => {
    try {
      const res = await api.post('/api/playlists/', { name });
      setPlaylists(prev => [res.data, ...prev]);
      setActiveFilter(`playlist-${res.data.id}`);
      setTriggerReload(prev => prev + 1);
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  // Add song to playlist
  const handleAddToPlaylist = async (playlistId, songId) => {
    try {
      await api.post(`/api/playlists/${playlistId}/add-song/`, { song_id: songId });
      setTriggerReload(prev => prev + 1);
    } catch (err) {
      console.error('Error adding song to playlist:', err);
    }
  };

  // Delete song
  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Are you sure you want to delete this track?')) return;
    try {
      await api.delete(`/api/songs/${songId}/`);
      if (currentSong?.id === songId) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
      setTriggerReload(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting song:', err);
    }
  };

  // Delete playlist
  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await api.delete(`/api/playlists/${playlistId}/`);
      setActiveFilter('all');
      setTriggerReload(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting playlist:', err);
    }
  };

  // Music Player Core handlers
  const handlePlaySong = (song, startPlaying = true) => {
    setCurrentSong(song);
    setIsPlaying(startPlaying);
    
    // Set the play queue to match the current list of songs viewed
    setPlayQueue(songs);
  };

  const playNext = () => {
    if (playQueue.length === 0) return;

    let nextIndex = 0;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * playQueue.length);
    } else if (currentSong) {
      const currentIndex = playQueue.findIndex(s => s.id === currentSong.id);
      if (currentIndex !== -1 && currentIndex < playQueue.length - 1) {
        nextIndex = currentIndex + 1;
      } else {
        // Wrap around to start of queue
        nextIndex = 0;
      }
    }

    setCurrentSong(playQueue[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (playQueue.length === 0 || !currentSong) return;

    const currentIndex = playQueue.findIndex(s => s.id === currentSong.id);
    let prevIndex = 0;

    if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    } else {
      // Wrap around to end of queue
      prevIndex = playQueue.length - 1;
    }

    setCurrentSong(playQueue[prevIndex]);
    setIsPlaying(true);
  };

  if (!isAuthenticated) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-dark-950 transition-colors duration-300">
      
      {/* Sidebar navigation */}
      <Sidebar
        playlists={playlists}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onCreatePlaylistClick={() => setShowPlaylistModal(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar
          search={search}
          setSearch={setSearch}
          onUploadClick={() => setShowUploadModal(true)}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <Dashboard
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          search={search}
          songs={songs}
          setSongs={setSongs}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlay={handlePlaySong}
          onFavoriteToggle={handleFavoriteToggle}
          favorites={favorites}
          playlists={playlists}
          onAddToPlaylist={handleAddToPlaylist}
          onDeleteSong={handleDeleteSong}
          onDeletePlaylist={handleDeletePlaylist}
          triggerReload={triggerReload}
        />
      </div>

      {/* Bottom Audio Player Bar */}
      <MusicPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        playNext={playNext}
        playPrevious={playPrevious}
        shuffle={shuffle}
        setShuffle={setShuffle}
        repeat={repeat}
        setRepeat={setRepeat}
        onFavoriteToggle={handleFavoriteToggle}
        favorites={favorites}
        playQueue={playQueue}
        activePlaylistName={
          activeFilter === 'all'
            ? 'All Tracks'
            : activeFilter === 'favorites'
            ? 'Favorites'
            : playlists.find(p => `playlist-${p.id}` === activeFilter)?.name || 'Playlist'
        }
      />

      {/* Modals overlay */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={() => setTriggerReload(prev => prev + 1)}
        />
      )}

      {showPlaylistModal && (
        <PlaylistModal
          onClose={() => setShowPlaylistModal(false)}
          onCreate={handleCreatePlaylist}
        />
      )}

    </div>
  );
}
