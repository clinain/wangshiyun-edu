import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import PPTModalPreview from '@/components/PPTModalPreview';
import HtmlDeckFullscreenModal from '@/components/HtmlDeckFullscreenModal';
import CommentSection from '@/components/CommentSection';
import { portfolioAPI, lessonAPI, pptAPI } from '@/api';
import type { Portfolio, Lesson, PPTRecord, PPTPage } from '@/types';
import { teachingGoalsToText } from '@/utils/teachingGoalsHelper';

const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物学', '历史', '地理', '道德与法治', '科学', '信息科技', '音乐', '美术', '体育与健康', '劳动', '艺术'];
const stages = ['全部', '小学', '初中', '高中', '其他'];
const categories = ['全部', '课件', '教案', '习题', '试卷', '素材', '其他'];

/** 学段对应的年级选项 */
const gradeOptionsByStage: Record<string, string[]> = {
  '小学': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  '初中': ['七年级', '八年级', '九年级'],
  '高中': ['高一', '高二', '高三'],
  '其他': ['其他'],
};

/** 所有年级（用于筛选） */
const allGrades = ['全部', ...Object.values(gradeOptionsByStage).flat()];

/**
 * 将教学重点解析为纯文本列表
 * 支持 JSON 数组字符串、已解析的数组对象、纯文本三种格式
 */
function parseKeyPoints(keyPoints: unknown): string {
  if (!keyPoints) return '';
  if (Array.isArray(keyPoints)) {
    return keyPoints.map(String).join('\n');
  }
  if (typeof keyPoints === 'string') {
    const trimmed = keyPoints.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(String).join('\n');
        }
      } catch {
        // 解析失败，当作纯文本
      }
    }
    return keyPoints;
  }
  return String(keyPoints);
}

/**
 * 将教学过程的 JSON 数据解析并格式化为可读文字
 * 支持 JSON 字符串、已解析的对象、纯文本三种格式
 */
function parseTeachingProcess(data: unknown): string {
  // 如果为空，直接返回空字符串
  if (!data) return '';

  let obj: Record<string, unknown>;

  const parseLooseJson = (text: string): unknown => {
    const trimmed = text.trim();
    const candidates = [
      trimmed,
      `{"mainContent":{"stages":[{${trimmed}`,
      `{"stages":[{${trimmed}`,
      `{${trimmed}}`,
      `[{${trimmed}}]`,
    ];
    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        // 继续尝试下一个容错包装
      }
    }
    return text;
  };

  if (typeof data === 'string') {
    // 尝试解析 JSON 字符串
    const parsed = parseLooseJson(data);
    if (typeof parsed === 'string') {
      return data;
    }
    if (Array.isArray(parsed)) {
      return parsed.length > 0 ? parseTeachingProcess({ stages: parsed }) : '';
    }
    obj = parsed as Record<string, unknown>;
  } else if (Array.isArray(data)) {
    obj = { stages: data };
  } else if (typeof data === 'object' && data !== null) {
    obj = data as Record<string, unknown>;
  } else {
    return String(data);
  }

  // 如果解析后不是对象格式，返回空
  if (typeof obj !== 'object' || obj === null) return '';

  const parts: string[] = [];

  const fieldLabels: Record<string, string> = {
    introduction: '课堂导入',
    mainContent: '新课讲授',
    newTeaching: '新课讲授',
    practice: '巩固练习',
    summary: '课堂小结',
    conclusion: '课堂小结',
    homework: '作业安排',
    assignments: '作业安排',
    stages: '教学环节',
    teacherActivities: '教师活动',
    studentActivities: '学生活动',
    teachingPoints: '教学要点',
    activities: '活动',
    content: '内容',
    description: '说明',
    stageName: '环节',
    name: '名称',
    duration: '时间',
    timeAllocation: '时间',
  };

  // 辅助函数：从对象中安全获取数组
  const getArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.map(String);
    return [];
  };

  // 辅助函数：格式化数组为编号列表
  const formatNumberedList = (items: string[]): string => {
    if (items.length === 0) return '无';
    return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
  };

  const valueToLines = (value: unknown): string[] => {
    if (!value) return [];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      const parsed = parseLooseJson(trimmed);
      if (typeof parsed !== 'string') {
        return valueToLines(parsed);
      }
      return [trimmed];
    }
    if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
    if (Array.isArray(value)) {
      return value.flatMap((item, index) => {
        const lines = valueToLines(item);
        if (typeof item === 'object' && item !== null) return lines;
        return lines.map(line => `${index + 1}. ${line}`);
      });
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const lines: string[] = [];
      const title = record.stageName || record.name || record.title;
      const duration = record.duration || record.timeAllocation;
      if (title || duration) {
        lines.push(`${title ? String(title) : '教学环节'}${duration ? `（${duration}）` : ''}`);
      }

      Object.entries(record).forEach(([key, childValue]) => {
        if (['stageName', 'name', 'title', 'duration', 'timeAllocation'].includes(key)) return;
        const childLines = valueToLines(childValue);
        if (childLines.length === 0) return;
        const label = fieldLabels[key] || '';
        if (label) {
          lines.push(`${label}：`);
          lines.push(...childLines.map(line => `  ${line}`));
        } else {
          lines.push(...childLines);
        }
      });
      return lines;
    }
    return [];
  };

  // 辅助函数：格式化 activities 数组
  const formatActivities = (activities: unknown): string => {
    if (Array.isArray(activities)) {
      return activities.map(a => {
        if (typeof a === 'string') return a;
        if (typeof a === 'object' && a !== null) {
          const act = a as Record<string, unknown>;
          const parts: string[] = [];
          if (act.name) parts.push(String(act.name));
          if (act.description) parts.push(String(act.description));
          if (act.activity) parts.push(String(act.activity));
          if (act.content) parts.push(String(act.content));
          return parts.length > 0 ? parts.join('：') : JSON.stringify(a);
        }
        return String(a);
      }).join('\n');
    }
    if (typeof activities === 'string') return activities;
    return '无';
  };

  // 解析课堂导入
  if (obj.introduction) {
    const intro = obj.introduction as Record<string, unknown>;
    const duration = intro.duration ? `(${intro.duration})` : '';
    const content = intro.activities ? formatActivities(intro.activities) : (intro.content ? String(intro.content) : '');
    parts.push(`【课堂导入】${duration}\n${content || '无'}`);
  }

  // 解析新课讲授
  if (obj.newTeaching) {
    const nt = obj.newTeaching as Record<string, unknown>;
    const duration = nt.duration ? `(${nt.duration})` : '';
    const stages = nt.stages;
    let stagesText = '';
    if (Array.isArray(stages)) {
      stagesText = stages.map((stage: unknown, idx: number) => {
        if (typeof stage !== 'object' || stage === null) return `阶段 ${idx + 1}: ${String(stage)}`;
        const s = stage as Record<string, unknown>;
        const lines: string[] = [];
        const stageName = s.stageName || s.name || `阶段 ${idx + 1}`;
        const stageDuration = s.duration ? ` (${s.duration})` : '';
        lines.push(`  阶段${idx + 1}：${stageName}${stageDuration}`);
        if (Array.isArray(s.teacherActivities) && s.teacherActivities.length > 0) {
          lines.push(`    教师活动：`);
          lines.push(formatNumberedList(getArray(s.teacherActivities)).split('\n').map(l => `    ${l}`).join('\n'));
        }
        if (Array.isArray(s.studentActivities) && s.studentActivities.length > 0) {
          lines.push(`    学生活动：`);
          lines.push(formatNumberedList(getArray(s.studentActivities)).split('\n').map(l => `    ${l}`).join('\n'));
        }
        if (Array.isArray(s.teachingPoints) && s.teachingPoints.length > 0) {
          lines.push(`    教学要点：`);
          lines.push(formatNumberedList(getArray(s.teachingPoints)).split('\n').map(l => `    ${l}`).join('\n'));
        }
        return lines.join('\n');
      }).join('\n\n');
    } else if (nt.activities) {
      stagesText = formatActivities(nt.activities);
    } else if (nt.content) {
      stagesText = String(nt.content);
    }
    parts.push(`【新课讲授】${duration}\n${stagesText || '无'}`);
  }

  // 解析巩固练习
  if (obj.practice) {
    const practice = obj.practice as Record<string, unknown>;
    const duration = practice.duration ? `(${practice.duration})` : '';
    const content = practice.activities ? formatActivities(practice.activities) : (practice.content ? String(practice.content) : '');
    parts.push(`【巩固练习】${duration}\n${content || '无'}`);
  }

  // 解析课堂小结
  if (obj.summary) {
    const summary = obj.summary as Record<string, unknown>;
    const duration = summary.duration ? `(${summary.duration})` : '';
    const content = summary.activities ? formatActivities(summary.activities) : (summary.content ? String(summary.content) : '');
    parts.push(`【课堂小结】${duration}\n${content || '无'}`);
  }

  if (Array.isArray(obj.stages)) {
    parts.push(`【教学环节】\n${valueToLines(obj.stages).join('\n')}`);
  }

  if (obj.mainContent && !obj.newTeaching) {
    parts.push(`【新课讲授】\n${valueToLines(obj.mainContent).join('\n') || '无'}`);
  }

  // 如果没有匹配到任何已知字段，尝试通用格式化
  if (parts.length === 0) {
    for (const [key, value] of Object.entries(obj)) {
      const label = fieldLabels[key] || '教学内容';
      const lines = valueToLines(value);
      if (lines.length > 0) parts.push(`【${label}】\n${lines.join('\n')}`);
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : '';
}

const PAGE_SIZE = 12;

const Portfolios: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stats, setStats] = useState({ total: 0, publicCount: 0, privateCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const [selectedGrade, setSelectedGrade] = useState('全部');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [ppts, setPpts] = useState<PPTRecord[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [selectedPpts, setSelectedPpts] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [portfolioSubject, setPortfolioSubject] = useState('');
  const [portfolioStage, setPortfolioStage] = useState('');
  const [portfolioGrade, setPortfolioGrade] = useState('');
  const [portfolioCategory, setPortfolioCategory] = useState('');
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [previewPortfolio, setPreviewPortfolio] = useState<Portfolio | null>(null);
  const [previewLessons, setPreviewLessons] = useState<Lesson[]>([]);
  const [previewPpts, setPreviewPpts] = useState<PPTRecord[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [previewingPpt, setPreviewingPpt] = useState<{ pages: PPTPage[]; title: string } | null>(null);
  const [htmlDeckFullscreenOpen, setHtmlDeckFullscreenOpen] = useState(false);
  const [htmlDeckData, setHtmlDeckData] = useState<{ html: string; title: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyShareUrl = async (shareUrl: string): Promise<boolean> => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = shareUrl;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { pageSize: 100 };
      if (searchKeyword) params.keyword = searchKeyword;
      if (selectedSubject !== '全部') params.subject = selectedSubject;
      if (selectedGrade !== '全部') params.grade = selectedGrade;
      if (selectedCategory !== '全部') params.category = selectedCategory;

      // 所有标签都只获取当前用户的作品集
      const allPortfolios = await portfolioAPI.list(params).catch(() => ({ portfolios: [], pagination: { total: 0 } }));
      const myPortfolios = allPortfolios.portfolios || [];
      
      // 根据标签页过滤
      let filteredPortfolios = myPortfolios;
      if (activeTab === 'public') {
        filteredPortfolios = myPortfolios.filter(p => !!p.isPublic);
      } else if (activeTab === 'private') {
        filteredPortfolios = myPortfolios.filter(p => !p.isPublic);
      }

      // 统计当前用户的作品
      setStats({
        total: myPortfolios.length,
        publicCount: myPortfolios.filter((p: Portfolio) => !!p.isPublic).length,
        privateCount: myPortfolios.filter((p: Portfolio) => !p.isPublic).length
      });

      // 计算分页
      const total = filteredPortfolios.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      setTotalItems(total);
      setTotalPages(pages);
      // 确保当前页不超出范围
      const safePage = Math.min(currentPage, pages);
      if (safePage !== currentPage) {
        setCurrentPage(safePage);
        return; // 页码修正后会触发重新渲染
      }
      const start = (safePage - 1) * PAGE_SIZE;
      setPortfolios(filteredPortfolios.slice(start, start + PAGE_SIZE));
    } catch (error) {
      console.error('获取作品集失败:', error);
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchKeyword, selectedSubject, selectedGrade, selectedCategory, currentPage]);

  // 筛选条件变化时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchKeyword, selectedSubject, selectedGrade, selectedCategory]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const fetchLessons = async () => {
    try {
      const result = await lessonAPI.list({ pageSize: 100 });
      setLessons(result.lessons || []);
    } catch (error) {
      console.error('获取教案失败:', error);
    }
  };

  const fetchPpts = async () => {
    try {
      const result = await pptAPI.list({ pageSize: 100 });
      setPpts(result.ppts || []);
    } catch (error) {
      console.error('获取PPT失败:', error);
    }
  };

  const handleOpenCreateModal = () => {
    fetchLessons();
    fetchPpts();
    setShowCreateModal(true);
  };

  const handlePreview = async (portfolio: Portfolio) => {
    setPreviewPortfolio(portfolio);
    // lessonIds 和 pptIds 现在已经是数组格式
    const lessonIds = Array.isArray(portfolio.lessonIds) ? portfolio.lessonIds : [];
    const pptIds = Array.isArray(portfolio.pptIds) ? portfolio.pptIds : [];

    const loadedLessons: Lesson[] = [];
    for (const id of lessonIds) {
      try {
        const lesson = await lessonAPI.detail(id);
        loadedLessons.push(lesson);
      } catch (e) {
        console.error('加载教案失败:', e);
      }
    }
    setPreviewLessons(loadedLessons);

    const loadedPpts: PPTRecord[] = [];
    for (const id of pptIds) {
      try {
        const ppt = await pptAPI.detail(id);
        loadedPpts.push(ppt);
      } catch (e) {
        console.error('加载PPT失败:', e);
      }
    }
    setPreviewPpts(loadedPpts);
  };

  const handleTogglePublic = async (portfolio: Portfolio) => {
    setTogglingId(portfolio.id);
    try {
      await portfolioAPI.togglePublic(portfolio.id, !portfolio.isPublic);
      showToast(portfolio.isPublic ? '已设置为私有' : '已设置为公开');
      fetchPortfolios();
    } catch (error) {
      showToast('设置失败', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!title || (selectedLessons.length === 0 && selectedPpts.length === 0)) {
      showToast('请填写标题并选择至少一个教案或PPT', 'error');
      return;
    }

    setCreating(true);
    try {
      await portfolioAPI.create({
        name: title,
        description,
        subject: portfolioSubject || undefined,
        stage: portfolioStage || undefined,
        grade: portfolioGrade || undefined,
        category: portfolioCategory || undefined,
        lessonIds: selectedLessons,
        pptIds: selectedPpts,
        isPublic,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setPortfolioSubject('');
      setPortfolioStage('');
      setPortfolioGrade('');
      setPortfolioCategory('');
      setAvailableGrades([]);
      setSelectedLessons([]);
      setSelectedPpts([]);
      setIsPublic(false);
      showToast('作品集创建成功');
      fetchPortfolios();
    } catch (error) {
      showToast('创建失败', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async (id: number) => {
    setSharingId(id);
    try {
      const result = await portfolioAPI.share(id);
      const copied = await copyShareUrl(result.shareUrl);
      showToast(copied ? '分享链接已复制到剪贴板' : `分享链接：${result.shareUrl}`);
      fetchPortfolios();
    } catch (error) {
      showToast('分享失败', 'error');
    } finally {
      setSharingId(null);
    }
  };

  const handleExport = async (id: number) => {
    setExportingId(id);
    try {
      const blob = await portfolioAPI.export(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const portfolio = portfolios.find(p => p.id === id);
      a.download = `${portfolio?.name || '作品集'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('导出成功，已自动添加到"我的资源"', 'success');
    } catch (error: any) {
      const message = error?.message || '导出失败，请重试';
      showToast(message, 'error');
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个作品集吗？')) return;
    try {
      await portfolioAPI.delete(id);
      showToast('删除成功');
      fetchPortfolios();
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    let date: Date;
    date = new Date(dateString);

    if (isNaN(date.getTime())) {
      const mysqlMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (mysqlMatch) {
        date = new Date(
          parseInt(mysqlMatch[1]),
          parseInt(mysqlMatch[2]) - 1,
          parseInt(mysqlMatch[3]),
          parseInt(mysqlMatch[4]),
          parseInt(mysqlMatch[5]),
          parseInt(mysqlMatch[6])
        );
      } else {
        return dateString;
      }
    }

    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleLessonSelection = (id: number) => {
    setSelectedLessons((prev) =>
      prev.includes(id) ? prev.filter((lessonId) => lessonId !== id) : [...prev, id]
    );
  };

  const togglePptSelection = (id: number) => {
    setSelectedPpts((prev) =>
      prev.includes(id) ? prev.filter((pptId) => pptId !== id) : [...prev, id]
    );
  };

  return (
    <Layout 
      title="作品集" 
      subtitle="管理您的教学作品集"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '作品集' }
      ]}
    >
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-success-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">全部作品集</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">公开作品集</p>
              <p className="text-2xl font-bold text-success-600">{stats.publicCount}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">私有作品集</p>
              <p className="text-2xl font-bold text-gray-600">{stats.privateCount}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 border-b border-gray-200 md:border-b-0 md:border-r md:pb-0">
            {(['all', 'public', 'private'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
                {tab === 'all' ? '全部' : tab === 'public' ? '公开' : '私有'}
              </button>
            ))}
          </div>
          <div className="flex-1 flex gap-3">
            <input
              type="text"
              placeholder="搜索作品集..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearchKeyword(keyword)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button onClick={() => setSearchKeyword(keyword)} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">搜索</button>
              <Button onClick={handleOpenCreateModal}>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                创建作品集
              </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">学科：</span>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">年级：</span>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              {allGrades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">分类：</span>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : portfolios.length > 0 ? (
          portfolios.map((portfolio) => (
            <div key={portfolio.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 relative">
                {portfolio.isPublic && (
                  <span className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-primary-600">
                    公开
                  </span>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-semibold text-lg">{portfolio.name}</h3>
                  {portfolio.description && (
                    <p className="text-white/80 text-sm truncate">{portfolio.description}</p>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{portfolio.lessonIds?.length || 0} 个教案</span>
                  <span>{portfolio.pptIds?.length || 0} 个PPT</span>
                </div>
                {(portfolio.subject || portfolio.stage || portfolio.grade || portfolio.category) && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 flex-wrap">
                    {portfolio.subject && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{portfolio.subject}</span>}
                    {portfolio.stage && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">{portfolio.stage}</span>}
                    {portfolio.grade && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full">{portfolio.grade}</span>}
                    {portfolio.category && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">{portfolio.category}</span>}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{formatDate(portfolio.createdAt)}</span>
                  <span>{portfolio.views || 0} 次浏览</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(portfolio)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    预览
                  </button>
                      <button
                        onClick={() => handleTogglePublic(portfolio)}
                        disabled={togglingId === portfolio.id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-600 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={portfolio.isPublic ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"} />
                        </svg>
                        {togglingId === portfolio.id ? '切换中...' : (portfolio.isPublic ? '私有' : '公开')}
                      </button>
                      <button
                        onClick={() => handleShare(portfolio.id)}
                        disabled={sharingId === portfolio.id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-600 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {sharingId === portfolio.id ? '分享中...' : '分享'}
                      </button>
                      <button
                        onClick={() => handleExport(portfolio.id)}
                        disabled={exportingId === portfolio.id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-600 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {exportingId === portfolio.id ? '导出中...' : '导出'}
                      </button>
                      <button
                        onClick={() => handleDelete(portfolio.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        删除
                      </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500">暂无作品集</p>
              <Button onClick={handleOpenCreateModal} className="mt-4">
                创建第一个作品集
              </Button>
          </div>
        )}
      </div>

      {/* 翻页按钮 */}
      {!loading && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              // 显示当前页及前后各2页，加上第1页和最后1页
              if (page === 1 || page === totalPages) return true;
              if (Math.abs(page - currentPage) <= 2) return true;
              return false;
            })
            .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
              if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                acc.push('ellipsis');
              }
              acc.push(page);
              return acc;
            }, [])
            .map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-gray-400">...</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === item
                      ? 'bg-primary-500 text-white border border-primary-500'
                      : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item}
                </button>
              )
            )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
          <span className="ml-3 text-sm text-gray-500">
            共 {totalItems} 项，第 {currentPage}/{totalPages} 页
          </span>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">创建作品集</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作品集标题 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入作品集标题"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述（选填）</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入作品集描述"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学科</label>
                  <select
                    value={portfolioSubject}
                    onChange={(e) => setPortfolioSubject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择学科</option>
                    {subjects.filter(s => s !== '全部').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学段</label>
                  <select
                    value={portfolioStage}
                    onChange={(e) => {
                      const stage = e.target.value;
                      setPortfolioStage(stage);
                      // 学段变化时重置年级，并更新可选年级列表
                      setPortfolioGrade('');
                      if (stage && gradeOptionsByStage[stage]) {
                        setAvailableGrades(gradeOptionsByStage[stage]);
                      } else {
                        setAvailableGrades([]);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择学段</option>
                    {stages.filter(s => s !== '全部').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <select
                    value={portfolioGrade}
                    onChange={(e) => setPortfolioGrade(e.target.value)}
                    disabled={!portfolioStage}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{portfolioStage ? '请选择年级' : '请先选择学段'}</option>
                    {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <select
                    value={portfolioCategory}
                    onChange={(e) => setPortfolioCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择分类</option>
                    {categories.filter(c => c !== '全部').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  设为公开
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择教案 *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {lessons.length > 0 ? lessons.map((lesson) => (
                    <label
                      key={lesson.id}
                      className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-colors ${
                        selectedLessons.includes(lesson.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLessons.includes(lesson.id)}
                        onChange={() => toggleLessonSelection(lesson.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                        <p className="text-xs text-gray-500">{lesson.subject} - {lesson.grade}</p>
                      </div>
                    </label>
                  )) : (
                    <p className="text-sm text-gray-500 col-span-full text-center py-4">暂无可用教案</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择PPT</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {ppts.length > 0 ? ppts.map((ppt) => (
                    <label
                      key={ppt.id}
                      className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition-colors ${
                        selectedPpts.includes(ppt.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPpts.includes(ppt.id)}
                        onChange={() => togglePptSelection(ppt.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate">{ppt.title}</p>
                        <p className="text-xs text-gray-500">{ppt.pageCount || 0} 页</p>
                      </div>
                    </label>
                  )) : (
                    <p className="text-sm text-gray-500 col-span-full text-center py-4">暂无可用PPT</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} loading={creating}>
                创建作品集
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewPortfolio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{previewPortfolio.name}</h2>
                <p className="text-sm text-gray-500">{previewPortfolio.description || '暂无描述'}</p>
              </div>
              <button
                onClick={() => setPreviewPortfolio(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {previewLessons.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">教案列表 ({previewLessons.length})</h3>
                  <div className="space-y-4">
                    {previewLessons.map((lesson) => (
                      <div key={lesson.id} className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 text-lg">{lesson.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{lesson.subject} - {lesson.grade}</p>
                        <div className="mt-4 space-y-3">
                          {lesson.teachingGoals && (
                            <div>
                              <span className="font-medium text-gray-700">教学目标：</span>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                                {teachingGoalsToText(lesson.teachingGoals)}
                              </p>
                            </div>
                          )}
                          {lesson.keyPoints && (
                            <div>
                              <span className="font-medium text-gray-700">教学重点：</span>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                                {parseKeyPoints(lesson.keyPoints)}
                              </p>
                            </div>
                          )}
                          {lesson.teachingProcess && (
                            <div>
                              <span className="font-medium text-gray-700">教学过程：</span>
                              <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                                {parseTeachingProcess(lesson.teachingProcess)}
                              </div>
                            </div>
                          )}
                          {lesson.assignments && (
                            <div>
                              <span className="font-medium text-gray-700">作业安排：</span>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{lesson.assignments}</p>
                            </div>
                          )}
                          {lesson.summary && (
                            <div>
                              <span className="font-medium text-gray-700">课堂总结：</span>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{lesson.summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewPpts.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">PPT列表 ({previewPpts.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {previewPpts.map((ppt) => (
                      <div key={ppt.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 text-lg">{ppt.title}</h4>
                          <span className="text-sm text-gray-500">{ppt.pageCount || 0} 页</span>
                        </div>
                        <button
                          onClick={() => {
                            if (ppt.content?.html) {
                              // HTML格式 → 打开HtmlDeckFullscreenModal全屏预览
                              setHtmlDeckData({ html: ppt.content.html, title: ppt.title });
                              setHtmlDeckFullscreenOpen(true);
                            } else if (ppt.content?.pages) {
                              // JSON格式 → 打开PPTModalPreview（带全屏）
                              setPreviewingPpt({ pages: ppt.content.pages, title: ppt.title });
                            } else {
                              showToast('暂无PPT内容', 'error');
                            }
                          }}
                          className="w-full mt-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                        >
                          预览PPT
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewLessons.length === 0 && previewPpts.length === 0 && (
                <p className="text-center text-gray-500 py-8">暂无内容</p>
              )}
            </div>
            {/* 评论区 */}
            <div className="border-t border-gray-200 p-4 md:p-6 max-h-[40vh] overflow-y-auto">
              <CommentSection portfolioId={previewPortfolio.id} />
            </div>
          </div>
        </div>
      )}

      {previewingPpt && (
        <PPTModalPreview
          isOpen={true}
          onClose={() => setPreviewingPpt(null)}
          pages={previewingPpt.pages}
          title={previewingPpt.title}
          enableFullscreen={true}
        />
      )}

      {htmlDeckFullscreenOpen && htmlDeckData && (
        <HtmlDeckFullscreenModal
          isOpen={htmlDeckFullscreenOpen}
          onClose={() => {
            setHtmlDeckFullscreenOpen(false);
            setHtmlDeckData(null);
          }}
          html={htmlDeckData.html}
          title={htmlDeckData.title}
        />
      )}
    </Layout>
  );
};

export default Portfolios;
