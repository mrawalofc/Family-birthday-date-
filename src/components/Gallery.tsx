import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Image as ImageIcon, Trash2, FolderPlus, Camera, ChevronLeft, ChevronRight, Upload, Grid, Layout, Edit2, Check, X, Heart, Play, Sparkles, Star, Loader2 } from 'lucide-react';
import Masonry from 'react-masonry-css';
import { sounds } from '../lib/sounds';
import { SlideshowManager } from './SlideshowManager';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, getDocs, writeBatch, serverTimestamp, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface AlbumPhoto {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
}

interface UserAlbum {
  id: string;
  name: string;
  description: string;
  photos: AlbumPhoto[];
  createdAt: string;
}

interface GalleryItem {
  id?: string;
  type: string;
  title: string;
  text: string;
  emoji: string;
}

interface UploadingFile {
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
}

const galleryData: Record<'bn' | 'en', GalleryItem[]> = {
  bn: [
    { type: "heart", title: "অনন্ত ভালোবাসা", text: "তোমার হৃদয়ে যে জায়গা পেয়েছি, সেটাই আমার সবচেয়ে বড় সম্পদ। চিরকাল তোমার হয়ে থাকতে চাই। তুমি আমার ভালোবাসার শেষ ঠিকানা। 💕", emoji: "💗" },
    { type: "rose", title: "গোলাপের মতো তুমি", text: "গোলাপ ফোটার আগে কাঁটা সহ্য করে। তোমার মতো সুন্দর হতে হলে কিছু কষ্ট সহ্য করতেই হয়। তুমি আমার গোলাপ, তুমি আমার প্রিয়তম। 🌹", emoji: "🌹" },
    { type: "stars", title: "তারার নিচে তুমি", text: "রাতের আকাশের হাজার তারার মধ্যে তুমি আমার সবচেয়ে উজ্জ্বল তারা। তোমার আলোয় আমার জীবন রঙিন হয়ে ওঠে। ✨", emoji: "⭐" },
    { type: "couple", title: "দুজন একসাথে", text: "তোমার হাত ধরলে পৃথিবীর সব সমস্যা ছোট হয়ে যায়। তুমি আমার শক্তি, তুমি আমার ভরসা, তুমি আমার সবকিছু। 🤝💕", emoji: "💑" },
    { type: "moon", title: "চাঁদের কথা", text: "চাঁদ রাতে উঠে তোমাকে দেখতে। কারণ চাঁদও জানে এই পৃথিবীর সবচেয়ে সুন্দর তুমি। তুমি আমার চাঁদ। 🌙", emoji: "🌙" },
    { type: "sunset", title: "সূর্যাস্তের প্রতিজ্ঞা", text: "প্রতি সূর্যাস্তে প্রতিজ্ঞা করি — কাল সকালেও তোমাকে আরও বেশি ভালোবাসবো। এটাই আমার প্রতিদিনের প্রতিজ্ঞা। 🌅", emoji: "🌇" },
    { type: "ocean", title: "সমুদ্রের গভীরতা", text: "সমুদ্রের গভীরতা যতই হোক, আমার ভালোবাসা তার চেয়েও গভীর। তুমি ছাড়া আমার জীবন শূন্য। 🌊", emoji: "🌊" },
    { type: "rain", title: "বৃষ্টির দিনে তুমি", text: "বৃষ্টির শব্দ শুনলে তোমার কথা মনে পড়ে। তোমার সাথে বৃষ্টিতে ভিজতে চাই। তুমি আমার বৃষ্টির দিনের সঙ্গী। 🌧️", emoji: "🌧️" },
    { type: "coffee", title: "সকালের প্রথম চা", text: "তুমি আমার সকালের প্রথম চা — গরম, মিষ্টি, আর আমার দিন শুরুর সেরা অংশ। তুমি ছাড়া সকাল শুরু হয় না। ☕", emoji: "☕" },
    { type: "butterfly", title: "প্রজাপতির মতো তুমি", text: "তোমার কথা ভাবলেই পেটের মধ্যে প্রজাপতি উড়তে শুরু করে। এটাই কি ভালোবাসা? হ্যাঁ, এটাই ভালোবাসা! 🦋", emoji: "🦋" },
    { type: "book", title: "আমার প্রিয় গল্প", text: "আমাদের ভালোবাসার গল্প হাজার বইয়ের চেয়েও সুন্দর। প্রতিটা পাতায় লেখা আছে তোমার নাম। 📖💕", emoji: "📖" },
    { type: "music", title: "তোমার সুরে", text: "তোমার হাসি আমার প্রিয় সঙ্গীত। তোমার কণ্ঠ আমার প্রিয় গান। তুমি আমার সবকিছু। 🎵", emoji: "🎵" },
    { type: "phone", title: "তোমার কলের অপেক্ষায়", text: "তোমার কলের অপেক্ষায় প্রতিটা সেকেন্ড যেন এক যুগ। তোমার কণ্ঠ শুনলে পৃথিবী থেমে যায়। 📱💕", emoji: "📱" },
    { type: "ring", title: "চিরকালের প্রতিজ্ঞা", text: "এই আংটি তোমাকে দেওয়ার স্বপ্ন দেখি। চিরকাল তোমার হাত ধরে হাঁটতে চাই। তুমি আমার চিরকাল। 💍", emoji: "💍" },
    { type: "hug", title: "তোমার আলিঙ্গন", text: "তোমার আলিঙ্গনে পৃথিবীর সব কষ্ট মুছে যায়। তোমার বুকে মাথা রাখলে শান্তি পাই। তুমি আমার আশ্রয়। 🤗", emoji: "🤗" }
  ],
  en: [
    { type: "heart", title: "Infinite Love", text: "The place I have found in your heart is my greatest treasure. I want to be yours forever. You are my love's final destination. 💕", emoji: "💗" },
    { type: "rose", title: "Rose Like You", text: "A rose endures thorns before it blooms. To be as beautiful as you, one must endure some pain. You are my rose, you are my dearest. 🌹", emoji: "🌹" },
    { type: "stars", title: "You Under the Stars", text: "Among thousands of stars in the night sky, you are my brightest star. Your light colors my life. ✨", emoji: "⭐" },
    { type: "couple", title: "Together Forever", text: "When I hold your hand, all the world's problems become small. You are my strength, you are my trust, you are my everything. 🤝💕", emoji: "💑" },
    { type: "moon", title: "Moon's Tale", text: "The moon rises at night to see you. Because even the moon knows you are the most beautiful in this world. You are my moon. 🌙", emoji: "🌙" },
    { type: "sunset", title: "Sunset Promise", text: "With every sunset, I promise — tomorrow morning I will love you even more. This is my daily promise. 🌅", emoji: "🌇" },
    { type: "ocean", title: "Depth of the Ocean", text: "No matter how deep the ocean is, my love is deeper than that. Without you, my life is empty. 🌊", emoji: "🌊" },
    { type: "rain", title: "You in the Rain", text: "The sound of rain reminds me of you. I want to get wet in the rain with you. You are my rainy day companion. 🌧️", emoji: "🌧️" },
    { type: "coffee", title: "Morning Tea", text: "You are my first morning tea — warm, sweet, and the best part of starting my day. Without you, morning doesn't begin. ☕", emoji: "☕" },
    { type: "butterfly", title: "Butterfly Like You", text: "Butterflies start flying in my stomach when I think of you. Is this what love is? Yes, this is love! 🦋", emoji: "🦋" },
    { type: "book", title: "My Favorite Story", text: "Our love story is more beautiful than a thousand books. Every page is written with your name. 📖💕", emoji: "📖" },
    { type: "music", title: "In Your Tune", text: "Your smile is my favorite music. Your voice is my favorite song. You are my everything. 🎵", emoji: "🎵" },
    { type: "phone", title: "Waiting for Your Call", text: "Every second waiting for your call feels like an eternity. When I hear your voice, the world stops. 📱💕", emoji: "📱" },
    { type: "ring", title: "Promise of Forever", text: "I dream of giving you this ring. I want to walk holding your hand forever. You are my forever. 💍", emoji: "💍" },
    { type: "hug", title: "Your Embrace", text: "In your embrace, all the pain of the world disappears. When I rest my head on your chest, I find peace. You are my shelter. 🤗", emoji: "🤗" }
  ]
};

const PhotoItem: React.FC<{
  photo: AlbumPhoto;
  index: number;
  lang: 'bn' | 'en';
  onSelect: () => void;
  onQuickEdit: (caption: string) => void;
  onDelete: (e: React.MouseEvent) => void;
  onAddToSlideshow: (e: React.MouseEvent) => void;
  isQuickEditing: boolean;
  quickEditingCaption: string;
  setQuickEditingCaption: (val: string) => void;
  onSaveQuick: () => void;
  onCancelQuick: () => void;
}> = ({
  photo,
  index,
  lang,
  onSelect,
  onQuickEdit,
  onDelete,
  onAddToSlideshow,
  isQuickEditing,
  quickEditingCaption,
  setQuickEditingCaption,
  onSaveQuick,
  onCancelQuick
}) => {
  return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          delay: index * 0.08,
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1]
        }}
        whileHover={{ 
          y: -10,
          scale: 1.02,
        }}
        className={`rounded-[38px] overflow-hidden relative group shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-pointer border border-white/5 bg-[#1c1c1e] active:scale-[0.98] transition-all duration-500 h-full`}
      >
        <div className="overflow-hidden h-full relative">
          <motion.img 
            src={photo.url} 
            alt="" 
            onClick={onSelect}
            className="w-full h-full object-cover filter brightness-[0.9] group-hover:brightness-100 transition-all duration-700"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="bg-white/10 backdrop-blur-xl rounded-[20px] px-4 py-2.5 border border-white/10">
            <p className="text-[10px] text-white font-bold tracking-tight truncate">
              {photo.caption || (lang === 'bn' ? 'স্মৃতি' : 'Beautiful Memory')}
            </p>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
          <button 
            onClick={onAddToSlideshow}
            className="w-8 h-8 rounded-full bg-pink-500/90 backdrop-blur-xl text-white flex items-center justify-center hover:bg-pink-600 hover:scale-110 active:scale-95 transition-all border border-white/10 shadow-lg"
            title={lang === 'bn' ? 'স্লাইডশো' : 'Slideshow'}
          >
            <Sparkles size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onQuickEdit(photo.caption || '');
            }}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 transition-all border border-white/10 shadow-lg"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={onDelete}
            className="w-9 h-9 rounded-full bg-red-500/80 backdrop-blur-xl text-white flex items-center justify-center hover:bg-red-600 transition-all border border-white/10"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
  );
};

export const Gallery: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'art' | 'albums' | 'slideshow'>('slideshow');
  const [selected, setSelected] = useState<any | null>(null);
  const [albums, setAlbums] = useState<UserAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<UserAlbum | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [editingCaption, setEditingCaption] = useState('');
  const [quickEditingIndex, setQuickEditingIndex] = useState<number | null>(null);
  const [quickEditingCaption, setQuickEditingCaption] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Local Storage Sync
  useEffect(() => {
    const savedAlbums = localStorage.getItem('love_world_gallery_albums');
    if (savedAlbums) {
      try {
        setAlbums(JSON.parse(savedAlbums));
      } catch (e) {
        console.error('Failed to parse albums:', e);
      }
    }
    setLoading(false);
  }, []);

  const saveToLocal = (newAlbums: UserAlbum[]) => {
    setAlbums(newAlbums);
    localStorage.setItem('love_world_gallery_albums', JSON.stringify(newAlbums));
    // Trigger auto-sync signal if needed
    window.dispatchEvent(new Event('storage'));
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) return;
    sounds.play('success');
    const newAlbum: UserAlbum = {
      id: crypto.randomUUID(),
      name: newAlbumName.trim(),
      description: '',
      photos: [],
      createdAt: new Date().toISOString()
    };
    saveToLocal([newAlbum, ...albums]);
    setNewAlbumName('');
    setIsCreatingAlbum(false);
  };

  const deleteAlbum = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(lang === 'bn' ? "আপনি কি নিশ্চিত যে আপনি এই অ্যালবামটি মুছে ফেলতে চান?" : "Are you sure you want to delete this album?")) {
      sounds.play('error');
      const filtered = albums.filter(a => a.id !== id);
      saveToLocal(filtered);
      if (selectedAlbum?.id === id) setSelectedAlbum(null);
    }
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum) return;
    const files = Array.from(event.target.files || []) as File[];
    if (files.length > 0) {
      setIsUploading(true);
      setUploadResult(null);
      
      const initialUploads = files.map(f => ({
        name: f.name,
        progress: 0,
        status: 'pending' as const
      }));
      setUploadingFiles(initialUploads);

      try {
        const newPhotos: AlbumPhoto[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const compressed = await compressImage(base64);

          newPhotos.push({
            id: crypto.randomUUID(),
            url: compressed,
            caption: '',
            createdAt: new Date().toISOString()
          });

          setUploadingFiles(prev => {
            const next = [...prev];
            next[i] = { ...next[i], progress: 100, status: 'success' };
            return next;
          });
        }

        const updatedAlbums = albums.map(a => {
          if (a.id === selectedAlbum.id) {
            return { ...a, photos: [...newPhotos, ...a.photos] };
          }
          return a;
        });

        saveToLocal(updatedAlbums);
        setSelectedAlbum(updatedAlbums.find(a => a.id === selectedAlbum.id) || null);

        sounds.play('success');
        setUploadResult({ 
          type: 'success', 
          message: lang === 'bn' ? `${files.length}টি ছবি সফলভাবে যোগ করা হয়েছে!` : `Successfully added ${files.length} photos!` 
        });
        setTimeout(() => {
          setIsUploading(false);
          setUploadingFiles([]);
        }, 1500);
      } catch (err) {
        console.error(err);
        setUploadResult({ 
          type: 'error', 
          message: lang === 'bn' ? 'ছবি যোগ করতে ব্যর্থ হয়েছে।' : 'Failed to add photos.' 
        });
        setTimeout(() => setIsUploading(false), 3000);
      }
    }
  };

  const addToSlideshow = (photo: AlbumPhoto) => {
     const KEY = 'love_world_slideshow';
     const saved = localStorage.getItem(KEY);
     let images = [];
     if (saved) {
       try {
         images = JSON.parse(saved);
       } catch (e) {}
     }
     if (!Array.isArray(images)) images = [];
     
     const newImage = {
       id: crypto.randomUUID(),
       url: photo.url,
       caption: photo.caption || lang === 'bn' ? 'অ্যালবাম থেকে' : 'From Album',
       userId: 'local-user',
       createdAt: new Date().toISOString()
     };
     
     const updated = [newImage, ...images].slice(0, 10);
     localStorage.setItem(KEY, JSON.stringify(updated));
     window.dispatchEvent(new Event('storage'));
     sounds.play('success');
     alert(lang === 'bn' ? 'স্লাইডশোতে যোগ করা হয়েছে!' : 'Added to slideshow!');
  };

  const deletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedAlbum) return;
    sounds.play('error');
    
    const updatedAlbums = albums.map(a => {
      if (a.id === selectedAlbum.id) {
        return { ...a, photos: a.photos.filter(p => p.id !== photoId) };
      }
      return a;
    });

    saveToLocal(updatedAlbums);
    const updatedSelected = updatedAlbums.find(a => a.id === selectedAlbum.id) || null;
    setSelectedAlbum(updatedSelected);
    
    if (selectedPhotoIndex !== null && updatedSelected) {
      if (selectedPhotoIndex >= updatedSelected.photos.length) {
        setSelectedPhotoIndex(null);
      }
    }
  };

  const saveCaption = async () => {
    if (!selectedAlbum || selectedPhotoIndex === null) return;
    sounds.play('success');
    
    const updatedAlbums = albums.map(a => {
      if (a.id === selectedAlbum.id) {
        const photos = [...a.photos];
        photos[selectedPhotoIndex] = { ...photos[selectedPhotoIndex], caption: editingCaption };
        return { ...a, photos };
      }
      return a;
    });

    saveToLocal(updatedAlbums);
    setSelectedAlbum(updatedAlbums.find(a => a.id === selectedAlbum.id) || null);
  };

  const saveQuickCaption = async (index: number) => {
    if (!selectedAlbum) return;
    sounds.play('success');
    
    const updatedAlbums = albums.map(a => {
      if (a.id === selectedAlbum.id) {
        const photos = [...a.photos];
        photos[index] = { ...photos[index], caption: quickEditingCaption };
        return { ...a, photos };
      }
      return a;
    });

    saveToLocal(updatedAlbums);
    setSelectedAlbum(updatedAlbums.find(a => a.id === selectedAlbum.id) || null);
    setQuickEditingIndex(null);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedAlbum || selectedPhotoIndex === null) return;
    
    // Auto-save caption if changed? For now just navigate.
    // Actually, it's better to let user manually save or save on navigation.
    // Let's at least clear/update the input.
    
    let newIndex = selectedPhotoIndex;
    if (direction === 'next') {
      newIndex = (selectedPhotoIndex + 1) % selectedAlbum.photos.length;
    } else {
      newIndex = (selectedPhotoIndex - 1 + selectedAlbum.photos.length) % selectedAlbum.photos.length;
    }
    
    setSelectedPhotoIndex(newIndex);
    setEditingCaption(selectedAlbum.photos[newIndex].caption || '');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      
      // Don't navigate if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        if (e.key === 'Escape') (document.activeElement as HTMLElement).blur();
        return;
      }

      if (e.key === 'ArrowRight') navigatePhoto('next');
      if (e.key === 'ArrowLeft') navigatePhoto('prev');
      if (e.key === 'Escape') setSelectedPhotoIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, selectedAlbum]);

  const getArtContent = (type: string) => {
    switch(type) {
      case 'heart':
        return <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-pink-600 rotate-[-45deg] relative animate-pulse shadow-lg before:content-[''] before:absolute before:w-24 before:h-24 before:rounded-full before:bg-pink-400 before:top-[-48px] before:left-0 after:content-[''] after:absolute after:w-24 after:h-24 after:rounded-full after:bg-pink-500 after:top-0 after:left-[48px]" />;
      case 'rose':
        return (
          <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg animate-[roseSpin_8s_linear_infinite]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-[#e91e63] to-[#ad1457] opacity-80"
                style={{ transform: `rotate(${i * 45}deg) translateX(35px)` }}
              />
            ))}
          </div>
        );
      case 'stars':
        return (
          <div className="grid grid-cols-4 gap-4 w-full h-full p-10">
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i} 
                className="w-1 h-1 bg-white rounded-full animate-pulse" 
                style={{ animationDelay: `${Math.random() * 2}s` }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center text-5xl">✨</div>
          </div>
        );
      case 'couple': return <div className="text-8xl">💑</div>;
      case 'moon': return <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#fff9c4] to-[#ffecb3] shadow-2xl animate-pulse" />;
      case 'sunset': return <div className="text-7xl">🌅</div>;
      case 'ocean': return <div className="text-8xl flex flex-col items-center"><span>🌊</span><div className="w-32 h-1 bg-white/20 blur-sm mt-2 animate-pulse" /></div>;
      case 'rain': return <div className="text-7xl">🌧️</div>;
      case 'coffee': return <div className="text-7xl animate-bounce">☕</div>;
      case 'butterfly': return <div className="text-8xl animate-pulse">🦋</div>;
      case 'book': return <div className="text-7xl">📖</div>;
      case 'music': return <div className="text-7xl animate-bounce">🎵</div>;
      case 'phone': return <div className="text-7xl">📱</div>;
      case 'ring': return <div className="text-7xl animate-[heartbeat_1.5s_ease-in-out_infinite]">💍</div>;
      case 'hug': return <div className="text-8xl">🤗</div>;
      default: return <div className="text-5xl">💖</div>;
    }
  };

  const getArtBg = (type: string) => {
    switch(type) {
      case 'rose': return 'bg-gradient-to-b from-[#1a0a2e] to-[#4a1942]';
      case 'stars': return 'bg-gradient-to-b from-[#0d0221] to-[#240b36]';
      case 'moon': return 'bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]';
      case 'sunset': return 'bg-gradient-to-b from-[#ff512f] via-[#dd2476] to-[#8e2de2]';
      case 'ocean': return 'bg-gradient-to-b from-[#006994] to-[#001a2e]';
      case 'rain': return 'bg-gradient-to-b from-[#2c3e50] to-[#34495e]';
      case 'butterfly': return 'bg-gradient-to-br from-[#667eea] to-[#764ba2]';
      case 'music': return 'bg-gradient-to-br from-[#1db954] to-[#191414]';
      case 'ring': return 'bg-gradient-to-br from-[#ffd700] to-[#ff8c00]';
      default: return '';
    }
  };

  const t = {
    bn: {
      art: "আর্ট",
      albums: "অ্যালবাম",
      slideshow: "স্লাইডশো",
      addAlbum: "নতুন অ্যালবাম",
      albumPlaceholder: "অ্যালবামের নাম...",
      noAlbums: "এখনো কোনো অ্যালবাম নেই।",
      createBtn: "তৈরি করুন",
      backBtn: "পিছনে",
      uploadBtn: "ছবি যোগ করুন",
      emptyAlbum: "এই অ্যালবামটি খালি।",
      captionPlaceholder: "একটি ক্যাপশন লিখুন...",
      saveCaption: "সংরক্ষণ করুন",
    },
    en: {
      art: "Art",
      albums: "Albums",
      slideshow: "Slideshow",
      addAlbum: "New Album",
      albumPlaceholder: "Album name...",
      noAlbums: "No albums yet.",
      createBtn: "Create",
      backBtn: "Back",
      uploadBtn: "Add Photo",
      emptyAlbum: "This album is empty.",
      captionPlaceholder: "Write a caption...",
      saveCaption: "Save",
    }
  };

  const l = t[lang];

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-6 relative">
      {/* Premium Background Ambiance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Tab Controls - Precise Segmented Control */}
      <div className="relative z-10 flex justify-center mb-12 px-4">
        <div className="relative bg-[#1c1c1e]/60 backdrop-blur-3xl p-1 rounded-[24px] flex border border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
          {['slideshow', 'albums', 'art'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type as any);
                if (type !== 'albums') setSelectedAlbum(null);
              }}
              className={`relative z-10 flex items-center justify-center gap-2 px-6 py-3 rounded-[20px] transition-all duration-500 font-bold text-[11px] tracking-tight whitespace-nowrap ${
                activeTab === type ? 'text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {activeTab === type && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-white/10 rounded-[20px] border border-white/10 shadow-lg z-[-1]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {type === 'slideshow' && <Play size={14} fill={activeTab === type ? 'currentColor' : 'none'} className={activeTab === type ? 'animate-pulse' : ''} />}
              {type === 'albums' && <Grid size={14} fill={activeTab === type ? 'currentColor' : 'none'} />}
              {type === 'art' && <Sparkles size={14} fill={activeTab === type ? 'currentColor' : 'none'} />}
              {l[type as keyof typeof l] as string}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'slideshow' ? (
          <motion.div
            key="slideshow-tab"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 border border-white/10 shadow-2xl"
          >
            <SlideshowManager lang={lang} />
          </motion.div>
        ) : activeTab === 'art' ? (
          <motion.div
            key="art-grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {galleryData[lang].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                whileHover={{ 
                  y: -12,
                  transition: { duration: 0.4 }
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(item)}
                className="group relative h-96 rounded-[48px] overflow-hidden border border-white/10 bg-white/5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-700"
              >
                <div className={`w-full h-full flex items-center justify-center relative overflow-hidden ${getArtBg(item.type)}`}>
                  {/* Subtle shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.6 }}
                  >
                    {getArtContent(item.type)}
                  </motion.div>
                </div>
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/100 via-black/30 to-transparent p-10 text-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
                  <div className="mb-3 text-white font-black tracking-[0.2em] uppercase text-sm">
                    {item.title}
                  </div>
                  <div className="w-8 h-1 bg-pink-500 mx-auto rounded-full group-hover:w-16 transition-all duration-700" />
                </div>
                
                <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-[20px] flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 border border-white/10 shadow-xl">
                  {item.emoji}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="album-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {!selectedAlbum ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCreatingAlbum(true)}
                  className="aspect-square rounded-[38px] border border-white/10 flex flex-col items-center justify-center gap-4 text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-all bg-[#1c1c1e] shadow-xl"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                    <FolderPlus size={32} />
                  </div>
                  <span className="font-bold tracking-tight text-sm">{l.addAlbum}</span>
                </motion.button>

                {albums.map((album, index) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ 
                      y: -10,
                    }}
                    onClick={() => setSelectedAlbum(album)}
                    className="aspect-square rounded-[38px] bg-[#1c1c1e] border border-white/5 relative overflow-hidden group cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-500 active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
                    
                    {album.photos.length > 0 ? (
                      <img src={album.photos[0].url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] group-hover:bg-white/[0.04] transition-all">
                        <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center mb-3 border border-white/5 group-hover:border-pink-500/20 group-hover:scale-110 transition-all duration-500 shadow-inner">
                          <Camera size={28} className="text-white/10 group-hover:text-pink-500/50 transition-all duration-500" />
                        </div>
                        <span className="text-[10px] font-bold tracking-tight text-white/20 group-hover:text-white/40 transition-all duration-500">
                          {l.emptyAlbum}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-7 z-20 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xl font-bold text-white truncate tracking-tight mb-0.5">{album.name}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-white/40 font-medium tracking-wide">{album.photos.length} Photos</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => deleteAlbum(album.id, e)}
                          className="w-9 h-9 rounded-full bg-white/5 backdrop-blur-xl text-white/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-white/5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Horizontal Album Switcher */}
                <div className="flex gap-4 overflow-x-auto pb-4 mb-2 no-scrollbar scroll-smooth">
                  {albums.map((album) => (
                    <button
                      key={album.id}
                      onClick={() => {
                        setSelectedAlbum(album);
                        setSelectedPhotoIndex(null);
                      }}
                      className={`shrink-0 flex items-center gap-4 px-6 py-4 rounded-[28px] border transition-all whitespace-nowrap group ${
                        selectedAlbum.id === album.id 
                        ? 'bg-white text-black border-white shadow-2xl scale-105' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl overflow-hidden bg-black/20 shrink-0 border border-white/10 transition-all ${selectedAlbum.id === album.id ? 'scale-110 shadow-lg' : ''}`}>
                        {album.photos.length > 0 ? (
                          <img src={album.photos[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-pink-500/20">
                            <Camera size={14} className="text-pink-400" />
                          </div>
                        )}
                      </div>
                      <span className="font-black text-sm tracking-tight">{album.name}</span>
                      {selectedAlbum.id === album.id && (
                        <motion.div layoutId="active-dot" className="w-2 h-2 bg-pink-500 rounded-full" />
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCreatingAlbum(true)}
                    className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 transition-all whitespace-nowrap bg-white/5"
                  >
                    <Plus size={16} />
                    <span className="font-bold text-sm">{l.addAlbum}</span>
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1c1c1e]/60 p-8 rounded-[38px] border border-white/5 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                  <div className="flex items-center gap-6 relative z-10">
                    <button 
                      onClick={() => setSelectedAlbum(null)}
                      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all transform active:scale-90 border border-white/10 group/back"
                    >
                      <ChevronLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight mb-0.5">{selectedAlbum.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-white/30 text-[11px] font-medium tracking-wide">{selectedAlbum.photos.length} Memories</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-[11px] tracking-tight ${viewMode === 'grid' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                      >
                        <Grid size={14} />
                      </button>
                      <button 
                        onClick={() => setViewMode('masonry')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-[11px] tracking-tight ${viewMode === 'masonry' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                      >
                        <Layout size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="bg-white text-black px-6 py-3 rounded-full flex items-center justify-center gap-2 font-bold tracking-tight text-[12px] shadow-lg hover:bg-pink-500 hover:text-white transition-all transform active:scale-95"
                    >
                      <Upload size={16} />
                      {l.uploadBtn}
                    </button>
                  </div>
                  <input id="photo-upload" type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>

                {selectedAlbum.photos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-white border-2 border-dashed border-white/10 rounded-[40px] bg-white/5 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                      <ImageIcon size={48} className="text-white/20" />
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold mb-2 tracking-tight">{l.emptyAlbum}</p>
                      <p className="text-white/40 text-sm">{lang === 'bn' ? 'শুরু করতে আপনার প্রথম ছবি আপলোড করুন' : 'Upload your first photo to get started'}</p>
                    </div>
                    <button
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-12 py-5 rounded-[30px] flex items-center justify-center gap-4 font-black shadow-2xl shadow-pink-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus size={24} />
                      {l.uploadBtn}
                    </button>
                  </div>
                ) : (
                  viewMode === 'masonry' ? (
                    <Masonry
                      breakpointCols={{
                        default: 4,
                        1100: 3,
                        700: 2,
                        500: 1
                      }}
                      className="flex -ml-4 w-auto"
                      columnClassName="pl-4 bg-clip-padding"
                    >
                      {selectedAlbum.photos.map((photo, i) => (
                        <div key={i} className="mb-6">
                          <PhotoItem 
                            photo={photo} 
                            index={i} 
                            lang={lang}
                            onSelect={() => {
                              setSelectedPhotoIndex(i);
                              setEditingCaption(photo.caption || '');
                            }}
                            onQuickEdit={(caption) => {
                              setQuickEditingIndex(i);
                              setQuickEditingCaption(caption);
                            }}
                            onDelete={(e) => deletePhoto(photo.id, e)}
                            onAddToSlideshow={(e) => {
                              e.stopPropagation();
                              addToSlideshow(photo);
                            }}
                            isQuickEditing={quickEditingIndex === i}
                            quickEditingCaption={quickEditingCaption}
                            setQuickEditingCaption={setQuickEditingCaption}
                            onSaveQuick={() => saveQuickCaption(i)}
                            onCancelQuick={() => setQuickEditingIndex(null)}
                          />
                        </div>
                      ))}
                    </Masonry>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {selectedAlbum.photos.map((photo, i) => (
                        <div key={photo.id || i} className="aspect-square">
                          <PhotoItem 
                            photo={photo} 
                            index={i} 
                            lang={lang}
                            onSelect={() => {
                              setSelectedPhotoIndex(i);
                              setEditingCaption(photo.caption || '');
                            }}
                            onQuickEdit={(caption) => {
                              setQuickEditingIndex(i);
                              setQuickEditingCaption(caption);
                            }}
                            onDelete={(e) => deletePhoto(photo.id, e)}
                            onAddToSlideshow={(e) => {
                              e.stopPropagation();
                              addToSlideshow(photo);
                            }}
                            isQuickEditing={quickEditingIndex === i}
                            quickEditingCaption={quickEditingCaption}
                            setQuickEditingCaption={setQuickEditingCaption}
                            onSaveQuick={() => saveQuickCaption(i)}
                            onCancelQuick={() => setQuickEditingIndex(null)}
                          />
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {/* Album Creation Modal */}
        {isCreatingAlbum && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingAlbum(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="bg-[#1c1c1e] border border-white/10 p-8 rounded-[38px] w-full max-w-sm shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-4 tracking-tight">
                <div className="w-12 h-12 rounded-[18px] bg-white/5 flex items-center justify-center border border-white/10">
                  <FolderPlus className="text-pink-500" size={24} />
                </div>
                {l.addAlbum}
              </h3>
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest ml-1">Album Identity</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder={l.albumPlaceholder}
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createAlbum()}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-[20px] px-6 py-4 text-sm text-white font-medium focus:bg-white/[0.06] focus:border-pink-500/30 outline-none transition-all placeholder:text-white/10"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-10">
                <button
                  onClick={() => setIsCreatingAlbum(false)}
                  className="flex-1 py-4 text-white/30 font-bold text-sm tracking-tight hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createAlbum}
                  className="flex-1 bg-white text-black hover:bg-pink-500 hover:text-white py-4 rounded-2xl font-bold text-sm tracking-tight shadow-xl transition-all active:scale-95"
                >
                  {l.createBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Photo Viewer Modal */}
        {selectedPhotoIndex !== null && selectedAlbum && (
          <div className="fixed inset-0 z-[1300] flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <div className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center gap-8 z-10">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPhotoIndex(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 z-50 transition-all active:scale-90 border border-white/10 backdrop-blur-md"
              >
                <Plus size={20} className="rotate-45" />
              </button>

              {/* Main Viewer Area */}
              <div className="relative w-full flex-1 flex items-center justify-center group/viewer">
                {/* Previous Button */}
                <button 
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 md:left-10 w-12 h-12 bg-white/10 hover:bg-pink-500 rounded-full flex items-center justify-center text-white transition-all z-20 shadow-2xl backdrop-blur-md opacity-40 hover:opacity-100 group-hover/viewer:opacity-70 transition-opacity border border-white/10"
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="relative max-w-full max-h-[75vh] flex items-center justify-center rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
                  <motion.img 
                    key={selectedPhotoIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    src={selectedAlbum.photos[selectedPhotoIndex]?.url}
                    alt=""
                    className="max-w-full max-h-[75vh] object-contain"
                  />
                </div>

                {/* Next Button */}
                <button 
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-4 md:right-10 w-12 h-12 bg-white/10 hover:bg-pink-500 rounded-full flex items-center justify-center text-white transition-all z-20 shadow-2xl backdrop-blur-md opacity-40 hover:opacity-100 group-hover/viewer:opacity-70 transition-opacity border border-white/10"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Caption Panel */}
              <div className="w-full max-w-xl bg-black/40 backdrop-blur-3xl rounded-[32px] p-6 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] mb-6 relative group/panel">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[32px] pointer-events-none" />
                <div className="flex flex-col md:flex-row gap-4 items-center relative z-10">
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                      <p className="text-white/40 text-[9px] uppercase tracking-[0.4em] font-black">Memory {selectedPhotoIndex + 1} of {selectedAlbum.photos.length}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={editingCaption}
                        onChange={(e) => setEditingCaption(e.target.value)}
                        placeholder={l.captionPlaceholder}
                        className="w-full bg-white/5 border border-white/10 focus:border-pink-500/50 focus:bg-white/10 px-5 py-3 text-base text-white font-medium outline-none transition-all placeholder:text-white/10 rounded-[16px]"
                      />
                      <Edit2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/panel:text-pink-500/50 transition-colors" />
                    </div>
                  </div>
                  <button 
                    onClick={saveCaption}
                    className="shrink-0 w-full md:w-auto bg-white text-black px-8 py-3 rounded-[16px] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-pink-500 hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-2.5 group/save"
                  >
                    <Check size={16} className="group-hover:scale-125 transition-transform" />
                    {l.saveCaption}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Art Piece Modal */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl flex items-center justify-center z-[1400] p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              layoutId={selected.id || selected.type}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-black/60 border border-white/20 rounded-[48px] overflow-hidden max-w-2xl w-full shadow-[0_50px_150px_rgba(0,0,0,0.9)] relative"
              onClick={e => e.stopPropagation()}
            >
              <div className={`absolute inset-0 opacity-10 blur-[80px] -z-10 ${getArtBg(selected.type)}`} />
              
              <div className="h-72 bg-white/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 z-10" />
                <motion.div 
                  initial={{ scale: 0.7, rotate: -20 }}
                  animate={{ scale: 1.5, rotate: 0 }}
                  className="z-20 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                >
                  {getArtContent(selected.type)}
                </motion.div>
                
                <button 
                  onClick={() => setSelected(null)}
                  className="absolute top-8 right-8 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all z-30 shadow-2xl active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-12 text-center relative z-20">
                <h3 className="text-5xl font-black text-white mb-8 tracking-tighter uppercase leading-tight">
                  <span className="text-pink-500 block text-xs tracking-[0.5em] mb-4">Secret Treasure</span>
                  {selected.title}
                </h3>
                <div className="w-24 h-1.5 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 mx-auto mb-10 rounded-full shadow-[0_0_25px_rgba(236,72,153,0.8)]" />
                <div className="relative p-8 rounded-[36px] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden group/text">
                  <p className="font-sans text-2xl text-white/90 leading-relaxed font-bold tracking-tight italic relative z-10">
                    "{selected.text}"
                  </p>
                </div>
                <motion.button 
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(null)}
                  className="w-full mt-12 bg-white text-black py-6 rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] shadow-[0_25px_60px_rgba(255,255,255,0.1)] hover:bg-pink-500 hover:text-white transition-all duration-500"
                >
                  Close with Love 💕
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

