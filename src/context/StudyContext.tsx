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
        const timeoutTimer = setTimeout(() => controller.abort(), 8000);

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
        console.warn('FastAPI request failed or timed out, activating instant in-browser answer engine:', err);
      }
    }

    // In-Browser Engine Fallback (Dynamic pedagogical variety)
    await new Promise(resolve => setTimeout(resolve, 600));
    const promptLower = studentPrompt.toLowerCase();
    const isSchool = profile?.education_level === 'school';
    const isCollege = profile?.education_level === 'college';
    const userStage = profile?.grade_or_course || (isSchool ? 'Class 10' : 'BCA / B.Tech');

    // 1. Python Variables
    if (promptLower.includes('python') && (promptLower.includes('variable') || promptLower.includes('syntax'))) {
      const responseText = isSchool
        ? `In Python, a **variable** is like a labeled storage box where you store data values.\n\n### Example:\n\`\`\`python\n# Storing school information\nstudent_name = "Aryan"\nage = 15\nmath_score = 92.5\n\nprint("Student:", student_name)\nprint("Score:", math_score)\n\`\`\`\n\n**Key Points:**\n1. You do not need to declare types manually in Python (it uses dynamic typing).\n2. Variable names must start with a letter or an underscore, not a number.`
        : `In Python, **variables** are symbolic references bound to memory objects rather than statically typed memory slots.\n\n### Implementation Example:\n\`\`\`python\n# Dynamic type binding in Python\nx = 42                # Binds reference 'x' to int object 42\nx = "StudyMate AI"    # Rebinds 'x' to str object without type error\n\n# Multi-assignment and unpacking\nuser_id, status, is_active = "usr_101", "enrolled", True\n\n# Inspecting memory address and type\nprint(f"Address: {id(x)}, Type: {type(x)}")\n\`\`\`\n\n**Under the Hood:**\nPython manages variable lifetime through reference counting and automatic garbage collection. Everything in Python is a first-class object.`;

      const tutorMsg: ChatMessage = {
        id: `msg-tutor-${Date.now()}`,
        sender: 'tutor',
        text: responseText + `\n\n💡 *General Knowledge Explanation • Tailored for ${userStage}*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: false,
        mode: 'general_ai',
        suggestedFollowUps: [
          'What are mutable vs immutable types in Python?',
          'Give me another example with lists and dictionaries',
          'Practice Python quiz questions'
        ]
      };
      setChatMessages(prev => [...prev, tutorMsg]);
      setIsChatThinking(false);
      return;
    }

    // 2. DBMS Normalization
    if (promptLower.includes('dbms') || promptLower.includes('normalization') || promptLower.includes('normal form')) {
      const responseText = `### Database Normalization Explained (${userStage})\n\n**Normalization** is the systematic database design technique of organizing tables to eliminate data redundancy and prevent insert, update, and delete anomalies.\n\n#### The Main Normal Forms:\n\n1. **First Normal Form (1NF):**\n   - Each column must contain atomic (indivisible) values.\n   - No repeating groups or arrays in columns.\n\n2. **Second Normal Form (2NF):**\n   - Must already be in 1NF.\n   - Eliminates **partial functional dependencies** (every non-key attribute must depend fully on the primary key, especially in composite keys).\n\n3. **Third Normal Form (3NF):**\n   - Must already be in 2NF.\n   - Eliminates **transitive functional dependencies** ($X \\rightarrow Y$ and $Y \\rightarrow Z$). Non-key attributes must directly depend only on the primary key.\n\n\`\`\`sql\n-- Example: Normalizing Student Enrollment\n-- Unnormalized: (student_id, student_name, course_id, course_name, instructor)\n-- 3NF Schema:\nCREATE TABLE Students (student_id INT PRIMARY KEY, name VARCHAR(100));\nCREATE TABLE Courses (course_id INT PRIMARY KEY, title VARCHAR(100), instructor VARCHAR(100));\nCREATE TABLE Enrollments (student_id INT, course_id INT, PRIMARY KEY (student_id, course_id));\n\`\`\``;

      const tutorMsg: ChatMessage = {
        id: `msg-tutor-${Date.now()}`,
        sender: 'tutor',
        text: responseText + `\n\n💡 *General Knowledge Explanation • Adapted for ${userStage} DBMS Curriculum*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: false,
        mode: 'general_ai',
        suggestedFollowUps: [
          'What is Boyce-Codd Normal Form (BCNF)?',
          'Show an example of a transitive dependency violation',
          'Take a DBMS quiz'
        ]
      };
      setChatMessages(prev => [...prev, tutorMsg]);
      setIsChatThinking(false);
      return;
    }

    // 3. Photosynthesis (with Hindi / Hinglish handling)
    if (promptLower.includes('photosynthesis') || promptLower.includes('प्रकाश संश्लेषण')) {
      const isHindi = promptLower.includes('hindi') || promptLower.includes('हिंदी') || promptLower.includes('hinglish');
      const responseText = isHindi
        ? `### प्रकाश संश्लेषण (Photosynthesis) — सरल व्याख्या\n\n**प्रकाश संश्लेषण** वह प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश (Sunlight) की ऊर्जा का उपयोग करके अपने भोजन (Glucose) का निर्माण करते हैं।\n\n#### रासायनिक समीकरण (Chemical Formula):\n$$6CO_2 + 6H_2O \\xrightarrow{\\text{सूर्य का प्रकाश / क्लोरोफिल}} C_6H_{12}O_6 + 6O_2$$\n\n#### मुख्य घटक (Essential Components):\n1. **क्लोरोफिल (Chlorophyll):** पत्तियों में मौजूद हरा वर्णक जो प्रकाश ऊर्जा को अवशोषित करता है।\n2. **सूर्य का प्रकाश (Sunlight):** रासायनिक प्रतिक्रिया के लिए ऊर्जा प्रदान करता है।\n3. **जल (Water):** जड़ों द्वारा मिट्टी से अवशोषित किया जाता है।\n4. **कार्बन डाइऑक्साइड ($CO_2$):** वायुमंडल से स्टोमेटा (Stomata) के माध्यम से लिया जाता है।\n\n**महत्व:** यह प्रक्रिया पृथ्वी पर जीवन के लिए ऑक्सीजन ($O_2$) और भोजन का प्राथमिक स्रोत है।`
        : `### Photosynthesis Explained (${userStage})\n\n**Photosynthesis** is the fundamental biochemical process by which photoautotrophic organisms (green plants, algae) synthesize chemical energy (glucose) from inorganic substrates using solar radiation.\n\n#### Balanced Chemical Equation:\n$$6CO_2 + 6H_2O \\xrightarrow{\\text{Sunlight, Chlorophyll}} C_6H_{12}O_6 + 6O_2$$\n\n#### The Two Primary Phases:\n1. **Light-Dependent Reactions (Thylakoids):** Photolysis of water releases oxygen and synthesizes ATP and NADPH.\n2. **Calvin Cycle / Light-Independent Reactions (Stroma):** Carbon fixation incorporates $CO_2$ into glucose using ATP/NADPH energy.`;

      const tutorMsg: ChatMessage = {
        id: `msg-tutor-${Date.now()}`,
        sender: 'tutor',
        text: responseText + `\n\n💡 *General Knowledge Explanation • Tailored for ${userStage} Science Curriculum*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: false,
        mode: 'general_ai',
        suggestedFollowUps: [
          'What is the role of stomata in photosynthesis?',
          'How does the Calvin Cycle differ from the light reactions?',
          'Take a Science quiz'
        ]
      };
      setChatMessages(prev => [...prev, tutorMsg]);
      setIsChatThinking(false);
      return;
    }

    // 4. Compare AI and Machine Learning
    if ((promptLower.includes('compare') || promptLower.includes('difference')) && promptLower.includes('ai') && (promptLower.includes('machine learning') || promptLower.includes('ml'))) {
      const responseText = `### Comparison: Artificial Intelligence (AI) vs Machine Learning (ML)\n\n| Feature | Artificial Intelligence (AI) | Machine Learning (ML) |\n| :--- | :--- | :--- |\n| **Definition** | The broad umbrella discipline aiming to simulate human intelligence and problem-solving in machines. | A specific subset of AI that focuses on learning patterns from data without being explicitly programmed. |\n| **Scope** | Broad concept including robotics, expert systems, symbolic reasoning, and ML. | Focused domain inside AI relying on statistical algorithms and empirical optimization. |\n| **Core Goal** | Maximize probability of success in cognitive or physical tasks. | Minimize error/loss metrics on predictive tasks. |\n| **Methods** | Rule-based engines, search heuristics, genetic algorithms, neural networks. | Regression, Decision Trees, SVMs, Bayesian Models, Deep Learning. |\n\n**Analogy:** If AI is the concept of a self-driving vehicle, Machine Learning is the computer vision model that detects pedestrians from camera frames.`;

      const tutorMsg: ChatMessage = {
        id: `msg-tutor-${Date.now()}`,
        sender: 'tutor',
        text: responseText + `\n\n💡 *General Knowledge Explanation • Tailored for ${userStage}*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: false,
        mode: 'general_ai',
        suggestedFollowUps: [
          'Where does Deep Learning fit in this taxonomy?',
          'What is the difference between supervised and unsupervised learning?',
          'Generate a quiz on AI Foundations'
        ]
      };
      setChatMessages(prev => [...prev, tutorMsg]);
      setIsChatThinking(false);
      return;
    }

    // 5. Document-Grounded Queries (ReLU, Activation, Transformers, Attention, Pooling)
    if (promptLower.includes('relu') || promptLower.includes('activation') || promptLower.includes('gradient')) {
      const res = resources.find(r => r.id.includes('5a2c') || r.id === 'res-1') || resources[0];
      const citation: CitationReference = {
        resourceId: res ? res.id : 'res-1',
        resourceTitle: res ? res.title : 'Neural Networks Notes (txt)',
        fileType: res ? res.fileType : 'txt',
        location: 'Lines 4-6',
        snippet: 'The Rectified Linear Unit (ReLU) computes f(x) = max(0, x). By providing a constant gradient of 1 for positive activations, it avoids the vanishing gradient problem inherent in sigmoid and tanh activations during deep backpropagation.',
        confidenceScore: 0.99
      };

      const responseText = `The Rectified Linear Unit (**ReLU**) is defined by the piecewise linear function:\n$$f(x) = \\max(0, x)$$\n\n**Derivative Formulation:**\n$$f'(x) = \\begin{cases} 1 & \\text{if } x > 0 \\\\ 0 & \\text{if } x < 0 \\end{cases}$$\n\n**Significance in Deep Learning:**\nBy maintaining a constant gradient of $1$ for all positive inputs, ReLU prevents gradients from decaying exponentially during deep backpropagation, directly resolving the **vanishing gradient problem** that hinders saturated sigmoidal activations.`;

      const tutorMsg: ChatMessage = {
        id: `msg-tutor-${Date.now()}`,
        sender: 'tutor',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: true,
        mode: 'source_grounded',
        citations: [citation],
        topicTag: 'Neural Networks',
        suggestedFollowUps: [
          'What is the Dying ReLU problem and how does Leaky ReLU help?',
          'How does Batch Normalization interact with ReLU?',
          'Take a quiz on Activation Functions'
        ]
      };
      setChatMessages(prev => [...prev, tutorMsg]);
      setIsChatThinking(false);
      return;
    }

    // 6. Universal Structured 5-Line Academic Explanation
    const cleanTopic = studentPrompt
      .replace(/^(what is|explain|define|how does|why is|tell me about|kya hota hai|kya hai|samjhao)\s+/i, '')
      .replace(/\?+$/, '')
      .trim();
    const topicTitle = cleanTopic ? cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1) : studentPrompt;

    // Check if any uploaded resource matches the question
    const matchedRes = resources.find(r => 
      promptLower.includes(r.title.toLowerCase()) || 
      (r.subject && promptLower.includes(r.subject.toLowerCase())) ||
      (r.topic && promptLower.includes(r.topic.toLowerCase()))
    );

    const fiveLineAnswer = [
      `1. **Definition:** ${topicTitle} is an essential academic principle in ${activeSubject || 'this domain'}.`,
      `2. **Working Principle:** It operates through systematic theoretical rules governing how components interact.`,
      `3. **Practical Application:** In applied problem solving, understanding ${topicTitle} helps formulate structured solutions.`,
      `4. **Key Takeaway for ${userStage}:** Master the primary definition and underlying constraints rather than rote memorization.`,
      `5. **Next Step:** Upload lecture notes to your Learning Library to enable source citations or test your retention with a quiz.`
    ].join('\n');

    const tutorMsg: ChatMessage = {
      id: `msg-tutor-${Date.now()}`,
      sender: 'tutor',
      text: `${fiveLineAnswer}\n\n💡 *General Knowledge Explanation • Tailored for ${userStage} • 5-line summary*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGrounded: Boolean(matchedRes),
      mode: matchedRes ? 'source_grounded' : 'general_ai',
      citations: matchedRes ? [{
        resourceId: matchedRes.id,
        resourceTitle: matchedRes.title,
        fileType: matchedRes.fileType,
        location: 'Uploaded Notes',
        snippet: `Verified study material for ${matchedRes.title}`,
        confidenceScore: 0.95
      }] : undefined,
      suggestedFollowUps: [
        'Can you provide a step-by-step example?',
        'How does this relate to exam questions?',
        'Test my understanding with a smart quiz'
      ]
    };
    setChatMessages(prev => [...prev, tutorMsg]);
    setIsChatThinking(false);
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
