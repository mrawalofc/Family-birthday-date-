import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto py-10 px-5">
      <div className="text-center mb-10">
        <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-md">
          {lang === 'bn' ? 'তুমি আমাকে কতটা চেনো?' : 'How Well Do You Know Me?'}
        </h2>
        <p className="text-white/70 italic text-lg">A fun quiz about us ❓💕</p>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/10 backdrop-blur-xl rounded-[30px] p-10 border border-white/15 shadow-2xl text-center"
            >
              <div className="text-7xl mb-6 animate-bounce">{currentQ.emoji}</div>
              
              <div className="flex justify-center gap-2 mb-8">
                {questions.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === step ? 'w-8 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 
                      i < step ? 'w-2.5 bg-green-500' : 'w-2.5 bg-white/20'
                    }`} 
                  />
                ))}
              </div>

              <h3 className="text-xl md:text-2xl text-white mb-10 font-medium leading-relaxed">
                {currentQ.question}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-sans transition-all duration-300 border-2 text-left group ${
                      answered === null 
                        ? 'bg-white/5 border-white/10 hover:bg-pink-500/20 hover:border-pink-500/40 hover:translate-x-3' 
                        : i === currentQ.correct 
                          ? 'bg-green-500/30 border-green-500/60 scale-105' 
                          : answered === i 
                            ? 'bg-red-500/30 border-red-500/60' 
                            : 'bg-white/5 border-white/10 opacity-50'
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
              className="bg-white/10 backdrop-blur-xl rounded-[30px] p-12 border border-white/15 shadow-2xl text-center"
            >
              <div className="text-8xl mb-6">{getResultText().emoji}</div>
              <h3 className="font-serif text-4xl text-white mb-2">
                {lang === 'bn' ? 'কুইজ সম্পন্ন!' : 'Quiz Complete!'}
              </h3>
              <div className="text-6xl font-bold text-pink-500 mb-6 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                {score}/{questions.length}
              </div>
              <div className="flex justify-center gap-1 text-2xl mb-8 animate-pulse text-pink-300">
                <span>💖</span><span>💗</span><span>💖</span><span>💗</span><span>💖</span>
              </div>
              <p className="text-xl text-white/90 leading-relaxed mb-10 italic font-medium">
                {getResultText().text}
              </p>
              <button
                onClick={reset}
                className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-12 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <RefreshCcw size={20} /> {lang === 'bn' ? 'আবার খেলুন' : 'Play Again'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
