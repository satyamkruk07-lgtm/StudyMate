import React, { useState } from 'react';
import {
  GraduationCap,
  School,
  Building2,
  UserCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { EducationLevel, StudentProfile } from '../types';

const SCHOOL_SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  highSchool: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Social Science'],
  middleSchool: ['Mathematics', 'Science', 'Social Studies', 'English', 'Hindi', 'Computer Applications'],
  primarySchool: ['Mathematics', 'Environmental Science', 'English', 'General Knowledge']
};

const COLLEGE_SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  tech: ['Data Structures & Algorithms', 'Machine Learning & AI', 'Operating Systems', 'Database Management', 'Computer Networks', 'Linear Algebra & Calculus'],
  general: ['Foundational Mathematics', 'Applied Sciences', 'Financial Accounting', 'Business Economics', 'Technical Communication']
};

const SELF_SUBJECT_SUGGESTIONS = [
  'Deep Learning Foundations',
  'Large Language Models (LLMs)',
  'Transformer Architecture',
  'System Design & Microservices',
  'Python for Data Science',
  'Applied Neural Networks'
];

const INDIAN_STATES = [
  'Himachal Pradesh',
  'Delhi',
  'Maharashtra',
  'Karnataka',
  'Uttar Pradesh',
  'Tamil Nadu',
  'West Bengal',
  'Gujarat',
  'Punjab',
  'Rajasthan',
  'Kerala',
  'Other State'
];

export const OnboardingPage: React.FC = () => {
  const { profile, saveProfile, setCurrentPage, logout } = useStudy();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(profile?.education_level || 'college');

  // School fields
  const [grade, setGrade] = useState(profile?.grade_or_course?.startsWith('Class') ? profile.grade_or_course : 'Class 11');
  const [board, setBoard] = useState(profile?.board_or_specialization || 'CBSE');
  const [stateName, setStateName] = useState(profile?.state || 'Himachal Pradesh');

  // College fields
  const [degree, setDegree] = useState(
    ['B.Tech', 'BCA', 'B.Sc.', 'B.Com.', 'B.A.', 'M.Tech', 'MCA'].includes(profile?.grade_or_course || '')
      ? profile!.grade_or_course
      : 'B.Tech'
  );
  const [branch, setBranch] = useState(profile?.board_or_specialization || 'Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState(profile?.academic_year || '3rd Year');
  const [semester, setSemester] = useState(profile?.semester || 'Semester 5');

  // Self-learner fields
  const [learningGoal, setLearningGoal] = useState(profile?.learning_goals || 'Skill Advancement & Technical Mastery');
  const [focusArea, setFocusArea] = useState(profile?.board_or_specialization || 'Artificial Intelligence & Machine Learning');

  // Common fields
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'English');
  const [difficultyLevel, setDifficultyLevel] = useState(profile?.difficulty_level || 'Intermediate');
  const [explanationStyle, setExplanationStyle] = useState(profile?.explanation_style || 'Conceptual & Intuitive');

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    profile?.selected_subjects?.length
      ? profile.selected_subjects
      : ['Data Structures & Algorithms', 'Machine Learning & AI', 'Operating Systems']
  );
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [editingSubjectOriginal, setEditingSubjectOriginal] = useState<string | null>(null);
  const [renamedSubjectInput, setRenamedSubjectInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle subject selection
  const handleToggleSubject = (sub: string) => {
    setSelectedSubjects(prev =>
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  // Add custom subject
  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSubjectInput.trim();
    if (clean && !selectedSubjects.includes(clean)) {
      setSelectedSubjects(prev => [...prev, clean]);
      setCustomSubjectInput('');
    }
  };

  // Remove custom subject
  const handleRemoveSubject = (sub: string) => {
    setSelectedSubjects(prev => prev.filter(s => s !== sub));
  };

  // Rename subject
  const handleRenameSubject = (oldName: string) => {
    const clean = renamedSubjectInput.trim();
    if (!clean || clean === oldName) {
      setEditingSubjectOriginal(null);
      return;
    }
    setSelectedSubjects(prev => prev.map(s => (s === oldName ? clean : s)));
    setEditingSubjectOriginal(null);
    setRenamedSubjectInput('');
  };

  // Validate step 1 -> step 2
  const handleNextFromStep1 = () => {
    setValidationError(null);
    // Pre-populate recommended subjects for the selected level if none selected yet
    if (educationLevel === 'school') {
      setSelectedSubjects(['Mathematics', 'Physics', 'Chemistry', 'Computer Science']);
    } else if (educationLevel === 'college') {
      setSelectedSubjects(['Data Structures & Algorithms', 'Machine Learning & AI', 'Operating Systems']);
    } else {
      setSelectedSubjects(['Deep Learning Foundations', 'Transformer Architecture', 'System Design & Microservices']);
    }
    setStep(2);
  };

  // Validate step 2 -> step 3
  const handleNextFromStep2 = () => {
    setValidationError(null);
    if (educationLevel === 'school') {
      if (!grade) {
        setValidationError('Please select your class or grade.');
        return;
      }
      if (!board) {
        setValidationError('Please select your curriculum board.');
        return;
      }
      if (board === 'State Board' && !stateName) {
        setValidationError('Please select your state.');
        return;
      }
    } else if (educationLevel === 'college') {
      if (!degree) {
        setValidationError('Please select your degree/course.');
        return;
      }
      if (!academicYear) {
        setValidationError('Please select your current academic year.');
        return;
      }
    } else if (educationLevel === 'self') {
      if (!learningGoal) {
        setValidationError('Please select your primary learning goal.');
        return;
      }
    }
    setStep(3);
  };

  // Final submission
  const handleSaveProfile = async () => {
    if (selectedSubjects.length === 0) {
      setValidationError('Please select or add at least one subject to your profile.');
      return;
    }

    setIsSaving(true);
    setValidationError(null);

    const profileData: Omit<StudentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      education_level: educationLevel,
      grade_or_course:
        educationLevel === 'school'
          ? grade
          : educationLevel === 'college'
          ? degree
          : focusArea,
      board_or_specialization:
        educationLevel === 'school'
          ? board
          : educationLevel === 'college'
          ? branch
          : focusArea,
      academic_year: educationLevel === 'college' ? academicYear : undefined,
      semester: educationLevel === 'college' ? semester : undefined,
      state: educationLevel === 'school' && board === 'State Board' ? stateName : undefined,
      preferred_language: preferredLanguage,
      difficulty_level: difficultyLevel,
      explanation_style: explanationStyle,
      selected_subjects: selectedSubjects,
      learning_goals: educationLevel === 'self' ? learningGoal : undefined,
      is_profile_completed: true
    };

    try {
      await saveProfile(profileData);
    } catch (err: any) {
      setValidationError(err.message || 'Could not save profile.');
      setIsSaving(false);
    }
  };

  const getSuggestedSubjectList = () => {
    if (educationLevel === 'school') {
      const classNum = parseInt(grade.replace(/\D/g, ''), 10) || 10;
      if (classNum >= 9) return SCHOOL_SUBJECT_SUGGESTIONS.highSchool;
      if (classNum >= 6) return SCHOOL_SUBJECT_SUGGESTIONS.middleSchool;
      return SCHOOL_SUBJECT_SUGGESTIONS.primarySchool;
    }
    if (educationLevel === 'college') {
      return COLLEGE_SUBJECT_SUGGESTIONS.tech;
    }
    return SELF_SUBJECT_SUGGESTIONS;
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-800/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-md shadow-teal-950/40">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">StudyMate AI</h1>
              <p className="text-[11px] text-slate-400">
                {profile?.is_profile_completed ? 'Edit Education Profile' : 'Education Profile Setup'}
              </p>
            </div>
          </div>

          {profile?.is_profile_completed ? (
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Return to Dashboard
            </button>
          ) : (
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>

        {/* Wizard Card Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0e17] border border-slate-800/80 shadow-2xl space-y-6">
          {/* Progress Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">
                Step {step} of 3:{' '}
                {step === 1
                  ? 'Choose Learning Path'
                  : step === 2
                  ? 'Academic Information'
                  : 'Subjects & Curriculum'}
              </span>
              <span className="text-teal-400 font-mono">{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Validation Feedback */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* ================= STEP 1: CHOOSE LEARNING PATH ================= */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  What is your current educational stage?
                </h2>
                <p className="text-xs text-slate-400">
                  Select the path that matches your current studies. StudyMate AI will calibrate its explanations and question difficulty accordingly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* School Option */}
                <div
                  onClick={() => setEducationLevel('school')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    educationLevel === 'school'
                      ? 'bg-teal-500/10 border-teal-500 text-white shadow-lg shadow-teal-950/20'
                      : 'bg-[#070b12] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                      <School className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-white">School Student</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Classes 1 to 12. CBSE, ICSE, or State Board textbook grounding.
                    </p>
                  </div>
                  {educationLevel === 'school' && (
                    <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-teal-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selected</span>
                    </div>
                  )}
                </div>

                {/* College Option */}
                <div
                  onClick={() => setEducationLevel('college')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    educationLevel === 'college'
                      ? 'bg-teal-500/10 border-teal-500 text-white shadow-lg shadow-teal-950/20'
                      : 'bg-[#070b12] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-white">College Student</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      BCA, B.Tech, B.Sc., B.Com., B.A. or university graduate degrees.
                    </p>
                  </div>
                  {educationLevel === 'college' && (
                    <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-teal-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selected</span>
                    </div>
                  )}
                </div>

                {/* Self-Learner Option */}
                <div
                  onClick={() => setEducationLevel('self')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    educationLevel === 'self'
                      ? 'bg-teal-500/10 border-teal-500 text-white shadow-lg shadow-teal-950/20'
                      : 'bg-[#070b12] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-white">Self-Learner</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Autonomous upskilling, certifications, and career transition.
                    </p>
                  </div>
                  {educationLevel === 'self' && (
                    <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-teal-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selected</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleNextFromStep1}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs sm:text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: EDUCATION SPECIFIC DETAILS ================= */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {educationLevel === 'school'
                    ? 'School & Curriculum Information'
                    : educationLevel === 'college'
                    ? 'College Degree & Academic Details'
                    : 'Learning Goals & Focus'}
                </h2>
                <p className="text-xs text-slate-400">
                  Provide your educational details so StudyMate AI can tailor syllabus terms and difficulty appropriately.
                </p>
              </div>

              {/* SCHOOL CONDITIONAL FIELDS */}
              {educationLevel === 'school' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Class / Grade <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={grade}
                        onChange={e => setGrade(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map(c => (
                          <option key={c} value={c} className="bg-slate-900 text-white">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Curriculum Board <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={board}
                        onChange={e => setBoard(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="CBSE">CBSE (Central Board)</option>
                        <option value="ICSE">ICSE / ISC</option>
                        <option value="State Board">State Board</option>
                        <option value="Other">Other Curriculum</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional State selection if State Board is chosen */}
                  {board === 'State Board' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        State <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={stateName}
                        onChange={e => setStateName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {INDIAN_STATES.map(s => (
                          <option key={s} value={s} className="bg-slate-900 text-white">
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preferred Language <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={e => setPreferredLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Hinglish">Hinglish (Bilingual)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* COLLEGE CONDITIONAL FIELDS */}
              {educationLevel === 'college' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Degree / Course <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={degree}
                        onChange={e => setDegree(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="B.Tech">B.Tech / B.E. (Engineering)</option>
                        <option value="BCA">BCA (Computer Applications)</option>
                        <option value="B.Sc.">B.Sc. (Sciences)</option>
                        <option value="B.Com.">B.Com. (Commerce)</option>
                        <option value="B.A.">B.A. (Arts & Humanities)</option>
                        <option value="M.Tech">M.Tech / M.E.</option>
                        <option value="MCA">MCA</option>
                        <option value="Other">Other Degree</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Branch / Specialization
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={e => setBranch(e.target.value)}
                        placeholder="e.g. Computer Science, AI & ML, Mechanical"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Academic Year <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="1st Year">1st Year (Freshman)</option>
                        <option value="2nd Year">2nd Year (Sophomore)</option>
                        <option value="3rd Year">3rd Year (Junior)</option>
                        <option value="4th Year">4th Year (Senior)</option>
                        <option value="5th Year">5th Year (Dual Degree)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Current Semester
                      </label>
                      <select
                        value={semester}
                        onChange={e => setSemester(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`).map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preferred Language
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={e => setPreferredLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>
                </div>
              )}

              {/* SELF-LEARNER CONDITIONAL FIELDS */}
              {educationLevel === 'self' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Primary Learning Goal <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={learningGoal}
                      onChange={e => setLearningGoal(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Skill Advancement & Technical Mastery">
                        Skill Advancement & Technical Mastery
                      </option>
                      <option value="Career Transition & Job Readiness">
                        Career Transition & Job Readiness
                      </option>
                      <option value="Academic Deep-Dive & Research">
                        Academic Deep-Dive & Research
                      </option>
                      <option value="Competitive Exam / Certification Prep">
                        Competitive Exam / Certification Prep
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Core Domain Focus
                    </label>
                    <input
                      type="text"
                      value={focusArea}
                      onChange={e => setFocusArea(e.target.value)}
                      placeholder="e.g. Deep Learning, Full-Stack Engineering, Quantum Computing"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Preferred Language
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={e => setPreferredLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleNextFromStep2}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs sm:text-sm font-semibold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                >
                  <span>Select Subjects</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SUBJECT SELECTION ================= */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Select Your Active Subjects
                </h2>
                <p className="text-xs text-slate-400">
                  Choose from suggested subjects for your educational path or add custom subjects below. You can update these anytime.
                </p>
              </div>

              {/* Suggested Subject Chips */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Recommended Curriculum Subjects
                </label>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedSubjectList().map(sub => {
                    const isSelected = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleToggleSubject(sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/20 border border-teal-400'
                            : 'bg-[#070b12] text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Subject Form */}
              <form onSubmit={handleAddCustomSubject} className="space-y-2 pt-2">
                <label className="block text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Add Custom Subject
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={e => setCustomSubjectInput(e.target.value)}
                    placeholder="e.g. Sanskrit, Robotics, Sanskriti, Discrete Math"
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={!customSubjectInput.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Active Selected Subjects List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Enrolled Subjects ({selectedSubjects.length})</span>
                  <span className="text-slate-500 font-normal">Click subject to rename, or (×) to remove</span>
                </div>
                {selectedSubjects.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-amber-300/80">
                    No subjects selected yet. Please select at least one subject.
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#070b12] border border-slate-800 flex flex-wrap gap-2">
                    {selectedSubjects.map(sub => (
                      editingSubjectOriginal === sub ? (
                        <div key={sub} className="flex items-center gap-1.5 p-1 rounded-lg bg-teal-950/60 border border-teal-500">
                          <input
                            type="text"
                            value={renamedSubjectInput}
                            onChange={e => setRenamedSubjectInput(e.target.value)}
                            className="px-2 py-0.5 text-xs bg-slate-900 text-white rounded border border-slate-700 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameSubject(sub)}
                            className="px-2 py-0.5 text-[11px] font-semibold bg-teal-500 text-slate-950 rounded"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSubjectOriginal(null)}
                            className="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          key={sub}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 text-xs border border-teal-500/25"
                        >
                          <span
                            onClick={() => {
                              setEditingSubjectOriginal(sub);
                              setRenamedSubjectInput(sub);
                            }}
                            className="cursor-pointer hover:underline"
                            title="Click to rename subject"
                          >
                            {sub}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub)}
                            className="text-slate-400 hover:text-white"
                            title="Remove subject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Learning Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Desired Difficulty Level
                  </label>
                  <select
                    value={difficultyLevel}
                    onChange={e => setDifficultyLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Beginner">Beginner (Foundations & Basics)</option>
                    <option value="Intermediate">Intermediate (Core Concepts & Practice)</option>
                    <option value="Advanced">Advanced (Deep Technical & Edge Cases)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preferred Explanation Style
                  </label>
                  <select
                    value={explanationStyle}
                    onChange={e => setExplanationStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Conceptual & Intuitive">Conceptual & Intuitive</option>
                    <option value="Step-by-Step Rigorous">Step-by-Step Rigorous</option>
                    <option value="Code & Practical">Code & Practical Examples</option>
                    <option value="Exam-Oriented">Exam & Solution Oriented</option>
                  </select>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || selectedSubjects.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Saving Profile...</span>
                  ) : (
                    <>
                      <span>Save Profile & Launch</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
