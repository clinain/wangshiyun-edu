import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  User,
  Lesson,
  Resource,
  Portfolio,
  PPTRecord,
  FavoriteItem,
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  CreateLessonRequest,
  GenerateLessonRequest,
  CreatePortfolioRequest,
} from '@/types';

const BASE_URL = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3003/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const responseHandler = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (!response.data) {
    throw new Error('服务器响应为空');
  }
  if (!response.data.success) {
    throw new Error(response.data.message || '请求失败');
  }
  // delete 等 void 操作不返回 data 字段，这是正常的
  return response.data.data as T;
};

export const authAPI = {
  login: async (data: LoginRequest): Promise<{ user: User; token: string }> => {
    const response = await axiosInstance.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    return responseHandler(response);
  },

  register: async (data: RegisterRequest): Promise<{ user: User; token: string }> => {
    const response = await axiosInstance.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return responseHandler(response);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<User>>('/auth/me');
    return responseHandler(response);
  },

  getStats: async (): Promise<{ lessonCount: number; pptCount: number; portfolioCount: number; favoriteCount: number }> => {
    const response = await axiosInstance.get<ApiResponse<{ lessonCount: number; pptCount: number; portfolioCount: number; favoriteCount: number }>>('/auth/stats');
    return responseHandler(response);
  },

  updateProfile: async (data: { name?: string; email?: string; school?: string }): Promise<User> => {
    const response = await axiosInstance.put<ApiResponse<User>>('/auth/profile', data);
    return responseHandler(response);
  },

  deleteAccount: async (): Promise<void> => {
    const response = await axiosInstance.delete<ApiResponse<void>>('/auth/account');
    return responseHandler(response);
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await axiosInstance.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return responseHandler(response);
  },
};

export const lessonAPI = {
  create: async (data: CreateLessonRequest & { overwrite?: boolean }): Promise<Lesson> => {
    const response = await axiosInstance.post<ApiResponse<Lesson>>('/lessons', data);
    return responseHandler(response);
  },

  checkTitle: async (title: string, excludeId?: number): Promise<{ exists: boolean; message: string }> => {
    const response = await axiosInstance.post<ApiResponse<{ exists: boolean; message: string }>>('/lessons/check-title', { title, excludeId });
    return responseHandler(response);
  },

  list: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    subject?: string;
    status?: string;
  }): Promise<{ lessons: Lesson[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ lessons: Lesson[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/lessons', { params });
    return responseHandler(response);
  },

  detail: async (id: number): Promise<Lesson> => {
    const response = await axiosInstance.get<ApiResponse<Lesson>>(`/lessons/${id}`);
    return responseHandler(response);
  },

  update: async (id: number, data: Partial<CreateLessonRequest>): Promise<Lesson> => {
    const response = await axiosInstance.put<ApiResponse<Lesson>>(`/lessons/${id}`, data);
    return responseHandler(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/lessons/${id}`);
    return responseHandler(response);
  },

  publicList: async (params?: {
    page?: number;
    pageSize?: number;
    subject?: string;
    keyword?: string;
  }): Promise<{ lessons: Lesson[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ lessons: Lesson[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/lessons/public', { params });
    return responseHandler(response);
  },

  generate: async (data: GenerateLessonRequest): Promise<Lesson> => {
    const response = await axiosInstance.post<ApiResponse<Lesson>>('/lessons/generate', data);
    return responseHandler(response);
  },

  generateSubjectAware: async (data: {
    subject: string;
    grade: string;
    topic: string;
    title?: string;
    chapter?: string;
    teachingHours?: number;
    studentLevel?: string;
    customRequirements?: string;
  }): Promise<any> => {
    const response = await axiosInstance.post<ApiResponse<any>>('/lessons/generate-aware', data);
    return responseHandler(response);
  },

  getSubjects: async (stage?: string): Promise<any> => {
    const response = await axiosInstance.get<ApiResponse<any>>('/lessons/subjects', {
      params: stage ? { stage } : {}
    });
    return responseHandler(response);
  },

  export: async (id: number, format: string = 'docx'): Promise<Blob> => {
    const response = await axiosInstance.get(`/lessons/${id}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const resourceAPI = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    type?: string;
    subject?: string;
    grade?: string;
  }): Promise<{ resources: Resource[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ resources: Resource[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/resources', { params });
    return responseHandler(response);
  },

  detail: async (id: number): Promise<Resource> => {
    const response = await axiosInstance.get<ApiResponse<Resource>>(`/resources/${id}`);
    return responseHandler(response);
  },

  upload: async (formData: FormData): Promise<Resource> => {
    const response = await axiosInstance.post<ApiResponse<Resource>>('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return responseHandler(response);
  },

  myResources: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<{ resources: Resource[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ resources: Resource[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/resources/my', { params });
    return responseHandler(response);
  },

  favorites: async (params?: {
    page?: number;
    pageSize?: number;
    type?: 'all' | 'resource' | 'portfolio';
  }): Promise<FavoriteItem[]> => {
    const response = await axiosInstance.get<ApiResponse<FavoriteItem[]>>('/resources/favorites', { params });
    return responseHandler(response);
  },

  toggleFavorite: async (id: number): Promise<void> => {
    const response = await axiosInstance.post<ApiResponse<void>>(`/resources/${id}/favorite`);
    return responseHandler(response);
  },

  download: async (id: number): Promise<Blob> => {
    const response = await axiosInstance.get(`/resources/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/resources/${id}`);
    if (!response.data) {
      throw new Error('服务器响应为空');
    }
    if (!response.data.success) {
      throw new Error(response.data.message || '删除失败');
    }
  },
};

export const portfolioAPI = {
  create: async (data: CreatePortfolioRequest): Promise<Portfolio> => {
    const response = await axiosInstance.post<ApiResponse<Portfolio>>('/portfolios', data);
    return responseHandler(response);
  },

  list: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/portfolios', { params });
    return responseHandler(response);
  },

  detail: async (id: number): Promise<Portfolio> => {
    const response = await axiosInstance.get<ApiResponse<Portfolio>>(`/portfolios/${id}`);
    return responseHandler(response);
  },

  update: async (id: number, data: Partial<CreatePortfolioRequest>): Promise<Portfolio> => {
    const response = await axiosInstance.put<ApiResponse<Portfolio>>(`/portfolios/${id}`, data);
    return responseHandler(response);
  },

  togglePublic: async (id: number, isPublic: boolean): Promise<Portfolio> => {
    const response = await axiosInstance.put<ApiResponse<Portfolio>>(`/portfolios/${id}`, { isPublic });
    return responseHandler(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/portfolios/${id}`);
    return responseHandler(response);
  },

  publicList: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/portfolios/public', { params });
    return responseHandler(response);
  },

  allPublic: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axios.get<ApiResponse<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>(`${BASE_URL}/portfolios/public`, { params });
    return response.data.data || { portfolios: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
  },

  share: async (id: number): Promise<{ shareUrl: string; shareCount: number }> => {
    const response = await axiosInstance.post<ApiResponse<{ shareUrl: string; shareCount: number }>>(`/portfolios/${id}/share`);
    return responseHandler(response);
  },

  toggleFavorite: async (id: number): Promise<{ isFavorited: boolean }> => {
    const response = await axiosInstance.post<ApiResponse<{ isFavorited: boolean }>>(`/portfolios/${id}/favorite`);
    return responseHandler(response);
  },

  export: async (id: number): Promise<Blob> => {
    const response = await axiosInstance.get(`/portfolios/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const pptAPI = {
  checkTitle: async (title: string): Promise<{ exists: boolean; pptId: number | null; title: string | null }> => {
    const response = await axiosInstance.get<ApiResponse<{ exists: boolean; pptId: number | null; title: string | null }>>('/ppt/check-title', { params: { title } });
    return responseHandler(response);
  },

  generate: async (lessonId: number, replaceExisting?: boolean, useAI: boolean = true): Promise<PPTRecord> => {
    const response = await axiosInstance.post<ApiResponse<PPTRecord>>('/ppt/generate', { lessonId, replaceExisting, useAI });
    return responseHandler(response);
  },

  createCustom: async (data: {
    title: string;
    pages: Array<{
      type?: string;
      title: string;
      content: Record<string, unknown>;
      layout?: string;
      notes?: string;
    }>;
    templateStyle?: string;
    replaceExisting?: boolean;
  }): Promise<PPTRecord> => {
    const response = await axiosInstance.post<ApiResponse<PPTRecord>>('/ppt/create-custom', data);
    return responseHandler(response);
  },

  sync: async (lessonId: number): Promise<PPTRecord> => {
    const response = await axiosInstance.post<ApiResponse<PPTRecord>>('/ppt/sync', { lessonId });
    return responseHandler(response);
  },

  list: async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ ppts: PPTRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ ppts: PPTRecord[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/ppt', {
      params: { ...params, _t: Date.now() }
    });
    return responseHandler(response);
  },

  detail: async (id: number): Promise<PPTRecord> => {
    const response = await axiosInstance.get<ApiResponse<PPTRecord>>(`/ppt/${id}`);
    return responseHandler(response);
  },

  update: async (id: number, data: Partial<{ title: string }>): Promise<PPTRecord> => {
    const response = await axiosInstance.put<ApiResponse<PPTRecord>>(`/ppt/${id}`, data);
    return responseHandler(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/ppt/${id}`);
    return responseHandler(response);
  },

  export: async (id: number): Promise<Blob> => {
    const response = await axiosInstance.get(`/ppt/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export interface AIProvider {
  id: string;
  name: string;
  model: string;
  available: boolean;
}

export interface AIStatus {
  currentProvider: string;
  currentProviderInfo: AIProvider | null;
  availableProviders: string[];
  allProviders: AIProvider[];
  status: Record<string, { available: boolean; lastSuccess: string | null; errorCount: number }>;
}

export interface AITestResult {
  provider: string;
  success: boolean;
  response?: string;
  error?: string;
}

export const aiAPI = {
  getStatus: async (): Promise<AIStatus> => {
    const response = await axiosInstance.get<ApiResponse<AIStatus>>('/ai/status');
    return responseHandler(response);
  },

  getProviders: async (): Promise<AIProvider[]> => {
    const response = await axiosInstance.get<ApiResponse<AIProvider[]>>('/ai/providers');
    return responseHandler(response);
  },

  switchProvider: async (provider: string): Promise<{ currentProvider: string; currentProviderInfo: AIProvider }> => {
    const response = await axiosInstance.post<ApiResponse<{ currentProvider: string; currentProviderInfo: AIProvider }>>('/ai/switch-provider', { provider });
    return responseHandler(response);
  },

  test: async (provider?: string): Promise<{ provider: string; response: string }> => {
    const response = await axiosInstance.post<ApiResponse<{ provider: string; response: string }>>('/ai/test', { provider });
    return responseHandler(response);
  },

  testAll: async (): Promise<AITestResult[]> => {
    const response = await axiosInstance.post<ApiResponse<AITestResult[]>>('/ai/test-all');
    return responseHandler(response);
  },

  chat: async (messages: { role: string; content: string }[], options?: { provider?: string }): Promise<{ content: string; provider: string }> => {
    const response = await axiosInstance.post<ApiResponse<{ content: string; provider: string }>>('/ai/chat', { messages, options });
    return responseHandler(response);
  },
};

// 新课标查询 API
export interface CurriculumStandard {
  subject: string;
  grade: string;
  stage: string;
  category: string;
  keywords: string[];
  coreQualities: string[];
  coreQualityDetails: {
    keywords: string[];
    description: string;
  } | null;
  teachingObjectives: {
    knowledge: string[];
    ability: string[];
    emotion: string[];
  };
  teachingProcess: {
    introduction: string[];
    newTeaching: string[];
    practice: string[];
    summary: string[];
  };
  assessment: string[];
  suggestions: {
    teachingObjectives: string[];
    teachingContent: string[];
    teachingProcess: string[];
    coreQualities: string[];
  };
}

export const standardAPI = {
  getCurriculum: async (subject: string, grade?: string): Promise<CurriculumStandard | null> => {
    const response = await axiosInstance.get<ApiResponse<CurriculumStandard | null>>('/standard/curriculum', {
      params: { subject, grade }
    });
    return responseHandler(response);
  },

  getSubjects: async (): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>('/standard/subjects');
    return responseHandler(response);
  },

  getGrades: async (): Promise<any> => {
    const response = await axiosInstance.get<ApiResponse<any>>('/standard/grades');
    return responseHandler(response);
  },

  analyze: async (lessonPlan: {
    title?: string;
    subject: string;
    grade?: string;
    teachingGoals?: string;
    keyPoints?: string;
    teachingProcess?: string;
    homework?: string;
    summary?: string;
  }): Promise<any> => {
    const response = await axiosInstance.post<ApiResponse<any>>('/standard/analyze', lessonPlan);
    return responseHandler(response);
  },
};

// 评论 API
export interface CommentItem {
  id: number;
  resourceId: number;
  userId: number;
  parentId: number | null;
  content: string;
  commentType: 'comment' | 'question' | 'review';
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userAvatar: string | null;
  replyCount?: number;
  recentReplies?: CommentItem[];
}

export interface CommentStats {
  totalComments: number;
  totalQuestions: number;
  totalReviews: number;
  totalDiscussions: number;
}

export const commentAPI = {
  // 获取评论列表（支持 resources 和 portfolios）
  list: async (entityType: string, entityId: number, params?: { page?: number; pageSize?: number; type?: string }): Promise<{ comments: CommentItem[]; pagination: any }> => {
    const response = await axiosInstance.get(`/${entityType}/${entityId}/comments`, { params });
    return responseHandler(response);
  },

  // 获取评论回复列表
  getReplies: async (commentId: number, params?: { page?: number; pageSize?: number }): Promise<{ replies: CommentItem[]; pagination: any }> => {
    const response = await axiosInstance.get(`/comments/${commentId}/replies`, { params });
    return responseHandler(response);
  },

  // 发表评论（支持 resources 和 portfolios）
  create: async (entityType: string, entityId: number, data: { content: string; commentType?: string; parentId?: number }): Promise<CommentItem> => {
    const response = await axiosInstance.post(`/${entityType}/${entityId}/comments`, data);
    return responseHandler(response);
  },

  // 删除评论
  delete: async (commentId: number): Promise<void> => {
    const response = await axiosInstance.delete(`/comments/${commentId}`);
    return responseHandler(response);
  },

  // 获取评论统计（支持 resources 和 portfolios）
  getStats: async (entityType: string, entityId: number): Promise<CommentStats> => {
    const response = await axiosInstance.get(`/${entityType}/${entityId}/comments/stats`);
    return responseHandler(response);
  },
};

// ========== 知识库 API ==========
export interface KnowledgeBaseSubject {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
}

export interface KnowledgeBaseSubjectDetail extends KnowledgeBaseSubject {
  coreCompetencies?: any[];
  sections?: any[];
  curriculumObjectives?: any[];
}

export interface KnowledgeBaseSearchResult {
  subjectId: string;
  subjectName: string;
  sectionId?: string;
  sectionTitle?: string;
  content: string;
  keyword: string;
}

export interface KnowledgeBaseCategory {
  id: string;
  name: string;
  count: number;
}

export interface KnowledgeBaseStats {
  totalSubjects: number;
  totalCategories: number;
  totalSections: number;
}

export const knowledgeBaseAPI = {
  // 获取知识库概览
  getIndex: async (): Promise<{ subjects: KnowledgeBaseSubject[]; stats: KnowledgeBaseStats }> => {
    const response = await axiosInstance.get('/knowledge-base');
    return responseHandler(response);
  },

  // 获取学科列表
  getSubjects: async (category?: string): Promise<KnowledgeBaseSubject[]> => {
    const params = category ? { category } : {};
    const response = await axiosInstance.get('/knowledge-base/subjects', { params });
    return responseHandler(response);
  },

  // 获取学科详情
  getSubjectDetail: async (id: string): Promise<KnowledgeBaseSubjectDetail> => {
    const response = await axiosInstance.get(`/knowledge-base/subjects/${id}`);
    return responseHandler(response);
  },

  // 获取学科章节
  getSection: async (subjectId: string, sectionId: string): Promise<any> => {
    const response = await axiosInstance.get(`/knowledge-base/subjects/${subjectId}/sections/${sectionId}`);
    return responseHandler(response);
  },

  // 获取核心素养
  getCompetencies: async (id: string): Promise<any[]> => {
    const response = await axiosInstance.get(`/knowledge-base/subjects/${id}/competencies`);
    return responseHandler(response);
  },

  // 获取核心素养概览
  getCompetenciesOverview: async (): Promise<any[]> => {
    const response = await axiosInstance.get('/knowledge-base/competencies-overview');
    return responseHandler(response);
  },

  // 获取分类列表
  getCategories: async (): Promise<KnowledgeBaseCategory[]> => {
    const response = await axiosInstance.get('/knowledge-base/categories');
    return responseHandler(response);
  },

  // 搜索知识库
  search: async (keyword: string): Promise<{ results: KnowledgeBaseSearchResult[] }> => {
    const response = await axiosInstance.get('/knowledge-base/search', { params: { keyword } });
    return responseHandler(response);
  },

  // 获取统计信息
  getStats: async (): Promise<KnowledgeBaseStats> => {
    const response = await axiosInstance.get('/knowledge-base/stats');
    return responseHandler(response);
  },
};

export default axiosInstance;


