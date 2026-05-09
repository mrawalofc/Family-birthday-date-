import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ChevronLeft, ChevronRight, Settings, Plus, Image as ImageIcon, X } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { SlideshowManager } from './SlideshowManager';

interface SlideshowImage {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
  isPublic: boolean;
}

const STORAGE_KEY = 'love_world_slideshow';

const DEFAULT_IMAGES = [
  {
    id: 'default-1',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200',
    caption: 'Love is in the air'
  },
  {
    id: 'default-2',
    url: 'https://images.unsplash.com/photo-1516589174184-c6858b16ecb0?auto=format&fit=crop&q=80&w=1200',
    caption: 'Moments worth sharing'
  },
  {
    id: 'default-3',
    url: 'https://images.unsplash.com/photo-1522673607200-1648832cee98?auto=format&fit=crop&q=80&w=1200',
    caption: 'Forever together'
  }
];

export const Slideshow: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const slidesRef = collection(db, 'slideshow');
    const q = query(slidesRef, where('isPublic', '==', true), orderBy('createdAt', 'desc'), limit(15));

    const unsubscribe = onSnapshot(q, (snap) => {
      const firestoreImages: SlideshowImage[] = [];
      snap.forEach(doc => firestoreImages.push({ id: doc.id, ...doc.data() } as SlideshowImage));
      
      if (firestoreImages.length > 0) {
        setImages(firestoreImages.slice(0, 10)); // Keep only 10 for performance
        // Sync to local storage for offline fallback
        localStorage.setItem(STORAGE_KEY, JSON.stringify(firestoreImages.slice(0, 10)));
      } else {
        // Fallback to local storage or defaults if Firestore is empty
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
              setImages(parsed);
            } else {
              setImages(DEFAULT_IMAGES as SlideshowImage[]);
            }
          } catch (e) {
            setImages(DEFAULT_IMAGES as SlideshowImage[]);
          }
        } else {
          setImages(DEFAULT_IMAGES as SlideshowImage[]);
        }
      }
    }, (err) => {
      console.error("Slideshow sync error:", err);
      // Fallback on error
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setImages(parsed);
          }
        } catch (e) {}
      }
      if (images.length === 0) setImages(DEFAULT_IMAGES as SlideshowImage[]);
    });

    return () => unsubscribe();
  }, []);

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + newDirection + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length === 0) return;
    
    const timer = setInterval(() => {
      paginate(1);
    }, 6000);

    return () => clearInterval(timer);
  }, [images.length, paginate]);

  if (images.length === 0) return null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.2,
      filter: 'blur(10px)',
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)',
    })
  };

  return (
    <div className="w-full max-w-5xl h-[350px] md:h-[550px] relative overflow-hidden rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10 mb-20 group bg-black/40">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={images[currentIndex]?.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 200, damping: 30 },
            opacity: { duration: 0.8 },
            scale: { duration: 12, ease: "linear" } // Very slow subtle zoom
          }}
          className="absolute inset-0"
        >
          <motion.img 
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            src={images[currentIndex]?.url} 
            alt={images[currentIndex]?.caption || ''} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />
          
          <div className="absolute inset-x-0 bottom-0 p-10 md:p-16 text-center transform-gpu z-20">
            <AnimatePresence mode="wait">
              {images[currentIndex]?.caption && (
                <motion.div 
                  key={`caption-${images[currentIndex].id}`}
                  initial={{ y: 30, opacity: 0, filter: 'blur(15px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: -30, opacity: 0, filter: 'blur(15px)' }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <p className="text-white text-2xl md:text-4xl font-serif italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight max-w-3xl mx-auto">
                    {images[currentIndex].caption}
                  </p>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '60px' }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-1 bg-pink-500/50 mx-auto mt-6 rounded-full" 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modern Refined Navigation Controls */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <button
          onClick={() => paginate(-1)}
          className="w-12 h-12 rounded-full bg-black/20 hover:bg-white text-white hover:text-black backdrop-blur-3xl border border-white/10 transition-all transform hover:scale-110 active:scale-90 flex items-center justify-center shadow-2xl"
          aria-label="Previous image"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <button
          onClick={() => paginate(1)}
          className="w-12 h-12 rounded-full bg-black/20 hover:bg-white text-white hover:text-black backdrop-blur-3xl border border-white/10 transition-all transform hover:scale-110 active:scale-90 flex items-center justify-center shadow-2xl"
          aria-label="Next image"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Ultra-thin Minimal Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 z-40">
        <motion.div
          key={`progress-${currentIndex}`}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: "linear" }}
          className="h-full bg-gradient-to-r from-pink-500/50 to-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)]"
        />
      </div>

      {/* Floating Pill Index Indicator */}
      <div className="absolute top-8 left-8 z-30">
        <div className="bg-black/20 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
            <span className="text-white">{currentIndex + 1}</span> / {images.length}
          </p>
        </div>
      </div>

      {/* Management Action - Direct access to uploads */}
      {user && (
        <div className="absolute top-8 right-8 z-30">
          <button 
            onClick={() => setIsManagerOpen(true)}
            className="flex items-center gap-2 bg-pink-500/80 hover:bg-pink-500 text-white px-5 py-2.5 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl hover:scale-105 active:scale-95 transition-all group"
          >
            <ImageIcon size={14} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {lang === 'bn' ? 'অ্যালবাম ম্যানেজ' : 'Manage Album'}
            </span>
          </button>
        </div>
      )}

      {/* Navigation Indicators - Minimalist Dash dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className="group py-3"
          >
            <div className={`h-[3px] rounded-full transition-all duration-700 bg-white ${
              idx === currentIndex ? 'w-12 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]' : 'w-4 opacity-20 group-hover:opacity-40'
            }`} />
          </button>
        ))}
      </div>
      {/* Management Modal */}
      <AnimatePresence>
        {isManagerOpen && (
          <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/95 backdrop-blur-3xl flex items-start justify-center py-20 px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-4xl font-display font-black text-white mb-2 uppercase tracking-tighter">
                    {lang === 'bn' ? 'অ্যালবাম ম্যানেজমেন্ট' : 'Album Management'}
                  </h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">
                    {lang === 'bn' ? 'ছবি আপলোড এবং মুছুন' : 'Upload & Manage Memories'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsManagerOpen(false)}
                  className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="bg-white/5 rounded-[40px] p-8 md:p-12 border border-white/10">
                <SlideshowManager lang={lang} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
