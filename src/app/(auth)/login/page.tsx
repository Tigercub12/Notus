'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        if (res.error === 'CredentialsSignin') {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else {
          setError(res.error);
        }
      } else {
        router.push('/dashboard');
        router.refresh(); // Refresh to update layout state
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen geometric-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white border border-[#c4c5d5] rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
        {/* Brand Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="material-symbols-outlined text-[#00288e] text-[32px]">note_stack</span>
            <h1 className="text-xl font-semibold text-[#0b1c30]">Notus</h1>
          </div>
          <p className="text-sm text-[#444653]">เข้าสู่ระบบพื้นที่ทำงานของคุณ</p>
        </div>

        {/* Google Login */}
        <button 
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 mb-6 border border-[#c4c5d5] rounded hover:bg-[#e5eeff] transition-colors duration-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-xs font-medium tracking-[0.05em] text-[#0b1c30]">เข้าสู่ระบบด้วย Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-grow border-t border-[#c4c5d5]"></div>
          <span className="px-4 text-xs font-medium tracking-[0.05em] text-[#444653]">หรือดำเนินการต่อด้วยอีเมล</span>
          <div className="flex-grow border-t border-[#c4c5d5]"></div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-[#ffdad6] text-[#93000a] text-sm rounded">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-medium tracking-[0.05em] text-[#0b1c30] mb-1" htmlFor="email">อีเมล</label>
            <input
              className="w-full bg-transparent border-0 border-b border-[#c4c5d5] focus:border-[#00288e] focus:ring-0 px-0 py-2 text-sm text-[#0b1c30] placeholder:text-[#444653] transition-colors"
              id="email"
              placeholder="name@company.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium tracking-[0.05em] text-[#0b1c30]" htmlFor="password">รหัสผ่าน</label>
              <a className="text-xs font-medium tracking-[0.05em] text-[#00288e] hover:text-[#1e40af] transition-colors" href="#">ลืมรหัสผ่าน?</a>
            </div>
            <input
              className="w-full bg-transparent border-0 border-b border-[#c4c5d5] focus:border-[#00288e] focus:ring-0 px-0 py-2 text-sm text-[#0b1c30] placeholder:text-[#444653] transition-colors"
              id="password"
              placeholder="••••••••"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e40af] text-white py-2 px-4 rounded text-xs font-medium tracking-[0.05em] hover:bg-[#00288e] transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-[#444653]">ยังไม่มีบัญชี? </span>
          <Link className="text-xs font-medium tracking-[0.05em] text-[#00288e] hover:text-[#1e40af] transition-colors" href="/register">สร้างบัญชี</Link>
        </div>
      </div>
    </div>
  );
}
