import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { NatureBackground } from './NatureBackground';

interface ColorfulWelcomeProps {
  onComplete: () => void;
  time?: 'morning' | 'day' | 'evening' | 'night';
}

export function ColorfulWelcome({ onComplete, time = 'day' }: ColorfulWelcomeProps) {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <NatureBackground time={time} />
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 z-50 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-full border-2 border-white/50 shadow-lg transition-all"
      >
        Skip
      </button>
    </motion.div>
  );
}
