import React from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, 
  Volume2, VolumeX, ChevronDown, Music, Airplay 
} from 'lucide-react';

export default function MobileNowPlaying({
  currentSong,
  isPlaying,
  setIsPlaying,
  playNext,
  playPrevious,
  currentTime,
  trackDuration,
  handleSeek,
  volume,
  setVolume,
  isMuted,
  toggleMute,
  shuffle,
  setShuffle,
  playQueue = [],
  getAbsoluteUrl,
  activePlaylistName,
  onClose
}) {
  
  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find 3D cover flow displayed cards
  const getDisplayedSongs = () => {
    if (!playQueue || playQueue.length === 0) {
      return [{ song: currentSong, offset: 0, index: 0 }];
    }
    
    const currentIndex = playQueue.findIndex(s => s.id === currentSong.id);
    if (currentIndex === -1) {
      return [{ song: currentSong, offset: 0, index: 0 }];
    }

    const N = playQueue.length;
    
    if (N === 1) {
      return [{ song: playQueue[0], offset: 0, index: 0 }];
    }
    
    if (N === 2) {
      const otherIndex = (currentIndex + 1) % 2;
      return [
        { song: playQueue[otherIndex], offset: -1, index: otherIndex },
        { song: playQueue[currentIndex], offset: 0, index: currentIndex }
      ];
    }

    if (N === 3) {
      const prev = (currentIndex - 1 + 3) % 3;
      const next = (currentIndex + 1) % 3;
      return [
        { song: playQueue[prev], offset: -1, index: prev },
        { song: playQueue[currentIndex], offset: 0, index: currentIndex },
        { song: playQueue[next], offset: 1, index: next }
      ];
    }

    // N >= 4, show up to 5 cards centered around currentIndex
    const offsets = [-2, -1, 0, 1, 2];
    const items = [];
    const seenIndices = new Set();

    for (const offset of offsets) {
      const idx = (currentIndex + offset + N * 2) % N;
      if (seenIndices.has(idx)) continue;
      seenIndices.add(idx);
      items.push({
        song: playQueue[idx],
        offset,
        index: idx
      });
    }

    return items.sort((a, b) => a.offset - b.offset);
  };

  // Seek handler for clicking the mini progress bar
  const handleProgressClick = (e) => {
    if (!trackDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    const seekTime = percentage * trackDuration;
    handleSeek({ target: { value: seekTime } });
  };

  const displayedSongs = getDisplayedSongs();

  // Dynamically determine the subtitle playlist description
  const subtitle = activePlaylistName || "List lagu yang sekali denger langsung suka, dijamin :D";

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#3a3962] via-[#211f3d] to-[#121021] text-white p-6 transition-transform duration-300 ease-out select-none"
      style={{ touchAction: 'none' }}
    >
      
      {/* 1. Header Area */}
      <header className="flex items-center justify-between w-full h-12">
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/80"
          title="Minimize"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-[10px] tracking-[0.25em] font-bold uppercase text-white/40">Now Playing</p>
          <p className="text-xs font-semibold text-white/80 truncate max-w-[180px] mt-0.5">
            {activePlaylistName || "My Library"}
          </p>
        </div>
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </header>

      {/* 2. Cover Flow Carousel Area */}
      <main className="flex-1 flex flex-col justify-center items-center w-full my-4 relative">
        
        {/* Carousel Cards Stack */}
        <div className="relative w-full h-72 sm:h-80 flex items-center justify-center overflow-visible">
          {displayedSongs.map(({ song, offset }) => {
            const isCenter = offset === 0;
            
            // Generate exact 3D positioning styles depending on offset
            let style = {};
            let transformClass = "";
            let opacityClass = "";
            let zIndexClass = "";

            if (offset === 0) {
              transformClass = "scale-100 translate-x-0 rotate-0";
              opacityClass = "opacity-100";
              zIndexClass = "z-30";
            } else if (offset === -1) {
              transformClass = "scale-[0.82] -translate-x-[42%] -rotate-[6deg]";
              opacityClass = "opacity-75";
              zIndexClass = "z-20";
            } else if (offset === 1) {
              transformClass = "scale-[0.82] translate-x-[42%] rotate-[6deg]";
              opacityClass = "opacity-75";
              zIndexClass = "z-20";
            } else if (offset === -2) {
              transformClass = "scale-[0.66] -translate-x-[75%] -rotate-[12deg]";
              opacityClass = "opacity-35";
              zIndexClass = "z-10";
            } else if (offset === 2) {
              transformClass = "scale-[0.66] translate-x-[75%] rotate-[12deg]";
              opacityClass = "opacity-35";
              zIndexClass = "z-10";
            }

            return (
              <div
                key={song.id}
                className={`absolute w-52 h-[270px] sm:w-56 sm:h-[290px] rounded-[24px] bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-2xl p-3 flex flex-col transition-all duration-500 ease-in-out cursor-pointer origin-bottom ${transformClass} ${opacityClass} ${zIndexClass}`}
                onClick={() => {
                  if (!isCenter) {
                    // Play the selected song directly if it is clicked
                    const playButton = document.querySelector(`[data-song-id="${song.id}"]`);
                    if (playButton) {
                      playButton.click();
                    }
                  }
                }}
              >
                {/* Card Artwork */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-800/80 border border-white/5 flex items-center justify-center shrink-0">
                  {song.cover_image ? (
                    <img 
                      src={getAbsoluteUrl(song.cover_image)} 
                      alt={song.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                    />
                  ) : (
                    <Music className="w-10 h-10 text-white/30" />
                  )}
                </div>

                {/* Card Text Info */}
                <div className="flex-1 flex flex-col justify-end text-center mt-3 truncate px-1">
                  <p className="text-sm font-bold text-white truncate">{song.artist || "Unknown Artist"}</p>
                  <p className="text-[11px] text-white/60 truncate mt-0.5">{song.title || "Untitled"}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Playlist description subtitle */}
        <p className="text-[11px] text-white/50 px-6 mt-8 sm:mt-12 text-center max-w-sm font-medium tracking-wide leading-relaxed">
          {subtitle}
        </p>

      </main>

      {/* 3. Floating Glassmorphic Player Controller */}
      <footer className="w-full max-w-md mx-auto mb-4 px-2 shrink-0">
        <div className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/15 dark:border-white/5 rounded-[28px] py-3.5 px-4 flex items-center justify-between shadow-2xl">
          
          {/* Left Controls: Prev, Play, Next */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={playPrevious}
              className="p-1.5 text-white/80 hover:text-white hover:scale-105 active:scale-90 transition-all"
              title="Previous"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-white text-[#211f3d] rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-lg"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current text-[#211f3d]" />
              ) : (
                <Play className="w-4 h-4 fill-current text-[#211f3d] ml-0.5" />
              )}
            </button>
            <button
              onClick={playNext}
              className="p-1.5 text-white/80 hover:text-white hover:scale-105 active:scale-90 transition-all"
              title="Next"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Center Mini Player Card widget */}
          <div className="flex-1 min-w-[130px] sm:min-w-[150px] mx-2 bg-[#121021]/80 border border-white/10 rounded-2xl p-2 flex items-center gap-2 relative overflow-hidden h-[44px]">
            {/* Tiny Art */}
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 overflow-hidden shrink-0 flex items-center justify-center">
              {currentSong.cover_image ? (
                <img 
                  src={getAbsoluteUrl(currentSong.cover_image)} 
                  alt={currentSong.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Music className="w-3.5 h-3.5 text-white/40" />
              )}
            </div>
            {/* Tiny Text Info */}
            <div className="truncate text-left leading-tight pr-2">
              <p className="text-[10px] font-bold text-white truncate">{currentSong.title}</p>
              <p className="text-[8px] text-white/50 truncate">{currentSong.artist}</p>
            </div>
            
            {/* Custom interactive progress bar at bottom of pill */}
            <div 
              onClick={handleProgressClick}
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15 cursor-pointer hover:h-[5px] transition-all"
            >
              <div 
                className="bg-white h-full transition-all duration-100"
                style={{ width: `${trackDuration ? (currentTime / trackDuration) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Right Controls: Airplay, Shuffle, Volume */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-white/80">
            <button 
              className="p-1.5 hover:text-white hover:scale-105 active:scale-90 transition-all text-white/40 cursor-default"
              title="Airplay"
            >
              <Airplay className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-1.5 hover:text-white hover:scale-105 active:scale-90 transition-all ${
                shuffle ? 'text-violet-400 font-bold' : 'text-white/60'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={toggleMute}
              className="p-1.5 hover:text-white hover:scale-105 active:scale-90 transition-all"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
}
