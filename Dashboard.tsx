import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ParentDashboard } from './ParentDashboard';
import { StaffDashboard } from './StaffDashboard';
import { StudentDashboard } from './StudentDashboard';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';
import { Calendar, Sparkles, Layout, MessageSquare, Star, LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

interface DashboardProps {
  user: User;
  role: 'admin' | 'visitor' | 'caregiver';
  activeTab: 'overview' | 'users' | 'events' | 'visits' | 'students' | 'accounts' | 'chat';
  onStartFeedback?: () => void;
  onLogout?: () => void;
  onViewCertificate?: (cert: any) => void;
  libraryId?: string;
  studentName?: string;
  liveMessages?: any[];
  setLiveMessages?: any;
}

interface LibraryEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  posterUrl: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  role, 
  activeTab, 
  onStartFeedback,
  onLogout,
  onViewCertificate,
  libraryId,
  studentName,
  liveMessages,
  setLiveMessages
}) => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<LibraryEvent[]>([]);

  useEffect(() => {
    if (role === 'admin') return;
    
    const q = query(collection(db, 'library_events'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryEvent)));
    });
    return () => unsub();
  }, [role]);

  if (role === 'admin') {
    return <StaffDashboard activeTab={activeTab} userRole="admin" liveMessages={liveMessages} setLiveMessages={setLiveMessages} onLogout={onLogout || (() => {})} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 md:space-y-10">
      {/* Top Navigation Menu */}
      {libraryId && role === 'visitor' && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] shadow-2xl border-4 border-white flex items-center justify-center gap-2 md:gap-4"
        >
          <button 
            onClick={() => document.getElementById('adventure-board')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-indigo-50 text-indigo-600 rounded-full font-black text-xs md:text-sm hover:bg-indigo-100 transition-all"
          >
            <Layout size={18} />
            <span className="hidden sm:inline">{t.Label_MyAdventureBoard}</span>
            <span className="sm:hidden">Board</span>
          </button>
          <button 
            onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-orange-50 text-orange-600 rounded-full font-black text-xs md:text-sm hover:bg-orange-100 transition-all"
          >
            <Calendar size={18} />
            <span className="hidden sm:inline">{t.Label_UpcomingEvents}</span>
            <span className="sm:hidden">Events</span>
          </button>
          <button 
            onClick={() => document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-pink-50 text-pink-600 rounded-full font-black text-xs md:text-sm hover:bg-pink-100 transition-all"
          >
            <Star size={18} />
            <span className="hidden sm:inline">{t.Btn_GiveFeedback}</span>
            <span className="sm:hidden">Feedback</span>
          </button>
          
          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-slate-100 text-slate-600 rounded-full font-black text-xs md:text-sm hover:bg-slate-200 transition-all ml-auto"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">{t.Btn_Exit}</span>
            <span className="sm:hidden">{t.Btn_Exit}</span>
          </button>
        </motion.div>
      )}

      {/* Greeting section removed as requested */}
      
      {role === 'caregiver' && <ParentDashboard parentEmail={user.email || ''} onLogout={onLogout || (() => {})} />}
      {role === 'visitor' && (
        <StudentDashboard 
          libraryId={libraryId || ''} 
          studentName={studentName || user.displayName || 'Guest'} 
          onStartFeedback={onStartFeedback || (() => {})} 
          onLogout={onLogout || (() => {})}
          onViewCertificate={onViewCertificate}
        />
      )}

      {events.length > 0 && role !== 'visitor' && (
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Calendar className="text-indigo-500" />
            {t.Label_SessionHistoryTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {events.map((event) => (
              <div key={`dashboard-event-${event.id}`} className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl overflow-hidden border-b-8 border-white/50 group hover:border-indigo-200 transition-all">
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  <img 
                    src={event.posterUrl} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-700 font-black text-[10px] md:text-xs uppercase tracking-widest">
                    <Calendar size={14} />
                    {event.date}
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{event.title}</h3>
                  <p className="text-slate-700 font-medium line-clamp-3 text-sm md:text-base">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
