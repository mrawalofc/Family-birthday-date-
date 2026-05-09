import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Sparkles } from 'lucide-react';
import { sounds } from '../lib/sounds';

interface Question {
  emoji: string;
  question: string;
  options: { text: string; emoji: string }[];
  correct: number;
}

const quizData: Record<'bn' | 'en', Question[]> = {
  bn: [
    { emoji: "📍", question: "আমাদের প্রথম দেখা কোথায় হয়েছিল?", options: [{ text: "পার্কে", emoji: "🌳" }, { text: "স্কুলে", emoji: "🏫" }, { text: "অনলাইনে", emoji: "🌐" }, { text: "ক্যাফেতে", emoji: "☕" }], correct: 2 },
    { emoji: "💖", question: "কে বেশি ভালোবাসে?", options: [{ text: "আওয়াল", emoji: "🙋‍♂️" }, { text: "মিম", emoji: "🙋‍♀️" }, { text: "দুজনেই সমান", emoji: "💑" }, { text: "কেউ না", emoji: "🚫" }], correct: 2 },
    { emoji: "✈️", question: "আমাদের সবচেয়ে প্রিয় শখ কী?", options: [{ text: "ভ্রমণ করা", emoji: "🌏" }, { text: "বেশি ঘুমানো", emoji: "😴" }, { text: "খাওয়া-দাওয়া", emoji: "🍟" }, { text: "সিনেমা দেখা", emoji: "🎬" }], correct: 0 },
    { emoji: "🎨", question: "মিমের প্রিয় রং কী?", options: [{ text: "পিঙ্ক", emoji: "💖" }, { text: "লাল", emoji: "❤️" }, { text: "কালো", emoji: "🖤" }, { text: "সাদা", emoji: "🤍" }], correct: 0 },
    { emoji: "🗺️", question: "আমাদের স্বপ্নের গন্তব্য কোথায়?", options: [{ text: "প্যারিস", emoji: "🗼" }, { text: "সুইজারল্যান্ড", emoji: "🏔️" }, { text: "মালদ্বীপ", emoji: "🏝️" }, { text: "কাশ্মীর", emoji: "🏔️" }], correct: 1 },
    { emoji: "🍛", question: "আওয়ালের প্রিয় খাবার কী?", options: [{ text: "বিরিয়ানি", emoji: "🍛" }, { text: "পিজ্জা", emoji: "🍕" }, { text: "ফুচকা", emoji: "🍟" }, { text: "সবকিছু", emoji: "😋" }], correct: 0 },
    { emoji: "🎁", question: "আমাদের প্রথম গিফট কী ছিল?", options: [{ text: "ফুল", emoji: "🌹" }, { text: "আংটি", emoji: "💍" }, { text: "চিঠি", emoji: "💌" }, { text: "চকলেট", emoji: "🍫" }], correct: 2 },
    { emoji: "😡", question: "কে বেশি রাগ করে?", options: [{ text: "আওয়াল", emoji: "😤" }, { text: "মিম", emoji: "😠" }, { text: "দুজনেই", emoji: "🔥" }, { text: "কেউ না", emoji: "😇" }], correct: 1 },
    { emoji: "🎵", question: "আমাদের ফেভারিট গান কোনটা?", options: [{ text: "রোমান্টিক গান", emoji: "💕" }, { text: "স্যাড গান", emoji: "😢" }, { text: "রক মিউজিক", emoji: "🎸" }, { text: "সব গান", emoji: "🎶" }], correct: 0 },
    { emoji: "💍", question: "আমরা কি চিরকাল একসাথে থাকবো?", options: [{ text: "হ্যাঁ!", emoji: "✅" }, { text: "অবশ্যই!", emoji: "💖" }, { text: "ইনশাআল্লাহ!", emoji: "🙏" }, { text: "সবগুলোই!", emoji: "♾️" }], correct: 3 },
    { emoji: "⛅", question: "আমাদের প্রিয় ঋতু কোনটি?", options: [{ text: "শীতকাল", emoji: "❄️" }, { text: "বর্ষাকাল", emoji: "🌧️" }, { text: "বসন্তকাল", emoji: "🌸" }, { text: "শরৎকাল", emoji: "☁️" }], correct: 0 },
    { emoji: "🦉", question: "আমাদের মধ্যে কে নিশাচর (Night Owl)?", options: [{ text: "আওয়াল", emoji: "🙋‍♂️" }, { text: "মিম", emoji: "🙋‍♀️" }, { text: "দুজনেই", emoji: "🦉" }, { text: "কেউ না", emoji: "😴" }], correct: 1 },
    { emoji: "🏡", question: "আমাদের স্বপ্নের বাড়ি কোথায় হবে?", options: [{ text: "শহরে", emoji: "🏙️" }, { text: "পাহাড়ের ওপর", emoji: "🏔️" }, { text: "সমুদ্রের পাড়ে", emoji: "🏖️" }, { text: "গ্রামের শান্ত পরিবেশে", emoji: "🏡" }], correct: 2 },
    { emoji: "🌻", question: "মিমের প্রিয় ফুল কোনটি?", options: [{ text: "গোলাপ", emoji: "🌹" }, { text: "বেলি", emoji: "🌼" }, { text: "টিউলিপ", emoji: "🌷" }, { text: "সূর্যমুখী", emoji: "🌻" }], correct: 0 },
    { emoji: "🚀", question: "আমাদের ভবিষ্যতের সবচেয়ে বড় লক্ষ্য কী?", options: [{ text: "পুরো পৃথিবী ভ্রমণ", emoji: "🌍" }, { text: "সফল ক্যারিয়ার", emoji: "💼" }, { text: "সুখী পরিবার", emoji: "👨‍👩‍👧" }, { text: "সবগুলোই", emoji: "✨" }], correct: 3 }
  ],
  en: [
    { emoji: "📍", question: "Where did we first meet?", options: [{ text: "Park", emoji: "🌳" }, { text: "School", emoji: "🏫" }, { text: "Online", emoji: "🌐" }, { text: "Cafe", emoji: "☕" }], correct: 2 },
    { emoji: "💖", question: "Who loves more?", options: [{ text: "Awal", emoji: "🙋‍♂️" }, { text: "Mim", emoji: "🙋‍♀️" }, { text: "Both equally", emoji: "💑" }, { text: "No one", emoji: "🚫" }], correct: 2 },
    { emoji: "✈️", question: "What is our favorite hobby?", options: [{ text: "Traveling", emoji: "🌏" }, { text: "Sleeping more", emoji: "😴" }, { text: "Eating", emoji: "🍟" }, { text: "Watching movies", emoji: "🎬" }], correct: 0 },
    { emoji: "🎨", question: "What is Mim's favorite color?", options: [{ text: "Pink", emoji: "💖" }, { text: "Red", emoji: "❤️" }, { text: "Black", emoji: "🖤" }, { text: "White", emoji: "🤍" }], correct: 0 },
    { emoji: "🗺️", question: "Where is our dream destination?", options: [{ text: "Paris", emoji: "🗼" }, { text: "Switzerland", emoji: "🏔️" }, { text: "Maldives", emoji: "🏝️" }, { text: "Kashmir", emoji: "🏔️" }], correct: 1 },
    { emoji: "🍛", question: "What is Awal's favorite food?", options: [{ text: "Biryani", emoji: "🍛" }, { text: "Pizza", emoji: "🍕" }, { text: "Fuchka", emoji: "🍟" }, { text: "Everything", emoji: "😋" }], correct: 0 },
    { emoji: "🎁", question: "What was our first gift?", options: [{ text: "Flower", emoji: "🌹" }, { text: "Ring", emoji: "💍" }, { text: "Letter", emoji: "💌" }, { text: "Chocolate", emoji: "🍫" }], correct: 2 },
    { emoji: "😡", question: "Who gets angrier?", options: [{ text: "Awal", emoji: "😤" }, { text: "Mim", emoji: "😠" }, { text: "Both", emoji: "🔥" }, { text: "No one", emoji: "😇" }], correct: 1 },
    { emoji: "🎵", question: "What is our favorite music?", options: [{ text: "Romantic Songs", emoji: "💕" }, { text: "Sad Songs", emoji: "😢" }, { text: "Rock Music", emoji: "🎸" }, { text: "All Songs", emoji: "🎶" }], correct: 0 },
    { emoji: "💍", question: "Will we be together forever?", options: [{ text: "Yes!", emoji: "✅" }, { text: "Of course!", emoji: "💖" }, { text: "Inshallah!", emoji: "🙏" }, { text: "All of them!", emoji: "♾️" }], correct: 3 },
    { emoji: "⛅", question: "What is our favorite season?", options: [{ text: "Winter", emoji: "❄️" }, { text: "Rainy", emoji: "🌧️" }, { text: "Spring", emoji: "🌸" }, { text: "Autumn", emoji: "☁️" }], correct: 0 },
    { emoji: "🦉", question: "Who is the night owl between us?", options: [{ text: "Awal", emoji: "🙋‍♂️" }, { text: "Mim", emoji: "🙋‍♀️" }, { text: "Both", emoji: "🦉" }, { text: "Neither", emoji: "😴" }], correct: 1 },
    { emoji: "🏡", question: "Where would our dream house be?", options: [{ text: "In the city", emoji: "🏙️" }, { text: "On a mountain top", emoji: "🏔️" }, { text: "By the beach side", emoji: "🏖️" }, { text: "In a quiet village", emoji: "🏡" }], correct: 2 },
    { emoji: "🌻", question: "What is Mim's favorite flower?", options: [{ text: "Rose", emoji: "🌹" }, { text: "Jasmine", emoji: "🌼" }, { text: "Tulip", emoji: "🌷" }, { text: "Sunflower", emoji: "🌻" }], correct: 0 },
    { emoji: "🚀", question: "What's our biggest future goal?", options: [{ text: "Travel the world", emoji: "🌍" }, { text: "Successful career", emoji: "💼" }, { text: "Happy family", emoji: "👨‍👩‍👧" }, { text: "All of them", emoji: "✨" }], correct: 3 }
  ]
};

const resultTexts = {
  bn: {
    perfect: "তুমি আমাকে পুরোপুরি চিনো! তুমি আমার সত্যিকারের ভালোবাসা! তোমার মতো কেউ নেই! 💕✨",
    excellent: "দারুণ! তুমি আমাকে খুব ভালোভাবে চেনো! তুমি আমার স্পেশাল! 💖",
    good: "ভালো করেছো! তুমি আমাকে বেশ ভালোভাবেই চেনো! আরেকটু চেষ্টা করো! 💗",
    okay: "আরেকটু চেষ্টা করো! তবে তুমি তোমার মতোই সুন্দর! আমি তোমাকে ভালোবাসি! 💝",
    low: "কোনো ব্যাপার না! ভালোবাসা মানে সব জানা নয়, ভালোবাসা মানে বোঝা! আমি তোমাকে ভালোবাসি! 💕"
  },
  en: {
    perfect: "You know me completely! You are my true love! No one is like you! 💕✨",
    excellent: "Amazing! You know me very well! You are my special one! 💖",
    good: "Well done! You know me pretty well! Try a bit more! 💗",
    okay: "Try a bit more! But you are beautiful just the way you are! I love you! 💝",
    low: "No worries! Love is not about knowing everything, love is about understanding! I love you! 💕"
  }
};

export const Quiz: React.FC<{ lang: 'bn' | 'en' }> = ({ lang }) => {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions = quizData[lang];
  const currentQ = questions[step];

  const handleAnswer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === currentQ.correct) {
      setScore(prev => prev + 1);
      sounds.play('success');
    } else {
      sounds.play('error');
    }

    setTimeout(() => {
      if (step < questions.length - 1) {
        setStep(prev => prev + 1);
        setAnswered(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const reset = () => {
    sounds.play('click');
    setStep(0);
    setScore(0);
    setAnswered(null);
    setShowResult(false);
  };

  const getResultText = () => {
    const total = questions.length;
    const r = resultTexts[lang];
    if (score === total) return { text: r.perfect, emoji: '🏆🎉' };
    if (score >= total * 0.8) return { text: r.excellent, emoji: '🔥' };
    if (score >= total * 0.6) return { text: r.good, emoji: '🌟' };
    if (score >= total * 0.4) return { text: r.okay, emoji: '😊' };
    return { text: r.low, emoji: '😅' };
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-24 px-6 relative">
      <div className="text-center mb-16 space-y-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-card luxury-text text-[#c5a059] mb-4 shadow-xl"
        >
          <Sparkles size={14} className="fill-[#c5a059]" />
          {lang === 'bn' ? 'আমাদের সম্পর্কের পরীক্ষা' : 'Bond Assessment'}
        </motion.div>
        
        <h2 className="font-display font-black text-7xl md:text-[100px] text-gradient italic leading-[0.8] tracking-tighter">
          {lang === 'bn' ? 'তুমি আমাকে চেনো?' : 'Knowledge Test'}
        </h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="luxury-text pt-6 max-w-xl mx-auto leading-relaxed opacity-60"
        >
          {lang === 'bn' ? 'দেখি আমাদের ভালোবাসা কতটা গভীর' : 'Let\'s uncover the depths of our shared memories'}
        </motion.p>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-12 md:p-20 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden group"
            >
              <div className="text-8xl mb-12 flex justify-center">{currentQ.emoji}</div>
              
              <div className="flex justify-center gap-3 mb-16">
                {questions.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-700 ${
                      i === step ? 'w-16 bg-[#c5a059] shadow-[0_0_20px_#c5a059]' : 
                      i < step ? 'w-4 bg-white/40' : 'w-4 bg-white/5'
                    }`} 
                  />
                ))}
              </div>

              <h3 className="font-display italic text-3xl md:text-5xl text-white mb-16 tracking-tight leading-tight">
                {currentQ.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`w-full flex items-center justify-center gap-4 px-8 py-7 rounded-[32px] text-[13px] font-black uppercase tracking-widest transition-all duration-500 border group ${
                      answered === null 
                        ? 'bg-white/[0.02] border-white/10 hover:bg-white text-black' 
                        : i === currentQ.correct 
                          ? 'bg-[#c5a059] border-[#c5a059] text-black scale-105 shadow-[0_0_40px_rgba(197,160,89,0.3)]' 
                          : answered === i 
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-500' 
                            : 'bg-white/[0.01] border-white/5 opacity-30 text-white'
                    }`}
                  >
                    <span className="text-2xl group-hover:scale-125 transition-transform">{opt.emoji}</span>
                    <span className="flex-1">{opt.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-20 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] text-center relative overflow-hidden"
            >
              <div className="text-[120px] mb-12 drop-shadow-2xl">{getResultText().emoji}</div>
              <h3 className="font-display italic text-5xl text-white mb-4">
                {lang === 'bn' ? 'কুইজ সম্পন্ন!' : 'Quest Complete!'}
              </h3>
              <div className="text-[100px] font-black tracking-tighter text-gradient mb-8 leading-none">
                {score}<span className="text-white/20 text-4xl">/{questions.length}</span>
              </div>
              
              <div className="w-24 h-px bg-[#c5a059]/30 mx-auto mb-12" />
              
              <p className="font-display italic text-2xl text-white/60 leading-relaxed mb-16 max-w-xl mx-auto">
                {getResultText().text}
              </p>
              
              <button
                onClick={reset}
                className="bg-white text-black px-16 py-7 rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-[#c5a059] transition-all flex items-center justify-center gap-4 mx-auto transform hover:scale-105 active:scale-95 premium-btn"
              >
                <RefreshCcw size={20} className="animate-spin-slow" /> {lang === 'bn' ? 'আবার খেলুন' : 'Relive the Moment'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
