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

const PROTECTED_PAGES: string[] = [
  'dashboard',
  'library',
  'tutor',
  'quiz',
  'mastery',
  'roadmap',
  'evaluation'
];

const AppContent: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    isAuthenticated,
    isAuthLoading,
    isProfileCompleted
  } = useStudy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Session initialization loading state - prevent private route flash
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-teal-500/20">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-teal-400 animate-spin" />
          <div className="absolute w-2 h-2 rounded-full bg-teal-400" />
        </div>
        <p className="text-xs font-mono font-medium text-slate-400 tracking-wider uppercase">
          Verifying StudyMate AI Session...
        </p>
      </div>
    );
  }

  // 2. Public Homepage
  if (currentPage === 'home') {
    return <HomePage />;
  }

  // 3. Login Page
  if (currentPage === 'login') {
    if (isAuthenticated) {
      if (isProfileCompleted) {
        return <DashboardPage />;
      }
      return <OnboardingPage />;
    }
    return <LoginPage />;
  }

  // 4. Signup Page
  if (currentPage === 'signup') {
    if (isAuthenticated) {
      if (isProfileCompleted) {
        return <DashboardPage />;
      }
      return <OnboardingPage />;
    }
    return <SignupPage />;
  }

  // 5. Onboarding Page (Requires active authentication)
  if (currentPage === 'onboarding') {
    if (!isAuthenticated) {
      sessionStorage.setItem('studymate_return_url', 'onboarding');
      return <LoginPage />;
    }
    return <OnboardingPage />;
  }

  // 6. Route Guard for Private / Protected Pages
  if (PROTECTED_PAGES.includes(currentPage)) {
    // Unauthenticated visitor trying to access protected route directly
    if (!isAuthenticated) {
      sessionStorage.setItem('studymate_return_url', currentPage);
      return <LoginPage />;
    }

    // Authenticated user whose education profile is not completed yet
    if (!isProfileCompleted) {
      return <OnboardingPage />;
    }
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
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-200">
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
        <footer className="border-t border-slate-800/60 px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto bg-[#070b12]/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">StudyMate AI</span>
            <span className="text-slate-600">•</span>
            <span>IIT Mandi Multimodal AI Hackathon 2026 (Track D)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Adaptive Tutoring & Assessment</span>
            <span className="text-slate-600">•</span>
            <span className="text-teal-400 font-mono">100% Source Grounded</span>
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
