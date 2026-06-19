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
  SendVerificationCodeRequest,
  SendVerificationCodeResponse,
  Notification,
} from '@/types';

const BASE_URL = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || '/api';
const DEFAULT_TIMEOUT_MS = 120000;
const AI_GENERATION_TIMEOUT_MS = 600000;

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
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
    const requestUrl = error.config?.url || '';
    const isPublicPortfolioViewRequest = /^\/portfolios\/\d+$/.test(requestUrl);
    if (error.response?.status === 401 && !isPublicPortfolioViewRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // 处理非2xx状态码的错误响应，提取后端返回的错误消息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
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

  sendVerificationCode: async (data: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> => {
    const response = await axiosInstance.post<ApiResponse<SendVerificationCodeResponse>>('/auth/send-verification-code', data);
    return responseHandler(response);
  },

  sendLoginCode: async (data: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> => {
    const response = await axiosInstance.post<ApiResponse<SendVerificationCodeResponse>>('/auth/send-login-code', data);
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

  uploadAvatar: async (formData: FormData): Promise<User> => {
    const response = await axiosInstance.post<ApiResponse<User>>('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return responseHandler(response);
  },

  changePassword: async (data: { oldPassword: string; newPassword: string }): Promise<void> => {
    const response = await axiosInstance.post<ApiResponse<void>>('/auth/change-password', data);
    return responseHandler(response);
  },

  sendResetPasswordCode: async (data: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> => {
    const response = await axiosInstance.post<ApiResponse<SendVerificationCodeResponse>>('/auth/send-reset-password-code', data);
    return responseHandler(response);
  },

  resetPassword: async (data: { email: string; verificationCode: string; newPassword: string }): Promise<void> => {
    const response = await axiosInstance.post<ApiResponse<void>>('/auth/reset-password', data);
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
    const response = await axiosInstance.post<ApiResponse<any>>('/lessons/generate-aware', data, {
      timeout: AI_GENERATION_TIMEOUT_MS,
    });
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

export interface UnifiedResourceItem {
  id: number;
  title: string;
  resourceType: 'lesson' | 'ppt' | 'portfolio' | 'resource';
  subject?: string;
  grade?: string;
  createdAt: string;
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  ownerId: number;
  authorName?: string;
  fileUrl?: string;
  fileFormat?: string;
  fileSize?: number;
  category?: string;
  description?: string;
  tags?: string;
  coverUrl?: string;
}

export const resourceAPI = {
  all: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    type?: string;
    fileFormat?: string;
    subject?: string;
    grade?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ items: UnifiedResourceItem[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get('/resources/all', { params });
    if (!response.data?.success) {
      throw new Error(response.data?.message || '请求失败');
    }
    // pagination 在 response.data.pagination 中，不在 data.data 中
    return {
      items: response.data.data?.items || [],
      pagination: response.data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    };
  },

  list: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    type?: string;
    subject?: string;
    grade?: string;
    sortBy?: string;
    sortOrder?: string;
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
    source?: 'all' | 'uploaded' | 'downloaded';
  }): Promise<{ resources: Resource[]; portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ resources: Resource[]; portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/resources/my', { params });
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

  preview: async (id: number): Promise<string> => {
    const token = localStorage.getItem('token');
    const baseUrl = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || '/api';
    const url = `${baseUrl}/resources/${id}/preview`;
    return token ? `${url}?token=${token}` : url;
  },

  previewText: async (id: number): Promise<{ content: string; title: string; fileFormat: string }> => {
    const response = await axiosInstance.get(`/resources/${id}/preview-text`);
    return responseHandler(response);
  },

  togglePublic: async (id: number): Promise<void> => {
    const response = await axiosInstance.put<ApiResponse<void>>(`/resources/${id}/public`);
    return responseHandler(response);
  },

  copyToMy: async (id: number): Promise<Resource> => {
    const response = await axiosInstance.post<ApiResponse<Resource>>(`/resources/${id}/copy`);
    return responseHandler(response);
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
    subject?: string;
    grade?: string;
    category?: string;
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
    subject?: string;
    grade?: string;
    category?: string;
  }): Promise<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/portfolios/public', { params });
    return responseHandler(response);
  },

  allPublic: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    subject?: string;
    grade?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    try {
      const response = await axiosInstance.get<ApiResponse<{ portfolios: Portfolio[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>('/portfolios/public', { params });
      return responseHandler(response);
    } catch {
      // 公开接口允许未认证访问，返回空数据作为降级
      return { portfolios: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
    }
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
    // 当后端返回错误时（如500），responseType: 'blob' 会使响应体成为 Blob，
    // 需要检测 Blob 是否为 JSON 错误响应
    const data = response.data;
    if (data instanceof Blob && data.type === 'application/json') {
      const text = await data.text();
      try {
        const json = JSON.parse(text);
        if (json.success === false) {
          throw new Error(json.message || '导出失败');
        }
      } catch (parseError: any) {
        if (parseError?.message && parseError.message !== '导出失败') {
          throw parseError;
        }
        // JSON 解析失败说明确实是二进制数据，正常返回
      }
    }
    return data;
  },
};

export const pptAPI = {
  checkTitle: async (title: string): Promise<{ exists: boolean; pptId: number | null; title: string | null }> => {
    const response = await axiosInstance.get<ApiResponse<{ exists: boolean; pptId: number | null; title: string | null }>>('/ppt/check-title', { params: { title } });
    return responseHandler(response);
  },

  generate: async (lessonId: number, replaceExisting?: boolean, useAI: boolean = true, theme?: string): Promise<PPTRecord> => {
    const response = await axiosInstance.post<ApiResponse<PPTRecord>>('/ppt/generate', { lessonId, replaceExisting, useAI, theme }, {
      timeout: 300000,
    });
    return responseHandler(response);
  },

  sync: async (lessonId: number, theme?: string): Promise<PPTRecord> => {
    const response = await axiosInstance.post<ApiResponse<PPTRecord>>('/ppt/sync', { lessonId, useAI: true, theme }, {
      timeout: 300000,
    });
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

  export: async (id: number, format: 'json' | 'html' = 'json'): Promise<Blob> => {
    const response = await axiosInstance.get(`/ppt/${id}/export`, {
      responseType: 'blob',
      params: { format },
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
  portfolioId?: number;
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
  childReplyCount?: number;
  recentReplies?: CommentItem[];
  replyToUserName?: string;
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

// ========== 通知 API ==========
export const notificationAPI = {
  // 获取通知列表
  list: async (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
  }): Promise<{ notifications: Notification[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> => {
    const response = await axiosInstance.get<ApiResponse<{ notifications: Notification[]; pagination: any }>>('/notifications', { params });
    return responseHandler(response);
  },

  // 获取未读通知数量
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await axiosInstance.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return responseHandler(response);
  },

  // 标记单条通知为已读
  markAsRead: async (id: number): Promise<void> => {
    const response = await axiosInstance.put<ApiResponse<void>>(`/notifications/${id}/read`);
    return responseHandler(response);
  },

  // 标记所有通知为已读
  markAllAsRead: async (): Promise<void> => {
    const response = await axiosInstance.put<ApiResponse<void>>('/notifications/read-all');
    return responseHandler(response);
  },

  // 删除通知
  delete: async (id: number): Promise<void> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/notifications/${id}`);
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

// ============ 管理员 API ============

export const adminAPI = {
  // 获取用户列表
  getUsers: async (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    role?: string;
    status?: number;
  }) => {
    const response = await axiosInstance.get('/admin/users', { params });
    return responseHandler(response);
  },

  // 获取用户详情
  getUserDetail: async (id: number) => {
    const response = await axiosInstance.get(`/admin/users/${id}`);
    return responseHandler(response);
  },

  // 启用/禁用用户
  toggleUserStatus: async (id: number, status: number) => {
    const response = await axiosInstance.put(`/admin/users/${id}/status`, { status });
    return responseHandler(response);
  },

  // 修改用户角色
  changeUserRole: async (id: number, role: string) => {
    const response = await axiosInstance.put(`/admin/users/${id}/role`, { role });
    return responseHandler(response);
  },

  // 重置用户密码
  resetPassword: async (id: number) => {
    const response = await axiosInstance.post(`/admin/users/${id}/reset-password`);
    return responseHandler(response);
  },

  // 删除用户
  deleteUser: async (id: number) => {
    const response = await axiosInstance.delete(`/admin/users/${id}`);
    return responseHandler(response);
  },

  // 获取系统统计
  getStats: async () => {
    const response = await axiosInstance.get('/admin/stats');
    return responseHandler(response);
  },

  // 获取操作日志
  getLogs: async (params: {
    page?: number;
    pageSize?: number;
    adminId?: number;
    action?: string;
  }) => {
    const response = await axiosInstance.get('/admin/logs', { params });
    return responseHandler(response);
  },
};

export default axiosInstance;
