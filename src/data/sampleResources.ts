import { LearningResource } from '../types';

export const INITIAL_RESOURCES: LearningResource[] = [
  {
    id: 'res-1',
    title: 'Foundations of Deep Learning & Neural Architectures',
    fileType: 'pdf',
    fileName: 'deep_learning_foundations_v3.pdf',
    fileSize: '4.8 MB',
    topic: 'Neural Networks',
    uploadDate: '2026-10-08',
    status: 'ready',
    chunkCount: 38,
    authorOrSource: 'IIT Mandi AI Research Lab / Prof. K. Sharma',
    summary: 'Comprehensive textbook chapter covering multi-layer perceptrons, activation functions (ReLU, GELU, Sigmoid), backpropagation algorithms, and vanishing gradient remedies.',
    chunks: [
      {
        id: 'chunk-1-1',
        chunkIndex: 1,
        location: 'Page 12, §2.4',
        content: 'The Rectified Linear Unit (ReLU) computes f(x) = max(0, x). By providing a constant gradient of 1 for positive activations, it avoids the vanishing gradient problem inherent in sigmoid and tanh activations during deep backpropagation.',
        keywords: ['ReLU', 'activation functions', 'vanishing gradient', 'backpropagation']
      },
      {
        id: 'chunk-1-2',
        chunkIndex: 2,
        location: 'Page 28, §3.2',
        content: 'Backpropagation operates by applying the chain rule of calculus in reverse order through computational graphs. The gradient of the total loss L with respect to weight W_ij is given by ∂L/∂W_ij = ∂L/∂z_j · ∂z_j/∂W_ij, propagating errors backwards from output to input layers.',
        keywords: ['backpropagation', 'chain rule', 'computational graph', 'gradients']
      },
      {
        id: 'chunk-1-3',
        chunkIndex: 3,
        location: 'Page 42, §4.1',
        content: 'Batch Normalization standardizes intermediate activations across mini-batches with mean μ_B and variance σ_B^2, followed by learnable scale (γ) and shift (β) parameters. This stabilizes internal covariate shift and permits higher learning rates.',
        keywords: ['batch normalization', 'covariate shift', 'hyperparameters', 'regularization']
      }
    ]
  },
  {
    id: 'res-2',
    title: 'Transformer Architectures & Scaled Dot-Product Attention',
    fileType: 'pptx',
    fileName: 'transformers_and_attention_mechanisms.pptx',
    fileSize: '12.4 MB',
    topic: 'Transformers & LLMs',
    uploadDate: '2026-10-09',
    status: 'ready',
    chunkCount: 44,
    authorOrSource: 'Advanced NLP Module Lecture Slides',
    summary: 'Lecture deck dissecting Query, Key, Value representations, Scaled Dot-Product Attention, Multi-Head Attention, and positional encoding mechanisms.',
    chunks: [
      {
        id: 'chunk-2-1',
        chunkIndex: 1,
        location: 'Slide 14',
        content: 'Scaled Dot-Product Attention is calculated as Attention(Q, K, V) = softmax((Q · K^T) / √d_k) · V. The division by √d_k prevents dot products from growing excessively large in high dimensions, which would push softmax gradients into regions with vanishingly small derivatives.',
        keywords: ['attention mechanism', 'query key value', 'scaling factor', 'softmax']
      },
      {
        id: 'chunk-2-2',
        chunkIndex: 2,
        location: 'Slide 19',
        content: 'Multi-Head Attention projects Q, K, and V into h different subspaces with dimensions d_k = d_model / h. This allows the model to jointly attend to information from different representation subspaces at different positions.',
        keywords: ['multi-head attention', 'subspaces', 'model dimension', 'heads']
      },
      {
        id: 'chunk-2-3',
        chunkIndex: 3,
        location: 'Slide 27',
        content: 'Because self-attention layers contain no recurrence or convolution, order information must be injected via Positional Encodings. Sinusoidal encodings use PE_(pos, 2i) = sin(pos / 10000^(2i/d_model)) and PE_(pos, 2i+1) = cos(pos / 10000^(2i/d_model)).',
        keywords: ['positional encoding', 'sinusoidal embeddings', 'sequence order']
      }
    ]
  },
  {
    id: 'res-3',
    title: 'Mathematical Optimization in Machine Learning',
    fileType: 'txt',
    fileName: 'optimization_algorithms_notes.txt',
    fileSize: '340 KB',
    topic: 'Optimization & Loss Functions',
    uploadDate: '2026-10-10',
    status: 'ready',
    chunkCount: 22,
    authorOrSource: 'Course Revision Notes / IIT Mandi Track D',
    summary: 'Rigorous mathematical notes covering Stochastic Gradient Descent (SGD), Momentum, RMSProp, Adam optimizer equations, and Cross-Entropy loss computation.',
    chunks: [
      {
        id: 'chunk-3-1',
        chunkIndex: 1,
        location: 'Section §2.1 (Lines 45-80)',
        content: 'The Adam (Adaptive Moment Estimation) optimizer maintains exponentially decaying averages of past gradients (first moment m_t) and past squared gradients (second moment v_t). Bias correction terms are m_hat_t = m_t / (1 - β_1^t) and v_hat_t = v_t / (1 - β_2^t). Default parameters: β_1 = 0.9, β_2 = 0.999, ε = 1e-8.',
        keywords: ['Adam optimizer', 'momentum', 'bias correction', 'second moment', 'learning rate']
      },
      {
        id: 'chunk-3-2',
        chunkIndex: 2,
        location: 'Section §3.5 (Lines 150-192)',
        content: 'Categorical Cross-Entropy Loss for multi-class classification is formulated as L = - ∑_{c=1}^{C} y_c · log(p_c). For binary classification, Binary Cross-Entropy (BCE) reduces to - [y · log(p) + (1 - y) · log(1 - p)]. Minimizing cross-entropy is equivalent to minimizing the Kullback-Leibler (KL) divergence between empirical and predicted distributions.',
        keywords: ['cross-entropy', 'loss function', 'KL divergence', 'classification']
      }
    ]
  },
  {
    id: 'res-4',
    title: 'Lecture 04: Multimodal Vision-Language Alignment (Audio Transcript)',
    fileType: 'transcript',
    fileName: 'lecture_04_multimodal_clip_align.transcript',
    fileSize: '1.2 MB',
    topic: 'Multimodal Learning',
    uploadDate: '2026-10-11',
    status: 'ready',
    chunkCount: 31,
    authorOrSource: 'Classroom Lecture Recording Transcript • IIT Mandi',
    summary: 'Spoken lecture transcript examining contrastive learning for vision and language, CLIP dual-encoder architectures, cosine similarity temperature scaling, and zero-shot transfer.',
    chunks: [
      {
        id: 'chunk-4-1',
        chunkIndex: 1,
        location: 'Timestamp 14:28 - 16:15',
        content: '[Prof]: Contrastive Language-Image Pretraining (CLIP) trains an image encoder and text encoder simultaneously. Given a batch of N (image, text) pairs, the model maximizes the cosine similarity of the N correct pairings while minimizing similarity for the N^2 - N incorrect pairings using a symmetric cross-entropy loss over similarity scores scaled by learned temperature τ.',
        keywords: ['CLIP', 'contrastive learning', 'multimodal alignment', 'temperature scaling']
      },
      {
        id: 'chunk-4-2',
        chunkIndex: 2,
        location: 'Timestamp 28:50 - 31:10',
        content: '[Student Question]: Why normalize embeddings before computing dot products? [Prof]: Normalizing image and text embeddings to unit length (L2 norm = 1) turns their dot product directly into cosine similarity. This bounds the scores between -1 and +1, ensuring stable temperature-scaled softmax distribution without vector magnitude interference.',
        keywords: ['L2 normalization', 'cosine similarity', 'unit sphere', 'stability']
      }
    ]
  },
  {
    id: 'res-5',
    title: 'Reinforcement Learning from Human Feedback (RLHF) & Alignment',
    fileType: 'pdf',
    fileName: 'rlhf_policy_optimization_overview.pdf',
    fileSize: '3.1 MB',
    topic: 'Model Alignment & RL',
    uploadDate: '2026-10-12',
    status: 'indexing',
    chunkCount: 19,
    authorOrSource: 'IIT Mandi AI Alignment Reading Group',
    summary: 'Technical review of PPO (Proximal Policy Optimization) in LLM alignment, reward model calibration, KL divergence penalty terms, and Direct Preference Optimization (DPO).',
    chunks: [
      {
        id: 'chunk-5-1',
        chunkIndex: 1,
        location: 'Page 7, §2.2',
        content: 'To prevent the aligned policy π_θ from drifting too far from the initial supervised fine-tuned model π_ref, a KL divergence penalty term is added: objective = E[r(x, y) - β · D_KL(π_θ(y|x) || π_ref(y|x))]. This prevents reward hacking.',
        keywords: ['RLHF', 'KL penalty', 'reward hacking', 'PPO', 'policy drift']
      }
    ]
  }
];
