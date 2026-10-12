import { QuizQuestion } from '../types';

export const SAMPLE_QUESTIONS: QuizQuestion[] = [
  // 1. MCQ - Intermediate - Transformers
  {
    id: 'q-trans-1',
    type: 'mcq',
    topic: 'Transformers & LLMs',
    subtopic: 'Scaled Dot-Product Attention',
    difficulty: 'Intermediate',
    prompt: 'In Scaled Dot-Product Attention, why are the dot products of the Query (Q) and Key (K) matrices divided by √d_k prior to the softmax function?',
    options: [
      'To reduce the computational time complexity from O(N^2) to O(N)',
      'To prevent large values that push softmax gradients into regions with vanishingly small derivatives',
      'To normalize the output vector dimension to match the Value matrix (V)',
      'To enforce orthogonal orthogonality between query and key projection weights'
    ],
    correctOptionIndex: 1,
    explanation:
      'As vector dimension d_k increases, the magnitude of dot products grows large, pushing the softmax function into regions with near-zero gradients. Scaling by 1/√d_k counters this effect and maintains smooth gradient flow.',
    citation: {
      resourceId: 'res-2',
      resourceTitle: 'Transformer Architectures & Scaled Dot-Product Attention (pptx)',
      fileType: 'pptx',
      location: 'Slide 14',
      snippet: 'Attention(Q, K, V) = softmax((Q · K^T) / √d_k) · V. Division by √d_k prevents dot products from growing excessively large in high dimensions, pushing softmax into vanishingly small derivatives.',
      confidenceScore: 0.98
    }
  },

  // 2. Short Answer - Advanced - Multimodal Alignment
  {
    id: 'q-multi-2',
    type: 'short-answer',
    topic: 'Multimodal Learning',
    subtopic: 'CLIP Contrastive Objectives',
    difficulty: 'Advanced',
    prompt:
      'Why does CLIP perform L2-normalization on image and text embedding vectors before computing their pairwise dot products?',
    sampleModelAnswer:
      'Normalizing embeddings to unit length (L2 norm = 1) converts the dot product directly into cosine similarity. This bounds similarity scores between -1 and +1, ensuring a stable temperature-scaled softmax distribution without vector magnitude interference.',
    acceptableKeywords: [
      'cosine similarity',
      'unit length',
      'unit sphere',
      'normalize',
      'magnitude',
      'stable',
      'bound'
    ],
    explanation:
      'Without L2 normalization, embedding magnitude could arbitrarily inflate similarity scores irrespective of semantic alignment. Projecting to the unit sphere isolates directional angle (cosine similarity) for clean contrastive loss optimization.',
    citation: {
      resourceId: 'res-4',
      resourceTitle: 'Lecture 04: Multimodal Vision-Language Alignment (transcript)',
      fileType: 'transcript',
      location: 'Timestamp 28:50 - 31:10',
      snippet: 'Normalizing image and text embeddings to unit length turns their dot product directly into cosine similarity, bounding scores between -1 and +1 and ensuring stable temperature-scaled softmax.',
      confidenceScore: 0.95
    }
  },

  // 3. Numerical Question - Intermediate - Optimization & Adam
  {
    id: 'q-opt-3',
    type: 'numerical',
    topic: 'Optimization & Loss Functions',
    subtopic: 'Adam Bias Correction Calculation',
    difficulty: 'Intermediate',
    prompt:
      'In the Adam optimizer at step t = 1 with decay parameter β_1 = 0.9, what is the bias correction factor divisor (1 - β_1^t)? Compute the exact decimal value.',
    correctValue: 0.1,
    tolerance: 0.001,
    unit: 'divisor',
    formulaHint: 'Bias correction divisor for step t is given by (1 - β_1^t).',
    explanation:
      'For step t = 1 and β_1 = 0.9: Divisor = 1 - (0.9)^1 = 1 - 0.9 = 0.10. Therefore, the uncorrected first moment m_1 is divided by 0.1 (multiplied by 10) to correct for cold-start bias towards zero.',
    citation: {
      resourceId: 'res-3',
      resourceTitle: 'Mathematical Optimization in Machine Learning (txt)',
      fileType: 'txt',
      location: 'Section §2.1 (Lines 45-80)',
      snippet: 'The Adam optimizer maintains first moment m_t and second moment v_t. Bias correction terms are m_hat_t = m_t / (1 - β_1^t) and v_hat_t = v_t / (1 - β_2^t).',
      confidenceScore: 0.99
    }
  },

  // 4. MCQ - Beginner - Neural Networks
  {
    id: 'q-nn-4',
    type: 'mcq',
    topic: 'Neural Networks',
    subtopic: 'Activation Functions',
    difficulty: 'Beginner',
    prompt: 'What mathematical function does the Rectified Linear Unit (ReLU) compute for an input x?',
    options: [
      'f(x) = 1 / (1 + e^(-x))',
      'f(x) = max(0, x)',
      'f(x) = (e^x - e^(-x)) / (e^x + e^(-x))',
      'f(x) = ln(1 + e^x)'
    ],
    correctOptionIndex: 1,
    explanation:
      'ReLU is defined as f(x) = max(0, x). For positive inputs x > 0, the derivative is constant at 1, avoiding the saturation and vanishing gradients seen in sigmoidal functions.',
    citation: {
      resourceId: 'res-1',
      resourceTitle: 'Foundations of Deep Learning & Neural Architectures (pdf)',
      fileType: 'pdf',
      location: 'Page 12, §2.4',
      snippet: 'The Rectified Linear Unit (ReLU) computes f(x) = max(0, x). By providing a constant gradient of 1 for positive activations, it avoids the vanishing gradient problem.',
      confidenceScore: 0.99
    }
  },

  // 5. Numerical Question - Advanced - Attention Dimensions
  {
    id: 'q-trans-5',
    type: 'numerical',
    topic: 'Transformers & LLMs',
    subtopic: 'Multi-Head Subspace Dimension',
    difficulty: 'Advanced',
    prompt:
      'A transformer model has a model dimension d_model = 768 and uses h = 12 attention heads. What is the dimension d_k of each individual attention head?',
    correctValue: 64,
    tolerance: 0,
    unit: 'dimensions',
    formulaHint: 'd_k = d_model / h',
    explanation:
      'In standard multi-head attention, the projected subspace dimension per head is d_k = d_model / h. Here, 768 / 12 = 64 dimensions per attention head.',
    citation: {
      resourceId: 'res-2',
      resourceTitle: 'Transformer Architectures & Scaled Dot-Product Attention (pptx)',
      fileType: 'pptx',
      location: 'Slide 19',
      snippet: 'Multi-Head Attention projects Q, K, and V into h different subspaces with dimensions d_k = d_model / h.',
      confidenceScore: 0.97
    }
  },

  // 6. Short Answer - Intermediate - Neural Networks
  {
    id: 'q-nn-6',
    type: 'short-answer',
    topic: 'Neural Networks',
    subtopic: 'Batch Normalization',
    difficulty: 'Intermediate',
    prompt:
      'What core mathematical transformation does Batch Normalization apply to intermediate layer activations during the forward pass?',
    sampleModelAnswer:
      'Batch Normalization standardizes activations across each mini-batch using the batch mean and variance, and then applies learnable scale (gamma) and shift (beta) parameters.',
    acceptableKeywords: [
      'mean',
      'variance',
      'standardize',
      'scale',
      'shift',
      'gamma',
      'beta',
      'mini-batch'
    ],
    explanation:
      'It computes mean μ_B and variance σ_B^2 over the batch, normalizes x_hat = (x - μ_B)/√(σ_B^2 + ε), and scales/shifts by y = γ·x_hat + β.',
    citation: {
      resourceId: 'res-1',
      resourceTitle: 'Foundations of Deep Learning & Neural Architectures (pdf)',
      fileType: 'pdf',
      location: 'Page 42, §4.1',
      snippet: 'Batch Normalization standardizes intermediate activations across mini-batches with mean μ_B and variance σ_B^2, followed by learnable scale (γ) and shift (β) parameters.',
      confidenceScore: 0.96
    }
  },

  // 7. MCQ - Advanced - Reinforcement Learning Alignment
  {
    id: 'q-rlhf-7',
    type: 'mcq',
    topic: 'Model Alignment & RL',
    subtopic: 'PPO & KL Penalty',
    difficulty: 'Advanced',
    prompt:
      'In RLHF using Proximal Policy Optimization (PPO), why is a KL-divergence penalty incorporated between the learning policy π_θ and the reference policy π_ref?',
    options: [
      'To force the generated tokens to match strict grammatical templates',
      'To prevent the policy from collapsing and reward hacking by straying too far from the base model',
      'To eliminate the need for a separate value network critic',
      'To linearly increase the decoding temperature during inference'
    ],
    correctOptionIndex: 1,
    explanation:
      'Without the KL divergence constraint, the policy could exploit quirks in the reward model (reward hacking) producing gibberish that scores high. The KL penalty keeps outputs grounded close to human-preferred distributions.',
    citation: {
      resourceId: 'res-5',
      resourceTitle: 'Reinforcement Learning from Human Feedback (RLHF) & Alignment (pdf)',
      fileType: 'pdf',
      location: 'Page 7, §2.2',
      snippet: 'To prevent the aligned policy π_θ from drifting too far from the initial supervised fine-tuned model π_ref, a KL divergence penalty term is added: objective = E[r(x, y) - β · D_KL(π_θ || π_ref)].',
      confidenceScore: 0.94
    }
  }
];
