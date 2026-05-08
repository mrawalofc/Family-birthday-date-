import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, RotateCcw, Save, Users, Calendar, Clock, Star, Loader2, Bell, X, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { sounds } from '../lib/sounds';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch, getDocs } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthday) return;

    if (editingId) {
      const updated = members.find(m => m.id === editingId);
      if (updated) {
        const newData = { ...updated, ...formData };
        setMembers(members.map(m => m.id === editingId ? newData : m));
        sounds.play('success');
      }
      setEditingId(null);
    } else {
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        ...formData,
        createdAt: Date.now()
      };
      setMembers([...members, newMember]);
      sounds.play('success');
    }
    setFormData({ name: '', relation: 'Father', birthday: '' });
  };

  const deleteMember = (id: string) => {
    if (window.confirm('Are you sure?')) {
      setMembers(members.filter(m => m.id !== id));
      sounds.play('click');
    }
  };

  const editMember = (m: FamilyMember) => {
    sounds.play('click');
    setFormData({ name: m.name, relation: m.relation, birthday: m.birthday });
    setEditingId(m.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllMembers = () => {
    if (!window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি সমস্ত পরিবারের সদস্যদের তালিকা ডিলিট করতে চান?' : 'Are you sure you want to clear all family members?')) return;
    
    sounds.play('error');
    setIsClearingAll(true);
    setTimeout(() => {
      setMembers([]);
      setIsClearingAll(false);
    }, 500);
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
    <div className="w-full max-w-6xl mx-auto py-10 px-5 relative z-10">
      <div className="text-center mb-16 space-y-4">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-6xl md:text-7xl text-white drop-shadow-[0_0_25px_rgba(255,105,180,0.6)]"
        >
          {t.title}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/70 italic text-xl"
        >
          {t.subtitle}
        </motion.p>
      </div>

      {/* Form Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-2xl rounded-[40px] p-8 md:p-12 border border-white/20 shadow-2xl mb-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 text-pink-500/10 pointer-events-none">
          <Star size={120} strokeWidth={1} />
        </div>

        <h3 className="font-serif text-3xl text-pink-300 mb-8 text-center flex items-center justify-center gap-3">
          {t.formTitle}
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> {t.lblName}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all font-medium"
              placeholder="Full Name"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Star size={14} /> {t.lblRelation}
            </label>
            <div className="relative">
              <select
                value={formData.relation}
                onChange={e => setFormData({ ...formData, relation: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all appearance-none cursor-pointer"
              >
                {relations.map(r => (
                  <option key={r} value={r} className="bg-gray-900 text-white">
                    {(t.relationMap as any)[r] || r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> {t.lblBirthday}
              </label>
              <button 
                type="button"
                onClick={() => setDateInputType(dateInputType === 'picker' ? 'text' : 'picker')}
                className="text-[10px] font-black text-pink-400 hover:text-pink-300 transition-colors uppercase tracking-widest"
              >
                {dateInputType === 'picker' ? (lang === 'bn' ? 'ম্যানুয়াল এডিট' : 'Manual Edit') : (lang === 'bn' ? 'পিকার ব্যবহার করুন' : 'Use Picker')}
              </button>
            </div>
            {dateInputType === 'picker' ? (
              <input
                type="date"
                value={formData.birthday}
                onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                className="bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all cursor-pointer"
              />
            ) : (
              <input
                type="text"
                value={formData.birthday}
                onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                placeholder="YYYY-MM-DD"
                className="bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all font-medium"
              />
            )}
          </div>

          <div className="md:col-span-3 flex flex-wrap justify-center gap-4 md:gap-6 mt-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit" 
              className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-12 py-4 rounded-xl font-bold shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 transition-all flex items-center gap-3"
            >
              {editingId ? <Save size={20} /> : <Plus size={20} />}
              {editingId ? t.btnUpdate : t.btnAdd}
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button" 
              onClick={() => { setFormData({ name: '', relation: 'Father', birthday: '' }); setEditingId(null); }}
              className="bg-white/5 text-white border border-white/10 px-12 py-4 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-3"
            >
              <RotateCcw size={20} /> {t.btnClear}
            </motion.button>
          </div>
        </form>
      </motion.div>

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
      </div>
    </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-[35px] p-10 border border-white/10 shadow-2xl mb-16 relative overflow-hidden group">
        <h3 className="font-serif text-3xl text-pink-200 mb-8 text-center">{t.statsTitle}</h3>
        <div className="flex flex-wrap justify-around gap-12 text-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">{stats.total}</div>
            <div className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-3">{t.totalMembers}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-6xl font-black text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,0.5)]">{stats.upcoming}</div>
            <div className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-3">{t.upcoming}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-6xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">{stats.thisMonth}</div>
            <div className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-3">{t.thisMonth}</div>
          </div>
        </div>

        {stats.monthMembers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-12 pt-8 border-t border-white/5 relative z-10"
          >
            <p className="text-center text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.5em] mb-6">
              {lang === 'bn' ? 'এই মাসের তারকারা' : 'Stars of the Month'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {stats.monthMembers.map(m => (
                <div key={m.id} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 hover:bg-white/10 transition-all">
                  <span className="text-xl">{getRelationIcon(m.relation)}</span>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{m.name}</p>
                    <p className="text-white/30 text-[10px] uppercase font-black tracking-widest">
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
          className="mb-16"
        >
          {(() => {
            const sorted = members.map(m => ({ ...m, status: getNextBdayStatus(m.birthday) }))
              .sort((a, b) => a.status.next.getTime() - b.status.next.getTime());
            const nextMember = sorted[0];
            const cd = getCountdown(nextMember.status.next);
            
            return (
              <div className="relative bg-gradient-to-br from-pink-500/20 to-purple-600/20 backdrop-blur-3xl rounded-[50px] p-10 border border-white/20 shadow-pink-500/10 shadow-2xl overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full group-hover:bg-pink-500/20 transition-all duration-1000" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full group-hover:bg-purple-500/20 transition-all duration-1000" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                  <div className="flex flex-col items-center text-center md:text-left md:items-start flex-1">
                    <div className="bg-pink-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest shadow-lg shadow-pink-500/30">
                      {lang === 'bn' ? 'পরবর্তী উৎসব' : 'Next Celebration'}
                    </div>
                    <div className="text-8xl mb-4 animate-bounce-slow">
                      {getRelationIcon(nextMember.relation)}
                    </div>
                    <h4 className="font-serif text-5xl text-white mb-2">{nextMember.name}</h4>
                    <p className="text-pink-300 font-bold text-lg uppercase tracking-widest">
                      {(t.relationMap as any)[nextMember.relation] || nextMember.relation}
                    </p>
                    <div className="flex items-center gap-2 mt-4 text-white/40">
                      <Calendar size={16} />
                      <span className="text-sm">
                        {nextMember.status.next.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full max-w-xl">
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { val: cd.days, label: t.days },
                        { val: cd.hours, label: t.hours },
                        { val: cd.minutes, label: t.min },
                        { val: cd.seconds, label: t.sec }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-md rounded-[30px] p-6 border border-white/10 text-center shadow-inner group/box relative overflow-hidden">
                          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/box:opacity-100 transition-opacity" />
                          <motion.div 
                            key={`spotlight-${idx}-${item.val}`}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-2"
                          >
                            {String(item.val).padStart(2, '0')}
                          </motion.div>
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{item.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 bg-black/30 rounded-3xl p-6 border border-white/5 text-center">
                      <p className="text-white/60 text-sm font-medium mb-1 uppercase tracking-widest">
                        {lang === 'bn' ? 'বর্তমান বয়স' : 'Current Age'}
                      </p>
                      <p className="text-4xl font-black text-yellow-400 drop-shadow-md">
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
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      ) : (
        /* Members Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {members.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                className="col-span-full text-center py-32 text-white italic text-2xl"
              >
                {t.empty}
              </motion.div>
            ) : (
              members.slice().reverse().map((m, i) => {
                const { next: nextBday, isToday } = getNextBdayStatus(m.birthday);
                const cd = getCountdown(nextBday);
                const age = getAge(m.birthday);
                const nextBdayStr = nextBday.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                
                return (
                  <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ delay: i * 0.05 }}
                    layout
                    className={`bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[45px] p-8 text-center relative group hover:bg-white/10 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 ${isToday ? 'ring-4 ring-pink-500/50' : ''}`}
                  >
                    {isToday && (
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-black px-4 py-1 rounded-full shadow-lg"
                      >
                        {t.isToday}
                      </motion.div>
                    )}

                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500 block">
                      {getRelationIcon(m.relation)}
                    </div>
                    
                    <div className="font-serif text-3xl text-pink-200 mb-2">{m.name}</div>
                    <div className="text-sm font-bold text-white/30 uppercase tracking-[0.2em] mb-4">
                      {(t.relationMap as any)[m.relation] || m.relation}
                    </div>

                    <div className="bg-white/5 rounded-3xl p-4 mb-6 border border-white/5">
                      <div className="text-xs text-white/40 uppercase font-black mb-1">{t.nextBday}</div>
                      <div className="text-pink-400 font-bold">{isToday ? t.happyBday : nextBdayStr}</div>
                    </div>

                    <div className="text-4xl font-black text-yellow-400 mb-8 drop-shadow-md">
                      {t.age}: {age}
                    </div>

                    <div className={`bg-gradient-to-br transition-all duration-500 ${isToday ? 'from-yellow-400/20 to-pink-500/20' : 'from-pink-500/20 to-purple-500/20'} rounded-[30px] p-4 border border-white/10 mb-8 flex justify-center items-center gap-2`}>
                      <span className="text-2xl font-black text-white">
                        {isToday ? '0' : cd.days}
                      </span>
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t.daysLeft}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-8">
                      {[
                        { val: isToday ? 0 : cd.days, label: t.days },
                        { val: isToday ? 0 : cd.hours, label: t.hours },
                        { val: isToday ? 0 : cd.minutes, label: t.min },
                        { val: isToday ? 0 : cd.seconds, label: t.sec }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-black/20 rounded-2xl p-3 border border-white/5">
                          <motion.div 
                            key={`${m.id}-${idx}-${item.val}`}
                            initial={{ y: -5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-xl font-black text-white"
                          >
                            {String(item.val).padStart(2, '0')}
                          </motion.div>
                          <div className="text-[8px] font-bold text-white/30 uppercase tracking-tighter mt-1">{item.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => editMember(m)}
                        className="bg-emerald-500/80 text-white p-3.5 rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20"
                      >
                        <Edit2 size={18} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteMember(m.id)}
                        className="bg-rose-500/80 text-white p-3.5 rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-500/20"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
