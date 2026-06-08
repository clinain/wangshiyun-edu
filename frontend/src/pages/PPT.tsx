import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import PPTModalPreview from '@/components/PPTModalPreview';
import { exportToPptx } from '@/utils/exportPptx';
import { pptAPI, lessonAPI } from '@/api';
import type { PPTRecord, Lesson, PPTPage } from '@/types';

const PPT: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'generate' | 'myPpt'>('generate');
  const [ppts, setPpts] = useState<PPTRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPages, setPreviewPages] = useState<PPTPage[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<{ title: string; action: 'generate' | 'create'; lessonId?: number } | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [newPptNameOpen, setNewPptNameOpen] = useState(false);
  const [newPptName, setNewPptName] = useState('');
  const [creating, setCreating] = useState(false);

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
      const result = await pptAPI.list().catch(() => ({ ppts: [] }));
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
      await pptAPI.generate(selectedLesson);
      fetchPPTs();
      setSelectedLesson(null);
      setShowGenerateModal(false);
      setActiveTab('myPpt');
    } catch (err) {
      setError((err as Error).message || '生成失败');
    } finally {
      setGenerating(false);
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

  const handleCreateBlankPpt = () => {
    setNewPptName('');
    setNewPptNameOpen(true);
  };

  const handleNewPptNameConfirm = async () => {
    const name = newPptName.trim();
    if (!name) return;
    setCreating(true);
    try {
      // 检查是否重名
      try {
        const checkResult = await pptAPI.checkTitle(name);
        if (checkResult.exists) {
          setNewPptNameOpen(false);
          setReplaceTarget({ title: name, action: 'create' });
          setReplaceConfirmOpen(true);
          setCreating(false);
          return;
        }
      } catch {
        // check-title 接口不存在时继续正常流程
      }

      // 创建 PPT 记录到数据库
      const createResult = await pptAPI.createCustom({
        title: name,
        pages: [{ type: 'cover', title: '封面', content: { mainContent: '' } }],
        templateStyle: 'default',
      });

      // 生成空白PPTX并上传到服务器
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      pptx.title = name;
      const s1 = pptx.addSlide();
      s1.background = { color: '1E40AF' };
      s1.addText(name, { x: 1, y: 2.5, w: 11.33, h: 1.5, fontSize: 36, color: 'FFFFFF', bold: true, align: 'center' });
      const buffer = await pptx.write({ outputType: 'arraybuffer' });
      const blob = new Blob([buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const file = new File([blob], `${name}.pptx`, { type: blob.type });
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const uploadRes = await fetch('/api/onlyoffice/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const uploadResult = await uploadRes.json();

      setNewPptNameOpen(false);
      setNewPptName('');
      fetchPPTs();

      if (uploadResult.success && uploadResult.data?.url) {
        // 直接打开文件 URL（与"编辑"按钮行为一致）
        window.open(uploadResult.data.url, '_blank');
        // 跳转到PPT列表
        navigate('/ppt');
      } else {
        // 上传失败则跳转到编辑页面
        if (createResult && (createResult as any).id) {
          navigate(`/ppt/${(createResult as any).id}/edit`);
        }
      }
    } catch (err) {
      alert('创建失败: ' + ((err as Error).message || '未知错误'));
    } finally {
      setCreating(false);
    }
  };

  const [editingPptId, setEditingPptId] = useState<number | null>(null);

  const handleEditPpt = async (pptId: number, pptTitle: string, newWindow?: Window | null) => {
    setEditingPptId(pptId);
    let createdWindow = newWindow || null;
    try {
      const data = await pptAPI.detail(pptId);
      if (!data || !data.content) {
        throw new Error('PPT内容为空，无法编辑');
      }
      const pages = data.content.pages || [];

      if (pages.length === 0) {
        throw new Error('PPT没有幻灯片页面');
      }

      // 生成 PPTX
      const PptxGenJS = (await import('pptxgenjs')).default;
      const pptx = new PptxGenJS();
      pptx.title = data.title || pptTitle;

      pages.forEach((p: any) => {
        try {
          const slide = pptx.addSlide();
          const content = p.content || {};
          if (p.type === 'cover') {
            slide.background = { color: '1E40AF' };
            slide.addText(content.mainTitle || p.title || '', { x: 1, y: 2.0, w: 11.33, h: 1.5, fontSize: 36, color: 'FFFFFF', bold: true, align: 'center' });
            if (content.subtitle) slide.addText(content.subtitle, { x: 1, y: 3.5, w: 11.33, h: 0.8, fontSize: 20, color: 'BFDBFE', align: 'center' });
            if (content.mainContent) slide.addText(content.mainContent, { x: 1, y: 4.8, w: 11.33, h: 0.5, fontSize: 14, color: '93C5FD', align: 'center' });
            const dateStr = content.fullDateTime || content.date || '';
            if (dateStr) slide.addText(dateStr, { x: 1, y: 5.5, w: 11.33, h: 0.4, fontSize: 12, color: '93C5FD', align: 'center' });
          } else if (p.type === 'end') {
            slide.background = { color: '1F2937' };
            slide.addText(content.mainText || p.title || '', { x: 1, y: 2.5, w: 11.33, h: 1.5, fontSize: 36, color: 'FFFFFF', bold: true, align: 'center' });
            if (content.subText) slide.addText(content.subText, { x: 1, y: 4.0, w: 11.33, h: 0.8, fontSize: 18, color: 'D1D5DB', align: 'center' });
          } else if (content.items && Array.isArray(content.items)) {
            slide.background = { color: 'FFFFFF' };
            slide.addText(p.title || '', { x: 0.8, y: 0.2, w: 11.73, h: 0.9, fontSize: 24, color: '1E40AF', bold: true });
            // 顶部装饰线
            try { slide.addShape((pptx as any).ShapeType?.rect || 'rect', { x: 0.8, y: 1.05, w: 1.5, h: 0.05, fill: { color: '1E40AF' } }); } catch {}
            const listItems = content.items.map((item: any, idx: number) => ({
              text: `  ${item.number || idx + 1}.  ${typeof item === 'string' ? item : (item.text || String(item))}`,
              options: { fontSize: 14, color: '374151', paraSpaceAfter: 6 }
            }));
            slide.addText(listItems, { x: 0.8, y: 1.3, w: 11.73, h: 5.5, valign: 'top', lineSpacingMultiple: 1.5 });
          } else {
            slide.background = { color: 'FFFFFF' };
            slide.addText(p.title || '', { x: 0.8, y: 0.2, w: 11.73, h: 0.9, fontSize: 24, color: '1E40AF', bold: true });
            try { slide.addShape((pptx as any).ShapeType?.rect || 'rect', { x: 0.8, y: 1.05, w: 1.5, h: 0.05, fill: { color: '1E40AF' } }); } catch {}
            const bodyText = content.mainContent || content.text || content.mainText || '';
            if (bodyText) slide.addText(bodyText, { x: 0.8, y: 1.3, w: 11.73, h: 5.5, fontSize: 14, color: '374151', valign: 'top', lineSpacingMultiple: 1.5 });
          }
          // 如果页面有配图，嵌入到幻灯片右侧
          if (p.imageUrl) {
            try {
              slide.addImage({ data: p.imageUrl, x: 8.5, y: 1.5, w: 4.0, h: 3.0 });
            } catch {
              console.warn('嵌入图片失败，跳过:', p.imageUrl);
            }
          }
          if (p.notes) slide.addNotes(p.notes);
        } catch (slideErr) {
          console.warn('渲染幻灯片出错，跳过:', slideErr);
        }
      });

      // 上传到 OnlyOffice
      const buffer = await pptx.write({ outputType: 'arraybuffer' });
      const blob = new Blob([buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const file = new File([blob], `${data.title || pptTitle}.pptx`, { type: blob.type });
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const uploadRes = await fetch('/api/onlyoffice/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const uploadResult = await uploadRes.json();
      if (uploadResult.success && uploadResult.data?.url) {
        if (createdWindow) {
          createdWindow.location.href = uploadResult.data.url;
        } else {
          window.open(uploadResult.data.url, '_blank');
        }
      } else {
        console.error('OnlyOffice上传失败:', uploadResult);
        if (createdWindow) { try { createdWindow.close(); } catch {} }
        alert('OnlyOffice上传失败，请检查OnlyOffice服务是否运行');
      }
    } catch (err) {
      console.error('编辑PPT失败:', err);
      if (createdWindow) { try { createdWindow.close(); } catch {} }
      alert('编辑PPT失败: ' + ((err as Error).message || '未知错误'));
    } finally {
      setEditingPptId(null);
    }
  };

  const handleReplaceConfirm = async () => {
    if (!replaceTarget) return;
    setReplacing(true);
    try {
      if (replaceTarget.action === 'generate' && replaceTarget.lessonId) {
        await pptAPI.generate(replaceTarget.lessonId, true);
      } else if (replaceTarget.action === 'create') {
        await pptAPI.createCustom({
          title: replaceTarget.title,
          pages: [{ type: 'cover', title: '封面', content: { mainContent: '' } }],
          templateStyle: 'default',
          replaceExisting: true,
        });
      }
      setReplaceConfirmOpen(false);
      setReplaceTarget(null);
      fetchPPTs();
    } catch (err) {
      alert('替换失败: ' + ((err as Error).message || '未知错误'));
    } finally {
      setReplacing(false);
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
      if (exportPages.length > 0) exportToPptx(ppt.title, exportPages);
      else alert('该PPT没有可导出的内容');
    }).catch(() => alert('获取PPT数据失败'));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

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

  return (
    <Layout title="PPT生成" subtitle="基于教案自动生成教学课件" breadcrumbs={[{ label: '首页', path: '/' }, { label: '我的备课', path: '/lessons' }, { label: 'PPT生成' }]}>
      {/* Tab 导航 */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('generate')} className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'generate' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            PPT设计
          </button>
          <button onClick={() => { setActiveTab('myPpt'); fetchPPTs(); }} className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'myPpt' ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            我的PPT
          </button>
        </div>
      </div>

      {/* PPT设计 */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">PPT设计</h2>
              <p className="text-gray-500">从教案生成PPT，或创建空白PPT进行编辑</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 从教案生成 */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer" onClick={() => setShowGenerateModal(true)}>
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">从教案生成</h3>
                <p className="text-sm text-gray-500">选择教案，AI自动生成PPT</p>
              </div>
              {/* 新建空白PPT */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer" onClick={handleCreateBlankPpt}>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">新建空白PPT</h3>
                <p className="text-sm text-gray-500">创建空白PPT，自由编辑</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 我的PPT */}
      {activeTab === 'myPpt' && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="搜索PPT标题..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              {searchKeyword && <button onClick={() => setSearchKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div></div>
          ) : filteredPpts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">{searchKeyword ? '没有找到匹配的PPT' : '暂无PPT'}</h3>
              <p className="text-gray-500 mb-6">{searchKeyword ? '请尝试其他关键词' : '点击"从教案生成"创建您的第一个PPT'}</p>
              {!searchKeyword && <Button onClick={() => setActiveTab('generate')}>去生成PPT</Button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredPpts.map((ppt) => {
                const lesson = lessons.find((l) => l.id === ppt.lessonId);
                return (
                  <div key={ppt.id} onClick={() => navigate(`/ppt/${ppt.id}`)} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><span className="text-xl font-bold text-orange-600">P</span></div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{ppt.title}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            {lesson && <span className="text-sm text-gray-500">教案：{lesson.title}</span>}
                            {!lesson && ppt.lessonId && <span className="text-sm text-gray-500">教案：未知</span>}
                            {!ppt.lessonId && <span className="text-sm text-gray-500">独立创建</span>}
                            <span className="text-sm text-gray-400">{formatDate(ppt.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/ppt/${ppt.id}`); }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="查看PPT">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); const w = window.open('', '_blank'); handleEditPpt(ppt.id, ppt.title, w); }} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="在OnlyOffice中编辑">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleExportPptx(ppt); }} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="导出PPTX">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
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

      {/* 新建PPT名称输入弹窗 */}
      {newPptNameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!creating) { setNewPptNameOpen(false); setNewPptName(''); } }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">新建空白PPT</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PPT名称 *</label>
                <input
                  type="text"
                  value={newPptName}
                  onChange={(e) => setNewPptName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newPptName.trim()) handleNewPptNameConfirm(); }}
                  placeholder="请输入PPT名称"
                  autoFocus
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setNewPptNameOpen(false); setNewPptName(''); }} disabled={creating} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">取消</button>
                <button onClick={handleNewPptNameConfirm} disabled={creating || !newPptName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50">{creating ? '创建中...' : '确认创建'}</button>
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
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
              <p className="text-sm text-gray-500">选择教案后，系统将根据教案内容自动生成PPT课件。</p>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
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
