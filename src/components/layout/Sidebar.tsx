import React from 'react';
import {
  LayoutDashboard,
  Library,
  Bot,
  BrainCircuit,
  BarChart3,
  GitBranch,
  ShieldCheck,
  Flame,
  ChevronRight,
  Sparkles,
  BookOpen,
  LogOut,
  Home
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { PageId } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    currentPage,
    setCurrentPage,
    resources,
    masteryData,
    streakDays,
    user,
    profile,
    logout,
    isAuthenticated
  } = useStudy();

  const weakCount = masteryData.filter(m => m.status === 'weak').length;

  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'library',
      label: 'Learning Library',
      icon: <Library className="w-5 h-5" />,
      badge: resources.length,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    },
    {
      id: 'tutor',
      label: 'AI Tutor',
      icon: <Bot className="w-5 h-5" />,
      badge: 'Grounded',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
    },
    {
      id: 'quiz',
      label: 'Smart Quiz',
      icon: <BrainCircuit className="w-5 h-5" />,
      badge: 'Adaptive',
      badgeColor: 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
    },
    {
      id: 'mastery',
      label: 'Mastery Tracker',
      icon: <BarChart3 className="w-5 h-5" />,
      badge: weakCount > 0 ? `${weakCount} weak` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    {
      id: 'roadmap',
      label: 'Learning Roadmap',
      icon: <GitBranch className="w-5 h-5" />
    },
    {
      id: 'evaluation',
      label: 'Evaluation & Benchmarks',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: 'Track D',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-[#0c1222] border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-500 shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0c1222]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">StudyMate</span>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
              </div>
              <p className="text-xs text-slate-400">Adaptive Learning Companion</p>
            </div>
          </div>

          <div className="mt-3.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              IIT Mandi Hackathon 2026
            </span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-semibold">Track D</span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>

          {navItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 via-indigo-500/15 to-transparent text-white border-l-4 border-indigo-500 shadow-sm shadow-indigo-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Streak & Student Card */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-900 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Flame className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">{streakDays} Day Study Streak</div>
                  <div className="text-[11px] text-amber-300/80">Keep learning daily</div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400/80" />
            </div>
            <div className="mt-2.5 flex items-center gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div
                  key={idx}
                  className={`flex-1 text-center py-0.5 text-[10px] rounded font-mono font-medium ${
                    idx < streakDays
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* User profile footer */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div
              onClick={() => {
                setCurrentPage('onboarding');
                onClose();
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Click to edit education profile"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-indigo-300 group-hover:border-indigo-400 transition-colors">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SK'}
              </div>
              <div className="truncate max-w-[130px]">
                <div className="font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                  {user?.name || 'Satyam K.'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {profile?.grade_or_course || 'Track D Learner'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (isAuthenticated) {
                  logout();
                } else {
                  setCurrentPage('home');
                }
                onClose();
              }}
              title={isAuthenticated ? 'Log Out' : 'Return to Public Home'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
