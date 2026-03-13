import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, doc, getDoc, deleteDoc } from '../firebase';
import { Calendar, Clock, Info, Image as ImageIcon, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LibraryEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  posterUrl: string;
  createdAt: any;
}

export const VisitorEvents: React.FC = () => {
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<LibraryEvent | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'visitor' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async u => {
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryEvent[];
      setEvents(eventsData);
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'library_events', id));
      if (selectedEvent?.id === id) setSelectedEvent(null);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
            <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Event?</h3>
            <p className="text-slate-500 font-medium mb-8">
              Are you sure you want to remove this adventure from the magic scroll?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-100"
              >
                Yes, Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tight mb-3 flex items-center gap-3">
            Upcoming Adventures 
            <Sparkles className="text-yellow-400 animate-wiggle" size={40} />
          </h2>
          <p className="text-slate-500 font-bold text-xl">Discover magical events and fun activities waiting for you!</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 text-center shadow-2xl border-8 border-indigo-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          
          <div className="relative z-10">
            <div className="bg-indigo-100 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-float shadow-inner">
              <Calendar size={48} className="text-indigo-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4">No events scheduled yet</h3>
            <p className="text-slate-500 text-lg font-bold">Check back soon for magical library adventures!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <motion.div
              key={`event-card-${event.id}`}
              layoutId={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -12, scale: 1.02 }}
              onClick={() => setSelectedEvent(event)}
              className="bg-white rounded-[3rem] overflow-hidden shadow-xl border-4 border-white hover:border-indigo-200 transition-all cursor-pointer group hover:shadow-2xl hover:shadow-indigo-500/20"
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                {event.posterUrl ? (
                  <img 
                    src={event.posterUrl} 
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-200">
                    <ImageIcon size={64} className="opacity-50 animate-pulse" />
                  </div>
                )}
                
                {/* Admin Delete Button */}
                {userRole === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(event.id);
                    }}
                    className="absolute top-6 right-6 z-10 p-4 bg-red-500 text-white rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-red-600 hover:scale-110 active:scale-95"
                  >
                    <Trash2 size={24} />
                  </button>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-indigo-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                  <span className="text-white font-black text-lg flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                      <Info size={24} />
                    </div>
                    Click for details
                  </span>
                </div>
              </div>
              <div className="p-8 bg-white relative z-20">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest mb-4 bg-indigo-50 inline-flex px-4 py-2 rounded-full">
                  <Clock size={16} className="animate-wiggle" />
                  {event.date}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-slate-500 line-clamp-2 font-bold leading-relaxed">
                  {event.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div
              layoutId={selectedEvent.id}
              className="relative bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border-8 border-indigo-50"
            >
              <div className="md:w-1/2 bg-slate-100 relative">
                {selectedEvent.posterUrl ? (
                  <img 
                    src={selectedEvent.posterUrl} 
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-gradient-to-br from-indigo-50 to-purple-50">
                    <ImageIcon size={80} className="opacity-30 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto relative bg-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob pointer-events-none"></div>
                
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-6 right-6 p-4 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors btn-bouncy z-10"
                >
                  <Calendar size={24} className="rotate-45" />
                </button>

                {userRole === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(selectedEvent.id);
                    }}
                    className="absolute top-6 right-24 p-4 bg-red-50 hover:bg-red-100 rounded-full text-red-500 transition-colors btn-bouncy z-10"
                    title="Delete Event"
                  >
                    <Trash2 size={24} />
                  </button>
                )}
                
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-100 text-indigo-700 rounded-full font-black text-sm uppercase tracking-widest mb-6 shadow-inner">
                  <Clock size={18} className="animate-wiggle" />
                  {selectedEvent.date}
                </div>
                
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight drop-shadow-sm">
                  {selectedEvent.title}
                </h2>
                
                <div className="prose prose-slate max-w-none relative z-10">
                  <p className="text-slate-600 text-lg leading-relaxed font-bold whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                </div>

                <div className="mt-12 pt-8 border-t-4 border-slate-100 relative z-10">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg rounded-[2rem] hover:scale-[1.02] transition-transform shadow-xl btn-bouncy"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
