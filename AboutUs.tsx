import React from 'react';
import { motion } from 'motion/react';
import { Info, Target, Users, Heart, BookOpen, Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutUsProps {
  onBack: () => void;
}

export function AboutUs({ onBack }: AboutUsProps) {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-0 left-0 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      
      <div className="text-center space-y-6 mb-16 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block bg-indigo-100 p-4 rounded-[2rem] shadow-xl mb-4 animate-float"
        >
          <Info size={48} className="text-indigo-600" />
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-display font-black text-slate-900 tracking-tight flex items-center justify-center gap-4">
          {t.Title_AboutUs}
          <Sparkles className="text-yellow-400 animate-wiggle" size={40} />
        </h1>
        <p className="text-xl text-slate-600 font-bold max-w-2xl mx-auto">
          {t.Subtitle_AboutUs}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-indigo-100 hover:shadow-2xl hover:-translate-y-2 transition-all btn-bouncy"
        >
          <div className="bg-indigo-50 w-16 h-16 rounded-[2rem] flex items-center justify-center text-indigo-500 mb-6 shadow-inner animate-float">
            <Target size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">{t.Title_OurMission}</h3>
          <p className="text-slate-600 leading-relaxed font-bold">
            {t.Text_OurMission}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-emerald-100 hover:shadow-2xl hover:-translate-y-2 transition-all btn-bouncy"
        >
          <div className="bg-emerald-50 w-16 h-16 rounded-[2rem] flex items-center justify-center text-emerald-500 mb-6 shadow-inner animate-float" style={{ animationDelay: '0.5s' }}>
            <Sparkles size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">{t.Title_AITech}</h3>
          <p className="text-slate-600 leading-relaxed font-bold">
            {t.Text_AITech}
          </p>
        </motion.div>
      </div>

      <div className="space-y-12 relative z-10">
        <h2 className="text-4xl font-display font-black text-center text-slate-900">{t.Title_WhoIsThisFor}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-6 space-y-4 bg-white rounded-[2.5rem] shadow-lg border-4 border-blue-50 hover:border-blue-200 transition-colors btn-bouncy">
            <div className="bg-blue-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-blue-500 shadow-inner animate-float">
              <BookOpen size={40} />
            </div>
            <h4 className="text-xl font-black text-slate-900">{t.Title_StudentsK6}</h4>
            <p className="text-slate-500 text-sm font-bold">{t.Text_StudentsK6}</p>
          </div>
          <div className="text-center p-6 space-y-4 bg-white rounded-[2.5rem] shadow-lg border-4 border-purple-50 hover:border-purple-200 transition-colors btn-bouncy">
            <div className="bg-purple-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-purple-500 shadow-inner animate-float" style={{ animationDelay: '0.2s' }}>
              <Users size={40} />
            </div>
            <h4 className="text-xl font-black text-slate-900">{t.Title_StaffTeachers}</h4>
            <p className="text-slate-500 text-sm font-bold">{t.Text_StaffTeachers}</p>
          </div>
          <div className="text-center p-6 space-y-4 bg-white rounded-[2.5rem] shadow-lg border-4 border-pink-50 hover:border-pink-200 transition-colors btn-bouncy">
            <div className="bg-pink-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-pink-500 shadow-inner animate-float" style={{ animationDelay: '0.4s' }}>
              <Heart size={40} />
            </div>
            <h4 className="text-xl font-black text-slate-900">{t.Title_Parents}</h4>
            <p className="text-slate-500 text-sm font-bold">{t.Text_Parents}</p>
          </div>
        </div>
      </div>

      <div className="mt-16 bg-slate-900 rounded-[3rem] p-10 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        <ShieldCheck size={64} className="mx-auto text-indigo-400 animate-wiggle relative z-10" />
        <h3 className="text-3xl md:text-4xl font-black relative z-10">{t.Title_SafetyPrivacy}</h3>
        <p className="text-slate-300 max-w-2xl mx-auto font-bold text-lg relative z-10">
          {t.Text_SafetyPrivacy}
        </p>
      </div>

      <div className="mt-12 text-center relative z-10">
        <button
          onClick={onBack}
          className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xl rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all btn-bouncy border-b-4 border-indigo-800"
        >
          {t.Btn_BackToHome}
        </button>
      </div>
    </div>
  );
}
