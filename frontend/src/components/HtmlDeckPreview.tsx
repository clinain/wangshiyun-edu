import React, { useEffect, useRef } from 'react';

interface HtmlDeckPreviewProps {
  html?: string;
  title?: string;
}

const HtmlDeckPreview: React.FC<HtmlDeckPreviewProps> = ({ html, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 组件挂载后自动聚焦 iframe
  useEffect(() => {
    if (iframeRef.current) {
      const timer = setTimeout(() => {
        iframeRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);
  if (!html) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-500">
        暂无 HTML 课件内容
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-black shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">HTML Deck Preview</p>
          <h3 className="text-sm font-medium text-gray-100">{title || '课件预览'}</h3>
        </div>
        <p className="text-xs text-gray-500">使用 ← / → 键翻页</p>
      </div>
      <iframe
        ref={iframeRef}
        title={title || 'HTML课件预览'}
        srcDoc={html}
        className="h-[68vh] min-h-[520px] w-full border-0 outline-none bg-white"
        sandbox="allow-scripts"
        tabIndex={0}
      />
    </div>
  );
};

export default HtmlDeckPreview;
