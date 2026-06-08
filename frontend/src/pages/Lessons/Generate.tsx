import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { lessonAPI } from '@/api';

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

const GenerateLesson: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    topic: '',
    title: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedLesson, setGeneratedLesson] = useState<{
    title: string;
    subject: string;
    grade: string;
    teachingGoals: string[];
    keyPoints: string[];
    teachingProcess: Record<string, unknown> | string;
    assignments: string;
    summary: string;
  } | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setError('');
    setGeneratedLesson(null);

    if (!formData.subject || !formData.grade || !formData.topic) {
      setError('请填写完整的参数（学科、年级、主题）');
      return;
    }

    setLoading(true);
    try {
      const result = await lessonAPI.generate({
        subject: formData.subject,
        grade: formData.grade,
        topic: formData.topic,
        title: formData.title || undefined,
      });
      setGeneratedLesson({
        title: result.title,
        subject: result.subject,
        grade: result.grade,
        teachingGoals: Array.isArray(result.teachingGoals) ? result.teachingGoals : [],
        keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
        teachingProcess: result.teachingProcess,
        assignments: result.assignments || '',
        summary: result.summary || '',
      });
    } catch (err) {
      setError((err as Error).message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedLesson) {
      console.error('保存失败: generatedLesson 为 null');
      setError('教案数据不存在，请重新生成');
      return;
    }

    console.log('保存教案数据:', {
      title: generatedLesson.title,
      subject: generatedLesson.subject,
      grade: generatedLesson.grade,
      teachingGoals: generatedLesson.teachingGoals,
    });

    if (!generatedLesson.title || !generatedLesson.subject || !generatedLesson.grade) {
      console.error('验证失败: 缺少必填字段', { title: generatedLesson.title, subject: generatedLesson.subject, grade: generatedLesson.grade });
      setError('教案数据不完整，请重新生成');
      return;
    }

    setLoading(true);
    try {
      const teachingGoals = Array.isArray(generatedLesson.teachingGoals)
        ? JSON.stringify(generatedLesson.teachingGoals)
        : generatedLesson.teachingGoals || '[]';

      const keyPoints = Array.isArray(generatedLesson.keyPoints)
        ? JSON.stringify(generatedLesson.keyPoints)
        : generatedLesson.keyPoints || '[]';

      const teachingProcess = typeof generatedLesson.teachingProcess === 'object'
        ? JSON.stringify(generatedLesson.teachingProcess)
        : generatedLesson.teachingProcess || '{}';

      console.log('发送保存请求...');
      await lessonAPI.create({
        title: generatedLesson.title,
        subject: generatedLesson.subject,
        grade: generatedLesson.grade,
        teachingGoals,
        keyPoints,
        teachingProcess,
        assignments: generatedLesson.assignments || '',
        summary: generatedLesson.summary || '',
      });
      console.log('保存成功，跳转到教案列表');
      navigate('/lessons');
    } catch (err) {
      console.error('保存失败:', err);
      setError((err as Error).message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout 
      title="AI生成教案" 
      subtitle="智能生成教学方案"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '我的备课', path: '/lessons' },
        { label: '教案编写', path: '/lessons/create' },
        { label: 'AI生成教案' }
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">AI智能教案生成</h2>
              <p className="text-primary-100">输入学科、年级和主题，AI将为您生成完整的教学方案</p>
            </div>
          </div>
        </div>

        {!generatedLesson ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学科 *</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择学科</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级 *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => handleChange('grade', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">请选择年级</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主题 *</label>
                  <input
                    type="text"
                    placeholder="教学主题"
                    value={formData.topic}
                    onChange={(e) => handleChange('topic', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <Input
                label="教案标题（选填）"
                placeholder="自动生成时将使用默认标题"
                value={formData.title}
                onChange={(v) => handleChange('title', v)}
              />

              <Button type="button" size="lg" loading={loading} onClick={handleGenerate} className="w-full">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                智能生成教案
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {error && (
              <div className="p-4 bg-danger-50 border-b border-danger-200 text-danger-600 text-sm">
                {error}
              </div>
            )}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">AI生成结果</h3>
                <p className="text-sm text-gray-500">以下是AI为您生成的教案内容，可以直接保存或修改后保存</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setGeneratedLesson(null)}>
                  重新生成
                </Button>
                <Button loading={loading} onClick={handleSave}>
                  保存教案
                </Button>
              </div>
            </div>

            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">标题</label>
                  <input
                    type="text"
                    value={generatedLesson.title}
                    onChange={(e) => setGeneratedLesson((prev) => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">学科</label>
                  <input
                    type="text"
                    value={generatedLesson.subject}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">年级</label>
                  <input
                    type="text"
                    value={generatedLesson.grade}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {generatedLesson.teachingGoals && generatedLesson.teachingGoals.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">教学目标</h4>
                <ul className="space-y-2">
                  {generatedLesson.teachingGoals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...generatedLesson.teachingGoals];
                          newGoals[index] = e.target.value;
                          setGeneratedLesson((prev) => prev ? { ...prev, teachingGoals: newGoals } : null);
                        }}
                        className="flex-1 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {generatedLesson.keyPoints && generatedLesson.keyPoints.length > 0 && (
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">教学重点</h4>
                <ul className="space-y-2">
                  {generatedLesson.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success-100 text-success-600 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => {
                          const newPoints = [...generatedLesson.keyPoints];
                          newPoints[index] = e.target.value;
                          setGeneratedLesson((prev) => prev ? { ...prev, keyPoints: newPoints } : null);
                        }}
                        className="flex-1 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {generatedLesson.teachingProcess && (
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">教学过程</h4>
                <textarea
                  value={typeof generatedLesson.teachingProcess === 'object' 
                    ? JSON.stringify(generatedLesson.teachingProcess, null, 2) 
                    : generatedLesson.teachingProcess}
                  onChange={(e) => setGeneratedLesson((prev) => prev ? { ...prev, teachingProcess: e.target.value } : null)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none font-mono"
                />
              </div>
            )}

            {generatedLesson.assignments && (
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">作业布置</h4>
                <textarea
                  value={generatedLesson.assignments}
                  onChange={(e) => setGeneratedLesson((prev) => prev ? { ...prev, assignments: e.target.value } : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                />
              </div>
            )}

            {generatedLesson.summary && (
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">教学总结</h4>
                <textarea
                  value={generatedLesson.summary}
                  onChange={(e) => setGeneratedLesson((prev) => prev ? { ...prev, summary: e.target.value } : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GenerateLesson;