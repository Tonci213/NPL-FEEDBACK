import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone, Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { db, auth, collection, onSnapshot, query, orderBy, addDoc, Timestamp, deleteDoc, doc, getDoc, User } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';

interface EventPoster {
  id: string;
  title: string;
  posterUrl: string;
  date: string;
  description?: string;
  createdAt: any;
}

export function EventAnnouncements() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventPoster[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'visitor' | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async u => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.email!);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else if (u.email === 'toncirafael@gmail.com') {
          setUserRole('admin');
        }
      } else {
        setUserRole(null);
      }
    });
    
    const q = query(collection(db, 'library_events'), orderBy('createdAt', 'desc'));
    const unsubEvents = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventPoster[];
      setEvents(eventData);
    });

    return () => {
      unsubAuth();
      unsubEvents();
    };
  }, []);

  // Auto-rotate events
  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % events.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [events]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'library_events'), {
        title,
        posterUrl,
        date,
        description,
        createdAt: Timestamp.now()
      });
      setTitle('');
      setPosterUrl('');
      setDate('');
      setDescription('');
      setShowUpload(false);
    } catch (error) {
      console.error("Error adding event:", error);
      setEventError(t.Error_PostEvent);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'library_events', id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      setEventError(t.Error_DeleteEvent);
    }
  };

  if (events.length === 0 && !isAdmin) return null;

  return (
    <>
      {/* Error Message */}
      {eventError && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 right-8 z-[70] bg-red-50 text-red-600 p-4 rounded-2xl font-bold border-2 border-red-100 flex items-center gap-4 shadow-xl"
        >
          <span>{eventError}</span>
          <button onClick={() => setEventError(null)} className="p-1 hover:bg-red-100 rounded-lg">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-md w-full border-b-8 border-red-100 text-center"
          >
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{t.Modal_DeleteTitle.replace('{type}', 'Event')}</h3>
            <p className="text-slate-500 font-medium mb-8">
              {t.Modal_DeleteConfirm.replace('{type}', 'event')}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                {t.Btn_Cancel}
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-100"
              >
                {t.Btn_ConfirmDelete}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Announcement Widget */}
      <AnimatePresence>
        {events.length > 0 && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[60] w-72 sm:w-80"
          >
            <motion.div
              layout
              className="bg-white rounded-[2rem] shadow-2xl border-4 border-yellow-400 overflow-hidden relative group"
            >
              {/* Event Content */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={events[currentIndex].id}
                    src={events[currentIndex].posterUrl}
                    alt={events[currentIndex].title}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                
                {/* Overlay Info */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12">
                  <h4 className="text-white font-bold text-lg leading-tight mb-1">
                    {events[currentIndex].title}
                  </h4>
                  {events[currentIndex].description && (
                    <p className="text-white/80 text-xs line-clamp-2">
                      {events[currentIndex].description}
                    </p>
                  )}
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(events[currentIndex].id);
                    }}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Badge */}
              <div className="absolute top-4 left-4 bg-yellow-400 text-indigo-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                <Megaphone size={12} />
                {t.Label_NewEvent}
              </div>

              {/* Progress Dots */}
              {events.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {events.map((event, i) => (
                    <div 
                      key={`event-dot-${event.id}`}
                      className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-yellow-400' : 'w-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-8 relative"
            >
              <button 
                onClick={() => setShowUpload(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-100 p-4 rounded-2xl text-indigo-600">
                  <Megaphone size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t.Title_PostEvent}</h2>
                  <p className="text-slate-500">{t.Subtitle_PostEvent}</p>
                </div>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.Label_EventTitle}</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={t.Placeholder_EventTitle}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.Label_EventDate}</label>
                  <input
                    required
                    type="text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    placeholder={t.Placeholder_EventDate}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.Label_PosterURL}</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      required
                      type="url"
                      value={posterUrl}
                      onChange={e => setPosterUrl(e.target.value)}
                      placeholder="https://example.com/poster.jpg"
                      className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.Label_ShortDesc}</label>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1"></span>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t.Placeholder_ShortDesc}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" /> : t.Btn_PostAnnouncement}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
