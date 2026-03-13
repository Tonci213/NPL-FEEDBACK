import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Star, Download, Send, Printer, Palette, Sparkles, Heart, Trophy } from 'lucide-react';
import { FeedbackResult } from '../services/gemini';
import { CertificateTheme, CertificatePreview } from './Certificate';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedbackDisplayProps {
  result: FeedbackResult;
  studentName: string;
  activityName: string;
  onPrintCertificate: () => void;
  onDownloadCertificate: () => void;
  onSendCertificate: () => void;
  onSaveToCollection: () => void;
  onReset: () => void;
  currentTheme: CertificateTheme;
  onThemeChange: (theme: CertificateTheme) => void;
  isGuest: boolean;
}

export function FeedbackDisplay({ 
  result, 
  studentName,
  activityName,
  onPrintCertificate, 
  onDownloadCertificate,
  onSendCertificate,
  onSaveToCollection,
  onReset,
  currentTheme,
  onThemeChange,
  isGuest
}: FeedbackDisplayProps) {
  const { t } = useLanguage();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadCertificate();
    } finally {
      setIsDownloading(false);
    }
  };
  
  const themes: { id: CertificateTheme; label: string; color: string; icon: any }[] = [
    { id: 'classic', label: 'Classic', color: 'bg-indigo-600', icon: Trophy },
    { id: 'space', label: 'Space', color: 'bg-blue-900', icon: Sparkles },
    { id: 'nature', label: 'Nature', color: 'bg-green-600', icon: Heart },
    { id: 'magic', label: 'Magic', color: 'bg-purple-600', icon: Palette },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* Header Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-indigo-50 relative"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-10 text-white text-center relative overflow-hidden">
          {!isGuest && (
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute top-6 right-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-sm font-black border-2 border-white/30 shadow-lg animate-float"
            >
              <Trophy size={18} className="text-yellow-300 animate-wiggle" />
              {t.Btn_SaveCollection}
            </motion.div>
          )}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -right-32 w-96 h-96 bg-white/20 rounded-full blur-3xl mix-blend-overlay"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -left-32 w-80 h-80 bg-yellow-300/20 rounded-full blur-3xl mix-blend-overlay"
          />
          
          <div className="flex justify-center gap-4 mb-8 relative z-10">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`feedback-star-${i}`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 200, damping: 10 }}
                className="animate-float"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                <Star
                  size={48}
                  className={`${i < result.stars ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'text-white/30'}`}
                />
              </motion.div>
            ))}
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-black mb-6 drop-shadow-lg tracking-tight relative z-10 text-shadow-sm">{result.encouragement}</h2>
          <p className="text-white/95 text-xl md:text-2xl font-bold max-w-3xl mx-auto leading-relaxed relative z-10 drop-shadow-md">{result.summary}</p>
        </div>

        <div className="p-10 relative z-10 bg-white">
          <div className="prose prose-indigo max-w-none">
            <h3 className="text-2xl md:text-3xl font-display font-black text-slate-800 flex items-center gap-4 mb-8">
              <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 shadow-inner animate-wiggle">
                <Sparkles size={28} />
              </div>
              Librarian's Message
            </h3>
            <div className="bg-slate-50 p-8 md:p-10 rounded-[2.5rem] border-4 border-slate-100 text-slate-700 text-lg md:text-xl leading-relaxed font-bold shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50"></div>
              <div className="relative z-10 markdown-body">
                <ReactMarkdown>{result.feedback}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Customization & Actions */}
        <div className="bg-indigo-50/50 p-10 border-t-4 border-indigo-100">
          <div className="mb-10">
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Palette size={18} /> Pick Your Certificate Theme
            </h4>
            <div className="flex gap-4 flex-wrap mb-10">
              {themes.map((theme) => {
                const Icon = theme.icon;
                return (
                  <motion.button
                    key={`theme-opt-${theme.id}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onThemeChange(theme.id)}
                    className={`px-6 py-3 rounded-2xl text-base font-bold transition-all flex items-center gap-3 ${
                      currentTheme === theme.id
                        ? 'bg-white shadow-xl ring-4 ring-indigo-500 text-indigo-700'
                        : 'bg-white border-2 border-slate-200 text-slate-500 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${theme.color} flex items-center justify-center text-white`}>
                      <Icon size={16} />
                    </div>
                    {theme.label}
                  </motion.button>
                );
              })}
            </div>

             {/* Certificate Preview */}
            <div className="mb-10">
               <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6">Your Certificate Preview</h4>
               <motion.div 
                 whileHover={{ scale: 1.01 }}
                 className="shadow-2xl rounded-[2rem] overflow-hidden border-8 border-white"
               >
                 <CertificatePreview 
                    studentName={studentName}
                    activityName={activityName}
                    result={result}
                    date={new Date().toLocaleDateString()}
                    theme={currentTheme}
                 />
               </motion.div>
            </div>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isGuest ? 'lg:grid-cols-4' : 'lg:grid-cols-4'} gap-4`}>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPrintCertificate}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border-4 border-slate-100 shadow-lg transition-all"
            >
              <Printer size={22} className="text-indigo-500" />
              {t.Btn_Print}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              disabled={isDownloading}
              onClick={handleDownload}
              className={`flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border-4 border-slate-100 shadow-lg transition-all ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDownloading ? (
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={22} className="text-purple-500" />
              )}
              {isDownloading ? 'Downloading...' : t.Btn_Download}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSendCertificate}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all"
            >
              <Send size={22} />
              {t.Btn_SendCard}
            </motion.button>
             <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-transparent hover:bg-white/50 text-slate-400 font-bold rounded-2xl transition-all"
            >
              {t.Btn_StartOver}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
