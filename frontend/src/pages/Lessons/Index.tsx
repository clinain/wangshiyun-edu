import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import { lessonAPI, pptAPI } from '@/api';
import type { Lesson, PPTRecord } from '@/types';

interface DocumentItem {
  id: number;
  type: 'lesson' | 'ppt';
  title: string;
  subject?: string;
  grade?: string;
  status: string;
  createdAt: string;
}

const MyLessons: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'lesson' | 'ppt'>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const [lessonsResult, pptResult] = await Promise.all([
        lessonAPI.list(),
        pptAPI.list(),
      ]);

      const lessonItems: DocumentItem[] = lessonsResult.lessons.map((lesson: Lesson) => ({
        id: lesson.id,
        type: 'lesson',
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
        status: lesson.status === 'draft' ? '草稿' : '已发布',
        createdAt: lesson.createdAt,
      }));

      const pptItems: DocumentItem[] = pptResult.ppts.map((ppt: PPTRecord) => ({
        id: ppt.id,
        type: 'ppt',
        title: ppt.title,
        status: ppt.status === 'pending' ? '生成中' : ppt.status === 'completed' ? '已完成' : '失败',
        createdAt: ppt.createdAt,
      }));

      const allDocuments = [...lessonItems, ...pptItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setDocuments(allDocuments);
    } catch (error) {
      console.error('获取文档列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === 'all') return true;
    return doc.type === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case '草稿':
        return 'bg-yellow-100 text-yellow-600';
      case '已发布':
        return 'bg-green-100 text-green-600';
      case '生成中':
        return 'bg-blue-100 text-blue-600';
      case '已完成':
        return 'bg-green-100 text-green-600';
      case '失败':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleDocumentClick = (doc: DocumentItem) => {
    console.log('点击文档:', doc.type, doc.id, doc.title);
    if (doc.type === 'lesson') {
      const url = `/lessons/create?edit=${doc.id}`;
      console.log('导航到:', url);
      navigate(url);
    } else {
      navigate(`/ppt/${doc.id}`);
    }
  };

  const getTabCount = (type: 'all' | 'lesson' | 'ppt') => {
    if (type === 'all') return documents.length;
    return documents.filter((doc) => doc.type === type).length;
  };

  return (
    <Layout
      title="文档管理"
      subtitle="查看和管理您创建的所有教案和PPT"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '资源中心', path: '/resources' },
        { label: '文档管理' }
      ]}
    >
      <div className="max-w-6xl mx-auto">
        {/* 操作栏 */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">文档管理</h2>
              <p className="text-sm text-gray-500">查看和管理您创建的所有教案和PPT</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Button onClick={() => navigate('/lessons/create')} className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                新建教案
              </Button>
              <Button variant="outline" onClick={() => navigate('/ppt')} className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                新建PPT
              </Button>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: '全部文档' },
            { key: 'lesson', label: '教案' },
            { key: 'ppt', label: 'PPT' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'all' | 'lesson' | 'ppt')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({getTabCount(tab.key as 'all' | 'lesson' | 'ppt')})
            </button>
          ))}
        </div>

        {/* 文档列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">暂无文档</h3>
            <p className="text-gray-500 mb-6">点击上方按钮创建您的第一个教案或PPT</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/lessons/create')}>创建教案</Button>
              <Button variant="outline" onClick={() => navigate('/ppt')}>创建PPT</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={`${doc.type}-${doc.id}`}
                onClick={() => handleDocumentClick(doc)}
                className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${
                      doc.type === 'lesson' ? 'bg-blue-100' : 'bg-orange-100'
                    }`}>
                      <span className={`text-lg md:text-xl font-bold ${
                        doc.type === 'lesson' ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {doc.type === 'lesson' ? 'W' : 'P'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate max-w-[200px] md:max-w-none">{doc.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1">
                        {doc.subject && (
                          <span className="text-xs md:text-sm text-gray-500">学科：{doc.subject}</span>
                        )}
                        {doc.grade && (
                          <span className="text-xs md:text-sm text-gray-500">年级：{doc.grade}</span>
                        )}
                        <span className="text-xs md:text-sm text-gray-400">
                          {new Date(doc.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyLessons;