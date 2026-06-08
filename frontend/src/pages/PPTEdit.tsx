import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import OnlyOfficeEditor from '@/components/OnlyOfficeEditor';
import { pptAPI } from '@/api';

const PPTEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadPpt(parseInt(id));
  }, [id]);

  const loadPpt = async (pptId: number) => {
    setLoading(true);
    try {
      const data = await pptAPI.detail(pptId);
      setTitle(data.title || '');

      // 将 PPT 内容导出为 PPTX 并上传到服务器
      await exportAndUpload(pptId);
    } catch (err) {
      setError('加载PPT失败');
    } finally {
      setLoading(false);
    }
  };

  const exportAndUpload = async (pptId: number) => {
    setUploading(true);
    setError('');
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
      pptx.title = data.title || 'PPT';

      pages.forEach((p: any) => {
        try {
          const slide = pptx.addSlide();
          const content = p.content || {};

          if (p.type === 'cover') {
            // 封面页
            slide.background = { color: '1E40AF' };
            slide.addText(content.mainTitle || p.title || '', { x: 1, y: 2.0, w: 11.33, h: 1.5, fontSize: 36, color: 'FFFFFF', bold: true, align: 'center' });
            if (content.subtitle) slide.addText(content.subtitle, { x: 1, y: 3.5, w: 11.33, h: 0.8, fontSize: 20, color: 'BFDBFE', align: 'center' });
            if (content.school) slide.addText(content.school, { x: 1, y: 4.3, w: 11.33, h: 0.5, fontSize: 14, color: '93C5FD', align: 'center' });
            if (content.mainContent) slide.addText(content.mainContent, { x: 1, y: 4.8, w: 11.33, h: 0.5, fontSize: 14, color: '93C5FD', align: 'center' });
            const dateStr = content.fullDateTime || content.date || '';
            if (dateStr) slide.addText(dateStr, { x: 1, y: 5.5, w: 11.33, h: 0.4, fontSize: 12, color: '93C5FD', align: 'center' });
          } else if (p.type === 'end') {
            // 结束页
            slide.background = { color: '1F2937' };
            slide.addText(content.mainText || p.title || '', { x: 1, y: 2.5, w: 11.33, h: 1.5, fontSize: 36, color: 'FFFFFF', bold: true, align: 'center' });
            if (content.subText) slide.addText(content.subText, { x: 1, y: 4.0, w: 11.33, h: 0.8, fontSize: 18, color: 'D1D5DB', align: 'center' });
          } else if (content.items && Array.isArray(content.items)) {
            // 带列表项的页面
            slide.background = { color: 'FFFFFF' };
            slide.addText(p.title || '', { x: 0.8, y: 0.2, w: 11.73, h: 0.9, fontSize: 24, color: '1E40AF', bold: true });
            try { slide.addShape((pptx as any).ShapeType?.rect || 'rect', { x: 0.8, y: 1.05, w: 1.5, h: 0.05, fill: { color: '1E40AF' } }); } catch {}
            const listItems = content.items.map((item: any, idx: number) => {
              const num = item.number || idx + 1;
              const text = typeof item === 'string' ? item : (item.text || String(item));
              return {
                text: `  ${num}.  ${text}`,
                options: {
                  fontSize: 14,
                  color: '374151',
                  bullet: false,
                  breakType: 'none' as const,
                  paraSpaceAfter: 6,
                }
              };
            });
            slide.addText(listItems, { x: 0.8, y: 1.3, w: 11.73, h: 5.5, valign: 'top', lineSpacingMultiple: 1.5 });
          } else {
            // 通用内容页
            slide.background = { color: 'FFFFFF' };
            slide.addText(p.title || '', { x: 0.8, y: 0.2, w: 11.73, h: 0.9, fontSize: 24, color: '1E40AF', bold: true });
            try { slide.addShape((pptx as any).ShapeType?.rect || 'rect', { x: 0.8, y: 1.05, w: 1.5, h: 0.05, fill: { color: '1E40AF' } }); } catch {}
            const bodyText = content.mainContent || content.text || content.mainText || '';
            if (bodyText) {
              slide.addText(bodyText, { x: 0.8, y: 1.3, w: 11.73, h: 5.5, fontSize: 14, color: '374151', valign: 'top', lineSpacingMultiple: 1.5 });
            }
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

      // 上传到服务器
      const buffer = await pptx.write({ outputType: 'arraybuffer' });
      const blob = new Blob([buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const file = new File([blob], `${data.title || 'PPT'}.pptx`, { type: blob.type });
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/onlyoffice/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data?.url) {
        const onlyOfficeUrl = `${window.location.protocol}//${window.location.hostname}:8080/web-apps/apps/presentationeditor/main/index.html?lang=zh-CN&customer=AI教学助手&fileType=pptx&key=${encodeURIComponent(`ppt-${pptId}-${Date.now()}`)}&title=${encodeURIComponent(data.title || 'PPT')}&url=${encodeURIComponent(result.data.url)}&mode=edit`;
        window.open(onlyOfficeUrl, '_blank');
        // 跳转回 PPT 列表
        navigate('/ppt');
      } else {
        setError('上传失败: ' + (result.message || '未知错误'));
      }
    } catch (err) {
      console.error('导出PPT失败:', err);
      setError('导出失败: ' + ((err as Error).message || '未知错误'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="编辑PPT">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-500">正在加载PPT并准备编辑器...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !documentUrl) {
    return (
      <Layout title="编辑PPT">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/ppt')}>返回</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="编辑PPT" subtitle={title}>
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-500 mb-4">正在准备编辑器，即将跳转到 OnlyOffice...</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">OnlyOffice 编辑器已在新标签页中打开。</p>
              <Button onClick={() => navigate('/ppt')}>返回列表</Button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PPTEdit;
