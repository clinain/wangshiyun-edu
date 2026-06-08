import React, { useState, useEffect, useCallback } from 'react';

interface PPTPage {
  type: string;
  title: string;
  content: {
    mainTitle?: string;
    subtitle?: string;
    school?: string;
    date?: string;
    time?: string;
    fullDateTime?: string;
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

interface PPTModalPreviewProps {
  pages: PPTPage[];
  title: string;
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
}

const PPTModalPreview: React.FC<PPTModalPreviewProps> = ({
  pages,
  title,
  isOpen,
  onClose,
  initialPage = 0
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(initialPage);
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentPage]);

  const goToPrev = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
  }, [pages.length]);

  const zoomIn = () => setScale(prev => Math.min(2, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));
  const resetZoom = () => setScale(1);

  const renderContent = (content: PPTPage['content']) => {
    if (content.mainTitle && content.subtitle) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{content.mainTitle}</h1>
          <p className="text-xl text-gray-600 mb-2">{content.subtitle}</p>
          {content.school && <p className="text-gray-500">{content.school}</p>}
          {(content.date || content.time || content.fullDateTime) && (
            <div className="mt-4 text-gray-400">
              {content.fullDateTime ? (
                <p className="text-sm">创作时间：{content.fullDateTime}</p>
              ) : (
                <p className="text-sm">
                  {content.date} {content.time}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    if (content.items && Array.isArray(content.items)) {
      return (
        <ul className="space-y-3">
          {content.items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              {item.number && (
                <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {item.number}
                </span>
              )}
              <span className="text-gray-700 leading-relaxed">{item.text}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (content.mainContent) {
      return (
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.mainContent}</p>
        </div>
      );
    }

    if (content.text) {
      return (
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.text}</p>
        </div>
      );
    }

    if (content.mainText && content.subText) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-4xl font-bold text-primary-600 mb-4">{content.mainText}</h2>
          <p className="text-xl text-gray-600">{content.subText}</p>
        </div>
      );
    }

    return (
      <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600 overflow-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  };

  const getLayoutStyles = (layout: string) => {
    switch (layout) {
      case 'cover':
        return 'bg-gradient-to-br from-primary-50 to-primary-100';
      case 'end':
        return 'bg-gradient-to-br from-gray-50 to-gray-100';
      default:
        return 'bg-white';
    }
  };

  if (!isOpen) return null;

  const page = pages[currentPage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full h-full max-w-6xl mx-4 my-8 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <span className="text-sm text-gray-500">第 {currentPage + 1} / {pages.length} 页</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="缩小 ( - )"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 w-14 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={zoomIn}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="放大 ( + )"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            <button
              onClick={resetZoom}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="重置缩放"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="关闭 (Esc)"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 overflow-auto">
          {isLoading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
          ) : page ? (
            <div
              className={`${getLayoutStyles(page.layout)} rounded-xl shadow-lg p-8 min-h-[500px] w-full max-w-4xl transition-transform duration-200`}
              style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">{page.title}</h3>
                <span className="text-sm text-gray-400">第 {currentPage + 1} 页</span>
              </div>
              <div className="min-h-[350px]">
                {renderContent(page.content)}
              </div>
              {page.notes && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-400 italic">备注: {page.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>暂无内容</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={goToPrev}
            disabled={currentPage === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            上一页
          </button>

          <div className="flex items-center gap-1">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentPage ? 'bg-primary-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentPage === pages.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentPage === pages.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            下一页
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full opacity-60">
          使用 ← → 键翻页，+/- 键缩放，Esc 键关闭
        </div>
      </div>
    </div>
  );
};

export default PPTModalPreview;
