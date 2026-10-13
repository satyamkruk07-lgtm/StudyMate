import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowRight,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export const SignupPage: React.FC = () => {
  const { signup, setCurrentPage } = useStudy();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await signup(name.trim(), email.trim(), password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to create account.');
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-slate-800/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home Button */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={() => setCurrentPage('home')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#0a0e17] border border-slate-800/80 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shadow-lg shadow-teal-950/40 mb-1">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Your Account</h2>
          <p className="text-xs text-slate-400">
            Start your personalized adaptive study journey with StudyMate AI
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Aarav Sharma"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Setting up account...</span>
            ) : (
              <>
                <span>Continue to Profile Setup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => setCurrentPage('login')}
            className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
