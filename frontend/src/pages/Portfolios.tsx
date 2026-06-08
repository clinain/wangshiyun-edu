import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import PPTModalPreview from '@/components/PPTModalPreview';
import CommentSection from '@/components/CommentSection';
import { portfolioAPI, lessonAPI, pptAPI } from '@/api';
import type { Portfolio, Lesson, PPTRecord, PPTPage } from '@/types';

const Portfolios: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stats, setStats] = useState({ total: 0, publicCount: 0, privateCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private'>('all');
  const [keyword, setKeyword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [ppts, setPpts] = useState<PPTRecord[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [selectedPpts, setSelectedPpts] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchPortfolios();
  }, [activeTab, keyword]);

const fetchPortfolios = async () => {
    setLoading(true);
    try {
      // 所有标签都只获取当前用户的作品集
      const allPortfolios = await portfolioAPI.list({ keyword: keyword || undefined, pageSize: 100 }).catch(() => ({ portfolios: [], pagination: { total: 0 } }));
      console.log('获取到的作品集数据:', JSON.stringify(allPortfolios.portfolios?.map((p: Portfolio) => ({
        id: p.id,
        name: p.name,
        lessonIds: p.lessonIds,
        pptIds: p.pptIds
      }))));
      let filteredPortfolios = allPortfolios.portfolios || [];
      
      // 根据标签页过滤
      if (activeTab === 'public') {
        filteredPortfolios = filteredPortfolios.filter(p => p.isPublic);
      } else if (activeTab === 'private') {
        filteredPortfolios = filteredPortfolios.filter(p => !p.isPublic);
      }
      
      setPortfolios(filteredPortfolios);

      // 统计当前用户的作品
      const myPortfolios = allPortfolios.portfolios || [];
      setStats({
        total: myPortfolios.length,
        publicCount: myPortfolios.filter((p: Portfolio) => p.isPublic).length,
        privateCount: myPortfolios.filter((p: Portfolio) => !p.isPublic).length
      });
    } catch (error) {
      console.error('获取作品集失败:', error);
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

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

    console.log('预览作品集:', { lessonIds, pptIds });

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
        lessonIds: selectedLessons,
        pptIds: selectedPpts,
        isPublic,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
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
      await navigator.clipboard.writeText(result.shareUrl);
      showToast('分享链接已复制到剪贴板');
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
      showToast('导出成功');
    } catch (error) {
      showToast('导出失败', 'error');
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
              <Button onClick={handleOpenCreateModal}>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                创建作品集
              </Button>
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                                {Array.isArray(lesson.teachingGoals) ? lesson.teachingGoals.join('\n') : lesson.teachingGoals}
                              </p>
                            </div>
                          )}
                          {lesson.keyPoints && (
                            <div>
                              <span className="font-medium text-gray-700">教学重点：</span>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                                {Array.isArray(lesson.keyPoints) ? lesson.keyPoints.join('\n') : lesson.keyPoints}
                              </p>
                            </div>
                          )}
                          {lesson.teachingProcess && (
                            <div>
                              <span className="font-medium text-gray-700">教学过程：</span>
                              <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                                {typeof lesson.teachingProcess === 'string' ? lesson.teachingProcess : JSON.stringify(lesson.teachingProcess, null, 2)}
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
                            if (ppt.content?.pages) {
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
        />
      )}
    </Layout>
  );
};

export default Portfolios;