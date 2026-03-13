import React, { useState, useRef, useEffect } from 'react';
import { NatureBackground } from './components/NatureBackground';
import { Dashboard } from './components/Dashboard';
import { EntryScreen } from './components/EntryScreen';
import { FileUpload } from './components/FileUpload';
import { GradeLevelSelector, GradeLevel } from './components/GradeLevelSelector';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { Certificate, CertificateTheme, CertificatePreview } from './components/Certificate';
import { CameraScanner } from './components/CameraScanner';
import { CollectionGallery } from './components/CollectionGallery';
import { EventAnnouncements } from './components/EventAnnouncements';
import { AboutUs } from './components/AboutUs';
import { StudentDashboard } from './components/StudentDashboard';
import { analyzeActivityFeedback, FeedbackResult } from './services/gemini';
import { Library, Sparkles, X, Camera, BookOpen, Loader2, Heart, Star as StarIcon, Smile, Rocket, Palette, Trophy, Layout, Printer, LogOut, IdCard, LogIn, BarChart3, ArrowRight, Users, Calendar, UserCircle, TrendingUp, ArrowLeft, Clock, Info, MessageCircle, Send, Globe, Languages } from 'lucide-react';
import { VisitorEvents } from './components/VisitorEvents';
import { IntroPortal } from './components/IntroPortal';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { CertificateRecord, VisitRecord } from './types';
import { auth, googleProvider, signInWithPopup, User, db, doc, setDoc, getDoc, increment, serverTimestamp, addDoc, collection, query, where, orderBy, getDocs } from './firebase';
import { useLanguage, Language } from './contexts/LanguageContext';

const FloatingIcon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    animate={{
      y: [0, -30, 0],
      rotate: [0, 15, -15, 0],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 3 + Math.random() * 3,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className={`absolute pointer-events-none opacity-40 ${className}`}
  >
    {children}
  </motion.div>
);

const BlobDecoration = ({ color, className }: { color: string; className?: string }) => (
  <div className={`absolute rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] mix-blend-multiply filter blur-2xl opacity-40 animate-blob ${color} ${className}`} />
);

const triggerConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
  }, 250);
};

const BackButton = ({ onClick, label }: { onClick: () => void; label?: string }) => {
  const { t } = useLanguage();
  return (
    <motion.button
      whileHover={{ x: -4 }}
      onClick={onClick}
      className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-all px-4 py-2 rounded-xl hover:bg-slate-50 w-fit mb-6"
    >
      <ArrowLeft size={20} />
      {label || t.Btn_Back}
    </motion.button>
  );
};

const ChatBubble = ({ message }: { message: string | React.ReactNode | null }) => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped || !message) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, [message, skipped]);

  if (!message || skipped) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          key="chat-bubble"
          initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom left' }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-40 bg-white p-5 md:p-6 rounded-[2rem] rounded-bl-none shadow-2xl border-4 border-indigo-100 max-w-sm md:max-w-md pointer-events-auto"
        >
          <button 
            onClick={() => setSkipped(true)} 
            className="absolute -top-3 -right-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full p-1 shadow-sm transition-colors"
            title={t.Btn_SkipTutorial}
          >
            <X size={16} />
          </button>
          <div className="absolute -bottom-2 -left-4 md:-bottom-4 md:-left-6 bg-indigo-100 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
            <Smile className="text-indigo-600 w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="text-sm md:text-base font-bold text-slate-700 leading-relaxed mb-2">
            {message}
          </div>
          <button 
            onClick={() => setSkipped(true)} 
            className="text-xs text-indigo-500 font-bold hover:text-indigo-700 transition-colors"
          >
            {t.Btn_SkipTutorial}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import { GoogleGenAI } from "@google/genai";

export interface LiveMessage {
  id: string;
  sender: 'visitor' | 'librarian';
  text: string;
  timestamp: Date;
  libraryId?: string;
  visitorName?: string;
}

const ChatBot = ({ 
  liveMessages, 
  setLiveMessages,
  userRole,
  libraryId,
  visitorName
}: { 
  liveMessages: LiveMessage[], 
  setLiveMessages: React.Dispatch<React.SetStateAction<LiveMessage[]>>,
  userRole: 'visitor' | 'admin' | null,
  libraryId?: string,
  visitorName?: string
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'live'>('ai');
  
  // AI Chat State
  const [aiMessages, setAiMessages] = useState<{text: string, isUser: boolean}[]>([
    { text: "Halo! Aku asisten perpustakaan yang ramah. Ada yang bisa aku bantu untuk menjelajahi perpustakaan ini? (Hi! I'm a friendly library assistant. How can I help you explore?)", isUser: false }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Live Chat State
  const [liveInput, setLiveInput] = useState('');

  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    const userText = aiInput;
    setAiMessages(prev => [...prev, { text: userText, isUser: true }]);
    setAiInput('');
    setIsAiTyping(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userText,
        config: {
          systemInstruction: "You are a friendly, child-friendly library assistant for the 'NPL Feedback' app. Use simple, cheerful language suitable for kids (in Indonesian or English depending on the user). You also act as a guide for caregivers using this library app, explaining how to use the feedback system, explore themes, and track reading. Keep responses short, engaging, and helpful."
        }
      });
      
      if (response.text) {
        setAiMessages(prev => [...prev, { text: response.text as string, isUser: false }]);
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      setAiMessages(prev => [...prev, { text: "Maaf, aku sedang tidak bisa berpikir sekarang. Coba lagi nanti ya! 🌟", isUser: false }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleLiveSend = () => {
    if (!liveInput.trim()) return;
    const newMessage: LiveMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: userRole === 'admin' ? 'librarian' : 'visitor',
      text: liveInput,
      timestamp: new Date(),
      libraryId: libraryId,
      visitorName: visitorName
    };
    setLiveMessages(prev => [...prev, newMessage]);
    setLiveInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border-4 border-indigo-100 overflow-hidden flex flex-col h-[28rem]"
          >
            <div className="bg-indigo-500 text-white p-4 font-bold flex justify-between items-center">
              <span>{t.Chat_StaffTitle || "Library Assistant"}</span>
              <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-600 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                🤖 AI Guide
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'live' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                💬 Live Help
              </button>
            </div>

            {activeTab === 'ai' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {aiMessages.map((msg, idx) => (
                    <div key={`ai-msg-${idx}`} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isUser ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm flex gap-1">
                        <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiSend()}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={handleAiSend}
                    disabled={isAiTyping}
                    className="bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-600 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {(() => {
                    const filteredMessages = userRole === 'admin' 
                      ? liveMessages 
                      : liveMessages.filter(m => (m.libraryId || 'Anonymous') === (libraryId || 'Anonymous'));
                    
                    if (filteredMessages.length === 0) {
                      return (
                        <div className="text-center text-slate-400 text-sm mt-10">
                          No messages yet. Send a message to the librarian!
                        </div>
                      );
                    }
                    
                    return filteredMessages.map((msg, msgIdx) => {
                      const isMe = msg.sender === (userRole === 'admin' ? 'librarian' : 'visitor');
                      return (
                        <div key={`live-msg-${msg.id || msgIdx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                            <div className="text-[10px] opacity-70 mb-1">{msg.sender === 'librarian' ? 'Librarian' : 'Visitor'}</div>
                            {msg.text}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={liveInput}
                    onChange={(e) => setLiveInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLiveSend()}
                    placeholder="Message librarian..."
                    className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    onClick={handleLiveSend}
                    className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition-colors flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-500 text-white p-4 rounded-full shadow-xl hover:bg-indigo-600 transition-colors flex items-center justify-center relative"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && liveMessages.filter(m => m.sender === 'librarian').length > 0 && userRole !== 'admin' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </motion.button>
    </div>
  );
};

type Step = 'portal' | 'rocket' | 'splash' | 'initial-setup' | 'welcome' | 'role-selection' | 'visitor-entry' | 'setup' | 'analyzing' | 'results' | 'staff-selection';
type View = 'feedback' | 'collection' | 'dashboard' | 'events' | 'student-dashboard' | 'about' | 'meeting';
export type AppTheme = 'space' | 'jungle' | 'ocean' | 'magic' | 'dinosaur' | 'robot' | 'fairy' | 'pirate' | 'superhero' | 'candy';

const playSound = (sound: string) => {
  const url = SOUNDS[sound as keyof typeof SOUNDS] || sound;
  const audio = new Audio(url);
  audio.volume = 0.4;
  audio.play().catch(e => console.log("Audio play blocked", e));
};

const SOUNDS = {
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  MAGIC: 'https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3',
  ROCKET: 'https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3',
  SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  TRANSITION: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
};

const RocketLaunch = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    playSound(SOUNDS.ROCKET);
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              scale: Math.random()
            }}
            animate={{ 
              opacity: [0.2, 1, 0.2],
              scale: [null, 1.2, 1]
            }}
            transition={{ 
              duration: 2 + Math.random() * 3, 
              repeat: Infinity 
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>

      <motion.div
        initial={{ y: 800, scale: 0.5 }}
        animate={{ 
          y: [-800, -1200],
          scale: [1, 1.5],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4,
          ease: "easeIn"
        }}
        className="relative"
      >
        <Rocket size={120} className="text-white fill-red-500" />
        <motion.div
          animate={{ 
            scaleY: [1, 2, 1.5, 2.5, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="absolute top-full left-1/2 -translate-x-1/2 w-8 h-32 bg-gradient-to-b from-orange-500 via-yellow-400 to-transparent blur-sm rounded-full origin-top"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-12 text-white text-4xl font-black tracking-widest uppercase italic text-center px-6"
      >
        Launching Your Library Adventure...
      </motion.div>
    </motion.div>
  );
};

const PortalIntro = ({ onComplete, onSkipToLibrarian }: { onComplete: () => void, onSkipToLibrarian?: () => void }) => {
  const { t } = useLanguage();
  const [scene, setScene] = useState(0);
  
  const scenes = [
    { title: t.Intro_Greeting, subtitle: t.Intro_Subtitle, icon: <Library size={120} />, color: 'from-indigo-600 to-purple-600' },
    { title: t.Intro_Scene2_Title, subtitle: t.Intro_Scene2_Desc, icon: <Sparkles size={120} />, color: 'from-purple-600 to-pink-600' },
    { title: t.Intro_Scene3_Title, subtitle: t.Intro_Scene3_Desc, icon: <BookOpen size={120} />, color: 'from-pink-600 to-rose-600' },
    { title: t.Intro_Scene4_Title, subtitle: t.Intro_Scene4_Desc, icon: <Rocket size={120} />, color: 'from-rose-600 to-orange-600' },
    { title: t.Intro_Scene5_Title, subtitle: t.Intro_Scene5_Desc, icon: <Palette size={120} />, color: 'from-orange-600 to-yellow-600' },
    { title: t.Intro_Scene6_Title, subtitle: t.Intro_Scene6_Desc, icon: <Smile size={120} />, color: 'from-yellow-600 to-emerald-600' },
  ];

  useEffect(() => {
    if (scene < scenes.length - 1) {
      const timer = setTimeout(() => {
        setScene(prev => prev + 1);
        playSound(SOUNDS.TRANSITION);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [scene, scenes.length, onComplete]);

  const getTimeForScene = (scene: number) => {
    if (scene === 0) return 'morning';
    if (scene === 1 || scene === 2) return 'day';
    if (scene === 3 || scene === 4) return 'evening';
    return 'night';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-colors duration-1000"
    >
      <NatureBackground time={getTimeForScene(scene)} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`intro-particle-${i}`}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              y: [null, "-300px"],
              opacity: [0, 0.7, 0],
              scale: [0, 1.5, 0.5],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 4 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className={`absolute ${
              i % 4 === 0 ? 'text-yellow-300' : 
              i % 4 === 1 ? 'text-pink-300' : 
              i % 4 === 2 ? 'text-cyan-300' : 'text-white'
            }`}
          >
            {i % 4 === 0 ? <Sparkles size={24} /> : 
             i % 4 === 1 ? <StarIcon size={20} /> : 
             i % 4 === 2 ? <Heart size={24} /> : <BookOpen size={20} />}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`scene-${scene}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl"
        >
          {/* Blackout overlay during transition */}
          <motion.div
            key="blackout-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 bg-black z-50"
          />
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
              y: [0, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-white blur-3xl opacity-20 rounded-full scale-150" />
            <div className="bg-white p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-8 relative z-10 text-indigo-600">
              {scenes[scene].icon}
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-8xl font-display font-black text-white mb-6 tracking-tighter drop-shadow-xl">
            {scenes[scene].title}
          </h1>
          
          <p className="text-xl md:text-3xl text-white font-bold mb-12 drop-shadow-md opacity-90 leading-tight">
            {scenes[scene].subtitle}
          </p>

          <div className="flex gap-3 mt-12">
            {scenes.map((_, i) => (
              <div 
                key={`scene-dot-${i}`}
                className={`h-3 rounded-full transition-all duration-500 ${i === scene ? 'w-12 bg-white' : 'w-3 bg-white/30'}`} 
              />
            ))}
          </div>
          
          <button
            onClick={onComplete}
            className="absolute bottom-6 right-6 z-50 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-full border-2 border-white/50 shadow-lg transition-all flex items-center gap-2"
          >
            Skip Intro
            <ArrowRight size={20} />
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

const StartTimeModal = ({ isOpen, time, onConfirm }: { isOpen: boolean, time: string, onConfirm: () => void }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] p-12 max-w-md w-full text-center space-y-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
          <Clock size={48} className="text-indigo-600" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-900">{t.Title_AdventureStarts}</h2>
          <p className="text-xl text-slate-600 font-medium">{t.Text_StartTimeRecorded}</p>
          <div className="bg-slate-50 py-6 rounded-3xl border-4 border-slate-100">
            <span className="text-5xl font-black text-indigo-600">{time}</span>
          </div>
        </div>
        <button 
          onClick={onConfirm}
          className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-2xl font-black rounded-[2rem] shadow-xl hover:shadow-2xl transition-all hover:scale-105"
        >
          {t.Btn_LetsGo}
        </button>
      </motion.div>
    </div>
  );
};

const EndTimeModal = ({ isOpen, time, onConfirm, onCancel }: { isOpen: boolean, time: string, onConfirm: () => void, onCancel: () => void }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] p-12 max-w-md w-full text-center space-y-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
        <div className="bg-pink-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
          <LogOut size={48} className="text-pink-600" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-900">{t.Title_FinishAdventure}</h2>
          <p className="text-xl text-slate-600 font-medium">{t.Text_FinishAdventure}</p>
          <div className="bg-slate-50 py-6 rounded-3xl border-4 border-slate-100">
            <span className="text-5xl font-black text-pink-600">{time}</span>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <button 
            onClick={onConfirm}
            className="w-full py-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-2xl font-black rounded-[2rem] shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            {t.Btn_FinishExit}
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
          >
            {t.Btn_StayMore}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const StaffLoginModal = ({ isOpen, onConfirm, onCancel }: { isOpen: boolean, onConfirm: (password: string) => void, onCancel: () => void }) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setError('');
      setPassword('');
      onConfirm(password);
    } else {
      setError('Incorrect password!');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] p-12 max-w-md w-full text-center space-y-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
          <Library size={48} className="text-indigo-600" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-900">Staff Access</h2>
          <p className="text-xl text-slate-600 font-medium">Enter your password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-6 py-4 text-xl bg-slate-50 border-4 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all"
            autoFocus
          />
          {error && <p className="text-red-500 font-bold">{error}</p>}
          <div className="flex flex-col gap-4">
            <button 
              type="submit"
              className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-2xl font-black rounded-[2rem] shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              Login
            </button>
            <button 
              type="button"
              onClick={() => {
                setError('');
                setPassword('');
                onCancel();
              }}
              className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const [isMuted, setIsMuted] = useState(false);

  const playSound = (url: string) => {
    if (isMuted) return;
    const audio = new Audio(url);
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked", e));
  };

  const [view, setView] = useState<View>('feedback');
  const [hasEntered, setHasEntered] = useState(false);
  const [step, setStep] = useState<Step>('splash');
  const [setupPhase, setSetupPhase] = useState<'role' | 'theme' | 'avatar'>('role');
  const [appTheme, setAppTheme] = useState<AppTheme>('space');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('lion');
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const [libraryId, setLibraryId] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'visitor' | 'caregiver' | null>(null);
  const [selectedRole, setSelectedRole] = useState<'visitor' | 'staff' | null>(null);
  
  // Staff Selection State
  const [staffType, setStaffType] = useState<'librarian' | 'caregiver' | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [timeIn, setTimeIn] = useState('');
  const [activityName, setActivityName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | ''>('');
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<CertificateTheme>('classic');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [digitalCardId, setDigitalCardId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [tempRole, setTempRole] = useState<'visitor' | 'staff' | null>(null);
  const [collectedCertificates, setCollectedCertificates] = useState<CertificateRecord[]>([]);
  const [visitHistory, setVisitHistory] = useState<VisitRecord[]>([]);
  const [selectedCertForView, setSelectedCertForView] = useState<CertificateRecord | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'users' | 'events' | 'visits' | 'students' | 'accounts' | 'chat'>('overview');
  const [dashboardTabHistory, setDashboardTabHistory] = useState<('overview' | 'users' | 'events' | 'visits' | 'students' | 'accounts' | 'chat')[]>(['overview']);

  const handleTabChange = (tab: 'overview' | 'users' | 'events' | 'visits' | 'students' | 'accounts' | 'chat') => {
    if (activeDashboardTab !== tab) {
      setDashboardTabHistory(prev => [...prev, tab]);
      setActiveDashboardTab(tab);
    }
  };
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showStaffLoginModal, setShowStaffLoginModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);

  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const certificateRef = useRef<HTMLDivElement>(null);

  // Splash screen timer removed in favor of IntroPortal
  
  // Load collection from localStorage
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async u => {
      setUser(u);
      if (u) {
        setShowSupportModal(false);
        // Fetch role from Firestore
        const userRef = doc(db, 'users', u.email!);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);
          setView('dashboard');
          setStep('setup');
        } else if (u.email === 'toncirafael@gmail.com') {
          // Fallback for bootstrap admin as librarian
          setUserRole('admin');
          setView('dashboard');
          setStep('setup');
        } else {
          setError(t.Error_AccessDenied);
          auth.signOut();
          setStep('welcome');
          setSelectedRole(null);
        }
      } else {
        setUserRole(null);
      }
    });
    
    const saved = localStorage.getItem('npl_certificates');
    if (saved) {
      try {
        setCollectedCertificates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load collection", e);
      }
    }

    // Fetch visit history if library ID is set
    if (libraryId) {
      const fetchVisits = async () => {
        try {
          const q = query(
            collection(db, 'library_visits'),
            where('libraryId', '==', libraryId),
            orderBy('timestamp', 'desc')
          );
          const snapshot = await getDocs(q);
          const visits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisitRecord));
          setVisitHistory(visits);
        } catch (e) {
          console.error("Failed to fetch visit history", e);
        }
      };
      fetchVisits();
    }
  }, [libraryId]);

  // Save collection to localStorage
  useEffect(() => {
    localStorage.setItem('npl_certificates', JSON.stringify(collectedCertificates));
  }, [collectedCertificates]);

  const handleEntrySelect = async (guest: boolean, id?: string, name?: string) => {
    setIsGuest(guest);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStartTime(now);
    setTimeIn(now); // Keep for legacy compatibility in feedback

    if (id) {
      setLibraryId(id);
      if (name) {
        setStudentName(name);
      } else {
        try {
          const { getDocs, query, collection: firestoreCollection, where } = await import('firebase/firestore');
          const q = query(firestoreCollection(db, 'library_accounts'), where('libraryId', '==', id));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setStudentName(snapshot.docs[0].data().studentName);
          }
        } catch (e) {
          console.error("Failed to fetch student name", e);
        }
      }
      setStep('setup');
      setView('student-dashboard'); // Go directly to dashboard
    } else {
      setStep('setup');
      setView('feedback');
      setShowStartTimeModal(true);
    }
  };

  const handleRoleSelect = (role: 'visitor' | 'staff') => {
    if (role === 'staff') {
      setShowStaffLoginModal(true);
    } else {
      setSelectedRole(role);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Sync user to Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create user record
        const userData: any = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.email === 'toncirafael@gmail.com' ? 'admin' : 'visitor',
          createdAt: serverTimestamp()
        };

        if (staffType) {
          userData.requestedRole = staffType === 'librarian' ? 'admin' : 'caregiver';
        }

        await setDoc(userRef, userData);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [showExitModal, setShowExitModal] = useState(false);
  const [timeOut, setTimeOut] = useState('');

  const handleLogoutClick = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEndTime(now);
    setShowEndTimeModal(true);
  };

  const confirmLogout = async () => {
    // Record the visit session
    if (libraryId || studentName) {
      try {
        await addDoc(collection(db, 'library_visits'), {
          libraryId: libraryId || 'Guest',
          studentName: studentName || 'Guest Explorer',
          startTime,
          endTime,
          date: new Date().toLocaleDateString(),
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Failed to record visit:", error);
      }
    }
    
    setShowEndTimeModal(false);
    handleLogout();
  };

  const handleLogout = () => {
    auth.signOut();
    handleReset();
    setStep('welcome');
    setIsGuest(null);
    setLibraryId('');
    setView('feedback');
    setSelectedRole(null);
    setUserRole(null);
    setAgreedToTerms(false);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
    setShowCamera(false);
  };

  const isAdmin = userRole === 'admin' || user?.email === 'toncirafael@gmail.com';

  const handleAnalyze = async () => {
    if (!file || !previewUrl || !studentName || !gradeLevel || !activityName || !timeIn) return;

    setStep('analyzing');
    setError(null);

    try {
      const feedback = await analyzeActivityFeedback(previewUrl, gradeLevel, studentName);
      setResult(feedback);
      setStep('results');

      // Auto-save to collection if not guest
      if (!isGuest) {
        const newCert: CertificateRecord = {
          id: crypto.randomUUID(),
          studentName,
          activityName,
          gradeLevel,
          result: feedback,
          date: new Date().toLocaleDateString(),
          theme,
          timestamp: Date.now(),
          timeIn,
        };
        setCollectedCertificates(prev => [newCert, ...prev]);

        // Sync with Firestore for staff dashboard
        try {
          // 1. Add to certificates collection
          await addDoc(collection(db, 'certificates'), {
            ...newCert,
            libraryId: libraryId // Track which ID earned it
          });

          // 2. Update user progress summary
          const progressRef = doc(db, 'user_progress', libraryId);
          await setDoc(progressRef, {
            libraryId,
            studentName,
            totalCertificates: increment(1),
            lastActivity: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Firestore sync failed:", error);
        }
      }
      
      // Trigger confetti on success
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#fbbf24', '#ec4899']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#fbbf24', '#ec4899']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

    } catch (err) {
      console.error(err);
      setError('Something went wrong while analyzing the homework. Please try again.');
      setStep('setup');
    }
  };

  const handleSaveToCollection = () => {
    if (!result || !studentName || !activityName || !gradeLevel) return;

    const newCert: CertificateRecord = {
      id: crypto.randomUUID(),
      studentName,
      activityName,
      gradeLevel,
      result,
      date: new Date().toLocaleDateString(),
      theme,
      timestamp: Date.now(),
      timeIn,
    };

    setCollectedCertificates(prev => [newCert, ...prev]);
    alert(t.Msg_SavedToCollection);
  };

  const handleDeleteCertificate = (id: string) => {
    if (confirm(t.Msg_DeleteConfirm)) {
      setCollectedCertificates(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleViewCertificate = (cert: CertificateRecord) => {
    setSelectedCertForView(cert);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    // Temporarily make the certificate visible for capture if it's hidden
    const certElement = certificateRef.current;
    const originalDisplay = certElement.parentElement?.style.display;
    if (certElement.parentElement) {
      certElement.parentElement.classList.remove('hidden');
      certElement.parentElement.style.display = 'block';
      certElement.parentElement.style.position = 'absolute';
      certElement.parentElement.style.top = '-9999px';
    }

    try {
      const canvas = await html2canvas(certElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      } as any);

      const link = document.createElement('a');
      link.download = `${studentName.replace(/\s+/g, '_')}_Certificate.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
      alert(t.Msg_DownloadFailed);
    } finally {
      // Restore hidden state
      if (certElement.parentElement) {
        certElement.parentElement.classList.add('hidden');
        certElement.parentElement.style.display = '';
        certElement.parentElement.style.position = '';
        certElement.parentElement.style.top = '';
      }
    }
  };

  const handleSendToCard = () => {
    setShowSendModal(true);
  };

  const confirmSendToCard = async () => {
    if (!digitalCardId) return;
    setIsSending(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSending(false);
    setShowSendModal(false);
    setDigitalCardId('');
    alert(`${t.Msg_SendSuccess}${digitalCardId}`);
  };

  const handleGlobalBack = () => {
    if (step === 'visitor-entry') {
      setStep('welcome');
      setSelectedRole(null);
    } else if (step === 'staff-selection') {
      setStep('welcome');
      setSelectedRole(null);
      setStaffType(null);
    } else if (step === 'setup') {
      if (!isGuest && libraryId && view === 'feedback') {
        setView('student-dashboard');
      } else if (selectedRole === 'visitor') {
        // Visitors can only exit via the Exit button once they've entered
        return;
      } else {
        setStep('welcome');
        setSelectedRole(null);
        setIsGuest(null);
      }
    } else if (step === 'results') {
      handleReset();
    } else if (view === 'dashboard') {
      if (activeDashboardTab !== 'overview') {
        setActiveDashboardTab('overview');
      }
    } else {
      if (selectedRole === 'visitor') {
        if (view === 'events' || view === 'meeting') {
          if (!isGuest && libraryId) {
            setView('student-dashboard');
          } else {
            // Guests stay on feedback
            setView('feedback');
          }
          return;
        }
        return;
      }
      setView('feedback');
      setStep('welcome');
      setSelectedRole(null);
    }
  };

  const handleReset = () => {
    setStep('setup');
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setTheme('classic');
    setActivityName('');
    // Keep student name for convenience
  };

  const getChatMessage = () => {
    if (view === 'student-dashboard' || (view === 'feedback' && step === 'setup')) {
      return (
        <div className="space-y-3">
          <p className="font-black text-indigo-600 border-b-2 border-indigo-100 pb-2">Welcome to Your Dashboard! 🚀</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><Layout size={16} className="text-indigo-500 mt-0.5 shrink-0" /> <span><b>Feedback:</b> Share your thoughts about books or activities.</span></li>
            <li className="flex items-start gap-2"><Calendar size={16} className="text-pink-500 mt-0.5 shrink-0" /> <span><b>Events:</b> See upcoming library events and join the fun!</span></li>
            <li className="flex items-start gap-2"><Trophy size={16} className="text-yellow-500 mt-0.5 shrink-0" /> <span><b>My Dashboard Adventure:</b> Track your reading progress and certificates.</span></li>
            <li className="flex items-start gap-2"><Users size={16} className="text-emerald-500 mt-0.5 shrink-0" /> <span><b>Meeting:</b> Schedule a time to talk with a librarian.</span></li>
          </ul>
          {view === 'feedback' && step === 'setup' && (
            <p className="text-sm mt-2 font-bold text-slate-700 border-t border-slate-100 pt-2">
              {t.Chat_Form}
            </p>
          )}
        </div>
      );
    }
    if (view !== 'feedback') return null;
    if (step === 'initial-setup') return t.Title_LangTheme;
    if (step === 'welcome') return t.Chat_Welcome;
    if (step === 'visitor-entry') return t.Chat_Identity;
    if (step === 'results') return t.Chat_Success;
    return null;
  };

  const currentChatMessage = getChatMessage();

  const getThemeClasses = () => {
    switch (appTheme) {
      case 'space': return 'bg-gradient-to-b from-indigo-300 via-purple-200 to-blue-300';
      case 'jungle': return 'bg-gradient-to-b from-emerald-300 via-green-200 to-teal-300';
      case 'ocean': return 'bg-gradient-to-b from-cyan-300 via-blue-200 to-sky-300';
      case 'magic': return 'bg-gradient-to-b from-fuchsia-300 via-pink-200 to-rose-300';
      case 'dinosaur': return 'bg-gradient-to-b from-orange-300 via-amber-200 to-yellow-300';
      case 'robot': return 'bg-gradient-to-b from-slate-300 via-zinc-200 to-gray-300';
      case 'fairy': return 'bg-gradient-to-b from-pink-300 via-rose-200 to-fuchsia-300';
      case 'pirate': return 'bg-gradient-to-b from-red-300 via-orange-200 to-amber-300';
      case 'superhero': return 'bg-gradient-to-b from-blue-400 via-indigo-300 to-cyan-400';
      case 'candy': return 'bg-gradient-to-b from-rose-300 via-pink-200 to-purple-300';
      default: return 'bg-gradient-to-b from-indigo-300 via-purple-200 to-blue-300';
    }
  };

  const avatarsList = [
    { id: 'lion', icon: '🦁', name: t.Avatar_Lion, desc: t.Avatar_Lion_Desc, color: 'orange' },
    { id: 'owl', icon: '🦉', name: t.Avatar_Owl, desc: t.Avatar_Owl_Desc, color: 'amber' },
    { id: 'dolphin', icon: '🐬', name: t.Avatar_Dolphin, desc: t.Avatar_Dolphin_Desc, color: 'cyan' },
    { id: 'astronaut', icon: '🧑‍🚀', name: t.Avatar_Astronaut, desc: t.Avatar_Astronaut_Desc, color: 'indigo' },
    { id: 'wizard', icon: '🧙', name: t.Avatar_Wizard, desc: t.Avatar_Wizard_Desc, color: 'fuchsia' },
    { id: 'detective', icon: '🕵️', name: t.Avatar_Detective, desc: t.Avatar_Detective_Desc, color: 'slate' },
    { id: 'robot', icon: '🤖', name: t.Avatar_Robot, desc: t.Avatar_Robot_Desc, color: 'zinc' },
    { id: 'dragon', icon: '🐉', name: t.Avatar_Dragon, desc: t.Avatar_Dragon_Desc, color: 'emerald' },
    { id: 'unicorn', icon: '🦄', name: t.Avatar_Unicorn, desc: t.Avatar_Unicorn_Desc, color: 'pink' },
    { id: 'ninja', icon: '🥷', name: t.Avatar_Ninja, desc: t.Avatar_Ninja_Desc, color: 'stone' }
  ];

  const getSelectedAvatarIcon = () => {
    const avatar = avatarsList.find(a => a.id === selectedAvatar);
    return avatar ? avatar.icon : '👤';
  };

  return (
    <div className={`min-h-screen font-sans text-slate-900 selection:bg-yellow-200 overflow-x-hidden transition-colors duration-1000 ${getThemeClasses()}`}>
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <IntroPortal key="intro-portal" onEnter={() => setHasEntered(true)} />
        ) : (
          <motion.div
            key="main-app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ChatBubble message={currentChatMessage} />
            <ChatBot liveMessages={liveMessages} setLiveMessages={setLiveMessages} userRole={userRole as any} libraryId={libraryId} visitorName={studentName} />
            <EventAnnouncements />

            <div className="print:hidden relative z-10">
        {/* Navbar */}
        <nav className="bg-white/80 backdrop-blur-md border-b-4 border-yellow-400 sticky top-0 z-50">
          <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-center relative`}>
            {selectedRole === 'staff' ? (
              <>
                <div className="absolute left-4 sm:left-6 lg:left-8">
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                    <button 
                      onClick={() => setShowStaffModal(true)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm"
                    >
                      <Users size={18} />
                      {t.Header_StaffMenu}
                    </button>
                  </div>
                </div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 pl-12 sm:pl-0"
                >
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl text-white shadow-lg rotate-3">
                    <Library size={32} />
                  </div>
                  <span className="font-display font-bold text-3xl tracking-tight text-slate-900 hidden sm:block">
                    NPL <span className="text-indigo-600">Feedback</span>
                  </span>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl text-white shadow-lg rotate-3">
                    <Library size={28} />
                  </div>
                  <span className="font-display font-bold text-2xl tracking-tight text-slate-900">
                    NPL <span className="text-indigo-600">Feedback</span>
                  </span>
                </motion.div>

                <div className="flex items-center gap-4">
                  {/* Support System Access Icon removed from global navbar per request */}

                  {selectedRole === 'visitor' && step !== 'visitor-entry' && (
                    <div className="flex flex-wrap justify-center gap-1 bg-white/50 p-1.5 rounded-2xl backdrop-blur-sm border border-white/50 shadow-sm">
                      {isGuest ? (
                        <>
                          <button 
                            onClick={() => setView('feedback')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl font-bold transition-all ${view === 'feedback' ? 'bg-indigo-500 text-white shadow-md' : 'text-indigo-600 hover:bg-indigo-100'}`}
                          >
                            <Layout size={16} />
                            Feedback
                          </button>
                          <button 
                            onClick={() => setView('events')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl font-bold transition-all ${view === 'events' ? 'bg-pink-500 text-white shadow-md' : 'text-pink-600 hover:bg-pink-100'}`}
                          >
                            <Calendar size={16} />
                            Events
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => setView('student-dashboard')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl font-bold transition-all ${view === 'student-dashboard' ? 'bg-amber-500 text-white shadow-md' : 'text-amber-600 hover:bg-amber-100'}`}
                          >
                            <Trophy size={16} />
                            <span className="hidden sm:inline">My Dashboard</span>
                            <span className="sm:hidden">Dashboard</span>
                            {collectedCertificates.length > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${view === 'student-dashboard' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'}`}>
                                {collectedCertificates.length}
                              </span>
                            )}
                          </button>
                          <button 
                            onClick={() => setView('meeting')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-xl font-bold transition-all ${view === 'meeting' ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-600 hover:bg-emerald-100'}`}
                          >
                            <Users size={16} />
                            Meeting
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {selectedRole === 'visitor' && (
                    <div className="flex items-center gap-4">
                      <div className="bg-white/50 px-4 py-2 rounded-2xl flex items-center gap-3 border-2 border-white shadow-sm">
                        <span className="text-2xl">{getSelectedAvatarIcon()}</span>
                        <span className="font-bold text-slate-700 hidden sm:inline">
                          {isGuest ? t.Label_Guest : (user?.displayName || studentName || 'Explorer')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!libraryId && hasEntered && step !== 'splash' && step !== 'initial-setup' && (
              <div className="absolute right-4 sm:right-6 lg:right-8">
                <button 
                  onClick={userRole === 'visitor' ? handleLogoutClick : handleLogout}
                  className="flex items-center p-3 rounded-xl font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all border-2 border-transparent hover:border-red-100"
                  title={t.Btn_Exit}
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <AnimatePresence mode="wait">
            {step === 'splash' ? (
              <PortalIntro 
                key="portal" 
                onComplete={() => {
                  setStep('initial-setup');
                  setSetupPhase('role');
                }} 
                onSkipToLibrarian={() => {
                  setStep('initial-setup');
                  handleRoleSelect('staff');
                }}
              />
            ) : step === 'initial-setup' ? (
              <motion.div
                key="initial-setup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-12 relative"
              >
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <FloatingIcon className="top-10 left-[10%] text-yellow-400 rotate-12"><StarIcon size={48} fill="currentColor" /></FloatingIcon>
                  <FloatingIcon className="top-40 right-[15%] text-pink-400 -rotate-12"><Heart size={40} fill="currentColor" /></FloatingIcon>
                  <FloatingIcon className="bottom-20 left-[20%] text-blue-400 rotate-45"><Rocket size={56} fill="currentColor" /></FloatingIcon>
                  <FloatingIcon className="bottom-40 right-[10%] text-emerald-400 -rotate-45"><Smile size={48} fill="currentColor" /></FloatingIcon>
                  <FloatingIcon className="top-[50%] left-[5%] text-purple-400"><Palette size={40} fill="currentColor" /></FloatingIcon>
                </div>

                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rotate-3 mb-4 relative z-10"
                >
                  <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[3.5rem] -z-10 blur-xl opacity-20 animate-pulse" />
                  <Library size={80} className="text-indigo-600" />
                </motion.div>
                
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl sm:text-7xl font-display font-black text-slate-900 tracking-tight relative z-10 flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-4">
                    <motion.div animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                      <Sparkles className="text-yellow-500" size={48} />
                    </motion.div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      {t.Title_LangTheme}
                    </span>
                    <motion.div animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                      <Sparkles className="text-yellow-500" size={48} />
                    </motion.div>
                  </div>
                  <span className="text-xl sm:text-2xl text-slate-400 font-bold tracking-normal mt-2">
                    {t.Text_AdventureStarted}
                  </span>
                </motion.h1>

                <div className="w-full max-w-5xl relative z-10">
                  <AnimatePresence mode="wait">
                    {setupPhase === 'role' && (
                      <motion.div
                        key="phase-role"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="bg-white/90 backdrop-blur-md p-10 rounded-[4rem] border-8 border-white shadow-[0_30px_60px_rgba(0,0,0,0.15)] space-y-8 relative overflow-hidden"
                      >
                        <div className="absolute -top-10 -right-10 opacity-5 rotate-12 text-indigo-600">
                          <UserCircle size={200} />
                        </div>
                        
                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <button 
                            onClick={() => setSetupPhase('role')} 
                            className="text-slate-400 hover:text-indigo-600 p-4 bg-white rounded-2xl shadow-sm transition-all hover:scale-110"
                          >
                            <ArrowRight size={24} className="rotate-180" />
                          </button>
                          <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{t.Title_WhoAreYou}</h2>
                            <p className="text-slate-500 text-xl font-bold mt-1">{t.Subtitle_WhoAreYou}</p>
                          </div>
                          <div className="w-12"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                          <motion.button
                            whileHover={{ scale: 1.05, y: -10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSetupPhase('theme');
                            }}
                            className="p-10 rounded-[3rem] border-4 border-emerald-100 bg-gradient-to-br from-white to-emerald-50 hover:to-emerald-100 transition-all group text-left space-y-6 shadow-xl relative overflow-hidden"
                          >
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform text-emerald-600">
                              <Users size={120} />
                            </div>
                            <div className="bg-white p-6 rounded-3xl w-fit shadow-lg group-hover:scale-110 transition-transform text-emerald-600 relative z-10">
                              <Users size={56} />
                            </div>
                            <div className="relative z-10">
                              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t.Label_Visitor}</h3>
                              <p className="text-slate-600 font-bold text-lg mt-2 leading-relaxed">{t.Text_VisitorDesc}</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest pt-4 relative z-10">
                              {t.Btn_StartAdventure} <ArrowRight size={18} />
                            </div>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, y: -10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              handleRoleSelect('staff');
                            }}
                            className="p-10 rounded-[3rem] border-4 border-indigo-100 bg-gradient-to-br from-white to-indigo-50 hover:to-indigo-100 transition-all group text-left space-y-6 shadow-xl relative overflow-hidden"
                          >
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform text-indigo-600">
                              <Library size={120} />
                            </div>
                            <div className="bg-white p-6 rounded-3xl w-fit shadow-lg group-hover:scale-110 transition-transform text-indigo-600 relative z-10">
                              <Library size={56} />
                            </div>
                            <div className="relative z-10">
                              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t.Label_StaffMenu}</h3>
                              <p className="text-slate-600 font-bold text-lg mt-2 leading-relaxed">{t.Text_StaffMenuDesc}</p>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest pt-4 relative z-10">
                              {t.Btn_StaffAccess} <ArrowRight size={18} />
                            </div>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {setupPhase === 'theme' && (
                      <motion.div
                        key="phase-theme"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="bg-white/90 backdrop-blur-md p-10 rounded-[4rem] border-8 border-white shadow-[0_30px_60px_rgba(0,0,0,0.15)] space-y-8 relative overflow-hidden"
                      >
                        {/* Decorative background elements */}
                        <div className="absolute -top-10 -right-10 opacity-5 rotate-12 text-indigo-600">
                          <Palette size={200} />
                        </div>
                        <div className="absolute -bottom-10 -left-10 opacity-5 -rotate-12 text-pink-600">
                          <Sparkles size={200} />
                        </div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <button onClick={() => setSetupPhase('role')} className="text-slate-400 hover:text-indigo-600 p-4 bg-white rounded-2xl shadow-sm transition-all hover:scale-110">
                            <ArrowRight size={24} className="rotate-180" />
                          </button>
                          <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{t.Label_ChooseTheme}</h2>
                            <p className="text-slate-500 text-xl font-bold mt-1">{t.Text_TransformAdventure}</p>
                          </div>
                          <div className="w-12"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 relative z-10">
                          {[
                            { id: 'space', label: t.Theme_Space, icon: '🚀', color: 'indigo' },
                            { id: 'jungle', label: t.Theme_Jungle, icon: '🌴', color: 'emerald' },
                            { id: 'ocean', label: t.Theme_Ocean, icon: '🌊', color: 'cyan' },
                            { id: 'magic', label: t.Theme_Magic, icon: '✨', color: 'fuchsia' },
                            { id: 'dinosaur', label: t.Theme_Dinosaur, icon: '🦖', color: 'orange' },
                            { id: 'robot', label: t.Theme_Robot, icon: '🤖', color: 'slate' },
                            { id: 'fairy', label: t.Theme_Fairy, icon: '🧚', color: 'pink' },
                            { id: 'pirate', label: t.Theme_Pirate, icon: '🏴‍☠️', color: 'red' },
                            { id: 'superhero', label: t.Theme_Superhero, icon: '🦸', color: 'blue' },
                            { id: 'candy', label: t.Theme_Candy, icon: '🍬', color: 'rose' }
                          ].map((th) => (
                            <motion.button
                              key={`setup-theme-${th.id}`}
                              whileHover={{ scale: 1.08, y: -8, rotate: [0, -1, 1, 0] }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                setAppTheme(th.id as any);
                                setTimeout(() => setSetupPhase('avatar'), 400);
                              }}
                              className={`group p-8 rounded-[2.5rem] font-black text-lg transition-all border-4 flex flex-col items-center gap-4 shadow-xl relative overflow-hidden ${
                                appTheme === th.id 
                                  ? 'bg-indigo-500 text-white border-white ring-8 ring-indigo-100 shadow-indigo-200' 
                                  : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-100 hover:bg-slate-50'
                              }`}
                            >
                              <span className="text-5xl drop-shadow-md group-hover:scale-125 transition-transform">{th.icon}</span>
                              <span className="text-sm sm:text-base tracking-tight">{th.label}</span>
                              {appTheme === th.id && (
                                <motion.div
                                  layoutId="theme-sparkle"
                                  className="absolute -top-2 -right-2 text-yellow-300"
                                >
                                  <Sparkles size={32} />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {setupPhase === 'avatar' && (
                      <motion.div
                        key="phase-avatar"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="bg-white/90 backdrop-blur-md p-10 rounded-[4rem] border-8 border-white shadow-[0_30px_60px_rgba(0,0,0,0.15)] space-y-8 relative overflow-hidden"
                      >
                        {/* Decorative background elements */}
                        <div className="absolute -top-10 -right-10 opacity-5 rotate-12 text-indigo-600">
                          <UserCircle size={200} />
                        </div>
                        <div className="absolute -bottom-10 -left-10 opacity-5 -rotate-12 text-emerald-600">
                          <Heart size={200} />
                        </div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <button onClick={() => setSetupPhase('theme')} className="text-slate-400 hover:text-indigo-600 p-4 bg-white rounded-2xl shadow-sm transition-all hover:scale-110">
                            <ArrowRight size={24} className="rotate-180" />
                          </button>
                          <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{t.Label_ChooseAvatar}</h2>
                            <p className="text-slate-500 text-xl font-bold mt-1">{t.Text_WhoToday}</p>
                          </div>
                          <div className="w-12"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[45vh] overflow-y-auto p-4 relative z-10 custom-scrollbar">
                          {avatarsList.map((avatar) => (
                            <motion.button
                              key={`setup-avatar-${avatar.id}`}
                              whileHover={{ scale: 1.05, x: 10 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedAvatar(avatar.id)}
                              className={`group p-8 rounded-[2.5rem] text-left transition-all border-4 flex items-start gap-6 shadow-xl relative overflow-hidden ${
                                selectedAvatar === avatar.id 
                                  ? `bg-indigo-500 text-white border-white ring-8 ring-indigo-100 shadow-indigo-200` 
                                  : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-100 hover:bg-slate-50'
                              }`}
                            >
                              <span className="text-7xl drop-shadow-md group-hover:scale-110 transition-transform">{avatar.icon}</span>
                              <div className="relative z-10">
                                <h3 className={`font-black text-2xl tracking-tight ${selectedAvatar === avatar.id ? 'text-white' : `text-${avatar.color}-600`}`}>{avatar.name}</h3>
                                <p className={`text-base font-medium leading-relaxed mt-2 ${selectedAvatar === avatar.id ? 'text-indigo-50' : 'text-slate-500'}`}>{avatar.desc}</p>
                              </div>
                              {selectedAvatar === avatar.id && (
                                <motion.div
                                  layoutId="avatar-sparkle"
                                  className="absolute top-4 right-4 text-yellow-300"
                                >
                                  <Sparkles size={32} />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                        
                        <div className="pt-8 flex justify-center relative z-10">
                          <motion.button
                            whileHover={{ scale: 1.1, y: -5, boxShadow: "0 25px 50px -12px rgba(79, 70, 229, 0.5)" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setStep('welcome')}
                            className="px-20 py-6 text-4xl font-black rounded-[3rem] shadow-[0_15px_0_rgb(49,46,129)] hover:shadow-[0_8px_0_rgb(49,46,129)] active:shadow-none active:translate-y-[8px] transition-all flex items-center gap-6 bg-indigo-600 text-white"
                          >
                            {t.Btn_Continue}
                            <ArrowRight size={32} />
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : step === 'welcome' ? (
              <motion.div
                key="welcome-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-12 relative"
              >
                {/* Decorative floating elements for welcome screen */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <FloatingIcon className="top-10 left-10 text-indigo-400"><Sparkles size={40} /></FloatingIcon>
                  <FloatingIcon className="bottom-20 right-10 text-purple-400"><StarIcon size={32} /></FloatingIcon>
                  <FloatingIcon className="top-1/2 -left-10 text-blue-400"><Heart size={24} /></FloatingIcon>
                </div>

                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [3, 0, 3]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="bg-white p-10 rounded-[4rem] shadow-2xl mb-4 relative z-10"
                >
                  <Library size={100} className="text-indigo-600" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2 bg-indigo-100 p-3 rounded-full text-indigo-600"
                  >
                    <Sparkles size={24} />
                  </motion.div>
                </motion.div>

                <div className="space-y-8 relative z-10">
                  <div className="space-y-4">
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-7xl sm:text-9xl font-display font-black text-slate-900 tracking-tighter"
                    >
                      {t.App_Title.split(' ')[0]} <span className="text-indigo-600">{t.App_Title.split(' ').slice(1).join(' ')}</span>
                    </motion.h1>
                    <p className="text-2xl sm:text-3xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
                      {t.Intro_Tagline}
                    </p>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold border-2 border-red-100 max-w-md mx-auto shadow-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-8">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-4 bg-white/90 backdrop-blur-md p-5 rounded-3xl border-2 border-indigo-100 shadow-xl"
                    >
                      <input 
                        type="checkbox" 
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-8 h-8 rounded-xl border-2 border-indigo-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                      />
                      <label htmlFor="terms" className="text-slate-700 font-black text-xl cursor-pointer select-none">
                        {t.Terms_Check} 📚
                      </label>
                    </motion.div>

                    <motion.button
                      whileHover={agreedToTerms ? { scale: 1.05, y: -5 } : {}}
                      whileTap={agreedToTerms ? { scale: 0.95 } : {}}
                      disabled={!agreedToTerms}
                      onClick={() => {
                        setStep('visitor-entry');
                        setError(null);
                      }}
                      className={`px-16 py-8 text-3xl font-black rounded-[2.5rem] shadow-2xl transition-all flex items-center gap-6 ${
                        agreedToTerms
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-200 hover:shadow-indigo-300' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {t.Btn_Start}
                      <motion.div
                        animate={agreedToTerms ? { x: [0, 5, 0] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight size={40} />
                      </motion.div>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : step === 'visitor-entry' ? (
              <motion.div
                key="visitor-entry"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-6"
              >
                {libraryId && <BackButton onClick={handleGlobalBack} label={t.Btn_Back} />}
                <EntryScreen onSelect={handleEntrySelect} />
              </motion.div>
            ) : view === 'feedback' ? (
              <motion.div
                key="feedback-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative"
              >
                {/* Background for Feedback Dashboard */}
                <div className="fixed inset-0 z-0 opacity-5 pointer-events-none">
                  <img 
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200" 
                    alt="Feedback Background" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {step === 'setup' && (
                  <motion.div 
                    key="setup"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-12"
                  >
                    {libraryId && <BackButton onClick={handleGlobalBack} label={t.Btn_Back} />}
                    <div className="text-center max-w-2xl mx-auto space-y-4 relative z-10">
                      <motion.h1 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-4xl sm:text-6xl font-display font-bold text-slate-900 tracking-tight leading-tight"
                      >
                        {t.Title_Feedback.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">{t.Title_Feedback.split(' ').slice(1).join(' ')}</span>
                      </motion.h1>
                      {!isGuest && (
                        <p className="text-lg text-slate-600 font-bold bg-white/50 backdrop-blur-sm inline-block px-6 py-2 rounded-full border border-white shadow-sm">
                          Welcome back, <span className="text-indigo-600">{studentName || "Explorer"}</span>!
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
                      {/* Left Column: Inputs */}
                      <div className="space-y-8">
                        <div className="kid-card p-8 space-y-6">
                          <label className="block">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">{t.Field_Name}</span>
                            <input
                              type="text"
                              value={studentName}
                              onChange={(e) => setStudentName(e.target.value)}
                              placeholder={t.Placeholder_Name}
                              className="mt-2 block w-full px-6 py-4 rounded-2xl border-4 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-0 outline-none transition-all text-xl font-bold placeholder:text-slate-300"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">{t.Field_Activity}</span>
                            <input
                              type="text"
                              value={activityName}
                              onChange={(e) => setActivityName(e.target.value)}
                              placeholder={t.Placeholder_Activity}
                              className="mt-2 block w-full px-6 py-4 rounded-2xl border-4 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-0 outline-none transition-all text-xl font-bold placeholder:text-slate-300"
                            />
                          </label>
                          
                          <GradeLevelSelector
                            selectedGrade={gradeLevel}
                            onSelect={setGradeLevel}
                          />
                        </div>
                      </div>

                      {/* Right Column: Upload */}
                      <div className="space-y-8">
                        <div className="kid-card p-8">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest ml-1">{t.Label_TakePic}</h3>
                            <button 
                              onClick={() => setShowCamera(true)}
                              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all"
                            >
                              <Camera size={18} />
                              {t.Btn_Scan}
                            </button>
                          </div>
                          
                          {!previewUrl ? (
                            <FileUpload onFileSelect={handleFileSelect} onScanClick={() => setShowCamera(true)} />
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative rounded-[2rem] overflow-hidden border-4 border-indigo-100 group shadow-xl"
                            >
                              <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={() => { setFile(null); setPreviewUrl(null); }}
                                  className="bg-white text-red-600 px-6 py-3 rounded-full font-bold hover:scale-110 transition-transform shadow-xl"
                                >
                                  {t.Btn_RemoveTryAgain}
                                </button>
                              </div>
                            </motion.div>
                          )}
                          <p className="mt-6 text-sm text-slate-500 font-medium text-center bg-slate-50 py-3 rounded-xl">
                            {gradeLevel === 'K-1' && t.Hint_ScanSmile}
                            {gradeLevel === '2-3' && t.Hint_ScanStar}
                            {gradeLevel === '4-6' && t.Hint_ScanReflection}
                            {!gradeLevel && t.Hint_PickGradeFirst}
                          </p>
                        </div>

                        {showCamera && (
                          <CameraScanner 
                            onCapture={handleFileSelect} 
                            onClose={() => setShowCamera(false)} 
                          />
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAnalyze}
                          disabled={!file || !studentName || !gradeLevel || !activityName}
                          className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold text-2xl rounded-[2rem] shadow-[0_12px_24px_-8px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-4 group"
                        >
                          <BookOpen size={28} className="group-hover:rotate-12 transition-transform" />
                          {t.Btn_Submit}
                        </motion.button>
                        
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-red-50 text-red-600 rounded-2xl text-center text-sm font-bold border-2 border-red-100"
                          >
                            {error}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'analyzing' && (
                  <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-10"
                  >
                    <div className="relative">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-indigo-200 rounded-full"
                      ></motion.div>
                      <div className="relative bg-white p-10 rounded-full shadow-2xl border-8 border-indigo-50">
                        <Loader2 size={64} className="text-indigo-600 animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-4xl font-display font-bold text-slate-900">{t.Text_Reading}</h2>
                      <p className="text-xl text-slate-500 font-medium">{t.Text_Reviewing}</p>
                    </div>
                  </motion.div>
                )}

                {step === 'results' && result && (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <BackButton onClick={handleGlobalBack} label={t.Btn_Back} />
                    <FeedbackDisplay
                      result={result}
                      studentName={studentName}
                      activityName={activityName}
                      onPrintCertificate={handlePrint}
                      onDownloadCertificate={handleDownload}
                      onSendCertificate={handleSendToCard}
                      onSaveToCollection={handleSaveToCollection}
                      onReset={handleReset}
                      currentTheme={theme}
                      onThemeChange={setTheme}
                      isGuest={!!isGuest}
                    />
                  </motion.div>
                )}
              </motion.div>
            ) : view === 'dashboard' ? (
              userRole ? (
                <motion.div
                  key="dashboard-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {dashboardTabHistory.length > 1 && userRole !== 'visitor' && (
                    <BackButton 
                      onClick={() => {
                        const newHistory = [...dashboardTabHistory];
                        newHistory.pop();
                        const prevTab = newHistory[newHistory.length - 1];
                        setDashboardTabHistory(newHistory);
                        setActiveDashboardTab(prevTab);
                      }} 
                      label={t.Btn_Back} 
                    />
                  )}
                  <Dashboard 
                    user={user!} 
                    role={userRole} 
                    activeTab={activeDashboardTab}
                    onStartFeedback={() => {
                      setView('feedback');
                      setStep('setup');
                    }}
                    onLogout={userRole === 'visitor' ? handleLogoutClick : handleLogout}
                    onViewCertificate={handleViewCertificate}
                    libraryId={libraryId}
                    studentName={studentName}
                    liveMessages={liveMessages}
                    setLiveMessages={setLiveMessages}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="pending-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6"
                >
                  {libraryId && <BackButton onClick={handleGlobalBack} label={t.Btn_Back} />}
                  <div className="bg-yellow-50 p-10 rounded-[2.5rem] border-8 border-yellow-100 max-w-md shadow-xl">
                    <div className="bg-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <Loader2 size={48} className="text-yellow-600 animate-spin" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 font-display">Account Pending</h2>
                    <p className="text-lg text-slate-600 font-medium leading-relaxed">
                      Your staff account is currently under review. Please contact the librarian for approval.
                    </p>
                  </div>
                </motion.div>
              )
            ) : view === 'events' ? (
              <motion.div
                key="events-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <BackButton onClick={handleGlobalBack} label={t.Btn_Back} />
                <VisitorEvents />
              </motion.div>
            ) : view === 'student-dashboard' ? (
              <motion.div
                key="student-dashboard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
              >
                <StudentDashboard 
                  libraryId={libraryId} 
                  studentName={studentName || "Explorer"} 
                  onStartFeedback={() => {
                    setView('feedback');
                    setStep('setup');
                  }}
                  onLogout={handleLogoutClick}
                />
              </motion.div>
            ) : view === 'meeting' ? (
              <motion.div
                key="meeting-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <BackButton onClick={handleGlobalBack} label={t.Btn_Back} />
                <div className="bg-white rounded-[3rem] p-12 text-center shadow-xl border-4 border-indigo-50 mt-8">
                  <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users size={48} />
                  </div>
                  <h2 className="text-4xl font-black text-slate-800 mb-4">Schedule a Meeting</h2>
                  <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                    Want to talk to a librarian or schedule a reading session? You can request a meeting here!
                  </p>
                  <button className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Request Meeting
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collection-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <BackButton onClick={handleGlobalBack} label={t.Btn_Back} />
                <CollectionGallery 
                  certificates={collectedCertificates} 
                  visits={visitHistory}
                  onDelete={handleDeleteCertificate}
                  onView={handleViewCertificate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* About Modal */}
        <AnimatePresence>
          {showAboutModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowAboutModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-2xl w-full border-b-8 border-indigo-100 overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                      <Info size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">About NPL Feedback</h2>
                  </div>
                  <button onClick={() => setShowAboutModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-8">
                  <div className="bg-indigo-50 p-6 rounded-3xl">
                    <h3 className="text-xl font-bold text-indigo-900 mb-2">Our Mission</h3>
                    <p className="text-indigo-800 font-medium">
                      NPL Feedback is a revolutionary platform designed to bridge the gap between children's library adventures and educational tracking. We use AI to provide meaningful feedback and rewards for every library visit.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-black text-slate-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-yellow-500" />
                        AI Powered
                      </h4>
                      <p className="text-slate-600 text-sm font-medium">
                        Using Gemini AI to analyze student reflections and generate personalized certificates.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-slate-900 flex items-center gap-2">
                        <Trophy size={18} className="text-emerald-500" />
                        Reward System
                      </h4>
                      <p className="text-slate-600 text-sm font-medium">
                        Gamified progress tracking that keeps students excited about visiting the library.
                      </p>
                    </div>
                  </div>

                  <div className="border-t-4 border-slate-50 pt-8">
                    <h4 className="font-black text-slate-900 mb-4">Account Types</h4>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-600"><BookOpen size={20} /></div>
                        <div>
                          <p className="font-bold text-slate-900">Student Account</p>
                          <p className="text-sm text-slate-500 font-medium">Requires a Library ID. Used for recording activities and earning certificates.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-purple-100 p-2 rounded-lg h-fit text-purple-600"><Users size={20} /></div>
                        <div>
                          <p className="font-bold text-slate-900">Staff/Support Account</p>
                          <p className="text-sm text-slate-500 font-medium">For Librarians, Teachers, and Parents to manage and monitor progress.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                    Nashville Public Library • Feedback System v1.1
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Fixed About Button */}
        <button
          onClick={() => setShowAboutModal(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[140] bg-white p-3 rounded-l-2xl shadow-2xl border-y-4 border-l-4 border-indigo-50 text-indigo-600 hover:pr-6 transition-all group"
          title="About This App"
        >
          <div className="flex items-center gap-2">
            <Info size={20} />
            <span className="text-xs font-black uppercase tracking-widest hidden group-hover:inline">About</span>
          </div>
        </button>

        {/* Staff Menu Modal */}
        <AnimatePresence>
          {showStaffModal && (
            <div className="fixed inset-0 z-[100] flex items-start justify-start p-0">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowStaffModal(false)}
              />
              <motion.div 
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative bg-white h-full shadow-2xl w-full max-w-xs overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b-4 border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                      <UserCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Staff Account</h3>
                      <p className="text-[10px] text-slate-500 font-bold truncate max-w-[150px]">{user?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowStaffModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="p-4 flex-1 grid grid-cols-2 gap-3 overflow-y-auto content-start">
                  <button 
                    onClick={() => {
                      handleTabChange('overview');
                      setView('dashboard');
                      setShowStaffModal(false);
                    }}
                    className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-bold text-xs text-center transition-all ${activeDashboardTab === 'overview' && view === 'dashboard' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                  >
                    <TrendingUp size={24} />
                    <span>Overview</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleTabChange('students');
                      setView('dashboard');
                      setShowStaffModal(false);
                    }}
                    className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-bold text-xs text-center transition-all ${activeDashboardTab === 'students' && view === 'dashboard' ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}
                  >
                    <Users size={24} />
                    <span>Students</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleTabChange('accounts');
                      setView('dashboard');
                      setShowStaffModal(false);
                    }}
                    className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-bold text-xs text-center transition-all ${activeDashboardTab === 'accounts' && view === 'dashboard' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                  >
                    <IdCard size={24} />
                    <span>Library IDs</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleTabChange('events');
                      setView('dashboard');
                      setShowStaffModal(false);
                    }}
                    className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-bold text-xs text-center transition-all ${activeDashboardTab === 'events' && view === 'dashboard' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    <Calendar size={24} />
                    <span>Events</span>
                  </button>
                  <button 
                    onClick={() => {
                      handleTabChange('chat');
                      setView('dashboard');
                      setShowStaffModal(false);
                    }}
                    className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-bold text-xs text-center transition-all relative ${activeDashboardTab === 'chat' && view === 'dashboard' ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    <MessageCircle size={24} />
                    <span>Live Chat</span>
                    {liveMessages.filter(m => m.sender === 'visitor').length > 0 && (
                      <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeDashboardTab === 'chat' && view === 'dashboard' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}>
                        {liveMessages.filter(m => m.sender === 'visitor').length}
                      </span>
                    )}
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        handleTabChange('users');
                        setView('dashboard');
                        setShowStaffModal(false);
                      }}
                      className={`w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-bold text-xs text-center transition-all ${activeDashboardTab === 'users' && view === 'dashboard' ? 'bg-purple-500 text-white shadow-md shadow-purple-200' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                    >
                      <Users size={24} />
                      <span>Directory</span>
                    </button>
                  )}
                </div>

                <div className="p-4 border-t-4 border-slate-50">
                  <button 
                    onClick={() => {
                      handleLogout();
                      setShowStaffModal(false);
                    }}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-lg text-red-500 hover:bg-red-50 transition-all"
                  >
                    <LogOut size={24} />
                    Log Out
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}

        {/* Send to Card Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Send to Digital Card</h3>
                <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Enter the student's Digital Card ID to send this certificate directly to their account wallet.
                </p>
                <input
                  type="text"
                  value={digitalCardId}
                  onChange={(e) => setDigitalCardId(e.target.value)}
                  placeholder="e.g. CARD-123-456"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSendToCard}
                  disabled={!digitalCardId || isSending}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  {isSending ? <Loader2 className="animate-spin" size={20} /> : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Support System Modal */}
        <AnimatePresence>
          {showSupportModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowSupportModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-4xl w-full border-b-8 border-indigo-100 overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                      <Users size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900">Support System</h2>
                      <p className="text-slate-500 font-bold">Choose your role to continue</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSupportModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                {!staffType ? (
                  <div className="grid grid-cols-1 gap-6">
                    <button
                      onClick={() => setStaffType('librarian')}
                      className="p-6 rounded-3xl border-4 border-indigo-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all group text-left space-y-4"
                    >
                      <div className="bg-white p-4 rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform text-indigo-600">
                        <Library size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Librarian</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">Manage events and oversee the library system.</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <button 
                        onClick={() => setStaffType(null)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <ArrowLeft size={20} className="text-slate-400" />
                      </button>
                      <h3 className="text-2xl font-black text-slate-900">
                        {staffType === 'librarian' ? 'Librarian Login' : 'Parent / Caregiver Login'}
                      </h3>
                    </div>

                    <button
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="w-full py-4 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          <LogIn size={24} />
                          Login with Google
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* View Certificate Modal */}
        {selectedCertForView && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-5xl w-full p-8 space-y-8 relative">
              <button 
                onClick={() => setSelectedCertForView(null)} 
                className="absolute top-6 right-6 bg-slate-100 p-3 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-bold text-slate-800">{selectedCertForView.activityName}</h3>
                <p className="text-slate-500 font-medium">Completed on {selectedCertForView.date}</p>
              </div>

              <div className="shadow-2xl rounded-[2rem] overflow-hidden border-8 border-white">
                <CertificatePreview
                  studentName={selectedCertForView.studentName}
                  activityName={selectedCertForView.activityName}
                  result={selectedCertForView.result}
                  date={selectedCertForView.date}
                  theme={selectedCertForView.theme}
                />
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => window.print()}
                  className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-2"
                >
                  <Printer size={20} /> Print Certificate
                </button>
                <button 
                  onClick={() => setSelectedCertForView(null)}
                  className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certificate is outside the print:hidden div, but has its own hidden print:block logic */}
      {step === 'results' && result && (
        <Certificate
          ref={certificateRef}
          studentName={studentName}
          activityName={activityName}
          result={result}
          date={new Date().toLocaleDateString()}
          theme={theme}
        />
      )}

      {/* Time Tracking Modals */}
      <AnimatePresence>
        <StartTimeModal 
          isOpen={showStartTimeModal} 
          time={startTime} 
          onConfirm={() => setShowStartTimeModal(false)} 
        />
        <EndTimeModal 
          isOpen={showEndTimeModal} 
          time={endTime} 
          onConfirm={confirmLogout} 
          onCancel={() => setShowEndTimeModal(false)} 
        />
        <StaffLoginModal
          isOpen={showStaffLoginModal}
          onConfirm={() => {
            setShowStaffLoginModal(false);
            setSelectedRole('staff');
            setUserRole('admin');
            setView('dashboard');
            setStep('setup');
          }}
          onCancel={() => setShowStaffLoginModal(false)}
        />
      </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
