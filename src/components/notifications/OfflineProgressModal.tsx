import { motion } from 'framer-motion';
import { formatNumber } from '../../types/resource';
import { Clock, Coins } from 'lucide-react';

interface OfflineProgressModalProps {
  amount: number;
  onClose: () => void;
}

export function OfflineProgressModal({ amount, onClose }: OfflineProgressModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-bg-card rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl border border-accent/30"
      >
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-accent" />
        </div>
        
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Welcome Back!
        </h3>
        
        <p className="text-text-secondary text-sm mb-4">
          Your factories kept working while you were away
        </p>
        
        <div className="bg-bg-secondary rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center gap-2 text-accent">
            <Coins className="w-5 h-5" />
            <span className="text-2xl font-bold">+{formatNumber(amount)}</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">ore earned offline</div>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full bg-accent text-white py-3 rounded-xl font-semibold shadow-lg shadow-accent/30"
        >
          Collect & Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
