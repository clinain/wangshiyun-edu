import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import { lessonAPI } from '@/api';
import type { Lesson } from '@/types';
import { parseTeachingGoals } from '@/utils/teachingGoalsHelper';

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
      navigate('/lessons/create');
    } catch (error) {
      console.error('删除教案失败:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportWord = async () => {
    if (!lesson) return;
    try {
      const blob = await lessonAPI.export(lesson.id, 'docx');
      downloadBlob(blob, `${lesson.title || '教案'}.docx`);
    } catch (error) {
      console.error('导出Word失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleExportPdf = async () => {
    if (!lesson) return;
    try {
      const blob = await lessonAPI.export(lesson.id, 'pdf');
      // 检查返回的是否是 JSON 错误（blob 可能包含错误信息）
      if (blob.type === 'application/json' || blob.type === 'text/plain') {
        const text = await blob.text();
        try {
          const err = JSON.parse(text);
          throw new Error(err.message || '导出失败');
        } catch (parseError: any) {
          if (parseError?.message !== '导出失败') throw new Error('导出失败');
          throw parseError;
        }
      }
      // 验证 PDF 文件头：有效 PDF 以 %PDF- 开头（0x25 0x50 0x44 0x46 0x2D）
      const headBytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
      const isPdf = headBytes[0] === 0x25 && headBytes[1] === 0x50 && headBytes[2] === 0x44 && headBytes[3] === 0x46 && headBytes[4] === 0x2D;
      if (!isPdf) {
        // 可能是 HTML 错误页面被保存为 PDF
        if (headBytes[0] === 0x3C) { // '<' 字符
          const text = await blob.text();
          const match = text.match(/"message"\s*:\s*"([^"]+)"/);
          throw new Error(match ? match[1] : 'PDF渲染失败，服务端未配置PDF渲染器');
        }
        throw new Error('导出的文件不是有效的PDF格式');
      }
      downloadBlob(blob, `${lesson.title || '教案'}.pdf`);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert((error as Error).message || '导出PDF失败，请重试');
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

  // 将教学过程的嵌套对象转为可读文本
  const convertTeachingProcessToText = (obj: any, depth = 0): string => {
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj.map(item => convertTeachingProcessToText(item, depth)).join('\n');
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj)
        .map(([k, v]) => {
          const keyMap: Record<string, string> = {
            duration: '时长',
            activities: '活动',
            stages: '教学环节',
            stageName: '环节名称',
            teacherActivities: '教师活动',
            studentActivities: '学生活动',
            teachingPoints: '教学要点',
            timeAllocation: '时间安排'
          };
          const label = keyMap[k] || k;
          if (typeof v === 'object' && v !== null) {
            const text = convertTeachingProcessToText(v, depth + 1);
            return text ? `${label}：\n${text}` : '';
          }
          return v ? `${label}：${v}` : '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return String(obj);
  };

  // 将教学过程的阶段数据渲染为结构化JSX
  const renderTeachingProcessStages = (data: any): React.ReactNode => {
    if (typeof data === 'string') {
      // 尝试解析JSON字符串
      try {
        const parsed = JSON.parse(data);
        if (typeof parsed === 'object' && parsed !== null) {
          return renderTeachingProcessStages(parsed);
        }
      } catch {
        // 不是JSON，直接显示文本
        return <p className="text-gray-600 whitespace-pre-wrap">{data}</p>;
      }
    }

    if (typeof data !== 'object' || data === null) {
      return <p className="text-gray-600 whitespace-pre-wrap">{String(data)}</p>;
    }

    // 如果是数组，逐项渲染
    if (Array.isArray(data)) {
      return (
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div key={idx}>
              {typeof item === 'object' && item !== null
                ? renderTeachingProcessStages(item)
                : <p className="text-gray-600">{String(item)}</p>
              }
            </div>
          ))}
        </div>
      );
    }

    // 标题映射
    const titles: Record<string, string> = {
      introduction: '课堂导入',
      newTeaching: '新课讲授',
      practice: '巩固练习',
      summary: '课堂小结'
    };

    // 检查是否是顶层教学过程对象（包含 introduction/newTeaching/practice/summary）
    const hasTopLevelKeys = Object.keys(data).some(k => titles[k]);
    if (hasTopLevelKeys) {
      return (
        <div className="space-y-6">
          {Object.entries(data).map(([key, value]) => {
            const title = titles[key] || key;
            if (!value) return null;
            return (
              <div key={key} className="border-l-4 border-primary-300 pl-4">
                <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
                <div className="text-sm text-gray-600">
                  {renderTeachingProcessStages(value)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // 渲染单个阶段对象（包含 duration, stages, activities 等字段）
    const fieldLabels: Record<string, string> = {
      duration: '⏱️ 时长',
      activities: '📋 活动',
      stages: '📚 教学环节',
      stageName: '📌 环节名称',
      teacherActivities: '👨‍🏫 教师活动',
      studentActivities: '🙋 学生活动',
      teachingPoints: '📝 教学要点',
      timeAllocation: '⏰ 时间安排'
    };

    return (
      <div className="space-y-1">
        {Object.entries(data).map(([key, value]) => {
          const label = fieldLabels[key] || key;
          if (value === null || value === undefined || value === '') return null;

          if (Array.isArray(value)) {
            return (
              <div key={key} className="mt-1">
                {key === 'stages' ? (
                  <div className="space-y-3">
                    {value.map((stage, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">阶段 {idx + 1}</div>
                        {typeof stage === 'object' && stage !== null
                          ? <div className="space-y-1">{renderTeachingProcessStages(stage)}</div>
                          : <p className="text-gray-600">{String(stage)}</p>
                        }
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <span className="font-medium text-gray-700">{label}：</span>
                    <div className="ml-4 mt-1 space-y-1">
                      {value.map((item, idx) => (
                        typeof item === 'object' && item !== null
                          ? <div key={idx} className="bg-gray-50 rounded p-2">{renderTeachingProcessStages(item)}</div>
                          : <p key={idx} className="text-gray-600">• {String(item)}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key}>
                <span className="font-medium text-gray-700">{label}：</span>
                <div className="ml-4 mt-1">
                  {renderTeachingProcessStages(value)}
                </div>
              </div>
            );
          }

          return (
            <div key={key}>
              <span className="font-medium text-gray-700">{label}：</span>
              <span className="text-gray-600">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout 
        title="教案详情"
        breadcrumbs={[
          { label: '首页', path: '/' },
          { label: '我的备课', path: '/teaching-preparation' },
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
          { label: '我的备课', path: '/teaching-preparation' },
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
        { label: '我的备课', path: '/teaching-preparation' },
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
              <Button onClick={() => navigate(`/lessons/${lesson.id}/edit`)}>
                编辑教案
              </Button>
              <Button variant="primary" onClick={() => navigate(`/lessons/${lesson.id}/sync`)}>
                同步编写
              </Button>
              <Button variant="outline" onClick={() => navigate('/ppt?lessonId=' + lesson.id)}>
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

          {lesson.teachingGoals && (() => {
            const goalsData = parseTeachingGoals(lesson.teachingGoals);
            if (!goalsData.dimensions || goalsData.dimensions.length === 0) return null;
            return (
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  教学目标
                </h2>
                <div className="space-y-4">
                  {goalsData.dimensions.map((dim, dimIndex) => (
                    <div key={dim.id || dimIndex} className="border-l-4 border-primary-300 pl-4">
                      <h3 className="text-sm font-semibold text-primary-700 mb-2">{dim.name}</h3>
                      <ul className="space-y-1.5">
                        {dim.goals.map((goal, goalIndex) => (
                          <li key={goalIndex} className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                              {goalIndex + 1}
                            </span>
                            <span className="text-sm text-gray-600">{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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
                {renderTeachingProcessStages(lesson.teachingProcess)}
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