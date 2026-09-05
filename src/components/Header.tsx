import React, { useState, useEffect } from 'react';
import { ProClickLogo } from './ProClickLogo';
import { AuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  totalCount: number;
  timersCount: number;
  alarmsCount: number;
  onOpenNewTimerModal: () => void;
  onOpenSideDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  timersCount,
  alarmsCount,
  onOpenNewTimerModal,
  onOpenSideDrawer,
}) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // جلب بيانات المستخدم الحالي
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // الاستماع لتغيرات حالة تسجيل الدخول
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ProClickLogo />
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="bg-slate-800 px-2 py-1 rounded-md">الكل: {totalCount}</span>
              <span className="bg-slate-800 px-2 py-1 rounded-md">المؤقتات: {timersCount}</span>
              <span className="bg-slate-800 px-2 py-1 rounded-md">المنبهات: {alarmsCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                <span className="text-xs text-slate-300 font-medium max-w-[120px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-red-400 hover:text-red-300 transition font-semibold"
                >
                  خروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 font-medium px-3.5 py-1.5 rounded-xl text-xs transition"
              >
                تسجيل الدخول
              </button>
            )}

            <button
              onClick={onOpenNewTimerModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
            >
              <span>+</span>
              <span className="hidden sm:inline">إضافة</span>
            </button>

            <button
              onClick={onOpenSideDrawer}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
