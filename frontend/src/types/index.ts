export interface User {
  id: number;
  username: string;
  email?: string;
  created_at?: string;
}

export interface Question {
  id: number;
  title: string;
  content?: string;
  type: 'choice' | 'judge';
  options?: string[];
  answer: string;
  analysis?: string;
  difficulty: number;
  category?: string;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnswerRecord {
  id: number;
  user_id: number;
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  created_at: string;
  question?: Question;
}

export interface UserStats {
  id: number;
  user_id: number;
  total_answered: number;
  correct_count: number;
  wrong_count: number;
  streak_days: number;
  last_answer_date: string;
  total_time_spent: number;
  avg_response_time: number;
}

export interface Favorite {
  id: number;
  user_id: number;
  question_id: number;
  created_at: string;
  question?: Question;
}

export interface WrongBook {
  id: number;
  user_id: number;
  question_id: number;
  wrong_count: number;
  last_wrong_at: string;
  reviewed_at?: string;
  mastered: boolean;
  created_at: string;
  question?: Question;
}

export interface Achievement {
  id: number;
  user_id: number;
  type: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
  created_at: string;
}

export interface DailyPractice {
  id: number;
  date: string;
  question_id: number;
  question?: Question;
}

export interface Statistics {
  stats: UserStats;
  daily_stats: { date: string; count: number }[];
  category_stats: { category: string; count: number; correct: number }[];
  favorite_count: number;
  wrong_count: number;
  achievement_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
