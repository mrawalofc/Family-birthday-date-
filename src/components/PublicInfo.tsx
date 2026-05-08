import React from 'react';
import { motion } from 'motion/react';
import { FileText, Clock } from 'lucide-react';

const texts = {
  bn: {
    title: "জনসাধারণের তথ্য",
    subtitle: "আমাদের পরিবারের আরও সদস্যদের তথ্য যোগ করুন 👫",
    infoTitle: "📋 তথ্য ফরম",
    instruction: "সদস্যদের তথ্য দিন এবং আপডেট হওয়ার জন্য ১২ ঘণ্টা অপেক্ষা করুন",
    loading: "লোড হচ্ছে...",
  },
  en: {
    title: "Public Information",
    subtitle: "Add more members to our family collection 👫",
    infoTitle: "📋 Information Form",
    instruction: "Add Members Information and wait 12 hours for the update",
    loading: "Loading...",
  }
};

export const PublicInfo: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const t = texts[lang];

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-5">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20"
        >
          <FileText className="text-pink-400" size={48} />
        </motion.div>
        <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-[0_0_20px_rgba(255,105,180,0.6)]">
          {t.title}
        </h2>
        <p className="text-white/70 italic text-lg">{t.subtitle}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-[30px] p-8 border border-white/15 shadow-2xl overflow-hidden relative"
      >
        <div className="flex items-center justify-center gap-3 mb-8 text-[#ffb3d1]">
          <Clock size={24} className="animate-pulse" />
          <h3 className="font-serif text-2xl md:text-3xl font-bold">
            {t.infoTitle}
          </h3>
        </div>
        
        <p className="text-center text-white/80 mb-8 bg-white/5 py-4 px-6 rounded-2xl border border-white/10 inline-block w-full">
          {t.instruction}
        </p>

        <div className="flex justify-center overflow-x-auto rounded-3xl shadow-2xl border-4 border-white/10 bg-white/5 min-h-[600px] relative">
          <iframe 
            src="https://docs.google.com/forms/d/e/1FAIpQLSdUr7KqMlL2Ouftn8ZNU0Dab0a-EQqeTGpdlNQC5HyYdpT7BA/viewform?embedded=true" 
            width="640" 
            height="800" 
            frameBorder="0" 
            marginHeight={0} 
            marginWidth={0}
            className="max-w-full scale-[0.85] md:scale-100 origin-top"
          >
            {t.loading}
          </iframe>
        </div>

        <div className="mt-10 flex justify-center gap-4 text-3xl">
          <span>💖</span><span>👨‍👩‍👧‍👦</span><span>💖</span>
        </div>
      </motion.div>
    </div>
  );
};
