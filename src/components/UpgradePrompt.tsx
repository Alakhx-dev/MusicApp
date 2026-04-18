import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type UpgradePromptProps = {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
};

export default function UpgradePrompt({ isOpen, onClose, feature }: UpgradePromptProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignIn = async () => {
    await signOut(); // Clear guest state
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel p-6 w-full max-w-sm text-center"
          >
            <div className="flex justify-end mb-2">
              <button onClick={onClose} className="text-white/30 hover:text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>

            <h3 className="text-lg font-semibold mb-2">Sign in Required</h3>
            <p className="text-sm text-white/50 mb-6">
              <span className="text-white/70 font-medium">{feature}</span> is not available in Guest Mode.
              Create a free account to unlock all features.
            </p>

            <button
              onClick={handleSignIn}
              className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-3 rounded-xl transition-all shadow-neon flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In / Sign Up
            </button>

            <button
              onClick={onClose}
              className="mt-3 w-full text-white/40 hover:text-white/60 text-sm py-2 transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
