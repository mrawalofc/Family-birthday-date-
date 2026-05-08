import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, ChevronUp, ChevronDown, Upload, Plus, Trash2, ListMusic, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { get, set, del, keys } from 'idb-keyval';

interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  blob?: Blob;
  isUserUploaded?: boolean;
}

const DEFAULT_SONGS: Song[] = [];

export const MusicPlayer: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [playlist, setPlaylist] = useState<Song[]>(DEFAULT_SONGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentSong = playlist[currentSongIndex];

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadStoredSongs = async () => {
      try {
        const idbKeys = await keys();
        const musicKeys = idbKeys.filter(k => typeof k === 'string' && k.startsWith('song_'));
        
        const storedSongs: Song[] = [];
        for (const key of musicKeys) {
          const songData = await get(key);
          if (songData && songData.blob) {
            const url = URL.createObjectURL(songData.blob);
            storedSongs.push({
              id: key as string,
              title: songData.title,
              artist: songData.artist,
              url: url,
              blob: songData.blob,
              isUserUploaded: true
            });
          }
        }
        
        if (storedSongs.length > 0) {
          setPlaylist([...DEFAULT_SONGS, ...storedSongs]);
        }
      } catch (err) {
        console.error("Failed to load stored songs:", err);
      }
    };

    loadStoredSongs();

    // Cleanup object URLs on unmount
    return () => {
      playlist.forEach(song => {
        if (song.isUserUploaded && song.url.startsWith('blob:')) {
          URL.revokeObjectURL(song.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentSong) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentSongIndex, isPlaying, !!currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    if (playlist.length === 0) return;
    let nextIndex = currentSongIndex;
    if (direction === 'next') {
      nextIndex = (currentSongIndex + 1) % playlist.length;
    } else {
      nextIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    }
    setCurrentSongIndex(nextIndex);
    setIsPlaying(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newSongs: Song[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `song_${Date.now()}_${i}`;
      const songData = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: lang === 'bn' ? 'আপনার আপলোড' : 'Your Upload',
        blob: file
      };

      try {
        await set(id, songData);
        const url = URL.createObjectURL(file);
        newSongs.push({
          id,
          title: songData.title,
          artist: songData.artist,
          url,
          blob: file,
          isUserUploaded: true
        });
      } catch (err) {
        console.error("Failed to store song:", err);
      }
    }

    if (newSongs.length > 0) {
      const updatedPlaylist = [...playlist, ...newSongs];
      setPlaylist(updatedPlaylist);
      // Play the first newly added song
      setCurrentSongIndex(playlist.length);
      setIsPlaying(true);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSong = async (id: string) => {
    try {
      await del(id);
      const songToRemove = playlist.find(s => s.id === id);
      if (songToRemove && songToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(songToRemove.url);
      }
      
      const newPlaylist = playlist.filter(s => s.id !== id);
      const wasCurrentlyPlayingRemoved = playlist[currentSongIndex]?.id === id;
      
      setPlaylist(newPlaylist);
      setConfirmDeleteId(null);
      
      if (wasCurrentlyPlayingRemoved) {
        setCurrentSongIndex(0);
        setIsPlaying(false);
      } else if (currentSongIndex >= newPlaylist.length) {
        setCurrentSongIndex(Math.max(0, newPlaylist.length - 1));
      }
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  };

  const t = {
    bn: {
      nowPlaying: "এখন বাজছে",
      volume: "ভলিউম",
      upload: "গান যোগ করুন (একাধিক)",
      playlist: "প্লে-লিস্ট",
      empty: "কোনো গান নেই",
      uploading: "আপলোড হচ্ছে...",
      confirmDelete: "মুছবেন?",
      yes: "হ্যাঁ",
      no: "না"
    },
    en: {
      nowPlaying: "Now Playing",
      volume: "Volume",
      upload: "Add Music (Multiple)",
      playlist: "Playlist",
      empty: "No songs available",
      uploading: "Uploading...",
      confirmDelete: "Delete?",
      yes: "Yes",
      no: "No"
    }
  };

  const l = t[lang];

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className="fixed bottom-20 right-5 z-[150] flex flex-col items-end">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-black/80 backdrop-blur-2xl border border-white/20 p-5 rounded-[40px] mb-3 w-80 shadow-2xl overflow-hidden"
          >
            {!showPlaylist ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{l.nowPlaying}</p>
                  </div>
                  <button 
                    onClick={() => setShowPlaylist(true)}
                    className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                  >
                    <ListMusic size={18} />
                  </button>
                </div>

                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-[40px] flex items-center justify-center text-pink-400 border border-white/10 relative group">
                    <Music size={48} className={isPlaying ? 'animate-pulse' : ''} />
                    <div className={`absolute inset-0 bg-pink-500/10 rounded-[40px] blur-xl -z-10 transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  
                  <div className="text-center w-full px-2">
                    <h4 className="text-lg font-bold text-white truncate px-2">{currentSong?.title || l.empty}</h4>
                    <p className="text-sm text-white/50 truncate mb-4">{currentSong?.artist || ''}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <input 
                      type="range" 
                      min="0" 
                      max={duration || 100} 
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500 group-hover:h-2 transition-all"
                    />
                    <div className="flex justify-between text-[10px] text-white/30 font-mono mt-1 px-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-8 py-2">
                    <button onClick={() => skipTrack('prev')} className="text-white/40 hover:text-white transition-all scale-125 hover:scale-150 active:scale-95">
                      <Play size={20} className="rotate-180" fill="currentColor" />
                    </button>
                    <button 
                      onClick={togglePlay}
                      className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                      {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
                    </button>
                    <button onClick={() => skipTrack('next')} className="text-white/40 hover:text-white transition-all scale-125 hover:scale-150 active:scale-95">
                      <Play size={20} fill="currentColor" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListMusic size={16} />
                    {l.playlist}
                  </h4>
                  <button 
                    onClick={() => setShowPlaylist(false)}
                    className="p-1 hover:bg-white/10 rounded-full text-white/40"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {playlist.map((song, index) => (
                    <div 
                      key={song.id}
                      onClick={() => {
                        setCurrentSongIndex(index);
                        setIsPlaying(true);
                      }}
                      className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                        currentSongIndex === index ? 'bg-pink-500 text-white' : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                         currentSongIndex === index ? 'bg-white/20' : 'bg-black/20'
                      }`}>
                        {currentSongIndex === index && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3">
                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-0.5 bg-white" />
                            <motion.div animate={{ height: [12, 4, 12] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-white" />
                            <motion.div animate={{ height: [6, 10, 6] }} transition={{ repeat: Infinity, duration: 0.55 }} className="w-0.5 bg-white" />
                          </div>
                        ) : (
                          <Music size={14} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{song.title}</p>
                        <p className={`text-[10px] truncate ${currentSongIndex === index ? 'text-white/60' : 'text-white/40'}`}>
                          {song.artist}
                        </p>
                      </div>
                      {song.isUserUploaded && (
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <AnimatePresence mode="wait">
                            {confirmDeleteId === song.id ? (
                              <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 shadow-xl whitespace-nowrap"
                              >
                                <button 
                                  onClick={() => removeSong(song.id)}
                                  className="px-2 py-1 text-[8px] font-black bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all active:scale-90"
                                >
                                  {l.yes}
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 text-[8px] font-black bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all active:scale-90"
                                >
                                  {l.no}
                                </button>
                              </motion.div>
                            ) : (
                              <motion.button 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={() => setConfirmDeleteId(song.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-4 flex items-center justify-center gap-2 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {l.uploading}
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {l.upload}
                    </>
                  )}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="audio/*" 
                  multiple 
                  className="hidden" 
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl cursor-pointer group relative ${
          isExpanded ? 'bg-white text-black rotate-180' : 'bg-pink-500 text-white'
        }`}
      >
        {isExpanded ? (
          <ChevronDown size={28} />
        ) : (
          <>
            <div className={`absolute inset-0 bg-pink-500 rounded-full animate-ping opacity-20 ${isPlaying ? 'scale-150' : 'hidden'}`} />
            <Music size={24} className={isPlaying ? 'animate-pulse' : ''} />
          </>
        )}
      </button>

      <audio 
        ref={audioRef} 
        src={currentSong?.url} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => skipTrack('next')}
      />
    </div>
  );
};

const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

