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

export interface Lesson {
  id: number;
  userId: number;
  title: string;
  subject: string;
  grade: string;
  teachingGoals: string | string[];
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
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
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
  lessonIds: number[];
  pptIds?: number[];
  isPublic?: boolean;
}