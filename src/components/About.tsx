import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Edit3, Save, X, Info, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { sounds } from '../lib/sounds';

interface StoryData {
  titleBN: string;
  titleEN: string;
  content1BN: string;
  content1EN: string;
  content2BN: string;
  content2EN: string;
  lastUpdated?: any;
}

const DEFAULT_STORY: StoryData = {
  titleBN: "আমাদের গল্প",
  titleEN: "Our Story",
  content1BN: "স্মৃতিগুলো ধূসর হয়ে যায়, কিন্তু আমাদের ভালোবাসা থাকে অটুট। এই ডিজিটাল ডায়েরি আমাদের পরিবারের সোনালি মুহূর্তগুলো ধরে রাখার জন্য তৈরি।",
  content1EN: "Memories may fade, but our love remains steadfast. This digital sanctuary was created to preserve our family's golden moments.",
  content2BN: "আমরা বিশ্বাস করি প্রতিটি শুভ জন্মদিন এবং প্রতিটি ছোট জয় উদ্‌যাপনের দাবি রাখে।",
  content2EN: "We believe every birthday, every milestone, and every small victory deserves a celebration."
};

export const About: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [story, setStory] = useState<StoryData>(DEFAULT_STORY);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StoryData>(DEFAULT_STORY);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Load from LocalStorage and Firebase
  useEffect(() => {
    const saved = localStorage.getItem('love_world_story');
    if (saved) {
      try {
        setStory(JSON.parse(saved));
        setFormData(JSON.parse(saved));
      } catch (e) {
        setStory(DEFAULT_STORY);
      }
    }

    let unsubscribe: (() => void) | undefined;

    const setupSync = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setSyncStatus('syncing');
      const docRef = doc(db, 'users', user.uid, 'settings', 'story');

      // Initial get
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as StoryData;
          setStory(data);
          setFormData(data);
          localStorage.setItem('love_world_story', JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error fetching story:", err);
      }

      // Real-time listener
      unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as StoryData;
          setStory(data);
          if (!isEditing) setFormData(data);
          localStorage.setItem('love_world_story', JSON.stringify(data));
          setSyncStatus('synced');
        } else {
          setSyncStatus('synced');
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, docRef.path);
        setSyncStatus('error');
      });
    };

    setupSync();
    return () => unsubscribe?.();
  }, [auth.currentUser, isEditing]);

  const handleSave = async () => {
    sounds.play('success');
    setStory(formData);
    localStorage.setItem('love_world_story', JSON.stringify(formData));
    setIsEditing(false);

    // Save to Firestore
    if (auth.currentUser) {
      setSyncStatus('syncing');
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'story');
        await setDoc(docRef, formData);
        setSyncStatus('synced');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser.uid}/settings/story`);
        setSyncStatus('error');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-24 px-6 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#c5a059]/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="text-right mb-8">
        <button 
          onClick={() => {
            sounds.play('click');
            setIsEditing(!isEditing);
          }}
          className={`px-8 py-3 rounded-2xl flex items-center gap-3 ml-auto transition-all transform active:scale-95 ${
            isEditing ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-[#c5a059] border border-white/10 hover:bg-white/10'
          }`}
        >
          {isEditing ? <X size={18} /> : <Edit3 size={18} />}
          <span className="font-black text-[11px] uppercase tracking-widest">
            {isEditing ? (lang === 'bn' ? 'বাতিল' : 'Cancel') : (lang === 'bn' ? 'সম্পাদনা করুন' : 'Manual Edit')}
          </span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="display"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-12 md:p-20 text-center border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden group"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-[#c5a059]/30 rounded-full" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="w-20 h-20 bg-[#c5a059]/10 rounded-3xl flex items-center justify-center text-[#c5a059] mx-auto mb-8 shadow-2xl">
                <Info size={40} />
              </div>
              <h2 className="text-5xl md:text-8xl font-display font-black text-gradient italic leading-none tracking-tighter">
                {lang === 'bn' ? story.titleBN : story.titleEN}
              </h2>
            </motion.div>

            <div className="space-y-10 text-xl md:text-3xl font-display italic text-white/50 leading-relaxed max-w-3xl mx-auto font-medium">
              <p>{lang === 'bn' ? story.content1BN : story.content1EN}</p>
              <p>{lang === 'bn' ? story.content2BN : story.content2EN}</p>
            </div>

            <div className="mt-20 flex justify-center gap-8">
              <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center text-[#c5a059] bg-white/[0.02] shadow-xl">
                <Heart size={28} fill="currentColor" className="animate-pulse" />
              </div>
              <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center text-[#c5a059] bg-white/[0.02] shadow-xl">
                <Sparkles size={28} />
              </div>
            </div>

            {syncStatus !== 'idle' && (
              <div className="absolute bottom-6 right-8 opacity-20 hover:opacity-100 transition-opacity flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#c5a059]">
                  {syncStatus === 'synced' ? 'Story Synced' : 'Cloud Syncing'}
                </span>
                {syncStatus === 'synced' ? <Cloud size={12} className="text-emerald-500" /> : <RefreshCw size={12} className="animate-spin text-[#c5a059]" />}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-950 border border-white/10 rounded-[60px] p-12 md:p-16 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#c5a059]/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 space-y-12">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-[#c5a059] flex items-center justify-center text-black">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-display italic font-black text-white">Manual Memory Editor</h3>
                  <p className="luxury-text text-[#c5a059] text-[10px]">Update your permanent family record</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="luxury-text text-[10px] opacity-40">Story Title (Bengali)</label>
                  <input 
                    value={formData.titleBN}
                    onChange={e => setFormData({...formData, titleBN: e.target.value})}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-white font-display italic text-2xl focus:ring-2 focus:ring-[#c5a059]/50 transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="luxury-text text-[10px] opacity-40">Story Title (English)</label>
                  <input 
                    value={formData.titleEN}
                    onChange={e => setFormData({...formData, titleEN: e.target.value})}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-white font-display italic text-2xl focus:ring-2 focus:ring-[#c5a059]/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="luxury-text text-[10px] opacity-40">Primary Content (Bengali)</label>
                    <textarea 
                      rows={4}
                      value={formData.content1BN}
                      onChange={e => setFormData({...formData, content1BN: e.target.value})}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white leading-relaxed resize-none focus:ring-2 focus:ring-[#c5a059]/50 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="luxury-text text-[10px] opacity-40">Primary Content (English)</label>
                    <textarea 
                      rows={4}
                      value={formData.content1EN}
                      onChange={e => setFormData({...formData, content1EN: e.target.value})}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white leading-relaxed resize-none focus:ring-2 focus:ring-[#c5a059]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="luxury-text text-[10px] opacity-40">Supporting Content (Bengali)</label>
                    <textarea 
                      rows={4}
                      value={formData.content2BN}
                      onChange={e => setFormData({...formData, content2BN: e.target.value})}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white leading-relaxed resize-none focus:ring-2 focus:ring-[#c5a059]/50 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="luxury-text text-[10px] opacity-40">Supporting Content (English)</label>
                    <textarea 
                      rows={4}
                      value={formData.content2EN}
                      onChange={e => setFormData({...formData, content2EN: e.target.value})}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white leading-relaxed resize-none focus:ring-2 focus:ring-[#c5a059]/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-12 flex gap-4">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-white text-black py-7 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-[#c5a059] transition-all transform active:scale-95 flex items-center justify-center gap-3 premium-btn"
                >
                  <Save size={18} />
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Story'}
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-12 py-7 bg-white/[0.05] text-white/60 hover:text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all"
                >
                  {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
