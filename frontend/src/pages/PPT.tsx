import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import PPTModalPreview from '@/components/PPTModalPreview';
import GeneratingProgressModal from '@/components/GeneratingProgressModal';
import { exportToPptx } from '@/utils/exportPptx';
import { formatChinaDateTime } from '@/utils/dateTime';
import { pptAPI, lessonAPI } from '@/api';
import type { PPTRecord, Lesson, PPTPage } from '@/types';

const PPT_PAGE_SIZE = 10;
const PPT_FETCH_PAGE_SIZE = 1000;

const PPT: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'generate' | 'myPpt'>('generate');
  const [ppts, setPpts] = useState<PPTRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingStage, setGeneratingStage] = useState('');
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPages, setPreviewPages] = useState<PPTPage[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<{ title: string; action: 'generate'; lessonId?: number } | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');

  useEffect(() => {
    fetchPPTs();
    fetchLessons();
    const params = new URLSearchParams(location.search);
    const lessonId = params.get('lessonId');
    if (lessonId) {
      setSelectedLesson(parseInt(lessonId));
    }
    const tab = params.get('tab');
    if (tab === 'myPpt') {
      setActiveTab('myPpt');
    }
  }, [location.search]);

  const fetchPPTs = async () => {
    setLoading(true);
    try {
      const result = await pptAPI.list({ page: 1, pageSize: PPT_FETCH_PAGE_SIZE }).catch(() => ({ ppts: [] }));
      setPpts(result.ppts || []);
    } catch (error) {
      setPpts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const result = await lessonAPI.list({ pageSize: 100 }).catch(() => ({ lessons: [] }));
      setLessons(result.lessons || []);
    } catch (error) {
      setLessons([]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedLesson) { setError('请选择一个教案'); return; }
    setGenerating(true);
    setGeneratingStage('正在分析教案内容...');
    setError('');
    try {
      // 获取教案标题作为PPT标题，检查是否重名
      const lesson = lessons.find(l => l.id === selectedLesson);
      const pptTitle = lesson?.title || 'PPT';
      try {
        const checkResult = await pptAPI.checkTitle(pptTitle);
        if (checkResult.exists) {
          // 重名，弹出替换确认
          setReplaceTarget({ title: pptTitle, action: 'generate', lessonId: selectedLesson });
          setReplaceConfirmOpen(true);
          setGenerating(false);
          setShowGenerateModal(false);
          return;
        }
      } catch {
        // check-title 接口不存在时继续正常流程
      }
      
      // 模拟阶段更新
      const stageTimer1 = setTimeout(() => setGeneratingStage('正在设计PPT页面布局...'), 3000);
      const stageTimer2 = setTimeout(() => setGeneratingStage('正在生成教学内容...'), 10000);
      const stageTimer3 = setTimeout(() => setGeneratingStage('正在美化PPT样式...'), 20000);
      
      await pptAPI.generate(selectedLesson, false, true, selectedTheme);
      
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      
      fetchPPTs();
      setSelectedLesson(null);
      setShowGenerateModal(false);
      setActiveTab('myPpt');
    } catch (err) {
      setError((err as Error).message || '生成失败');
    } finally {
      setGenerating(false);
      setGeneratingStage('');
    }
  };

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteTarget({ id, title });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await pptAPI.delete(deleteTarget.id);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      fetchPPTs();
    } catch (error) {
      alert('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handlePreview = async (pptId: number, title: string) => {
    setPreviewTitle(title);
    setPreviewOpen(true);
    try {
      const response = await pptAPI.detail(pptId);
      if (response.content?.pages) {
        setPreviewPages(response.content.pages);
      }
    } catch (err) {
      setPreviewPages([]);
    }
  };

  const handleReplaceConfirm = async () => {
    if (!replaceTarget) return;
    setReplacing(true);
    setGenerating(true);
    setGeneratingStage('正在重新生成PPT...');
    try {
      if (replaceTarget.action === 'generate' && replaceTarget.lessonId) {
        // 模拟阶段更新
        const stageTimer1 = setTimeout(() => setGeneratingStage('正在分析教案内容...'), 3000);
        const stageTimer2 = setTimeout(() => setGeneratingStage('正在设计PPT页面布局...'), 10000);
        const stageTimer3 = setTimeout(() => setGeneratingStage('正在生成教学内容...'), 20000);
        
        await pptAPI.generate(replaceTarget.lessonId, true, true, selectedTheme);
        
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
      }
      setReplaceConfirmOpen(false);
      setReplaceTarget(null);
      fetchPPTs();
    } catch (err) {
      alert('替换失败: ' + ((err as Error).message || '未知错误'));
    } finally {
      setReplacing(false);
      setGenerating(false);
      setGeneratingStage('');
    }
  };

  const handleReplaceCancel = () => {
    setReplaceConfirmOpen(false);
    setReplaceTarget(null);
  };

  const handleExportPptx = (ppt: PPTRecord) => {
    pptAPI.detail(ppt.id).then((data: any) => {
      const pages = data.content?.pages || [];
      const exportPages = pages.map((p: any) => ({
        type: p.type || 'content',
        title: p.title || p.content?.mainTitle || '',
        mainContent: p.content?.mainContent || p.content?.items?.map((i: any) => i.text || '').join('\n') || '',
        notes: p.notes || '',
      }));
      if (exportPages.length > 0) exportToPptx(ppt.title, exportPages, selectedTheme);
      else alert('该PPT没有可导出的内容');
    }).catch(() => alert('获取PPT数据失败'));
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportHtml = async (ppt: PPTRecord) => {
    try {
      const blob = await pptAPI.export(ppt.id, 'html');
      downloadBlob(blob, `${ppt.title || '课件'}.html`);
    } catch (err) {
      alert((err as Error).message || '导出HTML失败');
    }
  };

  const formatDate = (dateString: string) => formatChinaDateTime(dateString);

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending': return '生成中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      default: return '已创建';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-600';
      case 'completed': return 'bg-green-100 text-green-600';
      case 'failed': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredPpts = ppts.filter((ppt) => !searchKeyword || ppt.title.toLowerCase().includes(searchKeyword.toLowerCase()));
  
  // 分页配置
  const totalPages = Math.ceil(filteredPpts.length / PPT_PAGE_SIZE);
  const paginatedPpts = filteredPpts.slice((currentPage - 1) * PPT_PAGE_SIZE, currentPage * PPT_PAGE_SIZE);
  
  // 搜索时重置到第一页
  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  return (
    <Layout title="PPT生成" subtitle="基于教案自动生成教学课件" breadcrumbs={[{ label: '首页', path: '/' }, { label: '我的备课', path: '/teaching-preparation' }, { label: 'PPT生成' }]}>
      <GeneratingProgressModal
        visible={generating}
        title="AI智能生成PPT中"
        stage={generatingStage}
        estimatedTime={300}
        tips={[
          'AI正在分析教案内容，请耐心等待...',
          '正在设计PPT页面布局...',
          '正在生成精美的教学课件...',
          'PPT即将生成完成，请勿关闭页面...',
        ]}
      />
      {/* Tab 导航 */}
      <div className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm sm:mb-6">
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('generate')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors sm:gap-2 sm:px-6 sm:py-4 ${activeTab === 'generate' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            PPT设计
          </button>
          <button onClick={() => { setActiveTab('myPpt'); fetchPPTs(); }} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors sm:gap-2 sm:px-6 sm:py-4 ${activeTab === 'myPpt' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            我的PPT
          </button>
        </div>
      </div>

      {/* PPT设计 */}
      {activeTab === 'generate' && (
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 text-center sm:mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">PPT设计</h2>
              <p className="text-gray-500">从教案生成PPT</p>
            </div>
            <div className="flex justify-center mb-8">
              {/* 从教案生成 */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer w-full max-w-sm" onClick={() => setShowGenerateModal(true)}>
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">从教案生成</h3>
                <p className="text-sm text-gray-500">选择教案，AI自动生成PPT</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 我的PPT */}
      {activeTab === 'myPpt' && (
        <div className="mx-auto max-w-6xl min-w-0">
          <div className="mb-4 rounded-xl bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={searchKeyword} onChange={(e) => handleSearchChange(e.target.value)} placeholder="搜索PPT标题..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              {searchKeyword && <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div></div>
          ) : filteredPpts.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">{searchKeyword ? '没有找到匹配的PPT' : '暂无PPT'}</h3>
              <p className="text-gray-500 mb-6">{searchKeyword ? '请尝试其他关键词' : '点击"从教案生成"创建您的第一个PPT'}</p>
              {!searchKeyword && <Button onClick={() => setActiveTab('generate')}>去生成PPT</Button>}
            </div>
          ) : (
            <React.Fragment>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                {paginatedPpts.map((ppt) => {
                  const lesson = lessons.find((l) => l.id === ppt.lessonId);
                  return (
                    <div key={ppt.id} onClick={() => navigate(`/ppt/${ppt.id}`)} className="cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100"><span className="text-xl font-bold text-orange-600">P</span></div>
                          <div className="min-w-0">
                            <h3 className="break-words font-semibold text-gray-800 sm:break-normal">{ppt.title}</h3>
                            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                              {lesson && <span className="break-words text-sm text-gray-500">教案：{lesson.title}</span>}
                              {!lesson && ppt.lessonId && <span className="text-sm text-gray-500">教案：未知</span>}
                              {!ppt.lessonId && <span className="text-sm text-gray-500">独立创建</span>}
                              <span className="text-sm text-gray-400 sm:whitespace-nowrap">{formatDate(ppt.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                           <button onClick={(e) => { e.stopPropagation(); navigate(`/ppt/${ppt.id}`); }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="查看PPT">
                             <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleExportPptx(ppt); }} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="导出PPTX">
                             <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleExportHtml(ppt); }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="导出HTML">
                             <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(ppt.id, ppt.title); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 分页导航 */}
              {filteredPpts.length > 0 && (
                <div className="mt-4 rounded-xl bg-white p-3 shadow-sm sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500">
                      共 {filteredPpts.length} 个PPT，第 {currentPage}/{totalPages} 页
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="hidden px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
                      >
                        首页
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        上一页
                      </button>
                      {/* 页码按钮 */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`hidden px-3 py-1.5 text-sm font-medium rounded-lg transition-colors sm:inline-flex ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white border border-primary-600'
                                : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="hidden px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
                      >
                        下一页
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        末页
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      )}

      {/* 同名替换确认 */}
      {replaceConfirmOpen && replaceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleReplaceCancel} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">PPT已存在</h3>
              </div>
              <p className="text-gray-600 mb-6">已存在同名PPT「<span className="font-medium">{replaceTarget.title}</span>」，是否替换为最新版本？</p>
              <div className="flex justify-end gap-3">
                <button onClick={handleReplaceCancel} disabled={replacing} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">取消</button>
                <button onClick={handleReplaceConfirm} disabled={replacing} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50">{replacing ? '替换中...' : '确认替换'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {deleteConfirmOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDeleteCancel} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
              <p className="text-gray-600 mb-6">确定要删除 PPT「<span className="font-medium">{deleteTarget.title}</span>」吗？此操作不可撤销。</p>
              <div className="flex justify-end gap-3">
                <button onClick={handleDeleteCancel} disabled={deleting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">取消</button>
                <button onClick={handleDeleteConfirm} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">{deleting ? '删除中...' : '确认删除'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 生成PPT弹窗 */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">从教案生成PPT</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择教案 *</label>
                <select value={selectedLesson || ''} onChange={(e) => { setSelectedLesson(parseInt(e.target.value)); setError(''); }} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">请选择教案</option>
                  {lessons.map((lesson) => (<option key={lesson.id} value={lesson.id}>{lesson.title} - {lesson.subject} - {lesson.grade}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">颜色主题</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {([
                    { key: 'default', name: '默认蓝', color: '#1E40AF' },
                    { key: 'modern', name: '现代紫', color: '#7C3AED' },
                    { key: 'academic', name: '学术绿', color: '#059669' },
                    { key: 'warm', name: '温暖橙', color: '#EA580C' },
                    { key: 'business', name: '商务灰', color: '#374151' },
                    { key: 'creative', name: '创意粉', color: '#DB2777' },
                  ] as const).map((theme) => (
                    <button
                      key={theme.key}
                      type="button"
                      onClick={() => setSelectedTheme(theme.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                        selectedTheme === theme.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200" style={{ backgroundColor: theme.color }} />
                      <span className="text-gray-700">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
              <p className="text-sm text-gray-500">选择教案后，系统将根据教案内容自动生成PPT课件。</p>
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-200 p-4 sm:flex-row">
              <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>取消</Button>
              <Button onClick={handleGenerate} loading={generating}>生成PPT</Button>
            </div>
          </div>
        </div>
      )}

      <PPTModalPreview isOpen={previewOpen} onClose={() => setPreviewOpen(false)} pages={previewPages} title={previewTitle} />
    </Layout>
  );
};

export default PPT;
