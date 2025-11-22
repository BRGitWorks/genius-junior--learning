export enum SubjectType {
  MATH = 'Math',
  SCIENCE = 'Science',
  COMPUTER = 'Computer Science',
  TAMIL = 'Tamil',
  HINDI = 'Hindi',
  KANNADA = 'Kannada'
}

export enum AppView {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PATH_VIEW = 'PATH_VIEW',
  SESSION = 'SESSION',
  DICTATION = 'DICTATION'
}

export interface UserProfile {
  name: string;
  age: number;
  interests: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isQuiz?: boolean;
  quizData?: QuizQuestion[];
  timestamp: number;
}

export interface LearningStats {
  sessionsCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface PathModule {
  id: string;
  title: string;
  description: string;
  status: 'locked' | 'current' | 'completed';
  topicQuery: string; // The prompt to send to Gemini to start the lesson
  score?: number;
}

export interface LearningPath {
  id: string;
  subject: SubjectType;
  modules: PathModule[];
  totalXp: number;
}

export interface DictationItem {
  id: string;
  text: string;
  hint: string;
}