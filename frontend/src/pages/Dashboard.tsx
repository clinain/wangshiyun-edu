import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: (
        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      ),
      title: 'AI生成教案',
      description: '输入课题，AI帮你搞定教学目标和教学过程',
    },
    {
      icon: (
        <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      ),
      title: '一键生成PPT',
      description: '教案写完，PPT自动生成，无需重复排版',
    },
    {
      icon: (
        <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      ),
      title: '教案与PPT双向同步',
      description: '改教案，PPT跟着变；改PPT，教案同步更新',
    },
    {
      icon: (
        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      title: '新课标对照检查',
      description: '自动对照最新课标，教案合规有保障',
    },
    {
      icon: (
        <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      ),
      title: '一键生成作品集',
      description: '历史备课自动汇总，求职面试直接打包',
    },
  ];

  return (
    <Layout title="首页" subtitle="">
      <div className="min-h-[calc(100vh-100px)] md:min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4 md:p-8">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-text-dark mb-2 md:mb-4" style={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif', letterSpacing: '0.08em' }}>
            🎓 欢迎来到网师云
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-primary-dark" style={{ fontWeight: 300, letterSpacing: '0.05em' }}>
            师范生专属 · 教案PPT一体化备课工具
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-8 md:mb-12 w-full max-w-6xl">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-border-pink shadow-md text-center cursor-default"
            >
              <div className="mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-text-dark mb-2" style={{ letterSpacing: '0.02em' }}>
                {feature.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center w-full px-4">
          <button
            onClick={() => navigate('/teaching-preparation')}
            className="w-full sm:w-auto px-8 md:px-12 py-3 md:py-4 bg-primary-300 text-white rounded-full font-semibold text-base md:text-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:bg-primary-400"
            style={{ letterSpacing: '0.05em' }}
          >
            立即开始你的第一次备课吧！
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
