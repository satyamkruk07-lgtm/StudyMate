import React, { useState } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { TutorPage } from './pages/TutorPage';
import { QuizPage } from './pages/QuizPage';
import { MasteryPage } from './pages/MasteryPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { EvaluationPage } from './pages/EvaluationPage';

const AppContent: React.FC = () => {
  const { currentPage } = useStudy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Standalone full-page views
  if (currentPage === 'home') {
    return <HomePage />;
  }
  if (currentPage === 'login') {
    return <LoginPage />;
  }
  if (currentPage === 'signup') {
    return <SignupPage />;
  }
  if (currentPage === 'onboarding') {
    return <OnboardingPage />;
  }

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'library':
        return <LibraryPage />;
      case 'tutor':
        return <TutorPage />;
      case 'quiz':
        return <QuizPage />;
      case 'mastery':
        return <MasteryPage />;
      case 'roadmap':
        return <RoadmapPage />;
      case 'evaluation':
        return <EvaluationPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all">
        {/* Top Navbar */}
        <TopNavbar onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {renderActivePage()}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">StudyMate AI</span>
            <span>•</span>
            <span>IIT Mandi Multimodal AI Hackathon 2026 (Track D)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Adaptive Tutoring & Assessment</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">100% Source Grounded</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}
