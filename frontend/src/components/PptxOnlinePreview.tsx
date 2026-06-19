import React, { useState } from 'react';

interface PptxOnlinePreviewProps {
  /** 带认证的文件预览 URL */
  previewUrl: string;
  /** 文件标题 */
  title: string;
  /** 下载回调 */
  onDownload?: () => void;
}

/**
 * PPT/Excel 在线预览组件
 * 优先使用 Microsoft Office Online Viewer，不可用时显示下载提示
 */
const PptxOnlinePreview: React.FC<PptxOnlinePreviewProps> = ({ previewUrl, title, onDownload }) => {
  const [loadError, setLoadError] = useState(false);

  // 判断是否为公网可访问的 URL
  const isPublicUrl = !previewUrl.includes('localhost') && !previewUrl.includes('127.0.0.1');

  // Microsoft Office Online Viewer URL
  const msOfficeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`;

  if (loadError || !isPublicUrl) {
    return (
      <div className="text-center py-12">
        <svg className="h-20 w-20 mx-auto mb-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 mb-2 font-medium">此文件需要下载后查看</p>
        <p className="text-gray-400 text-sm mb-1">文件名: {title}</p>
        <p className="text-gray-400 text-xs mb-4">在线预览仅在公网环境下可用</p>
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

  return (
    <div className="w-full h-full">
      <iframe
        src={msOfficeViewerUrl}
        className="w-full h-full border-0"
        title={title}
        onError={() => setLoadError(true)}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
};

export default PptxOnlinePreview;
