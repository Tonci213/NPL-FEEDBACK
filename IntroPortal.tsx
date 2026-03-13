import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Globe, ArrowRight, Sparkles, Stars, Moon, Sun, BookOpen, Heart, Star, Music, Palette, Zap, Cloud, TreePine, Trophy, Users, Library, UserCircle } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import ReactPlayer from 'react-player';
import { ColorfulWelcome } from './ColorfulWelcome';
import { NatureBackground } from './NatureBackground';

interface IntroPortalProps {
  onEnter: () => void;
}

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.volume = 0.4;
  audio.play().catch(e => console.log("Audio play blocked", e));
};

const SOUNDS = {
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  MAGIC: 'https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3',
  ROCKET: 'https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3',
  SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  TRANSITION: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  AMBIENT: 'https://assets.mixkit.co/active_storage/sfx/132/132-preview.mp3' // Soft space ambient
};

const languages = [
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'ES', name: 'Español', flag: '🇪🇸' },
  { code: 'JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ZH', name: '中文', flag: '🇨🇳' },
  { code: 'ID', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
];

export const IntroPortal: React.FC<IntroPortalProps> = ({ onEnter }) => {
  const languageContext = useLanguage();
  
  if (!languageContext) {
    return null; // Or some loading state
  }
  
  const { language, setLanguage, t } = languageContext;
  const [stage, setStage] = useState<'loading' | 'video' | 'language' | 'features' | 'motivation'>('loading');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    playSound(SOUNDS.AMBIENT);
    // Start video immediately
    setStage('video');
    setIsVideoPlaying(true);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* Show Nature Background for all stages except video */}
      {stage !== 'video' && (
        <div className="absolute inset-0 transition-opacity duration-1000">
          <NatureBackground time={stage === 'loading' ? 'morning' : stage === 'language' ? 'day' : stage === 'features' ? 'evening' : 'night'} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-40 flex flex-col items-center justify-center"
          >
            <Sparkles size={100} className="text-yellow-400 animate-spin-slow mb-6" />
            <h2 className="text-4xl font-black text-white">Memuat Petualangan...</h2>
          </motion.div>
        )}

        {stage === 'video' && (
          <motion.div
            key="intro-video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full pointer-events-none scale-[1.3] md:scale-[1.15]">
              <ReactPlayer
                src="https://youtu.be/eeIz07N1ZV0"
                playing={isVideoPlaying}
                muted
                playsInline
                width="100%"
                height="100%"
                onEnded={() => {
                  setIsVideoPlaying(false);
                  setTimeout(() => setStage('language'), 50);
                }}
                config={{
                  youtube: {
                    playerVars: {
                      controls: 0,
                      disablekb: 1,
                      modestbranding: 1,
                      rel: 0,
                      showinfo: 0,
                      iv_load_policy: 3,
                      cc_load_policy: 0,
                      fs: 0,
                      playsinline: 1
                    }
                  } as any
                }}
              />
            </div>
            <div className="absolute bottom-6 right-6 z-50">
              <button
                onClick={() => {
                  setIsVideoPlaying(false);
                  setTimeout(() => setStage('language'), 50);
                }}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-full border-2 border-white/50 shadow-lg transition-all flex items-center gap-2 btn-bouncy"
              >
                {t.Btn_SkipTutorial} <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'language' && (
          <motion.div
            key="language"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-40 bg-white/90 backdrop-blur-lg p-8 md:p-12 rounded-[3rem] border-4 border-white shadow-2xl text-center max-w-3xl w-[95%] mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-black text-indigo-950 mb-8">Choose Your Language!</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {languages.map((lang, idx) => {
                const colors = [
                  'bg-indigo-500 hover:bg-indigo-400 border-indigo-600',
                  'bg-pink-500 hover:bg-pink-400 border-pink-600',
                  'bg-amber-500 hover:bg-amber-400 border-amber-600',
                  'bg-emerald-500 hover:bg-emerald-400 border-emerald-600',
                  'bg-blue-500 hover:bg-blue-400 border-blue-600',
                  'bg-purple-500 hover:bg-purple-400 border-purple-600',
                ];
                const colorClass = colors[idx % colors.length];
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as Language);
                      onEnter();
                    }}
                    className={`p-6 md:p-8 rounded-3xl shadow-lg hover:scale-105 transition-transform flex flex-col items-center justify-center gap-4 text-white border-b-8 active:border-b-0 active:translate-y-2 ${colorClass}`}
                  >
                    <span className="text-5xl md:text-6xl drop-shadow-md">{lang.flag}</span>
                    <span className="text-base md:text-lg font-black tracking-wide">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {stage === 'features' && (
          <ColorfulWelcome onComplete={onEnter} time="evening" />
        )}
      </AnimatePresence>
    </div>
  );
};
