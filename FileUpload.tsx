import React, { useCallback } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onScanClick?: () => void;
}

export function FileUpload({ onFileSelect, onScanClick }: FileUploadProps) {
  const { t } = useLanguage();
  
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="space-y-6">
      <motion.div
        whileHover={{ scale: 1.01 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full max-w-2xl mx-auto p-10 border-4 border-dashed border-indigo-200 rounded-[2rem] bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer group text-center relative overflow-hidden"
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-6">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 bg-white text-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform rotate-3"
          >
            <ImageIcon size={40} />
          </motion.div>
          <div>
            <h3 className="text-2xl font-display font-bold text-indigo-900">{t.Btn_Upload}</h3>
            <p className="text-indigo-600 font-medium mt-2">Drag it here or click to pick! 📸</p>
          </div>
        </label>
      </motion.div>

      {onScanClick && (
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onScanClick}
          className="w-full py-5 bg-white border-4 border-indigo-600 text-indigo-600 font-bold text-xl rounded-[2rem] shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-3"
        >
          <Camera size={28} />
          {t.Btn_Scan}
        </motion.button>
      )}
    </div>
  );
}
