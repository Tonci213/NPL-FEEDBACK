import React from 'react';
import { motion } from 'motion/react';
import { School, Users, TreeDeciduous, Sun, Cloud } from 'lucide-react';

interface SchoolBackgroundProps {
  time?: 'morning' | 'day' | 'evening' | 'night';
}

export const SchoolBackground: React.FC<SchoolBackgroundProps> = ({ time = 'day' }) => {
  const settings = {
    morning: { bg: 'bg-amber-50', sky: 'bg-amber-200', school: 'bg-amber-700', grass: 'bg-emerald-600' },
    day: { bg: 'bg-sky-50', sky: 'bg-sky-300', school: 'bg-blue-600', grass: 'bg-emerald-500' },
    evening: { bg: 'bg-orange-50', sky: 'bg-orange-300', school: 'bg-orange-800', grass: 'bg-emerald-700' },
    night: { bg: 'bg-slate-900', sky: 'bg-slate-950', school: 'bg-slate-800', grass: 'bg-emerald-900' },
  };

  const current = settings[time];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${current.bg}`}>
      {/* Sky */}
      <div className={`absolute inset-0 ${current.sky} opacity-50`} />
      
      {/* Sun/Moon */}
      <motion.div 
        className="absolute top-10 right-10 w-24 h-24 rounded-full bg-yellow-300 shadow-lg"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Grass */}
      <div className={`absolute bottom-0 w-full h-32 ${current.grass}`} />

      {/* School Building */}
      <div className={`absolute bottom-20 left-10 w-64 h-48 ${current.school} rounded-t-lg shadow-2xl flex flex-col items-center justify-center`}>
        <School size={64} className="text-white" />
        <div className="text-white font-bold mt-2">Sekolah</div>
      </div>

      {/* Trees */}
      <div className="absolute bottom-24 right-20 flex gap-4">
        <TreeDeciduous size={80} className="text-emerald-700" />
        <TreeDeciduous size={100} className="text-emerald-800" />
      </div>

      {/* Students */}
      <div className="absolute bottom-24 left-80 flex gap-4">
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={`student-${i}`}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          >
            <Users size={48} className="text-indigo-600" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
