import React, { useRef, useState } from 'react';

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onInsertImage: (file: File) => void;
  onInsertText: () => void;
  onInsertShape: (shape: string) => void;
  onZoomChange?: (zoom: number) => void;
  zoom?: number;
  onFormat?: (command: string, value?: string) => void;
}

/** 工具栏分隔线 */
const Divider = () => <div className="w-px h-5 bg-gray-300 mx-1" />;

/** 工具栏按钮 */
const ToolButton: React.FC<{
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, active, disabled, title, children, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-all ${
      active ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
  >
    {children}
  </button>
);

const PPTEditorToolbar: React.FC<ToolbarProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onInsertImage,
  onInsertText,
  onInsertShape,
  onZoomChange,
  zoom = 100,
  onFormat,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onInsertImage(file);
      e.target.value = '';
    }
  };

  const execFormat = (command: string, value?: string) => {
    // 使用 execCommand 对当前聚焦的 contentEditable 元素执行格式化
    document.execCommand(command, false, value);
    // 更新活跃格式状态
    updateActiveFormats();
    // 通知父组件
    onFormat?.(command, value);
  };

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    setActiveFormats(formats);
  };

  const shapes = [
    { id: 'rect', label: '矩形', icon: '▬' },
    { id: 'circle', label: '圆形', icon: '●' },
    { id: 'triangle', label: '三角形', icon: '▲' },
    { id: 'arrow', label: '箭头', icon: '→' },
    { id: 'line', label: '线条', icon: '─' },
    { id: 'star', label: '星形', icon: '★' },
  ];

  const fontSizes = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64'];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 bg-white border-b border-gray-200 overflow-x-auto flex-shrink-0">
      {/* 撤销/重做 */}
      <ToolButton onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
        </svg>
      </ToolButton>
      <ToolButton onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Y)">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
        </svg>
      </ToolButton>

      <Divider />

      {/* 插入操作 */}
      <ToolButton onClick={onInsertText} title="插入文本框">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </ToolButton>
      <ToolButton onClick={() => fileInputRef.current?.click()} title="插入图片">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </ToolButton>
      <div className="relative">
        <ToolButton
          onClick={() => setShowShapeMenu(!showShapeMenu)}
          title="插入形状"
          active={showShapeMenu}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
          </svg>
        </ToolButton>
        {showShapeMenu && (
          <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-3 gap-1 w-36">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => { onInsertShape(shape.id); setShowShapeMenu(false); }}
                className="flex flex-col items-center gap-0.5 p-2 rounded hover:bg-gray-100 text-gray-600"
              >
                <span className="text-lg">{shape.icon}</span>
                <span className="text-[10px]">{shape.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* 文字格式 - 连接到 execCommand */}
      <ToolButton
        onClick={() => execFormat('bold')}
        active={activeFormats.has('bold')}
        title="加粗 (Ctrl+B)"
      >
        <span className="font-bold">B</span>
      </ToolButton>
      <ToolButton
        onClick={() => execFormat('italic')}
        active={activeFormats.has('italic')}
        title="斜体 (Ctrl+I)"
      >
        <span className="italic">I</span>
      </ToolButton>
      <ToolButton
        onClick={() => execFormat('underline')}
        active={activeFormats.has('underline')}
        title="下划线 (Ctrl+U)"
      >
        <span className="underline">U</span>
      </ToolButton>

      <Divider />

      {/* 字号 */}
      <select
        className="h-7 px-1 text-xs border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
        defaultValue="14"
        onChange={(e) => execFormat('fontSize', e.target.value)}
        title="字号"
      >
        {fontSizes.map(size => (
          <option key={size} value={size}>{size}px</option>
        ))}
      </select>

      <Divider />

      {/* 文字颜色 */}
      <div className="relative">
        <ToolButton title="文字颜色">
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm">A</span>
            <div className="w-4 h-1 bg-red-500 rounded-sm" />
          </div>
        </ToolButton>
        <input
          type="color"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => execFormat('foreColor', e.target.value)}
          title="选择文字颜色"
        />
      </div>

      {/* 背景颜色 */}
      <div className="relative">
        <ToolButton title="背景颜色">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 border border-gray-400 rounded-sm bg-yellow-200" />
          </div>
        </ToolButton>
        <input
          type="color"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => execFormat('hiliteColor', e.target.value)}
          title="选择背景颜色"
        />
      </div>

      <Divider />

      {/* 对齐方式 */}
      <ToolButton onClick={() => execFormat('justifyLeft')} title="左对齐">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
        </svg>
      </ToolButton>
      <ToolButton onClick={() => execFormat('justifyCenter')} title="居中对齐">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
        </svg>
      </ToolButton>
      <ToolButton onClick={() => execFormat('justifyRight')} title="右对齐">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
        </svg>
      </ToolButton>

      <Divider />

      {/* 缩放 */}
      <div className="flex items-center gap-1">
        <ToolButton
          onClick={() => onZoomChange?.(Math.max(25, zoom - 25))}
          title="缩小"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </ToolButton>
        <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
        <ToolButton
          onClick={() => onZoomChange?.(Math.min(200, zoom + 25))}
          title="放大"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </ToolButton>
      </div>

      {/* 隐藏的文件上传输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default PPTEditorToolbar;
