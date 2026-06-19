import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import PPTPreview from '@/components/PPTPreview';
import HtmlDeckPreview from '@/components/HtmlDeckPreview';
import PPTModalPreview from '@/components/PPTModalPreview';
import HtmlDeckFullscreenModal from '@/components/HtmlDeckFullscreenModal';
import { exportToPptx } from '@/utils/exportPptx';
import { formatChinaDateTime } from '@/utils/dateTime';
import { pptAPI } from '@/api';

interface PPTPage {
  type: string;
  title: string;
  content: {
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
  };
  layout: string;
  notes?: string;
}

interface PPTData {
  id: number;
  title: string;
  content: {
    pages: PPTPage[];
    pageCount: number;
    html?: string;
    format?: string;
    deckStyle?: string;
  };
  pageCount: number;
  createdAt: string;
}

const PPTDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pptData, setPptData] = useState<PPTData | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(searchParams.get('readonly') === 'true');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fullscreenPreviewOpen, setFullscreenPreviewOpen] = useState(false);
  const [htmlDeckFullscreenOpen, setHtmlDeckFullscreenOpen] = useState(false);

  useEffect(() => {
    setIsReadOnly(searchParams.get('readonly') === 'true');
  }, [searchParams]);

  useEffect(() => {
    if (id) {
      const parsedId = parseInt(id);
      if (!isNaN(parsedId) && parsedId > 0) {
        fetchPPTDetail(parsedId);
      } else {
        setError('无效的PPT ID');
        setLoading(false);
      }
    }
  }, [id]);

  const fetchPPTDetail = async (pptId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await pptAPI.detail(pptId);
      if (response.content && response.content.pages && Array.isArray(response.content.pages)) {
        setPptData({
          id: response.id,
          title: response.title,
          content: {
            pages: response.content.pages,
            pageCount: response.content.pageCount || 0,
            html: response.content.html,
            format: response.content.format,
            deckStyle: response.content.deckStyle,
          },
          pageCount: response.pageCount || response.content.pageCount || 0,
          createdAt: response.createdAt || ''
        });
        setError('');
      } else {
        setError('PPT内容为空或格式不正确');
        console.error('PPT内容解析失败:', response);
      }
    } catch (err) {
      setError((err as Error).message || '获取PPT详情失败');
      console.error('获取PPT详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPptx = () => {
    if (!pptData?.content?.pages) return;
    const pages = pptData.content.pages.map((p: any) => ({
      type: p.type || 'content',
      title: p.title || p.content?.mainTitle || '',
      mainContent: p.content?.mainContent || p.content?.items?.map((i: any) => i.text || '').join('\n') || '',
      notes: p.notes || '',
    }));
    if (pages.length > 0) {
      exportToPptx(pptData.title, pages);
    } else {
      alert('该PPT没有可导出的内容');
    }
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

  const handleExportHTML = async () => {
    if (!pptData) return;
    try {
      const blob = await pptAPI.export(pptData.id, 'html');
      downloadBlob(blob, `${pptData.title || '课件'}.html`);
    } catch (err) {
      alert((err as Error).message || '导出HTML失败');
    }
  };

  const formatDate = (dateString: string) => formatChinaDateTime(dateString);

  if (loading) {
    return (
      <Layout title="PPT详情">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="PPT详情">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>
      </Layout>
    );
  }

  if (!pptData || !pptData.content?.pages) {
    return (
      <Layout title="PPT详情">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">PPT内容为空</p>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="PPT详情" subtitle={pptData.title}>
      <div className="mb-4">
        <Button variant="secondary" onClick={() => navigate('/ppt')}>
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Button>
      </div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">{pptData.title}</h1>
          <p className="text-gray-500 mt-1">共 {pptData.pageCount} 页 · {formatDate(pptData.createdAt)}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-3 lg:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => {
            if (pptData.content.html) {
              setHtmlDeckFullscreenOpen(true);
            } else {
              setFullscreenPreviewOpen(true);
            }
          }}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            全屏预览
          </Button>
          {!isReadOnly && (
            <Button className="w-full sm:w-auto" onClick={handleExportHTML}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
              </svg>
              导出HTML
            </Button>
          )}
          {!isReadOnly && (
            <Button variant="secondary" className="w-full sm:w-auto" onClick={handleExportPptx}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出PPTX
            </Button>
          )}
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-danger-50 px-4 py-2 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-100 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white p-3 shadow-sm sm:p-6">
        {pptData.content.html ? (
          <HtmlDeckPreview html={pptData.content.html} title={pptData.title} />
        ) : (
          <PPTPreview pages={pptData.content.pages} title={pptData.title} />
        )}
      </div>

      {/* 删除确认弹窗 */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-in">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
              </div>
              <p className="text-gray-600 mb-6">
                确定要删除 PPT「<span className="font-medium text-gray-900">{pptData.title}</span>」吗？此操作不可撤销。
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    if (!id) return;
                    setDeleting(true);
                    try {
                      await pptAPI.delete(parseInt(id));
                      navigate('/ppt');
                    } catch (err) {
                      alert('删除失败');
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      删除中...
                    </>
                  ) : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 全屏模态预览 */}
      <PPTModalPreview
        isOpen={fullscreenPreviewOpen}
        onClose={() => setFullscreenPreviewOpen(false)}
        pages={pptData.content.pages}
        title={pptData.title}
        enableFullscreen={true}
      />

      {/* HTML Deck 全屏预览弹窗 */}
      {pptData.content.html && (
        <HtmlDeckFullscreenModal
          isOpen={htmlDeckFullscreenOpen}
          onClose={() => setHtmlDeckFullscreenOpen(false)}
          html={pptData.content.html}
          title={pptData.title}
        />
      )}
    </Layout>
  );
};

export default PPTDetail;
