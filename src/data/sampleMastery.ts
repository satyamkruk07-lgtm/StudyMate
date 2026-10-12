import { TopicMastery, QuizAttempt } from '../types';

export const INITIAL_MASTERY_DATA: TopicMastery[] = [
  {
    id: 'mastery-transformers',
    topicName: 'Transformers & LLMs',
    category: 'Architecture',
    masteryPercentage: 84,
    questionsAttempted: 32,
    lastStudied: 'Today, 11:20 AM',
    status: 'strong',
    recommendedAction: 'Ready for Advanced Sparse-Attention challenges',
    trend: 'improving'
  },
  {
    id: 'mastery-opt',
    topicName: 'Optimization & Loss Functions',
    category: 'Mathematics',
    masteryPercentage: 54,
    questionsAttempted: 18,
    lastStudied: 'Yesterday, 4:15 PM',
    status: 'weak',
    recommendedAction: 'Review Adam bias correction & learning rate warmups',
    trend: 'declining'
  },
  {
    id: 'mastery-nn',
    topicName: 'Neural Networks',
    category: 'Foundations',
    masteryPercentage: 78,
    questionsAttempted: 45,
    lastStudied: '2 days ago',
    status: 'strong',
    recommendedAction: 'Consolidate Backpropagation edge cases',
    trend: 'improving'
  },
  {
    id: 'mastery-multimodal',
    topicName: 'Multimodal Learning',
    category: 'Cross-Modal AI',
    masteryPercentage: 66,
    questionsAttempted: 24,
    lastStudied: '3 days ago',
    status: 'moderate',
    recommendedAction: 'Practice contrastive temperature scaling & zero-shot loss',
    trend: 'stable'
  },
  {
    id: 'mastery-rlhf',
    topicName: 'Model Alignment & RL',
    category: 'Alignment',
    masteryPercentage: 42,
    questionsAttempted: 12,
    lastStudied: '4 days ago',
    status: 'weak',
    recommendedAction: 'Reinforce KL penalty terms in PPO policy bounds',
    trend: 'declining'
  },
  {
    id: 'mastery-embeddings',
    topicName: 'Positional Embeddings',
    category: 'Sequence Modeling',
    masteryPercentage: 71,
    questionsAttempted: 19,
    lastStudied: '5 days ago',
    status: 'moderate',
    recommendedAction: 'Compare RoPE (Rotary) vs Sinusoidal encodings',
    trend: 'improving'
  }
];

export const INITIAL_QUIZ_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'att-101',
    topic: 'Transformers & LLMs',
    difficulty: 'Intermediate',
    totalQuestions: 5,
    correctAnswers: 4,
    scorePercentage: 80,
    completedAt: '2026-10-12 10:45 AM',
    timeSpentSeconds: 195,
    questionResults: [
      {
        questionId: 'q-trans-1',
        questionPrompt: 'In Scaled Dot-Product Attention, why divide by √d_k?',
        questionType: 'mcq',
        userAnswer: 'To prevent large values that push softmax gradients into vanishing regions',
        isCorrect: true,
        explanation: 'Division prevents high magnitude dot products from saturating softmax.',
        citation: {
          resourceId: 'res-2',
          resourceTitle: 'Transformer Architectures & Scaled Dot-Product Attention',
          fileType: 'pptx',
          location: 'Slide 14',
          snippet: 'Attention(Q, K, V) = softmax((Q · K^T) / √d_k) · V prevents vanishing gradients.',
          confidenceScore: 0.98
        }
      },
      {
        questionId: 'q-trans-5',
        questionPrompt: 'Calculate head dimension d_k for d_model = 768 and h = 12.',
        questionType: 'numerical',
        userAnswer: '64',
        isCorrect: true,
        explanation: 'd_k = 768 / 12 = 64 dimensions.',
        citation: {
          resourceId: 'res-2',
          resourceTitle: 'Transformer Architectures & Scaled Dot-Product Attention',
          fileType: 'pptx',
          location: 'Slide 19',
          snippet: 'Multi-Head Attention projects into h subspaces with d_k = d_model / h.',
          confidenceScore: 0.97
        }
      }
    ]
  },
  {
    id: 'att-102',
    topic: 'Optimization & Loss Functions',
    difficulty: 'Beginner',
    totalQuestions: 4,
    correctAnswers: 2,
    scorePercentage: 50,
    completedAt: '2026-10-11 04:30 PM',
    timeSpentSeconds: 240,
    questionResults: [
      {
        questionId: 'q-opt-3',
        questionPrompt: 'Calculate bias correction divisor (1 - β_1^t) at t = 1, β_1 = 0.9.',
        questionType: 'numerical',
        userAnswer: '0.9',
        isCorrect: false,
        explanation: 'The divisor is 1 - 0.9 = 0.10, not 0.90.',
        citation: {
          resourceId: 'res-3',
          resourceTitle: 'Mathematical Optimization in Machine Learning',
          fileType: 'txt',
          location: 'Section §2.1',
          snippet: 'Bias correction terms are m_hat_t = m_t / (1 - β_1^t).',
          confidenceScore: 0.99
        }
      }
    ]
  }
];

export const WEEKLY_STUDY_DATA = [
  { day: 'Mon', hours: 2.4, questions: 14, accuracy: 82 },
  { day: 'Tue', hours: 3.1, questions: 22, accuracy: 76 },
  { day: 'Wed', hours: 1.8, questions: 10, accuracy: 88 },
  { day: 'Thu', hours: 4.2, questions: 35, accuracy: 81 },
  { day: 'Fri', hours: 2.9, questions: 20, accuracy: 72 },
  { day: 'Sat', hours: 5.0, questions: 42, accuracy: 89 },
  { day: 'Sun', hours: 3.6, questions: 28, accuracy: 85 }
];
