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

export const SCHOOL_ROADMAP_NODES: RoadmapNode[] = [
  {
    id: 'school-math-foundations',
    title: 'Real Numbers & Polynomials',
    description: 'Euclid’s division lemma, fundamental theorem of arithmetic, and zeroes of polynomials.',
    category: 'Mathematics',
    estimatedHours: 10,
    prerequisites: [],
    status: 'completed',
    masteryPercentage: 92,
    linkedResourceIds: [],
    keyConcepts: ['Prime Factorization', 'Irrationality Proofs', 'Degree of Polynomials', 'Zeroes']
  },
  {
    id: 'school-algebra',
    title: 'Linear Equations & Quadratic Equations',
    description: 'Graphical & algebraic solutions, quadratic formula, and discriminant nature of roots.',
    category: 'Mathematics',
    estimatedHours: 14,
    prerequisites: ['school-math-foundations'],
    status: 'completed',
    masteryPercentage: 86,
    linkedResourceIds: [],
    keyConcepts: ['Elimination Method', 'Quadratic Formula', 'Discriminant', 'Word Problems']
  },
  {
    id: 'school-physics-light',
    title: 'Light: Reflection and Refraction',
    description: 'Spherical mirrors, ray diagrams, mirror formula, Snell’s law, and lens power.',
    category: 'Science (Physics)',
    estimatedHours: 12,
    prerequisites: [],
    status: 'completed',
    masteryPercentage: 80,
    linkedResourceIds: [],
    keyConcepts: ['Focal Length', 'Mirror Formula', 'Refractive Index', 'Lens Power']
  },
  {
    id: 'school-chem-reactions',
    title: 'Chemical Reactions and Equations',
    description: 'Balancing equations, types of reactions, oxidation-reduction, and corrosion.',
    category: 'Science (Chemistry)',
    estimatedHours: 12,
    prerequisites: [],
    status: 'in-progress',
    masteryPercentage: 74,
    linkedResourceIds: [],
    keyConcepts: ['Balancing Equations', 'Exothermic Reactions', 'Redox Reactions', 'Precipitation']
  },
  {
    id: 'school-bio-lifeprocesses',
    title: 'Life Processes & Cellular Nutrition',
    description: 'Autotrophic photosynthesis, human digestive system, respiration, and circulatory transport.',
    category: 'Science (Biology)',
    estimatedHours: 16,
    prerequisites: [],
    status: 'in-progress',
    masteryPercentage: 68,
    linkedResourceIds: [],
    keyConcepts: ['Photosynthesis Light Reactions', 'Xylem & Phloem', 'ATP Respiration', 'Double Circulation']
  },
  {
    id: 'school-trig',
    title: 'Introduction to Trigonometry',
    description: 'Trigonometric ratios of acute angles, standard values (0° to 90°), and trigonometric identities.',
    category: 'Mathematics',
    estimatedHours: 15,
    prerequisites: ['school-algebra'],
    status: 'in-progress',
    masteryPercentage: 55,
    linkedResourceIds: [],
    keyConcepts: ['sin/cos/tan definitions', 'Pythagorean Identities', 'Complementary Angles', 'Heights & Distances']
  }
];

export const COLLEGE_ROADMAP_NODES: RoadmapNode[] = [
  {
    id: 'college-programming-dsa',
    title: 'Data Structures & Algorithms',
    description: 'Time complexity analysis, recursion, linked lists, trees, graphs, sorting, and dynamic programming.',
    category: 'Computer Science',
    estimatedHours: 25,
    prerequisites: [],
    status: 'completed',
    masteryPercentage: 90,
    linkedResourceIds: [],
    keyConcepts: ['Asymptotic Complexity', 'Binary Search Trees', 'Graph Traversal (BFS/DFS)', 'Dynamic Programming']
  },
  {
    id: 'college-dbms',
    title: 'Database Management Systems & SQL',
    description: 'Relational algebra, SQL queries, normalization (1NF to BCNF), ACID transactions, and indexing.',
    category: 'Databases',
    estimatedHours: 20,
    prerequisites: ['college-programming-dsa'],
    status: 'in-progress',
    masteryPercentage: 78,
    linkedResourceIds: [],
    keyConcepts: ['Relational Schema', 'SQL Joins & Group By', 'BCNF Normalization', 'ACID Transactions & Concurrency']
  },
  {
    id: 'college-os',
    title: 'Operating Systems & Concurrency',
    description: 'Process scheduling, virtual memory, paging, race conditions, semaphores, and deadlock handling.',
    category: 'Systems',
    estimatedHours: 22,
    prerequisites: ['college-programming-dsa'],
    status: 'completed',
    masteryPercentage: 82,
    linkedResourceIds: [],
    keyConcepts: ['CPU Scheduling', 'Virtual Memory & Paging', 'Semaphores & Mutexes', 'Banker’s Algorithm']
  },
  {
    id: 'college-networks',
    title: 'Computer Networks & Internet Protocols',
    description: 'OSI 7-layer model, TCP/IP handshake, congestion control, IP subnetting, DNS, and HTTP/HTTPS.',
    category: 'Networking',
    estimatedHours: 18,
    prerequisites: ['college-os'],
    status: 'in-progress',
    masteryPercentage: 64,
    linkedResourceIds: [],
    keyConcepts: ['TCP 3-Way Handshake', 'CIDR Subnetting', 'Routing Algorithms', 'Transport Layer Security']
  },
  {
    id: 'college-webtech',
    title: 'Web Technologies & REST APIs',
    description: 'Full-stack client-server architecture, asynchronous JavaScript/TypeScript, REST endpoints, and authentication.',
    category: 'Software Engineering',
    estimatedHours: 20,
    prerequisites: ['college-programming-dsa'],
    status: 'in-progress',
    masteryPercentage: 72,
    linkedResourceIds: [],
    keyConcepts: ['RESTful Design', 'JWT Authentication', 'Asynchronous Promises', 'State Management']
  },
  {
    id: 'college-aiml',
    title: 'Machine Learning & Neural Modeling',
    description: 'Supervised vs unsupervised learning, gradient descent, neural networks, and model evaluation.',
    category: 'Artificial Intelligence',
    estimatedHours: 24,
    prerequisites: ['college-programming-dsa'],
    status: 'in-progress',
    masteryPercentage: 60,
    linkedResourceIds: [],
    keyConcepts: ['Gradient Descent', 'Backpropagation', 'Overfitting & Regularization', 'Evaluation Metrics (F1/AUC)']
  }
];

export function getPersonalizedRoadmap(level?: string): RoadmapNode[] {
  if (level === 'school') return SCHOOL_ROADMAP_NODES;
  if (level === 'college') return COLLEGE_ROADMAP_NODES;
  return ROADMAP_NODES;
}
