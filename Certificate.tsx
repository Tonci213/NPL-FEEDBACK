import React, { useRef, useEffect, useState } from 'react';
import { FeedbackResult } from '../services/gemini';
import { Star, Award, Medal, Crown, Rocket, Heart, Sparkles, Trophy, BookOpen } from 'lucide-react';

export type CertificateTheme = 'classic' | 'space' | 'nature' | 'magic';

interface CertificateProps {
  studentName: string;
  activityName: string;
  result: FeedbackResult;
  date: string;
  theme: CertificateTheme;
}

const THEME_STYLES = {
  classic: {
    wrapper: 'bg-[#ffffff]',
    border: 'border-[#4f46e5]',
    text: 'text-[#1e293b]',
    accent: 'text-[#4f46e5]',
    accentBg: 'bg-[#4f46e5]',
    secondary: 'border-[#a5b4fc]',
    icon: Trophy,
    pattern: 'bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03]',
    decorative: 'text-[#c7d2fe]',
    background: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=1100&h=778',
  },
  space: {
    wrapper: 'bg-[#0f172a]',
    border: 'border-[#60a5fa]',
    text: 'text-[#ffffff]',
    accent: 'text-[#60a5fa]',
    accentBg: 'bg-[#3b82f6]',
    secondary: 'border-[#1d4ed8]',
    icon: Rocket,
    pattern: 'bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:30px_30px] opacity-[0.1]',
    decorative: 'text-[#1e40af]',
    background: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1100&h=778',
  },
  nature: {
    wrapper: 'bg-[#f0fdf4]',
    border: 'border-[#059669]',
    text: 'text-[#064e3b]',
    accent: 'text-[#059669]',
    accentBg: 'bg-[#059669]',
    secondary: 'border-[#6ee7b7]',
    icon: Heart,
    pattern: 'bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05]',
    decorative: 'text-[#a7f3d0]',
    background: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=1100&h=778',
  },
  magic: {
    wrapper: 'bg-[#faf5ff]',
    border: 'border-[#9333ea]',
    text: 'text-[#581c87]',
    accent: 'text-[#9333ea]',
    accentBg: 'bg-[#9333ea]',
    secondary: 'border-[#d8b4fe]',
    icon: Sparkles,
    pattern: 'bg-[radial-gradient(#9333ea_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05]',
    decorative: 'text-[#e9d5ff]',
    background: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1100&h=778',
  },
};

// Internal content component
const CertificateContent = React.forwardRef<HTMLDivElement, CertificateProps & { id?: string, keyPrefix?: string }>(
  ({ studentName, activityName, result, date, theme, id, keyPrefix = 'cert' }, ref) => {
    const styles = THEME_STYLES[theme];
    const Icon = styles.icon;

    return (
      <div 
        ref={ref}
        id={id}
        className={`relative w-[1100px] h-[778px] flex flex-col items-center justify-center p-16 overflow-hidden ${styles.wrapper}`}
      >
        {/* Background Image */}
        {(styles as any).background && (
          <div className="absolute inset-0 z-0">
            <img 
              src={(styles as any).background} 
              alt="Background" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/20"></div>
          </div>
        )}

        {/* Background Pattern */}
        <div className={`absolute inset-0 pointer-events-none ${styles.pattern}`} />

        {/* Decorative Corner Elements */}
        <div className="absolute top-0 left-0 w-40 h-40 border-t-[20px] border-l-[20px] rounded-tl-[3rem] opacity-20 pointer-events-none border-current" style={{ color: 'currentColor' }} />
        <div className="absolute top-0 right-0 w-40 h-40 border-t-[20px] border-r-[20px] rounded-tr-[3rem] opacity-20 pointer-events-none border-current" style={{ color: 'currentColor' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 border-b-[20px] border-l-[20px] rounded-bl-[3rem] opacity-20 pointer-events-none border-current" style={{ color: 'currentColor' }} />
        <div className="absolute bottom-0 right-0 w-40 h-40 border-b-[20px] border-r-[20px] rounded-br-[3rem] opacity-20 pointer-events-none border-current" style={{ color: 'currentColor' }} />

        {/* Main Border Frame */}
        <div className={`absolute inset-8 border-[12px] rounded-[3rem] pointer-events-none ${styles.border}`} />
        
        {/* Inner Border Frame */}
        <div className={`absolute inset-12 border-2 border-dashed rounded-[2.5rem] opacity-30 pointer-events-none ${styles.border}`} />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl">
          
          {/* Header Icon */}
          <div className="mb-8 relative">
            <div className={`absolute inset-0 blur-2xl opacity-30 ${styles.accentBg}`} />
            <div className={`${styles.accentBg} p-6 rounded-[2rem] shadow-xl transform -rotate-3 animate-float`}>
              <Icon size={64} className="text-white" />
            </div>
            <div className="absolute -top-4 -right-4 text-yellow-400 animate-wiggle">
              <Star size={40} fill="currentColor" />
            </div>
          </div>

          {/* Title */}
          <h1 className={`font-display text-7xl font-black uppercase tracking-widest mb-4 ${styles.accent} text-shadow-sm`}>
            Library Star Award
          </h1>
          
          <p className={`text-xl font-bold tracking-[0.2em] opacity-60 mb-10 ${styles.text}`}>
            PROUDLY PRESENTED TO
          </p>

          {/* Student Name */}
          <div className="relative mb-8 w-full">
            <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-2 ${styles.accentBg} opacity-20 rounded-full`} />
            <h2 className={`font-display text-[5.5rem] leading-none ${styles.text} font-black drop-shadow-md z-10 relative`}>
              {studentName}
            </h2>
          </div>

          <p className={`text-xl font-bold tracking-[0.2em] opacity-60 mb-6 ${styles.text}`}>
            FOR COMPLETING THE ACTIVITY
          </p>

          {/* Activity Name */}
          <h3 className={`font-sans text-5xl font-black mb-8 ${styles.accent} max-w-3xl leading-tight drop-shadow-sm`}>
            {activityName}
          </h3>

          {/* Encouragement Message */}
          <div className={`bg-white/20 backdrop-blur-md p-8 rounded-[2.5rem] border-4 border-current/10 mb-10 max-w-2xl ${styles.text} shadow-inner`}>
            <p className="text-2xl font-bold leading-relaxed">
              "For being a <span className="font-black underline decoration-wavy decoration-yellow-400">{result.encouragement}</span> and sharing amazing feedback at the Nashville Public Library!"
            </p>
          </div>

          {/* Footer Section */}
          <div className={`w-full flex items-end justify-between px-12 mt-4 ${styles.text}`}>
            
            {/* Date */}
            <div className="text-left">
              <div className={`w-48 border-b-4 ${styles.secondary} mb-2`} />
              <p className="font-bold text-lg opacity-70 uppercase tracking-wider">Date: {date}</p>
            </div>

            {/* Seal/Badge */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={`${keyPrefix}-official-star-${i}`} 
                    size={28} 
                    className={i < result.stars ? "text-yellow-400 fill-yellow-400" : "text-slate-300"} 
                  />
                ))}
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Official NPL Record</span>
            </div>

            {/* Signature */}
            <div className="text-right">
              <div className={`w-48 border-b-4 ${styles.secondary} mb-2 font-handwriting text-3xl`} style={{ fontFamily: "'Pinyon Script', cursive" }}>
                Librarian
              </div>
              <p className="font-bold text-lg opacity-70 uppercase tracking-wider">Signature</p>
            </div>
          </div>
        </div>

        {/* Bottom Branding */}
        <div className={`absolute bottom-10 left-0 right-0 text-center text-sm font-bold uppercase tracking-[0.3em] opacity-40 ${styles.text}`}>
          Nashville Public Library • Building a Community of Readers
        </div>
      </div>
    );
  }
);

// The hidden print version
export const Certificate = React.forwardRef<HTMLDivElement, CertificateProps>(
  (props, ref) => {
    return (
      <div className="hidden print:block fixed inset-0 z-[9999] p-0 m-0" style={{ backgroundColor: '#ffffff' }}>
        <CertificateContent ref={ref} id="certificate-download-area" keyPrefix={`print-${props.studentName}`} {...props} />
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';

// The visible preview version
export const CertificatePreview = (props: CertificateProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const targetWidth = 1100;
        const targetHeight = 778;
        
        // Calculate scale to fit within the container
        const scaleX = containerWidth / targetWidth;
        const scaleY = containerHeight / targetHeight;
        
        // Use the smaller scale to ensure it fits completely
        const newScale = Math.min(scaleX, scaleY);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full overflow-hidden bg-slate-50 rounded-[2.5rem] border-8 border-white shadow-inner flex items-center justify-center"
      style={{ aspectRatio: '1100 / 778' }}
    >
      <div 
        style={{ 
          width: '1100px', 
          height: '778px',
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          flexShrink: 0
        }}
      >
        <CertificateContent keyPrefix={`preview-${props.studentName}`} {...props} />
      </div>
    </div>
  );
};
