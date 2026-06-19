import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Monitor, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout/Layout';

interface CardItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  buttonPath: string;
  colorClasses: {
    iconBg: string;
    buttonBg: string;
    buttonHover: string;
    hoverBorder: string;
  };
}

const TeachingPreparation: React.FC = () => {
  const navigate = useNavigate();

  const cards: CardItem[] = [
    {
      icon: <BookOpen className="w-8 h-8 text-white" />,
      title: '教案编辑',
      description:
        '支持小学、初中、高中全学段教案编写，提供 AI 智能辅助生成教案内容，可查询新课标课程标准，支持教案导出为 Word/PDF 格式。',
      buttonText: '进入',
      buttonPath: '/lessons/create',
      colorClasses: {
        iconBg: 'from-blue-400 to-blue-600',
        buttonBg: 'bg-blue-500',
        buttonHover: 'hover:bg-blue-600',
        hoverBorder: 'hover:border-blue-300',
      },
    },
    {
      icon: <Monitor className="w-8 h-8 text-white" />,
      title: 'PPT设计',
      description:
        '可视化 PPT 在线编辑器，支持多种幻灯片模板和布局，可从教案内容自动生成 PPT，支持图片、文字、图表等多媒体元素编辑。',
      buttonText: '进入',
      buttonPath: '/ppt',
      colorClasses: {
        iconBg: 'from-green-400 to-green-600',
        buttonBg: 'bg-green-500',
        buttonHover: 'hover:bg-green-600',
        hoverBorder: 'hover:border-green-300',
      },
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-white" />,
      title: '同步设计',
      description:
        '教案与 PPT 联动编辑，左侧编写教案右侧实时预览 PPT 效果，修改教案内容自动同步更新 PPT，实现教学内容一体化设计。',
      buttonText: '进入',
      buttonPath: '/lessons/sync',
      colorClasses: {
        iconBg: 'from-purple-400 to-purple-600',
        buttonBg: 'bg-purple-500',
        buttonHover: 'hover:bg-purple-600',
        hoverBorder: 'hover:border-purple-300',
      },
    },
  ];

  return (
    <Layout title="我的备课" subtitle="">
      <div className="min-h-[calc(100vh-100px)] md:min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4 md:p-8">
        {/* 页面标题区域 */}
        <div className="text-center mb-8 md:mb-12">
          <h1
            className="text-2xl sm:text-3xl md:text-5xl font-bold text-text-dark mb-2 md:mb-4"
            style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif', letterSpacing: '0.08em' }}
          >
            📚 我的备课
          </h1>
          <p
            className="text-sm sm:text-lg md:text-xl text-primary-dark"
            style={{ fontWeight: 300, letterSpacing: '0.05em' }}
          >
            选择您需要的教学工具
          </p>
        </div>

        {/* 功能卡片区域 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12 w-full max-w-5xl">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-6 md:p-8 border border-border-pink shadow-md flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${card.colorClasses.hoverBorder}`}
            >
              {/* 图标 */}
              <div
                className={`w-16 h-16 bg-gradient-to-br ${card.colorClasses.iconBg} rounded-xl flex items-center justify-center shadow-md mb-5`}
              >
                {card.icon}
              </div>

              {/* 标题 */}
              <h3
                className="text-xl font-semibold text-text-dark mb-3"
                style={{ letterSpacing: '0.02em' }}
              >
                {card.title}
              </h3>

              {/* 介绍文字 */}
              <p className="text-sm text-text-muted leading-relaxed mb-6 flex-1">
                {card.description}
              </p>

              {/* 进入按钮 */}
              <button
                onClick={() => navigate(card.buttonPath)}
                className={`px-8 py-2.5 ${card.colorClasses.buttonBg} text-white rounded-full font-semibold text-sm shadow-md transition-all duration-300 ${card.colorClasses.buttonHover} hover:shadow-lg hover:-translate-y-0.5`}
                style={{ letterSpacing: '0.05em' }}
              >
                {card.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default TeachingPreparation;
