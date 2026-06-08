import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import PPTPreview from '@/components/PPTPreview';
import PPTModalPreview from '@/components/PPTModalPreview';
import { lessonAPI, pptAPI } from '@/api';
import type { Lesson, PPTRecord, PPTPage } from '@/types';

const primarySubjects = ['语文', '数学', '英语', '道德与法治', '科学', '信息科技', '音乐', '美术', '体育与健康', '劳动', '书法', '综合实践活动', '心理健康'];
const middleSubjects = ['语文', '数学', '英语', '道德与法治', '历史', '地理', '物理', '化学', '生物学', '信息技术', '音乐', '美术', '体育与健康', '劳动', '心理健康', '综合实践活动'];
const highSubjects = ['语文', '数学', '英语', '物理', '化学', '生物学', '历史', '地理', '思想政治', '通用技术', '信息技术', '音乐', '美术', '体育与健康', '劳动', '心理健康', '综合实践活动'];

const primaryGrades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const middleGrades = ['七年级', '八年级', '九年级'];
const highGrades = ['高一', '高二', '高三'];

const SyncEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const [pptRecord, setPptRecord] = useState<PPTRecord | null>(null);
  const [pptPages, setPptPages] = useState<PPTPage[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [stage, setStage] = useState<'primary' | 'middle' | 'high' | ''>('');
  const [filteredSubjects, setFilteredSubjects] = useState<string[]>([]);
  const [filteredGrades, setFilteredGrades] = useState<string[]>([]);

  // 根据学段筛选学科和年级
  useEffect(() => {
    if (stage === 'primary') {
      setFilteredSubjects(primarySubjects);
      setFilteredGrades(primaryGrades);
    } else if (stage === 'middle') {
      setFilteredSubjects(middleSubjects);
      setFilteredGrades(middleGrades);
    } else if (stage === 'high') {
      setFilteredSubjects(highSubjects);
      setFilteredGrades(highGrades);
    } else {
      const all = [...new Set([...primarySubjects, ...middleSubjects, ...highSubjects])];
      setFilteredSubjects(all);
      setFilteredGrades([...primaryGrades, ...middleGrades, ...highGrades]);
    }
  }, [stage]);

  // 根据年级自动检测学段
  const detectStage = (grade: string) => {
    if (primaryGrades.includes(grade)) return 'primary';
    if (middleGrades.includes(grade)) return 'middle';
    if (highGrades.includes(grade)) return 'high';
    return '';
  };

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);

  const lessonIdFromQuery = searchParams.get('lessonId');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (id && id !== 'sync') {
          await fetchLessonData(parseInt(id));
        } else if (lessonIdFromQuery) {
          await fetchLessonData(parseInt(lessonIdFromQuery));
        } else {
          await fetchLessonsList();
        }
      } catch (err) {
        console.error('初始化失败:', err);
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, lessonIdFromQuery]);

  const fetchLessonsList = async () => {
    try {
      const result = await lessonAPI.list({ pageSize: 100 });
      setLessons(result.lessons || []);
    } catch (err) {
      console.error('获取教案列表失败:', err);
    }
  };

  const fetchLessonData = async (lessonId: number) => {
    const lessonData = await lessonAPI.detail(lessonId);
    setLesson(lessonData);

    // 根据年级自动检测学段
    if (lessonData.grade) {
      setStage(detectStage(lessonData.grade));
    }

    if (lessonData.id) {
      try {
        const pptListData = await pptAPI.list({ pageSize: 100 });
        const existingPpt = pptListData.ppts.find(p => p.lessonId === lessonData.id);
        if (existingPpt) {
          const pptDetail = await pptAPI.detail(existingPpt.id);
          if (pptDetail.content?.pages) {
            setPptRecord(pptDetail);
            setPptPages(pptDetail.content.pages);
          }
        }
      } catch (e) {
        console.log('未找到关联的PPT');
      }
    }
  };

  const handleSelectLesson = (selectedLesson: Lesson) => {
    navigate(`/lessons/${selectedLesson.id}/sync`);
  };

  const handleFieldChange = useCallback((field: string, value: string) => {
    if (!lesson) return;

    setLesson(prev => prev ? { ...prev, [field]: value } : null);
    hasChangesRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (hasChangesRef.current) {
        console.log('防抖触发，自动保存...');
        handleSave(true);
      }
    }, 3000);
  }, [lesson]);

  const handleSave = async (isAutoSave = false) => {
    if (!lesson) return;

    setSaving(true);
    setError('');

    try {
      const data: Record<string, unknown> = {
        title: lesson.title,
        subject: lesson.subject,
        grade: lesson.grade,
        teachingGoals: typeof lesson.teachingGoals === 'string'
          ? lesson.teachingGoals
          : JSON.stringify(lesson.teachingGoals),
        keyPoints: typeof lesson.keyPoints === 'string'
          ? lesson.keyPoints
          : JSON.stringify(lesson.keyPoints),
        teachingProcess: typeof lesson.teachingProcess === 'string'
          ? lesson.teachingProcess
          : JSON.stringify(lesson.teachingProcess),
        assignments: lesson.assignments || '',
        summary: lesson.summary || '',
      };

      await lessonAPI.update(lesson.id, data);
      hasChangesRef.current = false;

      if (!isAutoSave) {
        console.log('教案已保存');
      }
    } catch (err) {
      console.error('保存失败:', err);
      if (!isAutoSave) {
        setError((err as Error).message || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSyncGenerate = async () => {
    if (!lesson) return;

    setSyncing(true);
    setError('');

    try {
      await handleSave(true);

      const pptData = await pptAPI.sync(lesson.id);
      setPptRecord(pptData);

      if (pptData.content?.pages) {
        setPptPages(pptData.content.pages);
      }
    } catch (err) {
      console.error('同步生成失败:', err);
      setError((err as Error).message || '同步生成失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveAndSync = async () => {
    await handleSave(false);
    await handleSyncGenerate();
  };

  const handlePreview = () => {
    if (pptPages.length > 0) {
      setPreviewOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <Layout 
        title="同步设计"
        breadcrumbs={[
          { label: '首页', path: '/' },
          { label: '我的备课', path: '/lessons' },
          { label: '同步设计' }
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
        title="同步设计" 
        subtitle="选择教案"
        breadcrumbs={[
          { label: '首页', path: '/' },
          { label: '我的备课', path: '/lessons' },
          { label: '同步设计' }
        ]}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">选择要编辑的教案</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {lessons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessons.map(l => (
                  <div
                    key={l.id}
                    onClick={() => handleSelectLesson(l)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors"
                  >
                    <h3 className="font-medium text-gray-800 mb-2">{l.title}</h3>
                    <div className="flex gap-2 text-sm text-gray-500">
                      <span>{l.subject}</span>
                      <span>·</span>
                      <span>{l.grade}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      创建于 {new Date(l.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>暂无教案，请先创建教案</p>
                <Button onClick={() => navigate('/lessons/create')} className="mt-4">
                  创建教案
                </Button>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="同步设计"
      subtitle={lesson.title}
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '我的备课', path: '/lessons' },
        { label: '同步设计' }
      ]}
    >
      <div className="mb-4">
        <Button variant="secondary" onClick={() => navigate('/lessons/sync')}>
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Button>
      </div>
      <div className="flex gap-6 h-[calc(100vh-180px)]">
        <div className="w-1/2 bg-white rounded-xl shadow-sm p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">教案编辑</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveAndSync}
                loading={saving || syncing}
              >
                保存并同步
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                教案标题 *
              </label>
              <input
                type="text"
                value={lesson.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入教案标题"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学段 *
                </label>
                <select
                  value={stage}
                  onChange={(e) => {
                    const val = e.target.value as 'primary' | 'middle' | 'high' | '';
                    setStage(val);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择学段</option>
                  <option value="primary">小学</option>
                  <option value="middle">初中</option>
                  <option value="high">高中</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学科 *
                </label>
                <select
                  value={lesson.subject || ''}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择学科</option>
                  {filteredSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年级 *
                </label>
                <select
                  value={lesson.grade || ''}
                  onChange={(e) => handleFieldChange('grade', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择年级</option>
                  {filteredGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                教学目标
              </label>
              <textarea
                value={Array.isArray(lesson.teachingGoals) 
                  ? lesson.teachingGoals.join('\n') 
                  : (typeof lesson.teachingGoals === 'string' ? lesson.teachingGoals : '')}
                onChange={(e) => handleFieldChange('teachingGoals', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入教学目标（每行一条）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                教学重难点
              </label>
              <textarea
                value={Array.isArray(lesson.keyPoints) 
                  ? lesson.keyPoints.join('\n') 
                  : (typeof lesson.keyPoints === 'string' ? lesson.keyPoints : '')}
                onChange={(e) => handleFieldChange('keyPoints', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入教学重难点"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                教学过程
              </label>
              <textarea
                value={typeof lesson.teachingProcess === 'object' && lesson.teachingProcess !== null
                  ? JSON.stringify(lesson.teachingProcess, null, 2)
                  : (typeof lesson.teachingProcess === 'string' ? lesson.teachingProcess : '')}
                onChange={(e) => handleFieldChange('teachingProcess', e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入教学过程"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                课后作业
              </label>
              <textarea
                value={lesson.assignments || ''}
                onChange={(e) => handleFieldChange('assignments', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入课后作业"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                教学总结
              </label>
              <textarea
                value={lesson.summary || ''}
                onChange={(e) => handleFieldChange('summary', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入教学总结"
              />
            </div>
          </div>
        </div>

        <div className="w-1/2 bg-white rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">PPT预览</h2>
          </div>

          <div className="flex-1 bg-gray-100 rounded-lg p-4 overflow-y-auto">
            {pptPages.length > 0 ? (
              <PPTPreview pages={pptPages} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <svg className="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-center">
                  保存并同步后<br />
                  教案内容将转换为PPT
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PPTModalPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        pages={pptPages}
        title={lesson.title || 'PPT预览'}
      />
    </Layout>
  );
};

export default SyncEdit;