import React, { useEffect, useRef, useState, useCallback } from 'react';

interface HtmlDeckFullscreenModalProps {
  html: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const HtmlDeckFullscreenModal: React.FC<HtmlDeckFullscreenModalProps> = ({
  html,
  title,
  isOpen,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 切换全屏
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn('无法进入全屏模式:', err);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 弹窗打开后自动聚焦 iframe
  useEffect(() => {
    if (isOpen && iframeRef.current) {
      const timer = setTimeout(() => {
        iframeRef.current?.focus();
      }, 300); // 等待 iframe 内容加载
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose();
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }

      // 将方向键等翻页事件转发给 iframe
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
           'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'deck-keydown', key: e.key }, '*'
        );
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 组件卸载时退出全屏
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black">
      {/* 工具栏 */}
      <div className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : ''}`}>
        <div className="flex items-center gap-3">
          {/* 全屏图标 */}
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="text-white font-medium">{title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 全屏按钮 */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title={isFullscreen ? "退出全屏 (F)" : "全屏预览 (F)"}
          >
            {isFullscreen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="关闭 (Esc)"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* iframe 容器 */}
      <div ref={containerRef} className="w-full h-full">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="w-full h-full border-0 outline-none"
          sandbox="allow-scripts"
          title={title}
          tabIndex={0}
        />
      </div>

      {/* 键盘提示条 */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/70 rounded-lg text-white text-sm opacity-0 hover:opacity-100 transition-opacity duration-300">
          <span className="mr-4">← → 翻页</span>
          <span className="mr-4">F 全屏</span>
          <span>Esc 退出</span>
        </div>
      )}
    </div>
  );
};

export default HtmlDeckFullscreenModal;
