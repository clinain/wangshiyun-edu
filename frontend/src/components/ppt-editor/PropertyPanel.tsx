import React, { useState } from 'react';
import type { SlidePage } from './SlideThumbnails';

interface PropertyPanelProps {
  page: SlidePage;
  pageIndex: number;
  totalPages: number;
  onPageTypeChange: (type: string) => void;
  onNotesChange: (notes: string) => void;
  onTitleChange?: (value: string) => void;
  onContentChange?: (value: string) => void;
}


const FONT_SIZES = [
  { value: 24, label: '小' },
  { value: 32, label: '中' },
  { value: 48, label: '大' },
  { value: 64, label: '特大' },
];

const BG_COLORS = [
  { value: 'white', label: '白色', color: '#ffffff' },
  { value: 'gray-50', label: '浅灰', color: '#f9fafb' },
  { value: 'blue-50', label: '浅蓝', color: '#eff6ff' },
  { value: 'green-50', label: '浅绿', color: '#f0fdf4' },
  { value: 'yellow-50', label: '浅黄', color: '#fefce8' },
  { value: 'red-50', label: '浅红', color: '#fef2f2' },
  { value: 'purple-50', label: '浅紫', color: '#faf5ff' },
  { value: 'primary-gradient', label: '蓝色渐变', color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  { value: 'gray-gradient', label: '灰色渐变', color: 'linear-gradient(135deg, #6b7280, #374151)' },
];

const TEXT_COLORS = [
  { value: '#1f2937', label: '黑色' },
  { value: '#ffffff', label: '白色' },
  { value: '#2563eb', label: '蓝色' },
  { value: '#dc2626', label: '红色' },
  { value: '#16a34a', label: '绿色' },
  { value: '#9333ea', label: '紫色' },
  { value: '#d97706', label: '橙色' },
];

/** 折叠面板 */
const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs font-semibold text-gray-700 flex-1">{title}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  page,
  pageIndex,
  totalPages,
  onPageTypeChange,
  onNotesChange,
}) => {
  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* 页面设置 */}
      <CollapsibleSection
        title="页面设置"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        defaultOpen
      >
        <div className="space-y-3">
          {/* 幻灯片尺寸 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">幻灯片尺寸</label>
            <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">16:9 宽屏</div>
          </div>

          {/* 页码 */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>当前页</span>
            <span className="font-medium">{pageIndex + 1} / {totalPages}</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* 字体/颜色 */}
      <CollapsibleSection
        title="字体 / 颜色"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
      >
        <div className="space-y-3">
          {/* 文字颜色 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">文字颜色</label>
            <div className="flex gap-1.5 flex-wrap">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  className="w-6 h-6 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* 字体大小 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">标题字号</label>
            <div className="flex gap-1">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  className="flex-1 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          {/* 字体样式 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">字体样式</label>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-600 font-bold" title="加粗">B</button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-600 italic" title="斜体">I</button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-600 underline" title="下划线">U</button>
            </div>
          </div>

          {/* 对齐方式 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">对齐方式</label>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-600" title="左对齐">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" /></svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-600" title="居中">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-600" title="右对齐">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" /></svg>
              </button>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 背景设置 */}
      <CollapsibleSection
        title="背景设置"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        }
      >
        <div className="space-y-3">
          {/* 预设背景色 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">预设背景</label>
            <div className="grid grid-cols-5 gap-1.5">
              {BG_COLORS.map((bg) => (
                <button
                  key={bg.value}
                  className="w-full aspect-square rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform"
                  style={{ background: bg.color }}
                  title={bg.label}
                />
              ))}
            </div>
          </div>

          {/* 渐变背景 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">渐变背景</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                className="w-full aspect-video rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                title="蓝紫渐变"
              />
              <button
                className="w-full aspect-video rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
                title="绿蓝渐变"
              />
              <button
                className="w-full aspect-video rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                title="橙红渐变"
              />
              <button
                className="w-full aspect-video rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
                title="靛粉渐变"
              />
              <button
                className="w-full aspect-video rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)' }}
                title="青紫渐变"
              />
              <button
                className="w-full aspect-video rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #374151, #111827)' }}
                title="暗黑渐变"
              />
            </div>
          </div>

          {/* 自定义颜色 */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">自定义颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                defaultValue="#3b82f6"
              />
              <input
                type="text"
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 演讲备注 */}
      <CollapsibleSection
        title="演讲备注"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      >
        <textarea
          value={page.notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="在此添加演讲备注..."
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">备注不会显示在幻灯片中</p>
      </CollapsibleSection>
    </div>
  );
};

export default PropertyPanel;
