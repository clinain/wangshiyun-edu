import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import CommentSection from '@/components/CommentSection';
import { resourceAPI, portfolioAPI } from '@/api';
import type { UnifiedResourceItem } from '@/api';
import type { Resource, Portfolio } from '@/types';

// 允许上传的文件类型
const allowedFileTypes: Record<string, string[]> = {
  'audio': ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
  'video': ['mp4', 'webm', 'mpeg', 'avi', 'mov'],
  'image': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
  'document': ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'],
};

// 学段定义
const schoolLevels = ['全部', '小学', '初中', '高中'];

// 学段 → 年级 映射
const gradesByLevel: Record<string, string[]> = {
  '小学': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  '初中': ['七年级', '八年级', '九年级'],
  '高中': ['高一', '高二', '高三'],
};

// 学段 → 学科 映射
const subjectsByLevel: Record<string, string[]> = {
  '小学': ['语文', '数学', '英语', '科学', '道德与法治', '信息科技', '音乐', '美术', '体育与健康', '劳动'],
  '初中': ['语文', '数学', '英语', '物理', '化学', '生物学', '历史', '地理', '道德与法治', '科学', '信息科技', '音乐', '美术', '体育与健康', '艺术'],
  '高中': ['语文', '数学', '英语', '物理', '化学', '生物学', '历史', '地理', '道德与法治', '信息科技', '音乐', '美术', '体育与健康', '艺术'],
};

const getGradesForLevel = (level: string): string[] => {
  if (level === '全部') return ['全部'];
  return ['全部', ...(gradesByLevel[level] || [])];
};

const getSubjectsForLevel = (level: string): string[] => {
  if (level === '全部') return ['全部'];
  return ['全部', ...(subjectsByLevel[level] || [])];
};

// 资源类型筛选选项
const resourceTypeOptions = ['全部', '教案', 'PPT', '作品集', 'Word', 'PDF', '视频', '音频', '图片', '其他'];

// 统一类型到 API type 参数的映射
const typeToApiType: Record<string, string> = {
  '教案': 'lesson',
  'PPT': 'ppt',
  '作品集': 'portfolio',
  'Word': 'resource',
  'PDF': 'resource',
  '视频': 'resource',
  '音频': 'resource',
  '图片': 'resource',
  '其他': 'resource',
};

// 类型到文件格式的映射（用于 resource 类型的细分筛选）
const typeToFileFormat: Record<string, string> = {
  'Word': 'doc,docx',
  'PDF': 'pdf',
  '视频': 'mp4,webm,mpeg,avi,mov',
  '音频': 'mp3,wav,ogg,m4a,flac,aac',
  '图片': 'jpg,jpeg,png,gif,webp,svg,bmp',
};

// 获取统一资源的显示类型
const getUnifiedDisplayType = (item: UnifiedResourceItem): string => {
  if (item.resourceType === 'lesson') return '教案';
  if (item.resourceType === 'ppt') return 'PPT';
  if (item.resourceType === 'portfolio') return '作品集';
  // resource 类型根据文件格式判断
  const format = (item.fileFormat || '').toLowerCase();
  if (['doc', 'docx'].includes(format)) return 'Word';
  if (format === 'pdf') return 'PDF';
  if (['ppt', 'pptx'].includes(format)) return 'PPT';
  if (['mp4', 'webm', 'mpeg', 'avi', 'mov'].includes(format)) return '视频';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(format)) return '音频';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(format)) return '图片';
  return '其他';
};

const getTypeColor = (displayType: string) => {
  switch (displayType) {
    case '教案': return 'bg-indigo-100 text-indigo-600';
    case 'Word': return 'bg-blue-100 text-blue-600';
    case 'PDF': return 'bg-red-100 text-red-600';
    case 'PPT': return 'bg-orange-100 text-orange-600';
    case '作品集': return 'bg-primary-100 text-primary-600';
    case '视频': return 'bg-purple-100 text-purple-600';
    case '音频': return 'bg-green-100 text-green-600';
    case '图片': return 'bg-pink-100 text-pink-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getTypeIcon = (displayType: string) => {
  switch (displayType) {
    case '教案':
      return (
        <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'PPT':
      return (
        <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case '作品集':
      return (
        <svg className="h-8 w-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'Word':
      return (
        <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'PDF':
      return (
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case '视频':
      return (
        <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case '音频':
      return (
        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    case '图片':
      return (
        <svg className="h-8 w-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
};

const fixResourceUrl = (url: string, type?: string, format?: string): string => {
  if (!url) return url;
  const localUploadMatch = url.match(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(\/uploads\/.*)$/i);
  const normalizedUrl = localUploadMatch ? localUploadMatch[1] : url;
  if (/\/uploads\/(images|documents|videos|others)\//.test(normalizedUrl)) return normalizedUrl;
  let subDir = 'others';
  if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(format || '')) subDir = 'images';
  else if (type === 'video' || ['mp4', 'webm', 'mpeg'].includes(format || '')) subDir = 'videos';
  else if (['doc', 'docx', 'pdf', 'ppt', 'pptx'].includes(format || '')) subDir = 'documents';
  return normalizedUrl.replace('/uploads/', `/uploads/${subDir}/`);
};

const Resources: React.FC = () => {
  const navigate = useNavigate();
  const [unifiedItems, setUnifiedItems] = useState<UnifiedResourceItem[]>([]);
  const [allItems, setAllItems] = useState<UnifiedResourceItem[]>([]); // 存储全部数据用于客户端分页
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [myPortfolios, setMyPortfolios] = useState<Portfolio[]>([]);
  const [favoriteResourceIds, setFavoriteResourceIds] = useState<Set<number>>(new Set());
  const [favoritePortfolioIds, setFavoritePortfolioIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'favorites'>('all');
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', category: '', subject: '', grade: '', tags: '', level: ''
  });
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedLevel, setSelectedLevel] = useState('全部');
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const [selectedGrade, setSelectedGrade] = useState('全部');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewItem, setPreviewItem] = useState<UnifiedResourceItem | null>(null);
  const [textPreviewContent, setTextPreviewContent] = useState<string>('');
  const [textPreviewLoading, setTextPreviewLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number; page?: number; pageSize?: number }>({ total: 0, totalPages: 0 });
  const PAGE_SIZE = 20;

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setSelectedSubject('全部');
    setSelectedGrade('全部');
  };

  const availableGrades = getGradesForLevel(selectedLevel);
  const availableSubjects = getSubjectsForLevel(selectedLevel);

  // 筛选条件变化时重置到第1页
  const prevFiltersRef = React.useRef('');
  useEffect(() => {
    const filtersKey = `${activeTab}|${searchKeyword}|${selectedType}|${selectedLevel}|${selectedSubject}|${selectedGrade}|${sortBy}|${sortOrder}`;
    if (prevFiltersRef.current !== '' && prevFiltersRef.current !== filtersKey) {
      setCurrentPage(1);
    }
    prevFiltersRef.current = filtersKey;
  }, [activeTab, searchKeyword, selectedType, selectedLevel, selectedSubject, selectedGrade, sortBy, sortOrder]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
      const subjectFilter = selectedSubject === '全部' ? undefined : selectedSubject;
      const gradeFilter = selectedGrade === '全部' ? undefined : selectedGrade;

      if (activeTab === 'all') {
        // 全部资源标签：使用统一接口（服务端分页）
        const apiType = selectedType === '全部' ? undefined : typeToApiType[selectedType];
        const apiFileFormat = selectedType !== '全部' ? (typeToFileFormat[selectedType] || undefined) : undefined;
        const result = await resourceAPI.all({
          page: currentPage,
          pageSize: PAGE_SIZE,
          keyword: searchKeyword || undefined,
          type: apiType,
          fileFormat: apiFileFormat,
          subject: subjectFilter,
          grade: gradeFilter,
          sortBy,
          sortOrder
        }).catch(() => ({ items: [], pagination: { total: 0, totalPages: 0 } }));
        if (!cancelled) {
          setUnifiedItems(result.items || []);
          setAllItems([]);
          setPagination(result.pagination || { total: 0, totalPages: 0 });
        }
      } else if (activeTab === 'my') {
        // 我的资源标签：获取全部数据，客户端分页
        const result = await resourceAPI.myResources({
          keyword: searchKeyword || undefined,
          pageSize: 1000
        }).catch(() => ({ resources: [], portfolios: [] }));
        const resItems: UnifiedResourceItem[] = (result.resources || []).map((r: any) => ({
          id: r.id, title: r.title, resourceType: 'resource' as const,
          subject: r.subject, grade: r.grade, createdAt: r.createdAt,
          viewCount: r.viewCount || 0, downloadCount: r.downloadCount || 0,
          favoriteCount: r.favoriteCount || 0, ownerId: r.userId || r.uploaderId || 0,
          authorName: r.authorName, fileUrl: r.fileUrl, fileFormat: r.fileFormat,
          fileSize: r.fileSize, category: r.category, description: r.description,
          tags: r.tags, coverUrl: r.coverUrl,
        }));
        const portItems: UnifiedResourceItem[] = (result.portfolios || []).map((p: any) => ({
          id: p.id, title: p.name, resourceType: 'portfolio' as const,
          subject: p.subject, grade: p.grade, createdAt: p.createdAt,
          viewCount: p.viewCount || 0, downloadCount: 0, favoriteCount: 0,
          ownerId: p.userId || p.user_id || 0, authorName: p.authorName,
          fileUrl: undefined, fileFormat: undefined, fileSize: undefined,
          category: p.category, description: p.description, tags: undefined,
          coverUrl: p.coverUrl,
        }));
        const all = [...portItems, ...resItems];
        if (!cancelled) {
          setAllItems(all);
          const total = all.length;
          const totalPages = Math.ceil(total / PAGE_SIZE);
          const start = (currentPage - 1) * PAGE_SIZE;
          setUnifiedItems(all.slice(start, start + PAGE_SIZE));
          setPagination({ total, totalPages, page: currentPage, pageSize: PAGE_SIZE });
        }
      } else if (activeTab === 'favorites') {
        // 收藏标签：获取全部数据，客户端分页
        const allFavorites = await resourceAPI.favorites({ type: 'all', pageSize: 1000 } as any).catch(() => []);
        const items = Array.isArray(allFavorites) ? allFavorites : [];
        const resIds = new Set<number>();
        const portIds = new Set<number>();
        items.forEach((f: any) => {
          if (f.favoriteType === 'resource' && (f.resourceId || f.id)) resIds.add(f.resourceId || f.id);
          if (f.favoriteType === 'portfolio' && (f.portfolioId || f.id)) portIds.add(f.portfolioId || f.id);
        });
        setFavoriteResourceIds(resIds);
        setFavoritePortfolioIds(portIds);

        const unifiedFavorites: UnifiedResourceItem[] = items.map((item: any) => ({
          id: item.id,
          title: item.title || item.name || '',
          resourceType: item.favoriteType === 'resource' ? 'resource' : 'portfolio' as any,
          subject: item.subject, grade: item.grade,
          createdAt: item.createdAt || item.favoritedAt,
          viewCount: item.viewCount || 0, downloadCount: item.downloadCount || 0,
          favoriteCount: item.favoriteCount || 0,
          ownerId: item.userId || item.ownerId || 0, authorName: item.authorName,
          fileUrl: item.fileUrl, fileFormat: item.fileFormat, fileSize: item.fileSize,
          category: item.category, description: item.description, tags: item.tags,
          coverUrl: item.coverUrl, _favoriteType: item.favoriteType,
        } as any));
        if (!cancelled) {
          setAllItems(unifiedFavorites);
          const total = unifiedFavorites.length;
          const totalPages = Math.ceil(total / PAGE_SIZE);
          const start = (currentPage - 1) * PAGE_SIZE;
          setUnifiedItems(unifiedFavorites.slice(start, start + PAGE_SIZE));
          setPagination({ total, totalPages, page: currentPage, pageSize: PAGE_SIZE });
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      if (!cancelled) {
        setUnifiedItems([]);
        setPagination({ total: 0, totalPages: 0 });
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    };
  };
  load();
  return () => { cancelled = true; };
  }, [activeTab, searchKeyword, selectedType, selectedLevel, selectedSubject, selectedGrade, sortBy, sortOrder, currentPage, refreshKey]);

  // 初始化时加载收藏状态
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const [resFavs, portFavs] = await Promise.all([
          resourceAPI.favorites({ type: 'resource' } as any).catch(() => []),
          resourceAPI.favorites({ type: 'portfolio' } as any).catch(() => [])
        ]);
        const resIds = new Set<number>();
        const portIds = new Set<number>();
        (Array.isArray(resFavs) ? resFavs : []).forEach((f: any) => { if (f.resourceId || f.id) resIds.add(f.resourceId || f.id); });
        (Array.isArray(portFavs) ? portFavs : []).forEach((f: any) => { if (f.portfolioId || f.id) portIds.add(f.portfolioId || f.id); });
        setFavoriteResourceIds(resIds);
        setFavoritePortfolioIds(portIds);
      } catch (err) {
        console.error('获取收藏列表失败:', err);
      }
    };
    loadFavorites();
  }, []);

  const handleSearch = () => setSearchKeyword(keyword);

  const handleClearFilters = () => {
    setKeyword('');
    setSearchKeyword('');
    setSelectedType('全部');
    setSelectedLevel('全部');
    setSelectedSubject('全部');
    setSelectedGrade('全部');
    setSortBy('created_at');
    setSortOrder('DESC');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchKeyword || selectedType !== '全部' || selectedLevel !== '全部' || selectedSubject !== '全部' || selectedGrade !== '全部' || sortBy !== 'created_at' || sortOrder !== 'DESC';

  const handleToggleFavorite = async (type: 'resource' | 'portfolio', id: number) => {
    try {
      if (type === 'resource') {
        await resourceAPI.toggleFavorite(id);
        setFavoriteResourceIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
      } else {
        await portfolioAPI.toggleFavorite(id);
        setFavoritePortfolioIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('确定要删除这个资源吗？此操作不可恢复。')) return;
    try {
      await resourceAPI.delete(resourceId);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(`删除失败: ${err.response?.data?.message || err.message || '删除失败'}`);
    }
  };

  const handleTogglePublic = async (resourceId: number) => {
    try {
      await resourceAPI.togglePublic(resourceId);
      setRefreshKey(k => k + 1);
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleDownloadResource = async (item: UnifiedResourceItem) => {
    if (!item.fileUrl && item.resourceType === 'resource') {
      alert('此资源暂无可下载的文件');
      return;
    }
    try {
      const blob = await resourceAPI.download(item.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // 根据文件格式生成带扩展名的文件名
      const format = (item.fileFormat || '').toLowerCase();
      const extensionMap: Record<string, string> = {
        'doc': '.doc', 'docx': '.docx', 'pdf': '.pdf',
        'ppt': '.ppt', 'pptx': '.pptx', 'xls': '.xls', 'xlsx': '.xlsx',
        'mp4': '.mp4', 'webm': '.webm', 'mpeg': '.mpeg',
        'mp3': '.mp3', 'wav': '.wav', 'ogg': '.ogg', 'm4a': '.m4a', 'flac': '.flac', 'aac': '.aac',
        'jpg': '.jpg', 'jpeg': '.jpeg', 'png': '.png', 'gif': '.gif', 'webp': '.webp', 'bmp': '.bmp',
        'txt': '.txt', 'json': '.json',
      };
      const ext = extensionMap[format] || '';
      a.download = (item.title || `resource-${item.id}`) + ext;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('资源下载失败:', error);
      alert('下载失败，请重试');
    }
  };

  const handleViewDetail = async (item: UnifiedResourceItem) => {
    if (item.resourceType === 'lesson') {
      navigate(`/lessons/${item.id}`);
    } else if (item.resourceType === 'ppt') {
      // 区分AI生成的PPT记录和上传的PPT文件
      // AI生成的PPT没有fileUrl，上传的PPT文件有fileUrl
      if (item.fileUrl) {
        // 上传的PPT文件，走资源预览/下载逻辑
        setPreviewItem(item);
        setTextPreviewContent('');
      } else {
        // AI生成的PPT记录，导航到PPT详情页
        navigate(`/ppt/${item.id}`);
      }
    } else if (item.resourceType === 'portfolio') {
      navigate(`/portfolios/${item.id}/view`);
    } else {
      setPreviewItem(item);
      setTextPreviewContent('');
      // 如果是文本文件，预加载文本内容
      const format = (item.fileFormat || '').toLowerCase();
      if (['txt', 'json', 'js', 'ts', 'html', 'css', 'xml', 'csv', 'md'].includes(format)) {
        setTextPreviewLoading(true);
        try {
          const result = await resourceAPI.previewText(item.id);
          setTextPreviewContent(result.content || '');
        } catch (err) {
          console.error('加载文本预览失败:', err);
          setTextPreviewContent('无法加载文件内容');
        } finally {
          setTextPreviewLoading(false);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nameParts = file.name.split('.');
    const ext = nameParts.length > 1 ? nameParts.pop()!.toLowerCase() : '';
    const mimeType = file.type || '';
    let autoCategory = '其他';
    if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'm4a' || ext === 'flac' || ext === 'aac' || mimeType.startsWith('audio/')) autoCategory = '素材';
    else if (ext === 'mp4' || ext === 'webm' || ext === 'mpeg' || ext === 'avi' || ext === 'mov' || mimeType.startsWith('video/')) autoCategory = '素材';
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mimeType.startsWith('image/')) autoCategory = '素材';
    else if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) autoCategory = '教案';
    else if (['ppt', 'pptx'].includes(ext) || mimeType.includes('powerpoint') || mimeType.includes('presentation')) autoCategory = '课件';
    else if (ext === 'pdf' || mimeType === 'application/pdf') autoCategory = '课件';
    else if (['xls', 'xlsx'].includes(ext) || mimeType.includes('excel') || mimeType.includes('spreadsheet')) autoCategory = '习题';
    const titleFromName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
    setUploadFile(file);
    setUploadForm({ title: titleFromName, description: '', category: autoCategory, subject: '', grade: '', tags: '', level: '' });
    setShowUploadModal(true);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      Object.entries(uploadForm).forEach(([key, value]) => formData.append(key, value));
      await resourceAPI.upload(formData);
      setShowUploadModal(false);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError((err as Error).message || '上传失败');
      setShowUploadModal(false);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN');
  };

  // 渲染统一资源卡片
  const renderUnifiedItem = (item: UnifiedResourceItem) => {
    const displayType = getUnifiedDisplayType(item);
    const isMyItem = activeTab === 'my';

    return (
      <div key={`${item.resourceType}-${item.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center p-3 md:p-4 gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
            {getTypeIcon(displayType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-800 truncate text-sm md:text-base">{item.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getTypeColor(displayType)}`}>
                {displayType}
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-4 text-xs text-gray-400 flex-wrap">
              {item.authorName && <span>{item.authorName}</span>}
              {item.fileSize ? <span>{formatFileSize(item.fileSize)}</span> : null}
              <span>{formatDate(item.createdAt)}</span>
              {item.subject && <span>{item.subject}</span>}
              {item.grade && <span>{item.grade}</span>}
              {/* 统计数据 */}
              {item.downloadCount > 0 && (
                <span className="flex items-center gap-0.5" title="下载量">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {item.downloadCount}
                </span>
              )}
              {item.viewCount > 0 && (
                <span className="flex items-center gap-0.5" title="浏览量">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {item.viewCount}
                </span>
              )}
              {item.favoriteCount > 0 && (
                <span className="flex items-center gap-0.5" title="收藏量">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  {item.favoriteCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {item.resourceType === 'resource' && (
              <button onClick={() => handleToggleFavorite('resource', item.id)} className={`p-1.5 rounded-lg transition-colors ${favoriteResourceIds.has(item.id) ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`} title={favoriteResourceIds.has(item.id) ? '取消收藏' : '收藏'}>
                <svg className="w-4 h-4" fill={favoriteResourceIds.has(item.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}
            {item.resourceType === 'portfolio' && (
              <button onClick={() => handleToggleFavorite('portfolio', item.id)} className={`p-1.5 rounded-lg transition-colors ${favoritePortfolioIds.has(item.id) ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`} title={favoritePortfolioIds.has(item.id) ? '取消收藏' : '收藏'}>
                <svg className="w-4 h-4" fill={favoritePortfolioIds.has(item.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}
            <button onClick={() => handleViewDetail(item)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {item.resourceType === 'resource' && item.fileUrl ? '预览' : '查看'}
            </button>
            {item.fileUrl && (
              <button onClick={() => handleDownloadResource(item)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载
              </button>
            )}
            {isMyItem && item.resourceType === 'resource' && (
              <button onClick={() => handleDeleteResource(item.id)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-danger-500 hover:text-white hover:bg-danger-500 rounded-lg transition-colors">删除</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 获取当前显示的列表（所有标签的分页数据都在 unifiedItems 中）
  const getCurrentItems = (): UnifiedResourceItem[] => {
    return unifiedItems;
  };

  const currentItems = getCurrentItems();

  // 排序选项
  const sortOptions = [
    { value: 'created_at|DESC', label: '最新发布' },
    { value: 'created_at|ASC', label: '最早发布' },
    { value: 'download_count|DESC', label: '下载量最高' },
    { value: 'favorite_count|DESC', label: '收藏量最高' },
    { value: 'view_count|DESC', label: '浏览量最高' },
  ];

  return (
    <Layout
      title="资源中心"
      subtitle="管理教学资源文件"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '资源中心' }
      ]}
    >
      {error && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 border-b border-gray-200 md:border-b-0 md:border-r md:pb-0">
            {([
              { key: 'all', label: '全部资源' },
              { key: 'my', label: '我的资源' },
              { key: 'favorites', label: '⭐ 收藏' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.key ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="搜索资源..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {hasActiveFilters && (
                <button onClick={handleClearFilters} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors" title="清空筛选">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">搜索</button>
            <label className="relative inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <input ref={fileInputRef} type="file" className="hidden" accept=".mp3,.wav,.ogg,.m4a,.flac,.aac,.mp4,.webm,.mpeg,.avi,.mov,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.txt,audio/*,video/*,image/*" onChange={handleFileSelect} disabled={uploading} />
              <span className="ml-2 text-sm text-gray-600">{uploading ? '上传中...' : '上传文件'}</span>
            </label>
          </div>
        </div>

        {/* 筛选和排序区域 */}
        {activeTab === 'all' && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">类型：</span>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                {resourceTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">学段：</span>
              <select value={selectedLevel} onChange={(e) => handleLevelChange(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                {schoolLevels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">年级：</span>
              <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                {availableGrades.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">学科：</span>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                {availableSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">排序：</span>
              <select
                value={`${sortBy}|${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('|');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder as 'ASC' | 'DESC');
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 非全部资源标签也显示排序控件 */}
        {activeTab !== 'all' && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">排序：</span>
              <select
                value={`${sortBy}|${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('|');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder as 'ASC' | 'DESC');
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            {currentItems.map((item) => renderUnifiedItem(item))}
          </>
        )}
      </div>

      {!loading && currentItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>暂无资源</p>
        </div>
      )}

      {/* 分页控件 */}
      {!loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          {(() => {
            const pages: (number | string)[] = [];
            const total = pagination.totalPages;
            const current = currentPage;
            if (total <= 7) {
              for (let i = 1; i <= total; i++) pages.push(i);
            } else {
              pages.push(1);
              if (current > 3) pages.push('...');
              const start = Math.max(2, current - 1);
              const end = Math.min(total - 1, current + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              if (current < total - 2) pages.push('...');
              pages.push(total);
            }
            return pages.map((p, idx) =>
              typeof p === 'string' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    currentPage === p
                      ? 'bg-primary-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            );
          })()}
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage >= pagination.totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
          <span className="text-sm text-gray-500 ml-3">
            共 {pagination.total} 条，第 {currentPage}/{pagination.totalPages} 页
          </span>
        </div>
      )}

      {/* 文件预览模态框 */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-2 md:p-4" onClick={() => { setPreviewItem(null); setTextPreviewContent(''); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 md:p-4 border-b flex-shrink-0">
              <h3 className="font-semibold text-gray-800 truncate">{previewItem.title}</h3>
              <div className="flex items-center gap-2">
                {/* 下载按钮 */}
                {previewItem.resourceType === 'resource' && previewItem.fileUrl && (
                  <button
                    onClick={() => handleDownloadResource(previewItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="下载文件"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载
                  </button>
                )}
                <button onClick={() => { setPreviewItem(null); setTextPreviewContent(''); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-1 min-h-0">
              <div className="overflow-auto p-4 flex items-center justify-center flex-1 border-r border-gray-100">
                {(() => {
                  const format = (previewItem.fileFormat || '').toLowerCase();
                  // 使用后端预览接口获取带认证的URL
                  const previewUrl = `${(import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || '/api'}/resources/${previewItem.id}/preview`;
                  const token = localStorage.getItem('token');
                  const authPreviewUrl = token ? `${previewUrl}?token=${token}` : previewUrl;
                  // 原始文件URL（用于直接访问）
                  const url = fixResourceUrl(previewItem.fileUrl || '', undefined, format);

                  // 图片预览
                  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(format)) {
                    return <img src={url} alt={previewItem.title} className="max-w-full max-h-full object-contain" />;
                  }

                  // 视频预览
                  if (['mp4', 'webm', 'mpeg', 'avi', 'mov'].includes(format)) {
                    return <video src={url} controls className="max-w-full max-h-full">您的浏览器不支持视频播放</video>;
                  }

                  // 音频预览
                  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(format)) {
                    return <audio src={url} controls className="w-full max-w-lg">您的浏览器不支持音频播放</audio>;
                  }

                  // PDF 预览
                  if (format === 'pdf') {
                    return <iframe src={authPreviewUrl} className="w-full h-full border-0" title={previewItem.title} />;
                  }

                  // 文本文件预览
                  if (['txt', 'json', 'js', 'ts', 'html', 'css', 'xml', 'csv', 'md'].includes(format)) {
                    if (textPreviewLoading) {
                      return (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                          <span className="ml-3 text-gray-500">加载中...</span>
                        </div>
                      );
                    }
                    return (
                      <pre className="w-full h-full overflow-auto p-4 text-sm text-gray-800 bg-gray-50 rounded-lg font-mono whitespace-pre-wrap break-words text-left">
                        {textPreviewContent || '暂无内容'}
                      </pre>
                    );
                  }

                  // Word / PPT / Excel / 其他文件类型 - 暂不支持在线预览，提示下载
                  return (
                    <div className="text-center py-12">
                      <svg className="h-16 w-16 mx-auto mb-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-600 mb-1 font-medium">该资源暂不支持在线预览</p>
                      <p className="text-gray-400 text-sm mb-4">请下载后使用本地软件打开查看</p>
                      <button
                        onClick={() => handleDownloadResource(previewItem)}
                        className="px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        下载查看
                      </button>
                    </div>
                  );
                })()}
              </div>
              <div className="overflow-y-auto flex-shrink-0 w-[380px] p-4">
                <CommentSection resourceId={previewItem.resourceType === 'resource' ? previewItem.id : undefined} portfolioId={previewItem.resourceType === 'portfolio' ? previewItem.id : undefined} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 上传弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">上传资源</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">文件名称</label>
                <input type="text" value={uploadFile?.name || ''} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资源标题 *</label>
                <input type="text" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="请输入资源标题" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="请输入资源描述" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学段</label>
                  <select value={uploadForm.level || ''} onChange={(e) => setUploadForm({ ...uploadForm, level: e.target.value, subject: '', grade: '' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">请选择学段</option>
                    {schoolLevels.filter(l => l !== '全部').map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <select value={uploadForm.grade} onChange={(e) => setUploadForm({ ...uploadForm, grade: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">请选择年级</option>
                    {(uploadForm.level ? getGradesForLevel(uploadForm.level).filter(g => g !== '全部') : []).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学科</label>
                  <select value={uploadForm.subject} onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">请选择学科</option>
                    {(uploadForm.level ? getSubjectsForLevel(uploadForm.level) : []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                <input type="text" value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="多个标签用逗号分隔" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleUploadSubmit} disabled={!uploadForm.title || uploading} className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                {uploading ? '上传中...' : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Resources;
