import React, { useEffect, useState } from 'react';

interface PptxLocalPreviewProps {
  /** 带认证的文件预览 URL */
  previewUrl: string;
  /** 文件标题 */
  title: string;
  /** 下载回调 */
  onDownload?: () => void;
}

interface SlideContent {
  index: number;
  texts: string[];
}

/**
 * PPTX 本地预览组件
 * 使用 JSZip 解析 PPTX 文件，提取幻灯片文本内容并渲染
 */
const PptxLocalPreview: React.FC<PptxLocalPreviewProps> = ({ previewUrl, title, onDownload }) => {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!previewUrl) return;

    let cancelled = false;

    const parsePptx = async () => {
      setLoading(true);
      setError('');

      try {
        // 动态导入 JSZip
        const JSZip = (await import('jszip')).default;

        // 获取文件
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error(`获取文件失败: HTTP ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        if (cancelled) return;

        // 解压 PPTX（PPTX 是 ZIP 格式）
        const zip = await JSZip.loadAsync(arrayBuffer);

        if (cancelled) return;

        // 查找所有幻灯片文件
        const slideFiles: string[] = [];
        zip.forEach((path) => {
          if (path.match(/^ppt\/slides\/slide\d+\.xml$/)) {
            slideFiles.push(path);
          }
        });

        // 按编号排序
        slideFiles.sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
          return numA - numB;
        });

        const parsedSlides: SlideContent[] = [];

        for (let i = 0; i < slideFiles.length; i++) {
          if (cancelled) break;

          const file = zip.file(slideFiles[i]);
          if (!file) continue;

          const xml = await file.async('text');
          if (cancelled) break;

          // 从 XML 中提取文本内容
          const texts: string[] = [];

          // 提取所有 <a:t> 标签中的文本（PowerPoint XML 中的文本节点）
          const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
          if (textMatches) {
            for (const match of textMatches) {
              const text = match.replace(/<[^>]+>/g, '').trim();
              if (text) {
                texts.push(text);
              }
            }
          }

          parsedSlides.push({
            index: i + 1,
            texts,
          });
        }

        if (!cancelled) {
          setSlides(parsedSlides);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('PPTX 解析失败:', err);
          setError((err as Error).message || 'PPT 文件解析失败');
          setLoading(false);
        }
      }
    };

    parsePptx();

    return () => {
      cancelled = true;
    };
  }, [previewUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">正在解析 PPT 文件...</p>
        </div>
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="h-20 w-20 mx-auto mb-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <p className="text-gray-600 mb-2 font-medium">
          {error ? `预览失败: ${error}` : '未提取到幻灯片内容'}
        </p>
        <p className="text-gray-400 text-sm mb-1">文件名: {title}</p>
        <p className="text-gray-400 text-xs mb-4">可下载文件查看完整内容</p>
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

  const totalSlides = slides.length;
  const slide = slides[currentSlide];

  return (
    <div className="flex flex-col h-full">
      {/* 幻灯片内容区 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 min-h-[300px] max-w-4xl mx-auto">
          {/* 幻灯片编号 */}
          <div className="text-xs text-gray-400 mb-4">幻灯片 {slide.index} / {totalSlides}</div>

          {/* 幻灯片文本内容 */}
          {slide.texts.length > 0 ? (
            <div className="space-y-2">
              {slide.texts.map((text, idx) => (
                <p
                  key={idx}
                  className={`${idx === 0 ? 'text-xl font-bold text-gray-800' : 'text-sm text-gray-600'} leading-relaxed`}
                >
                  {text}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">此幻灯片无文本内容</p>
          )}
        </div>
      </div>

      {/* 幻灯片导航栏 */}
      {totalSlides > 1 && (
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← 上一页
          </button>

          {/* 幻灯片缩略图导航 */}
          <div className="flex items-center gap-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  idx === currentSlide
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
            disabled={currentSlide === totalSlides - 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一页 →
          </button>
        </div>
      )}

      {/* 下载提示 */}
      <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2 text-center">
        <p className="text-xs text-gray-400">
          当前显示的是文本内容预览，完整排版请
          {onDownload && (
            <button onClick={onDownload} className="text-primary-500 hover:text-primary-600 underline ml-1">
              下载文件
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

export default PptxLocalPreview;
