'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Loader2, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "../../lib/utils";
import CustomAlert from '@/components/ui/custom-alert';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [setupSuccess, setSetupSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if setup is required
    fetch('/api/setup')
      .then(res => res.json())
      .then(data => {
        if (data.setupRequired) {
          router.push('/setup');
        }
      });

    // 2. Check for setup success message
    if (searchParams.get('setup') === 'success') {
      setSetupSuccess(true);
    }
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setAlert({ message: 'Authentication Successful', type: 'success' });
        setTimeout(() => router.push('/'), 1000);
      } else {
        const data = await res.json();
        setAlert({ message: data.error || 'Invalid credentials', type: 'error' });
      }
    } catch (err) {
      setAlert({ message: 'Connection error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="w-full max-w-6xl relative z-10 animate-in fade-in zoom-in duration-700 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Left Side: Branding */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8 border border-white/10 group hover:rotate-6 transition-transform cursor-default">
            <span className="text-white font-black text-3xl italic">AT</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="h-0.5 w-8 bg-blue-500 rounded-full hidden lg:block" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                <Lock className="w-3.5 h-3.5" />
                Secure Access
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">
              Authenticate<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AdTrack</span>
            </h1>

            <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
              Welcome back to the enterprise advertising command center.
              Please verify your administrative credentials to access your data terminal.
            </p>
          </div>

          {/* <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-4 w-full">
            <div className="px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
               <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Status</div>
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs text-slate-200 font-bold uppercase tracking-widest">Systems Nominal</span>
               </div>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
               <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1">Environment</div>
               <div className="text-xs text-slate-200 font-bold uppercase tracking-widest">Production v1.0.4</div>
            </div>
          </div> */}
        </div>

        {/* Right Side: Form */}
        <div className="w-full max-w-lg lg:max-w-md xl:max-w-lg">
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

            <CardHeader className="pt-12 pb-6 text-center border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="text-2xl font-bold text-white tracking-tight">Admin Terminal</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Verify your synchronization key</CardDescription>
            </CardHeader>

            <CardContent className="p-8 lg:p-12">
              <form onSubmit={handleLogin} className="space-y-6 relative">
                {alert && (
                  <CustomAlert
                    message={alert.message}
                    type={alert.type}
                    onClose={() => setAlert(null)}
                  />
                )}
                {setupSuccess && !alert && (
                  <div className="bg-emerald-500/50 border border-emerald-500/20 text-emerald-400 text-[10px] py-4 px-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 mb-6 animate-in slide-in-from-top-4 duration-500">
                    <CheckCircle2 className="w-4 h-4" />
                    Setup Completed Successfully
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Admin Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secret Key</label>
                    <Link href="/forgot-password" title="Forgot Password?" className="text-[10px] font-black uppercase tracking-widest text-blue-500/60 hover:text-blue-400 transition-colors">
                      Recovery?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full h-14 bg-white text-[#020617] font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl hover:bg-slate-100 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 group",
                    loading ? "cursor-wait" : ""
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Authorize Access
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.4em] text-slate-700">
            Stakers Choice Command v1.0.4
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
