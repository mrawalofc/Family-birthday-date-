import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Image as ImageIcon, Loader2, X, AlertCircle, Save, Upload, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { sounds } from '../lib/sounds';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch, getDocs, orderBy } from 'firebase/firestore';
import { ConfirmationDialog } from './ConfirmationDialog';

interface SlideshowImage {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
  userId: string;
}

const STORAGE_KEY = 'love_world_slideshow';

export const SlideshowManager: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{ url: string, name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  // Firestore Sync Logic
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSync = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setSyncStatus('syncing');
      // Blueprint says /slideshow/{id}
      const slidesRef = collection(db, 'slideshow');

      // 1. Initial catch-up from Firestore if local is empty
      const snapshot = await getDocs(slidesRef);
      if (snapshot.empty && images.length > 0 && isInitialSync) {
        const batch = writeBatch(db);
        images.forEach(img => {
          const docRef = doc(slidesRef, img.id);
          batch.set(docRef, { ...img, userId: user.uid });
        });
        await batch.commit();
      }

      // 2. Subscription
      const q = query(slidesRef, orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snap) => {
        const firestoreImages: SlideshowImage[] = [];
        snap.forEach(doc => firestoreImages.push(doc.data() as SlideshowImage));
        
        if (firestoreImages.length > 0 || !isInitialSync) {
          setImages(firestoreImages);
        }
        setSyncStatus('synced');
        setIsInitialSync(false);
      }, (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, slidesRef.path);
        setSyncStatus('error');
      });
    };

    setupSync();
    return () => unsubscribe?.();
  }, [auth.currentUser]);

  const saveToFirestore = async (item: SlideshowImage) => {
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, 'slideshow', item.id), { ...item, userId: auth.currentUser.uid });
      setSyncStatus('synced');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `slideshow/${item.id}`);
      setSyncStatus('error');
    }
  };

  const removeFromFirestore = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, 'slideshow', id));
      setSyncStatus('synced');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `slideshow/${id}`);
      setSyncStatus('error');
    }
  };

  const t = {
    bn: {
      title: 'আমাদের অ্যালবাম',
      description: 'স্লাইডশোর জন্য ছবি নির্বাচন করুন',
      add: 'ছবি যোগ',
      url: 'লিঙ্ক',
      upload: 'আপলোড',
      caption: 'ক্যাপশন (ঐচ্ছিক)',
      save: 'সেভ করুন',
      cancel: 'বাতিল',
      noImages: 'অ্যালবাম খালি',
      error: 'ত্রুটি দেখা দিয়েছে',
      limit: 'সর্বোচ্চ ১০টি ছবি',
      sizeLimit: 'ছবি ৫ মেগাবাইটের কম হতে হবে'
    },
    en: {
      title: 'Our Album',
      description: 'Curate your special slideshow',
      add: 'Add Photo',
      url: 'URL',
      upload: 'Upload',
      caption: 'Caption (Optional)',
      save: 'Save Photo',
      cancel: 'Cancel',
      noImages: 'Your album is empty.',
      error: 'Failed to add image',
      limit: 'Max 10 images allowed',
      sizeLimit: 'Image < 5MB before compression'
    }
  };

  const l = t[lang];

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000; // Slightly smaller for better fit/performance
        const MAX_HEIGHT = 1000;
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
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // 0.6 quality for more compact storage
      };
    });
  };

  useEffect(() => {
    const loadImages = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setImages(JSON.parse(saved));
        } catch (e) {
          setImages([]);
        }
      }
    };
    loadImages();
    window.addEventListener('storage', loadImages);
    return () => window.removeEventListener('storage', loadImages);
  }, []);

  const saveToLocal = (newImages: SlideshowImage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newImages));
      setImages(newImages);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
      alert(lang === 'bn' ? 'মেমোরি ফুল! কিছু ছবি মুছে আবার চেষ্টা করুন।' : 'Storage full! Please delete some images and try again.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    setError(null);
    const newSelected: { url: string, name: string }[] = [];
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit per file before compression
        setError(l.sizeLimit);
        continue;
      }

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const compressed = await compressImage(base64);
      newSelected.push({ url: compressed, name: file.name });
    }

    setSelectedFiles(prev => [...prev, ...newSelected].slice(0, 10 - images.length));
    setNewUrl(''); 
  };

  const handleAdd = async () => {
    if (selectedFiles.length === 0 && !newUrl.trim()) return;
    if (images.length >= 10) {
      setError(l.limit);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newImages: SlideshowImage[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          newImages.push({
            id: crypto.randomUUID(),
            url: file.url,
            caption: newCaption.trim(),
            userId: 'local-user',
            createdAt: new Date().toISOString(),
          });
        }
      } else if (newUrl.trim()) {
        newImages.push({
          id: crypto.randomUUID(),
          url: newUrl.trim(),
          caption: newCaption.trim(),
          userId: 'local-user',
          createdAt: new Date().toISOString(),
        });
      }

      const updated = [...newImages, ...images].slice(0, 10);
      saveToLocal(updated);
      
      // Save each new image to Firestore
      newImages.forEach(img => saveToFirestore(img));

      setNewUrl('');
      setNewCaption('');
      setSelectedFiles([]);
      setIsAdding(false);
      sounds.play('success');
    } catch (err) {
      console.error(err);
      setError(l.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDeleteAction = async () => {
    if (!deleteConfirm.id) return;
    const { id } = deleteConfirm;
    const updated = images.filter(img => img.id !== id);
    saveToLocal(updated);
    removeFromFirestore(id);
    sounds.play('error');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center border border-white/10">
              <ImageIcon size={18} className="text-pink-500 animate-[pulse_3s_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-widest uppercase mb-0">
                  {l.title}
                </h3>
                {syncStatus !== 'idle' && (
                  <div className={`p-1 rounded-full ${
                    syncStatus === 'synced' ? 'text-emerald-400' : 
                    syncStatus === 'syncing' ? 'text-[#c5a059]' : 'text-rose-400'
                  }`}>
                    {syncStatus === 'synced' ? <Cloud size={10} /> : syncStatus === 'syncing' ? <RefreshCw size={10} className="animate-spin" /> : <CloudOff size={10} />}
                  </div>
                )}
              </div>
              <p className="text-[7px] text-white/40 uppercase font-black tracking-[0.2em]">{l.description}</p>
            </div>
          </div>
          {auth.currentUser && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-white text-black px-4 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:bg-pink-500 hover:text-white transition-all transform active:scale-90 flex items-center gap-1.5"
            >
              <Plus size={12} />
              {l.add}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAdding(false);
                setSelectedFiles([]);
                setNewUrl('');
                setNewCaption('');
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="bg-[#1c1c1e] border border-white/10 p-8 rounded-[38px] w-full max-w-lg shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <ImageIcon size={20} className="text-pink-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {l.add}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">{l.upload}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded-[18px] overflow-hidden group/file">
                          <img src={file.url} alt="" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover/file:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {selectedFiles.length < (10 - images.length) && (
                        <label className="aspect-square flex flex-col items-center justify-center bg-white/[0.03] border border-white/10 rounded-[18px] cursor-pointer hover:bg-white/[0.06] transition-all group/add">
                          <Plus size={20} className="text-white/20 group-hover/add:text-pink-400 transition-all" />
                          <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">{l.url}</label>
                      <input
                        type="text"
                        value={newUrl}
                        onChange={(e) => {
                          setNewUrl(e.target.value);
                          setSelectedFiles([]);
                        }}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-[18px] px-5 py-4 text-sm text-white focus:bg-white/[0.06] focus:border-pink-500/30 outline-none transition-all placeholder:text-white/10"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-1">{l.caption}</label>
                      <input
                        type="text"
                        value={newCaption}
                        onChange={(e) => setNewCaption(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-[18px] px-5 py-4 text-sm text-white focus:bg-white/[0.06] focus:border-pink-500/30 outline-none transition-all placeholder:text-white/10"
                        placeholder={l.caption}
                      />
                    </div>
                  </div>
                </div>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2.5 text-red-400 text-xs bg-red-400/10 p-4 rounded-2xl border border-red-400/20"
                  >
                    <AlertCircle size={16} />
                    <span className="font-medium">{error}</span>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setSelectedFiles([]);
                      setNewUrl('');
                      setNewCaption('');
                    }}
                    className="flex-1 py-4 text-white/40 font-bold tracking-tight text-sm hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                  >
                    {l.cancel}
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={loading || (!newUrl.trim() && selectedFiles.length === 0)}
                    className="flex-[1.5] bg-pink-500 text-white rounded-2xl font-bold tracking-tight text-sm shadow-lg shadow-pink-500/20 hover:bg-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {l.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((img, i) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -8 }}
            className="group relative aspect-square rounded-[32px] overflow-hidden border border-white/5 bg-[#1c1c1e] shadow-xl transition-all duration-500"
          >
            <img src={img.url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-[0.9] group-hover:brightness-100" />
            
            <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
              <div className="bg-white/10 backdrop-blur-xl rounded-[16px] px-4 py-2 border border-white/10">
                <p className="text-[10px] text-white font-bold tracking-tight truncate">
                  {img.caption || (lang === 'bn' ? 'আমাদের স্মৃতি' : 'Timeless Memory')}
                </p>
              </div>
            </div>

            {auth.currentUser && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                <button
                  onClick={() => handleDelete(img.id)}
                  className="w-9 h-9 bg-red-500/80 backdrop-blur-xl text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all border border-white/10 shadow-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
        
        {images.length === 0 && !isAdding && (
          <div className="col-span-full py-24 text-center space-y-6 border-2 border-dashed border-white/10 rounded-[48px] bg-white/5 group hover:bg-white/10 transition-colors duration-500">
            <div className="w-24 h-24 rounded-[32px] bg-white/5 flex items-center justify-center mx-auto border border-white/10 transition-all group-hover:scale-110 group-hover:rotate-12">
              <ImageIcon size={48} className="text-white/10 group-hover:text-pink-500/50 transition-colors" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-black text-white/20 uppercase tracking-widest">{l.noImages}</p>
              <p className="text-white/10 text-xs font-medium italic">Start building your beautiful collection...</p>
            </div>
          </div>
        )}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDeleteAction}
        title={lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete Photo?'}
        message={lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই চমৎকার স্মৃতিটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।' : 'Are you sure you want to remove this beautiful memory? This action cannot be undone.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'না' : 'Cancel'}
      />
      </div>
  );
};