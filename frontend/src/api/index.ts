import api from '../utils/request';
import type { User, Question, AnswerRecord, UserStats, ApiResponse, PaginatedResponse, Favorite, WrongBook, DailyPractice, Statistics } from '../types';

// 认证相关 API
export const authApi = {
  // 注册
  register: (data: { username: string; password: string; email?: string }) => {
    return api.post<ApiResponse<{ id: number; username: string }>>('/auth/register', data);
  },

  // 登录
  login: (data: { username: string; password: string }) => {
    return api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data);
  },

  // 获取当前用户
  getCurrentUser: () => {
    return api.get<ApiResponse<User>>('/auth/me');
  },

  // 获取用户统计
  getUserStats: () => {
    return api.get<ApiResponse<UserStats>>('/auth/stats');
  },

  // 修改密码
  changePassword: (data: { old_password: string; new_password: string }) => {
    return api.post<ApiResponse<null>>('/auth/change-password', data);
  },
};

// 题目相关 API
export const questionApi = {
  // 获取题目列表
  getQuestions: (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    difficulty?: string;
    tags?: string;
    type?: string;
  }) => {
    return api.get<ApiResponse<PaginatedResponse<Question>>>('/questions', { params });
  },

  // 获取单个题目
  getQuestion: (id: number) => {
    return api.get<ApiResponse<Question>>(`/questions/${id}`);
  },

  // 创建题目
  createQuestion: (data: Partial<Question>) => {
    return api.post<ApiResponse<Question>>('/questions', data);
  },

  // 更新题目
  updateQuestion: (id: number, data: Partial<Question>) => {
    return api.put<ApiResponse<Question>>(`/questions/${id}`, data);
  },

  // 删除题目
  deleteQuestion: (id: number) => {
    return api.delete<ApiResponse<void>>(`/questions/${id}`);
  },

  // 获取分类列表
  getCategories: () => {
    return api.get<ApiResponse<string[]>>('/questions/categories');
  },

  // 获取标签列表
  getTags: () => {
    return api.get<ApiResponse<string[]>>('/questions/tags');
  },

  // 批量导入题目
  importQuestions: (questions: Partial<Question>[]) => {
    return api.post<ApiResponse<{ imported: number; skipped: number; failed: number; errors: string[] }>>('/questions/import', { questions });
  },
};

// 答题相关 API
export const answerApi = {
  // 提交答案
  submitAnswer: (data: { question_id: number; user_answer: string; response_time?: number }) => {
    return api.post<ApiResponse<{ is_correct: boolean; correct_answer: string; analysis: string; streak_days: number }>>('/answers/submit', data);
  },

  // 获取答题记录
  getAnswerRecords: (params?: {
    page?: number;
    pageSize?: number;
    is_correct?: boolean;
  }) => {
    return api.get<ApiResponse<PaginatedResponse<AnswerRecord>>>('/answers/records', { params });
  },

  // 获取错题
  getWrongQuestions: () => {
    return api.get<ApiResponse<AnswerRecord[]>>('/answers/wrong');
  },
};

// 练习功能 API
export const practiceApi = {
  // 收藏
  getFavorites: (params?: { page?: number; pageSize?: number }) => {
    return api.get<ApiResponse<PaginatedResponse<Favorite>>>('/practice/favorites', { params });
  },
  addFavorite: (questionId: number) => {
    return api.post<ApiResponse<void>>('/practice/favorites', { question_id: questionId });
  },
  removeFavorite: (questionId: number) => {
    return api.delete<ApiResponse<void>>(`/practice/favorites/${questionId}`);
  },

  // 错题本
  getWrongBook: (params?: { page?: number; pageSize?: number; mastered?: boolean }) => {
    return api.get<ApiResponse<PaginatedResponse<WrongBook>>>('/practice/wrong-book', { params });
  },
  markReviewed: (questionId: number) => {
    return api.post<ApiResponse<void>>(`/practice/wrong-book/${questionId}/review`);
  },

  // 每日练习
  getDailyPractice: () => {
    return api.get<ApiResponse<DailyPractice>>('/practice/daily');
  },

  // 统计
  getStatistics: () => {
    return api.get<ApiResponse<Statistics>>('/practice/statistics');
  },

  // 获取练习题目（支持排除已掌握）
  getPracticeQuestions: (params?: {
    category?: string;
    difficulty?: string;
    type?: string;
    exclude_mastered?: string;
  }) => {
    return api.get<ApiResponse<{ list: Question[]; total: number; available: number }>>('/practice/questions', { params });
  },
};
