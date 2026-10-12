import { RoadmapNode } from '../types';

export const ROADMAP_NODES: RoadmapNode[] = [
  {
    id: 'math-foundations',
    title: 'Linear Algebra & Vector Calculus',
    description: 'Matrix decompositions, eigenvalues, gradients, Jacobians, and multidimensional chain rule.',
    category: 'Foundations',
    estimatedHours: 12,
    prerequisites: [],
    status: 'completed',
    masteryPercentage: 95,
    linkedResourceIds: ['res-1', 'res-3'],
    keyConcepts: ['Eigenvalues', 'Matrix multiplication', 'Gradients', 'Jacobians']
  },
  {
    id: 'nn-basics',
    title: 'Neural Networks & Backpropagation',
    description: 'Feed-forward networks, non-linear activations, computational graphs, and backward passes.',
    category: 'Core Deep Learning',
    estimatedHours: 16,
    prerequisites: ['math-foundations'],
    status: 'completed',
    masteryPercentage: 85,
    linkedResourceIds: ['res-1'],
    keyConcepts: ['ReLU', 'Computational Graph', 'Chain Rule', 'Batch Normalization']
  },
  {
    id: 'optimization',
    title: 'Optimization Algorithms & Loss Landscapes',
    description: 'SGD with momentum, RMSprop, Adam bias correction, and categorical cross-entropy dynamics.',
    category: 'Optimization',
    estimatedHours: 14,
    prerequisites: ['math-foundations'],
    status: 'in-progress',
    masteryPercentage: 54,
    linkedResourceIds: ['res-3'],
    keyConcepts: ['Adam Optimizer', 'Momentum', 'Cross-Entropy', 'Learning Rate Scheduling']
  },
  {
    id: 'cnn-vision',
    title: 'Convolutional Vision Architectures',
    description: 'Spatial feature extraction, kernel pooling, residual connections (ResNet), and vision backbones.',
    category: 'Computer Vision',
    estimatedHours: 18,
    prerequisites: ['nn-basics'],
    status: 'completed',
    masteryPercentage: 88,
    linkedResourceIds: ['res-1'],
    keyConcepts: ['Convolutions', 'Feature Maps', 'Residual Skip Connections', 'Pooling']
  },
  {
    id: 'transformers',
    title: 'Attention Mechanisms & Transformers',
    description: 'Query-Key-Value routing, Scaled Dot-Product, Multi-Head projections, and positional encoding.',
    category: 'Sequence Models',
    estimatedHours: 24,
    prerequisites: ['nn-basics', 'optimization'],
    status: 'in-progress',
    masteryPercentage: 84,
    linkedResourceIds: ['res-2'],
    keyConcepts: ['Scaled Dot-Product', 'Multi-Head Attention', 'Positional Encoding', 'Softmax Scaling']
  },
  {
    id: 'multimodal',
    title: 'Multimodal Vision-Language Alignment',
    description: 'Dual-encoder architectures (CLIP), contrastive alignment, temperature scaling, and zero-shot inference.',
    category: 'Multimodal AI',
    estimatedHours: 20,
    prerequisites: ['transformers', 'cnn-vision'],
    status: 'in-progress',
    masteryPercentage: 66,
    linkedResourceIds: ['res-4'],
    keyConcepts: ['CLIP', 'Contrastive Loss', 'L2 Normalization', 'Zero-shot Classification']
  },
  {
    id: 'rlhf-align',
    title: 'RLHF & Preference Alignment',
    description: 'Reward modeling, Proximal Policy Optimization (PPO), KL divergence penalties, and DPO.',
    category: 'Alignment & Safety',
    estimatedHours: 22,
    prerequisites: ['transformers'],
    status: 'in-progress',
    masteryPercentage: 42,
    linkedResourceIds: ['res-5'],
    keyConcepts: ['PPO', 'KL Penalty', 'Reward Modeling', 'Reward Hacking Prevention']
  },
  {
    id: 'agentic-rag',
    title: 'Multimodal RAG & Autonomous Learning Agents',
    description: 'Vector chunk indexing, hybrid sparse-dense retrieval, source grounding verification, and self-reflection.',
    category: 'Advanced Track D',
    estimatedHours: 28,
    prerequisites: ['transformers', 'multimodal'],
    status: 'locked',
    masteryPercentage: 15,
    linkedResourceIds: ['res-2', 'res-4'],
    keyConcepts: ['RAG Triad', 'Faithfulness Evaluation', 'Source Citations', 'Adaptive Tutoring']
  }
];
