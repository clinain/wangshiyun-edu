import React from 'react';
import type { SlidePage } from './SlideThumbnails';

interface SlideEditorProps {
  page: SlidePage;
  pageIndex: number;
  totalPages: number;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

/** 页面类型标签 */
const PAGE_TYPE_BADGES: Record<string, { label: string; color: string }> = {
  cover: { label: '封面页', color: 'bg-primary-100 text-primary-700' },
  toc: { label: '目录页', color: 'bg-blue-100 text-blue-700' },
  content: { label: '内容页', color: 'bg-green-100 text-green-700' },
  end: { label: '结束页', color: 'bg-gray-100 text-gray-700' },
};

const SlideEditor: React.FC<SlideEditorProps> = ({
  page,
  pageIndex,
  totalPages,
  onTitleChange,
  onContentChange,
  onNotesChange,
}) => {
  const badge = PAGE_TYPE_BADGES[page.type] || PAGE_TYPE_BADGES.content;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-auto">
      {/* 页面信息栏 */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-sm text-gray-500">
            第 {pageIndex + 1} 页 / 共 {totalPages} 页
          </span>
        </div>
      </div>

      {/* 幻灯片预览 + 编辑区域 */}
      <div className="flex-1 p-6">
        {/* 幻灯片预览卡片 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-4xl mx-auto">
          {/* 幻灯片顶部装饰条 */}
          <div className={`h-1.5 ${
            page.type === 'cover' ? 'bg-gradient-to-r from-primary-500 to-primary-700' :
            page.type === 'toc' ? 'bg-gradient-to-r from-blue-500 to-blue-700' :
            page.type === 'end' ? 'bg-gradient-to-r from-gray-500 to-gray-700' :
            'bg-gradient-to-r from-primary-400 to-primary-600'
          }`} />

          {/* 标题编辑 */}
          <div className="px-8 pt-6 pb-4">
            <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wider">标题</label>
            <input
              type="text"
              value={page.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={
                page.type === 'cover' ? '输入幻灯片标题...' :
                page.type === 'toc' ? '输入目录标题...' :
                page.type === 'end' ? '输入结束语...' :
                '输入页面标题...'
              }
              className="w-full text-xl font-bold text-gray-800 border-none outline-none placeholder:text-gray-300 bg-transparent"
            />
          </div>

          {/* 分隔线 */}
          <div className="mx-8 border-t border-gray-100" />

          {/* 内容编辑 */}
          <div className="px-8 py-4">
            <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wider">
              {page.type === 'cover' ? '副标题' :
               page.type === 'toc' ? '目录内容（每行一个章节）' :
               page.type === 'end' ? '副文字' :
               '页面内容'}
            </label>
            <textarea
              value={page.mainContent}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={
                page.type === 'cover' ? '输入副标题...' :
                page.type === 'toc' ? '第一章\n第二章\n第三章' :
                page.type === 'end' ? 'Thank You' :
                '输入页面内容...'
              }
              rows={12}
              className="ppt-content-editor w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-4 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y bg-gray-50 placeholder:text-gray-300"
            />
          </div>

          {/* 演讲备注 */}
          <div className="px-8 pb-6">
            <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wider">演讲备注</label>
            <textarea
              value={page.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="添加演讲备注（不会显示在幻灯片中）..."
              rows={3}
              className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y bg-yellow-50/50 placeholder:text-gray-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideEditor;
