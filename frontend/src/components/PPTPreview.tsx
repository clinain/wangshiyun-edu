import React from 'react';

interface PPTContent {
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
}

interface PPTPage {
  type: string;
  title: string;
  content: PPTContent;
  layout: string;
  notes?: string;
}

interface PPTPreviewProps {
  pages: PPTPage[];
  title?: string;
}

const PPTPreview: React.FC<PPTPreviewProps> = ({ pages, title }) => {
  const renderContent = (content: PPTContent) => {
    // 处理封面页内容
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

    // 处理列表类型内容 (goals, keypoints, toc)
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

    // 处理文本类型内容 (process, assignments)
    if (content.mainContent) {
      return (
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.mainContent}</p>
        </div>
      );
    }

    // 处理简单文本内容
    if (content.text) {
      return (
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.text}</p>
        </div>
      );
    }

    // 处理结束页内容
    if (content.mainText && content.subText) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-4xl font-bold text-primary-600 mb-4">{content.mainText}</h2>
          <p className="text-xl text-gray-600">{content.subText}</p>
        </div>
      );
    }

    // 默认情况：显示JSON结构
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

  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-xl font-bold text-gray-800 mb-6">PPT预览</h2>
      )}
      <div className="grid gap-4">
        {pages.map((page, index) => (
          <div
            key={index}
            className={`${getLayoutStyles(page.layout)} rounded-xl shadow-lg p-6 min-h-[300px] border border-gray-200`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{page.title}</h3>
              <span className="text-sm text-gray-400">第 {index + 1} 页</span>
            </div>
            <div className="h-[calc(100%-60px)]">
              {renderContent(page.content)}
            </div>
            {page.notes && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-400 italic">备注: {page.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PPTPreview;
