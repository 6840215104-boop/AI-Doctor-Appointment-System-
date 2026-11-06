import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  ShieldCheck,
  UserCheck,
  LogIn,
  LogOut,
  Sparkles,
  Building2,
} from 'lucide-react';
import { auth } from '../firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  todayCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  todayCount,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      setCurrentTime(now.toLocaleDateString('th-TH', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.warn('Google sign in canceled or note:', err?.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Hospital Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                  AI Doctor <span className="text-blue-600">Appointment</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
                  Gemini AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3 h-3 text-slate-400" />
                โรงพยาบาลสุขภาวะพัฒน์ (ระบบสาธิตเพื่อการศึกษา)
              </p>
            </div>
          </div>

          {/* Right Section: Time & Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Thai Date/Time */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{currentTime}</span>
            </div>

            {/* Quick Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>วันนี้มีนัดหมาย: <strong>{todayCount}</strong> คิว</span>
            </div>

            {/* Google Auth / Staff Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-blue-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {currentUser.displayName || 'เจ้าหน้าที่โรงพยาบาล'}
                  </p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{currentUser.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                title="เข้าสู่ระบบด้วย Google Account (สำหรับเจ้าหน้าที่)"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>เข้าสู่ระบบ (Google)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
