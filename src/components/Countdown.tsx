import React, { useState, useEffect, useRef } from 'react';
import { Settings, Check, X, Heart, Star, Sparkles, Clock, Calendar as CalendarIcon, Bell, Cake, Gift, PartyPopper, Share2, Download, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sounds } from '../lib/sounds';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs, query } from 'firebase/firestore';
import { toPng } from 'html-to-image';

interface EventData {
  id: string;
  name: string;
  date: string;
  icon: string;
  isMain?: boolean;
}

const DEFAULT_EVENTS: EventData[] = [
  { id: 'mom', name: "Mom's Birthday", date: '1975-01-01', icon: '🎂', isMain: true },
  { id: 'dad', name: "Dad's Birthday", date: '1970-01-01', icon: '🎉', isMain: true },
  { id: 'anniversary', name: 'Parents Anniversary', date: '1995-01-01', icon: '💑', isMain: true }
];

const texts = {
  bn: {
    title: "পারিবারিক জন্মদিন ট্র্যাকার",
    subtitle: "আমাদের পরিবারের প্রিয় মুহূর্ত এবং জন্মদিনগুলো মনে রাখার সহজ উপায় ⏳✨",
    nextAnni: "পরবর্তী মাইলফলক",
    together: "আমাদের অর্জিত সময়",
    days: "দিন", hours: "ঘন্টা", minutes: "মিনিট", seconds: "সেকেন্ড",
    age: "বছর",
    quote: '"ভালোবাসা মানে একে অপরের দিকে তাকানো নয়, ভালোবাসা মানে একসাথে একই দিকে তাকানো।"',
    author: "— আন্তোয়ান দে সেন্ত-এক্সুপেরি",
    editDates: "মাইলফলক এডিট করুন",
    save: "পরিবর্তনগুলো সেভ করুন",
    cancel: "বাতিল করুন",
    nameLabel: "নাম",
    dateLabel: "তারিখ",
    addBtn: "নতুন ডেট যোগ করুন",
    deleteBtn: "মুছে ফেলুন",
    iconLabel: "আইকন",
    syncing: "সিঙ্ক হচ্ছে...",
    synced: "সিঙ্ক হয়েছে",
    share: "শেয়ার করুন",
    shareTitle: "মাইলফলক শেয়ার করুন",
    copyLink: "লিঙ্ক কপি করুন",
    saveImage: "ছবি হিসেবে সেভ করুন",
    copied: "লিঙ্ক কপি হয়েছে!",
    shareMsg: (name: string, days: number) => `${name} মাইলফলকের জন্য মাত্র ${days} দিন বাকি! ⏳✨`
  },
  en: {
    title: "Family Birthdays",
    subtitle: "Keep track of the most precious dates in our family ⏳✨",
    nextAnni: "Next Milestone",
    together: "Time Elapsed",
    days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
    age: "Years",
    quote: '"Love does not consist in gazing at each other, but in looking outward together in the same direction."',
    author: "— Antoine de Saint-Exupéry",
    editDates: "Edit Milestones",
    save: "Save Changes",
    cancel: "Cancel",
    nameLabel: "Name",
    dateLabel: "Date",
    addBtn: "Add New Date",
    deleteBtn: "Delete",
    iconLabel: "Icon",
    syncing: "Syncing...",
    synced: "Synced",
    share: "Share",
    shareTitle: "Share Milestone",
    copyLink: "Copy Link",
    saveImage: "Save as Image",
    copied: "Link Copied!",
    shareMsg: (name: string, days: number) => `Only ${days} days left for ${name}! ⏳✨`
  }
};

const EMOJIS = ['🎂', '🎉', '💑', '❤️', '✨', '💍', '🏠', '✈️', '🌟', '🍼', '🎓', '🚀'];

export const Countdown: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [events, setEvents] = useState<EventData[]>(() => {
    const saved = localStorage.getItem('love_world_special_dates_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved dates", e);
      }
    }
    // Migration from v2 (object) to v3 (array)
    const oldSaved = localStorage.getItem('love_world_special_dates_v2');
    if (oldSaved) {
      try {
        const old = JSON.parse(oldSaved);
        return [
          { id: 'mim', ...old.mim, isMain: true },
          { id: 'awal', ...old.awal, isMain: true },
          { id: 'anniversary', ...old.anniversary, isMain: true }
        ];
      } catch (e) {
        console.error("Migration failed", e);
      }
    }
    return DEFAULT_EVENTS;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<EventData[]>(events);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: any }>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isInitialSync, setIsInitialSync] = useState(true);
  const notifiedToday = useRef<Set<string>>(new Set());
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const shareLink = async (event: EventData) => {
    const daysLeft = timeLeft[event.id]?.days || 0;
    const msg = (t.shareMsg as any)(event.name, daysLeft);
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: msg,
          url: url,
        });
        sounds.play('success');
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${msg}\n${url}`);
        alert(t.copied);
        sounds.play('success');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const downloadAsImage = async (id: string, name: string) => {
    const element = cardRefs.current[id];
    if (!element) return;

    try {
      setSyncStatus('syncing');
      // Create a specific container for the capture to avoid transparent/cluttered output if needed
      // But html-to-image usually handles the element itself well.
      const dataUrl = await toPng(element, {
        backgroundColor: '#0f0a1a',
        style: {
          borderRadius: '3rem',
          transform: 'scale(1)',
        },
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `milestone-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      
      sounds.play('success');
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error generating image:', err);
      setSyncStatus('error');
    }
  };

  // Firestore Sync
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSync = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setSyncStatus('syncing');
      const milestonesRef = collection(db, 'users', user.uid, 'milestones');

      // 1. Initial catch-up from Firestore if local is empty
      const snapshot = await getDocs(milestonesRef);
      if (snapshot.empty && events.length > 0 && isInitialSync) {
        const batch = writeBatch(db);
        events.forEach(ev => {
          const docRef = doc(milestonesRef, ev.id);
          batch.set(docRef, ev);
        });
        await batch.commit();
      }

      // 2. Subscription
      unsubscribe = onSnapshot(milestonesRef, (snap) => {
        const firestoreEvents: EventData[] = [];
        snap.forEach(doc => firestoreEvents.push(doc.data() as EventData));
        
        if (firestoreEvents.length > 0 || !isInitialSync) {
          // Sort to maintain consistency if needed, though they are stored by ID
          setEvents(firestoreEvents);
        }
        setSyncStatus('synced');
        setIsInitialSync(false);
      }, (err) => {
        if (auth.currentUser) handleFirestoreError(err, OperationType.LIST, milestonesRef.path);
        setSyncStatus('error');
      });
    };

    setupSync();
    return () => unsubscribe?.();
  }, [auth.currentUser]);

  const saveToFirestore = async (updatedEvents: EventData[]) => {
    if (!auth.currentUser) return;
    try {
      setSyncStatus('syncing');
      const milestonesRef = collection(db, 'users', auth.currentUser.uid, 'milestones');
      
      // Since we are editing the whole list, we might want to reconcile.
      // But for simplicity, we'll just update/add what's in the list.
      // And we need to delete what's removed.
      
      const currentSnapshot = await getDocs(milestonesRef);
      const batch = writeBatch(db);
      
      // Delete removed
      currentSnapshot.forEach(doc => {
        if (!updatedEvents.find(e => e.id === doc.id)) {
          batch.delete(doc.ref);
        }
      });

      // Update/Set current
      updatedEvents.forEach(ev => {
        batch.set(doc(milestonesRef, ev.id), ev);
      });

      await batch.commit();
      setSyncStatus('synced');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}/milestones`);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    sounds.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const playBirthdaySound = () => {
    sounds.play('notification');
  };

  // Use ref for events to avoid dependency loop in timer if needed, 
  // though it's less critical here since events doesn't change often.
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const getNextOccurrence = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    let next = new Date(now.getFullYear(), date.getMonth(), date.getDate());
    if (next < now) next = new Date(now.getFullYear() + 1, date.getMonth(), date.getDate());
    return next;
  };

  const getAge = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const hasHad = now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
    if (!hasHad) age--;
    return age;
  };

  const calculateDiff = (target: Date) => {
    const diff = target.getTime() - new Date().getTime();
    if (diff < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  };

  const calculatePast = (dateStr: string) => {
    const start = new Date(dateStr);
    const diff = new Date().getTime() - start.getTime();
    if (diff < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  };

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
      new Notification(lang === 'bn' ? 'নোটিফিকেশন অন করা হয়েছে! 🎉' : 'Notifications Enabled! 🎉', {
        body: lang === 'bn' ? 'আপনার বিশেষ দিনগুলোতে আমরা আপনাকে জানিয়ে দেব।' : 'We will let you know on your special days.',
        icon: '/favicon.ico'
      });
      playBirthdaySound();
    }
  };

  const checkBirthdays = (eventList: EventData[]) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const todayStr = `${now.getMonth() + 1}-${now.getDate()}`;
    const tomorrowStr = `${tomorrow.getMonth() + 1}-${tomorrow.getDate()}`;

    eventList.forEach(event => {
      const eventDate = new Date(event.date);
      const eventStr = `${eventDate.getMonth() + 1}-${eventDate.getDate()}`;
      
      const uniqueKeyToday = `${event.id}-${now.getFullYear()}-today`;
      const uniqueKeyTomorrow = `${event.id}-${now.getFullYear()}-tomorrow`;

      if (todayStr === eventStr && !notifiedToday.current.has(uniqueKeyToday)) {
        if (notificationsEnabled) {
          new Notification(lang === 'bn' ? `শুভ জন্মদিন / মাইলফলক! 🎉` : `Happy Birthday / Milestone! 🎉`, {
            body: lang === 'bn' ? `আজ ${event.name}! তোমার দিনটি অনেক ভালো কাটুক। ❤️` : `Today is ${event.name}! Have a wonderful day. ❤️`,
            icon: event.icon || '✨'
          });
          playBirthdaySound();
          notifiedToday.current.add(uniqueKeyToday);
        }
      } else if (tomorrowStr === eventStr && !notifiedToday.current.has(uniqueKeyTomorrow)) {
        if (notificationsEnabled) {
          new Notification(lang === 'bn' ? `আগামীকাল একটি বিশেষ দিন! 🎈` : `Special Day Tomorrow! 🎈`, {
            body: lang === 'bn' ? `আগামীকাল ${event.name}! প্রস্ততি নিতে ভুলবেন না। ✨` : `Tomorrow is ${event.name}! Don't forget to prepare something. ✨`,
            icon: event.icon || '✨'
          });
          playBirthdaySound();
          notifiedToday.current.add(uniqueKeyTomorrow);
        }
      }
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: { [key: string]: any } = {};
      events.forEach(event => {
        newTimeLeft[event.id] = calculateDiff(getNextOccurrence(event.date));
      });
      // Special "together" logic still tied to anniversary for now
      const anni = events.find(e => e.id === 'anniversary');
      if (anni) {
        newTimeLeft['together'] = calculatePast(anni.date);
      }
      setTimeLeft(newTimeLeft);

      // Check for birthdays periodically
      if (new Date().getSeconds() === 0) { 
        checkBirthdays(events);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [events, notificationsEnabled]);

  const handleSave = () => {
    setEvents(editFormData);
    saveToFirestore(editFormData);
    localStorage.setItem('love_world_special_dates_v3', JSON.stringify(editFormData));
    sounds.play('success');
    setIsEditing(false);
  };

  const addNewEvent = () => {
    sounds.play('click');
    const newEvent: EventData = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Event',
      date: new Date().toISOString().split('T')[0],
      icon: '✨'
    };
    setEditFormData([...editFormData, newEvent]);
  };

  const removeEvent = (id: string) => {
    if (id === 'anniversary' || id === 'mom' || id === 'dad') return; // Protect main ones
    if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this?')) {
      sounds.play('error');
      setEditFormData(editFormData.filter(e => e.id !== id));
    }
  };

  const t = texts[lang];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 120 }
    }
  };

  const anniversaryEvent = events.find(e => e.id === 'anniversary');
  const mainEvents = events.filter(e => e.id !== 'anniversary' && (e.id === 'mom' || e.id === 'dad'));
  const otherEvents = events.filter(e => e.id !== 'anniversary' && e.id !== 'mom' && e.id !== 'dad');

  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-6 relative font-sans text-white">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-end mb-12 gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.play('click'); setSoundEnabled(!soundEnabled); }}
            className={`p-2.5 rounded-full transition-all border backdrop-blur-xl shadow-lg flex items-center gap-2 ${soundEnabled ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-white/5 border-white/10 text-white/40'}`}
            title={lang === 'bn' ? 'সাউন্ড অন/অফ' : 'Sound On/Off'}
          >
            {soundEnabled ? <Bell size={18} /> : <X size={18} />}
          </motion.button>

          {!notificationsEnabled && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={requestNotificationPermission}
              className="flex items-center gap-2 px-6 py-2.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white rounded-full transition-all border border-pink-500/30 backdrop-blur-xl shadow-lg group"
            >
              <Bell size={18} className="animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {lang === 'bn' ? 'রিমাইন্ডার অন করুন' : 'Enable Reminders'}
              </span>
            </motion.button>
          )}

          {auth.currentUser && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all border border-white/10 backdrop-blur-xl shadow-lg group"
            >
              <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-xs font-bold uppercase tracking-widest">{t.editDates}</span>
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-black/40 backdrop-blur-3xl rounded-[2rem] p-8 md:p-12 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] mb-16 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Settings size={120} className="animate-spin-slow" />
              </div>

              <h3 className="font-serif text-4xl text-white mb-10 text-center tracking-tight">{t.editDates}</h3>
              
              <div className="grid grid-cols-1 gap-8 mb-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {editFormData.map((item, idx) => (
                  <div key={item.id} className="space-y-6 bg-white/5 p-6 rounded-3xl border border-white/5 relative group/item">
                    {!item.isMain && (
                      <button 
                        onClick={() => removeEvent(item.id)}
                        className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-400 transition-all opacity-0 group-hover/item:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-black uppercase tracking-[0.2em] text-white/40">
                        {item.id === 'anniversary' ? t.nextAnni : `Milestone #${idx + 1}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-white/50 uppercase ml-2">{t.nameLabel}</label>
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={e => {
                            const newArr = [...editFormData];
                            newArr[idx].name = e.target.value;
                            setEditFormData(newArr);
                          }}
                          className="bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all font-medium"
                          placeholder="Event Name"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-white/50 uppercase ml-2">{t.dateLabel}</label>
                        <input 
                          type="date" 
                          value={item.date}
                          onChange={e => {
                            const newArr = [...editFormData];
                            newArr[idx].date = e.target.value;
                            setEditFormData(newArr);
                          }}
                          className="bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all cursor-pointer font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-bold text-white/50 uppercase ml-2">{t.iconLabel}</label>
                      <div className="flex flex-wrap gap-2">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              const newArr = [...editFormData];
                              newArr[idx].icon = emoji;
                              setEditFormData(newArr);
                            }}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all text-xl ${item.icon === emoji ? 'bg-pink-500/40 border-pink-500 border' : 'bg-white/5 hover:bg-white/10'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row justify-center gap-6">
                <button 
                  onClick={addNewEvent}
                  className="flex items-center gap-3 px-8 py-4 bg-white/10 text-white rounded-2xl font-black hover:bg-white/20 transition-all border border-white/10"
                >
                  <Clock size={20} />
                  {t.addBtn}
                </button>
                <div className="flex gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black shadow-[0_10px_20px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_30px_rgba(244,63,94,0.4)] transition-all flex-1"
                  >
                    <Check size={20} />
                    {t.save}
                  </motion.button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-3 px-10 py-5 bg-white/10 text-white rounded-2xl font-black hover:bg-white/20 transition-all border border-white/10"
                  >
                    <X size={20} />
                    {t.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-20"
        >
          <h2 className="font-serif text-6xl md:text-8xl text-white mb-6 drop-shadow-[0_10px_30px_rgba(255,255,255,0.15)] tracking-tighter">
            {t.title}
          </h2>
          <p className="text-white/60 italic text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Main Milestones (Highlights) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
        >
          {mainEvents.map((item, idx) => (
            <motion.div 
              key={item.id} 
              variants={itemVariants}
              whileHover={{ y: -12, scale: 1.02 }}
              ref={el => cardRefs.current[item.id] = el}
              className={`relative overflow-hidden rounded-[3rem] p-1 border border-white/20 shadow-2xl group cursor-default h-full bg-gradient-to-br ${idx % 2 === 0 ? 'from-pink-500/10 to-purple-600/10' : 'from-blue-500/10 to-indigo-600/10'}`}
            >
              {/* Background Flourishes */}
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                {idx % 2 === 0 ? <Cake size={160} strokeWidth={1} /> : <Gift size={160} strokeWidth={1} />}
              </div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />

              <div className="relative bg-white/5 backdrop-blur-3xl rounded-[2.8rem] p-10 h-full border border-white/5 flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400 mb-1"
                    >
                      {lang === 'bn' ? 'শুভ জন্মদিন' : 'Upcoming Birthday'}
                    </motion.div>
                    <h3 className="font-serif text-5xl text-white leading-tight drop-shadow-md">
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="relative">
                      <div className="text-6xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] animate-bounce-slow">
                        {item.icon}
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -top-2 -right-2 text-yellow-400"
                      >
                        <Sparkles size={20} />
                      </motion.div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); shareLink(item); }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all shadow-lg"
                        title={t.copyLink}
                      >
                        <Share2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadAsImage(item.id, item.name); }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/60 hover:text-white transition-all shadow-lg"
                        title={t.saveImage}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="flex items-center gap-6 mb-10">
                    <div className="relative">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <motion.circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray="264"
                          initial={{ strokeDashoffset: 264 }}
                          animate={{ strokeDashoffset: 264 - (264 * (getAge(item.date) % 100) / 100) }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          className="text-pink-400"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white">{getAge(item.date)}</span>
                        <span className="text-[8px] font-bold uppercase text-white/40">{t.age}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                        <CalendarIcon size={14} className="text-pink-400/60" />
                        {new Date(item.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-rose-300 font-bold text-xs uppercase tracking-widest">
                        {lang === 'bn' ? 'উত্তেজনা বাড়ছে!' : 'The countdown begins!'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: t.days, val: timeLeft[item.id]?.days, color: 'text-pink-400' },
                      { label: t.hours, val: timeLeft[item.id]?.hours, color: 'text-purple-400' },
                      { label: t.minutes, val: timeLeft[item.id]?.minutes, color: 'text-blue-400' },
                      { label: t.seconds, val: timeLeft[item.id]?.seconds, color: 'text-emerald-400' },
                    ].map((part, j) => (
                      <div key={j} className="relative group/timer">
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl py-4 border border-white/5 flex flex-col items-center justify-center transition-all group-hover/timer:bg-black/30 group-hover/timer:scale-105">
                          <div className={`text-2xl md:text-3xl font-black ${part.color} tracking-tighter`}>
                            {String(part.val || 0).padStart(2, '0')}
                          </div>
                          <div className="text-[8px] text-white/30 uppercase font-black tracking-widest mt-1">
                            {part.label.length > 5 ? part.label.slice(0, 3) : part.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex -space-x-2">
                    {[PartyPopper, Star, Heart].map((Icon, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                        <Icon size={14} className="text-white/40" />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
                    Family Forever
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Global Anniversary Milestone */}
        {anniversaryEvent && (
          <motion.div 
            key={anniversaryEvent.id}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            ref={el => cardRefs.current[anniversaryEvent.id] = el}
            className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-12 border border-white/10 shadow-2xl relative overflow-hidden mb-12 group"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-20">
              <button 
                onClick={() => shareLink(anniversaryEvent)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white/60 hover:text-white transition-all shadow-lg flex items-center gap-2"
                title={t.copyLink}
              >
                <Share2 size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.share}</span>
              </button>
              <button 
                onClick={() => downloadAsImage(anniversaryEvent.id, anniversaryEvent.name)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white/60 hover:text-white transition-all shadow-lg"
                title={t.saveImage}
              >
                <Download size={18} />
              </button>
            </div>

            <div className="text-center relative z-10">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-[0.3em] mb-8">
                <Clock size={14} />
                {t.nextAnni}
              </div>
              
              <div className="text-6xl mb-4 drop-shadow-2xl">{anniversaryEvent.icon}</div>
              <h3 className="font-serif text-5xl md:text-6xl text-white mb-4 tracking-tight drop-shadow-lg">
                {anniversaryEvent.name}
              </h3>
              <div className="text-lg text-white/50 mb-12 font-medium">
                {new Date(anniversaryEvent.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <div className="flex justify-center flex-wrap gap-4 md:gap-8 max-w-3xl mx-auto">
                {[
                  { label: t.days, val: timeLeft[anniversaryEvent.id]?.days },
                  { label: t.hours, val: timeLeft[anniversaryEvent.id]?.hours },
                  { label: t.minutes, val: timeLeft[anniversaryEvent.id]?.minutes },
                  { label: t.seconds, val: timeLeft[anniversaryEvent.id]?.seconds },
                ].map((part, i) => (
                  <div key={i} className="flex flex-col items-center min-w-[80px] md:min-w-[120px]">
                    <div className="relative group/counter">
                      <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl group-hover/counter:bg-white/10 transition-all" />
                      <div className="relative text-5xl md:text-7xl font-black text-rose-400 drop-shadow-[0_0_20px_rgba(251,113,133,0.4)]">
                        {String(part.val || 0).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-[10px] md:text-xs text-white/40 mt-4 uppercase font-black tracking-[0.2em]">{part.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Other Custom Milestones */}
        {otherEvents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {otherEvents.map(item => (
              <motion.div 
                key={item.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                whileHover={{ y: -5, scale: 1.02 }}
                ref={el => cardRefs.current[item.id] = el}
                className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-xl relative overflow-hidden group"
              >
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-all" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="text-4xl group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => shareLink(item)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      title={t.share}
                    >
                      <Share2 size={12} />
                    </button>
                    <button 
                      onClick={() => downloadAsImage(item.id, item.name)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      title={t.saveImage}
                    >
                      <Download size={12} />
                    </button>
                    <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-rose-300">
                      {getAge(item.date)} {t.age}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <h4 className="font-serif text-2xl text-white truncate">{item.name}</h4>
                  <div className="text-[10px] text-white/40 font-medium uppercase tracking-widest flex items-center gap-1">
                    <CalendarIcon size={10} />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{timeLeft[item.id]?.days || 0}</span>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t.days}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'H', val: timeLeft[item.id]?.hours, color: 'text-amber-400' },
                      { label: 'M', val: timeLeft[item.id]?.minutes, color: 'text-emerald-400' },
                      { label: 'S', val: timeLeft[item.id]?.seconds, color: 'text-sky-400' },
                    ].map((p, i) => (
                      <div key={i} className="bg-black/20 rounded-xl py-2 flex flex-col items-center">
                        <span className={`text-sm font-black ${p.color}`}>{String(p.val || 0).padStart(2, '0')}</span>
                        <span className="text-[8px] text-white/20 font-black">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Together Timer (Footer Accent) */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 backdrop-blur-2xl rounded-[3rem] p-12 md:p-16 border border-white/10 shadow-3xl text-center"
        >
          <div className="text-yellow-400 mb-8 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
          </div>
          
          <h3 className="font-serif text-4xl md:text-5xl text-[#fbcfe8] mb-12 tracking-tight">{t.together}</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-4xl mx-auto mb-16">
            {[
              { label: t.days, val: timeLeft.together?.days, color: 'text-rose-400' },
              { label: t.hours, val: timeLeft.together?.hours, color: 'text-amber-400' },
              { label: t.minutes, val: timeLeft.together?.minutes, color: 'text-emerald-400' },
              { label: t.seconds, val: timeLeft.together?.seconds, color: 'text-sky-400' },
            ].map((part, i) => (
              <div key={i} className="bg-white/5 rounded-[2rem] p-6 md:p-8 border border-white/5 flex flex-col items-center">
                <div className={`text-4xl md:text-5xl font-black ${part.color} drop-shadow-lg mb-2`}>
                  {part.val || 0}
                </div>
                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">{part.label}</div>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto relative px-12">
            <span className="absolute top-0 left-0 text-7xl text-white/10 font-serif leading-none mt-[-20px]">“</span>
            <p className="font-serif text-2xl md:text-3xl text-white/80 leading-relaxed italic relative z-10">
              {t.quote}
            </p>
            <span className="block mt-8 text-rose-300 font-bold uppercase tracking-[0.2em] text-sm animate-pulse">
              {t.author}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

