import React, { useState } from 'react';
import api from '../api';
import { X, Upload, Music, Image as ImageIcon, Loader2, Video, ArrowRight, Link, Globe } from 'lucide-react';

const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'm4v', '3gp'];
const isVideoFile = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
};

export default function UploadModal({ onClose, onUploadSuccess }) {
  // Shared tab
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'link'

  // File upload state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [songFile, setSongFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [duration, setDuration] = useState(0);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);

  // Link upload state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkArtist, setLinkArtist] = useState('');
  const [linkAlbum, setLinkAlbum] = useState('');
  const [linkGenre, setLinkGenre] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSongChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSongFile(file);
      const fileIsVideo = isVideoFile(file.name);
      setIsVideo(fileIsVideo);

      // Auto-extract title/artist from filename if possible
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const parts = nameWithoutExt.split('-');
      if (parts.length > 1) {
        if (!artist) setArtist(parts[0].trim());
        if (!title) setTitle(parts.slice(1).join('-').trim());
      } else {
        if (!title) setTitle(nameWithoutExt.trim());
      }

      // Extract duration using video or audio element
      const mediaUrl = URL.createObjectURL(file);
      const media = fileIsVideo ? document.createElement('video') : new Audio(mediaUrl);
      if (fileIsVideo) media.src = mediaUrl;
      media.addEventListener('loadedmetadata', () => {
        setDuration(Math.round(media.duration));
        URL.revokeObjectURL(mediaUrl);
      });
      if (!fileIsVideo) {} // Audio already has src set via constructor
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!songFile) {
      setError('Please select an MP3 song file.');
      return;
    }
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    if (album) formData.append('album', album);
    if (genre) formData.append('genre', genre);
    formData.append('file', songFile);
    if (coverImage) formData.append('cover_image', coverImage);
    formData.append('duration', duration);

    try {
      await api.post('/api/songs/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.file?.[0];
      if (err.response?.status === 409) {
        setError(apiMsg || `"${title}" by "${artist}" is already in your library.`);
      } else {
        setError(apiMsg || 'Upload failed. Please check the error and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) { setError('Please paste a URL.'); return; }
    if (!linkTitle.trim()) { setError('Please enter a title.'); return; }
    if (!linkArtist.trim()) { setError('Please enter an artist.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/songs/add-from-url/', {
        url: linkUrl,
        title: linkTitle,
        artist: linkArtist,
        album: linkAlbum,
        genre: linkGenre,
      });
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        setError(err.response.data?.error || 'This song is already in your library.');
      } else {
        setError(err.response?.data?.error || 'Failed to download from that URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300">
        
        {/* Header */}
        <div className="px-6 pt-4 border-b border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-950/50 rounded-lg text-green-600 dark:text-green-400">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add to Library</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl mb-0">
            <button
              type="button"
              onClick={() => { setActiveTab('file'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-zinc-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload File
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('link'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'link'
                  ? 'bg-white dark:bg-zinc-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Link className="w-4 h-4" /> From Link
            </button>
          </div>
        </div>

        {/* ── FILE UPLOAD TAB ── */}
        {activeTab === 'file' && (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/35 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left side: Upload Inputs */}
            <div className="space-y-4">
              {/* Song / Video Upload area */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Song or Video File <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors relative ${
                  isVideo
                    ? 'border-yellow-400 dark:border-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500'
                }`}>
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/*,video/mp4,video/mkv,video/x-matroska,video/avi,video/quicktime,video/webm,video/x-flv,video/x-msvideo,.mp3,.mp4,.mkv,.avi,.mov,.webm,.flv,.wmv,.m4v,.3gp"
                    onChange={handleSongChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {isVideo
                    ? <Video className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    : <Music className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  }
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {songFile ? songFile.name : 'Select MP3 or Video File'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {songFile
                      ? `${(songFile.size / (1024 * 1024)).toFixed(2)} MB • ${duration ? `${Math.floor(duration/60)}m ${duration%60}s` : 'detecting duration...'}`
                      : 'MP3, MP4, MKV, AVI, MOV, WEBM supported'}
                  </p>
                  {/* Video conversion notice */}
                  {isVideo && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded-full text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                      <Video className="w-3 h-3" />
                      <ArrowRight className="w-3 h-3" />
                      <Music className="w-3 h-3" />
                      <span>Video will be converted to MP3</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Song Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Blinding Lights"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                />
              </div>

              {/* Artist */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Artist <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. The Weeknd"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                />
              </div>
            </div>

            {/* Right side: Image cover upload & extra metadata */}
            <div className="space-y-4">
              {/* Album Cover upload */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Album Cover Image
                </label>
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 rounded-xl p-4 text-center cursor-pointer transition-colors relative flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {coverImage ? coverImage.name : 'Choose Cover Art'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      PNG, JPG or WEBP up to 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Album Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Album (Optional)
                </label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="e.g. After Hours"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Genre (Optional)
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Synth-pop / R&B"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                />
              </div>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-500 hover:to-yellow-500 active:scale-[0.98] text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-green-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isVideo ? 'Converting & Uploading...' : 'Uploading...'}
                </>
              ) : (
                isVideo ? 'Convert & Upload' : 'Upload Song'
              )}
            </button>
          </div>
        </form>
        )} {/* end file tab */}

        {/* ── FROM LINK TAB ── */}
        {activeTab === 'link' && (
          <form onSubmit={handleUrlSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/35 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Supported sites notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-800/40">
              <Globe className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Paste any public audio link</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports YouTube, SoundCloud, and 1000+ other sites via yt-dlp.
                  Make sure the video/audio is <strong>public</strong>.
                </p>
              </div>
            </div>

            {/* URL */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
              />
            </div>

            {/* Title + Artist */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Song Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. Blinding Lights"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Artist <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={linkArtist}
                  onChange={(e) => setLinkArtist(e.target.value)}
                  placeholder="e.g. The Weeknd"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Album + Genre */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Album</label>
                <input
                  type="text"
                  value={linkAlbum}
                  onChange={(e) => setLinkAlbum(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Genre</label>
                <input
                  type="text"
                  value={linkGenre}
                  onChange={(e) => setLinkGenre(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-500 hover:to-yellow-500 active:scale-[0.98] text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-green-500/10"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Downloading...</>
                ) : (
                  <><Link className="w-4 h-4" /> Add from Link</>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
