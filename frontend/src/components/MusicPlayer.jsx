import React, { useRef, useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Repeat, Shuffle, Heart, Disc, Music
} from 'lucide-react';
import MobileNowPlaying from './MobileNowPlaying';

export default function MusicPlayer({
  currentSong,
  isPlaying,
  setIsPlaying,
  playNext,
  playPrevious,
  shuffle,
  setShuffle,
  repeat,
  setRepeat,
  onFavoriteToggle,
  favorites,
  playQueue,
  activePlaylistName
}) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Monitor screen size for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsExpanded(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Auto-expand on new song selection on mobile
  useEffect(() => {
    if (isMobile && currentSong) {
      setIsExpanded(true);
    }
  }, [currentSong?.id]);

  const isFavorited = currentSong ? favorites.some(id => id === currentSong.id) : false;

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync play/pause with isPlaying prop
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Audio play failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong?.id]);

  // Log track history on new song playback
  useEffect(() => {
    if (currentSong?.id && isPlaying) {
      api.post('/api/history/', { song: currentSong.id })
        .catch(err => console.error('Failed to log play history:', err));
    }
  }, [currentSong?.id, isPlaying]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setTrackDuration(audioRef.current.duration || currentSong?.duration || 0);
      // Auto play on song change
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleAudioEnded = () => {
    if (repeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      playNext();
    }
  };

  const togglePlay = () => {
    if (!currentSong) return;
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume || 0.8);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  };

  const handleVolumeSlider = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) {
      setIsMuted(false);
    }
  };

  // Helper: format time in mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Absolute URL helper
  const getAbsoluteUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path}`;
  };

  if (!currentSong) return null;

  if (isMobile) {
    return (
      <>
        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={getAbsoluteUrl(currentSong.file)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
        />

        {isExpanded ? (
          <MobileNowPlaying
            currentSong={currentSong}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playNext={playNext}
            playPrevious={playPrevious}
            currentTime={currentTime}
            trackDuration={trackDuration}
            handleSeek={handleSeek}
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            toggleMute={toggleMute}
            shuffle={shuffle}
            setShuffle={setShuffle}
            playQueue={playQueue}
            getAbsoluteUrl={getAbsoluteUrl}
            activePlaylistName={activePlaylistName}
            onClose={() => setIsExpanded(false)}
          />
        ) : (
          <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-dark-900/95 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-4 flex items-center justify-between z-40 transition-colors duration-300 shadow-xl">
            {/* Left: Info area (Tapping it expands the player) */}
            <div
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                {currentSong.cover_image ? (
                  <img
                    src={getAbsoluteUrl(currentSong.cover_image)}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                )}
              </div>
              <div className="truncate pr-4">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentSong.title}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{currentSong.artist}</p>
              </div>
            </div>

            {/* Right: controls (Play/Pause, Next) */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={togglePlay}
                className="w-8 h-8 bg-violet-500 hover:bg-violet-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all"
              >
                {isPlaying ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5 fill-current ml-0.5" />}
              </button>
              <button
                onClick={playNext}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-24 bg-white/95 dark:bg-dark-900/95 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between z-40 transition-colors duration-300 shadow-xl">

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={getAbsoluteUrl(currentSong.file)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Left Pane: Song Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
        <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
          {currentSong.cover_image ? (
            <img
              src={getAbsoluteUrl(currentSong.cover_image)}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music className="w-6 h-6 text-slate-400 dark:text-slate-600" />
          )}
          {isPlaying && (
            <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Disc className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '3s' }} />
            </span>
          )}
        </div>
        <div className="truncate text-left">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentSong.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{currentSong.artist}</p>
        </div>

        {/* Favorite Toggle */}
        <button
          onClick={() => onFavoriteToggle(currentSong.id)}
          className={`p-2 rounded-xl transition-all ml-1 ${isFavorited
              ? 'text-red-500 hover:text-red-600 bg-red-500/10'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800'
            }`}
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Center Pane: Player Controls */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
        <div className="flex items-center gap-5">
          {/* Shuffle */}
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`p-1.5 rounded-lg transition-all ${shuffle
                ? 'text-violet-500 bg-violet-500/10'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={playPrevious}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
            title="Previous"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-violet-500 hover:bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-violet-500/20 active:scale-90 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
            title="Next"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Repeat */}
          <button
            onClick={() => setRepeat(!repeat)}
            className={`p-1.5 rounded-lg transition-all ${repeat
                ? 'text-violet-500 bg-violet-500/10'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Slider */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={trackDuration || 1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1"
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold w-8 text-left">
            {formatTime(trackDuration)}
          </span>
        </div>
      </div>

      {/* Right Pane: Volume Controls */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        <button
          onClick={toggleMute}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg"
        >
          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeSlider}
          className="w-24 accent-violet-500"
        />
      </div>

    </div>
  );
}
