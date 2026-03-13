import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Heart, 
  Camera, 
  BookOpen, 
  Trophy, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Star,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
  UserCircle,
  X,
  LogOut
} from 'lucide-react';
import { db, collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc } from '../firebase';

import { useLanguage } from '../contexts/LanguageContext';

interface Child {
  id: string;
  name: string;
  grade: string;
  photoUrl?: string;
  libraryId: string;
}

interface ActivityRecord {
  id: string;
  childId: string;
  type: 'reading' | 'event' | 'creative' | 'other';
  title: string;
  description: string;
  photoUrl?: string;
  timestamp: any;
  guidelineDetected?: string;
}

interface ParentDashboardProps {
  parentEmail: string;
  onLogout: () => void;
}

export function ParentDashboard({ parentEmail, onLogout }: ParentDashboardProps) {
  const { t } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentEmail) return;

    // Listen to children linked to this parent
    const qChildren = query(collection(db, 'students'), where('parentEmail', '==', parentEmail));
    const unsubChildren = onSnapshot(qChildren, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Child[];
      setChildren(data);
      setLoading(false);
    });

    return () => unsubChildren();
  }, [parentEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Header & Child Selection */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-100 rounded-full opacity-50 pointer-events-none animate-blob"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            {t.Title_CaregiverDashboard}
            <Sparkles className="text-yellow-400 animate-wiggle" size={32} />
          </h1>
          <p className="text-lg text-slate-500 font-bold">{t.Subtitle_CaregiverDashboard}</p>
        </div>
      </div>

      {/* Children List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 relative z-10">
        {children.map((child) => (
          <motion.button
            key={`child-card-${child.id}`}
            whileHover={{ y: -5, scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="aspect-square p-6 rounded-[3rem] border-4 bg-white border-indigo-100 text-slate-900 hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-200 transition-all flex flex-col items-center justify-center gap-4 shadow-lg group btn-bouncy"
          >
            <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center font-black text-4xl bg-indigo-50 text-indigo-500 group-hover:bg-gradient-to-br group-hover:from-indigo-400 group-hover:to-purple-500 group-hover:text-white transition-all shadow-inner group-hover:shadow-lg animate-float">
              {child.photoUrl ? (
                <img src={child.photoUrl} className="w-full h-full object-cover rounded-[2rem]" />
              ) : (
                child.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-center w-full">
              <h3 className="text-2xl font-black truncate w-full px-2">{child.name}</h3>
              <p className="text-sm font-bold text-slate-400 mt-1">
                {t.Label_Grade} {child.grade}
              </p>
            </div>
          </motion.button>
        ))}
        {children.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
            <Users className="mx-auto text-slate-300 mb-6" size={64} />
            <h3 className="text-2xl font-black text-slate-700 mb-2">{t.Title_NoStudents}</h3>
            <p className="text-slate-500 font-medium text-lg">{t.Text_NoStudents}</p>
          </div>
        )}
      </div>
    </div>
  );
}
