import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  ChevronDown,
  Music,
  Airplay
} from "lucide-react";

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
  const progressPercent = trackDuration ? (currentTime / trackDuration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <div className="absolute inset-0">
        <img
          src={getAbsoluteUrl(currentSong.cover_image)}
          className="w-full h-full object-cover blur-3xl scale-125 opacity-40"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      {/* 1. Header Area */}
      <header className="flex justify-between items-center px-6 pt-8">

        <button onClick={onClose}>
          <ChevronDown />
        </button>

        <div className="text-center">

          <p className="text-xs uppercase text-white/50">
            Playing From
          </p>

          <h3 className="font-bold">
            My Library
          </h3>

        </div>

        <button>
          ⋮
        </button>

      </header>

      {/* 2. Cover Flow Carousel Area */}
      <main className="flex-1 flex flex-col justify-center items-center w-full my-4 relative">

        {/* Carousel Cards Stack */}
        <div className="relative h-[340px] flex items-center justify-center">

          {displayedSongs.map(({ song, offset }) => (

            <div
              key={song.id}
              className="absolute transition-all duration-500"
              style={{
                transform: `
perspective(1000px)
translateX(${offset * 95}px)
rotateY(${offset * -30}deg)
scale(${offset === 0 ? 1 : 0.75})
`,
                zIndex: 100 - Math.abs(offset),
                opacity: offset === 0 ? 1 : 0.5
              }}
            >

              <div className="w-64 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl shadow-2xl">

                <img
                  src={getAbsoluteUrl(song.cover_image)}
                  alt={song.title}
                  className="w-full h-64 object-cover"
                />

                <div className="text-center mt-8">

                  <h2 className="text-3xl font-bold">
                    {currentSong.title}
                  </h2>

                  <p className="text-white/60">
                    {currentSong.artist}
                  </p>

                </div>
                {/* Progress */}
                <div className="w-full max-w-sm mx-auto mt-8 px-6">

                  <input
                    type="range"
                    min={0}
                    max={trackDuration || 1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-green-500"
                    style={{
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e ${progressPercent}%, rgba(255, 255, 255, 0.25) ${progressPercent}%, rgba(255, 255, 255, 0.25) 100%)`
                    }}
                  />

                  <div className="flex justify-between text-xs text-white/70 mt-2">

                    <span>{formatTime(currentTime)}</span>

                    <span>{formatTime(trackDuration)}</span>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

        {/* Playlist description subtitle */}
        <p className="text-[11px] text-white/50 px-6 mt-8 sm:mt-12 text-center max-w-sm font-medium tracking-wide leading-relaxed">
          {subtitle}
        </p>

      </main>

      {/* 3. Floating Glassmorphic Player Controller */}
      <footer className="pb-10 px-6">

        <div className="flex justify-center items-center gap-8 mt-8">

          <button
            onClick={() => setShuffle(!shuffle)}
            className={`${shuffle ? "text-green-400" : "text-white/70"}`}
          >
            <Shuffle className="w-6 h-6" />
          </button>

          <button onClick={playPrevious}>
            <SkipBack className="w-7 h-7" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1 fill-current" />
            )}
          </button>

          <button onClick={playNext}>
            <SkipForward className="w-7 h-7" />
          </button>

          <button>
            <Repeat className="w-6 h-6" />
          </button>

        </div>
        {/* Glass Bottom Bar */}

        <div
          className="
    mt-8
    mx-auto
    max-w-sm
    rounded-full
    bg-white/10
    backdrop-blur-xl
    border
    border-white/10
    px-6
    py-4
    flex
    justify-around
    items-center
    shadow-2xl
">

          <button onClick={toggleMute}>
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>

          <button>
            <Airplay className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => setShuffle(!shuffle)}
          >
            <Shuffle
              className={`w-6 h-6 ${shuffle ? "text-green-400" : "text-white"
                }`}
            />
          </button>

        </div>
      </footer>

    </div>
  );
}
