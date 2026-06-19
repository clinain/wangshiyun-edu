import React, { useEffect, useRef, useState } from 'react';

interface DocxPreviewProps {
  /** 带认证的文件预览 URL */
  previewUrl: string;
  /** 文件标题 */
  title: string;
  /** 文件格式 */
  format: string;
  /** 下载回调 */
  onDownload?: () => void;
}

/**
 * Word 文档预览组件
 * - .docx 文件：使用 docx-preview 库在浏览器端渲染
 * - .doc 文件：显示下载提示（旧格式无法在浏览器端解析）
 */
const DocxPreview: React.FC<DocxPreviewProps> = ({ previewUrl, title, format, onDownload }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !previewUrl) return;

    const ext = format.toLowerCase();

    // .doc（旧二进制格式）不支持浏览器端渲染
    if (ext === 'doc') {
      setLoading(false);
      setError('old_format');
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const renderDocx = async () => {
      setLoading(true);
      setError('');

      try {
        // 动态导入 docx-preview（避免影响其他页面的加载）
        const { renderAsync } = await import('docx-preview');

        // 获取文件 blob
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error(`获取文件失败: HTTP ${response.status}`);
        }
        const blob = await response.blob();

        if (cancelled) return;

        // 检查 blob 是否为空
        if (blob.size === 0) {
          throw new Error('文件内容为空');
        }

        // 清空容器
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // 设置超时防止挂起（30秒）
        timeoutId = setTimeout(() => {
          if (!cancelled && !rendered) {
            setLoading(false);
            setError('render_timeout');
          }
        }, 30000);

        // 使用 docx-preview 渲染
        await renderAsync(blob, containerRef.current!, undefined, {
          className: 'docx-preview',
          inWrapper: true,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
        });

        if (!cancelled) {
          clearTimeout(timeoutId);
          setRendered(true);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          clearTimeout(timeoutId);
          console.error('Word 文档预览失败:', err);
          setError((err as Error).message || 'Word 文档预览失败');
          setLoading(false);
        }
      }
    };

    renderDocx();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [previewUrl, format]);

  // .doc 旧格式 - 显示下载提示
  if (error === 'old_format') {
    return (
      <div className="text-center py-12">
        <svg className="h-20 w-20 mx-auto mb-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-700 mb-2 font-medium">此 Word 文档为旧格式（.doc）</p>
        <p className="text-gray-400 text-sm mb-1">文件名: {title}</p>
        <p className="text-gray-400 text-xs mb-4">旧版 Word 格式不支持在线预览，请下载后使用本地软件打开</p>
        {onDownload && (
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载文件
          </button>
        )}
      </div>
    );
  }

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">正在加载 Word 文档预览...</p>
        </div>
      </div>
    );
  }

  // 渲染超时或其他错误
  if (error) {
    return (
      <div className="text-center py-12">
        <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 mb-2">
          {error === 'render_timeout' ? '文档预览加载超时' : `预览失败: ${error}`}
        </p>
        <p className="text-gray-400 text-sm mb-4">文件名: {title}</p>
        {onDownload && (
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载文件
          </button>
        )}
      </div>
    );
  }

  // 渲染成功
  return (
    <div className="w-full h-full overflow-auto docx-container">
      <style>{`
        .docx-container .docx {
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        }
        .docx-container table {
          border-collapse: collapse;
          width: 100%;
        }
        .docx-container td, .docx-container th {
          border: 1px solid #ccc;
          padding: 4px 8px;
        }
        .docx-container img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
      <div ref={containerRef} className="docx-preview-wrapper" />
    </div>
  );
};

export default DocxPreview;
