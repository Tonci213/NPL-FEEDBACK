import React from 'react';
import { CertificateRecord, VisitRecord } from '../types';
import { Trophy, Calendar, BookOpen, Trash2, Award, Star, ChevronRight, Info, Map, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CollectionGalleryProps {
  certificates: CertificateRecord[];
  visits: VisitRecord[];
  onDelete: (id: string) => void;
  onView: (cert: CertificateRecord) => void;
}

export function CollectionGallery({ certificates, visits, onDelete, onView }: CollectionGalleryProps) {
  const currentCount = certificates.length;
  const nextCheckpoint = Math.ceil((currentCount + 1) / 10) * 10 || 10;
  const prevCheckpoint = Math.max(0, nextCheckpoint - 10);
  
  const progressInCurrentLevel = currentCount - prevCheckpoint;
  const percentage = (progressInCurrentLevel / 10) * 100;
  
  const isRewardUnlocked = currentCount >= 10;
  const totalCheckpointsReached = Math.floor(currentCount / 10);

  return (
    <div className="space-y-12">
      {/* Progress Section */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="kid-card p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden border-4 border-indigo-200 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-shadow-sm flex items-center gap-3">
                Children Visitor Board
                <Sparkles className="text-yellow-300 animate-wiggle" size={32} />
              </h2>
              <p className="text-indigo-100 font-bold text-lg">
                {totalCheckpointsReached > 0 
                  ? `You've reached ${totalCheckpointsReached} ${totalCheckpointsReached === 1 ? 'checkpoint' : 'checkpoints'}! Amazing! 🌟`
                  : 'Collect 10 certificates to earn your first library reward! 🎁'}
              </p>
            </div>
            <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-md relative shadow-inner animate-float">
              <Trophy size={48} className={isRewardUnlocked ? "text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" : "text-white/50"} />
              {totalCheckpointsReached > 0 && (
                <span className="absolute -top-3 -right-3 bg-yellow-400 text-indigo-900 text-sm font-black px-3 py-1 rounded-full shadow-xl border-2 border-white animate-bounce">
                  x{totalCheckpointsReached}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm font-black uppercase tracking-widest">
              <span>Next Reward: {currentCount} / {nextCheckpoint}</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="h-8 bg-black/20 rounded-full overflow-hidden p-1.5 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className={`h-full rounded-full ${percentage === 100 ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-[0_0_20px_rgba(253,224,71,0.6)]' : 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}
              />
            </div>
          </div>

          {isRewardUnlocked ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/20 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] border-4 border-yellow-300/50 flex flex-col sm:flex-row items-center gap-6 shadow-xl"
            >
              <div className="bg-yellow-400 p-5 rounded-[2rem] text-indigo-900 shadow-inner animate-wiggle">
                <Award size={40} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl font-black text-yellow-300 drop-shadow-sm">Reward Eligibility! 🎉</h3>
                <p className="text-base font-bold text-indigo-50 mt-1">You have earned {totalCheckpointsReached} {totalCheckpointsReached === 1 ? 'reward' : 'rewards'}! Show this screen to a librarian to claim your prizes.</p>
              </div>
              <button className="px-8 py-4 bg-yellow-400 text-indigo-900 font-black text-lg rounded-[2rem] hover:scale-105 transition-transform shadow-xl btn-bouncy border-b-4 border-yellow-600">
                Claim Reward
              </button>
            </motion.div>
          ) : (
            <p className="text-base text-indigo-100 font-bold italic bg-white/10 p-4 rounded-2xl text-center backdrop-blur-sm">
              Keep going! You need {nextCheckpoint - currentCount} more {nextCheckpoint - currentCount === 1 ? 'certificate' : 'certificates'} for your next reward.
            </p>
          )}
        </div>
      </motion.div>

      {/* Gallery Grid */}
      <div className="space-y-6">
        <h3 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3 px-2">
          <BookOpen className="text-indigo-600" />
          My Certificates
        </h3>

        {certificates.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Star className="text-slate-300" size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-400">No certificates yet!</h4>
            <p className="text-slate-400 font-medium">Complete an activity to start your collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {certificates.map((cert) => (
                <motion.div
                  key={`cert-card-${cert.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="kid-card bg-white p-6 group relative"
                >
                  <div className="flex gap-6">
                    <div className={`w-24 h-32 rounded-xl flex-shrink-0 flex items-center justify-center border-2 border-slate-100 shadow-inner overflow-hidden relative ${
                      cert.theme === 'space' ? 'bg-slate-900' : 
                      cert.theme === 'nature' ? 'bg-green-50' : 
                      cert.theme === 'magic' ? 'bg-purple-50' : 'bg-slate-50'
                    }`}>
                      <Award size={32} className={
                        cert.theme === 'space' ? 'text-blue-400' : 
                        cert.theme === 'nature' ? 'text-green-500' : 
                        cert.theme === 'magic' ? 'text-purple-500' : 'text-indigo-500'
                      } />
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-0.5">
                        {[...Array(cert.result.stars)].map((_, i) => (
                          <Star key={`cert-star-${cert.id}-${i}`} size={8} fill="#fbbf24" color="#fbbf24" />
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 line-clamp-1">{cert.activityName}</h4>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <Calendar size={12} />
                          {cert.date}
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-500 line-clamp-2 font-medium italic">
                        "{cert.result.summary}"
                      </p>

                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => onView(cert)}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-1"
                        >
                          View <ChevronRight size={14} />
                        </button>
                        <button 
                          onClick={() => onDelete(cert.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Adventure Board / Visit History */}
      <div className="space-y-6">
        <h3 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3 px-2">
          <Map className="text-emerald-600" />
          My Adventure Board
        </h3>

        {visits.length === 0 ? (
          <div className="text-center py-12 bg-emerald-50/50 rounded-[3rem] border-4 border-dashed border-emerald-100">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Clock className="text-emerald-300" size={28} />
            </div>
            <h4 className="text-lg font-bold text-emerald-600/60">No adventures recorded yet!</h4>
            <p className="text-emerald-600/40 font-medium">Your journey starts today! ✨</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visits.map((visit, idx) => (
              <motion.div
                key={`visit-history-${visit.id || idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-3xl border-2 border-emerald-50 shadow-sm flex items-center gap-4"
              >
                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                  <Clock size={24} />
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-600 uppercase tracking-widest">{visit.date}</div>
                  <div className="text-lg font-black text-slate-800">{visit.startTime} - {visit.endTime}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 rounded-[2rem] p-8 flex gap-6 items-start">
        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 flex-shrink-0">
          <Info size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-blue-900">How to claim your reward</h4>
          <p className="text-blue-700 text-sm font-medium leading-relaxed">
            When you reach 10 certificates, bring your device to the library! A librarian will check your collection and give you a special prize like stickers, bookmarks, or other library-themed gifts.
          </p>
        </div>
      </div>
    </div>
  );
}
