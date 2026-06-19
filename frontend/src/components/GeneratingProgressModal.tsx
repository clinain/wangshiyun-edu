import React, { useEffect, useRef, useState } from 'react';

interface GeneratingProgressModalProps {
  /** 是否显示 */
  visible: boolean;
  /** 标题 */
  title?: string;
  /** 当前阶段描述 */
  stage?: string;
  /** 进度百分比 (0-100)，如果不传则使用模拟进度 */
  progress?: number;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 取消回调 */
  onCancel?: () => void;
  /** 预估完成时间（秒） */
  estimatedTime?: number;
  /** 自定义提示信息 */
  tips?: string[];
}

const defaultTips = [
  'AI正在分析教学内容，请耐心等待...',
  '正在生成高质量的教学资源...',
  '内容即将完成，请勿关闭页面...',
];

const GeneratingProgressModal: React.FC<GeneratingProgressModalProps> = ({
  visible,
  title = 'AI智能生成中',
  stage,
  progress: externalProgress,
  showCancel = false,
  onCancel,
  estimatedTime = 120,
  tips = defaultTips,
}) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [pulseOpacity, setPulseOpacity] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const progress = externalProgress !== undefined ? externalProgress : internalProgress;

  useEffect(() => {
    if (!visible) {
      setInternalProgress(0);
      setElapsedTime(0);
      setCurrentTipIndex(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
      return;
    }

    // 模拟进度增长：前30秒快速增长到60%，之后缓慢增长到90%，最后等待完成
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      if (externalProgress === undefined) {
        let newProgress: number;
        if (elapsed < 10) {
          // 前10秒：0% -> 30%
          newProgress = (elapsed / 10) * 30;
        } else if (elapsed < 30) {
          // 10-30秒：30% -> 60%
          newProgress = 30 + ((elapsed - 10) / 20) * 30;
        } else if (elapsed < 60) {
          // 30-60秒：60% -> 80%
          newProgress = 60 + ((elapsed - 30) / 30) * 20;
        } else if (elapsed < estimatedTime) {
          // 60秒-预估时间：80% -> 95%
          newProgress = 80 + ((elapsed - 60) / (estimatedTime - 60)) * 15;
        } else {
          // 超过预估时间：95% -> 99%
          newProgress = 95 + Math.min(4, ((elapsed - estimatedTime) / 30) * 4);
        }
        setInternalProgress(Math.min(newProgress, 99));
      }
    }, 500);

    // 轮换提示信息
    tipIntervalRef.current = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 4000);

    // 脉冲动画
    const pulseInterval = setInterval(() => {
      setPulseOpacity(prev => (prev === 1 ? 0.5 : 1));
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
      clearInterval(pulseInterval);
    };
  }, [visible, externalProgress, estimatedTime, tips]);

  if (!visible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 遮罩层 - 防止用户操作 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* 模态框 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* 顶部渐变装饰 */}
        <div className="h-2 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
        
        <div className="p-6">
          {/* 标题区域 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              {/* 脉冲效果 */}
              <div 
                className="absolute inset-0 rounded-xl bg-primary-400 animate-ping"
                style={{ opacity: 0.3, animationDuration: '2s' }}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500">
                {stage || '请耐心等待，不要关闭页面'}
              </p>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">生成进度</span>
              <span className="text-sm font-bold text-primary-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
                }}
              >
                {/* 光泽效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div className="flex justify-between text-xs text-gray-500 mb-5">
            <span>已用时: {formatTime(elapsedTime)}</span>
            <span>预计还需: {formatTime(Math.max(0, estimatedTime - elapsedTime))}</span>
          </div>

          {/* 当前步骤 */}
          {stage && (
            <div className="bg-primary-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                <span className="text-sm text-primary-700 font-medium">{stage}</span>
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 mb-1">请勿关闭页面</p>
                <p className="text-xs text-amber-600" style={{ opacity: pulseOpacity, transition: 'opacity 0.5s' }}>
                  {tips[currentTipIndex]}
                </p>
              </div>
            </div>
          </div>

          {/* 取消按钮 */}
          {showCancel && onCancel && (
            <button
              onClick={onCancel}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              取消生成
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratingProgressModal;
