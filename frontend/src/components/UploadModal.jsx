import React, { useState } from 'react';
import api from '../api';
import { X, Upload, Music, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function UploadModal({ onClose, onUploadSuccess }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [songFile, setSongFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [duration, setDuration] = useState(0);
  
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSongChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSongFile(file);
      // Auto-extract title/artist from filename if possible
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const parts = nameWithoutExt.split('-');
      if (parts.length > 1) {
        if (!artist) setArtist(parts[0].trim());
        if (!title) setTitle(parts.slice(1).join('-').trim());
      } else {
        if (!title) setTitle(nameWithoutExt.trim());
      }

      // Calculate MP3 duration in browser
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(Math.round(audio.duration));
        URL.revokeObjectURL(audioUrl);
      });
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
      setError(err.response?.data?.detail || 'Failed to upload song. Please check the fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-950/50 rounded-lg text-violet-600 dark:text-violet-400">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upload New Song</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Form */}
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
              {/* MP3 Upload area */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Song File (MP3) <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 rounded-xl p-5 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="audio/mp3, audio/mpeg"
                    onChange={handleSongChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Music className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {songFile ? songFile.name : 'Select MP3 Song'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {songFile ? `${(songFile.size / (1024 * 1024)).toFixed(2)} MB • ${duration ? `${Math.floor(duration/60)}m ${duration%60}s` : 'detecting duration...'}` : 'Drag & drop or browse files'}
                  </p>
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
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
                  <div className="w-24 h-24 bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="border border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 rounded-xl p-4 text-center cursor-pointer transition-colors relative flex-1">
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-violet-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                </>
              ) : (
                'Upload Song'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
