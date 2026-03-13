import React from 'react';
import { Baby, Star, PenTool } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export type GradeLevel = 'K-1' | '2-3' | '4-6';

interface GradeLevelSelectorProps {
  selectedGrade: GradeLevel | '';
  onSelect: (grade: GradeLevel) => void;
}

export function GradeLevelSelector({ selectedGrade, onSelect }: GradeLevelSelectorProps) {
  const { t } = useLanguage();
  
  const levels: { id: GradeLevel; label: string; description: string; icon: any; color: string; activeColor: string }[] = [
    { 
      id: 'K-1', 
      label: t.Grade_Low, 
      description: 'Smile icons! 😊', 
      icon: Baby,
      color: 'bg-pink-50 text-pink-600 border-pink-100 hover:border-pink-300',
      activeColor: 'bg-pink-500 text-white border-pink-500 shadow-pink-200'
    },
    { 
      id: '2-3', 
      label: t.Grade_Mid, 
      description: 'Star ratings! ⭐', 
      icon: Star,
      color: 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300',
      activeColor: 'bg-amber-500 text-white border-amber-500 shadow-amber-200'
    },
    { 
      id: '4-6', 
      label: t.Grade_High, 
      description: 'Write a reflection! ✍️', 
      icon: PenTool,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300',
      activeColor: 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200'
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">Pick Your Grade</h3>
      <div className="grid grid-cols-1 gap-4">
        {levels.map((level) => {
          const Icon = level.icon;
          const isSelected = selectedGrade === level.id;
          
          return (
            <motion.button
              key={`grade-level-${level.id}`}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(level.id)}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] border-4 transition-all text-center ${
                isSelected 
                  ? `${level.activeColor} shadow-xl` 
                  : `${level.color} bg-white`
              }`}
            >
              <div className={`p-4 rounded-2xl ${isSelected ? 'bg-white/20' : 'bg-slate-50'}`}>
                <Icon size={32} strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-display font-bold text-2xl">{level.label}</div>
                <div className={`text-sm font-medium ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                  {level.description}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
