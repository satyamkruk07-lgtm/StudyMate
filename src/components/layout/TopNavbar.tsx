import React, { useState } from 'react';
import {
  Menu,
  Server,
  Sparkles,
  Bot,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface TopNavbarProps {
  onOpenSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSidebar }) => {
  const {
    currentPage,
    setCurrentPage,
    apiMode,
    setApiMode,
    apiEndpoint,
    setApiEndpoint,
    testBackendConnection,
    clearChat
  } = useStudy();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return { title: 'Dashboard', desc: 'Real-time learning overview & adaptive signals' };
      case 'library':
        return { title: 'Learning Library', desc: 'Source document indexing, transcripts, and chunk vectorization' };
      case 'tutor':
        return { title: 'AI Tutor', desc: 'Hallucination-free source-grounded tutoring & citations' };
      case 'quiz':
        return { title: 'Smart Quiz', desc: 'Adaptive multi-format testing: MCQ, Short-Answer & Numerical' };
      case 'mastery':
        return { title: 'Mastery Tracker', desc: 'Topic-wise competency levels, learning history & revision signals' };
      case 'roadmap':
        return { title: 'Learning Roadmap', desc: 'Prerequisite dependency graph & structured milestones' };
      case 'evaluation':
        return { title: 'Evaluation & Benchmarks', desc: 'Track D empirical verification metrics & test suite' };
      default:
        return { title: 'StudyMate AI', desc: 'Adaptive Learning Companion' };
    }
  };

  const pageInfo = getPageTitle();

  const handleTestBackend = async () => {
    setTesting(true);
    setTestResult(null);
    const success = await testBackendConnection();
    setTestResult(success);
    setTesting(false);
  };

  const handleResetData = () => {
    if (window.confirm('Reset local demo data to default initial state?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
                {pageInfo.title}
              </h1>
              <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                {pageInfo.desc}
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Shortcuts */}
          {currentPage !== 'tutor' && (
            <button
              onClick={() => setCurrentPage('tutor')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ask Tutor</span>
            </button>
          )}

          {currentPage !== 'quiz' && (
            <button
              onClick={() => setCurrentPage('quiz')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Adaptive Quiz</span>
            </button>
          )}

          {/* Backend Engine Status Pill */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all"
            title="Inspect or configure Python FastAPI / In-Browser RAG Engine"
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline font-mono text-[11px] text-slate-300">
              {apiMode === 'browser-mock' ? 'Mock RAG Engine' : 'FastAPI Connected'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Reset Demo button */}
          <button
            onClick={handleResetData}
            title="Reset demo data to default baseline"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Backend Integration & Hackathon Details Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 bg-[#0f172a] rounded-2xl border border-slate-700/80 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">Backend & Engine Configuration</h3>
                  <p className="text-xs text-slate-400">FastAPI Architecture & Grounding Service</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Track D Integration Status
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The frontend is engineered with an isolated retrieval-grounding interface designed for immediate plug-and-play with a Python FastAPI backend (<code className="px-1 py-0.5 rounded bg-slate-800 text-sky-300">app.py</code>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Execution Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setApiMode('browser-mock')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      apiMode === 'browser-mock'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">In-Browser RAG Engine</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">High-speed client simulation with verifiable chunks</div>
                  </button>

                  <button
                    onClick={() => setApiMode('fastapi-connected')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      apiMode === 'fastapi-connected'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">Python FastAPI Service</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Live REST endpoint integration</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  FastAPI Endpoint URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={e => setApiEndpoint(e.target.value)}
                    placeholder="http://localhost:8000/api/v1"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200"
                  />
                  <button
                    onClick={handleTestBackend}
                    disabled={testing}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
                  >
                    {testing ? 'Probing...' : 'Test Ping'}
                  </button>
                </div>

                {testResult !== null && (
                  <div className={`mt-2 flex items-center gap-2 text-xs p-2.5 rounded-lg ${
                    testResult ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    {testResult ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Connected successfully to FastAPI server!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>FastAPI server not responding at this URL (Browser Mock Engine active as fallback).</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
