// Online Examination Engine with Questions Bank, Timer, and Scoring
export const EXAM_QUESTIONS = [
  {
    id: 1,
    category: 'Artificial Intelligence',
    difficulty: 'Medium',
    question: 'Which of the following loss functions is most suitable for multi-class classification problems?',
    options: [
      { id: 'A', text: 'Mean Squared Error (MSE)' },
      { id: 'B', text: 'Categorical Cross-Entropy' },
      { id: 'C', text: 'Binary Cross-Entropy' },
      { id: 'D', text: 'Hinge Loss' }
    ],
    correctAnswer: 'B',
    explanation: 'Categorical Cross-Entropy is standard for multi-class classification where each sample belongs to exactly one class.'
  },
  {
    id: 2,
    category: 'Computer Vision',
    difficulty: 'Hard',
    question: 'In deep learning for facial landmark detection, how many 3D landmarks does Google MediaPipe Face Mesh predict?',
    options: [
      { id: 'A', text: '68 landmarks' },
      { id: 'B', text: '128 landmarks' },
      { id: 'C', text: '478 landmarks' },
      { id: 'D', text: '1024 landmarks' }
    ],
    correctAnswer: 'C',
    explanation: 'MediaPipe Face Mesh predicts 468 mesh landmarks plus 10 refined iris landmarks, totaling 478 3D landmarks.'
  },
  {
    id: 3,
    category: 'Data Structures',
    difficulty: 'Easy',
    question: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (AVL / Red-Black Tree)?',
    options: [
      { id: 'A', text: 'O(1)' },
      { id: 'B', text: 'O(log n)' },
      { id: 'C', text: 'O(n)' },
      { id: 'D', text: 'O(n log n)' }
    ],
    correctAnswer: 'B',
    explanation: 'In balanced BSTs, maximum height is bounded by O(log n), ensuring O(log n) lookup time.'
  },
  {
    id: 4,
    category: 'Machine Learning',
    difficulty: 'Medium',
    question: 'What is the primary cause of vanishing gradients in deep recurrent neural networks (RNNs)?',
    options: [
      { id: 'A', text: 'Continuous multiplication of small weight derivatives through backpropagation through time' },
      { id: 'B', text: 'Using ReLU activation functions in all hidden units' },
      { id: 'C', text: 'High learning rate values (> 0.1)' },
      { id: 'D', text: 'Overfitting due to excessive dataset size' }
    ],
    correctAnswer: 'A',
    explanation: 'Backpropagation Through Time (BPTT) with sigmoid or tanh results in gradients shrinking exponentially over long time sequences.'
  },
  {
    id: 5,
    category: 'Cybersecurity',
    difficulty: 'Medium',
    question: 'Which browser API enables web applications to detect when a candidate navigates away or switches tabs?',
    options: [
      { id: 'A', text: 'WebRTC API' },
      { id: 'B', text: 'Page Visibility API (document.visibilityState)' },
      { id: 'C', text: 'Broadcast Channel API' },
      { id: 'D', text: 'Intersection Observer API' }
    ],
    correctAnswer: 'B',
    explanation: 'The Page Visibility API provides events like "visibilitychange" to know whether the page is visible or minimized/hidden in the background.'
  },
  {
    id: 6,
    category: 'Cloud & Distributed Systems',
    difficulty: 'Medium',
    question: 'In the CAP Theorem, which two properties are commonly favored by NoSQL databases like Apache Cassandra in partition network failures?',
    options: [
      { id: 'A', text: 'Consistency and Availability' },
      { id: 'B', text: 'Availability and Partition Tolerance (AP)' },
      { id: 'C', text: 'Consistency and Partition Tolerance (CP)' },
      { id: 'D', text: 'Atomicity and Durability' }
    ],
    correctAnswer: 'B',
    explanation: 'Cassandra is designed as an AP system, ensuring high availability and partition tolerance with eventual consistency.'
  },
  {
    id: 7,
    category: 'Deep Learning',
    difficulty: 'Hard',
    question: 'What is the key mechanism introduced by the Transformer architecture (Vaswani et al.) that replaced recurrent layers?',
    options: [
      { id: 'A', text: 'Spatial Convolution Pooling' },
      { id: 'B', text: 'Multi-Head Scaled Dot-Product Self-Attention' },
      { id: 'C', text: 'Dropout Regularization' },
      { id: 'D', text: 'Stochastic Gradient Descent with Momentum' }
    ],
    correctAnswer: 'B',
    explanation: 'Transformers rely entirely on multi-head self-attention mechanisms to compute dependencies between words in parallel.'
  },
  {
    id: 8,
    category: 'Operating Systems',
    difficulty: 'Easy',
    question: 'Which of the following conditions is NOT one of Coffman\'s four conditions necessary for a deadlock to occur?',
    options: [
      { id: 'A', text: 'Mutual Exclusion' },
      { id: 'B', text: 'Hold and Wait' },
      { id: 'C', text: 'Preemptive Scheduling' },
      { id: 'D', text: 'Circular Wait' }
    ],
    correctAnswer: 'C',
    explanation: 'Coffman\'s condition specifies "No Preemption" (resources cannot be forcibly confiscated), NOT preemptive scheduling.'
  },
  {
    id: 9,
    category: 'Computer Vision',
    difficulty: 'Medium',
    question: 'What does COCO stand for in the widely used COCO-SSD object detection benchmark?',
    options: [
      { id: 'A', text: 'Common Objects in Context' },
      { id: 'B', text: 'Computer Optical Coordinate Optimization' },
      { id: 'C', text: 'Convolutional Object Classification Order' },
      { id: 'D', text: 'Cascaded Open Color Operators' }
    ],
    correctAnswer: 'A',
    explanation: 'Microsoft COCO stands for Common Objects in Context, a benchmark dataset containing 80 object classes.'
  },
  {
    id: 10,
    category: 'Software Engineering',
    difficulty: 'Easy',
    question: 'What architectural principle is represented by the "S" in SOLID principles?',
    options: [
      { id: 'A', text: 'Stateful Component Design' },
      { id: 'B', text: 'Single Responsibility Principle' },
      { id: 'C', text: 'Synchronous Processing Priority' },
      { id: 'D', text: 'Shared Dependency Inversion' }
    ],
    correctAnswer: 'B',
    explanation: 'The Single Responsibility Principle states that a module, class, or function should have only one reason to change.'
  }
];

export class ExamEngine {
  constructor(options = {}) {
    this.questions = EXAM_QUESTIONS;
    this.durationMinutes = options.durationMinutes || 15;
    this.secondsRemaining = this.durationMinutes * 60;
    this.currentIndex = 0;
    this.answers = {}; // questionId: optionId ('A', 'B', ...)
    this.reviewed = new Set(); // questionIds marked for review
    this.timerInterval = null;
    this.isSubmitted = false;
    this.startTime = null;
    this.endTime = null;

    this.onTimerTick = null;
    this.onTimeExpired = null;
  }

  start(onTick, onExpired) {
    this.onTimerTick = onTick;
    this.onTimeExpired = onExpired;
    this.startTime = new Date();

    this.timerInterval = setInterval(() => {
      this.secondsRemaining--;
      if (this.onTimerTick) {
        this.onTimerTick(this.formatTime(this.secondsRemaining), this.secondsRemaining);
      }

      if (this.secondsRemaining <= 0) {
        clearInterval(this.timerInterval);
        if (this.onTimeExpired) {
          this.onTimeExpired();
        }
      }
    }, 1000);
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  selectAnswer(questionId, optionId) {
    if (this.isSubmitted) return;
    this.answers[questionId] = optionId;
  }

  toggleReview(questionId) {
    if (this.reviewed.has(questionId)) {
      this.reviewed.delete(questionId);
    } else {
      this.reviewed.add(questionId);
    }
  }

  getCurrentQuestion() {
    return this.questions[this.currentIndex];
  }

  goToNext() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  goToPrev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return true;
    }
    return false;
  }

  goToIndex(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
      return true;
    }
    return false;
  }

  submitExam() {
    if (this.isSubmitted) return this.getResultSummary();
    clearInterval(this.timerInterval);
    this.isSubmitted = true;
    this.endTime = new Date();
    return this.getResultSummary();
  }

  getResultSummary() {
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    const breakdown = this.questions.map(q => {
      const selected = this.answers[q.id];
      const isCorrect = selected === q.correctAnswer;
      if (!selected) {
        unattemptedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        questionId: q.id,
        question: q.question,
        category: q.category,
        selectedOption: selected || 'None',
        correctOption: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      };
    });

    const totalQuestions = this.questions.length;
    // Score out of 100%
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    return {
      totalQuestions,
      correctCount,
      wrongCount,
      unattemptedCount,
      scorePercentage,
      timeTaken: this.getTimeTaken(),
      breakdown
    };
  }

  getTimeTaken() {
    const elapsedSeconds = this.durationMinutes * 60 - Math.max(0, this.secondsRemaining);
    return this.formatTime(elapsedSeconds);
  }
}
