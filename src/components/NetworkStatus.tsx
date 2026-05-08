import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';

export const NetworkStatus: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const t = {
    bn: {
      offlineTitle: "কোনো ইন্টারনেট কানেকশন নেই!",
      offlineSub: "অনুগ্রহ করে ওয়াইফাই বা মোবাইল ডাটা কানেক্ট করুন। আপনার পরিবর্তনগুলো তখন ডাটাবেসের সাথে সিনক্রোনাইজ হবে।",
      onlineBack: "ইন্টারনেট কানেকশন ফিরে এসেছে!",
      syncing: "ডাটাবেসের সাথে সিনক্রোনাইজ করা হচ্ছে...",
    },
    en: {
      offlineTitle: "No Internet Connection!",
      offlineSub: "Please connect to WiFi or mobile data. Your changes will then be synchronized with the database.",
      onlineBack: "You're back online!",
      syncing: "Synchronizing with the database...",
    }
  };

  const l = t[lang];

  return (
    <>
      {/* Small floating indicator when offline */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-500/90 backdrop-blur-md text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-3 font-bold border border-white/20"
          >
            <WifiOff size={16} className="animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest leading-none">{l.offlineTitle}</span>
            <div className="h-3 w-px bg-white/20" />
            <span className="text-[8px] opacity-70 font-medium">Offline Mode Active</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temporary notification when coming back online */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold"
          >
            <Wifi size={20} />
            <span>{l.onlineBack}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
