import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Heart, Star, Camera, Coffee, MapPin, 
  Sparkles, Plus, Trash2, Edit2, X, Save, Cloud, CloudOff, RefreshCw, Download, Upload as UploadIcon 
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sounds } from '../lib/sounds';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs, orderBy, query } from 'firebase/firestore';
import { ConfirmationDialog } from './ConfirmationDialog';

interface MomentData {
  id: string;
  date: string;
  titleBN: string;
  titleEN: string;
  descriptionBN: string;
  descriptionEN: string;
  iconId: string;
  color: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  coffee: <Coffee size={24} />,
  calendar: <Calendar size={24} />,
  star: <Star size={24} />,
  mapPin: <MapPin size={24} />,
  camera: <Camera size={24} />,
  heart: <Heart size={24} />,
  sparkles: <Sparkles size={24} />
};

const COLORS = [
  "from-pink-500 to-rose-400",
  "from-blue-500 to-indigo-400",
  "from-yellow-500 to-orange-400",
  "from-emerald-500 to-teal-400",
  "from-purple-500 to-indigo-400",
  "from-red-500 to-pink-500",
  "from-orange-500 to-amber-400",
  "from-cyan-500 to-blue-400",
  "from-lime-500 to-green-400",
  "from-fuchsia-500 to-purple-400"
];

const DEFAULT_MOMENTS: MomentData[] = [
  {
    id: '1',
    date: "September 1, 2024",
    titleBN: "আমাদের প্রথম দেখা",
    titleEN: "Our First Meeting",
    descriptionBN: "সেই দিনটি ছিল অসাধারণ। তোমার সাথে প্রথম দেখা হওয়ার মুহূর্তটি আমি কখনোই ভুলবো না।",
    descriptionEN: "That day was extraordinary. I will never forget the moment I first saw you.",
    iconId: 'coffee',
    color: "from-pink-500 to-rose-400"
  },
  {
    id: '2',
    date: "October 15, 2024",
    titleBN: "প্রথম ডেট",
    titleEN: "First Date",
    descriptionBN: "আমরা কত কথা বলেছিলাম! পার্কের সেই বিকেলটি ছিল জাদুকরী।",
    descriptionEN: "We talked so much! That afternoon in the park was magical.",
    iconId: 'calendar',
    color: "from-blue-500 to-indigo-400"
  }
];

export const Moments: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [moments, setMoments] = useState<MomentData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MomentData>>({});
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [inlineEdit, setInlineEdit] = useState<{ id: string, field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('love_world_moments');
    if (saved) {
      try {
        setMoments(JSON.parse(saved));
      } catch (e) {
        setMoments(DEFAULT_MOMENTS);
      }
    } else {
      setMoments(DEFAULT_MOMENTS);
      localStorage.setItem('love_world_moments', JSON.stringify(DEFAULT_MOMENTS));
    }
  }, []);

  // Firestore Sync Logic
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSync = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setSyncStatus('syncing');
      const momentsRef = collection(db, 'users', user.uid, 'moments');

      // 1. Catach-up
      const snapshot = await getDocs(momentsRef);
      if (snapshot.empty && moments.length > 0) {
        const batch = writeBatch(db);
        moments.forEach(m => {
          const docRef = doc(momentsRef, m.id);
          batch.set(docRef, m);
        });
        await batch.commit();
      }

      // 2. Sub
      unsubscribe = onSnapshot(momentsRef, (snap) => {
        const firestoreMoments: MomentData[] = [];
        snap.forEach(doc => firestoreMoments.push(doc.data() as MomentData));
        
        if (firestoreMoments.length > 0) {
          setMoments(firestoreMoments);
        }
        setSyncStatus('synced');
      }, (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, momentsRef.path);
        setSyncStatus('error');
      });
    };

    setupSync();
    return () => unsubscribe?.();
  }, [auth.currentUser]);

  const saveToFirestore = async (newMoments: MomentData[]) => {
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      const momentsRef = collection(db, 'users', auth.currentUser.uid, 'moments');
      const batch = writeBatch(db);
      newMoments.forEach(m => {
        const docRef = doc(momentsRef, m.id);
        batch.set(docRef, m);
      });
      await batch.commit();
      setSyncStatus('synced');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}/moments`);
      setSyncStatus('error');
    }
  };

  const removeFromFirestore = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'moments', id));
      setSyncStatus('synced');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser?.uid}/moments/${id}`);
      setSyncStatus('error');
    }
  };

  const saveMoments = (newMoments: MomentData[]) => {
    setMoments(newMoments);
    localStorage.setItem('love_world_moments', JSON.stringify(newMoments));
    saveToFirestore(newMoments);
    sounds.play('success');
  };

  const handleAdd = () => {
    sounds.play('click');
    setFormData({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      titleBN: '',
      titleEN: '',
      descriptionBN: '',
      descriptionEN: '',
      iconId: 'heart',
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
    setEditingId('new');
    setIsEditing(true);
  };

  const handleEdit = (moment: MomentData) => {
    sounds.play('click');
    setFormData(moment);
    setEditingId(moment.id);
    setIsEditing(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDeleteAction = () => {
    if (!deleteConfirm.id) return;
    const id = deleteConfirm.id;
    sounds.play('error');
    const filtered = moments.filter(m => m.id !== id);
    setMoments(filtered);
    localStorage.setItem('love_world_moments', JSON.stringify(filtered));
    removeFromFirestore(id);
  };

  const exportBackup = () => {
    const data = JSON.stringify(moments, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moments_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sounds.play('success');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          if (confirm(lang === 'bn' ? 'ব্যাকআপ ইমপোর্ট করলে বর্তমান মোমেন্টস ডিলিট হয়ে যাবে। আপনি কি নিশ্চিত?' : 'Importing backup will overwrite current moments. Are you sure?')) {
            setMoments(data);
            localStorage.setItem('love_world_moments', JSON.stringify(data));
            if (auth.currentUser) {
               const momentsRef = collection(db, 'users', auth.currentUser.uid, 'moments');
               const batch = writeBatch(db);
               data.forEach(m => batch.set(doc(momentsRef, m.id), m));
               await batch.commit();
            }
            sounds.play('success');
            alert(lang === 'bn' ? 'মোমেন্টস ব্যাকআপ সফলভাবে ইমপোর্ট করা হয়েছে!' : 'Moments backup imported successfully!');
          }
        }
      } catch (err) {
        alert(lang === 'bn' ? 'ভুল ফাইল ফরম্যাট!' : 'Invalid file format!');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    if (!formData.titleBN || !formData.titleEN || !formData.date) return;

    if (editingId === 'new') {
      saveMoments([...moments, formData as MomentData]);
    } else {
      saveMoments(moments.map(m => m.id === editingId ? (formData as MomentData) : m));
    }
    setIsEditing(false);
    setEditingId(null);
  };

  const handleInlineSave = (id: string, field: string) => {
    const updatedMoments = moments.map(m => 
      m.id === id ? { ...m, [field]: editValue } : m
    );
    saveMoments(updatedMoments);
    setInlineEdit(null);
  };

  const startInlineEdit = (id: string, field: string, value: string) => {
    sounds.play('click');
    setInlineEdit({ id, field });
    setEditValue(value);
  };

  const t = {
    bn: {
      title: "আমাদের সোনালী সময়",
      subtitle: "স্মৃতিগুলো আমাদের হৃদয়ে চিরকাল অমলিন থাকবে ✨",
      more: "আরো মুহূর্ত আসছে...",
      add: "নতুন মুহূর্ত যোগ করুন",
      edit: "সম্পাদনা",
      delete: "মুছে ফেলুন",
      save: "সংরক্ষণ করুন",
      cancel: "বাতিল",
      date: "তারিখ",
      titleBN: "শিরোনাম (বাংলা)",
      titleEN: "Title (English)",
      descBN: "বিবরণ (বাংলা)",
      descEN: "Description (English)",
      icon: "আইকন",
      color: "রঙ"
    },
    en: {
      title: "Our Moments Time",
      subtitle: "Memories that stay in our hearts forever ✨",
      more: "MORE MOMENTS TO COME...",
      add: "Add New Moment",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      date: "Date",
      titleBN: "Title (Bengali)",
      titleEN: "Title (English)",
      descBN: "Description (Bengali)",
      descEN: "Description (English)",
      icon: "Icon",
      color: "Color"
    }
  };

  const l = t[lang];

  return (
    <div className="w-full max-w-5xl mx-auto py-20 px-6 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="text-center mb-20 space-y-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-card luxury-text text-[#c5a059] mb-4 shadow-xl"
        >
          <Sparkles size={14} />
          {lang === 'bn' ? 'সোনালী মুহূর্তগুলো' : 'Our Golden Timeline'}
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-black text-7xl md:text-[110px] text-gradient italic leading-[0.8] tracking-tighter"
        >
          {l.title}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="luxury-text pt-6 max-w-xl mx-auto leading-relaxed opacity-60"
        >
          {l.subtitle}
        </motion.p>
        
        <div className="mt-12 flex justify-center gap-4">
          {syncStatus !== 'idle' && (
            <div className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl ${
              syncStatus === 'synced' ? 'bg-black/40 text-emerald-400 border-emerald-500/20' : 
              syncStatus === 'syncing' ? 'bg-black/40 text-[#c5a059] border-[#c5a059]/20' : 'bg-black/40 text-rose-400 border-rose-500/20'
            }`}>
              {syncStatus === 'synced' ? <Cloud size={14} /> : syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin text-[#c5a059]" /> : <CloudOff size={14} />}
              {syncStatus}
            </div>
          )}
          <button 
            onClick={handleAdd}
            className="inline-flex items-center gap-2 bg-[#c5a059] hover:bg-[#b08e4a] text-black px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            {l.add}
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={exportBackup}
              className="p-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full transition-all border border-white/10 flex items-center gap-2"
              title={lang === 'bn' ? 'ব্যাকআপ ডাউনলোড করুন' : 'Export Moments'}
            >
              <Download size={18} />
            </button>
            <label className="p-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full transition-all border border-white/10 flex items-center gap-2 cursor-pointer">
              <UploadIcon size={18} />
              <input type="file" accept=".json" onChange={importBackup} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Modern Timeline Line */}
        <div className="absolute left-1/2 -translate-x-1/2 h-full w-[2px] bg-gradient-to-b from-transparent via-white/20 to-transparent hidden md:block" />

        <div className="space-y-24">
          {moments.map((moment, i) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col md:flex-row items-center gap-12 relative ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
            >
              {/* Content Card */}
              <div className="flex-1 w-full">
                <motion.div 
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`relative bg-white/[0.02] backdrop-blur-3xl rounded-[50px] p-10 md:p-14 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden group transition-all duration-700 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${moment.color} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none`} />
                  <div className={`absolute top-0 ${i % 2 === 0 ? 'right-0' : 'left-0'} w-40 h-1 bg-gradient-to-r ${moment.color} group-hover:w-full transition-all duration-1000`} />
                  
                  <div className={`flex items-center gap-4 mb-8 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <span 
                      className="luxury-text text-[10px] text-[#c5a059] bg-[#c5a059]/10 px-6 py-2 rounded-full border border-[#c5a059]/20 cursor-pointer hover:bg-[#c5a059]/20 transition-all shadow-lg"
                      onClick={() => startInlineEdit(moment.id, 'date', moment.date)}
                    >
                      {inlineEdit?.id === moment.id && inlineEdit.field === 'date' ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleInlineSave(moment.id, 'date')}
                          onKeyDown={(e) => e.key === 'Enter' && handleInlineSave(moment.id, 'date')}
                          className="bg-transparent border-none outline-none text-[#c5a059] w-32 font-bold"
                        />
                      ) : moment.date}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                      <button 
                        onClick={() => handleEdit(moment)} 
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#c5a059] hover:text-black transition-all flex items-center justify-center border border-white/10"
                        title={l.edit}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(moment.id, e)} 
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-white/10"
                        title={l.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    className="cursor-pointer group/inline mb-6"
                    onClick={() => startInlineEdit(moment.id, lang === 'bn' ? 'titleBN' : 'titleEN', lang === 'bn' ? moment.titleBN : moment.titleEN)}
                  >
                    {inlineEdit?.id === moment.id && (inlineEdit.field === 'titleBN' || inlineEdit.field === 'titleEN') ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleInlineSave(moment.id, inlineEdit.field)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInlineSave(moment.id, inlineEdit.field)}
                        className="w-full bg-white/5 border-b-2 border-[#c5a059] font-serif text-4xl md:text-5xl text-white outline-none px-6 py-4 rounded-t-3xl shadow-inner italic"
                      />
                    ) : (
                      <h3 className="font-display text-4xl md:text-5xl text-white italic font-bold tracking-tight group-hover:text-[#c5a059] transition-colors duration-500">
                        {lang === 'bn' ? moment.titleBN : moment.titleEN}
                      </h3>
                    )}
                  </div>
                  
                  <div
                    className="cursor-pointer group/inline"
                    onClick={() => startInlineEdit(moment.id, lang === 'bn' ? 'descriptionBN' : 'descriptionEN', lang === 'bn' ? moment.descriptionBN : moment.descriptionEN)}
                  >
                    {inlineEdit?.id === moment.id && (inlineEdit.field === 'descriptionBN' || inlineEdit.field === 'descriptionEN') ? (
                      <textarea
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleInlineSave(moment.id, inlineEdit.field)}
                        rows={3}
                        className="w-full bg-white/5 border-b-2 border-[#c5a059] text-white/90 text-xl leading-relaxed italic font-light outline-none p-8 rounded-t-3xl shadow-inner resize-none font-serif"
                      />
                    ) : (
                      <div className={`flex items-start gap-4 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                        <p className="text-white/60 text-xl leading-relaxed italic font-serif flex-1">
                          {lang === 'bn' ? moment.descriptionBN : moment.descriptionEN}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Central Icon Junction */}
              <div className="relative z-10 shrink-0">
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.15 }}
                  className={`w-24 h-24 rounded-full bg-gradient-to-br ${moment.color} flex items-center justify-center text-white border-4 border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative group-hover:shadow-[0_0_60px_${moment.color.split(' ')[0].replace('from-', '')}/30] transition-all duration-700`}
                >
                  <div className="absolute inset-0 rounded-full animate-ping bg-white/10 opacity-20" />
                  <div className="scale-125">
                    {ICON_MAP[moment.iconId] || <Heart size={24} />}
                  </div>
                </motion.div>
                
                {/* Connecting Line for Mobile */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-24 bg-white/5 md:hidden" />
              </div>

              <div className="flex-1 hidden md:block" />
            </motion.div>
          ))}

          {/* Add Moment Card at the end of the timeline */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`flex flex-col md:flex-row items-center gap-12 relative ${moments.length % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
          >
            <div className="flex-1 w-full">
              <button 
                onClick={handleAdd}
                className="w-full group relative bg-white/5 backdrop-blur-2xl rounded-[40px] p-12 border-2 border-dashed border-white/10 hover:border-pink-500/50 transition-all flex flex-col items-center justify-center gap-4 hover:bg-white/[0.08]"
              >
                <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all duration-500 shadow-lg">
                  <Plus size={32} />
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-serif text-white/40 group-hover:text-white transition-colors mb-1">
                    {l.add}
                  </span>
                  <p className="text-xs text-white/20 uppercase tracking-widest font-black">
                    {lang === 'bn' ? 'স্মৃতি যোগ করুন' : 'ADD A MEMORY'}
                  </p>
                </div>
              </button>
            </div>
            
            {/* Central Icon Junction Placeholder */}
            <div className="relative z-10 shrink-0">
              <div className="w-20 h-20 rounded-full bg-white/5 border-4 border-dashed border-white/10 flex items-center justify-center text-white/10">
                <div className="animate-pulse">
                  <Sparkles size={24} />
                </div>
              </div>
            </div>

            <div className="flex-1 hidden md:block" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsEditing(false);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-[40px] w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto scrollbar-hide"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-serif text-white">
                  {editingId === 'new' ? l.add : l.edit}
                </h3>
                <button onClick={() => setIsEditing(false)} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white/50 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{l.date}</label>
                  <input 
                    type="text"
                    value={formData.date || ''}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    placeholder="e.g. September 1, 2024"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{l.titleBN}</label>
                    <input 
                      type="text"
                      value={formData.titleBN || ''}
                      onChange={e => setFormData({...formData, titleBN: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{l.titleEN}</label>
                    <input 
                      type="text"
                      value={formData.titleEN || ''}
                      onChange={e => setFormData({...formData, titleEN: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{l.descBN}</label>
                  <textarea 
                    value={formData.descriptionBN || ''}
                    onChange={e => setFormData({...formData, descriptionBN: e.target.value})}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{l.descEN}</label>
                  <textarea 
                    value={formData.descriptionEN || ''}
                    onChange={e => setFormData({...formData, descriptionEN: e.target.value})}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{l.icon}</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(ICON_MAP).map(key => (
                      <button
                        key={key}
                        onClick={() => setFormData({...formData, iconId: key})}
                        className={`p-4 rounded-2xl border transition-all ${formData.iconId === key ? 'bg-pink-500 border-pink-400 text-white scale-110 shadow-lg' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/20'}`}
                      >
                        {ICON_MAP[key]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{l.color}</label>
                  <div className="flex flex-wrap gap-4">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({...formData, color})}
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} border-4 transition-all ${formData.color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button 
                    onClick={handleSave}
                    className="flex-[2] bg-pink-500 hover:bg-pink-600 text-white font-bold py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 text-lg active:scale-95"
                  >
                    <Save size={20} />
                    {l.save}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl transition-all border border-white/10 active:scale-95"
                  >
                    {l.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-40 text-center relative z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-6xl mb-8 filter drop-shadow-[0_0_20px_rgba(255,105,180,0.6)]"
        >
          ❤️
        </motion.div>
        <p className="text-white/20 text-sm font-black tracking-[0.5em] uppercase">
          {l.more}
        </p>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAdd}
        className="fixed bottom-10 right-10 z-[100] w-20 h-20 bg-[#c5a059] text-black rounded-full flex items-center justify-center shadow-[0_32px_64px_-16px_rgba(197,160,89,0.5)] border-4 border-white/20 group backdrop-blur-sm"
        title={l.add}
      >
        <Plus size={40} className="group-hover:scale-110 transition-transform" />
      </motion.button>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDeleteAction}
        title={lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete Moment?'}
        message={lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই চমৎকার স্মৃতিটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।' : 'Are you sure you want to remove this beautiful memory? This action cannot be undone.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'না' : 'Cancel'}
      />
    </div>
  );
};
