'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import './login.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div
      className="login-wrapper min-h-screen flex items-center justify-center p-5 relative overflow-hidden bg-[#0a0a0f]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,99,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(167,139,250,0.08) 0%, transparent 50%)',
      }}
    >
      {/* Login Card */}
      <div
        className="animate-card-appear w-full max-w-[420px] rounded-3xl px-10 py-12 relative z-10"
        style={{
          background: 'rgba(17,17,24,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(108,99,255,0.1) inset',
        }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="animate-logo-float w-16 h-16 rounded-2xl flex items-center justify-center text-[32px] mx-auto mb-5"
            style={{
              background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
              boxShadow: '0 8px 32px rgba(108,99,255,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
            }}
          >
            🔖
          </div>
          <h1 className="text-[28px] font-bold text-[#f0f0f5] mb-2 tracking-tight">
            Smart Bookmarks
          </h1>
          <p className="text-[14px] text-[#8888a0] font-normal">
            Organize and access your bookmarks effortlessly
          </p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={loginWithGoogle}
          className="google-btn w-full bg-white text-[#1f1f1f] px-6 py-[14px] rounded-xl text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-3 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          disabled={loading}
        >
          {/* Google Icon */}
          <span className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </span>
          {loading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Feature List */}
        <div className="mt-10 pt-8 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-4 text-[13px] text-[#8888a0]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0"
              style={{
                background: 'rgba(108,99,255,0.1)',
                border: '1px solid rgba(108,99,255,0.2)',
              }}
            >
              ⚡
            </div>
            <span>Quick access to all your bookmarks</span>
          </div>

          <div className="flex items-center gap-3 mb-4 text-[13px] text-[#8888a0]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0"
              style={{
                background: 'rgba(108,99,255,0.1)',
                border: '1px solid rgba(108,99,255,0.2)',
              }}
            >
              🔍
            </div>
            <span>Powerful search and filtering</span>
          </div>

          <div className="flex items-center gap-3 mb-4 text-[13px] text-[#8888a0]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] flex-shrink-0"
              style={{
                background: 'rgba(108,99,255,0.1)',
                border: '1px solid rgba(108,99,255,0.2)',
              }}
            >
              ☁️
            </div>
            <span>Sync across all your devices</span>
          </div>
        </div>

        {/* Footer */}
        <div className="font-mono-dm text-[11px] text-[#44445a] text-center mt-8 leading-relaxed">
          Secure authentication powered by Supabase
        </div>
      </div>
    </div>
  );
}