import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Award, Calendar, Search, TrendingUp, BookOpen, ChevronRight, Star, Plus, Image, Trash2, X, GraduationCap, Heart, CheckCircle2, Loader2, UserCircle, IdCard, Pencil, Upload, Sparkles, ArrowRight, MessageSquare, LogOut } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, Timestamp, doc, setDoc, getDocs, where, addDoc, deleteDoc } from '../firebase';
import { createUser, createStudent } from '../services/userService';
import { useLanguage } from '../contexts/LanguageContext';
import Papa from 'papaparse';

interface LibraryEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  posterUrl: string; // Base64 string
  createdAt: any;
}

interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'visitor' | 'caregiver';
  requestedRole?: 'admin' | 'caregiver';
  subject?: string;
  grade?: string;
  createdAt: any;
}

interface UserProgress {
  id: string;
  libraryId: string;
  totalCertificates: number;
  lastActivity: any;
  studentName: string;
}

interface CertificateRecord {
  id: string;
  studentName: string;
  activityName: string;
  date: string;
  timestamp: number;
}

interface Visit {
  id: string;
  studentName: string;
  startTime: any;
  endTime?: any;
  activities?: string[];
  completed: boolean;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  parentName: string;
  parentEmail: string;
  libraryId: string;
  registeredAt: any;
}

interface LibraryAccount {
  id: string;
  slotNumber: number;
  libraryId: string;
  studentName: string;
  caregiverName: string;
  grade: string;
  claimedAt: any;
}

interface StaffDashboardProps {
  activeTab: 'overview' | 'users' | 'events' | 'visits' | 'students' | 'accounts' | 'chat';
  userRole: 'admin' | 'visitor' | 'caregiver' | null;
  liveMessages?: any[];
  setLiveMessages?: any;
  onLogout: () => void;
}

export function StaffDashboard({ activeTab, userRole, liveMessages, setLiveMessages, onLogout }: StaffDashboardProps) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [recentCerts, setRecentCerts] = useState<CertificateRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [libraryAccounts, setLibraryAccounts] = useState<LibraryAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'caregiver' | 'visitor'>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'event' | 'user' | 'student' | 'account' } | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [guideStep, setGuideStep] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const guideMessages = [
    t.Staff_WelcomeMsg,
    t.Staff_MonitorMsg,
    t.Staff_ManageMsg
  ];
  
  // Event Form State
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '', posterUrl: '' });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Edit Event State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventData, setEditEventData] = useState({ title: '', date: '', description: '', posterUrl: '' });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Add User Form State
  const [selectedDirectoryRole, setSelectedDirectoryRole] = useState<'student' | 'caregiver' | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('K');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newLibraryId, setNewLibraryId] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  useEffect(() => {
    // Listen to all user progress
    const qProgress = query(collection(db, 'user_progress'), orderBy('lastActivity', 'desc'));
    const unsubProgress = onSnapshot(qProgress, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProgress[];
      setProgress(data);
      setLoading(false);
    });

    // Listen to recent certificates
    const qCerts = query(collection(db, 'certificates'), orderBy('timestamp', 'desc'));
    const unsubCerts = onSnapshot(qCerts, (snapshot) => {
      const data = snapshot.docs.slice(0, 10).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CertificateRecord[];
      setRecentCerts(data);
    });

    // Listen to all users
    const qUsers = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(data);
    });

    // Listen to all events
    const qEvents = query(collection(db, 'library_events'), orderBy('createdAt', 'desc'));
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryEvent[];
      setEvents(data);
    });

    // Listen to library visits
    const qVisits = query(collection(db, 'library_visits'), orderBy('startTime', 'desc'));
    const unsubVisits = onSnapshot(qVisits, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Visit[];
      setVisits(data);
    });

    // Listen to registered students
    const qStudents = query(collection(db, 'students'), orderBy('registeredAt', 'desc'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(data);
    });

    // Listen to library accounts
    const qAccounts = query(collection(db, 'library_accounts'), orderBy('slotNumber', 'asc'));
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryAccount[];
      setLibraryAccounts(data);
    });

    return () => {
      unsubProgress();
      unsubCerts();
      unsubUsers();
      unsubEvents();
      unsubVisits();
      unsubStudents();
      unsubAccounts();
    };
  }, []);

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'visitor' | 'caregiver') => {
    setUpdatingRole(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { role: newRole, requestedRole: null }, { merge: true });
    } catch (error) {
      console.error("Failed to update role:", error);
      setDashboardError(t.Error_UpdateRole);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDenyRole = async (userId: string) => {
    setUpdatingRole(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { requestedRole: null }, { merge: true });
    } catch (error) {
      console.error("Failed to deny role:", error);
      setDashboardError(t.Error_DenyRole);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1073741824) { // 1GB limit
        alert("Image is too large! Please choose an image under 1GB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditEventData(prev => ({ ...prev, posterUrl: reader.result as string }));
        } else {
          setNewEvent(prev => ({ ...prev, posterUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.posterUrl) {
      setDashboardError(t.Error_FillFields);
      return;
    }

    setIsSubmittingEvent(true);
    try {
      await addDoc(collection(db, 'library_events'), {
        ...newEvent,
        createdAt: Timestamp.now()
      });
      setNewEvent({ title: '', date: '', description: '', posterUrl: '' });
      setIsAddingEvent(false);
    } catch (error) {
      console.error("Error adding event:", error);
      setDashboardError(t.Error_PostEvent);
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleEditEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId || !editEventData.title || !editEventData.date || !editEventData.posterUrl) {
      setDashboardError(t.Error_FillFields);
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const eventRef = doc(db, 'library_events', editingEventId);
      await setDoc(eventRef, {
        title: editEventData.title,
        date: editEventData.date,
        description: editEventData.description,
        posterUrl: editEventData.posterUrl
      }, { merge: true });
      setEditingEventId(null);
    } catch (error) {
      console.error("Error editing event:", error);
      setDashboardError(t.Error_UpdateEvent);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'library_events', eventId));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      setDashboardError(t.Error_DeleteEvent);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      setDashboardError(t.Error_DeleteUser);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (student && student.libraryId) {
        const qAccounts = query(collection(db, 'library_accounts'), where('libraryId', '==', student.libraryId));
        const accountsSnap = await getDocs(qAccounts);
        const deleteAccounts = accountsSnap.docs.map(docSnap => deleteDoc(doc(db, 'library_accounts', docSnap.id)));
        
        const deleteProgress = deleteDoc(doc(db, 'user_progress', student.libraryId));
        
        const qCerts = query(collection(db, 'certificates'), where('libraryId', '==', student.libraryId));
        const certsSnap = await getDocs(qCerts);
        const deleteCerts = certsSnap.docs.map(docSnap => deleteDoc(doc(db, 'certificates', docSnap.id)));
        
        const qVisits = query(collection(db, 'library_visits'), where('libraryId', '==', student.libraryId));
        const visitsSnap = await getDocs(qVisits);
        const deleteVisits = visitsSnap.docs.map(docSnap => deleteDoc(doc(db, 'library_visits', docSnap.id)));

        await Promise.all([
          ...deleteAccounts,
          deleteProgress,
          ...deleteCerts,
          ...deleteVisits
        ]);
      }
      await deleteDoc(doc(db, 'students', studentId));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      setDashboardError(t.Error_DeleteStudent);
    }
  };

  const handleDeleteLibraryAccount = async (accountId: string) => {
    try {
      const account = libraryAccounts.find(a => a.id === accountId);
      if (account && account.libraryId) {
        const qStudents = query(collection(db, 'students'), where('libraryId', '==', account.libraryId));
        const studentsSnap = await getDocs(qStudents);
        const deleteStudents = studentsSnap.docs.map(docSnap => deleteDoc(doc(db, 'students', docSnap.id)));
        
        const deleteProgress = deleteDoc(doc(db, 'user_progress', account.libraryId));
        
        const qCerts = query(collection(db, 'certificates'), where('libraryId', '==', account.libraryId));
        const certsSnap = await getDocs(qCerts);
        const deleteCerts = certsSnap.docs.map(docSnap => deleteDoc(doc(db, 'certificates', docSnap.id)));
        
        const qVisits = query(collection(db, 'library_visits'), where('libraryId', '==', account.libraryId));
        const visitsSnap = await getDocs(qVisits);
        const deleteVisits = visitsSnap.docs.map(docSnap => deleteDoc(doc(db, 'library_visits', docSnap.id)));

        await Promise.all([
          ...deleteStudents,
          deleteProgress,
          ...deleteCerts,
          ...deleteVisits
        ]);
      }
      await deleteDoc(doc(db, 'library_accounts', accountId));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting library account:", error);
      setDashboardError(t.Error_DeleteAccount);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    try {
      if (selectedDirectoryRole === 'student') {
        await createStudent(newName, newGrade, newParentEmail, newLibraryId);
      } else if (selectedDirectoryRole === 'caregiver') {
        await createUser(newEmail, 'caregiver', newName);
      }
      setIsAddingUser(false);
      setNewEmail('');
      setNewName('');
      setNewGrade('K');
      setNewParentEmail('');
      setNewLibraryId('');
    } catch (error) {
      console.error('Error adding user/student:', error);
      setDashboardError(t.Error_AddUser);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCsv(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          for (const row of rows) {
            const action = (row.action || 'add').toLowerCase();
            
            const studentName = row.studentName || row.name;
            const parentEmail = row.parentEmail || row.email;
            const parentName = row.parentName || row.caregiverName;
            const libraryId = row.libraryId;
            const grade = row.grade || 'K';

            if (action === 'remove') {
              if (studentName || libraryId) {
                const student = students.find(s => 
                  (libraryId && s.libraryId === libraryId) || 
                  (studentName && s.name === studentName)
                );
                if (student) {
                  await deleteDoc(doc(db, 'students', student.id));
                }
              }
              if (parentEmail) {
                await deleteDoc(doc(db, 'users', parentEmail));
              }
            } else {
              if (studentName) {
                await createStudent(studentName, grade, parentEmail, libraryId);
              }
              if (parentEmail && parentName) {
                await createUser(parentEmail, 'caregiver', parentName);
              }
            }
          }
          setDashboardError(null);
          alert(t.Success_CSV);
        } catch (error) {
          console.error('Error processing CSV:', error);
          setDashboardError(t.Error_CSV);
        } finally {
          setIsUploadingCsv(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('CSV Parse Error:', error);
        setDashboardError(t.Error_CSVParse);
        setIsUploadingCsv(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const filteredProgress = progress.filter(p => 
    p.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.libraryId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.uid?.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = selectedDirectoryRole ? u.role === selectedDirectoryRole : (roleFilter === 'all' || u.role === roleFilter);
    return matchesSearch && matchesRole;
  });

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.libraryId?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.parentName?.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const totalCerts = progress.reduce((acc, curr) => acc + curr.totalCertificates, 0);
  const activeKids = progress.length;

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8 space-y-6 md:space-y-8">
      {/* Interactive Guide Bubble */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-4 md:p-6 shadow-lg border-2 border-indigo-100 flex items-start gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Sparkles size={80} />
        </div>
        <div className="bg-indigo-600 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
          <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{t.Staff_Assistant}</span>
            <div className="flex gap-1">
              {guideMessages.map((_, i) => (
                <div key={`staff-guide-dot-${i}-${guideMessages.length}`} className={`w-2 h-2 rounded-full ${i === guideStep ? 'bg-indigo-600' : 'bg-indigo-100'}`} />
              ))}
            </div>
          </div>
          <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
            {guideMessages[guideStep]}
          </p>
          <button 
            onClick={() => setGuideStep((prev) => (prev + 1) % guideMessages.length)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            {t.Staff_NextTip} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {dashboardError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold border-2 border-red-100 flex items-center justify-between"
        >
          <span>{dashboardError}</span>
          <button onClick={() => setDashboardError(null)} className="p-1 hover:bg-red-100 rounded-lg">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {activeTab === 'overview' ? (
        <div className="space-y-10">
          {/* Header Stats */}
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-black text-slate-900">{t.Staff_Dashboard}</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative overflow-hidden bg-white p-8 rounded-[3rem] shadow-2xl border-b-8 border-indigo-500/20 group hover:shadow-indigo-100/50 transition-all btn-bouncy"
            >
              <div className="absolute -right-4 -top-4 text-indigo-50 opacity-50 group-hover:scale-110 transition-transform animate-wiggle">
                <Users size={120} />
              </div>
              <div className="relative flex items-center gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-200 animate-float">
                  <Users size={32} />
                </div>
                <div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">{t.Label_ActiveExplorers}</p>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tight">{activeKids}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden bg-white p-8 rounded-[3rem] shadow-2xl border-b-8 border-yellow-500/20 group hover:shadow-yellow-100/50 transition-all btn-bouncy"
            >
              <div className="absolute -right-4 -top-4 text-yellow-50 opacity-50 group-hover:scale-110 transition-transform animate-wiggle">
                <Award size={120} />
              </div>
              <div className="relative flex items-center gap-6">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-5 rounded-3xl text-white shadow-lg shadow-yellow-200 animate-float" style={{ animationDelay: '0.5s' }}>
                  <Award size={32} />
                </div>
                <div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">{t.Label_TotalAwards}</p>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tight">{totalCerts}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden bg-white p-8 rounded-[3rem] shadow-2xl border-b-8 border-emerald-500/20 group hover:shadow-emerald-100/50 transition-all btn-bouncy"
            >
              <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform animate-wiggle">
                <TrendingUp size={120} />
              </div>
              <div className="relative flex items-center gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-3xl text-white shadow-lg shadow-emerald-200 animate-float" style={{ animationDelay: '1s' }}>
                  <TrendingUp size={32} />
                </div>
                <div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-1">{t.Label_AvgProgress}</p>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tight">
                    {activeKids > 0 ? (totalCerts / activeKids).toFixed(1) : 0}
                  </h3>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Progress Table */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <Star className="text-yellow-400" fill="currentColor" />
                    Explorer Progress
                  </h2>
                  <p className="text-slate-500 font-bold text-sm">{t.Text_RealTimeTracking}</p>
                </div>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    type="text"
                    placeholder="Search explorers..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-14 pr-8 py-4 bg-white rounded-[2rem] border-4 border-transparent focus:border-indigo-100 outline-none shadow-xl shadow-slate-200/50 font-bold transition-all w-full sm:w-72"
                  />
                </div>
              </div>

              <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border-b-8 border-slate-50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b-2 border-slate-50">
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.Header_Explorer}</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.Header_LibraryID}</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.Header_Achievements}</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t.Header_LastVisit}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredProgress.map((p) => (
                        <tr key={`progress-row-${p.id}`} className="hover:bg-indigo-50/30 transition-all group cursor-default">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl shadow-sm group-hover:scale-110 transition-transform">
                                {p.studentName?.charAt(0) || '?'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 text-lg">{p.studentName || 'Unknown'}</span>
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{t.Label_RoleStudent}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <span className="font-mono text-sm font-bold bg-slate-100 px-4 py-2 rounded-xl text-slate-500 border border-slate-200/50">
                              {p.libraryId}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="font-black text-indigo-600 text-2xl leading-none">{p.totalCertificates}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t.Label_TotalAwards}</span>
                              </div>
                              <div className="flex -space-x-2">
                                {[...Array(Math.min(4, p.totalCertificates))].map((_, i) => (
                                  <div key={`award-icon-${p.id}-${i}`} className="w-8 h-8 rounded-full bg-yellow-50 border-2 border-white flex items-center justify-center text-yellow-500 shadow-sm">
                                    <Award size={14} fill="currentColor" />
                                  </div>
                                ))}
                                {p.totalCertificates > 4 && (
                                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 text-[10px] font-black shadow-sm">
                                    +{p.totalCertificates - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">
                                {p.lastActivity?.toDate ? p.lastActivity.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {p.lastActivity?.toDate ? p.lastActivity.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProgress.length === 0 && !loading && (
                        <tr>
                          <td colSpan={4} className="px-10 py-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-40">
                              <Search size={48} className="text-slate-300" />
                              <p className="text-slate-400 font-black text-xl">{t.Text_NoExplorersFound}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Activity Sidebar */}
            <div className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <Calendar className="text-indigo-500" />
                  Recent Awards
                </h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Latest Achievements</p>
              </div>
              <div className="space-y-6">
                {recentCerts.map((cert, i) => (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={`recent-award-${cert.id || 'no-id'}-${i}`}
                    className="bg-white p-6 rounded-[2rem] shadow-xl border-l-8 border-indigo-500 flex items-start gap-5 group hover:translate-x-2 transition-all"
                  >
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-lg truncate">{cert.studentName}</p>
                      <p className="text-sm text-slate-500 font-bold truncate mb-2">{cert.activityName}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-black uppercase tracking-widest">{cert.date}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-200 group-hover:text-indigo-300 transition-colors mt-1" />
                  </motion.div>
                ))}
                {recentCerts.length === 0 && !loading && (
                  <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] p-12 text-center">
                    <Award className="text-slate-200 mx-auto mb-4" size={48} />
                    <p className="text-slate-400 font-black">No awards yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'events' ? (
        <div className="space-y-8">
        <div className="flex flex-col items-center justify-center space-y-8 mb-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 flex items-center justify-center gap-4">
              <Calendar className="text-indigo-500" />
              Upcoming Adventures 📅
            </h2>
            <p className="text-slate-500 font-bold text-lg">{t.Subtitle_Events}</p>
          </div>
          <button 
            onClick={() => setIsAddingEvent(true)}
            className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95"
          >
            <Plus size={24} />
            Post New Event
          </button>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <motion.div 
                layout
                key={`staff-event-card-${event.id}`}
                className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-b-8 border-slate-100 group"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  <img 
                    src={event.posterUrl} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => {
                        setEditEventData({
                          title: event.title,
                          date: event.date,
                          description: event.description,
                          posterUrl: event.posterUrl
                        });
                        setEditingEventId(event.id);
                      }}
                      className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteTarget({ id: event.id, type: 'event' })}
                      className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                    <Calendar size={14} />
                    {event.date}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{event.title}</h3>
                  <p className="text-slate-500 font-medium line-clamp-3">{event.description}</p>
                </div>
              </motion.div>
            ))}
            {events.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Calendar className="text-slate-300" size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-400">{t.Title_EmptyEvents}</h4>
                <p className="text-slate-400 font-medium">{t.Text_EmptyEvents}</p>
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {deleteTarget && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setDeleteTarget(null)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-md w-full border-b-8 border-red-100 text-center"
              >
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                  <Trash2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  {t.Modal_DeleteTitle.replace('{type}', deleteTarget.type === 'event' ? 'Event' : deleteTarget.type === 'user' ? 'User' : deleteTarget.type === 'student' ? 'Student' : 'Account')}
                </h3>
                <p className="text-slate-500 font-medium mb-8">
                  {t.Modal_DeleteConfirm.replace('{type}', deleteTarget.type)}
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    {t.Btn_Cancel}
                  </button>
                  <button 
                    onClick={() => {
                      if (deleteTarget.type === 'event') handleDeleteEvent(deleteTarget.id);
                      else if (deleteTarget.type === 'user') handleDeleteUser(deleteTarget.id);
                      else if (deleteTarget.type === 'student') handleDeleteStudent(deleteTarget.id);
                      else if (deleteTarget.type === 'account') handleDeleteLibraryAccount(deleteTarget.id);
                    }}
                    className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                  >
                    {t.Btn_ConfirmDelete}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Edit Event Modal */}
          {editingEventId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setEditingEventId(null)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-2xl w-full border-b-8 border-indigo-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-black text-slate-900">{t.Title_EditEvent}</h3>
                  <button 
                    onClick={() => setEditingEventId(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleEditEventSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_EventTitle}</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Summer Reading Kickoff"
                        value={editEventData.title}
                        onChange={e => setEditEventData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_DateTime}</label>
                      <input 
                        required
                        type="datetime-local"
                        value={editEventData.date}
                        onChange={e => setEditEventData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_Description}</label>
                    <textarea 
                      rows={3}
                      placeholder="Tell everyone about the event..."
                      value={editEventData.description}
                      onChange={e => setEditEventData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_PosterImage}</label>
                    <div className="relative group">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="hidden"
                        id="edit-poster-upload"
                      />
                      <label 
                        htmlFor="edit-poster-upload"
                        className={`w-full aspect-video rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                          editEventData.posterUrl ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30'
                        }`}
                      >
                        {editEventData.posterUrl ? (
                          <img src={editEventData.posterUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <>
                            <div className="bg-white p-4 rounded-2xl text-indigo-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                              <Image size={32} />
                            </div>
                            <span className="font-black text-slate-400">{t.Text_ClickToUpload}</span>
                            <span className="text-xs text-slate-400 mt-1 font-bold">{t.Text_MaxFileSize}</span>
                          </>
                        )}
                      </label>
                      {editEventData.posterUrl && (
                        <button 
                          type="button"
                          onClick={() => setEditEventData(prev => ({ ...prev, posterUrl: '' }))}
                          className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingEdit ? 'Updating Event...' : 'Update Event 🚀'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {/* Add Event Modal */}
          {isAddingEvent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsAddingEvent(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-2xl w-full border-b-8 border-indigo-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-black text-slate-900">{t.Title_PostEvent}</h3>
                  <button 
                    onClick={() => setIsAddingEvent(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleAddEvent} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_EventTitle}</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Summer Reading Kickoff"
                        value={newEvent.title}
                        onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_DateTime}</label>
                      <input 
                        required
                        type="datetime-local"
                        value={newEvent.date}
                        onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_Description}</label>
                    <textarea 
                      rows={3}
                      placeholder="Tell everyone about the event..."
                      value={newEvent.description}
                      onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-4 border-transparent focus:border-indigo-400 outline-none font-bold transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">{t.Label_PosterImage}</label>
                    <div className="relative group">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, false)}
                        className="hidden"
                        id="poster-upload"
                      />
                      <label 
                        htmlFor="poster-upload"
                        className={`w-full aspect-video rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                          newEvent.posterUrl ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30'
                        }`}
                      >
                        {newEvent.posterUrl ? (
                          <img src={newEvent.posterUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <>
                            <div className="bg-white p-4 rounded-2xl text-indigo-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                              <Image size={32} />
                            </div>
                            <span className="font-black text-slate-400">{t.Text_ClickToUpload}</span>
                            <span className="text-xs text-slate-400 mt-1 font-bold">{t.Text_MaxFileSize}</span>
                          </>
                        )}
                      </label>
                      {newEvent.posterUrl && (
                        <button 
                          type="button"
                          onClick={() => setNewEvent(prev => ({ ...prev, posterUrl: '' }))}
                          className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingEvent}
                    className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingEvent ? 'Posting Event...' : 'Post Event Now! 🚀'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </div>
      ) : activeTab === 'users' && userRole === 'admin' ? (
        <div className="space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                <Users className="text-indigo-600" />
                Community Directory
              </h2>
              <p className="text-slate-500 font-bold text-lg">Manage access and roles for library staff and caregivers</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-8 py-12">
            <div className="flex flex-wrap justify-center items-center gap-10">
              <button 
                onClick={() => setSelectedDirectoryRole('student')}
                className="w-72 h-72 bg-white rounded-[4rem] shadow-2xl border-b-8 border-pink-500/20 flex flex-col items-center justify-center gap-6 hover:scale-105 hover:shadow-pink-100/50 transition-all group"
              >
                <div className="bg-pink-50 p-8 rounded-[2.5rem] text-pink-600 group-hover:scale-110 transition-transform shadow-inner">
                  <Users size={80} />
                </div>
                <span className="text-3xl font-black text-slate-800">Student</span>
              </button>

              <button 
                onClick={() => setSelectedDirectoryRole('caregiver')}
                className="w-72 h-72 bg-white rounded-[4rem] shadow-2xl border-b-8 border-indigo-500/20 flex flex-col items-center justify-center gap-6 hover:scale-105 hover:shadow-indigo-100/50 transition-all group"
              >
                <div className="bg-indigo-50 p-8 rounded-[2.5rem] text-indigo-600 group-hover:scale-110 transition-transform shadow-inner">
                  <Heart size={80} />
                </div>
                <span className="text-3xl font-black text-slate-800">Caregiver</span>
              </button>
            </div>
            <p className="text-slate-400 font-bold text-center max-w-md">Select a category to view and manage members of our library community</p>
          </div>

          <AnimatePresence>
            {selectedDirectoryRole && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  onClick={() => setSelectedDirectoryRole(null)}
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-6xl w-full border-b-8 border-indigo-100 max-h-[90vh] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${
                        selectedDirectoryRole === 'student' ? 'bg-pink-100 text-pink-600' :
                        'bg-indigo-100 text-indigo-600'
                      }`}>
                        {selectedDirectoryRole === 'student' ? <Users size={32} /> :
                         <Heart size={32} />}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 capitalize">{selectedDirectoryRole} Dashboard</h2>
                        <p className="text-slate-500 font-bold">Manage {selectedDirectoryRole}s</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedDirectoryRole(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                      <X size={24} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="overflow-y-auto flex-1 pr-2 space-y-8">
                    <div className="flex flex-col items-center justify-center gap-10 mb-10">
                      <div className="flex flex-wrap items-center justify-center gap-6">
                        <button
                          onClick={() => setIsAddingUser(!isAddingUser)}
                          className="flex items-center gap-3 px-8 py-5 bg-indigo-600 text-white font-black text-lg uppercase tracking-widest rounded-[2.5rem] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                        >
                          {isAddingUser ? <X size={24} /> : <Plus size={24} />}
                          {isAddingUser ? 'Cancel' : 'Add New User'}
                        </button>
                        <label className="flex items-center gap-3 px-8 py-5 bg-white text-indigo-600 border-4 border-indigo-50 font-black text-lg uppercase tracking-widest rounded-[2.5rem] shadow-2xl shadow-indigo-50 hover:bg-indigo-50 transition-all cursor-pointer hover:scale-105 active:scale-95">
                          {isUploadingCsv ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                          {isUploadingCsv ? 'Uploading...' : 'Upload CSV'}
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleCsvUpload}
                            disabled={isUploadingCsv}
                          />
                        </label>
                      </div>
                      <div className="relative group w-full max-w-xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={24} />
                        <input 
                          type="text"
                          placeholder={`Search ${selectedDirectoryRole}s...`}
                          value={userSearchTerm}
                          onChange={e => setUserSearchTerm(e.target.value)}
                          className="pl-16 pr-8 py-5 bg-slate-50 rounded-[2.5rem] border-4 border-transparent focus:border-indigo-100 focus:bg-white outline-none font-bold text-lg transition-all w-full shadow-inner"
                        />
                      </div>
                    </div>

                    {isAddingUser && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100"
                      >
                        <form onSubmit={handleAddUser} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedDirectoryRole === 'student' ? (
                              <>
                                <div>
                                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Student Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold"
                                    placeholder="Enter student name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Grade</label>
                                  <select
                                    value={newGrade}
                                    onChange={(e) => setNewGrade(e.target.value)}
                                    className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold"
                                  >
                              {['K', '1', '2', '3', '4', '5'].map((g, gIdx) => (
                                      <option key={`grade-opt-${g}-${gIdx}`} value={g}>Grade {g}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Parent Email</label>
                                  <input
                                    type="email"
                                    required
                                    value={newParentEmail}
                                    onChange={(e) => setNewParentEmail(e.target.value)}
                                    className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold"
                                    placeholder="Enter parent's email"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Library ID (Optional)</label>
                                  <input
                                    type="text"
                                    value={newLibraryId}
                                    onChange={(e) => setNewLibraryId(e.target.value)}
                                    className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold"
                                    placeholder="Enter library ID"
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Email Address</label>
                                  <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold"
                                    placeholder="Enter email address"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Full Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold"
                                    placeholder="Enter full name"
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingUser}
                            className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                          >
                            {isSubmittingUser ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                            {isSubmittingUser ? 'Creating...' : `Create ${selectedDirectoryRole === 'student' ? 'Student' : 'Caregiver'}`}
                          </button>
                        </form>
                      </motion.div>
                    )}

                    <div className="bg-white rounded-[3.5rem] shadow-sm border-2 border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b-2 border-slate-50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User Details</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Role</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Specialization</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((u) => (
                    <tr key={`user-row-${u.id}`} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                            {u.displayName?.charAt(0) || <UserCircle size={24} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg">{u.displayName || 'No Name'}</span>
                            <span className="text-sm font-bold text-slate-400">{u.email}</span>
                            <span className="text-[10px] font-mono text-slate-300 mt-1 uppercase tracking-widest">{u.uid.slice(0, 12)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${
                          u.role === 'admin' ? 'bg-violet-50 text-violet-600 border border-violet-100' : 
                          u.role === 'caregiver' ? 'bg-pink-50 text-pink-600 border border-pink-100' :
                          'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${
                            u.role === 'admin' ? 'bg-violet-400' : 
                            u.role === 'caregiver' ? 'bg-pink-400' :
                            'bg-slate-400'
                          }`} />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        {u.requestedRole ? (
                          <div className="flex flex-col gap-1">
                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-600 border border-yellow-200 inline-block w-fit">
                              Pending Approval
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Wants to be: <span className="text-slate-900">{u.requestedRole}</span></span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-500 border border-emerald-100 inline-block w-fit">
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        {u.role === 'caregiver' ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Linked Children:</span>
                            <div className="flex flex-col gap-1">
                              {students.filter(s => s.parentEmail?.toLowerCase() === u.email?.toLowerCase()).map((s, sIdx) => (
                                <div key={`linked-student-${s.id || sIdx}`} className="flex items-center gap-2 bg-pink-50 px-2 py-1 rounded-lg w-fit">
                                  <div className="w-4 h-4 rounded-full bg-pink-200 text-pink-600 flex items-center justify-center text-[8px] font-black">
                                    {s.name.charAt(0)}
                                  </div>
                                  <span className="text-xs font-bold text-pink-700">{s.name}</span>
                                </div>
                              ))}
                              {students.filter(s => s.parentEmail?.toLowerCase() === u.email?.toLowerCase()).length === 0 && (
                                <span className="text-slate-300 italic text-xs">No children linked</span>
                              )}
                            </div>
                          </div>
                        ) : (u.subject || u.grade) ? (
                          <div className="space-y-1">
                            {u.subject && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Subject:</span> 
                                <span className="text-sm font-black text-slate-700">{u.subject}</span>
                              </div>
                            )}
                            {u.grade && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Grade:</span> 
                                <span className="text-sm font-black text-slate-700">{u.grade}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-sm">Not specified</span>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex gap-2 flex-wrap max-w-[280px]">
                          {u.requestedRole && (
                            <div className="flex w-full gap-2 mb-2">
                              <button
                                disabled={updatingRole === u.id}
                                onClick={() => handleUpdateRole(u.id, u.requestedRole!)}
                                className="flex-1 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                              >
                                {updatingRole === u.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                Approve
                              </button>
                              <button
                                disabled={updatingRole === u.id}
                                onClick={() => handleDenyRole(u.id)}
                                className="flex-1 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
                              >
                                {updatingRole === u.id ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                                Deny
                              </button>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 w-full">
                            {[
                              { id: 'admin', label: 'Admin', color: 'violet' },
                              { id: 'caregiver', label: 'Caregiver', color: 'pink' },
                              { id: 'visitor', label: 'Visitor', color: 'slate' }
                            ].map((roleBtn) => (
                              <button
                                key={`role-btn-${u.id}-${roleBtn.id}`}
                                disabled={updatingRole === u.id || u.role === roleBtn.id}
                                onClick={() => handleUpdateRole(u.id, roleBtn.id as any)}
                                className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                  u.role === roleBtn.id 
                                    ? `bg-${roleBtn.color}-50 text-${roleBtn.color}-300 border-${roleBtn.color}-100 cursor-not-allowed` 
                                    : `bg-white text-slate-600 border-slate-100 hover:border-${roleBtn.color}-200 hover:text-${roleBtn.color}-600`
                                }`}
                              >
                                {roleBtn.label}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setDeleteTarget({ id: u.id, type: 'user' })}
                            className="w-full mt-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 size={12} />
                            Delete User
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
</div>
      ) : activeTab === 'students' ? (
        <div className="space-y-10">
          <div className="flex flex-col items-center justify-center gap-8 mb-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-slate-900 flex items-center justify-center gap-4">
                <GraduationCap className="text-indigo-600" />
                Registered Students
              </h2>
              <p className="text-slate-500 font-bold text-lg">Official library membership records for our explorers</p>
            </div>
            <div className="relative group w-full max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={24} />
              <input 
                type="text"
                placeholder="Search by name, ID, or parent..."
                value={studentSearchTerm}
                onChange={e => setStudentSearchTerm(e.target.value)}
                className="pl-16 pr-8 py-5 bg-white rounded-[2.5rem] border-4 border-transparent focus:border-indigo-100 outline-none shadow-2xl shadow-slate-200/50 font-bold text-lg transition-all w-full"
              />
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border-b-8 border-slate-50">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b-2 border-slate-50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Explorer</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Library ID</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Academic Grade</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Caregiver Contact</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registration Date</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => (
                    <tr key={`student-row-${s.id}`} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl shadow-sm group-hover:scale-110 transition-transform">
                            {s.name?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg">{s.name}</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Member</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="font-mono text-sm font-black bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 border border-indigo-100">
                          {s.libraryId}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs">
                            {s.grade}
                          </div>
                          <span className="font-bold text-slate-600">Grade {s.grade}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Heart size={14} className="text-pink-400" fill="currentColor" />
                            <span className="font-black text-slate-900">{s.parentName}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-400 ml-6">{s.parentEmail}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">
                            {s.registeredAt?.toDate ? s.registeredAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">New Member</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <button
                          onClick={() => setDeleteTarget({ id: s.id, type: 'student' })}
                          className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          title="Delete Student"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-10 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <GraduationCap size={48} className="text-slate-300" />
                          <p className="text-slate-400 font-black text-xl">{t.Text_NoStudentsRegistered}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'accounts' ? (
        <div className="space-y-10">
          <div className="flex flex-col items-center justify-center gap-6 mb-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-slate-900 flex items-center justify-center gap-4">
                <IdCard className="text-indigo-600" />
                {t.Title_LibraryAccounts}
              </h2>
              <p className="text-slate-500 font-bold text-lg">{t.Subtitle_LibraryAccounts}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 100 }, (_, i) => i + 1).map(slot => {
              const account = libraryAccounts.find(a => a.slotNumber === slot);
              return (
                <div key={`account-slot-${slot}`} className={`p-6 rounded-[2rem] border-4 flex flex-col gap-4 ${account ? 'bg-white border-indigo-100 shadow-xl' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t.Label_Slot} {slot}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${account ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                      {account ? t.Status_Claimed : t.Status_Available}
                    </span>
                    {account && (
                      <button
                        onClick={() => setDeleteTarget({ id: account.id, type: 'account' })}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Delete Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  {account ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Library ID</p>
                        <p className="font-mono font-black text-lg text-indigo-600">{account.libraryId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student</p>
                        <p className="font-bold text-slate-800">{account.studentName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caregiver</p>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            defaultValue={account.caregiverName}
                            onBlur={async (e) => {
                              if (e.target.value !== account.caregiverName) {
                                try {
                                  await setDoc(doc(db, 'library_accounts', account.id), { caregiverName: e.target.value }, { merge: true });
                                } catch (err) {
                                  console.error("Failed to update caregiver", err);
                                }
                              }
                            }}
                            className="bg-slate-50 px-3 py-1.5 rounded-xl border-2 border-slate-100 focus:border-indigo-300 outline-none font-bold text-sm w-full transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-slate-400 font-bold text-sm text-center">{t.Text_WaitingExplorer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'chat' ? (
        <div className="space-y-10">
          <div className="flex flex-col items-center justify-center gap-6 mb-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-slate-900 flex items-center justify-center gap-4">
                <MessageSquare className="text-indigo-600" />
                Live Chat Dashboard
              </h2>
              <p className="text-slate-500 font-bold text-lg">Respond to visitor inquiries in real-time</p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-xl border-4 border-indigo-50 overflow-hidden flex h-[600px]">
            {/* Sidebar for chat list */}
            <div className="w-1/3 border-r-4 border-indigo-50 bg-slate-50 overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-bold text-slate-700 text-lg">Active Chats</h3>
              </div>
              <div className="p-4 space-y-2">
                {(() => {
                  const chatGroups = (liveMessages || []).reduce((acc: any, msg: any) => {
                    const id = msg.libraryId || 'Anonymous';
                    if (!acc[id]) {
                      acc[id] = {
                        libraryId: id,
                        visitorName: msg.visitorName || 'Anonymous Visitor',
                        messages: []
                      };
                    }
                    acc[id].messages.push(msg);
                    return acc;
                  }, {});
                  const chatList = Object.values(chatGroups) as any[];
                  
                  if (chatList.length === 0) {
                    return <div className="text-slate-400 text-center py-8">No active chats</div>;
                  }

                  return chatList.map((chat, chatIdx) => (
                    <button
                      key={`chat-item-${chat.libraryId}-${chatIdx}`}
                      onClick={() => setSelectedChatId(chat.libraryId)}
                      className={`w-full text-left p-4 rounded-2xl transition-all ${selectedChatId === chat.libraryId ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-white border-2 border-transparent hover:border-indigo-200 shadow-sm'}`}
                    >
                      <div className="font-bold text-slate-800">{chat.visitorName}</div>
                      <div className="text-sm text-slate-500">ID: {chat.libraryId}</div>
                      <div className="text-xs text-slate-400 mt-2 truncate">
                        {chat.messages[chat.messages.length - 1].text}
                      </div>
                    </button>
                  ));
                })()}
              </div>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
              {selectedChatId ? (
                <>
                  <div className="p-6 border-b-4 border-indigo-50 bg-white flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xl">
                        {(() => {
                          const msg = (liveMessages || []).find((m: any) => (m.libraryId || 'Anonymous') === selectedChatId);
                          return msg ? msg.visitorName || 'Anonymous Visitor' : 'Chat';
                        })()}
                      </h3>
                      <p className="text-sm text-slate-500">ID: {selectedChatId}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                    {(liveMessages || [])
                      .filter((msg: any) => (msg.libraryId || 'Anonymous') === selectedChatId)
                      .map((msg: any, msgIdx: number) => (
                        <div key={`staff-chat-msg-${msg.id || msgIdx}`} className={`flex ${msg.sender === 'librarian' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-4 rounded-2xl ${msg.sender === 'librarian' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 shadow-sm border-2 border-slate-100 rounded-tl-sm'}`}>
                            <p className="font-bold">{msg.text}</p>
                            <p className={`text-xs mt-2 ${msg.sender === 'librarian' ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="p-4 bg-white border-t-4 border-slate-50">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                        if (input.value.trim() && setLiveMessages) {
                          setLiveMessages((prev: any) => [...prev, {
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            text: input.value,
                            sender: 'librarian',
                            timestamp: new Date(),
                            libraryId: selectedChatId === 'Anonymous' ? undefined : selectedChatId,
                            visitorName: (() => {
                              const msg = (liveMessages || []).find((m: any) => (m.libraryId || 'Anonymous') === selectedChatId);
                              return msg ? msg.visitorName : undefined;
                            })()
                          }]);
                          input.value = '';
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input 
                        type="text" 
                        name="message"
                        placeholder="Type a reply..." 
                        className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all font-bold"
                        autoComplete="off"
                      />
                      <button 
                        type="submit"
                        className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50">
                  <MessageSquare size={64} className="opacity-20" />
                  <p className="font-bold text-xl text-slate-500">Select a chat to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
