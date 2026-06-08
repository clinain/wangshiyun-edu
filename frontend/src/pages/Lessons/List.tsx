import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import { lessonAPI } from '@/api';
import type { Lesson } from '@/types';

const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];

const LessonList: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchLessons();
  }, [page, keyword, subject, status]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const result = await lessonAPI.list({
        page,
        pageSize,
        keyword: keyword || undefined,
        subject: subject || undefined,
        status: status || undefined,
      }).catch(() => ({ lessons: [], pagination: { total: 0 } }));
      setLessons(result.lessons || []);
      setTotal(result.pagination?.total || 0);
    } catch (error) {
      console.error('获取教案列表失败:', error);
      setLessons([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个教案吗？')) return;
    try {
      await lessonAPI.delete(id);
      fetchLessons();
    } catch (error) {
      alert('删除失败');
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout 
      title="教案管理" 
      subtitle="管理您的教学教案"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '我的备课', path: '/lessons' },
        { label: '教案编写', path: '/lessons/create' },
        { label: '教案列表' }
      ]}
    >
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索教案标题..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {subjects.map((s) => (
              <option key={s} value={s === '全部' ? '' : s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/lessons/create')}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建教案
            </Button>
            <Button variant="outline" onClick={() => navigate('/lessons/generate')}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI生成
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-border-pink">
        <table className="w-full">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">标题</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">学科/年级</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">浏览量</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-pink">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </td>
              </tr>
            ) : lessons.length > 0 ? (
              lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      <button onClick={() => navigate(`/lessons/${lesson.id}`)} className="hover:text-primary-600">
                        {lesson.title}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lesson.subject} / {lesson.grade || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lesson.status === 'published'
                        ? 'bg-success-100 text-success-600'
                        : 'bg-warning-100 text-warning-600'
                    }`}>
                      {lesson.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lesson.views}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(lesson.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { console.log('编辑教案 lesson.id:', lesson.id); navigate(`/lessons/create?edit=${lesson.id}`); }}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="p-2 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>暂无教案</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!loading && total > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              显示第 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => page > 1 && setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{page}</span>
              <button
                onClick={() => page < Math.ceil(total / pageSize) && setPage(page + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LessonList;