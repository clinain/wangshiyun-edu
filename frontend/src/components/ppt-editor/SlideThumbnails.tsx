import React from 'react';

export interface SlidePage {
  type: string;
  title: string;
  mainContent: string;
  layout: string;
  notes: string;
}

interface SlideThumbnailsProps {
  pages: SlidePage[];
  activePage: number;
  onPageSelect: (index: number) => void;
  onAddPage: () => void;
  onMovePage: (index: number, direction: -1 | 1) => void;
  onRemovePage: (index: number) => void;
}

const getPageTypeIcon = (type: string) => {
  switch (type) {
    case 'cover': return '📋';
    case 'toc': return '📑';
    case 'content': return '📄';
    case 'end': return '🏁';
    default: return '📄';
  }
};

const getPageTypeLabel = (type: string) => {
  switch (type) {
    case 'cover': return '封面';
    case 'toc': return '目录';
    case 'content': return '内容';
    case 'end': return '结束';
    default: return '内容';
  }
};

/** 幻灯片缩略图渲染 */
const SlideThumb: React.FC<{ page: SlidePage; isActive: boolean }> = ({ page, isActive }) => {
  const getThumbBg = () => {
    switch (page.type) {
      case 'cover': return 'bg-gradient-to-br from-primary-600 to-primary-800';
      case 'toc': return 'bg-gradient-to-br from-blue-500 to-blue-700';
      case 'content': return 'bg-white border border-gray-200';
      case 'end': return 'bg-gradient-to-br from-gray-700 to-gray-900';
      default: return 'bg-white border border-gray-200';
    }
  };

  const getTextColor = () => {
    return page.type === 'content' ? 'text-gray-800' : 'text-white';
  };

  return (
    <div className={`w-full aspect-[16/9] rounded overflow-hidden shadow-sm ${getThumbBg()} flex flex-col items-center justify-center p-2 relative`}>
      {/* 页码 */}
      <div className={`absolute top-1 right-1.5 text-[8px] ${page.type === 'content' ? 'text-gray-400' : 'text-white/60'}`}>
        {getPageTypeIcon(page.type)}
      </div>
      {/* 标题 */}
      <div className={`text-[7px] font-bold leading-tight text-center ${getTextColor()} line-clamp-2 px-1`}>
        {page.title || '空白页'}
      </div>
      {/* 内容预览 */}
      {page.type === 'content' && page.mainContent && (
        <div className="text-[5px] text-gray-400 text-center mt-1 line-clamp-2 px-1">
          {page.mainContent.substring(0, 60)}
        </div>
      )}
    </div>
  );
};

const SlideThumbnails: React.FC<SlideThumbnailsProps> = ({
  pages,
  activePage,
  onPageSelect,
  onAddPage,
  onMovePage,
  onRemovePage,
}) => {
  return (
    <div className="w-52 bg-gray-100 border-r border-gray-200 flex flex-col h-full">
      {/* 标题 */}
      <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">幻灯片</span>
        <button
          onClick={onAddPage}
          className="w-6 h-6 flex items-center justify-center text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title="新建幻灯片"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 缩略图列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {pages.map((page, index) => (
          <div
            key={index}
            className={`group relative cursor-pointer transition-all ${
              activePage === index
                ? 'ring-2 ring-primary-500 rounded-lg'
                : 'hover:ring-1 hover:ring-gray-300 rounded-lg'
            }`}
            onClick={() => onPageSelect(index)}
          >
            {/* 缩略图 */}
            <div className="p-1">
              <SlideThumb page={page} isActive={activePage === index} />
            </div>

            {/* 序号 */}
            <div className={`absolute bottom-2 left-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium ${
              activePage === index
                ? 'bg-primary-500 text-white'
                : 'bg-gray-600 text-white'
            }`}>
              {index + 1}
            </div>

            {/* 操作按钮 */}
            <div className="absolute top-1 left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {index > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMovePage(index, -1); }}
                  className="w-4 h-4 bg-black/50 hover:bg-black/70 rounded flex items-center justify-center"
                  title="上移"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
              {index < pages.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMovePage(index, 1); }}
                  className="w-4 h-4 bg-black/50 hover:bg-black/70 rounded flex items-center justify-center"
                  title="下移"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              {pages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemovePage(index); }}
                  className="w-4 h-4 bg-red-500/80 hover:bg-red-500 rounded flex items-center justify-center"
                  title="删除"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 底部添加按钮 */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <button
          onClick={onAddPage}
          className="w-full py-1.5 text-xs text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建幻灯片
        </button>
      </div>
    </div>
  );
};

export default SlideThumbnails;
