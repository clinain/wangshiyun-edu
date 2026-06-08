import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import { lessonAPI } from '@/api';
import type { Lesson } from '@/types';

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(searchParams.get('readonly') === 'true');

  useEffect(() => {
    setIsReadOnly(searchParams.get('readonly') === 'true');
  }, [searchParams]);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const data = await lessonAPI.detail(parseInt(id || '0'));
        setLesson(data);
      } catch (error) {
        console.error('获取教案详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLesson();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!lesson) return;
    if (!confirm(`确定要删除教案"${lesson.title}"吗？此操作不可恢复。`)) return;

    setDeleting(true);
    try {
      await lessonAPI.delete(lesson.id);
      alert('删除成功');
      navigate('/lessons');
    } catch (error) {
      console.error('删除教案失败:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportWord = async () => {
    if (!lesson) return;
    try {
      const blob = await lessonAPI.export(lesson.id, 'docx');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lesson.title || '教案'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出Word失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleExportPdf = async () => {
    if (!lesson) return;
    try {
      const blob = await lessonAPI.export(lesson.id, 'pdf');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lesson.title || '教案'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    let date: Date;
    
    // 尝试直接解析
    date = new Date(dateString);
    
    // 如果解析失败，尝试手动解析 MySQL 格式 YYYY-MM-DD HH:mm:ss
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

  const parseArrayField = (field: string | string[]): string[] => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [field];
      }
    }
    return field;
  };

  if (loading) {
    return (
      <Layout 
        title="教案详情"
        breadcrumbs={[
          { label: '首页', path: '/' },
          { label: '我的备课', path: '/lessons' },
          { label: '教案编写', path: '/lessons/create' },
          { label: '教案详情' }
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  if (!lesson) {
    return (
      <Layout 
        title="教案详情"
        breadcrumbs={[
          { label: '首页', path: '/' },
          { label: '我的备课', path: '/lessons' },
          { label: '教案编写', path: '/lessons/create' },
          { label: '教案详情' }
        ]}
      >
        <div className="text-center py-12">
          <p className="text-gray-500">教案不存在或已被删除</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            返回
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="教案详情" 
      subtitle={lesson.title}
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '我的备课', path: '/lessons' },
        { label: '教案详情' }
      ]}
    >
      <div className="max-w-4xl mx-auto">
        {/* 操作按钮区域 */}
        <div className="flex justify-between items-center mb-4">
          <Button variant="secondary" onClick={() => isReadOnly ? navigate('/resources') : navigate(-1)}>
            {isReadOnly ? '返回资源中心' : '返回'}
          </Button>
          {!isReadOnly && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { window.location.href = `/lessons/create?edit=${lesson?.id}`; }}>
                编辑教案
              </Button>
              <Button variant="primary" onClick={() => navigate(`/lessons/${lesson.id}/sync`)}>
                同步编写
              </Button>
              <Button variant="outline" onClick={() => navigate('/ppt/generate?lessonId=' + lesson.id)}>
                生成PPT
              </Button>
              <Button variant="outline" onClick={handleExportWord}>
                📄 导出Word
              </Button>
              <Button variant="outline" onClick={handleExportPdf}>
                📕 导出PDF
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '删除中...' : '删除教案'}
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{lesson.title}</h1>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                {lesson.subject}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {lesson.grade}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
              <span>浏览量: {lesson.views}</span>
              <span>创建时间: {formatDate(lesson.createdAt)}</span>
              <span>更新时间: {formatDate(lesson.updatedAt)}</span>
            </div>
          </div>

          {lesson.teachingGoals && (
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                教学目标
              </h2>
              <ul className="space-y-2">
                {parseArrayField(lesson.teachingGoals).map((goal, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-600">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lesson.keyPoints && (
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                教学重点
              </h2>
              <ul className="space-y-2">
                {parseArrayField(lesson.keyPoints).map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success-100 text-success-600 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lesson.teachingProcess && (
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                教学过程
              </h2>
              <div className="prose prose-gray max-w-none">
                {typeof lesson.teachingProcess === 'object' ? (
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm">{JSON.stringify(lesson.teachingProcess, null, 2)}</pre>
                ) : (
                  <p className="text-gray-600 whitespace-pre-wrap">{lesson.teachingProcess}</p>
                )}
              </div>
            </div>
          )}

          {lesson.assignments && (
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                作业布置
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">{lesson.assignments}</p>
            </div>
          )}

          {lesson.summary && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                教学总结
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap">{lesson.summary}</p>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default LessonDetail;