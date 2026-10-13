import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  PageId,
  LearningResource,
  ChatMessage,
  QuizAttempt,
  TopicMastery,
  CitationReference,
  DifficultyLevel,
  BackendQuiz,
  BackendAttemptResult,
  BackendTopicMastery,
  BackendRecommendation,
  StudentProfile,
  AuthUser,
  EducationLevel
} from '../types';

const DEFAULT_API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL !== undefined 
    ? (import.meta.env.VITE_API_BASE_URL as string) 
    : (import.meta.env.PROD ? '' : 'http://localhost:8000');

interface StudyContextType {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;

  // Authentication & Session
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  guestLogin: (role?: EducationLevel) => void;

  // Education Profile
  profile: StudentProfile | null;
  isProfileCompleted: boolean;
  isProfileLoading: boolean;
  profileError: string | null;
  saveProfile: (newProfile: Omit<StudentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProfileSubjects: (subjects: string[]) => Promise<void>;
  addCustomSubject: (subject: string) => Promise<void>;
  removeSubject: (subject: string) => Promise<void>;
  renameSubject: (oldName: string, newName: string) => Promise<void>;
  activeSubject: string | null;
  setActiveSubject: (subject: string | null) => void;

  resources: LearningResource[];
  isLoadingMaterials: boolean;
  refreshMaterials: () => Promise<void>;
  uploadRealFile: (file: File, title?: string, topic?: string, subject?: string) => Promise<void>;
  updateResourceSubject: (resourceId: string, subject: string) => Promise<void>;
  addResource: (
    resource: Omit<LearningResource, 'id' | 'uploadDate' | 'status' | 'chunkCount' | 'chunks'>,
    simulatedContent?: string
  ) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  selectedResourceForPreview: LearningResource | null;
  setSelectedResourceForPreview: (res: LearningResource | null) => void;

  chatMessages: ChatMessage[];
  isChatThinking: boolean;
  chatError: string | null;
  sendChatMessage: (studentPrompt: string) => Promise<void>;
  clearChat: () => void;

  quizAttempts: QuizAttempt[];
  saveQuizAttempt: (attempt: QuizAttempt) => void;

  masteryData: TopicMastery[];
  updateTopicMastery: (topic: string, newPercentage: number) => void;

  // Real backend quiz, mastery, and recommendation states
  backendMastery: BackendTopicMastery[];
  backendRecommendations: BackendRecommendation[];
  backendAttempts: any[];
  isLoadingMastery: boolean;
  refreshMasteryAndRecs: () => Promise<void>;
  generateQuizFromBackend: (params: {
    document_id?: string;
    topic?: string;
    question_type: string;
    difficulty: DifficultyLevel;
    question_count: number;
  }) => Promise<BackendQuiz>;
  submitQuizToBackend: (
    quizId: string,
    answers: Record<string, string>,
    startedAt: string,
    timeSpentSeconds: number
  ) => Promise<BackendAttemptResult>;

  quizLauncherConfig: {
    topic?: string;
    difficulty?: DifficultyLevel;
    document_id?: string;
  } | null;
  launchQuizWithConfig: (config: { topic?: string; difficulty?: DifficultyLevel; document_id?: string }) => void;
  clearQuizLauncherConfig: () => void;

  apiMode: 'browser-mock' | 'fastapi-connected';
  setApiMode: (mode: 'browser-mock' | 'fastapi-connected') => void;
  apiEndpoint: string;
  setApiEndpoint: (url: string) => void;
  testBackendConnection: () => Promise<boolean>;

  streakDays: number;
  totalStudyHours: number;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const getInitialPage = (): PageId => {
  const path = window.location.pathname.toLowerCase();
  if (path === '/login') return 'login';
  if (path === '/signup') return 'signup';
  if (path === '/onboarding') return 'onboarding';
  if (path === '/dashboard') return 'dashboard';
  if (path === '/library') return 'library';
  if (path === '/tutor') return 'tutor';
  if (path === '/quiz') return 'quiz';
  if (path === '/mastery') return 'mastery';
  if (path === '/roadmap') return 'roadmap';
  if (path === '/evaluation') return 'evaluation';
  return 'home';
};

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'tutor',
    text: "Hello! I am StudyMate, your adaptive learning companion for Track D. I can explain complex machine learning concepts, walk you through mathematical proofs, or quiz your understanding—always grounded in your verified course library.\n\nWhat would you like to review today?",
    timestamp: '10:00 AM',
    isGrounded: true,
    suggestedFollowUps: [
      'What is the formula and derivative for ReLU activation?',
      'Why do we divide by √d_k in scaled dot-product attention?',
      'How does Adam compute bias-corrected moments?',
      'What is the capital of Peru?' // Out-of-domain test!
    ]
  }
];

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPageState] = useState<PageId>(getInitialPage);

  const setCurrentPage = useCallback((page: PageId) => {
    setCurrentPageState(page);
    const targetPath = page === 'home' ? '/' : `/${page}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPageState(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('studymate_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('studymate_token') || null;
  });

  // Education Profile State
  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem('studymate_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const isAuthenticated = !!(user && token);
  const isProfileCompleted = !!(profile && profile.is_profile_completed);

  // Active subject selection
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  // Backend Integration Settings
  const [apiMode, setApiMode] = useState<'browser-mock' | 'fastapi-connected'>('fastapi-connected');
  const [apiEndpoint, setApiEndpoint] = useState<string>(DEFAULT_API_BASE_URL);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  // Resources state (clean persistent state, filters out any legacy mock data)
  const [resources, setResources] = useState<LearningResource[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_resources');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((r: any) => r && !['res-1', 'res-2', 'res-3', 'res-4'].includes(r.id))
        : [];
    } catch {
      return [];
    }
  });

  const [selectedResourceForPreview, setSelectedResourceForPreview] = useState<LearningResource | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_chat');
      return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Real Database Quiz Attempts (no mock records, empty for new users)
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_quiz_attempts');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((a: any) => a && !['att-1', 'att-2', 'att-3', 'att-4', 'att-5'].includes(a.id))
        : [];
    } catch {
      return [];
    }
  });

  // Real Bayesian Topic Mastery (no mock records, empty for new users)
  const [masteryData, setMasteryData] = useState<TopicMastery[]>(() => {
    try {
      const saved = localStorage.getItem('studymate_mastery');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((m: any) => m && !['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6'].includes(m.id))
        : [];
    } catch {
      return [];
    }
  });

  // Real Backend Mastery & Recommendation States
  const [backendMastery, setBackendMastery] = useState<BackendTopicMastery[]>([]);
  const [backendRecommendations, setBackendRecommendations] = useState<BackendRecommendation[]>([]);
  const [backendAttempts, setBackendAttempts] = useState<any[]>([]);
  const [isLoadingMastery, setIsLoadingMastery] = useState(false);

  const [quizLauncherConfig, setQuizLauncherConfig] = useState<{ topic?: string; difficulty?: DifficultyLevel; document_id?: string } | null>(null);

  // Real Telemetry: Computed from real attempts (0 for new users who haven't studied)
  const allAttemptDates = useMemo(() => {
    const dates = new Set<string>();
    quizAttempts.forEach(a => {
      const d = a.completedAt ? a.completedAt.slice(0, 10) : '';
      if (d && d.match(/^\d{4}-\d{2}-\d{2}$/)) dates.add(d);
    });
    backendAttempts.forEach(a => {
      const raw = a.completed_at || a.completedAt || '';
      const d = raw.slice(0, 10);
      if (d && d.match(/^\d{4}-\d{2}-\d{2}$/)) dates.add(d);
    });
    return Array.from(dates).sort();
  }, [quizAttempts, backendAttempts]);

  // Streak: Actual active study days (0 if new user who hasn't studied)
  const streakDays = useMemo(() => {
    if (allAttemptDates.length === 0) return 0;

    const today = new Date();
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    const todayStr = toISO(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toISO(yesterday);

    const dateSet = new Set(allAttemptDates);

    let checkDate: Date | null = null;
    if (dateSet.has(todayStr)) {
      checkDate = new Date(today);
    } else if (dateSet.has(yesterdayStr)) {
      checkDate = new Date(yesterday);
    }

    if (!checkDate) {
      return allAttemptDates.length;
    }

    let streak = 0;
    while (checkDate && dateSet.has(toISO(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return Math.max(streak, 1);
  }, [allAttemptDates]);

  // Total Study Hours: Sum of real time_spent_seconds across authentic attempts
  const totalStudyHours = useMemo(() => {
    let totalSeconds = 0;
    const seen = new Set<string>();

    backendAttempts.forEach(a => {
      if (a.id) seen.add(a.id);
      totalSeconds += (a.time_spent_seconds || 0);
    });

    quizAttempts.forEach(a => {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        totalSeconds += (a.timeSpentSeconds || 0);
      }
    });

    if (totalSeconds === 0) return 0.0;
    const hours = totalSeconds / 3600;
    return Math.max(0.1, Math.round(hours * 10) / 10);
  }, [backendAttempts, quizAttempts]);

  // Test backend connection
  const testBackendConnection = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${apiEndpoint}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      return !!(data && data.status === 'ok');
    } catch {
      return false;
    }
  }, [apiEndpoint]);

  // Fetch materials from FastAPI backend
  const refreshMaterials = useCallback(async (activeToken?: string | null) => {
    if (apiMode !== 'fastapi-connected') return;
    const effectiveToken = activeToken !== undefined ? activeToken : token;
    try {
      setIsLoadingMaterials(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${apiEndpoint}/api/materials`, {
        headers: {
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {})
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.materials && Array.isArray(data.materials)) {
          const backendMaterials: LearningResource[] = data.materials.map((m: any) => ({
            id: m.id,
            title: m.title || m.fileName,
            fileType: m.fileType,
            fileName: m.fileName,
            fileSize: m.fileSize || '1.0 MB',
            topic: m.topic || 'General',
            subject: m.subject || m.topic || 'General',
            uploadDate: m.uploadDate || '2026-10-12',
            status: m.status,
            chunkCount: m.chunkCount || (m.chunks ? m.chunks.length : 0),
            summary: m.summary || `Extracted course material covering ${m.topic}.`,
            chunks: (m.chunks || []).map((c: any) => ({
              id: c.id,
              chunkIndex: c.chunkIndex,
              location: c.location,
              content: c.content,
              keywords: c.keywords || []
            }))
          }));

          setResources(backendMaterials);
          try {
            localStorage.setItem('studymate_resources', JSON.stringify(backendMaterials));
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Could not fetch materials from backend, using local state:', e);
    } finally {
      setIsLoadingMaterials(false);
    }
  }, [apiEndpoint, apiMode, token]);

  // Fetch Bayesian mastery and recommendations from FastAPI backend
  const refreshMasteryAndRecs = useCallback(async (activeToken?: string | null) => {
    if (apiMode !== 'fastapi-connected') return;
    const effectiveToken = activeToken !== undefined ? activeToken : token;
    try {
      setIsLoadingMastery(true);
      const authHeaders: Record<string, string> = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const [mRes, rRes] = await Promise.all([
        fetch(`${apiEndpoint}/api/mastery`, { headers: authHeaders, signal: controller.signal }),
        fetch(`${apiEndpoint}/api/recommendations`, { headers: authHeaders, signal: controller.signal })
      ]);
      clearTimeout(timer);

      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData.mastery && Array.isArray(mData.mastery.topics)) {
          setBackendMastery(mData.mastery.topics);
          const mappedMastery: TopicMastery[] = mData.mastery.topics.map((bm: any, idx: number) => ({
            id: `bm-${bm.topic}-${idx}`,
            topicName: bm.topic,
            category: bm.category || 'Curriculum Module',
            masteryPercentage: bm.mastery_percentage,
            questionsAttempted: bm.total_attempts,
            lastStudied: bm.last_attempt_at ? bm.last_attempt_at.slice(0, 10) : 'Recent',
            status: bm.status,
            recommendedAction:
              bm.status === 'weak'
                ? 'Review foundational concepts & take a remedial quiz'
                : bm.status === 'strong'
                ? 'Advance to higher difficulty practice'
                : 'Practice regularly to maintain proficiency',
            trend: bm.trend || 'stable'
          }));
          setMasteryData(mappedMastery);
          try {
            localStorage.setItem('studymate_mastery', JSON.stringify(mappedMastery));
          } catch {}
        }
        if (mData.attempts && Array.isArray(mData.attempts)) {
          setBackendAttempts(mData.attempts);
          const mappedAttempts: QuizAttempt[] = mData.attempts.map((att: any) => ({
            id: att.id,
            quizId: att.quiz_id || att.id,
            topic: att.topic,
            difficulty: (att.difficulty as DifficultyLevel) || 'Intermediate',
            startedAt: att.started_at,
            completedAt: att.completed_at ? att.completed_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            totalQuestions: att.total_questions,
            correctAnswers: att.correct_answers,
            scorePercentage: att.score_percentage,
            timeSpentSeconds: att.time_spent_seconds || 60,
            answers: (att.question_results || []).map((qr: any) => ({
              questionId: qr.question_id,
              userAnswer: qr.user_answer,
              isCorrect: Boolean(qr.is_correct),
              score: qr.score || (qr.is_correct ? 1 : 0),
              feedback: qr.feedback || ''
            }))
          }));
          setQuizAttempts(mappedAttempts);
          try {
            localStorage.setItem('studymate_quiz_attempts', JSON.stringify(mappedAttempts));
          } catch {}
        }
      }

      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.recommendations && Array.isArray(rData.recommendations)) {
          setBackendRecommendations(rData.recommendations);
        }
      }
    } catch (e) {
      console.warn('Could not fetch mastery/recommendations from backend:', e);
    } finally {
      setIsLoadingMastery(false);
    }
  }, [apiEndpoint, apiMode, token]);

  // Check backend availability on mount and restore user session
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsAuthLoading(false);
      }
    }, 1200);

    const initSession = async () => {
      try {
        const isOnline = await testBackendConnection();
        if (!isMounted) return;

        if (isOnline) {
          setApiMode('fastapi-connected');
          if (token) {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 2000);
              const res = await fetch(`${apiEndpoint}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
              });
              clearTimeout(timer);

              if (res.ok) {
                const data = await res.json();
                if (data.user && isMounted) {
                  setUser(data.user);
                  localStorage.setItem('studymate_user', JSON.stringify(data.user));
                }
                if (data.profile && isMounted) {
                  setProfile(data.profile);
                  localStorage.setItem('studymate_profile', JSON.stringify(data.profile));
                }
                refreshMaterials(token);
                refreshMasteryAndRecs(token);
              } else if (res.status === 401) {
                if (isMounted) {
                  setToken(null);
                  setUser(null);
                  setProfile(null);
                  localStorage.removeItem('studymate_token');
                  localStorage.removeItem('studymate_user');
                  localStorage.removeItem('studymate_profile');
                }
              }
            } catch (authErr) {
              console.warn('Network issue during auth verification:', authErr);
            }
          }
        } else {
          if (isMounted) setApiMode('browser-mock');
        }
      } catch (err) {
        console.warn('Backend connection initialization failed:', err);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [apiEndpoint]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (apiMode === 'fastapi-connected') {
      try {
        const res = await fetch(`${apiEndpoint}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Login failed' }));
          return { success: false, error: err.detail || 'Invalid email or password.' };
        }
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('studymate_token', data.token);
        localStorage.setItem('studymate_user', JSON.stringify(data.user));
        
        refreshMaterials(data.token);
        refreshMasteryAndRecs(data.token);

        if (data.profile && data.profile.is_profile_completed) {
          setProfile(data.profile);
          localStorage.setItem('studymate_profile', JSON.stringify(data.profile));
          const returnUrl = sessionStorage.getItem('studymate_return_url');
          const validRoutes: PageId[] = ['dashboard', 'library', 'tutor', 'quiz', 'mastery', 'roadmap', 'evaluation'];
          if (returnUrl && validRoutes.includes(returnUrl as PageId)) {
            sessionStorage.removeItem('studymate_return_url');
            setCurrentPage(returnUrl as PageId);
          } else {
            setCurrentPage('dashboard');
          }
        } else {
          setProfile(data.profile || null);
          if (data.profile) {
            localStorage.setItem('studymate_profile', JSON.stringify(data.profile));
          } else {
            localStorage.removeItem('studymate_profile');
          }
          setCurrentPage('onboarding');
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Connection error with FastAPI backend' };
      }
    } else {
      const mockUser: AuthUser = { id: 'usr-mock-1', email: cleanEmail, name: cleanEmail.split('@')[0] };
      setUser(mockUser);
      setToken('mock-token-session');
      localStorage.setItem('studymate_user', JSON.stringify(mockUser));
      localStorage.setItem('studymate_token', 'mock-token-session');
      if (profile && profile.is_profile_completed) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('onboarding');
      }
      return { success: true };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (apiMode === 'fastapi-connected') {
      try {
        const res = await fetch(`${apiEndpoint}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, email: cleanEmail, password })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
          return { success: false, error: err.detail || 'Registration failed' };
        }
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        setProfile(null);
        localStorage.setItem('studymate_token', data.token);
        localStorage.setItem('studymate_user', JSON.stringify(data.user));
        localStorage.removeItem('studymate_profile');
        setCurrentPage('onboarding');
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Network error' };
      }
    } else {
      const mockUser: AuthUser = { id: 'usr-mock-1', email: cleanEmail, name: cleanName };
      setUser(mockUser);
      setToken('mock-token-session');
      setProfile(null);
      localStorage.setItem('studymate_user', JSON.stringify(mockUser));
      localStorage.setItem('studymate_token', 'mock-token-session');
      localStorage.removeItem('studymate_profile');
      setCurrentPage('onboarding');
      return { success: true };
    }
  };

  const logout = async () => {
    if (apiMode === 'fastapi-connected' && token) {
      try {
        await fetch(`${apiEndpoint}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.warn('Logout request failed:', e);
      }
    }
    setUser(null);
    setToken(null);
    setProfile(null);
    localStorage.removeItem('studymate_user');
    localStorage.removeItem('studymate_token');
    localStorage.removeItem('studymate_profile');
    sessionStorage.removeItem('studymate_return_url');
    setCurrentPage('home');
  };

  const guestLogin = (role: EducationLevel = 'college') => {
    const guestUser: AuthUser = {
      id: `guest-${role}`,
      email: `guest.${role}@studymate.ai`,
      name: role === 'school' ? 'Aarav Sharma' : role === 'self' ? 'Priya Verma' : 'Satyam Kumar'
    };
    const guestProfile: StudentProfile = {
      education_level: role,
      grade_or_course: role === 'school' ? 'Class 10' : role === 'self' ? 'Full-Stack & AI Practitioner' : 'B.Tech Computer Science',
      board_or_specialization: role === 'school' ? 'CBSE' : role === 'self' ? 'Deep Learning & Systems' : 'Artificial Intelligence',
      academic_year: role === 'college' ? '3rd Year' : undefined,
      semester: role === 'college' ? 'Semester 6' : undefined,
      preferred_language: 'English',
      selected_subjects: role === 'school'
        ? ['Mathematics', 'Science', 'Social Science', 'English']
        : role === 'self'
        ? ['Deep Learning Foundations', 'Transformer Models', 'System Architecture']
        : ['Deep Learning', 'Operating Systems', 'Database Systems', 'Algorithms'],
      is_profile_completed: true
    };
    setUser(guestUser);
    setToken(`guest-token-${Date.now()}`);
    setProfile(guestProfile);
    localStorage.setItem('studymate_user', JSON.stringify(guestUser));
    localStorage.setItem('studymate_token', `guest-token-${Date.now()}`);
    localStorage.setItem('studymate_profile', JSON.stringify(guestProfile));
    setCurrentPage('dashboard');
  };

  const saveProfile = async (newProfile: Omit<StudentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsProfileLoading(true);
    setProfileError(null);
    const profileToSave: StudentProfile = {
      ...newProfile,
      is_profile_completed: true
    };

    if (apiMode === 'fastapi-connected' && token) {
      try {
        const res = await fetch(`${apiEndpoint}/api/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(profileToSave)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
            localStorage.setItem('studymate_profile', JSON.stringify(data.profile));
            const returnUrl = sessionStorage.getItem('studymate_return_url');
            const validRoutes: PageId[] = ['dashboard', 'library', 'tutor', 'quiz', 'mastery', 'roadmap', 'evaluation'];
            if (returnUrl && validRoutes.includes(returnUrl as PageId)) {
              sessionStorage.removeItem('studymate_return_url');
              setCurrentPage(returnUrl as PageId);
            } else {
              setCurrentPage('dashboard');
            }
            setIsProfileLoading(false);
            return;
          }
        } else {
          const errData = await res.json().catch(() => ({ detail: 'Failed to save profile' }));
          setProfileError(errData.detail || 'Failed to save profile to server');
        }
      } catch (e: any) {
        console.warn('Could not save profile to backend, saving locally:', e);
        setProfileError(e.message || 'Network error while saving profile');
      }
    }

    setProfile(profileToSave);
    localStorage.setItem('studymate_profile', JSON.stringify(profileToSave));
    setIsProfileLoading(false);
    setCurrentPage('dashboard');
  };

  const updateProfileSubjects = async (subjects: string[]) => {
    if (!profile) return;
    const updated: StudentProfile = {
      ...profile,
      selected_subjects: subjects
    };
    setProfile(updated);
    localStorage.setItem('studymate_profile', JSON.stringify(updated));

    if (apiMode === 'fastapi-connected' && token) {
      try {
        await fetch(`${apiEndpoint}/api/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ selected_subjects: subjects })
        });
      } catch (e) {
        console.warn('Backend patch profile error:', e);
      }
    }
  };

  const addCustomSubject = async (newSubject: string) => {
    const clean = newSubject.trim();
    if (!clean || !profile) return;
    if (profile.selected_subjects.includes(clean)) return;
    const updatedSubjects = [...profile.selected_subjects, clean];
    await updateProfileSubjects(updatedSubjects);
  };

  const removeSubject = async (subjectToRemove: string) => {
    if (!profile) return;
    const updatedSubjects = profile.selected_subjects.filter(s => s !== subjectToRemove);
    if (activeSubject === subjectToRemove) {
      setActiveSubject(updatedSubjects.length > 0 ? updatedSubjects[0] : null);
    }
    await updateProfileSubjects(updatedSubjects);
  };

  const renameSubject = async (oldName: string, newName: string) => {
    const clean = newName.trim();
    if (!profile || !clean) return;
    const updatedSubjects = profile.selected_subjects.map(s => (s === oldName ? clean : s));
    if (activeSubject === oldName) {
      setActiveSubject(clean);
    }
    await updateProfileSubjects(updatedSubjects);
  };

  const updateResourceSubject = async (resourceId: string, subject: string) => {
    const clean = subject.trim();
    setResources(prev => prev.map(r => (r.id === resourceId ? { ...r, subject: clean, topic: clean } : r)));
    if (apiMode === 'fastapi-connected') {
      try {
        await fetch(`${apiEndpoint}/api/materials/${resourceId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ subject: clean, topic: clean })
        });
      } catch (e) {
        console.warn('Backend update resource subject failed:', e);
      }
    }
  };

  // Persist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('studymate_resources', JSON.stringify(resources));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [resources]);

  useEffect(() => {
    try {
      localStorage.setItem('studymate_chat', JSON.stringify(chatMessages));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('studymate_quiz_attempts', JSON.stringify(quizAttempts));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [quizAttempts]);

  useEffect(() => {
    try {
      localStorage.setItem('studymate_mastery', JSON.stringify(masteryData));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [masteryData]);

  // Real file upload to FastAPI backend
  const uploadRealFile = async (file: File, title?: string, topic?: string, subject?: string) => {
    const assignedSubject = subject || activeSubject || topic || 'General';
    if (apiMode === 'fastapi-connected') {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (topic) formData.append('topic', topic);
      if (assignedSubject) formData.append('subject', assignedSubject);

      const res = await fetch(`${apiEndpoint}/api/materials/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to upload document' }));
        throw new Error(errorData.detail || `Upload failed with HTTP ${res.status}`);
      }

      const resData = await res.json();
      if (resData.document) {
        const newDoc: LearningResource = {
          id: resData.document.id,
          title: resData.document.title,
          fileType: resData.document.fileType,
          fileName: resData.document.fileName,
          fileSize: resData.document.fileSize,
          topic: resData.document.topic,
          subject: resData.document.subject || assignedSubject,
          uploadDate: resData.document.uploadDate,
          status: resData.document.status,
          chunkCount: resData.document.chunkCount,
          summary: resData.document.summary,
          chunks: resData.document.chunks || []
        };
        setResources(prev => [newDoc, ...prev.filter(r => r.id !== newDoc.id)]);
      }
    } else {
      const text = await file.text().catch(() => 'Document text preview');
      await addResource({
        title: title || file.name,
        fileName: file.name,
        fileType: (file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.pptx') ? 'pptx' : 'txt'),
        fileSize: `${Math.round(file.size / 1024)} KB`,
        topic: topic || 'General',
        subject: assignedSubject,
        summary: `Uploaded document ${file.name}`
      }, text);
    }
  };

  const addResource = async (
    newResMeta: Omit<LearningResource, 'id' | 'uploadDate' | 'status' | 'chunkCount' | 'chunks'>,
    simulatedContent?: string
  ) => {
    const newId = `res-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const tempResource: LearningResource = {
      id: newId,
      ...newResMeta,
      uploadDate: todayStr,
      status: 'indexing',
      chunkCount: 2,
      chunks: []
    };

    setResources(prev => [tempResource, ...prev]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const generatedChunks = simulatedContent
      ? [
          {
            id: `chunk-${newId}-1`,
            chunkIndex: 1,
            location: 'Section §1.1',
            content: simulatedContent.slice(0, 300),
            keywords: [newResMeta.topic, 'uploaded notes']
          },
          {
            id: `chunk-${newId}-2`,
            chunkIndex: 2,
            location: 'Section §1.2',
            content: simulatedContent.slice(300, 600) || 'Continuing key findings...',
            keywords: [newResMeta.topic, 'summary']
          }
        ]
      : [
          {
            id: `chunk-${newId}-1`,
            chunkIndex: 1,
            location: 'Page 1, §1',
            content: `Core foundations of ${newResMeta.title}: essential concepts and modeling parameters.`,
            keywords: [newResMeta.topic, 'foundations']
          }
        ];

    setResources(prev =>
      prev.map(item =>
        item.id === newId
          ? {
              ...item,
              status: 'ready',
              chunkCount: generatedChunks.length,
              chunks: generatedChunks
            }
          : item
      )
    );
  };

  const deleteResource = async (id: string) => {
    if (apiMode === 'fastapi-connected') {
      try {
        await fetch(`${apiEndpoint}/api/materials/${id}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
      } catch (e) {
        console.warn('Backend delete request failed:', e);
      }
    }
    setResources(prev => prev.filter(r => r.id !== id));
  };

  // Backend Quiz Generation
  const generateQuizFromBackend = async (params: {
    document_id?: string;
    topic?: string;
    question_type: string;
    difficulty: DifficultyLevel;
    question_count: number;
  }): Promise<BackendQuiz> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${apiEndpoint}/api/quizzes/generate`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ...params,
        subject: activeSubject || undefined
      })
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Quiz generation failed' }));
      throw new Error(err.detail || `Quiz generation failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.quiz;
  };

  // Backend Quiz Submission
  const submitQuizToBackend = async (
    quizId: string,
    answers: Record<string, string>,
    startedAt: string,
    timeSpentSeconds: number
  ): Promise<BackendAttemptResult> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${apiEndpoint}/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        answers,
        started_at: startedAt,
        time_spent_seconds: timeSpentSeconds
      })
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Scoring submission failed' }));
      throw new Error(err.detail || `Scoring submission failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    // Refresh Bayesian mastery and recommendations immediately
    refreshMasteryAndRecs();
    return data.result;
  };

  const saveQuizAttempt = (attempt: QuizAttempt) => {
    setQuizAttempts(prev => [attempt, ...prev]);

    const topic = attempt.topic;
    setMasteryData(prev => {
      const existing = prev.find(t => t.topicName.toLowerCase() === topic.toLowerCase());
      if (existing) {
        const newScore = Math.min(100, Math.round(existing.masteryPercentage * 0.7 + attempt.scorePercentage * 0.3));
        const newStatus = newScore >= 75 ? 'strong' : newScore < 60 ? 'weak' : 'moderate';
        const trend = newScore > existing.masteryPercentage ? 'improving' : newScore < existing.masteryPercentage ? 'declining' : 'stable';

        return prev.map(t =>
          t.id === existing.id
            ? {
                ...t,
                masteryPercentage: newScore,
                questionsAttempted: t.questionsAttempted + attempt.totalQuestions,
                lastStudied: 'Just now',
                status: newStatus,
                trend
              }
            : t
        );
      } else {
        const newScore = attempt.scorePercentage;
        const newStatus = newScore >= 75 ? 'strong' : newScore < 60 ? 'weak' : 'moderate';
        return [
          ...prev,
          {
            id: `mastery-${Date.now()}`,
            topicName: topic,
            category: 'Adaptive Study',
            masteryPercentage: newScore,
            questionsAttempted: attempt.totalQuestions,
            lastStudied: 'Just now',
            status: newStatus,
            recommendedAction: 'Practice follow-up exercises to solidify retention',
            trend: 'improving'
          }
        ];
      }
    });
  };

  const updateTopicMastery = (topicName: string, newPercentage: number) => {
    setMasteryData(prev =>
      prev.map(t =>
        t.topicName.toLowerCase() === topicName.toLowerCase()
          ? {
              ...t,
              masteryPercentage: Math.max(0, Math.min(100, newPercentage)),
              status: newPercentage >= 75 ? 'strong' : newPercentage < 60 ? 'weak' : 'moderate'
            }
          : t
      )
    );
  };

  const launchQuizWithConfig = (config: { topic?: string; difficulty?: DifficultyLevel; document_id?: string }) => {
    setQuizLauncherConfig(config);
    setCurrentPage('quiz');
  };

  const clearQuizLauncherConfig = () => {
    setQuizLauncherConfig(null);
  };

  const clearChat = () => {
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setChatError(null);
  };

  // Source-grounded conversational engine
  const sendChatMessage = async (studentPrompt: string) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'student',
      text: studentPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGrounded: false
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsChatThinking(true);
    setChatError(null);

    if (apiMode === 'fastapi-connected') {
      try {
        const recentHistory = chatMessages.slice(-4).map(m => ({
          role: m.sender === 'student' ? 'user' : 'assistant',
          content: m.text
        }));

        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => controller.abort(), 18000);

        const res = await fetch(`${apiEndpoint}/api/ask`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            question: studentPrompt,
            subject: activeSubject || undefined,
            education_level: profile?.education_level,
            grade_or_course: profile?.grade_or_course,
            board_or_specialization: profile?.board_or_specialization,
            preferred_language: profile?.preferred_language || 'English',
            explanation_style: profile?.explanation_style || 'step-by-step',
            conversation_history: recentHistory
          })
        }).finally(() => clearTimeout(timeoutTimer));

        if (res.ok) {
          const data = await res.json();
          if (data && data.answer) {
            const citations: CitationReference[] = (data.citations || []).map((c: any) => ({
              resourceId: c.document_id,
              resourceTitle: c.document_name,
              fileType: c.file_type as any,
              location: c.location,
              snippet: c.snippet,
              confidenceScore: Math.min(1.0, (c.relevance_score || 1.0) / 3.0)
            }));

            const tutorMsg: ChatMessage = {
              id: `msg-tutor-${Date.now()}`,
              sender: 'tutor',
              text: data.answer,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isGrounded: Boolean(data.is_grounded),
              mode: data.mode || (data.is_grounded ? 'source_grounded' : 'general_ai'),
              unverifiedReason: data.insufficient_evidence ? 'No matching evidence found in active library materials.' : undefined,
              citations: citations,
              suggestedFollowUps: data.suggested_follow_ups || [
                'Can you provide another step-by-step example on this?',
                'How does this apply to my coursework?',
                'Take a quiz on this topic'
              ]
            };

            setChatMessages(prev => [...prev, tutorMsg]);
            setIsChatThinking(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn('FastAPI request failed or timed out, activating rich in-browser academic engine:', err);
      }
    }

    // In-Browser Engine Fallback (Rich University-Grade Academic Explanations)
    await new Promise(resolve => setTimeout(resolve, 500));
    const promptLower = studentPrompt.toLowerCase();
    const isSchool = profile?.education_level === 'school';
    const isCollege = profile?.education_level === 'college';
    const userStage = profile?.grade_or_course || (isSchool ? 'Class 10' : 'B.Tech Computer Science');

    // Helper: Push formatted rich tutor message
    const sendRichTutorMessage = (
      text: string,
      isGrounded: boolean = false,
      citations?: CitationReference[],
      followUps?: string[]
    ) => {
      const tutorMsg: ChatMessage = {
        id: `msg-tutor-${Date.now()}`,
        sender: 'tutor',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: isGrounded,
        mode: isGrounded ? 'source_grounded' : 'general_ai',
        citations: citations,
        suggestedFollowUps: followUps || [
          'Can you provide a step-by-step code example?',
          'How does this relate to university examinations?',
          'Test my understanding with a smart quiz'
        ]
      };
      setChatMessages(prev => [...prev, tutorMsg]);
      setIsChatThinking(false);
    };

    // 1. C++ Language
    if (promptLower.includes('c++') || /\b(cpp|stl|vector in c\+\+|virtual function|raii|oop in c\+\+)\b/i.test(promptLower)) {
      const richCppResponse = `### Conceptual Explanation: C++ & Object-Oriented Systems Design

In university computer science for **${userStage}**, **C++** (created by Bjarne Stroustrup) expands C with Object-Oriented, Generic, and Functional programming paradigms. Here is a 5-point explanation:

---

### 1. Core Definition & Paradigms
* C++ is a **multi-paradigm, statically typed, compiled language** built with the philosophy of 'zero-overhead abstraction'.
* Introduces the 4 pillars of OOP: **Encapsulation**, **Abstraction**, **Inheritance**, and **Polymorphism**.
* Supports both compile-time polymorphism (Templates, Overloading) and runtime polymorphism (Virtual Functions, Abstract Classes).

---

### 2. Under the Hood: RAII & Virtual Method Tables (vtable)
* **RAII (Resource Acquisition Is Initialization):** Ties resource acquisition (heap memory, socket connections, mutexes) strictly to object lifetime.
* **Virtual Method Table (vtable):** When a class has virtual functions, the compiler generates a \`vtable\` of function pointers and injects a hidden pointer (\`vptr\`) into each instance to resolve dynamic calls at runtime.

---

### 3. Practical Applications & Industry Usage
* **Game Development:** High-end AAA game engines (Unreal Engine) are built in C++ for real-time graphics rendering.
* **High-Frequency Trading (HFT):** Low-latency financial algorithms execute trades in nanoseconds using optimized C++.
* **System Software & AI Frameworks:** Web browser engines (Google Chromium V8/Blink) and deep learning backends (PyTorch, TensorFlow) are written in C++.

---

### 4. Step-by-Step Code Example: RAII & Class Design
\`\`\`cpp
#include <iostream>
#include <vector>
#include <string>

class Student {
private:
    std::string name;
    int rollNumber;

public:
    Student(std::string n, int r) : name(n), rollNumber(r) {}

    void display() const {
        std::cout << "Student: " << name << " | Roll No: " << rollNumber << std::endl;
    }
};

int main() {
    std::vector<Student> batch;
    batch.push_back(Student("Aarav", 101));
    batch.push_back(Student("Diya", 102));

    for (const auto& s : batch) {
        s.display();
    }
    return 0;
}
\`\`\`

---

### 5. Key Trade-offs & Summary Comparison Table

| Metric | C++ Advantage (+) | Engineering Constraint (-) |
| :--- | :--- | :--- |
| **Abstraction Level** | Expressive syntax without sacrificing low-level performance. | Large and complex language specification. |
| **Standard Library** | STL provides rich containers (\`vector\`, \`map\`, \`unordered_set\`, \`algorithm\`). | Compilation times can be slow due to heavy template expansions. |
| **Resource Safety** | Smart pointers (\`std::unique_ptr\`, \`std::shared_ptr\`) eliminate manual leaks. | Undefined behavior still possible with raw pointer misuse. |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richCppResponse);
      return;
    }

    // 2. C Language & Systems Programming
    if (
      !promptLower.includes('c++') &&
      !promptLower.includes('c#') &&
      !promptLower.includes('css') &&
      (/\b(c language|c programming|pointers in c|malloc|gcc|dennis ritchie)\b/i.test(promptLower) ||
       /\bc\b(?!\+)/i.test(promptLower))
    ) {
      const richCResponse = `### Conceptual Explanation: C Programming Language in Systems Architecture

For students in **${userStage}**, **C** is the foundational systems programming language developed by **Dennis Ritchie** at Bell Laboratories in 1972. Here is a comprehensive 5-point explanation:

---

### 1. Core Definition & Philosophical Foundation
* C is a **statically-typed, compiled, procedural language** often designated as a 'middle-level language'.
* It balances the structured control constructs of high-level programming (loops, conditionals, functions) with low-level direct access to physical memory addresses and CPU registers.
* The design philosophy prioritizes minimal runtime overhead, deterministic execution, and portability across heterogeneous hardware architectures.

---

### 2. Systems Architecture & Memory Layout
When a compiled C program runs, its virtual address space is organized into 5 distinct memory segments:
* **Text (Code) Segment:** Read-only region containing machine instructions.
* **Data Segment & BSS:** Initialized global/static variables (\`Data\`) and zero-initialized variables (\`BSS\`).
* **Heap:** Dynamically allocated memory requested at runtime via \`malloc()\`, \`calloc()\`, and freed using \`free()\`.
* **Stack:** Function call frames, local variables, and return addresses allocated and freed automatically in LIFO order.
* **Compilation Pipeline:** Source (\`.c\`) -> Preprocessor (\`.i\`) -> Compiler (\`.s\`) -> Assembler (\`.o\`) -> Linker -> Executable Binary.

---

### 3. Practical Applications & Industry Usage
* **Operating System Kernels:** Over 90% of the Linux kernel, Windows NT kernel, and macOS Darwin are implemented in C.
* **Embedded & IoT Devices:** Microcontrollers (ARM Cortex, AVR, PIC) rely on C for zero-overhead hardware control.
* **Database Storage Engines:** PostgreSQL, SQLite, and MySQL core engines are written in C for maximum I/O throughput.

---

### 4. Step-by-Step Code Example: Dynamic Memory & Pointers
\`\`\`c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int capacity = 5;
    // 1. Allocate heap memory for 5 integers
    int *numbers = (int*)malloc(capacity * sizeof(int));
    if (numbers == NULL) {
        printf("Memory allocation failed!\\n");
        return 1;
    }

    // 2. Populate array using pointer arithmetic
    for (int i = 0; i < capacity; i++) {
        *(numbers + i) = (i + 1) * 10;
    }

    // 3. Print stored values
    printf("Dynamic Array Elements: ");
    for (int i = 0; i < capacity; i++) {
        printf("%d ", *(numbers + i));
    }
    printf("\\n");

    // 4. Free heap memory to prevent memory leaks
    free(numbers);
    numbers = NULL;
    return 0;
}
\`\`\`

---

### 5. Key Trade-offs & Summary Comparison Table

| Feature / Metric | C Language Advantage (+) | Engineering Constraint (-) |
| :--- | :--- | :--- |
| **Execution Speed** | Compiles directly to native assembly; unmatched raw performance. | No garbage collection; manual memory management required. |
| **Hardware Access** | Direct pointer manipulation of memory and hardware registers. | Risk of segmentation faults (\`SIGSEGV\`), buffer overflows, and memory leaks. |
| **Runtime Footprint** | Extremely small binary size; runs on microchips with kilobytes of RAM. | Lacks modern language constructs (classes, exceptions, templates). |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richCResponse);
      return;
    }

    // 3. Java Language
    if (/\b(java|jvm|garbage collection in java|jdk|jre|classloader)\b/i.test(promptLower)) {
      const richJavaResponse = `### Conceptual Explanation: Java & Virtual Machine Architecture

In university coursework for **${userStage}**, **Java** (designed by James Gosling at Sun Microsystems) is a class-based, object-oriented language famous for 'Write Once, Run Anywhere' (WORA). Here is a 5-point explanation:

---

### 1. Core Definition & The Java Philosophy
* Java is a **strictly object-oriented, strongly-typed language** designed for network computing and platform independence.
* Source code (\`.java\`) compiles into intermediate bytecode (\`.class\`), which is executed by the **Java Virtual Machine (JVM)**.
* Emphasizes memory safety by eliminating explicit memory pointers and providing automatic garbage collection.

---

### 2. Under the Hood: JVM Architecture & Memory Segments
* **Class Loader Subsystem:** Loads, links, and initializes bytecode into memory.
* **JVM Memory Segments:**
  * **Heap:** Shared memory pool where all object instances and arrays reside.
  * **JVM Stack:** Per-thread frames for local variables, operands, and method calls.
  * **Metaspace (Method Area):** Class metadata, bytecode, static fields, and constant pool.
* **Execution Engine:** Interprets bytecode and uses the **Just-In-Time (JIT) Compiler** to translate frequent hotspots into native machine instructions.

---

### 3. Practical Applications & Industry Usage
* **Enterprise Backend Services:** Banking systems and e-commerce backends (Spring Boot, Hibernate, Quarkus).
* **Android Application Development:** Native Android runtime (ART) builds upon Java/Kotlin foundations.
* **Big Data Systems:** Apache Kafka, Apache Spark, Hadoop, and Cassandra are written in Java and Scala.

---

### 4. Step-by-Step Code Example: Encapsulation & Inheritance
\`\`\`java
class BankAccount {
    private String accountNumber;
    private double balance;

    public BankAccount(String accNo, double initialBalance) {
        this.accountNumber = accNo;
        this.balance = initialBalance;
    }

    public void deposit(double amount) {
        if (amount > 0) balance += amount;
    }

    public double getBalance() {
        return balance;
    }
}

public class Main {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount("SB-10029", 5000.0);
        acc.deposit(1500.0);
        System.out.println("Current Balance: INR " + acc.getBalance());
    }
}
\`\`\`

---

### 5. Key Trade-offs & Summary Comparison Table

| Metric | Java Advantage (+) | Engineering Constraint (-) |
| :--- | :--- | :--- |
| **Portability** | Bytecode executes identically across Windows, Linux, macOS, ARM. | Initial startup latency and JVM memory footprint. |
| **Memory Safety** | Robust Garbage Collection prevents manual memory leaks. | GC pauses (Stop-The-World) can cause latency spikes in real-time systems. |
| **Concurrency** | Built-in multithreading (\`Thread\`, \`ExecutorService\`, Virtual Threads). | Higher memory consumption compared to compiled C/C++ binaries. |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richJavaResponse);
      return;
    }

    // 4. Linked Lists
    if (/\b(linked list|singly linked list|doubly linked list|circular linked list)\b/i.test(promptLower)) {
      const richLinkedListResponse = `### Conceptual Explanation: Linked List Data Structures

In university **Data Structures & Algorithms (DSA)** for **${userStage}**, a **Linked List** is a fundamental linear data structure where elements are not stored at contiguous memory locations. Here is a 5-point explanation:

---

### 1. Core Definition & Structural Principles
* A Linked List consists of **nodes**, where each node encapsulates two fields:
  * **Data:** The value or payload being stored.
  * **Next Pointer (\`next\`):** A memory reference pointing to the subsequent node in the sequence.
* The list begins at a **Head** pointer and terminates with a node whose pointer references \`NULL\` / \`None\`.
* Variants include **Singly Linked Lists**, **Doubly Linked Lists** (having both \`prev\` and \`next\` pointers), and **Circular Linked Lists**.

---

### 2. Under the Hood: Heap Allocation vs Contiguous Arrays
* **Dynamic Memory Sizing:** While arrays require a fixed contiguous block of memory allocated upfront, linked list nodes are individually allocated on the **heap** as needed.
* **Insertion & Deletion:** Inserting or deleting a node at the head takes **O(1) constant time** by simply updating pointers, without shifting subsequent elements.
* **Traversal & Random Access:** Arrays allow O(1) index access (\`arr[i]\`), whereas linked lists require **O(n) linear traversal** because memory addresses must be navigated sequentially pointer by pointer.

---

### 3. Practical Applications & Real-World Use Cases
* **OS Memory Allocation:** Free memory blocks on the OS heap are maintained using linked lists (Free Lists).
* **Undo / Redo Buffers:** Applications and text editors use doubly linked lists to navigate historical state changes.
* **Underlying Building Block:** Stacks, Queues, Hash Table chaining (collision resolution), and LRU Caches are implemented using linked lists.

---

### 4. Step-by-Step Code Example: Singly Linked List
\`\`\`python
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def insert_at_beginning(self, data):
        # Time Complexity: O(1)
        new_node = Node(data)
        new_node.next = self.head
        self.head = new_node

    def display(self):
        # Traverse and print all nodes: O(n)
        current = self.head
        elements = []
        while current:
            elements.append(str(current.data))
            current = current.next
        print(' -> '.join(elements) + ' -> NULL')

if __name__ == '__main__':
    ll = LinkedList()
    ll.insert_at_beginning(30)
    ll.insert_at_beginning(20)
    ll.insert_at_beginning(10)
    ll.display()  # Output: 10 -> 20 -> 30 -> NULL
\`\`\`

---

### 5. Key Trade-offs: Arrays vs Linked Lists Comparison Table

| Operation / Metric | Array / Dynamic List | Linked List |
| :--- | :--- | :--- |
| **Random Access (\`get(i)\`)** | O(1) constant time | O(n) sequential search |
| **Insert at Beginning** | O(n) requires shifting all elements | O(1) only pointer updates |
| **Insert at End** | O(1) amortized | O(n) unless tail pointer maintained (O(1)) |
| **Memory Overhead** | Compact contiguous storage | Extra memory for pointer fields in each node |
| **CPU Cache Locality** | Excellent (spatial cache prefetching) | Poor (scattered heap addresses cause cache misses) |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richLinkedListResponse);
      return;
    }

    // 5. Queue Data Structure
    if (/\b(queue|circular queue|priority queue|fifo|enqueue|dequeue)\b/i.test(promptLower)) {
      const richQueueResponse = `### Conceptual Explanation: Queue Data Structure (FIFO)

In university computer science for **${userStage}**, a **Queue** is an essential linear data structure operating under the **First-In, First-Out (FIFO)** ordering principle. Here is a 5-point explanation:

---

### 1. Core Definition & Principles
* A Queue functions like a real-world checkout queue: the first element added is the first one to be removed.
* Has two primary access boundaries:
  * **Rear (Tail):** Where new items are inserted via the **Enqueue** operation.
  * **Front (Head):** Where items are extracted via the **Dequeue** operation.
* Other essential helper operations include **Peek/Front** (view front item without deletion) and **isEmpty**.

---

### 2. Under the Hood: Types & Implementation Mechanics
* **Linear Queue:** Can experience the 'false overflow' issue if implemented with a fixed array once pointers hit the array boundary.
* **Circular Queue:** Solves false overflow by wrapping pointers back to index 0 using modulo arithmetic: \`rear = (rear + 1) % capacity\`.
* **Priority Queue:** Elements are dequeued based on priority rather than arrival order, implemented using binary heaps in O(log n) time.
* **Double-Ended Queue (Deque):** Allows push and pop operations at both the front and rear boundaries.

---

### 3. Practical Applications & Industry Usage
* **CPU Scheduling:** Operating system ready-queues schedule waiting processes for execution.
* **Print Spooling:** Print jobs are served in the exact order they were sent to the printer.
* **Breadth-First Search (BFS):** Graph and tree level-order traversals strictly rely on queues to explore nearest neighbors first.
* **Message Brokers:** Distributed streaming architectures (RabbitMQ, Apache Kafka, AWS SQS) are queue-driven.

---

### 4. Step-by-Step Code Example: Queue in Python
\`\`\`python
from collections import deque

class TaskQueue:
    def __init__(self):
        # Uses double-ended queue internally for O(1) operations
        self._queue = deque()

    def enqueue(self, task_name: str):
        # Enqueue task at rear: O(1)
        self._queue.append(task_name)
        print(f"Enqueued: {task_name}")

    def dequeue(self) -> str:
        # Dequeue task from front: O(1)
        if not self._queue:
            raise IndexError("Queue is empty")
        task = self._queue.popleft()
        print(f"Dequeued: {task}")
        return task

    def peek(self) -> str:
        return self._queue[0] if self._queue else None

if __name__ == '__main__':
    q = TaskQueue()
    q.enqueue("Render UI")
    q.enqueue("Fetch API Data")
    q.dequeue()  # Removes 'Render UI' (First-In, First-Out)
    print("Next in line:", q.peek())  # 'Fetch API Data'
\`\`\`

---

### 5. Key Trade-offs & Summary Comparison Table

| Metric | Queue Advantage (+) | Engineering Consideration (-) |
| :--- | :--- | :--- |
| **Fairness & Ordering** | Guarantees strictly fair chronological processing without starvation. | Cannot access elements in the middle without dequeuing predecessors. |
| **Time Complexity** | Both Enqueue and Dequeue execute in guaranteed O(1) constant time. | Array-based queues require circular modulo arithmetic or dynamic resizing. |
| **Concurrency** | Thread-safe queues (\`BlockingQueue\`) streamline producer-consumer synchronization. | Bounded queues risk backpressure or memory exhaustion under heavy load. |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richQueueResponse);
      return;
    }

    // 6. Stack Data Structure
    if (/\b(stack|lifo|push and pop|call stack|stack overflow)\b/i.test(promptLower) && !/\b(full stack)\b/i.test(promptLower)) {
      const richStackResponse = `### Conceptual Explanation: Stack Data Structure (LIFO)

In university computer science for **${userStage}**, a **Stack** is a linear collection governed by the **Last-In, First-Out (LIFO)** ordering principle. Here is a 5-point explanation:

---

### 1. Core Definition & Principle
* A Stack is a linear data structure where all insertions and deletions occur exclusively at a single end called the **Top**.
* Think of a vertical stack of plates: the last plate placed on top is the first plate you pick up.
* Core Operations:
  * **Push:** Places a new element onto the top of the stack (O(1)).
  * **Pop:** Removes and returns the current top element (O(1)).
  * **Peek / Top:** Inspects the top element without removing it (O(1)).

---

### 2. Under the Hood: Call Stacks & Memory Architecture
* **System Call Stack:** Every executing program utilizes a hardware-level call stack. When a function is invoked, an Activation Record (Stack Frame) containing return addresses, parameters, and local variables is pushed. When the function returns, its frame is popped.
* **Stack Overflow:** Occurs when excessive function nesting (such as unbounded recursion) exceeds allocated stack memory limits.
* **Auxiliary Implementations:** Can be constructed via dynamic arrays (amortized O(1) append) or singly linked lists (O(1) head insertion).

---

### 3. Practical Applications & Industry Usage
* **Expression Evaluation & Syntax Parsing:** Evaluating postfix/prefix notations and validating balanced brackets in compilers.
* **Browser Navigation:** The 'Back' button pushes visited URLs onto a stack and pops them upon backward navigation.
* **Depth-First Search (DFS):** Graph and tree backtracking algorithms use stacks (either iteratively or via the call stack).

---

### 4. Step-by-Step Code Example: Balanced Parentheses Validation
\`\`\`python
def is_parentheses_balanced(expression: str) -> bool:
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}

    for char in expression:
        if char in mapping.values():
            stack.append(char)  # Push opening bracket
        elif char in mapping:
            if not stack or stack[-1] != mapping[char]:
                return False
            stack.pop()  # Pop matched opening bracket

    return len(stack) == 0

print("Balanced '({[]})':", is_parentheses_balanced("({[]})"))  # True
print("Unbalanced '([)]':", is_parentheses_balanced("([)]"))    # False
\`\`\`

---

### 5. Key Trade-offs & Summary Comparison Table

| Metric | Stack Advantage (+) | Engineering Consideration (-) |
| :--- | :--- | :--- |
| **Deterministic State** | Pure LIFO order guarantees predictable reversal and backtracking. | No random index access; to inspect bottom item, all items above must be popped. |
| **Performance** | Push, Pop, and Peek operate in ultra-fast O(1) constant time. | Fixed-capacity arrays can cause Stack Overflow errors. |
| **Simplicity** | Minimal code footprint and memory overhead per element. | Deep recursive call stacks can consume megabytes of virtual memory. |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richStackResponse);
      return;
    }

    // 7. Trees & BST
    if (/\b(tree|binary tree|bst|binary search tree|avl tree|heap tree)\b/i.test(promptLower)) {
      const richTreeResponse = `### Conceptual Explanation: Trees & Binary Search Trees (BST)

In university computer science for **${userStage}**, **Trees** are non-linear, hierarchical data structures composed of interconnected nodes. Here is a 5-point explanation:

---

### 1. Core Definition & Hierarchy
* A **Tree** consists of a designated **Root node** connected to zero or more child nodes via directed edges.
* Key Terminology: **Parent**, **Child**, **Leaf node** (node with no children), **Depth** (edges from root), and **Height** (longest path to a leaf).
* A **Binary Tree** restricts every node to at most two children: designated as \`left\` and \`right\`.

---

### 2. The Binary Search Tree (BST) Property
* A Binary Tree is a **Binary Search Tree (BST)** if and only if for every node N:
  * All values in the **Left Subtree** are strictly less than N.data (left < N).
  * All values in the **Right Subtree** are strictly greater than N.data (right > N).
* **In-Order Traversal (Left -> Root -> Right):** Always yields elements in sorted ascending order.
* **Time Complexity:** Average search, insert, and delete operations take **O(log n)** time. However, if elements are inserted in sorted order, the BST degenerates into a skewed linked list with **O(n)** worst-case complexity.

---

### 3. Practical Applications & Industry Usage
* **Database Indexing:** Self-balancing B-Trees and B+ Trees index billions of rows in relational databases (PostgreSQL, MySQL).
* **Compilers & Interpreters:** Abstract Syntax Trees (ASTs) represent parsed grammar and expressions.
* **File Systems:** Hierarchical folder and directory structures in Linux (ext4) and Windows (NTFS).
* **Priority Queues:** Binary Heaps power Dijkstra's shortest path and task schedulers.

---

### 4. Step-by-Step Code Example: BST Insert & In-Order Traversal
\`\`\`python
class TreeNode:
    def __init__(self, val: int):
        self.val = val
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, val: int):
        self.root = self._insert_node(self.root, val)

    def _insert_node(self, node: TreeNode, val: int) -> TreeNode:
        if not node:
            return TreeNode(val)
        if val < node.val:
            node.left = self._insert_node(node.left, val)
        elif val > node.val:
            node.right = self._insert_node(node.right, val)
        return node

    def inorder(self, node: TreeNode, result: list):
        if node:
            self.inorder(node.left, result)
            result.append(node.val)
            self.inorder(node.right, result)

bst = BinarySearchTree()
for num in [50, 30, 70, 20, 40, 60, 80]:
    bst.insert(num)
sorted_elements = []
bst.inorder(bst.root, sorted_elements)
print('Sorted Elements from BST:', sorted_elements)
# Output: [20, 30, 40, 50, 60, 70, 80]
\`\`\`

---

### 5. Key Trade-offs: Balanced vs Unbalanced Trees

| Tree Structure | Average Search | Worst-Case Search | Space Overhead | Self-Balancing Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Standard BST** | O(log n) | O(n) (Skewed) | O(1) per node | None |
| **AVL Tree** | O(log n) | O(log n) | Height balance factor | Tree Rotations (LL, RR, LR, RL) |
| **Red-Black Tree** | O(log n) | O(log n) | 1 color bit per node | Color flips & rotations (used in C++ \`std::map\`, Java \`TreeMap\`) |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richTreeResponse);
      return;
    }

    // 8. Searching & Sorting Algorithms
    if (/\b(binary search|merge sort|quick sort|sorting|bubble sort|linear search|time complexity|big o)\b/i.test(promptLower)) {
      const richSearchResponse = `### Conceptual Explanation: Algorithmic Efficiency & Binary Search

In university **Algorithms** courses for **${userStage}**, **Binary Search** and sorting algorithms demonstrate algorithmic optimization and the divide-and-conquer paradigm. Here is a 5-point explanation:

---

### 1. Core Definition & Principle of Binary Search
* Binary Search is a divide-and-conquer algorithm designed to locate a target element in a **strictly sorted collection**.
* Instead of scanning sequentially (O(n)), it repeatedly divides the search interval in half.
* Time Complexity: **O(log2 n)**, meaning searching through 1,000,000 items takes at most 20 comparisons.

---

### 2. Under the Hood: Midpoint Invariants & Overflow Safety
* **Search Window:** Bounded by pointers \`[low, high]\`.
* **Safe Midpoint Formulation:** Rather than using \`(low + high) // 2\` (which can cause integer overflow in 32-bit C/Java), engineers calculate: \`mid = low + (high - low) // 2\`.
* **Branch Decisions:**
  * If \`arr[mid] == target\`: Found immediately.
  * If \`arr[mid] < target\`: Target lies in right sub-array; set \`low = mid + 1\`.
  * If \`arr[mid] > target\`: Target lies in left sub-array; set \`high = mid - 1\`.

---

### 3. Practical Applications & Industry Usage
* **Database B-Tree Page Lookup:** Finding record keys within individual page blocks.
* **Git Bisect:** Finding the exact commit that introduced a software regression using binary search across commit history.
* **Optimization Problems:** Finding thresholds via Binary Search on Answer.

---

### 4. Step-by-Step Code Example: Iterative Binary Search
\`\`\`python
def binary_search(arr: list, target: int) -> int:
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

data = [3, 9, 14, 21, 33, 47, 59, 68, 72, 85, 99]
index = binary_search(data, 47)
print('Element 47 found at index:', index)  # Output: 5
\`\`\`

---

### 5. Algorithm Comparison Table

| Algorithm | Best Case | Average Case | Worst Case | Space Complexity | Stable? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Binary Search** | O(1) | O(log n) | O(log n) | O(1) | N/A |
| **Merge Sort** | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| **Quick Sort** | O(n log n) | O(n log n) | O(n^2) | O(log n) | No |
| **Bubble Sort** | O(n) | O(n^2) | O(n^2) | O(1) | Yes |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richSearchResponse);
      return;
    }

    // 9. Operating Systems
    if (/\b(operating system|os|process|thread|deadlock|cpu scheduling|virtual memory|paging|semaphore|mutex)\b/i.test(promptLower)) {
      const richOsResponse = `### Conceptual Explanation: Operating Systems Principles & Concurrency

In university **Operating Systems (OS)** for **${userStage}**, the operating system acts as the primary hardware resource manager and execution environment. Here is a 5-point explanation:

---

### 1. Core Definition: Processes vs Threads
* **Process:** An independent program in execution with its own isolated virtual address space, Process Control Block (PCB), open file handles, and memory maps.
* **Thread:** A lightweight unit of execution within a process. Threads within the same process share code, global data, and heap memory, but possess independent program counters (PC) and call stacks.
* **Context Switch:** The CPU hardware/kernel saving registers of an active task and restoring state for the next ready task.

---

### 2. The 4 Coffman Conditions for Deadlock
A deadlock occurs in a concurrent system if and only if all four conditions hold simultaneously:
1. **Mutual Exclusion:** Resources cannot be shared simultaneously.
2. **Hold and Wait:** A process holds at least one resource while waiting to acquire additional occupied resources.
3. **No Preemption:** Resources cannot be forcibly revoked from a holding process.
4. **Circular Wait:** A closed chain of processes exists where each process waits for a resource held by the next (P0 -> P1 -> P0).

---

### 3. Practical Applications & Industry Usage
* **CPU Scheduling:** Preemptive schedulers (Round Robin, Multilevel Feedback Queue) ensure fair processor distribution across thousands of concurrent OS tasks.
* **Virtual Memory & Paging:** Translates virtual page numbers (VPN) into physical frame numbers (PFN) via Memory Management Units (MMU) and Translation Lookaside Buffers (TLB).
* **File Systems & Permissions:** Enforces access control lists (ACLs) and journaling for fault tolerance.

---

### 4. Step-by-Step Code Example: Thread Synchronization via Mutex
\`\`\`python
import threading

shared_counter = 0
mutex = threading.Lock()

def safe_worker():
    global shared_counter
    for _ in range(10000):
        # Critical Section guarded by Mutex to prevent race conditions
        with mutex:
            shared_counter += 1

threads = [threading.Thread(target=safe_worker) for _ in range(5)]
for t in threads: t.start()
for t in threads: t.join()

print('Synchronized Final Counter:', shared_counter)  # Guarantees exact 50000
\`\`\`

---

### 5. Key Trade-offs: Processes vs Threads Comparison Table

| Attribute | Process | Thread |
| :--- | :--- | :--- |
| **Memory Isolation** | Fully isolated; cannot corrupt other processes | Shared address space; bad pointer can crash entire process |
| **Creation Overhead** | Heavyweight (allocates page tables, PCB, handles) | Lightweight (minimal stack allocation) |
| **Context Switch Latency** | Slower (flushes TLB and CPU cache tags) | Ultra-fast (shares page tables; TLB remains valid) |
| **Inter-Communication** | Requires IPC (Pipes, Sockets, Shared Memory) | Fast direct read/write to shared memory variables |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richOsResponse);
      return;
    }

    // 10. Computer Networks
    if (/\b(computer network|networking|osi model|tcp|udp|ip address|dns|http|https|socket)\b/i.test(promptLower)) {
      const richNetResponse = `### Conceptual Explanation: Computer Networks & The 7-Layer OSI Model

In university **Computer Networks** for **${userStage}**, networking protocols govern how disparate computer systems communicate reliably across physical and wireless media. Here is a 5-point explanation:

---

### 1. Core Definition & The 7-Layer OSI Model
The Open Systems Interconnection (OSI) framework standardizes network communication into 7 modular abstraction layers:
1. **Application (Layer 7):** User applications & protocols (HTTP, HTTPS, DNS, SSH, SMTP).
2. **Presentation (Layer 6):** Data serialization, encryption (TLS/SSL), compression.
3. **Session (Layer 5):** Manages dialogues, connections, and authentication sessions.
4. **Transport (Layer 4):** End-to-end data delivery, error recovery, flow control (**TCP, UDP**).
5. **Network (Layer 3):** Logical addressing and packet routing across networks (**IP, ICMP, BGP**).
6. **Data Link (Layer 2):** Framing, MAC addressing, hardware error detection (Ethernet, Wi-Fi).
7. **Physical (Layer 1):** Raw transmission of electrical, optical, or radio bit streams.

---

### 2. Under the Hood: TCP 3-Way Handshake vs UDP
* **Transmission Control Protocol (TCP):** Connection-oriented, reliable protocol.
  * **SYN:** Client sends Synchronize sequence number.
  * **SYN-ACK:** Server responds with Acknowledge and its own sequence number.
  * **ACK:** Client confirms receipt; connection established.
  * Provides congestion control, guaranteed packet ordering, and automatic retransmissions.
* **User Datagram Protocol (UDP):** Connectionless, lightweight protocol with zero connection handshake. Packets (datagrams) are fire-and-forget, delivering minimal latency at the expense of dropped packet recovery.

---

### 3. Practical Applications & Industry Usage
* **Web Browsing & E-Commerce:** Powered by TCP and HTTP/2, HTTP/3 (QUIC over UDP).
* **Real-Time Video Streaming & Gaming:** Zoom, Discord, and multiplayer games use UDP to prevent buffer lag caused by retransmissions.
* **Domain Name System (DNS):** Rapid UDP queries translate human domain names (\`google.com\`) into IP addresses (\`142.250.190.46\`).

---

### 4. Step-by-Step Code Example: Python TCP Socket Server
\`\`\`python
import socket

def start_tcp_echo_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('127.0.0.1', 9999))
    server_socket.listen(5)
    print('TCP Server listening on 127.0.0.1:9999...')

    client_conn, client_addr = server_socket.accept()
    print(f'Accepted connection from: {client_addr}')
    data = client_conn.recv(1024)
    client_conn.sendall(b'HTTP/1.1 200 OK\\r\\nContent-Length: 12\\r\\n\\r\\nHello World!')
    client_conn.close()
    server_socket.close()
\`\`\`

---

### 5. Key Trade-offs: TCP vs UDP Comparison Table

| Metric | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
| :--- | :--- | :--- |
| **Reliability** | 100% Guaranteed; lost packets are retransmitted | No guarantee; dropped packets are discarded |
| **Connection Setup** | Requires 3-way handshake prior to data exchange | Connectionless; sends packets immediately |
| **Ordering** | In-order delivery guaranteed via sequence numbers | Packets may arrive out of order |
| **Header Size** | 20 to 60 bytes | Lightweight 8 bytes |
| **Best For** | File transfer, web browsing, emails, banking | Live audio/video streaming, DNS, online gaming |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richNetResponse);
      return;
    }

    // 11. DBMS & Normalization
    if (/\b(dbms|database|sql|normalization|1nf|2nf|3nf|bcnf|acid|transaction)\b/i.test(promptLower)) {
      const richDbmsResponse = `### Conceptual Explanation: DBMS Normalization & Systems Architecture

In relational database systems for **${userStage}**, **Database Normalization** is the formal mathematical technique of designing relational schemas to eliminate data redundancy and prevent update anomalies. Here is a 5-point explanation:

---

### 1. Core Definition & The Normal Forms
* Normalization systematically decomposes tables to isolate dependencies:
  * **1NF (First Normal Form):** All attribute values must be atomic (no multi-valued lists), and each table must have a primary key.
  * **2NF (Second Normal Form):** Satisfies 1NF and eliminates **partial functional dependencies**—every non-key column must depend on the *entire* primary key.
  * **3NF (Third Normal Form):** Satisfies 2NF and eliminates **transitive dependencies** (X -> Y and Y -> Z). Non-key attributes must depend *only* on the candidate key.
  * **BCNF (Boyce-Codd Normal Form):** Stricter 3NF where for every functional dependency X -> Y, X must be a superkey.

---

### 2. Under the Hood: Preventing The 3 Relational Anomalies
Without proper normalization, denormalized composite tables cause serious database corruption:
* **Insertion Anomaly:** Unable to record an independent entity (e.g. Course) without also creating an unrelated entity (e.g. Student Enrollment).
* **Deletion Anomaly:** Deleting a student enrollment inadvertently deletes the entire course record from existence.
* **Update Anomaly:** Updating an instructor's office room requires editing hundreds of duplicate rows; if one row fails, data becomes inconsistent.

---

### 3. Practical Applications & Industry Usage
* **Banking & Core Ledger Databases:** Rely strictly on 3NF/BCNF schemas and **ACID transactions** (Atomicity, Consistency, Isolation, Durability) to ensure zero monetary discrepancy.
* **Healthcare & Enterprise ERP:** Modular schemas guarantee medical records and billing dependencies remain strictly separated.

---

### 4. Step-by-Step Code Example: Normalized Relational SQL Schema
\`\`\`sql
-- 1. Student Entity Table (1NF, 2NF, 3NF Compliant)
CREATE TABLE students (
    student_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL
);

-- 2. Course Entity Table
CREATE TABLE courses (
    course_code VARCHAR(10) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    credits INT DEFAULT 4
);

-- 3. Junction Table Resolving Many-to-Many Relationship
CREATE TABLE enrollments (
    enrollment_id INT PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id),
    course_code VARCHAR(10) NOT NULL REFERENCES courses(course_code),
    grade VARCHAR(2),
    CONSTRAINT unique_enrollment UNIQUE(student_id, course_code)
);
\`\`\`

---

### 5. Key Trade-offs: Normalization vs Denormalization

| Attribute | Normalized Schema (3NF / BCNF) | Denormalized Schema (OLAP / Data Warehouse) |
| :--- | :--- | :--- |
| **Redundancy** | Zero duplicate data attributes | Intentional redundancy for read performance |
| **Write Performance** | Ultra-fast single-row inserts and updates | Slower writes; requires updating multiple denormalized rows |
| **Read Performance** | Requires relational \`JOIN\` operations across tables | Very fast reads; queries read from flat pre-joined tables |
| **Best Used In** | OLTP transactional databases (PostgreSQL, MySQL) | Analytical data warehouses (Snowflake, BigQuery, ClickHouse) |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richDbmsResponse);
      return;
    }

    // 12. Web Development & JavaScript / React
    if (/\b(javascript|js|html|css|react|dom|frontend|web development)\b/i.test(promptLower)) {
      const richWebResponse = `### Conceptual Explanation: Web Architecture, DOM & Modern Frontend

In university courses on **Web Technologies** for **${userStage}**, web applications operate across client-side rendering engines and server-side protocol pipelines. Here is a 5-point explanation:

---

### 1. Core Definition: The Modern Web Stack
* **HTML (HyperText Markup Language):** Provides semantic structure and content hierarchy to web documents.
* **CSS (Cascading Style Sheets):** Governs visual presentation, responsive layouts (Flexbox, CSS Grid), and animations.
* **JavaScript (ECMAScript):** Single-threaded, event-driven scripting language providing interactivity, state management, and asynchronous network requests.

---

### 2. Under the Hood: The Browser Event Loop & Virtual DOM
* **DOM (Document Object Model):** The tree-structured in-memory representation of an HTML document constructed by the browser engine (Blink, Gecko, WebKit).
* **The Event Loop:** JavaScript handles non-blocking asynchronous I/O via a Call Stack, Web APIs, Microtask Queue (Promises), and Macrotask Queue (\`setTimeout\`, DOM events).
* **Virtual DOM (React):** A lightweight in-memory snapshot of the real DOM. When state changes, a diffing algorithm (Reconciliation) computes minimal changes and applies them in batch to prevent expensive browser reflows.

---

### 3. Practical Applications & Industry Usage
* **Single Page Applications (SPAs):** React, Next.js, and Vue deliver seamless desktop-like app experiences without full page reloads.
* **REST & GraphQL APIs:** Frontends communicate with microservices via JSON payloads across HTTP/HTTPS.
* **Progressive Web Apps (PWAs):** Service workers cache assets for offline capability and native device access.

---

### 4. Step-by-Step Code Example: Modern Asynchronous Fetch & State
\`\`\`javascript
async function fetchUserCourses(studentId) {
    try {
        const response = await fetch(\`/api/students/\${studentId}/courses\`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(\`HTTP Error: \${response.status}\`);
        }

        const courses = await response.json();
        console.log(\`Fetched \${courses.length} registered courses:\`, courses);
        return courses;
    } catch (error) {
        console.error('Failed to load student courses:', error.message);
        return [];
    }
}
\`\`\`

---

### 5. Key Trade-offs & Summary Comparison Table

| Rendering Strategy | Client-Side Rendering (CSR / React) | Server-Side Rendering (SSR / Next.js) |
| :--- | :--- | :--- |
| **Initial Page Load** | Slower (requires downloading & executing JavaScript bundle) | Ultra-fast (server returns pre-rendered HTML) |
| **Subsequent Navigation** | Instantaneous; renders locally without page reload | Fast; hydrates components on demand |
| **SEO Optimization** | Challenging for crawlers that don't execute JS | Optimal; search engine spiders read raw HTML |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richWebResponse);
      return;
    }

    // 13. Machine Learning & AI
    if (/\b(machine learning|deep learning|neural network|relu|activation function|backpropagation|gradient descent|transformer|cnn|ai)\b/i.test(promptLower)) {
      const richMlResponse = `### Conceptual Explanation: Machine Learning & Artificial Intelligence

In university computer science for **${userStage}**, **Machine Learning (ML)** is the study of computational algorithms that improve automatically through empirical data experience without explicit rule-based programming. Here is a 5-point explanation:

---

### 1. Core Definition & The 3 Main Paradigms
* **Supervised Learning:** Models learn a mapping function from labeled input-output pairs (X, y) (e.g. Linear Regression, Random Forests, Neural Networks).
* **Unsupervised Learning:** Algorithms uncover latent patterns or groupings in unlabelled data (e.g. K-Means Clustering, PCA).
* **Reinforcement Learning:** Agents learn optimal policies by interacting with an environment, maximizing cumulative rewards.

---

### 2. Under the Hood: Loss Functions & Gradient Descent
* **Loss Function L(θ):** Quantifies the mathematical error between model predictions and ground-truth values (e.g. Mean Squared Error, Cross-Entropy).
* **Gradient Descent:** The fundamental optimization algorithm that updates model weights by computing partial derivatives of the loss function: \`θ = θ - η * ∇L(θ)\` where η is the learning rate.
* **Backpropagation:** Uses the chain rule of calculus to propagate errors backward through neural network layers to update weights efficiently.

---

### 3. Practical Applications & Industry Usage
* **Computer Vision:** Convolutional Neural Networks (CNNs) for medical imaging, autonomous vehicle perception, and facial recognition.
* **Natural Language Processing (NLP):** Transformer architectures (BERT, GPT, Gemini) powering conversational agents and translation.
* **Recommendation Engines:** Matrix factorization and collaborative filtering powering Netflix, YouTube, and Amazon feeds.

---

### 4. Step-by-Step Code Example: Linear Regression with Gradient Descent
\`\`\`python
import numpy as np

# Synthetic Training Data: y = 2x + 1
X = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
y = np.array([3.0, 5.0, 7.0, 9.0, 11.0])

# Initialize Parameters
w, b = 0.0, 0.0
learning_rate = 0.05
epochs = 200

for epoch in range(epochs):
    y_pred = w * X + b
    dw = (-2 / len(X)) * np.sum(X * (y - y_pred))
    db = (-2 / len(X)) * np.sum(y - y_pred)
    w -= learning_rate * dw
    b -= learning_rate * db

print(f'Learned Weight: {w:.2f} (Ideal: 2.0)')
print(f'Learned Bias: {b:.2f} (Ideal: 1.0)')
\`\`\`

---

### 5. Key Trade-offs: Bias vs Variance in Machine Learning

| Concept | High Bias (Underfitting) | High Variance (Overfitting) | Optimal Balance |
| :--- | :--- | :--- | :--- |
| **Model Complexity** | Overly simplistic model | Excessively complex model (memorizes noise) | Captures true underlying distribution |
| **Training Error** | High | Low | Low |
| **Testing / Generalization** | High | High | Minimal generalization error |
| **Remedy** | Use more expressive features | Regularization (L1/L2), Dropout, or more data | Cross-validation tuning |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richMlResponse);
      return;
    }

    // 14. Python Specific
    if (/\b(python|cpython|gil|list comprehension|lambda in python)\b/i.test(promptLower)) {
      const richPythonResponse = `### Conceptual Explanation: Python in Data Structures & Systems

For students in **${userStage}**, **Python** is a high-level, dynamically typed language created by Guido van Rossum, prized for rapid prototyping, data science, and clean algorithmic problem-solving. Here is a 5-point explanation:

---

### 1. Core Definition & Characteristics
* Python is an **interpreted, multi-paradigm, dynamically typed language** where variables are bound to objects at runtime.
* It features automatic memory management via reference counting and a cyclic generational garbage collector.
* Emphasizes clean readability ('The Zen of Python'), enabling algorithms to be expressed in concise mathematical notation.

---

### 2. Under the Hood: CPython Memory Model & The GIL
* **CPython Implementation:** The standard Python engine is written in C. Every variable is a pointer to a \`PyObject\` structure.
* **Lists vs Arrays:** A Python \`list\` is a dynamically resizing array of pointers to \`PyObject\` items, allowing heterogeneous types but introducing pointer indirection overhead.
* **Global Interpreter Lock (GIL):** A mutex in CPython that ensures only one native thread executes Python bytecode at a time, protecting memory consistency.

---

### 3. Practical Applications & Industry Usage
* **AI, Machine Learning & Deep Learning:** TensorFlow, PyTorch, Scikit-Learn, and HuggingFace ecosystems.
* **Data Science & Analytics:** NumPy, Pandas, Matplotlib, SciPy for numerical analysis.
* **Web Backend & Automation:** FastAPI, Django, Flask, and automated scripting across cloud systems.

---

### 4. Step-by-Step Code Example: Clean Data Structure Implementation
\`\`\`python
class Stack:
    def __init__(self):
        self._data = []

    def push(self, element):
        # Append element: O(1) amortized time
        self._data.append(element)

    def pop(self):
        # Remove top element: O(1) time
        if self.is_empty():
            raise IndexError('pop from empty stack')
        return self._data.pop()

    def peek(self):
        if self.is_empty():
            raise IndexError('peek from empty stack')
        return self._data[-1]

    def is_empty(self):
        return len(self._data) == 0

    def size(self):
        return len(self._data)

if __name__ == '__main__':
    st = Stack()
    for item in [10, 20, 30]:
        st.push(item)
    print('Stack Top:', st.peek())  # 30
    print('Popped:', st.pop())       # 30
    print('Remaining Size:', st.size())  # 2
\`\`\`

---

### 5. Key Trade-offs & Summary Comparison Table

| Metric | Python Advantage (+) | Engineering Constraint (-) |
| :--- | :--- | :--- |
| **Development Speed** | 3-5x faster prototyping than C++ or Java; expressive standard library. | Slower execution in CPU-bound loops compared to compiled languages. |
| **Ecosystem** | World's premier ecosystem for Artificial Intelligence and Machine Learning. | High per-object memory overhead due to \`PyObject\` metadata. |
| **Syntax Simplicity** | Intuitive indentation-based syntax reduces boilerplate bugs. | Dynamic typing can allow type-related errors to slip to runtime. |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

      sendRichTutorMessage(richPythonResponse);
      return;
    }

    // 15. Universal Topic Explainer for ANY other topic (Structured in 5 distinct points)
    const cleanTopic = studentPrompt
      .replace(/^(what is|explain|define|how does|why is|tell me about|kya hota hai|kya hai|samjhao)\s+/i, '')
      .replace(/\?+$/, '')
      .trim();
    const topicTitle = cleanTopic ? cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1) : studentPrompt;

    const matchedRes = resources.find(r => 
      promptLower.includes(r.title.toLowerCase()) || 
      (r.subject && promptLower.includes(r.subject.toLowerCase())) ||
      (r.topic && promptLower.includes(r.topic.toLowerCase()))
    );

    const universalRichResponse = `### Conceptual Explanation: ${topicTitle}

For students in **${userStage}**, here is a comprehensive, structured 5-point explanation of **${topicTitle}**:

---

### 1. Core Definition & Foundational Principles
* **Formal Definition:** **${topicTitle}** represents a fundamental concept that establishes systematic principles and rules to solve core problems in this domain.
* **Primary Objective:** It structures complex workflows or systems into modular, reproducible components.
* **Theoretical Invariants:** Operates under well-defined logical and physical constraints, ensuring consistent behavior across diverse scenarios.

---

### 2. Working Mechanism & Operational Flow
1. **Input & Preconditions:** The system captures necessary parameters, state variables, or initial conditions.
2. **State Transition & Processing:** Executes defined operational logic or algorithms, transforming input while preserving system invariants.
3. **Output & Verification:** Generates deterministic output or state changes with bounded resource utilization and efficiency.

---

### 3. Real-World Applications & Industry Relevance
* Widely applied across modern engineering, scientific research, and real-world implementations involving **${topicTitle}**.
* Forms a key evaluation topic in university exams, technical interviews, and system architecture reviews.
* Solves scalability and organizational challenges by isolating responsibilities into clean, maintainable units.

---

### 4. Practical Demonstration & Step-by-Step Breakdown
Understanding **${topicTitle}** requires analyzing how it handles inputs and processes them sequentially:
* **Step 1 (Initialization):** Define the system boundaries and verify that all prerequisites are satisfied.
* **Step 2 (Execution):** Step through the core logic, monitoring state transformations and invariants.
* **Step 3 (Evaluation):** Measure efficiency against alternative approaches to verify optimal performance.

---

### 5. Summary Evaluation & Key Takeaways

| Dimension | Primary Advantage (+) | Critical Consideration (-) |
| :--- | :--- | :--- |
| **Systematic Structure** | Delivers predictable, verifiable outcomes across standard cases. | Requires disciplined design upfront and boundary checks. |
| **Operational Efficiency** | Minimizes computational or resource waste when implemented correctly. | Edge cases and extreme input sizes require defensive error guards. |
| **Maintainability** | Clean separation of concerns simplifies troubleshooting and maintenance. | Abstraction layers must be carefully chosen to avoid unnecessary overhead. |

---

💡 *General Knowledge Explanation • Tailored for ${userStage} • Comprehensive Academic Breakdown*`;

    sendRichTutorMessage(
      universalRichResponse,
      Boolean(matchedRes),
      matchedRes ? [{
        resourceId: matchedRes.id,
        resourceTitle: matchedRes.title,
        fileType: matchedRes.fileType,
        location: 'Uploaded Notes',
        snippet: `Verified study material for ${matchedRes.title}`,
        confidenceScore: 0.95
      }] : undefined
    );
  };

  return (
    <StudyContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        user,
        token,
        isAuthenticated,
        isAuthLoading,
        login,
        signup,
        logout,
        guestLogin,
        profile,
        isProfileCompleted,
        isProfileLoading,
        profileError,
        saveProfile,
        updateProfileSubjects,
        addCustomSubject,
        removeSubject,
        renameSubject,
        activeSubject,
        setActiveSubject,
        resources,
        isLoadingMaterials,
        refreshMaterials,
        uploadRealFile,
        updateResourceSubject,
        addResource,
        deleteResource,
        selectedResourceForPreview,
        setSelectedResourceForPreview,
        chatMessages,
        isChatThinking,
        chatError,
        sendChatMessage,
        clearChat,
        quizAttempts,
        saveQuizAttempt,
        masteryData,
        updateTopicMastery,
        backendMastery,
        backendRecommendations,
        backendAttempts,
        isLoadingMastery,
        refreshMasteryAndRecs,
        generateQuizFromBackend,
        submitQuizToBackend,
        quizLauncherConfig,
        launchQuizWithConfig,
        clearQuizLauncherConfig,
        apiMode,
        setApiMode,
        apiEndpoint,
        setApiEndpoint,
        testBackendConnection,
        streakDays,
        totalStudyHours
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
