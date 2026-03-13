import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Sun, Cloud, TreePine, Moon } from 'lucide-react';

interface NatureBackgroundProps {
  time?: 'morning' | 'day' | 'evening' | 'night';
}

export const NatureBackground: React.FC<NatureBackgroundProps> = ({ time = 'day' }) => {
  const colors = {
    morning: { sky: 'from-orange-300 to-sky-300', sun: 'text-orange-400', mountain: '#f97316', tree: '#7c2d12' },
    day: { sky: 'from-sky-400 to-sky-200', sun: 'text-yellow-400', mountain: '#059669', tree: '#065f46' },
    evening: { sky: 'from-purple-500 to-orange-400', sun: 'text-orange-600', mountain: '#4c1d95', tree: '#1e1b4b' },
    night: { sky: 'from-slate-900 to-indigo-950', sun: 'text-slate-300', mountain: '#1e293b', tree: '#0f172a' },
  };

  const current = colors[time];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-b ${current.sky}`}>
      {/* Sun/Moon */}
      <motion.div
        animate={{ rotate: time === 'night' ? 0 : 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className={`absolute top-12 right-12 md:right-24 ${current.sun} drop-shadow-[0_0_40px_rgba(250,204,21,0.8)]`}
      >
        {time === 'night' ? <Moon size={120} fill="currentColor" /> : <Sun size={120} fill="currentColor" className="md:w-[160px] md:h-[160px]" />}
      </motion.div>

      {/* Stars */}
      {time === 'night' && [...Array(30)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          className="absolute text-white"
          style={{
            top: `${Math.random() * 50}%`,
            left: `${Math.random() * 100}%`,
          }}
        >
          <Sparkles size={10 + Math.random() * 10} fill="currentColor" />
        </motion.div>
      ))}

      {/* Clouds */}
      {time !== 'night' && (
        <>
          <motion.div
            animate={{ x: [-200, 2000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 opacity-90"
          >
            <Cloud size={100} fill="white" className="text-white drop-shadow-md" />
          </motion.div>
          <motion.div
            animate={{ x: [-200, 2000] }}
            transition={{ duration: 55, repeat: Infinity, ease: "linear", delay: 15 }}
            className="absolute top-40 opacity-80"
          >
            <Cloud size={80} fill="white" className="text-white drop-shadow-md" />
          </motion.div>
        </>
      )}

      {/* Mountains */}
      <div className="absolute bottom-0 w-full h-[40vh]">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
          <path fill={current.mountain} fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,192C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Trees */}
      <div className="absolute bottom-10 left-[5%] md:left-[10%] text-emerald-900 drop-shadow-xl" style={{ color: current.tree }}>
        <TreePine size={120} fill="currentColor" className="md:w-[160px] md:h-[160px]" />
      </div>
      <div className="absolute bottom-5 left-[20%] md:left-[22%] text-emerald-800 drop-shadow-xl" style={{ color: current.tree }}>
        <TreePine size={80} fill="currentColor" className="md:w-[100px] md:h-[100px]" />
      </div>
      <div className="absolute bottom-16 right-[5%] md:right-[15%] text-emerald-900 drop-shadow-xl" style={{ color: current.tree }}>
        <TreePine size={140} fill="currentColor" className="md:w-[180px] md:h-[180px]" />
      </div>
    </div>
  );
};
