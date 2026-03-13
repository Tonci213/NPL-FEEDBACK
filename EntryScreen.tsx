import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IdCard, UserCircle, ArrowRight, Sparkles, BookOpen, Trophy, Info, LogIn, Plus, X, Heart, User, Mail, GraduationCap, CheckCircle2, Rocket } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp, getDocs, query, where } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { NatureBackground } from './NatureBackground';

interface EntryScreenProps {
  onSelect: (isGuest: boolean, libraryId?: string, studentName?: string) => void;
}

export function EntryScreen({ onSelect }: EntryScreenProps) {
  const { t } = useLanguage();
  const [idInput, setIdInput] = useState('');
  const [showIdInput, setShowIdInput] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration Form State
  const [regData, setRegData] = useState({
    studentName: '',
    studentGrade: '',
    parentName: '',
    customId: '',
  });

  const handleLogin = async () => {
    if (!idInput) return;
    
    setIsRegistering(true);
    try {
      const q = query(collection(db, 'library_accounts'), where('libraryId', '==', idInput));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert(t.Error_IDNotFound);
        setIsRegistering(false);
        return;
      }
      
      const studentName = snapshot.docs[0].data().studentName;
      onSelect(false, idInput, studentName);
    } catch (error) {
      console.error("Login validation failed:", error);
      alert(t.Error_VerifyID);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      // Find an available slot (1-100)
      const accountsSnapshot = await getDocs(query(collection(db, 'library_accounts')));
      const claimedSlots = new Set(accountsSnapshot.docs.map(doc => doc.data().slotNumber));
      
      let availableSlot = -1;
      for (let i = 1; i <= 100; i++) {
        if (!claimedSlots.has(i)) {
          availableSlot = i;
          break;
        }
      }

      if (availableSlot === -1) {
        throw new Error(t.Error_AllSlotsClaimed);
      }

      // Generate Library ID
      let generatedId = '';
      if (regData.customId.trim()) {
        const cleanCustom = regData.customId.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        generatedId = `NPL-${cleanCustom}`;
      } else {
        generatedId = `NPL-STUDENT${availableSlot}`;
      }
      
      // Claim the account
      await addDoc(collection(db, 'library_accounts'), {
        slotNumber: availableSlot,
        libraryId: generatedId,
        studentName: regData.studentName,
        caregiverName: regData.parentName,
        grade: regData.studentGrade,
        claimedAt: serverTimestamp()
      });

      // Also create a student record for the dashboard
      await addDoc(collection(db, 'students'), {
        name: regData.studentName,
        grade: regData.studentGrade,
        parentName: regData.parentName,
        libraryId: generatedId,
        registeredAt: serverTimestamp()
      });

      setRegStep(4);
      setIdInput(generatedId);
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <NatureBackground time="day" />
      <div className="max-w-6xl mx-auto py-12 px-4 relative min-h-[600px] z-10">
        <div className="text-center space-y-6 mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block bg-white p-4 rounded-[2rem] shadow-xl mb-4 rotate-3 animate-wiggle"
        >
          <BookOpen size={56} className="text-indigo-500" />
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl sm:text-7xl font-display font-black text-slate-900 tracking-tight text-shadow-md"
        >
          {t.Title_WelcomeNPL.split('NPL')[0]}<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">NPL</span>{t.Title_WelcomeNPL.split('NPL')[1]}
        </motion.h1>
        <p className="text-xl sm:text-2xl text-slate-600 font-bold max-w-2xl mx-auto px-4">
          {t.Subtitle_ChooseStart}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto px-2">
        {/* Option 1: With Library ID */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="kid-card p-8 md:p-12 bg-gradient-to-br from-white to-indigo-50 border-4 border-indigo-100 flex flex-col items-center text-center h-full shadow-2xl rounded-[3rem]"
        >
          <div className="bg-white w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center text-indigo-600 mb-8 shadow-md">
            <IdCard size={40} className="md:w-12 md:h-12" />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">{t.Title_LoginWithID}</h3>
          
          <div className="space-y-8 w-full flex-1 flex flex-col items-center">
            <ul className="space-y-4 text-left w-fit">
              <li className="flex items-center gap-4 text-slate-600 font-bold text-lg md:text-xl">
                <div className="bg-yellow-100 p-2.5 rounded-2xl text-yellow-600 shrink-0"><Sparkles size={22} /></div>
                {t.Benefit_AccessCollection}
              </li>
              <li className="flex items-center gap-4 text-slate-600 font-bold text-lg md:text-xl">
                <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600 shrink-0"><Trophy size={22} /></div>
                {t.Benefit_TrackProgress}
              </li>
              <li className="flex items-center gap-4 text-slate-600 font-bold text-lg md:text-xl">
                <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600 shrink-0"><BookOpen size={22} /></div>
                {t.Benefit_SaveCerts}
              </li>
            </ul>

            <div className="w-full mt-auto pt-8">
              {!showIdInput ? (
                <button
                  onClick={() => setShowIdInput(true)}
                  className="w-full py-5 md:py-6 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black text-xl md:text-2xl rounded-[2rem] shadow-xl shadow-indigo-200 btn-bouncy flex items-center justify-center gap-4"
                >
                  <LogIn size={28} />
                  {t.Btn_LoginNow}
                </button>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 w-full">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_EnterID}</label>
                    <input
                      type="text"
                      value={idInput}
                      onChange={(e) => setIdInput(e.target.value)}
                      placeholder={t.Label_EnterID}
                      className="w-full px-8 py-5 rounded-[2.5rem] border-4 border-indigo-200 focus:border-indigo-400 outline-none font-black text-xl md:text-2xl transition-all text-center shadow-inner"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowIdInput(false)}
                      className="px-8 py-5 bg-white text-slate-500 font-black rounded-[2.5rem] border-4 border-slate-200 hover:bg-slate-50 btn-bouncy"
                    >
                      {t.Btn_Back}
                    </button>
                    <button
                      onClick={handleLogin}
                      disabled={!idInput || isRegistering}
                      className="flex-1 py-5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black text-xl md:text-2xl rounded-[2.5rem] shadow-xl shadow-indigo-200 btn-bouncy disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100"
                    >
                      {isRegistering ? t.Status_Checking : t.Btn_StartRocket}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Option 2: Without Library ID */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="kid-card p-8 md:p-12 bg-gradient-to-br from-slate-50 to-white border-4 border-slate-200 flex flex-col items-center text-center h-full shadow-lg rounded-[3rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full opacity-50 pointer-events-none"></div>
          <div className="bg-white w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center text-slate-400 mb-8 shadow-md relative z-10 animate-float">
            <UserCircle size={40} className="md:w-12 md:h-12" />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight text-shadow-sm relative z-10">{t.Title_GuestMode}</h3>
          
          <div className="space-y-8 w-full flex-1 flex flex-col items-center relative z-10">
            <ul className="space-y-4 text-left w-fit">
              <li className="flex items-center gap-4 text-slate-500 font-bold text-lg md:text-xl">
                <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-400 shrink-0 shadow-sm"><ArrowRight size={22} /></div>
                {t.Benefit_GetCertsToday}
              </li>
              <li className="flex items-center gap-4 text-slate-300 font-bold text-lg md:text-xl opacity-50">
                <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-300 shrink-0 shadow-sm"><X size={22} /></div>
                {t.Benefit_NoTracking}
              </li>
              <li className="flex items-center gap-4 text-slate-300 font-bold text-lg md:text-xl opacity-50">
                <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-300 shrink-0 shadow-sm"><X size={22} /></div>
                {t.Benefit_NoCollection}
              </li>
            </ul>

            <button
              onClick={() => onSelect(true)}
              className="w-full mt-auto py-5 md:py-6 bg-white text-slate-600 border-4 border-slate-200 font-black text-xl md:text-2xl rounded-[2rem] hover:bg-slate-50 hover:border-slate-300 btn-bouncy flex items-center justify-center gap-4 shadow-sm"
            >
              {t.Btn_ContinueGuest}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Register Floating Button - Bottom Right */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button
          whileHover={{ scale: 1.1, rotate: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowRegisterModal(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-pink-300 font-black flex items-center gap-3 btn-bouncy group border-4 border-white"
        >
          <div className="bg-white/20 p-2 rounded-2xl">
            <Plus size={28} className="group-hover:rotate-90 transition-transform" />
          </div>
          <div className="text-left leading-tight pr-2">
            <span className="text-[12px] uppercase tracking-widest block opacity-90 text-pink-100">{t.Btn_NewExplorer}</span>
            <span className="text-xl text-shadow-sm">{t.Btn_GetLibID}</span>
          </div>
        </motion.button>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !isRegistering && setShowRegisterModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-2xl p-8 max-w-xl w-full border-b-8 border-indigo-100"
            >
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>

              <div className="text-center mb-8">
                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                  <IdCard size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-900">{t.Title_IDReg}</h2>
                <p className="text-slate-500 font-bold">{t.Subtitle_IDReg}</p>
              </div>

              {/* Progress Bar */}
              <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={`reg-step-dot-${step}`}
                    className={`h-2 flex-1 rounded-full transition-all ${regStep >= step ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  />
                ))}
              </div>

              {regStep === 1 && (
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center gap-4 mb-6">
                    <div className="bg-pink-50 p-4 rounded-full text-pink-500"><Heart size={32} /></div>
                    <div className="bg-blue-50 p-4 rounded-full text-blue-500"><User size={32} /></div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">{t.Title_TeamUp}</h3>
                  <p className="text-slate-600 font-medium">
                    {t.Text_TeamUp}
                  </p>
                  <button
                    onClick={() => setRegStep(2)}
                    className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-indigo-700 transition-all"
                  >
                    {t.Btn_Ready}
                  </button>
                </div>
              )}

              {regStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                    <GraduationCap className="text-indigo-600" /> {t.Title_StudentInfo}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">{t.Label_StudentName}</label>
                      <input
                        type="text"
                        value={regData.studentName}
                        onChange={(e) => setRegData({...regData, studentName: e.target.value})}
                        placeholder={t.Placeholder_FullName}
                        className="w-full px-6 py-4 rounded-2xl border-4 border-slate-50 focus:border-indigo-400 outline-none font-bold transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">{t.Label_GradeLevel}</label>
                      <select
                        value={regData.studentGrade}
                        onChange={(e) => setRegData({...regData, studentGrade: e.target.value})}
                        className="w-full px-6 py-4 rounded-2xl border-4 border-slate-50 focus:border-indigo-400 outline-none font-bold transition-all appearance-none bg-white"
                      >
                        <option value="">{t.Placeholder_SelectGrade}</option>
                        {['K', '1', '2', '3', '4', '5', '6'].map(g => (
                          <option key={`grade-opt-${g}`} value={g}>{t.Label_GradeLevel} {g}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setRegStep(1)}
                      className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      {t.Btn_Back}
                    </button>
                    <button
                      disabled={!regData.studentName || !regData.studentGrade}
                      onClick={() => setRegStep(3)}
                      className="flex-1 py-4 bg-indigo-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {t.Btn_NextStep}
                    </button>
                  </div>
                </div>
              )}

              {regStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Heart className="text-pink-500" /> {t.Title_CaregiverInfo}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">{t.Label_CaregiverName}</label>
                      <input
                        type="text"
                        value={regData.parentName}
                        onChange={(e) => setRegData({...regData, parentName: e.target.value})}
                        placeholder={t.Placeholder_FullName}
                        className="w-full px-6 py-4 rounded-2xl border-4 border-slate-50 focus:border-indigo-400 outline-none font-bold transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">{t.Label_CustomID}</label>
                      <div className="flex items-center">
                        <span className="px-4 py-4 bg-slate-100 text-slate-500 font-bold rounded-l-2xl border-y-4 border-l-4 border-slate-50">NPL-</span>
                        <input
                          type="text"
                          value={regData.customId}
                          onChange={(e) => setRegData({...regData, customId: e.target.value})}
                          placeholder={t.Placeholder_CustomID}
                          className="w-full px-6 py-4 rounded-r-2xl border-4 border-slate-50 focus:border-indigo-400 outline-none font-bold transition-all uppercase"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2 ml-1">{t.Hint_CustomID}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setRegStep(2)}
                      className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      {t.Btn_Back}
                    </button>
                    <motion.button
                      id="complete-registration-btn"
                      disabled={!regData.parentName || isRegistering}
                      onClick={handleRegister}
                      animate={(!regData.parentName || isRegistering) ? {} : { scale: [1, 1.02, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xl rounded-2xl shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isRegistering ? (
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 size={24} />
                      )}
                      {isRegistering ? t.Status_Registering : t.Btn_CompleteReg}
                    </motion.button>
                  </div>
                </div>
              )}

              {regStep === 4 && (
                <div className="space-y-6 text-center py-4">
                  <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{t.Title_Success}</h3>
                  <p className="text-slate-600 font-medium">
                    {t.Text_Success.replace('{name}', regData.studentName)}
                  </p>
                  <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-dashed border-indigo-200 relative group">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-2">{t.Label_YourLibID}</span>
                    <span className="text-4xl font-black text-indigo-600 tracking-wider select-all">{idInput}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(idInput);
                        alert("ID Copied!");
                      }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-xl shadow-sm text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy ID"
                    >
                      <Mail size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setShowRegisterModal(false);
                        onSelect(false, idInput, regData.studentName);
                      }}
                      className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xl rounded-2xl shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 btn-bouncy"
                    >
                      <Rocket size={24} />
                      {t.Btn_EnterDashboard}
                    </button>
                    <button
                      onClick={() => {
                        setShowRegisterModal(false);
                        setShowIdInput(true);
                        setRegStep(1);
                      }}
                      className="w-full py-4 bg-white text-slate-500 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all"
                    >
                      {t.Btn_BackToLogin}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
