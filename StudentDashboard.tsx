import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Square, Clock, Award, Star, BookOpen, Plus, Trash2, CheckCircle2, Trophy, ArrowRight, Sparkles, Calendar, LogOut, Map, Info, ChevronRight } from 'lucide-react';
import { db, collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, limit, Timestamp, deleteDoc } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { CertificateRecord } from '../types';
import { AnimatePresence } from 'motion/react';

interface StudentDashboardProps {
  libraryId: string;
  studentName: string;
  onStartFeedback: () => void;
  onLogout: () => void;
  onViewCertificate?: (cert: CertificateRecord) => void;
}

interface Visit {
  id: string;
  startTime: any;
  endTime?: any;
  activities?: string[];
  completed: boolean;
}

export function StudentDashboard({ libraryId, studentName, onStartFeedback, onLogout, onViewCertificate }: StudentDashboardProps) {
  const { t } = useLanguage();
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [visitHistory, setVisitHistory] = useState<Visit[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [guideStep, setGuideStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'adventure' | 'events' | 'feedback'>('adventure');

  const guideMessages = [
    t.Chat_Welcome,
    t.Label_NoActiveVisit,
    t.Label_FeedbackPrompt
  ];

  useEffect(() => {
    const fetchCurrentVisit = async () => {
      // Find incomplete visit for this student
      const q = query(
        collection(db, 'library_visits'),
        where('libraryId', '==', libraryId),
        where('completed', '==', false),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        setCurrentVisit({ id: docData.id, ...docData.data() } as Visit);
        setActivities(docData.data().activities || []);
      } else {
        setShowStartModal(true);
      }
    };

    const fetchVisitHistory = async () => {
      const q = query(
        collection(db, 'library_visits'),
        where('libraryId', '==', libraryId),
        where('completed', '==', true),
        orderBy('startTime', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));
      setVisitHistory(history);
    };

    const fetchEvents = async () => {
      const q = query(collection(db, 'library_events'), orderBy('createdAt', 'desc'), limit(3));
      const snapshot = await getDocs(q);
      setUpcomingEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchCertificates = async () => {
      const q = query(
        collection(db, 'certificates'),
        where('libraryId', '==', libraryId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      setCertificates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CertificateRecord)));
    };

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchCurrentVisit(), fetchVisitHistory(), fetchEvents(), fetchCertificates()]);
      setLoading(false);
    };

    loadAll();
  }, [libraryId]);

  const totalActivities = visitHistory.reduce((acc, visit) => acc + (visit.activities?.length || 0), 0);
  const totalVisits = visitHistory.length + (currentVisit ? 1 : 0);

  const handleStartVisit = async () => {
    if (!manualStartTime) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'library_visits'), {
        libraryId,
        studentName,
        startTime: manualStartTime,
        timestamp: serverTimestamp(),
        completed: false,
        activities: []
      });
      setCurrentVisit({
        id: docRef.id,
        startTime: manualStartTime,
        completed: false
      });
      setShowStartModal(false);
      setManualStartTime('');
    } catch (error) {
      console.error("Error starting visit:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      setActivities([...activities, newActivity.trim()]);
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleEndVisit = async () => {
    if (!currentVisit || !manualEndTime) return;
    
    setLoading(true);
    try {
      const visitRef = doc(db, 'library_visits', currentVisit.id);
      await updateDoc(visitRef, {
        endTime: manualEndTime,
        endTimestamp: serverTimestamp(),
        activities: activities,
        completed: true
      });
      setCurrentVisit(null);
      setActivities([]);
      setShowEndModal(false);
      setManualEndTime('');
      
      // Refresh history
      const q = query(
        collection(db, 'library_visits'),
        where('libraryId', '==', libraryId),
        where('completed', '==', true),
        orderBy('startTime', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Visit));
      setVisitHistory(history);
    } catch (error) {
      console.error("Error ending visit:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (window.confirm('Delete this certificate?')) {
      try {
        await deleteDoc(doc(db, 'certificates', id));
        setCertificates(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error("Error deleting certificate:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-2 md:px-4">
      {/* Interactive Guide Bubble */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-4 md:p-6 shadow-xl border-4 border-indigo-100 flex items-start gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 animate-wiggle">
          <Sparkles size={100} className="text-indigo-400" />
        </div>
        <div className="bg-indigo-500 w-12 h-12 md:w-16 md:h-16 rounded-[2rem] flex items-center justify-center text-white shrink-0 shadow-lg animate-float">
          <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
        </div>
        <div className="space-y-2 flex-1 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">{t.Label_LibraryGuide}</span>
            <div className="flex gap-1">
              {guideMessages.map((_, i) => (
                <div key={`student-guide-dot-${i}-${guideMessages.length}`} className={`w-2 h-2 rounded-full ${i === guideStep ? 'bg-indigo-500' : 'bg-indigo-100'}`} />
              ))}
            </div>
          </div>
          <p className="text-sm md:text-base text-slate-700 font-bold leading-relaxed">
            {guideMessages[guideStep]}
          </p>
          <button 
            onClick={() => setGuideStep((prev) => (prev + 1) % guideMessages.length)}
            className="text-xs font-black text-indigo-500 hover:text-indigo-600 flex items-center gap-1 group bg-indigo-50 px-3 py-1.5 rounded-full w-fit mt-2 transition-colors"
          >
            {t.Btn_NextTip} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center items-center gap-2 bg-white p-2 rounded-3xl shadow-sm border-2 border-indigo-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('adventure')}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'adventure' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Trophy size={18} />
            {t.Label_MyAdventureBoard}
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'events' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Calendar size={18} />
            {t.Label_UpcomingEvents}
          </button>
        </div>
        
        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'feedback' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Star size={18} />
            {t.Btn_GiveFeedback}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all border-2 border-transparent hover:border-red-100"
          >
            <LogOut size={18} />
            {t.Btn_Exit}
          </button>
        </div>
      </div>

      {activeTab === 'adventure' && (
        <div className="space-y-6">
          {/* Feedback Section at the Top */}
          <div id="feedback-section-top" className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
              <Award className="w-20 h-20" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black">{t.Label_FeedbackPrompt}</h3>
                <p className="text-indigo-100 font-medium opacity-90">
                  {t.Subtitle_Guest}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartFeedback}
                className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl flex items-center gap-3 hover:bg-indigo-50 transition-all whitespace-nowrap"
              >
                {t.Btn_GiveFeedback}
                <ArrowRight size={20} />
              </motion.button>
            </div>
          </div>

          <div id="adventure-board" className="bg-white rounded-[3rem] shadow-2xl p-6 md:p-8 border-4 border-indigo-100 relative overflow-hidden group">
            {/* Background Image for Adventure Board */}
            <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none">
              <img 
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200" 
                alt="Adventure Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-transparent"></div>
            </div>

            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-50 rounded-full opacity-50 pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 md:mb-8 gap-4 relative z-10">
              <div className="text-center sm:text-left">
                <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight text-shadow-sm">
                  {t.Label_MyAdventureBoard}
                </h2>
                <p className="text-slate-500 font-bold text-lg">{t.Intro_Subtitle}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-5 rounded-[2rem] text-white shadow-xl animate-wiggle">
                <Trophy size={40} fill="currentColor" />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 relative z-10">
              <div className="bg-indigo-50 p-4 rounded-3xl border-2 border-indigo-100 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-indigo-600">{totalVisits}</span>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.Label_TotalVisits}</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-3xl border-2 border-emerald-100 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-emerald-600">{totalActivities}</span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.Label_CompletedActivities}</span>
              </div>
              <div className="bg-orange-50 p-4 rounded-3xl border-2 border-orange-100 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                <span className="text-3xl font-black text-orange-600">{certificates.length}</span>
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Certificates</span>
              </div>
            </div>

            {/* Certificates Section - Moved Up */}
            <div className="mb-12 space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Award className="text-indigo-600" size={24} />
                  My Certificates
                </h3>
                {certificates.length > 0 && (
                  <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                    {certificates.length} Collected
                  </span>
                )}
              </div>
              
              {certificates.length === 0 ? (
                <div className="text-center py-8 bg-indigo-50/30 rounded-[2rem] border-2 border-dashed border-indigo-100">
                  <p className="text-indigo-400 font-bold text-sm">No certificates yet! Complete an activity to earn one. ✨</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.slice(0, 4).map((cert) => (
                    <motion.div
                      key={`cert-card-top-${cert.id}`}
                      whileHover={{ y: -2 }}
                      className="bg-white p-3 rounded-2xl border-2 border-slate-50 shadow-sm flex gap-3 items-center group"
                    >
                      <div className={`w-12 h-14 rounded-xl flex-shrink-0 flex items-center justify-center ${
                        cert.theme === 'space' ? 'bg-slate-900' : 
                        cert.theme === 'nature' ? 'bg-green-50' : 
                        cert.theme === 'magic' ? 'bg-purple-50' : 'bg-indigo-50'
                      }`}>
                        <Award size={20} className={
                          cert.theme === 'space' ? 'text-blue-400' : 
                          cert.theme === 'nature' ? 'text-green-500' : 
                          cert.theme === 'magic' ? 'text-purple-500' : 'text-indigo-500'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{cert.activityName}</h4>
                        <div className="flex gap-2 mt-1">
                          <button 
                            onClick={() => onViewCertificate?.(cert)}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {certificates.length > 4 && (
                    <button 
                      onClick={() => setActiveTab('adventure')} // Stay here but maybe scroll?
                      className="col-span-full text-center py-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      + {certificates.length - 4} more certificates
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 relative z-10">
              {/* Visiting Progress */}
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Play size={28} className="text-emerald-500" fill="currentColor" />
                  {t.Label_VisitingProgress}
                </h3>
                
                {!currentVisit ? (
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowStartModal(true)}
                    className="w-full py-6 md:py-8 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-[2.5rem] shadow-xl shadow-emerald-200 flex flex-col items-center gap-4 group btn-bouncy border-4 border-emerald-300"
                  >
                    <div className="bg-white/20 p-4 rounded-[2rem] group-hover:scale-110 transition-transform shadow-inner">
                      <Play className="w-10 h-10 md:w-12 md:h-12" fill="currentColor" />
                    </div>
                    <div className="text-center">
                      <span className="text-2xl md:text-3xl font-black block text-shadow-sm">{t.Label_StartVisit}</span>
                      <span className="text-emerald-50 font-bold text-sm md:text-base">{t.Label_NoActiveVisit}</span>
                    </div>
                  </motion.button>
                ) : (
                  <div className="bg-indigo-50 rounded-[2rem] p-5 md:p-6 border-4 border-indigo-100">
                    <div className="flex items-center gap-4 text-indigo-900 mb-6">
                      <div className="bg-white p-3 rounded-2xl shadow-sm">
                        <Clock size={24} className="animate-pulse text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-lg md:text-xl font-black">{t.Label_ActiveVisit}</h4>
                        <p className="text-indigo-600 text-xs md:text-sm font-medium">
                          {t.Label_TimeIn}: {typeof currentVisit.startTime === 'string' ? currentVisit.startTime : (currentVisit.startTime instanceof Timestamp ? currentVisit.startTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : t.Text_JustNow)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
                        <BookOpen size={18} className="text-indigo-500" />
                        {t.Label_CurrentActivity}
                      </h4>
                      
                      <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                        {activities.map((activity, index) => (
                          <motion.div 
                            key={`activity-${index}-${activity}-${activities.length}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100"
                          >
                            <span className="font-medium text-slate-700 text-sm">{activity}</span>
                            <button 
                              onClick={() => handleRemoveActivity(index)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        ))}
                        {activities.length === 0 && (
                          <p className="text-slate-400 italic text-xs text-center py-2">{t.Text_NoActivities}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {[
                          { id: 'reading', label: 'Reading', color: 'bg-indigo-500 hover:bg-indigo-400 border-indigo-600' },
                          { id: 'computer', label: 'Computer', color: 'bg-blue-500 hover:bg-blue-400 border-blue-600' },
                          { id: 'event', label: 'Event', color: 'bg-emerald-500 hover:bg-emerald-400 border-emerald-600' },
                          { id: 'homework', label: 'Homework', color: 'bg-amber-500 hover:bg-amber-400 border-amber-600' },
                          { id: 'crafts', label: 'Crafts', color: 'bg-pink-500 hover:bg-pink-400 border-pink-600' },
                          { id: 'other', label: 'Other', color: 'bg-purple-500 hover:bg-purple-400 border-purple-600' }
                        ].map((act) => (
                          <button
                            key={`quick-act-${act.id}`}
                            onClick={() => {
                              if (!activities.includes(act.label)) {
                                const newActs = [...activities, act.label];
                                setActivities(newActs);
                                if (currentVisit) {
                                  updateDoc(doc(db, 'library_visits', currentVisit.id), { activities: newActs });
                                }
                              }
                            }}
                            className={`p-3 rounded-xl shadow-sm text-white font-bold text-xs border-b-4 active:border-b-0 active:translate-y-1 transition-all ${act.color}`}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={newActivity}
                          onChange={(e) => setNewActivity(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                          placeholder={t.Chat_InputPlaceholder}
                          className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border-2 border-transparent focus:border-indigo-300 outline-none font-medium text-xs"
                        />
                        <button
                          onClick={handleAddActivity}
                          disabled={!newActivity.trim()}
                          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowEndModal(true)}
                      className="w-full mt-4 py-3 md:py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <Square size={16} fill="currentColor" />
                      {t.Label_EndVisit}
                    </button>
                  </div>
                )}
              </div>

              {/* Session History */}
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Clock size={24} className="text-orange-500" />
                  {t.Label_SessionHistoryTitle}
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-[200px] md:max-h-[250px] pr-2 custom-scrollbar">
                  {visitHistory.length > 0 ? (
                    visitHistory.map((visit, idx) => (
                      <div key={`visit-history-${visit.id || idx}-${visitHistory.length}`} className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-700 text-sm md:text-base">
                            {typeof visit.startTime === 'string' ? visit.startTime : (visit.startTime instanceof Timestamp ? visit.startTime.toDate().toLocaleDateString() : t.Label_Date)}
                          </span>
                          <span className="text-[10px] md:text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-100">
                            {typeof visit.startTime === 'string' ? visit.startTime : (visit.startTime instanceof Timestamp ? visit.startTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')} - {typeof visit.endTime === 'string' ? visit.endTime : (visit.endTime instanceof Timestamp ? visit.endTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {visit.activities?.map((act, actIdx) => (
                            <span key={`visit-act-${visit.id}-${actIdx}-${visit.activities?.length}`} className="text-[9px] md:text-[10px] bg-white text-indigo-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-indigo-50">
                              {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium text-sm">{t.Text_NoSessions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div id="events-section" className="bg-white rounded-[3rem] shadow-2xl p-6 md:p-8 border-4 border-indigo-100 relative overflow-hidden">
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
              <Calendar className="text-indigo-500" />
              {t.Label_UpcomingEvents}
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={`upcoming-event-${event.id}`} className="bg-white rounded-2xl p-4 border-2 border-slate-50 shadow-sm flex gap-4 items-center group hover:border-indigo-100 transition-all">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900 truncate">{event.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                        <Calendar size={12} />
                        {event.date}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium text-xs">{t.Text_EmptyEvents}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div id="feedback-section" className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
            <Award className="w-24 h-24 md:w-32 md:h-32" />
          </div>
          
          <div className="relative z-10 space-y-6 md:space-y-8">
            <div className="bg-white/20 w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-lg">
              <Star className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
            </div>
            
            <div className="max-w-xl">
              <h3 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{t.Label_FeedbackPrompt}</h3>
              <p className="text-indigo-100 text-lg md:text-xl font-medium leading-relaxed opacity-90">
                {t.Subtitle_Guest}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartFeedback}
              className="px-8 py-4 md:px-12 md:py-6 bg-white text-indigo-600 font-black text-xl md:text-2xl rounded-[2rem] shadow-2xl flex items-center gap-4 hover:bg-indigo-50 transition-all w-full sm:w-fit justify-center"
            >
              {t.Btn_GiveFeedback}
              <ArrowRight size={28} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Start Visit Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center space-y-4 mb-8">
              <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                <Play size={40} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{t.Label_StartVisit}</h3>
              <p className="text-slate-500 font-medium">
                {t.Label_NoActiveVisit}
              </p>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.Label_TimeIn}</label>
              <input 
                type="time" 
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none font-bold text-lg"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                {t.Btn_Back}
              </button>
              <button
                onClick={handleStartVisit}
                disabled={!manualStartTime}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors disabled:opacity-50"
              >
                {t.Label_StartVisit}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* End Visit Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center space-y-4 mb-8">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{t.Label_EndVisit}?</h3>
              <p className="text-slate-500 font-medium">
                {t.Label_FeedbackPrompt}
              </p>
            </div>
            
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">{t.Label_TimeOut}</label>
              <input 
                type="time" 
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-emerald-400 outline-none font-bold text-lg"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                {t.Btn_Back}
              </button>
              <button
                onClick={handleEndVisit}
                disabled={!manualEndTime}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors disabled:opacity-50"
              >
                {t.Label_EndVisit}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
