import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-neutral-900 border border-white/10 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-8 md:p-10 flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 ${
                type === 'danger' ? 'bg-rose-500/10 text-rose-500' :
                type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                <AlertTriangle size={40} />
              </div>
              
              <h3 className="font-display text-3xl font-bold text-white mb-4">
                {title}
              </h3>
              <p className="text-white/40 leading-relaxed mb-10">
                {message}
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                    type === 'danger' ? 'bg-rose-500 text-white hover:bg-rose-600' :
                    type === 'warning' ? 'bg-amber-500 text-black hover:bg-amber-600' :
                    'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-white/5 text-white/40 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  {cancelText}
                </button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/20 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
