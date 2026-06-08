import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import { portfolioAPI } from '@/api';

interface LessonInfo {
  id: number;
  title: string;
  subject: string;
  grade: string;
  status: string;
}

interface PPTInfo {
  id: number;
  title: string;
  pageCount: number;
}

interface PortfolioDetail {
  id: number;
  name: string;
  description: string;
  userId: number;
  isPublic: boolean;
  lessonIds: number[];
  pptIds: number[];
  lessons: LessonInfo[];
  pptList: PPTInfo[];
  viewCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

const PortfolioView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const parsedId = parseInt(id);
      if (!isNaN(parsedId) && parsedId > 0) {
        fetchPortfolioDetail(parsedId);
      } else {
        setError('无效的作品集ID');
        setLoading(false);
      }
    }
  }, [id]);

  const fetchPortfolioDetail = async (portfolioId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await portfolioAPI.detail(portfolioId);
      setPortfolio(response);
    } catch (err) {
      setError((err as Error).message || '获取作品集详情失败');
      console.error('获取作品集详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    let date: Date;
    date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      const mysqlMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (mysqlMatch) {
        date = new Date(
          parseInt(mysqlMatch[1]),
          parseInt(mysqlMatch[2]) - 1,
          parseInt(mysqlMatch[3]),
          parseInt(mysqlMatch[4]),
          parseInt(mysqlMatch[5]),
          parseInt(mysqlMatch[6])
        );
      } else {
        return dateString;
      }
    }
    
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewLesson = (lessonId: number) => {
    navigate(`/lessons/${lessonId}?readonly=true`);
  };

  const handleViewPPT = (pptId: number) => {
    navigate(`/ppt/${pptId}?readonly=true`);
  };

  if (loading) {
    return (
      <Layout title="作品集详情">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="作品集详情">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 text-danger-600">
          {error}
        </div>
      </Layout>
    );
  }

  if (!portfolio) {
    return (
      <Layout title="作品集详情">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-600">
          作品集不存在
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="作品集详情" subtitle={portfolio.name}>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/resources')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回资源中心
          </button>
        </div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{portfolio.name}</h2>
            {portfolio.description && (
              <p className="text-gray-600 mb-3">{portfolio.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                </svg>
                {portfolio.viewCount || 0} 次浏览
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.634a3 3 0 110-2.634m0 2.634l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {portfolio.shareCount || 0} 次分享
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(portfolio.createdAt)}
              </span>
            </div>
          </div>
          {portfolio.isPublic && (
            <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
              公开
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">教案列表</h3>
            <span className="text-sm text-gray-500">{portfolio.lessons?.length || 0} 个教案</span>
          </div>
          
          {portfolio.lessons && portfolio.lessons.length > 0 ? (
            <div className="space-y-3">
              {portfolio.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => handleViewLesson(lesson.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-1">{lesson.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          {lesson.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {lesson.grade}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          lesson.status === '已完成' ? 'bg-success-100 text-success-700' :
                          lesson.status === '进行中' ? 'bg-warning-100 text-warning-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {lesson.status}
                        </span>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>暂无教案</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">PPT列表</h3>
            <span className="text-sm text-gray-500">{portfolio.pptList?.length || 0} 个PPT</span>
          </div>
          
          {portfolio.pptList && portfolio.pptList.length > 0 ? (
            <div className="space-y-3">
              {portfolio.pptList.map((ppt) => (
                <div
                  key={ppt.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => handleViewPPT(ppt.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-1">{ppt.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {ppt.pageCount || 0} 页
                        </span>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <p>暂无PPT</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioView;