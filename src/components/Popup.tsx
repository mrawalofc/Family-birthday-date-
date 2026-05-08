import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Popup: React.FC<PopupProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[1000] p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-gradient-to-br from-[#ff6b9d] via-[#c44569] to-[#f8b500] rounded-[30px] p-10 md:p-12 max-w-md w-full text-center shadow-[0_30_60px_rgba(0,0,0,0.4),0_0_50px_rgba(255,107,157,0.4)] border-2 border-white/30 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-4 animate-bounce">🎂🎉</div>
            <h2 className="font-serif text-4xl md:text-5xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] leading-tight mb-6">
              Happy Birthday!<br />Family Forever
            </h2>
            <div className="text-3xl mb-5 flex justify-center gap-1 animate-pulse">
              <span>🎈</span><span>✨</span><span>🎁</span><span>✨</span><span>🎈</span>
            </div>
            <button
              onClick={onClose}
              className="bg-white/25 border-2 border-white/50 text-white px-9 py-3 rounded-full font-sans text-lg cursor-pointer transition-all hover:bg-white/40 active:scale-95 backdrop-blur-sm"
            >
              Celebrate ❤️
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
