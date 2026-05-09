import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, RotateCcw, Save, Users, Calendar, Clock, Star, Loader2, Bell, X, Cloud, CloudOff, RefreshCw, Download, Upload as UploadIcon, Heart, Sparkles } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sounds } from '../lib/sounds';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch, getDocs } from 'firebase/firestore';
import { ConfirmationDialog } from './ConfirmationDialog';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  birthday: string;
  createdAt: number;
}

const STORAGE_KEY = 'loveCountdown_familyMembers';

const relations = [
  'Father', 'Mother', 'Brother', 'Sister', 'Son', 'Daughter',
  'Husband', 'Wife', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin', 'Other'
];

const texts = {
  bn: {
    title: "পরিবারের জন্মদিন",
    subtitle: "প্রতিটি প্রিয় পরিবারের সদস্যের ট্র্যাক রাখুন 🎂👨‍👩‍👧‍👦",
    formTitle: "✨ পরিবারের সদস্য যোগ করুন",
    lblName: "নাম", lblRelation: "সম্পর্ক", lblBirthday: "জন্মদিন",
    btnAdd: "➕ যোগ করুন", btnClear: "মুছুন", btnUpdate: "💾 আপডেট",
    statsTitle: "পরিবারের সারাংশ",
    totalMembers: "মোট সদস্য", upcoming: "আসন্ন জন্মদিন", thisMonth: "এই মাসে",
    age: "বয়স", days: "দিন", hours: "ঘন্টা", minutes: "মিনিট", seconds: "সেকেন্ড",
    min: "মি.", sec: "সে.", empty: "কোনো সদস্য যোগ করা হয়নি। উপরের ফর্ম ব্যবহার করে পরিবারের সদস্য যোগ করুন!",
    saved: "সংরক্ষিত!",
    formInfo: "👫 সদস্যদের তথ্য দিন",
    nextBday: "পরবর্তী জন্মদিন",
    daysLeft: "দিন বাকি",
    happyBday: "শুভ জন্মদিন!",
    isToday: "আজ জন্মদিন!",
    relationMap: {
      Father: "বাবা", Mother: "মা", Brother: "ভাই", Sister: "বোন",
      Son: "ছেলে", Daughter: "মেয়ে", Husband: "স্বামী", Wife: "স্ত্রী",
      Grandfather: "দাদা/নানা", Grandmother: "দাদী/নানী",
      Uncle: "চাচা/মামা", Aunt: "চাচী/মামী", Cousin: "কাজিন", Other: "অন্যান্য"
    }
  },
  en: {
    title: "Family Birthdays",
    subtitle: "Keep track of every precious family member 🎂👨‍👩‍👧‍👦",
    formTitle: "✨ Add Family Member",
    lblName: "Name", lblRelation: "Relationship", lblBirthday: "Birthday",
    btnAdd: "➕ Add Member", btnClear: "Clear", btnUpdate: "💾 Update",
    statsTitle: "Family Overview",
    totalMembers: "Total Members", upcoming: "Upcoming Birthdays", thisMonth: "This Month",
    age: "Age", days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
    min: "Min", sec: "Sec", empty: "No members added yet. Use the form above to add family members!",
    saved: "Saved!",
    formInfo: "👫 Add Members Information",
    nextBday: "Next Birthday",
    daysLeft: "days left",
    happyBday: "Happy Birthday!",
    isToday: "Birthday Today!",
    relationMap: {
      Father: "Father", Mother: "Mother", Brother: "Brother", Sister: "Sister",
      Son: "Son", Daughter: "Daughter", Husband: "Husband", Wife: "Wife",
      Grandfather: "Grandfather", Grandmother: "Grandmother",
      Uncle: "Uncle", Aunt: "Aunt", Cousin: "Cousin", Other: "Other"
    }
  }
};

const getRelationIcon = (relation: string) => {
  const icons: Record<string, string> = {
    Father: '👨', Mother: '👩', Brother: '👦', Sister: '👧',
    Son: '👶', Daughter: '👧', Husband: '🤵', Wife: '👰',
    Grandfather: '👴', Grandmother: '👵', Uncle: '👨', Aunt: '👩',
    Cousin: '🧑', Other: '👤'
  };
  return icons[relation] || '👤';
};

export const Family: React.FC<{ lang: 'bn' | 'en', defaultViewMode?: 'grid' | 'monitoring' }> = ({ lang, defaultViewMode }) => {
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
        return [];
      }
    }
    return [];
  });
  const [formData, setFormData] = useState({ name: '', relation: 'Father', birthday: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number, upcoming: number, thisMonth: number, monthMembers: FamilyMember[] }>({ total: 0, upcoming: 0, thisMonth: 0, monthMembers: [] });
  const [now, setNow] = useState(new Date());
  const [dateInputType, setDateInputType] = useState<'picker' | 'text'>('picker');
  const [viewMode, setViewMode] = useState<'grid' | 'monitoring'>(() => {
    if (defaultViewMode) return defaultViewMode;
    return (localStorage.getItem('loveCountdown_familyViewMode') as 'grid' | 'monitoring') || 'grid';
  });
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; memberId: string | null; all: boolean }>({ isOpen: false, memberId: null, all: false });
  const notifiedToday = useRef<Set<string>>(new Set());

  useEffect(() => {
    sounds.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const playBirthdaySound = () => {
    sounds.play('notification');
  };

  // Members Ref to avoid dependency loop in timer
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert(lang === 'bn' ? 'আপনার ব্রাউজারটি নোটিফিকেশন সাপোর্ট করে না।' : 'Your browser does not support notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      new Notification(lang === 'bn' ? 'পরিবারের নোটিফিকেশন অন করা হয়েছে! 🎉' : 'Family Notifications Enabled! 🎉', {
        body: lang === 'bn' ? 'আপনার পরিবারের সদস্যদের জন্মদিনে আমরা আপনাকে জানিয়ে দেব। ' : 'We will alert you on your family members birthdays.',
        icon: '/favicon.ico'
      });
      playBirthdaySound();
    }
  };

  const checkBirthdays = (memberList: FamilyMember[]) => {
    const now = new Date();
    const todayStr = `${now.getMonth() + 1}-${now.getDate()}`;

    memberList.forEach(m => {
      const bday = new Date(m.birthday);
      const bdayStr = `${bday.getMonth() + 1}-${bday.getDate()}`;
      const uniqueKey = `family-${m.id}-${now.getFullYear()}`;

      if (todayStr === bdayStr && !notifiedToday.current.has(uniqueKey)) {
        if (notificationsEnabled) {
          new Notification(lang === 'bn' ? `${m.name}-এর জন্মদিন! 🎂` : `${m.name}'s Birthday! 🎂`, {
            body: lang === 'bn' ? `আজ আপনার ${lang === 'en' ? m.relation : (texts.bn.relationMap as any)[m.relation] || m.relation} ${m.name}-এর জন্মদিন! ❤️` : `Today is your ${m.relation} ${m.name}'s birthday! ❤️`,
            icon: '/favicon.ico'
          });
          playBirthdaySound();
          notifiedToday.current.add(uniqueKey);
        }
      }
    });
  };

  useEffect(() => {
    if (defaultViewMode) {
      setViewMode(defaultViewMode);
    }
  }, [defaultViewMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      // Check for birthdays every minute
      if (new Date().getSeconds() === 0) {
        checkBirthdays(membersRef.current);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [notificationsEnabled, lang]); // lang included for checkBirthdays logic if needed

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    localStorage.setItem('loveCountdown_familyViewMode', viewMode);
    updateStats();
  }, [members, viewMode]);

  const updateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    
    let upcoming = 0;
    let thisMonthCount = 0;
    const monthMembers: FamilyMember[] = [];

    members.forEach(m => {
      const bday = new Date(m.birthday);
      if (bday.getMonth() === currentMonth) {
        thisMonthCount++;
        monthMembers.push(m);
      }

      let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (next < today) next = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
      
      const daysLeft = Math.floor((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) upcoming++;
    });

    setStats({ total: members.length, upcoming, thisMonth: thisMonthCount, monthMembers });
  };

  // Firestore Sync Logic
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSync = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setSyncStatus('syncing');
      const familyRef = collection(db, 'users', user.uid, 'family');

      // 1. Initial catch-up from Firestore if local is empty
      const snapshot = await getDocs(familyRef);
      if (snapshot.empty && members.length > 0 && isInitialSync) {
        const batch = writeBatch(db);
        members.forEach(m => {
          const docRef = doc(familyRef, m.id);
          batch.set(docRef, m);
        });
        await batch.commit();
      }

      // 2. Subscription
      unsubscribe = onSnapshot(familyRef, (snap) => {
        const firestoreMembers: FamilyMember[] = [];
        snap.forEach(doc => firestoreMembers.push(doc.data() as FamilyMember));
        
        if (firestoreMembers.length > 0 || !isInitialSync) {
          setMembers(firestoreMembers);
        }
        setSyncStatus('synced');
        setIsInitialSync(false);
      }, (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, familyRef.path);
        setSyncStatus('error');
      });
    };

    setupSync();
    return () => unsubscribe?.();
  }, [auth.currentUser]);

  const saveToFirestore = async (item: FamilyMember) => {
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'family', item.id), item);
      setSyncStatus('synced');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}/family/${item.id}`);
      setSyncStatus('error');
    }
  };

  const removeFromFirestore = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'family', id));
      setSyncStatus('synced');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser?.uid}/family/${id}`);
      setSyncStatus('error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthday) return;

    if (editingId) {
      const updated = members.find(m => m.id === editingId);
      if (updated) {
        const newData = { ...updated, ...formData } as FamilyMember;
        setMembers(members.map(m => m.id === editingId ? newData : m));
        saveToFirestore(newData);
        sounds.play('success');
      }
      setEditingId(null);
    } else {
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name: formData.name,
        relation: formData.relation,
        birthday: formData.birthday,
        createdAt: Date.now()
      };
      setMembers([...members, newMember]);
      saveToFirestore(newMember);
      sounds.play('success');
    }
    setFormData({ name: '', relation: 'Father', birthday: '' });
  };

  const deleteMember = (id: string) => {
    setDeleteConfirm({ isOpen: true, memberId: id, all: false });
  };

  const confirmDeleteMember = () => {
    if (!deleteConfirm.memberId) return;
    const id = deleteConfirm.memberId;
    setMembers(members.filter(m => m.id !== id));
    removeFromFirestore(id);
    sounds.play('click');
  };

  const editMember = (m: FamilyMember) => {
    sounds.play('click');
    setFormData({ name: m.name, relation: m.relation, birthday: m.birthday });
    setEditingId(m.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllMembers = () => {
    setDeleteConfirm({ isOpen: true, memberId: null, all: true });
  };

  const confirmClearAll = () => {
    sounds.play('error');
    setIsClearingAll(true);
    setTimeout(() => {
      // Also delete from Firestore if needed
      if (auth.currentUser) {
        const familyRef = collection(db, 'users', auth.currentUser.uid, 'family');
        members.forEach(m => deleteDoc(doc(familyRef, m.id)));
      }
      setMembers([]);
      setIsClearingAll(false);
    }, 500);
  };

  const exportBackup = () => {
    const data = JSON.stringify(members, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family_celebration_backup_${new Date().toISOString().split('T')[0]}.json`;
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
          if (confirm(lang === 'bn' ? 'ব্যাকআপ ইমপোর্ট করলে বর্তমান ডাটা ওভাররাইট হয়ে যাবে। আপনি কি নিশ্চিত?' : 'Importing backup will overwrite current data. Are you sure?')) {
            setMembers(data);
            if (auth.currentUser) {
              const familyRef = collection(db, 'users', auth.currentUser.uid, 'family');
              const batch = writeBatch(db);
              data.forEach(m => batch.set(doc(familyRef, m.id), m));
              await batch.commit();
            }
            sounds.play('success');
            alert(lang === 'bn' ? 'ব্যাকআপ সফলভাবে ইমপোর্ট করা হয়েছে!' : 'Backup imported successfully!');
          }
        }
      } catch (err) {
        alert(lang === 'bn' ? 'ভুল ফাইল ফরম্যাট!' : 'Invalid file format!');
      }
    };
    reader.readAsText(file);
  };

  const getAge = (bdayStr: string) => {
    const today = new Date();
    const bday = new Date(bdayStr);
    let age = today.getFullYear() - bday.getFullYear();
    const hasHad = today.getMonth() > bday.getMonth() || (today.getMonth() === bday.getMonth() && today.getDate() >= bday.getDate());
    if (!hasHad) age--;
    return age;
  };

  const getNextBdayStatus = (bdayStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bdayDate = new Date(bdayStr);
    
    const isToday = today.getMonth() === bdayDate.getMonth() && today.getDate() === bdayDate.getDate();
    
    let next = new Date(today.getFullYear(), bdayDate.getMonth(), bdayDate.getDate());
    if (next < today) next = new Date(today.getFullYear() + 1, bdayDate.getMonth(), bdayDate.getDate());
    
    return { next, isToday };
  };

  const getCountdown = (target: Date) => {
    const diff = target.getTime() - now.getTime();
    if (diff < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, finished: false };
  };

  const t = texts[lang];

  return (
    <div className="w-full max-w-7xl mx-auto py-16 px-6 relative z-10">
      <div className="text-center mb-24 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-card luxury-text text-[#c5a059] mb-4 shadow-xl"
        >
          <Star size={14} className="fill-[#c5a059]" />
          {lang === 'bn' ? 'আমাদের বংশগাথা' : 'Our Legacy of Love'}
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-black text-7xl md:text-[120px] text-gradient italic leading-[0.8] tracking-tighter"
        >
          {t.title}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="luxury-text pt-4 max-w-xl mx-auto leading-relaxed opacity-60"
        >
          {t.subtitle}
        </motion.p>
      </div>

      {/* Form Card */}
      {auth.currentUser && (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-12 md:p-24 mb-24 relative overflow-hidden group shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] border border-white/10"
        >
          <div className="absolute -top-24 -right-24 p-24 text-[#c5a059]/[0.02] pointer-events-none group-hover:scale-125 transition-transform duration-[2000ms] ease-out">
            <Heart size={400} strokeWidth={0.5} />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-16">
              <h3 className="font-display text-5xl md:text-7xl text-white mb-6 italic font-bold tracking-tight">
                {t.formTitle}
              </h3>
              <div className="w-24 h-px bg-[#c5a059]/30 mx-auto rounded-full shadow-[0_0_10px_#c5a059]" />
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <label className="luxury-text flex items-center gap-3">
                  <Users size={14} className="text-[#c5a059]" /> {t.lblName}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-6 text-white text-xl placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/50 transition-all font-display italic font-medium"
                  placeholder="Full Name"
                />
              </div>

              <div className="space-y-4">
                <label className="luxury-text flex items-center gap-3">
                  <Star size={14} className="text-[#c5a059]" /> {t.lblRelation}
                </label>
                <div className="relative">
                  <select
                    value={formData.relation}
                    onChange={e => setFormData({ ...formData, relation: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-6 text-white text-xl focus:outline-none focus:ring-2 focus:ring-[#c5a059]/50 transition-all appearance-none cursor-pointer font-display italic font-medium"
                  >
                    {relations.map(r => (
                      <option key={r} value={r} className="bg-[#0f0a1a] text-white">
                        {(t.relationMap as any)[r] || r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="luxury-text flex items-center gap-3">
                    <Calendar size={14} className="text-[#c5a059]" /> {t.lblBirthday}
                  </label>
                  <button 
                    type="button"
                    onClick={() => setDateInputType(dateInputType === 'picker' ? 'text' : 'picker')}
                    className="luxury-text opacity-40 hover:opacity-100 transition-opacity text-[10px]"
                  >
                    {dateInputType === 'picker' ? (lang === 'bn' ? 'ম্যানুয়াল' : 'Manual') : (lang === 'bn' ? 'পিকার' : 'Picker')}
                  </button>
                </div>
                <input
                  type={dateInputType === 'picker' ? 'date' : 'text'}
                  value={formData.birthday}
                  onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                  placeholder={dateInputType === 'text' ? 'YYYY-MM-DD' : undefined}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-6 text-white text-xl focus:outline-none focus:ring-2 focus:ring-[#c5a059]/50 transition-all cursor-pointer font-display italic font-medium"
                />
              </div>

              <div className="md:col-span-3 flex justify-center gap-8 mt-8">
                <motion.button 
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="bg-white text-black px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#c5a059] transition-all flex items-center gap-4 premium-btn"
                >
                  {editingId ? <Save size={18} /> : <Plus size={18} />}
                  {editingId ? t.btnUpdate : t.btnAdd}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* View Mode Switching / Monitoring Dashboard Option */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 px-2">
        <div className="flex flex-wrap bg-white/5 p-1.5 rounded-[25px] border border-white/10 backdrop-blur-2xl justify-center shadow-xl">
          <button 
            onClick={() => { sounds.play('click'); setViewMode('grid'); }}
            className={`flex items-center gap-3 px-8 py-3 rounded-[20px] transition-all ${viewMode === 'grid' ? 'bg-pink-500 text-white shadow-lg scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={18} />
            <span className="font-bold uppercase tracking-widest text-xs">{lang === 'bn' ? 'গ্রিড ভিউ' : 'Grid View'}</span>
          </button>
          <button 
            onClick={() => { sounds.play('click'); setViewMode('monitoring'); }}
            className={`flex items-center gap-3 px-8 py-3 rounded-[20px] transition-all ${viewMode === 'monitoring' ? 'bg-pink-500 text-white shadow-lg scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <Clock size={18} />
            <span className="font-bold uppercase tracking-widest text-xs">{lang === 'bn' ? 'মনিটরিং' : 'Monitoring'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button 
            onClick={() => { sounds.play('click'); setSoundEnabled(!soundEnabled); }}
            className={`p-2.5 rounded-2xl transition-all border backdrop-blur-xl flex items-center gap-2 ${soundEnabled ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-white/5 border-white/10 text-white/40'}`}
            title={lang === 'bn' ? 'সাউন্ড অন/অফ' : 'Sound On/Off'}
          >
            {soundEnabled ? <Bell size={18} /> : <X size={18} />}
          </button>

          {notificationsEnabled ? (
             <div className="px-6 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 backdrop-blur-xl flex items-center gap-2">
               <Bell size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'bn' ? 'নোটিফিকেশন চালু' : 'Alerts Active'}</span>
             </div>
          ) : (
            <button 
              onClick={requestNotificationPermission}
              className="px-6 py-2.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white rounded-2xl transition-all border border-pink-500/30 backdrop-blur-xl flex items-center gap-2 group"
            >
              <Bell size={18} className="animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {lang === 'bn' ? 'নোটিফিকেশন অন করুন' : 'Enable Notifications'}
              </span>
            </button>
          )}

          {(auth.currentUser?.email === 'mrawalyt74@gmail.com' || auth.currentUser?.email === 'mimrawalyt74@gmail.com') && members.length > 0 && (
            <button 
              onClick={clearAllMembers}
              disabled={isClearingAll}
              className="p-3 text-rose-400 hover:text-rose-300 transition-all bg-rose-500/10 rounded-2xl disabled:opacity-50 flex items-center gap-2"
              title={lang === 'bn' ? 'সব ডিলিট করুন' : 'Clear All'}
            >
              {isClearingAll ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest pr-1">
                {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-full backdrop-blur-xl text-white/40">
             <div className="flex -space-x-2">
               {members.slice(0, 3).map(m => (
                 <div key={m.id} className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center border-2 border-black text-xs">
                   {getRelationIcon(m.relation)}
                 </div>
               ))}
               {members.length > 3 && (
                 <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-2 border-black text-[10px] font-bold">
                   +{members.length - 3}
                 </div>
               )}
             </div>
             <div className="h-4 w-[1px] bg-white/10 mx-2" />
             <div className="text-[10px] font-black uppercase tracking-widest">
               {members.length} {lang === 'bn' ? 'সদস্য মনিটর হচ্ছে' : 'Members Active'}
             </div>
          </div>

          {/* Backup Buttons */}
          {auth.currentUser && (
            <div className="flex gap-2">
              <button 
                onClick={exportBackup}
                className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all border border-white/10 flex items-center gap-2"
                title={lang === 'bn' ? 'ব্যাকআপ ডাউনলোড করুন' : 'Export Backup'}
              >
                <Download size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'bn' ? 'ব্যাকআপ' : 'Backup'}</span>
              </button>
              <label className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all border border-white/10 flex items-center gap-2 cursor-pointer">
                <UploadIcon size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'bn' ? 'রিস্টোর' : 'Restore'}</span>
                <input type="file" accept=".json" onChange={importBackup} className="hidden" />
              </label>
            </div>
          )}
      </div>
    </div>

      <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[40px] p-12 border border-white/10 shadow-2xl mb-24 relative overflow-hidden group">
        <h3 className="font-display italic font-bold text-4xl text-[#c5a059] mb-12 text-center uppercase tracking-tighter">{t.statsTitle}</h3>
        <div className="flex flex-wrap justify-around gap-12 text-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="text-7xl font-black text-white leading-none">{stats.total}</div>
            <div className="luxury-text text-[#c5a059] mt-4">{t.totalMembers}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-7xl font-black text-white leading-none">{stats.upcoming}</div>
            <div className="luxury-text text-[#c5a059] mt-4">{t.upcoming}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-7xl font-black text-white leading-none">{stats.thisMonth}</div>
            <div className="luxury-text text-[#c5a059] mt-4">{t.thisMonth}</div>
          </div>
        </div>

        {stats.monthMembers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-16 pt-12 border-t border-white/5 relative z-10"
          >
            <p className="text-center luxury-text text-white/40 mb-8">
              {lang === 'bn' ? 'এই মাসের তারকারা' : 'Stars of the Month'}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {stats.monthMembers.map(m => (
                <div key={m.id} className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 flex items-center gap-4 hover:bg-[#c5a059]/10 hover:border-[#c5a059]/30 transition-all group">
                  <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{getRelationIcon(m.relation)}</span>
                  <div>
                    <p className="text-white font-display italic font-bold text-lg leading-tight">{m.name}</p>
                    <p className="luxury-text text-[#c5a059] text-[9px] mt-1">
                      {new Date(m.birthday).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Next Celebration Spotlight */}
      {members.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24"
        >
          {(() => {
            const sorted = members.map(m => ({ ...m, status: getNextBdayStatus(m.birthday) }))
              .sort((a, b) => a.status.next.getTime() - b.status.next.getTime());
            const nextMember = sorted[0];
            const cd = getCountdown(nextMember.status.next);
            
            return (
              <div className="relative bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-12 md:p-16 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#c5a059]/5 blur-[120px] rounded-full group-hover:opacity-100 transition-opacity duration-[2000ms]" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                  <div className="flex flex-col items-center text-center md:text-left md:items-start flex-1">
                    <div className="glass-card text-[10px] luxury-text text-[#c5a059] px-6 py-2 rounded-full mb-8 shadow-xl border border-[#c5a059]/20">
                      {lang === 'bn' ? 'পরবর্তী উৎসব' : 'Next Celebration'}
                    </div>
                    <div className="text-[120px] mb-6 filter grayscale brightness-200 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[1000ms] leading-none">
                      {getRelationIcon(nextMember.relation)}
                    </div>
                    <h4 className="font-display italic text-6xl text-white mb-4 tracking-tight leading-none">{nextMember.name}</h4>
                    <p className="luxury-text text-[#c5a059] text-sm opacity-60">
                      {(t.relationMap as any)[nextMember.relation] || nextMember.relation}
                    </p>
                    <div className="flex items-center gap-3 mt-8 luxury-text text-white/30 text-xs">
                      <Calendar size={14} className="text-[#c5a059]" />
                      <span>
                        {nextMember.status.next.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full max-w-2xl px-4">
                    <div className="grid grid-cols-4 gap-6">
                      {[
                        { val: cd.days, label: t.days },
                        { val: cd.hours, label: t.hours },
                        { val: cd.minutes, label: t.min },
                        { val: cd.seconds, label: t.sec }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 text-center backdrop-blur-3xl group/cd relative overflow-hidden transition-all hover:bg-white/5">
                          <div className="absolute inset-0 bg-[#c5a059]/5 opacity-0 group-hover/cd:opacity-100 transition-opacity" />
                          <motion.div 
                            key={`spotlight-${idx}-${item.val}`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-5xl font-black text-white leading-none mb-3"
                          >
                            {String(item.val).padStart(2, '0')}
                          </motion.div>
                          <div className="luxury-text text-[10px] text-white/30">{item.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-10 bg-white/[0.01] rounded-[32px] p-8 border border-white/5 text-center backdrop-blur-md">
                      <p className="luxury-text text-white/20 mb-2">
                        {lang === 'bn' ? 'বর্তমান বয়স' : 'Current Age'}
                      </p>
                      <p className="text-6xl font-black text-gradient">
                        {getAge(nextMember.birthday)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Main Content Area: Grid vs Monitoring */}
      {viewMode === 'monitoring' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 p-8 mb-16 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none">
            <Clock size={180} strokeWidth={1} />
          </div>

          <h3 className="font-serif text-4xl text-white mb-10 px-4 flex items-center gap-4">
            <div className="p-4 bg-pink-500/20 rounded-[30px] shadow-lg shadow-pink-500/5"><Clock className="text-pink-400" size={32} /></div>
            {lang === 'bn' ? 'আসন্ন জন্মদিনের মনিটরিং' : 'Active Birthday Watch'}
          </h3>

          <div className="space-y-6">
            {members.map(m => ({ ...m, status: getNextBdayStatus(m.birthday) }))
              .sort((a, b) => a.status.next.getTime() - b.status.next.getTime())
              .map((m, idx) => {
                const cd = getCountdown(m.status.next);
                const { isToday } = m.status;
                
                return (
                  <motion.div 
                    key={m.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group border rounded-[35px] p-8 flex flex-col lg:flex-row items-center gap-10 transition-all duration-500 ${
                      isToday ? 'bg-pink-500/20 border-pink-500/50 shadow-2xl shadow-pink-500/20' : 'bg-white/5 hover:bg-white/10 border-white/5 shadow-xl'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`text-6xl w-28 h-28 flex items-center justify-center rounded-[35px] border-2 shadow-inner group-hover:scale-110 transition-all duration-500 ${
                        isToday ? 'bg-pink-500/30 border-pink-500/50' : 'bg-white/5 border-white/10'
                      }`}>
                        {getRelationIcon(m.relation)}
                      </div>
                      {isToday && (
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -top-2 -right-2 bg-yellow-400 text-black p-2 rounded-full shadow-lg"
                        >
                          <Star size={16} fill="currentColor" />
                        </motion.div>
                      )}
                    </div>

                    <div className="flex-1 text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-4 mb-2">
                        <h4 className="text-3xl font-serif text-white">{m.name}</h4>
                        {isToday && (
                          <span className="bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                            {t.isToday}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center justify-center lg:justify-start gap-3">
                        <span className="text-pink-400">{(t.relationMap as any)[m.relation] || m.relation}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{new Date(m.birthday).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 p-2 bg-black/20 rounded-[30px] border border-white/5 shadow-inner">
                      {[
                        { val: cd.days, label: t.days, color: 'text-pink-400' },
                        { val: cd.hours, label: t.hours, color: 'text-white' },
                        { val: cd.minutes, label: t.min, color: 'text-white' },
                        { val: cd.seconds, label: t.sec, color: 'text-white/60' }
                      ].map((item, i) => (
                        <div key={i} className="px-6 py-3 rounded-2xl text-center min-w-[85px] border border-white/5 bg-white/5">
                          <motion.div 
                            key={`mon-${m.id}-${i}-${item.val}`}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={`text-2xl font-black ${item.color} drop-shadow-sm`}
                          >
                            {String(item.val).padStart(2, '0')}
                          </motion.div>
                          <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">{item.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap justify-center lg:justify-end gap-3 md:gap-4 shrink-0 mt-6 lg:mt-0">
                      <div className="text-center px-6 py-4 bg-yellow-400/10 rounded-3xl border border-yellow-400/20 group-hover:bg-yellow-400/20 transition-all">
                        <div className="text-3xl font-black text-yellow-500">{getAge(m.birthday)}</div>
                        <div className="text-[10px] font-black text-yellow-500/40 uppercase tracking-tighter">{t.age}</div>
                      </div>
                      {auth.currentUser && (
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => editMember(m)}
                            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/40 transition-all flex items-center justify-center border border-white/10"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteMember(m.id)}
                            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white/40 transition-all flex items-center justify-center border border-white/10"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      ) : (
        /* Members Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <AnimatePresence mode="popLayout">
            {members.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                className="col-span-full text-center py-40 luxury-text italic text-xl lowercase"
              >
                {t.empty}
              </motion.div>
            ) : (
              members.slice().reverse().map((m, i) => {
                const { next: nextBday, isToday } = getNextBdayStatus(m.birthday);
                const age = getAge(m.birthday);
                const nextBdayStr = nextBday.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                
                return (
                  <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.1 }}
                    layout
                    className={`glass-card rounded-[50px] p-10 text-center relative group transition-all duration-700 hover:-translate-y-2 overflow-hidden ${isToday ? 'border-[#c5a059] shadow-[0_32px_64px_rgba(197,160,89,0.2)]' : ''}`}
                  >
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-bl-[50px] pointer-events-none flex items-center justify-center">
                      <Star size={16} className={isToday ? "text-[#c5a059] animate-pulse" : "text-white/10"} />
                    </div>

                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="text-7xl mb-8 select-none"
                    >
                      {getRelationIcon(m.relation)}
                    </motion.div>
                    
                    <h3 className="font-display text-4xl text-white mb-2 italic font-bold tracking-tight">{m.name}</h3>
                    <div className="luxury-text opacity-40 mb-8">
                      {(t.relationMap as any)[m.relation] || m.relation}
                    </div>

                    <div className="space-y-6 mb-10">
                      <div className="flex flex-col items-center">
                        <span className="luxury-text text-[10px] mb-2">{t.age}</span>
                        <span className="text-5xl font-display font-black text-white/90 italic">{age}</span>
                      </div>

                      <div className="h-px w-12 bg-white/10 mx-auto" />

                      <div className="flex flex-col items-center">
                        <span className="luxury-text text-[10px] mb-2">{t.nextBday}</span>
                        <span className={`text-lg font-serif italic ${isToday ? 'text-[#c5a059] animate-pulse' : 'text-white/60'}`}>
                          {isToday ? t.happyBday : nextBdayStr}
                        </span>
                      </div>
                    </div>

                    {auth.currentUser && (
                      <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                        <button 
                          onClick={() => editMember(m)}
                          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-[#c5a059] hover:text-black transition-all flex items-center justify-center border border-white/10"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteMember(m.id)}
                          className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-white/10"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, memberId: null, all: false })}
        onConfirm={deleteConfirm.all ? confirmClearAll : confirmDeleteMember}
        title={deleteConfirm.all ? (lang === 'bn' ? 'সব ডিলিট করবেন?' : 'Clear Everything?') : (lang === 'bn' ? 'সদস্য ডিলিট করবেন?' : 'Delete Member?')}
        message={deleteConfirm.all 
          ? (lang === 'bn' ? 'আপনি কি নিশ্চিত যে সমস্ত পরিবারের সদস্য ডিলিট করতে চান? এটি আর ফিরিয়ে আনা সম্ভব নয়।' : 'Are you sure you want to clear all family members? This action cannot be undone.')
          : (lang === 'bn' ? 'আপনি কি এই সদস্যকে তালিকা থেকে ডিলিট করতে চান?' : 'Are you sure you want to remove this family member from the list?')
        }
        confirmText={lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}
        cancelText={lang === 'bn' ? 'না' : 'Cancel'}
      />
    </div>
  );
};
