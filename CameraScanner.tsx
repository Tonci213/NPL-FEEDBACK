import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface CameraScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraScanner({ onCapture, onClose }: CameraScannerProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      let mediaStream;
      try {
        // First try with the preferred facing mode
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facingMode } 
        });
      } catch (err) {
        console.warn(`Failed to access camera with facingMode: ${facingMode}, trying fallback...`, err);
        // Fallback to any available video device
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(t.Error_Camera);
    }
  }, [facingMode, t]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  React.useEffect(() => {
    startCamera();
  }, [startCamera]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "scanned_homework.jpg", { type: "image/jpeg" });
          onCapture(file);
        });
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-4 sm:p-8"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-slate-800"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={28} />
        </button>

        <div className="aspect-[3/4] relative bg-black flex items-center justify-center">
          {error ? (
            <div className="text-white text-center p-10">
              <p className="text-2xl font-display font-bold text-red-400 mb-6">{error}</p>
              <button 
                onClick={startCamera}
                className="px-8 py-4 bg-indigo-600 rounded-2xl font-bold text-xl shadow-lg shadow-indigo-500/20"
              >
                {t.Btn_TryAgain}
              </button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-white/20 pointer-events-none m-8 rounded-[2rem] border-dashed"></div>
              
              <button 
                onClick={toggleCamera}
                className="absolute top-6 left-6 z-10 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                title="Switch Camera"
              >
                <RefreshCw size={28} />
              </button>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-8 flex items-center justify-center gap-10 bg-slate-900">
          {!capturedImage ? (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={capturePhoto}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] group btn-bouncy"
            >
              <div className="w-20 h-20 border-8 border-slate-900 rounded-full flex items-center justify-center">
                <Camera size={40} className="text-slate-900 group-hover:animate-wiggle" />
              </div>
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={retake}
                className="flex flex-col items-center gap-3 text-white group"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg btn-bouncy">
                  <RefreshCw size={32} className="group-hover:animate-spin" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">{t.Label_Retake}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={confirmCapture}
                className="flex flex-col items-center gap-3 text-white group"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/20 btn-bouncy">
                  <Check size={48} strokeWidth={3} className="group-hover:animate-wiggle" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">{t.Label_Perfect}</span>
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-white mt-8 text-xl font-display font-black flex items-center gap-2 text-center drop-shadow-md"
      >
        <Sparkles size={28} className="text-yellow-400 animate-wiggle" />
        {t.Label_CenterFrame}
        <Sparkles size={28} className="text-yellow-400 animate-wiggle" />
      </motion.div>
    </motion.div>
  );
}
