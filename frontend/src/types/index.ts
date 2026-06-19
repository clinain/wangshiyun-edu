export interface User {
  id: number;
  account: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'student' | 'teacher' | 'admin';
  school?: string;
  avatar?: string;
  createdAt?: string;
}

/**
 * 核心素养维度教学目标
 */
export interface CoreCompetencyDimension {
  id: string;
  name: string;
  description?: string;
  goals: string[];
}

export interface TeachingGoalsData {
  version: number;
  dimensions: CoreCompetencyDimension[];
}

export interface Lesson {
  id: number;
  userId: number;
  title: string;
  subject: string;
  grade: string;
  teachingGoals: TeachingGoalsData | string | string[];
  keyPoints: string | string[];
  teachingProcess: string | Record<string, unknown>;
  assignments?: string;
  summary?: string;
  status: 'draft' | 'published';
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: number;
  userId?: number;
  uploaderId?: number;
  title: string;
  type?: string;
  category?: string;
  description?: string;
  fileUrl: string;
  coverUrl?: string;
  fileSize: number;
  fileFormat?: string;
  subject?: string;
  grade?: string;
  tags?: string;
  downloadCount?: number;
  favoriteCount?: number;
  viewCount?: number;
  isPublic?: boolean;
  isFavorite?: boolean;
  fileName?: string;
  createdAt: string;
  favoriteType?: 'resource';
  favoriteId?: number;
  favoritedAt?: string;
}

export interface Portfolio {
  id: number;
  userId: number;
  name: string;
  description?: string;
  subject?: string;
  stage?: string;
  grade?: string;
  category?: string;
  lessonIds?: number[];
  pptIds?: number[];
  lesson_ids?: string;
  ppt_ids?: string;
  coverUrl?: string;
  isPublic: boolean;
  shareCount?: number;
  viewCount?: number;
  views?: number;
  createdAt: string;
  updatedAt: string;
  favoriteType?: 'portfolio';
  favoriteId?: number;
  favoritedAt?: string;
}

export interface FavoriteItem {
  favoriteType: 'resource' | 'portfolio';
  favoriteId: number;
  favoritedAt: string;
  id: number;
  isFavorite: boolean;
  createdAt: string;
  title?: string;
  name?: string;
  description?: string;
  type?: string;
  category?: string;
  fileUrl?: string;
  coverUrl?: string;
  fileSize?: number;
  fileFormat?: string;
  subject?: string;
  grade?: string;
  downloadCount?: number;
  favoriteCount?: number;
  lessonIds?: number[];
  pptIds?: number[];
  isPublic?: boolean;
  shareCount?: number;
  viewCount?: number;
}

export interface PPTRecord {
  id: number;
  userId?: number;
  lessonId?: number;
  title: string;
  status?: 'pending' | 'completed' | 'failed';
  pageCount: number;
  pptPath?: string;
  createdAt: string;
  updatedAt?: string;
  content?: {
    title?: string;
    subject?: string;
    grade?: string;
    templateStyle?: string;
    format?: string;
    deckStyle?: string;
    html?: string;
    pages: PPTPage[];
    pageCount: number;
  };
}

export interface PPTPageContent {
  mainTitle?: string;
  subtitle?: string;
  school?: string;
  date?: string;
  items?: Array<{ number?: number; text: string }>;
  mainContent?: string;
  text?: string;
  mainText?: string;
  subText?: string;
  layout?: string;
}

export interface PPTPage {
  type: string;
  title: string;
  content: PPTPageContent;
  layout: string;
  notes?: string;
}

export interface PPTContent {
  title?: string;
  subject?: string;
  grade?: string;
  templateStyle?: string;
  format?: string;
  deckStyle?: string;
  html?: string;
  pages: PPTPage[];
  pageCount: number;
  createdAt?: string;
}

export interface PPTDetail extends PPTRecord {
  content: PPTContent;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  pagination?: Pagination;
}

export interface LoginRequest {
  login: string;
  password?: string;
  verificationCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  verificationCode: string;
}

export interface SendVerificationCodeRequest {
  email: string;
}

export interface SendVerificationCodeResponse {
  email: string;
  code?: string;
}

export interface CreateLessonRequest {
  title: string;
  subject: string;
  grade: string;
  teachingGoals?: string | string[];
  keyPoints?: string | string[];
  teachingProcess?: string | Record<string, unknown>;
  assignments?: string;
  summary?: string;
}

export interface GenerateLessonRequest {
  subject: string;
  grade: string;
  topic: string;
  title?: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  subject?: string;
  stage?: string;
  grade?: string;
  category?: string;
  lessonIds: number[];
  pptIds?: number[];
  isPublic?: boolean;
}

// ============ 管理员相关类型 ============

export interface AdminStats {
  totalUsers: number;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  activeUsers: number;
}

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'student' | 'teacher' | 'admin';
  school?: string;
  avatar?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: AdminPagination;
}

export interface AdminOperationLog {
  id: number;
  admin_id: number;
  admin_name: string;
  target_user_id: number;
  target_user_name: string;
  action: string;
  detail: string;
  ip_address: string;
  created_at: string;
}

export interface AdminLogsResponse {
  logs: AdminOperationLog[];
  pagination: AdminPagination;
}

export interface Notification {
  id: number;
  userId: number;
  senderId: number | null;
  type: 'comment' | 'favorite' | 'system';
  title: string;
  content: string | null;
  resourceId: number | null;
  portfolioId: number | null;
  commentId: number | null;
  isRead: boolean;
  createdAt: string;
  senderName: string | null;
  senderAvatar: string | null;
}
