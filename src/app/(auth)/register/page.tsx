'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (formData.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    setLoading(true);
    try {
      // Step 1: Create user in DB via register API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || 'สมัครสมาชิกล้มเหลว');
      
      // Step 2: Sign in via NextAuth to create proper session
      const signInRes = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      
      if (signInRes?.error) {
        throw new Error('สมัครสำเร็จแต่เข้าสู่ระบบไม่ได้ กรุณาล็อกอินอีกครั้ง');
      }
      
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col antialiased">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 h-16 border-b border-[#c4c5d5]/30 bg-[#f8f9ff]/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/login" className="text-[#444653] hover:text-[#00288e] transition-colors flex items-center">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </Link>
        <div className="text-xl font-bold tracking-tighter text-[#00288e] uppercase">NOTUS</div>
        <div className="w-6"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 py-12 flex flex-col">
        {/* Abstract Brand Image - gradient placeholder */}
        <div className="w-full h-32 rounded-xl mb-6 bg-gradient-to-br from-[#dde1ff] via-[#e5eeff] to-[#b8c4ff] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#c4c5d5]/20"></div>

        {/* Typography Header */}
        <div className="mb-12">
          <h1 className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#0b1c30] mb-2">สร้างบัญชี</h1>
          <p className="text-base leading-6 text-[#444653]">เริ่มต้นจัดการข้อมูลและตารางเวลาอย่างมืออาชีพกับ Notus</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-[#ffdad6] text-[#93000a] text-sm rounded">{error}</div>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4 mb-6" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="flex flex-col relative group">
            <label className="text-xs font-medium tracking-[0.05em] text-[#444653] mb-1 transition-colors group-focus-within:text-[#00288e]" htmlFor="fullname">ชื่อ-นามสกุล</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-0 text-[#444653]/50 pb-2">person</span>
              <input className="w-full h-10 pl-8 pb-2 bg-transparent border-0 border-b border-[#c4c5d5]/60 text-base text-[#0b1c30] focus:ring-0 focus:border-[#00288e] focus:border-b-2 transition-all placeholder:text-[#444653]/40 rounded-none" id="fullname" name="fullName" placeholder="ระบุชื่อจริงและนามสกุล" type="text" value={formData.fullName} onChange={handleChange} required />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col relative group">
            <label className="text-xs font-medium tracking-[0.05em] text-[#444653] mb-1 transition-colors group-focus-within:text-[#00288e]" htmlFor="email">อีเมล</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-0 text-[#444653]/50 pb-2">mail</span>
              <input className="w-full h-10 pl-8 pb-2 bg-transparent border-0 border-b border-[#c4c5d5]/60 text-base text-[#0b1c30] focus:ring-0 focus:border-[#00288e] focus:border-b-2 transition-all placeholder:text-[#444653]/40 rounded-none" id="email" name="email" placeholder="name@company.com" type="email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col relative group">
            <label className="text-xs font-medium tracking-[0.05em] text-[#444653] mb-1 transition-colors group-focus-within:text-[#00288e]" htmlFor="password">รหัสผ่าน</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-0 text-[#444653]/50 pb-2">lock</span>
              <input className="w-full h-10 pl-8 pr-8 pb-2 bg-transparent border-0 border-b border-[#c4c5d5]/60 text-base text-[#0b1c30] focus:ring-0 focus:border-[#00288e] focus:border-b-2 transition-all placeholder:text-[#444653]/40 rounded-none" id="password" name="password" placeholder="อย่างน้อย 8 ตัวอักษร" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required />
              <button type="button" className="absolute right-0 text-[#444653]/50 pb-2 hover:text-[#0b1c30]" onClick={() => setShowPassword(!showPassword)}>
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col relative group">
            <label className="text-xs font-medium tracking-[0.05em] text-[#444653] mb-1 transition-colors group-focus-within:text-[#00288e]" htmlFor="confirm_password">ยืนยันรหัสผ่าน</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-0 text-[#444653]/50 pb-2">lock_reset</span>
              <input className="w-full h-10 pl-8 pb-2 bg-transparent border-0 border-b border-[#c4c5d5]/60 text-base text-[#0b1c30] focus:ring-0 focus:border-[#00288e] focus:border-b-2 transition-all placeholder:text-[#444653]/40 rounded-none" id="confirm_password" name="confirmPassword" placeholder="พิมพ์รหัสผ่านอีกครั้ง" type="password" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="mt-2 w-full h-12 bg-[#00288e] text-white text-xl font-semibold rounded-lg flex items-center justify-center hover:bg-[#173bab] active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-50">
            {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'สร้างบัญชี'}
          </button>
          <p className="text-sm text-[#444653] text-center mt-1">
            การสร้างบัญชีหมายความว่าคุณยอมรับ <a className="text-[#00288e] hover:underline" href="#">ข้อตกลงการใช้งาน</a> และ <a className="text-[#00288e] hover:underline" href="#">นโยบายความเป็นส่วนตัว</a>
          </p>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#c4c5d5]/40"></div></div>
          <div className="relative bg-[#f8f9ff] px-4 text-xs font-medium tracking-[0.05em] text-[#444653] uppercase">หรือสมัครด้วย</div>
        </div>

        {/* Google Social Login */}
        <button 
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full h-12 bg-white border border-[#c4c5d5]/60 text-[#0b1c30] text-xl font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#eff4ff] hover:border-[#c4c5d5] active:scale-[0.98] transition-all duration-200 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]" 
          type="button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
      </main>
    </div>
  );
}

export const runtime = 'edge';
