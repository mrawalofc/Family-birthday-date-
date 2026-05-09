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
              className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-6 rounded-[50px] mb-4 w-85 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {!showPlaylist ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#c5a059] shadow-[0_0_10px_#c5a059] animate-pulse" />
                      <p className="luxury-text text-[10px] text-[#c5a059]">{l.nowPlaying}</p>
                    </div>
                    <button 
                      onClick={() => setShowPlaylist(true)}
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all flex items-center justify-center border border-white/5"
                    >
                      <ListMusic size={18} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-6 py-4">
                    <div className="relative group">
                      <motion.div 
                        animate={isPlaying ? { rotate: 360 } : {}}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="w-40 h-40 bg-gradient-to-br from-neutral-800 to-black rounded-full flex items-center justify-center text-[#c5a059] border-8 border-white/5 relative shadow-2xl overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        <div className="absolute inset-0 border-[20px] border-black/40 rounded-full" />
                        <div className="w-12 h-12 bg-[#c5a059] rounded-full flex items-center justify-center text-black z-10 border-4 border-black">
                          <Music size={20} />
                        </div>
                      </motion.div>
                      <div className={`absolute -inset-4 bg-[#c5a059]/10 rounded-full blur-2xl -z-10 transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    
                    <div className="text-center w-full px-2">
                      <h4 className="font-display italic text-2xl font-bold text-white truncate px-2">{currentSong?.title || l.empty}</h4>
                      <p className="luxury-text text-[11px] text-white/40 mt-1">{currentSong?.artist || ''}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="relative pt-2">
                      <input 
                        type="range" 
                        min="0" 
                        max={duration || 100} 
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#c5a059]"
                      />
                      <div className="flex justify-between luxury-text text-[9px] text-white/30 mt-3 px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-10">
                      <button onClick={() => skipTrack('prev')} className="text-white/40 hover:text-[#c5a059] transition-all transform active:scale-95">
                        <Play size={24} className="rotate-180" fill="currentColor" />
                      </button>
                      <button 
                        onClick={togglePlay}
                        className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:bg-[#c5a059] hover:scale-105 active:scale-95 transition-all shadow-[0_16px_32px_rgba(255,255,255,0.1)] border-4 border-black/5"
                      >
                        {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1" />}
                      </button>
                      <button onClick={() => skipTrack('next')} className="text-white/40 hover:text-[#c5a059] transition-all transform active:scale-95">
                        <Play size={24} fill="currentColor" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-[#c5a059] transition-colors">
                        {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#c5a059]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-[450px]">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="luxury-text text-[10px] text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059]">
                        <ListMusic size={14} />
                      </div>
                      {l.playlist}
                    </h4>
                    <button 
                      onClick={() => setShowPlaylist(false)}
                      className="w-10 h-10 hover:bg-white/5 rounded-xl text-white/40 flex items-center justify-center"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {playlist.map((song, index) => (
                      <div 
                        key={song.id}
                        onClick={() => {
                          setCurrentSongIndex(index);
                          setIsPlaying(true);
                        }}
                        className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                          currentSongIndex === index 
                            ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-xl' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white/80'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                           currentSongIndex === index ? 'bg-black/20' : 'bg-black/40'
                        }`}>
                          {currentSongIndex === index && isPlaying ? (
                            <div className="flex items-end gap-1 h-3.5">
                              <motion.div animate={{ height: [4, 14, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className={`w-0.5 ${currentSongIndex === index ? 'bg-black' : 'bg-[#c5a059]'}`} />
                              <motion.div animate={{ height: [14, 4, 14] }} transition={{ repeat: Infinity, duration: 0.6 }} className={`w-0.5 ${currentSongIndex === index ? 'bg-black' : 'bg-[#c5a059]'}`} />
                              <motion.div animate={{ height: [8, 12, 8] }} transition={{ repeat: Infinity, duration: 0.55 }} className={`w-0.5 ${currentSongIndex === index ? 'bg-black' : 'bg-[#c5a059]'}`} />
                            </div>
                          ) : (
                            <Music size={16} className={currentSongIndex === index ? 'text-black' : 'text-[#c5a059]'} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate tracking-tight">{song.title}</p>
                          <p className={`text-[10px] uppercase tracking-widest truncate mt-0.5 ${currentSongIndex === index ? 'text-black/60 font-black' : 'text-white/30'}`}>
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-6 flex items-center justify-center gap-3 py-5 bg-white text-black hover:bg-[#c5a059] disabled:opacity-50 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 premium-btn"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {l.uploading}
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
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
        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] cursor-pointer group relative border border-white/10 ${
          isExpanded ? 'bg-white text-black rotate-180 mb-4' : 'bg-[#c5a059] text-black'
        }`}
      >
        {isExpanded ? (
          <ChevronDown size={32} />
        ) : (
          <>
            <div className={`absolute inset-0 bg-[#c5a059] rounded-2xl animate-ping opacity-20 ${isPlaying ? 'scale-[1.8]' : 'hidden'}`} />
            <Music size={28} className={isPlaying ? 'animate-pulse' : ''} />
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

