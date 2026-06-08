import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { lessonAPI } from '@/api';
import type { Lesson } from '@/types';

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

const EditLesson: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 直接跳转到 Create 页面的编辑模式，使用完整的学段匹配逻辑
  useEffect(() => {
    if (id) {
      navigate(`/lessons/create?edit=${id}`, { replace: true });
    }
  }, [id, navigate]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const data = await lessonAPI.detail(parseInt(id || '0'));
        setLesson(data);
      } catch (error) {
        console.error('获取教案失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLesson();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!lesson) return;

    if (!lesson.title || !lesson.subject || !lesson.grade) {
      setError('请填写必填字段（标题、学科、年级）');
      return;
    }

    setLoading(true);
    try {
      const data: Record<string, unknown> = {
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
      };
      
      if (lesson.teachingGoals) {
        data.teachingGoals = Array.isArray(lesson.teachingGoals) 
          ? JSON.stringify(lesson.teachingGoals) 
          : lesson.teachingGoals;
      }
      
      if (lesson.keyPoints) {
        data.keyPoints = Array.isArray(lesson.keyPoints) 
          ? JSON.stringify(lesson.keyPoints) 
          : lesson.keyPoints;
      }
      
      if (lesson.teachingProcess) {
        data.teachingProcess = lesson.teachingProcess;
      }
      
      if (lesson.assignments) {
        data.assignments = lesson.assignments;
      }
      
      if (lesson.summary) {
        data.summary = lesson.summary;
      }

      await lessonAPI.update(parseInt(id || '0'), data);
      navigate(`/lessons/${id}`);
    } catch (err) {
      setError((err as Error).message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout 
        title="编辑教案"
        breadcrumbs={[
          { label: '首页', path: '/' },
          { label: '我的备课', path: '/lessons' },
          { label: '教案编写', path: '/lessons/create' },
          { label: '编辑教案' }
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
        title="编辑教案"
        breadcrumbs={[
          { label: '首页', path: '/' },
          { label: '我的备课', path: '/lessons' },
          { label: '教案编写', path: '/lessons/create' },
          { label: '编辑教案' }
        ]}
      >
        <div className="text-center py-12">
          <p className="text-gray-500">教案不存在或已被删除</p>
          <Button onClick={() => navigate('/lessons')} className="mt-4">
            返回列表
          </Button>
        </div>
      </Layout>
    );
  }

  const handleChange = (field: string, value: string) => {
    setLesson((prev) => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <Layout title="编辑教案" subtitle={lesson.title}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="教案标题 *"
                  placeholder="请输入教案标题"
                  value={lesson.title}
                  onChange={(v) => handleChange('title', v)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学科 *</label>
                <select
                  value={lesson.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {lesson.subject && !subjects.includes(lesson.subject) && (
                    <option key={lesson.subject} value={lesson.subject}>{lesson.subject}</option>
                  )}
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年级 *</label>
              <select
                value={lesson.grade}
                onChange={(e) => handleChange('grade', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {lesson.grade && !grades.includes(lesson.grade) && (
                  <option key={lesson.grade} value={lesson.grade}>{lesson.grade}</option>
                )}
                {grades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教学目标</label>
              <textarea
                value={Array.isArray(lesson.teachingGoals) ? lesson.teachingGoals.join('\n') : (lesson.teachingGoals || '')}
                onChange={(e) => handleChange('teachingGoals', e.target.value)}
                placeholder="请输入教学目标，每行一个目标"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教学重点</label>
              <textarea
                value={Array.isArray(lesson.keyPoints) ? lesson.keyPoints.join('\n') : (lesson.keyPoints || '')}
                onChange={(e) => handleChange('keyPoints', e.target.value)}
                placeholder="请输入教学重点，每行一个重点"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教学过程</label>
              <textarea
                value={typeof lesson.teachingProcess === 'object' 
                  ? JSON.stringify(lesson.teachingProcess, null, 2) 
                  : (lesson.teachingProcess || '')}
                onChange={(e) => handleChange('teachingProcess', e.target.value)}
                placeholder="请详细描述教学过程"
                rows={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作业布置</label>
              <textarea
                value={lesson.assignments || ''}
                onChange={(e) => handleChange('assignments', e.target.value)}
                placeholder="请输入作业布置内容"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教学总结</label>
              <textarea
                value={lesson.summary || ''}
                onChange={(e) => handleChange('summary', e.target.value)}
                placeholder="请输入教学总结"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" size="lg" loading={loading} className="flex-1">
                保存修改
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate(`/lessons/${lesson.id}`)}>
                取消
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditLesson;