import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import PPTPreview from '@/components/PPTPreview';
import PPTModalPreview from '@/components/PPTModalPreview';
import GeneratingProgressModal from '@/components/GeneratingProgressModal';
import { lessonAPI, pptAPI } from '@/api';
import type { Lesson, PPTRecord, PPTPage } from '@/types';
import { teachingGoalsToText, textToTeachingGoals } from '@/utils/teachingGoalsHelper';

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
  const location = useLocation();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [teachingGoalsText, setTeachingGoalsText] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingStage, setSyncingStage] = useState('');
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
  const latestLessonRef = useRef<Lesson | null>(null);
  const teachingGoalsTextRef = useRef('');

  const lessonIdFromQuery = searchParams.get('lessonId');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLesson(null);
      setTeachingGoalsText('');
      setPptRecord(null);
      setPptPages([]);
      setError('');
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
  }, [id, lessonIdFromQuery, location.pathname]);

  const fetchLessonsList = async () => {
    try {
      setCurrentPage(1);
      const result = await lessonAPI.list({ pageSize: 100 });
      setLessons(result.lessons || []);
    } catch (err) {
      console.error('获取教案列表失败:', err);
    }
  };

  const fetchLessonData = async (lessonId: number) => {
    const lessonData = await lessonAPI.detail(lessonId);
    latestLessonRef.current = lessonData;
    setLesson(lessonData);
    teachingGoalsTextRef.current = teachingGoalsToText(lessonData.teachingGoals);
    setTeachingGoalsText(teachingGoalsToText(lessonData.teachingGoals));

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
      } catch (_e) {
        // 未找到关联的PPT，忽略
      }
    }
  };

  const handleSelectLesson = (selectedLesson: Lesson) => {
    navigate(`/lessons/${selectedLesson.id}/sync`);
  };

  const handleFieldChange = useCallback((field: string, value: string) => {
    if (!lesson) return;

    if (field === 'teachingGoals') {
      teachingGoalsTextRef.current = value;
      setTeachingGoalsText(value);
    } else {
      setLesson(prev => {
        if (!prev) return null;
        const next = { ...prev, [field]: value };
        latestLessonRef.current = next;
        return next;
      });
    }
    hasChangesRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (hasChangesRef.current) {
        handleSave(true);
      }
    }, 3000);
  }, [lesson]);

  const handleSave = async (isAutoSave = false) => {
    const currentLesson = latestLessonRef.current || lesson;
    if (!currentLesson) return;

    setSaving(true);
    setError('');

    try {
      const data: Record<string, unknown> = {
        title: currentLesson.title,
        subject: currentLesson.subject,
        grade: currentLesson.grade,
        teachingGoals: JSON.stringify(textToTeachingGoals(teachingGoalsTextRef.current)),
        keyPoints: typeof currentLesson.keyPoints === 'string'
          ? currentLesson.keyPoints
          : JSON.stringify(currentLesson.keyPoints),
        teachingProcess: typeof currentLesson.teachingProcess === 'string'
          ? currentLesson.teachingProcess
          : JSON.stringify(currentLesson.teachingProcess),
        assignments: currentLesson.assignments || '',
        summary: currentLesson.summary || '',
      };

      await lessonAPI.update(currentLesson.id, data);
      hasChangesRef.current = false;

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
    setSyncingStage('正在保存教案内容...');
    setError('');

    try {
      await handleSave(true);

      setSyncingStage('正在分析教案结构...');
      
      // 模拟阶段更新
      const stageTimer1 = setTimeout(() => setSyncingStage('正在同步教案内容到PPT...'), 3000);
      const stageTimer2 = setTimeout(() => setSyncingStage('正在设计PPT页面布局...'), 8000);
      const stageTimer3 = setTimeout(() => setSyncingStage('正在生成精美课件...'), 15000);
      const stageTimer4 = setTimeout(() => setSyncingStage('即将完成，请耐心等待...'), 25000);
      
      const pptData = await pptAPI.sync(lesson.id);
      
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);
      
      setPptRecord(pptData);

      // 简化验证逻辑：只要content存在就尝试获取pages
      if (pptData.content) {
        const pages = pptData.content.pages || [];
        
        if (pages.length > 0) {
          setPptPages(pages);
        } else {
          setError('生成的PPT页数为0');
        }
      } else {
        setError('PPT内容不存在');
      }
    } catch (err) {
      console.error('同步生成失败:', err);
      setError((err as Error).message || '同步生成失败');
    } finally {
      setSyncing(false);
      setSyncingStage('');
    }
  };

  const handleSaveAndSync = async () => {
    await handleSave(false);
    await handleSyncGenerate();
  };

  const handleSaveAll = async () => {
    if (!lesson) return;

    setSaving(true);
    setError('');

    try {
      // 保存教案
      await handleSave(false);

      // 如果有PPT记录，保存PPT
      if (pptRecord && pptRecord.id) {
        const response = await pptAPI.update(pptRecord.id, { title: pptRecord.title });
        setPptRecord(response);
      }

      alert('教案和PPT已保存成功！');
    } catch (err) {
      console.error('保存失败:', err);
      setError((err as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
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
          { label: '我的备课', path: '/teaching-preparation' },
          { label: '同步设计' }
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  // 分页计算
  const totalPages = Math.max(1, Math.ceil(lessons.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLessons = lessons.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  if (!lesson) {
    return (
      <Layout
        title="同步设计"
        subtitle="选择教案"
        breadcrumbs={[
          { label: '首页', path: '/' },
          { label: '我的备课', path: '/teaching-preparation' },
          { label: '同步设计' }
        ]}
      >
        <div className="mb-4">
          <Button variant="secondary" onClick={() => navigate('/teaching-preparation', { replace: true })}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Button>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">选择要编辑的教案</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {lessons.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedLessons.map(l => (
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

                {/* 分页控件 - 始终显示 */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    共 {lessons.length} 个教案，第 {safeCurrentPage}/{totalPages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      首页
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      上一页
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (safeCurrentPage <= 3) {
                        pageNum = i + 1;
                      } else if (safeCurrentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = safeCurrentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            safeCurrentPage === pageNum
                              ? 'bg-primary-600 text-white border border-primary-600'
                              : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      末页
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>暂无教案，请先创建教案</p>
                <Button onClick={() => navigate('/teaching-preparation')} className="mt-4">
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
        { label: '我的备课', path: '/teaching-preparation' },
        { label: '同步设计' }
      ]}
    >
      <GeneratingProgressModal
        visible={syncing}
        title="AI智能同步设计中"
        stage={syncingStage}
        estimatedTime={240}
        tips={[
          'AI正在分析教案结构，请耐心等待...',
          '正在同步教案内容到PPT...',
          '正在设计精美的页面布局...',
          '同步设计即将完成，请勿关闭页面...',
        ]}
      />
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
                onClick={handleSave}
                loading={saving}
                variant="secondary"
              >
                保存教案
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAndSync}
                loading={saving || syncing}
              >
                保存并同步
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                loading={saving}
                variant="outline"
              >
                保存全部
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
                value={teachingGoalsText}
                onChange={(e) => handleFieldChange('teachingGoals', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入教学目标（每行一条，格式：维度名称：目标内容）"
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

        <div className="w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm p-6 flex flex-col border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-800">PPT预览</h2>
              {pptPages.length > 0 && (
                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                  {pptPages.length} 页
                </span>
              )}
            </div>
            {pptPages.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handlePreview}
              >
                全屏预览
              </Button>
            )}
          </div>

          <div className="flex-1 bg-white rounded-lg p-4 overflow-y-auto border border-gray-200 shadow-inner">
            {pptPages.length > 0 ? (
              <PPTPreview pages={pptPages} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <svg className="h-20 w-20 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-center text-gray-500">
                  <span className="font-medium text-gray-600">点击"保存并同步"</span><br />
                  AI将根据教案内容生成PPT
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
