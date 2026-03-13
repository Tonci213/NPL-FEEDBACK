import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Library } from 'lucide-react';

interface LibrarianBackgroundProps {
  time?: 'morning' | 'day' | 'evening' | 'night';
}

export const LibrarianBackground: React.FC<LibrarianBackgroundProps> = ({ time = 'day' }) => {
  const colors = {
    morning: { bg: 'bg-amber-50', shelf: 'bg-amber-900', wood: 'bg-amber-800' },
    day: { bg: 'bg-stone-100', shelf: 'bg-stone-800', wood: 'bg-stone-700' },
    evening: { bg: 'bg-indigo-50', shelf: 'bg-indigo-950', wood: 'bg-indigo-900' },
    night: { bg: 'bg-slate-900', shelf: 'bg-slate-950', wood: 'bg-slate-800' },
  };

  const current = colors[time];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${current.bg}`}>
      {/* Library Shelves */}
      <div className="absolute inset-0 flex justify-between px-4 md:px-12">
        {[...Array(4)].map((_, i) => (
          <div key={`shelf-${i}`} className={`w-24 md:w-32 ${current.shelf} h-full shadow-2xl relative`}>
            {/* Shelf levels */}
            {[...Array(5)].map((_, j) => (
              <div key={`level-${j}`} className={`absolute w-full h-2 ${current.wood}`} style={{ top: `${15 + j * 18}%` }} />
            ))}
            {/* Books */}
            {[...Array(15)].map((_, j) => (
              <div 
                key={`book-${i}-${j}`}
                className="absolute w-4 h-12 bg-indigo-500 rounded-sm"
                style={{ 
                  left: `${5 + (j % 3) * 25}%`, 
                  top: `${18 + Math.floor(j / 3) * 18}%` 
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Library Table */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-32 ${current.wood} rounded-t-3xl shadow-2xl flex justify-center items-center`}>
        <BookOpen size={64} className="text-white opacity-50" />
      </div>
    </div>
  );
};
