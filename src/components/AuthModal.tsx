import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني للتأكيد.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-2 text-center">
          {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
        </h2>
        <p className="text-slate-400 text-sm mb-6 text-center">
          {isSignUp ? 'أنشئ حسابك لمزامنة مؤقتاتك عبر كافة أجهزتك' : 'سجل دخولك للوصول إلى مؤقتاتك المنظمة'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">أو</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
        >
          متابعة باستخدام Google
        </button>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isSignUp ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-400 hover:underline font-semibold"
          >
            {isSignUp ? 'سجل الدخول' : 'أنشئ حساباً الآن'}
          </button>
        </div>
      </div>
    </div>
  );
};
