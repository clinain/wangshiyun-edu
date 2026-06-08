import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { lessonAPI, aiAPI } from '@/api';
import type { Lesson } from '@/types';

const primarySubjects = ['语文', '数学', '英语', '道德与法治', '科学', '信息科技', '音乐', '美术', '体育与健康', '劳动', '书法', '综合实践活动', '心理健康'];
const middleSubjects = ['语文', '数学', '英语', '道德与法治', '历史', '地理', '物理', '化学', '生物学', '信息技术', '音乐', '美术', '体育与健康', '劳动', '心理健康', '综合实践活动'];
const highSubjects = ['语文', '数学', '英语', '物理', '化学', '生物学', '历史', '地理', '思想政治', '通用技术', '信息技术', '音乐', '美术', '体育与健康', '劳动', '心理健康', '综合实践活动'];

const primaryGrades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const middleGrades = ['七年级', '八年级', '九年级', '初一', '初二', '初三'];
const highGrades = ['高一', '高二', '高三'];

const CreateLesson: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stage, setStage] = useState<'primary' | 'middle' | 'high'>('primary');
  const [subjects, setSubjects] = useState<string[]>(primarySubjects);
  const [grades, setGrades] = useState<string[]>(primaryGrades);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    teachingGoals: '',
    keyPoints: '',
    teachingProcess: '',
    assignments: '',
    summary: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [detectResult, setDetectResult] = useState('');
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<{
    teachingGoals: string[];
    keyPoints: string[];
    teachingProcess: string;
    assignments: string;
    summary: string;
  } | null>(null);
  
  // 历史教案相关状态
  const [historyLessons, setHistoryLessons] = useState<Lesson[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [historyKeyword, setHistoryKeyword] = useState('');
  const [historyStage, setHistoryStage] = useState('');
  const [historySubject, setHistorySubject] = useState('');
  const [historyGrade, setHistoryGrade] = useState('');
  const [historySubjects, setHistorySubjects] = useState<string[]>([]);
  const [historyGrades, setHistoryGrades] = useState<string[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const isEditingRef = React.useRef(false);

  // 学段变化时更新学科和年级列表
  useEffect(() => {
    if (historyStage === 'primary') {
      setHistorySubjects(primarySubjects);
      setHistoryGrades(primaryGrades);
    } else if (historyStage === 'middle') {
      setHistorySubjects(middleSubjects);
      setHistoryGrades(middleGrades);
    } else if (historyStage === 'high') {
      setHistorySubjects(highSubjects);
      setHistoryGrades(highGrades);
    } else {
      const allSubjects = [...new Set([...primarySubjects, ...middleSubjects, ...highSubjects])];
      const allGrades = [...primaryGrades, ...middleGrades, ...highGrades];
      setHistorySubjects(allSubjects);
      setHistoryGrades(allGrades);
    }
    setHistorySubject('');
    setHistoryGrade('');
  }, [historyStage]);

  const loadLessonForEdit = async (lessonId: number) => {
    // 标记正在编辑，防止 useEffect 重置表单
    isEditingRef.current = true;
    setIsEditing(true);
    try {
      const data = await lessonAPI.detail(lessonId);
      console.log('📝 编辑教案完整数据:', JSON.stringify(data, null, 2));
      // 检测学段
      console.log('📝 DEBUG - grade:', data.grade, 'subject:', data.subject);
      let detectedStage: 'primary' | 'middle' | 'high' = 'primary';
      if (data.grade) {
        if (['七年级','八年级','九年级','初一','初二','初三'].includes(data.grade)) {
          detectedStage = 'middle';
        } else if (['高一','高二','高三'].includes(data.grade)) {
          detectedStage = 'high';
        }
      } else if (data.subject) {
        // 当 grade 为空时，通过 subject 检测学段
        console.log('📝 DEBUG - subject:', data.subject, 'highSubjects includes:', highSubjects.includes(data.subject), 'middleSubjects includes:', middleSubjects.includes(data.subject));
        // 优先匹配高中（因为高中学科是初中学科的超集）
        if (highSubjects.includes(data.subject)) {
          detectedStage = 'high';
        } else if (middleSubjects.includes(data.subject)) {
          detectedStage = 'middle';
        }
      }
      console.log('📝 检测学段:', detectedStage);
      // 直接同步设置所有状态，不使用 setTimeout
      setStage(detectedStage);
      setSubjects(detectedStage === 'primary' ? primarySubjects : detectedStage === 'middle' ? middleSubjects : highSubjects);
      setGrades(detectedStage === 'primary' ? primaryGrades : detectedStage === 'middle' ? middleGrades : highGrades);
      setFormData({
        title: data.title || '',
        subject: data.subject || '',
        grade: data.grade || '',
        teachingGoals: Array.isArray(data.teachingGoals) ? data.teachingGoals.join('\n') : (data.teachingGoals || ''),
        keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.join('\n') : (data.keyPoints || ''),
        teachingProcess: typeof data.teachingProcess === 'object' ? JSON.stringify(data.teachingProcess, null, 2) : (data.teachingProcess || ''),
        assignments: data.assignments || '',
        summary: data.summary || '',
      });
      // 延迟清除编辑标记
      setTimeout(() => {
        setIsEditing(false);
        isEditingRef.current = false;
      }, 500);
    } catch (err) {
      console.error('加载教案失败:', err);
      isEditingRef.current = false;
      setIsEditing(false);
    }
  };

  // 根据URL参数初始化Tab和加载编辑数据
  const editIdFromUrl = new URLSearchParams(location.search).get('edit');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'history') {
      setActiveTab('history');
    }
    const editId = params.get('edit');
    if (editId) {
      setActiveTab('write');
      loadLessonForEdit(parseInt(editId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, editIdFromUrl]);

  // 移除 useEffect([stage])，改为在 loadLessonForEdit 和 handleStageChange 中直接处理

  // 获取历史教案
  const fetchHistoryLessons = async (page = 1, keyword = '', subject = '', grade = '') => {
    setHistoryLoading(true);
    try {
      const result = await lessonAPI.list({
        page,
        pageSize: 50,
        keyword: keyword || undefined,
        subject: subject || undefined,
      });
      let filtered = result.lessons || [];
      if (grade) {
        filtered = filtered.filter((l: any) => l.grade === grade);
      }
      setHistoryLessons(filtered);
      setHistoryTotal(filtered.length);
    } catch (error) {
      console.error('获取历史教案失败:', error);
      setHistoryLessons([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryLessons(historyPage, historyKeyword, historySubject, historyGrade);
    }
  }, [activeTab, historyPage, historySubject, historyGrade]);

  const handleHistorySearch = () => {
    setHistoryPage(1);
    fetchHistoryLessons(1, historyKeyword, historySubject, historyGrade);
  };

  // 加载历史教案到表单
  const loadHistoryLesson = (lesson: Lesson) => {
    setFormData({
      title: lesson.title || '',
      subject: lesson.subject || '',
      grade: lesson.grade || '',
      teachingGoals: cleanTextField(Array.isArray(lesson.teachingGoals) ? lesson.teachingGoals.join('\n') : (lesson.teachingGoals || '')),
      keyPoints: cleanTextField(Array.isArray(lesson.keyPoints) ? lesson.keyPoints.join('\n') : (lesson.keyPoints || '')),
      teachingProcess: typeof lesson.teachingProcess === 'object' ? JSON.stringify(lesson.teachingProcess, null, 2) : (lesson.teachingProcess || ''),
      assignments: lesson.assignments || '',
      summary: lesson.summary || '',
    });
    setActiveTab('write');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStageChange = (newStage: 'primary' | 'middle' | 'high') => {
    setStage(newStage);
    if (newStage === 'primary') {
      setSubjects(primarySubjects);
      setGrades(primaryGrades);
    } else if (newStage === 'middle') {
      setSubjects(middleSubjects);
      setGrades(middleGrades);
    } else {
      setSubjects(highSubjects);
      setGrades(highGrades);
    }
    // 只有手动切换学段时才重置学科和年级
    if (!isEditingRef.current) {
      setFormData(prev => ({ ...prev, subject: '', grade: '' }));
    }
  };

  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 清洗文本字段：将JSON数组字符串或数组转为纯文本换行格式
  const cleanTextField = (value: string): string => {
    if (!value) return '';
    // 如果是JSON数组字符串，解析并返回
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // 递归解包：如果数组只有一个元素且该元素也是数组字符串
          if (parsed.length === 1 && typeof parsed[0] === 'string' && parsed[0].startsWith('[')) {
            try {
              const inner = JSON.parse(parsed[0]);
              if (Array.isArray(inner)) return inner.join('\n');
            } catch { /* 忽略 */ }
          }
          return parsed.join('\n');
        }
      } catch { /* 不是JSON，原样返回 */ }
    }
    return value;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      grade: '',
      teachingGoals: '',
      keyPoints: '',
      teachingProcess: '',
      assignments: '',
      summary: '',
    });
    setStage('primary');
    setSubjects(primarySubjects);
    setGrades(primaryGrades);
    setError('');
    setAiResult('');
    setDetectResult('');
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.subject || !formData.grade) {
      setError('请填写必填字段（标题、学科、年级）');
      return;
    }

    // 检查标题是否已存在
    try {
      const result = await lessonAPI.checkTitle(formData.title);
      if (result.exists) {
        setShowOverwriteModal(true);
        return;
      }
    } catch (err) {
      console.error('检查标题失败:', err);
    }

    // 标题不存在，直接保存
    await saveLesson(false);
  };

  const saveLesson = async (overwrite: boolean) => {
    setSubmitting(true);
    setShowOverwriteModal(false);
    setError('');
    try {
      const data = {
        ...formData,
        teachingGoals: formData.teachingGoals ? JSON.stringify(cleanTextField(formData.teachingGoals).split('\n').filter((l: string) => l.trim())) : '[]',
        keyPoints: formData.keyPoints ? JSON.stringify(cleanTextField(formData.keyPoints).split('\n').filter((l: string) => l.trim())) : '[]',
        teachingProcess: formData.teachingProcess ? formData.teachingProcess : '',
        overwrite,
      };
      await lessonAPI.create(data);
      alert('教案保存成功！');
    } catch (err) {
      setError((err as Error).message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.subject || !formData.grade || !formData.title) {
      setError('请先填写标题、学科和年级');
      return;
    }

    setLoading(true);
    setAiResult('');
    try {
      const result = await lessonAPI.generateSubjectAware({
        subject: formData.subject,
        grade: formData.grade,
        topic: formData.title,
        title: formData.title
      });

      // 保存生成的教案数据用于预览
      let teachingProcessText = '';
      if (result.teachingProcess) {
        const tp = result.teachingProcess;
        if (typeof tp === 'object' && tp !== null) {
          // 将嵌套对象转为中文文本
          const convertToText = (obj: any, depth = 0): string => {
            if (typeof obj === 'string') return obj;
            if (Array.isArray(obj)) return obj.map(item => convertToText(item, depth)).join('\n');
            if (typeof obj === 'object' && obj !== null) {
              return Object.entries(obj)
                .filter(([k]) => k !== 'duration' || depth > 0)
                .map(([k, v]) => {
                  const keyMap: Record<string, string> = {
                    duration: '时长', activities: '活动', stages: '教学环节',
                    stageName: '环节名称', teacherActivities: '教师活动',
                    studentActivities: '学生活动', teachingPoints: '教学要点',
                    timeAllocation: '时间安排'
                  };
                  const label = keyMap[k] || k;
                  return typeof v === 'object' && v !== null
                    ? `${label}：\n${convertToText(v, depth + 1)}`
                    : `${label}：${v}`;
                })
                .filter(Boolean)
                .join('\n');
            }
            return String(obj);
          };

          teachingProcessText = Object.entries(tp)
            .map(([key, value]) => {
              const titles: Record<string, string> = {
                introduction: '【课堂导入】',
                newTeaching: '【新课讲授】',
                practice: '【巩固练习】',
                summary: '【课堂小结】'
              };
              if (titles[key] && value) {
                return `${titles[key]}\n${convertToText(value)}`;
              }
              return '';
            })
            .filter(Boolean)
            .join('\n\n');
        } else {
          teachingProcessText = String(tp);
        }
      }

      // 提取教学目标
      let teachingGoals: string[] = [];
      if (result.teachingObjectives) {
        const obj = result.teachingObjectives;
        if (typeof obj === 'object' && obj !== null) {
          teachingGoals = [
            ...(Array.isArray(obj.knowledge) ? obj.knowledge : []),
            ...(Array.isArray(obj.ability) ? obj.ability : []),
            ...(Array.isArray(obj.emotion) ? obj.emotion : [])
          ];
        }
      }

      // 提取教学重难点
      let keyPoints: string[] = [];
      if (result.teachingKeyPoints) {
        const kp = result.teachingKeyPoints;
        if (typeof kp === 'object' && kp !== null) {
          keyPoints = [
            ...(Array.isArray(kp.key) ? kp.key : []),
            ...(Array.isArray(kp.difficult) ? kp.difficult : [])
          ];
        }
      }

      const lessonData = {
        teachingGoals,
        keyPoints,
        teachingProcess: teachingProcessText || result.teachingProcessText || '',
        assignments: result.homework ? (Array.isArray(result.homework) ? result.homework.join('\n') : String(result.homework)) : '',
        summary: result.teachingReflection?.expectedHighlights?.join('\n') || '',
      };
      setGeneratedLesson(lessonData);
      setShowAiPreview(true);

      // 同时填充表单
      setFormData((prev) => ({
        ...prev,
        teachingGoals: lessonData.teachingGoals.join('\n'),
        keyPoints: lessonData.keyPoints.join('\n'),
        teachingProcess: lessonData.teachingProcess,
        assignments: lessonData.assignments,
        summary: lessonData.summary,
      }));
      setAiResult('AI生成成功！');
    } catch (err) {
      setError((err as Error).message || 'AI生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectStandard = async () => {
    if (!formData.subject || !formData.grade) {
      setError('请先选择学科和年级');
      return;
    }

    setLoading(true);
    setDetectResult('');
    try {
      const systemPrompt = `你是一位教育专家，擅长根据新课标（2022年版）分析教案质量。
请从以下维度对教案进行检测评估：
1. 教学目标（25分）：是否体现知识与技能、过程与方法、情感态度价值观三维目标
2. 教学内容（20分）：是否符合课程标准、联系生活实际
3. 教学过程（25分）：环节是否完整、是否有师生互动
4. 核心素养（15分）：是否体现学科核心素养
5. 学业质量（10分）：是否能达成质量标准
6. 评价建议（5分）：是否有评价设计

请给出：
- 综合评分（满分100分）
- 各维度得分
- 优秀项
- 缺失项
- 改进建议

注意：对于AI生成的教案，关键词匹配应适当放宽，只要内容涉及相关方面即可得分。`;

      const userPrompt = `请检测以下教案是否符合新课标要求：

【学科】${formData.subject}
【年级】${formData.grade}
${formData.title ? `【标题】${formData.title}` : ''}

【教学目标】
${formData.teachingGoals || '未填写'}

【教学重难点】
${formData.keyPoints || '未填写'}

【教学过程】
${formData.teachingProcess || '未填写'}

【作业布置】
${formData.assignments || '未填写'}

【教学总结】
${formData.summary || '未填写'}

请按以下格式输出检测结果：
【综合评分】：XX/100分
【评级】：优秀/良好/合格/不合格
【各维度得分】：
• 教学目标：XX/25分
• 教学内容：XX/20分
• 教学过程：XX/25分
• 核心素养：XX/15分
• 学业质量：XX/10分
• 评价建议：XX/5分
【优秀项】：...
【缺失项】：...
【改进建议】：...`;

      const result = await aiAPI.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      setDetectResult(`【新课标智能检测结果】\n\n📚 学科：${formData.subject}  |  📖 年级：${formData.grade}\n━━━━━━━━━━━━━━━━━━━━━━━\n\n${result.content}`);
    } catch (err) {
      setError((err as Error).message || '新课标检测失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!formData.title || !formData.subject || !formData.grade) {
      setError('请先填写教案基本信息');
      return;
    }

    // 使用浏览器打印功能生成PDF
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${formData.title} - 教案</title>
        <style>
          @page { margin: 2cm; size: A4; }
          body { font-family: "SimSun", "宋体", "STSong", serif; font-size: 14px; line-height: 2; color: #000; padding: 0; margin: 0; }
          h1 { text-align: center; font-size: 22px; margin: 20px 0; padding-bottom: 15px; border-bottom: 2px solid #000; }
          .info { text-align: center; margin-bottom: 30px; font-size: 13px; color: #333; }
          .info span { margin: 0 15px; }
          h2 { font-size: 16px; margin: 25px 0 10px 0; padding: 5px 10px; border-left: 4px solid #000; background: #f5f5f5; }
          .section { margin: 10px 0; padding: 10px 15px; }
          .section p { margin: 5px 0; text-indent: 2em; }
          pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 14px; line-height: 2; margin: 0; }
          .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <h1>${formData.title}</h1>
        <div class="info">
          <span>学科：${formData.subject}</span>
          <span>年级：${formData.grade}</span>
        </div>
        <h2>一、教学目标</h2>
        <div class="section"><pre>${formData.teachingGoals || '未填写'}</pre></div>
        <h2>二、教学重点</h2>
        <div class="section"><pre>${formData.keyPoints || '未填写'}</pre></div>
        <h2>三、教学过程</h2>
        <div class="section"><pre>${formData.teachingProcess || '未填写'}</pre></div>
        <h2>四、作业布置</h2>
        <div class="section"><pre>${formData.assignments || '未填写'}</pre></div>
        <h2>五、教学总结</h2>
        <div class="section"><pre>${formData.summary || '未填写'}</pre></div>
        <div class="footer">网师云 - 师范生备课辅助系统</div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleExportWord = async () => {
    if (!formData.title || !formData.subject || !formData.grade) {
      setError('请先填写教案基本信息');
      return;
    }

    setLoading(true);
    try {
      // 先保存教案（允许覆盖同名教案），然后导出
      const data = {
        ...formData,
        teachingGoals: formData.teachingGoals ? JSON.stringify(formData.teachingGoals.split('\n')) : '[]',
        keyPoints: formData.keyPoints ? JSON.stringify(formData.keyPoints.split('\n')) : '[]',
        teachingProcess: formData.teachingProcess ? formData.teachingProcess : '',
        overwrite: true,
      };
      const savedLesson = await lessonAPI.create(data);
      
      // 导出
      const blob = await lessonAPI.export(savedLesson.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.title}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message || '导出失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('确定要删除这个教案吗？')) return;
    try {
      await lessonAPI.delete(id);
      fetchHistoryLessons(historyPage, historyKeyword, historySubject, historyGrade);
    } catch (error) {
      alert('删除失败');
    }
  };

  const historyTotalPages = Math.ceil(historyTotal / 10);

  return (
    <Layout 
      title="教案编写" 
      subtitle="创建和管理教学教案"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '我的备课', path: '/lessons' },
        { label: '教案编写' }
      ]}
    >
      <div className="max-w-6xl mx-auto">
        {/* 顶部Tab切换 */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('write')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
                activeTab === 'write'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                教案编写
              </span>
              {activeTab === 'write' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${
                activeTab === 'history'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                我的教案
              </span>
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* ========== 教案编写区域 ========== */}
        {activeTab === 'write' && (
          <>
            {/* AI功能按钮区域 + 保存/取消 - 全宽 */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleAIGenerate}
                  loading={loading}
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI生成教案
                </Button>
                <Button
                  onClick={handleDetectStandard}
                  loading={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  AI智能检测新课标
                </Button>
                <div className="relative group">
                  <Button
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    导出教案
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[160px]">
                    <button
                      onClick={handleExportWord}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-600">W</span>
                      导出Word文档
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-6 h-6 bg-red-100 rounded flex items-center justify-center text-xs text-red-600">P</span>
                      导出PDF文件
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => {
                  const hasContent = formData.title || formData.subject || formData.grade || formData.teachingGoals || formData.keyPoints || formData.teachingProcess || formData.assignments || formData.summary;
                  if (hasContent) {
                    setShowNewConfirm(true);
                  } else {
                    resetForm();
                  }
                }} className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新建教案
                </Button>
                <Button onClick={handleSubmit as any} loading={submitting} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  保存教案
                </Button>
              </div>
            </div>
            {aiResult && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {aiResult}
              </div>
            )}

            {/* 两栏布局：表单 + 预览 */}
            <div className="flex gap-6">
            <div className="flex-1 min-w-0">
            {/* AI生成教案预览控制 */}
            {generatedLesson && !showAiPreview && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-primary-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">AI已生成教案内容</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAiPreview(true)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    展开预览
                  </Button>
                </div>
              </div>
            )}

            {/* AI生成教案预览 */}
            {showAiPreview && generatedLesson && (
              <div className="bg-white rounded-xl shadow-sm border border-primary-200 mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">🤖 AI智能生成教案</h3>
                        <p className="text-white/80 text-sm">以下是AI为您生成的完整教案内容</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAiPreview(false)}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
{`【教案标题】${formData.title}

【学科】${formData.subject}
【年级】${formData.grade}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
一、教学目标
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedLesson.teachingGoals.length > 0 
  ? generatedLesson.teachingGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')
  : '暂无内容'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
二、教学重点
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedLesson.keyPoints.length > 0 
  ? generatedLesson.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')
  : '暂无内容'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
三、教学过程
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedLesson.teachingProcess || '暂无内容'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
四、作业布置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedLesson.assignments || '暂无内容'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
五、教学总结
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${generatedLesson.summary || '暂无内容'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 网师云 - 师范生备课辅助系统
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
                    </pre>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowAiPreview(false)}
                    >
                      收起预览
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 新课标检测结果 */}
            {detectResult && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">📋 新课标检测报告</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {detectResult}
                </pre>
              </div>
            )}

            {/* 教案编写表单 */}
            <div className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* 基本信息卡片 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">基本信息</h3>
                      <p className="text-xs text-gray-400">设置教案的基础属性</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">学段 *</label>
                      <select
                        value={stage}
                        onChange={(e) => handleStageChange(e.target.value as 'primary' | 'middle' | 'high')}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 text-sm transition-all"
                      >
                        <option value="primary">小学（1-6年级）</option>
                        <option value="middle">初中（7-9年级）</option>
                        <option value="high">高中（10-12年级）</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">年级 *</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => handleChange('grade', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 text-sm transition-all"
                      >
                        <option value="">请选择年级</option>
                        {grades.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">学科 *</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 text-sm transition-all"
                      >
                        <option value="">请选择学科</option>
                        {subjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Input
                      label="教案标题 *"
                      placeholder="请输入教案标题"
                      value={formData.title}
                      onChange={(v) => handleChange('title', v)}
                    />
                  </div>
                </div>

                {/* 教学目标与重难点卡片 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">教学目标与重难点</h3>
                      <p className="text-xs text-gray-400">明确教学方向和核心内容</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">教学目标</label>
                      <textarea
                        value={formData.teachingGoals}
                        onChange={(e) => handleChange('teachingGoals', e.target.value)}
                        placeholder="请输入教学目标，每行一个目标"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 text-sm leading-relaxed transition-all placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">教学重点</label>
                      <textarea
                        value={formData.keyPoints}
                        onChange={(e) => handleChange('keyPoints', e.target.value)}
                        placeholder="请输入教学重点，每行一个重点"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 text-sm leading-relaxed transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* 教学过程卡片 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">教学过程</h3>
                      <p className="text-xs text-gray-400">详细描述教学环节和活动安排</p>
                    </div>
                  </div>
                  <textarea
                    value={formData.teachingProcess}
                    onChange={(e) => handleChange('teachingProcess', e.target.value)}
                    placeholder="请详细描述教学过程，包括课堂导入、新课讲授、巩固练习、课堂小结等环节"
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 text-sm leading-relaxed transition-all placeholder:text-gray-300"
                  />
                </div>

                {/* 作业与总结卡片 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">作业布置与教学总结</h3>
                      <p className="text-xs text-gray-400">课后延伸与教学反思</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">作业布置</label>
                      <textarea
                        value={formData.assignments}
                        onChange={(e) => handleChange('assignments', e.target.value)}
                        placeholder="请输入作业布置内容"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 text-sm leading-relaxed transition-all placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">教学总结</label>
                      <textarea
                        value={formData.summary}
                        onChange={(e) => handleChange('summary', e.target.value)}
                        placeholder="请输入教学总结"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-gray-50 text-sm leading-relaxed transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            </div>

            {/* 右侧实时预览 */}
            <div className="hidden lg:block w-[420px] flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-4">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    <h3 className="font-semibold text-gray-800 text-sm">文档预览</h3>
                  </div>
                </div>
                <div className="p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* 标题 */}
                  <h1 className="text-lg font-bold text-gray-900 text-center mb-1 leading-tight">
                    {formData.title || '教案标题'}
                  </h1>
                  <div className="text-center text-xs text-gray-400 mb-4 pb-3 border-b border-gray-100">
                    {formData.subject && <span>{formData.subject}</span>}
                    {formData.subject && formData.grade && <span className="mx-1">·</span>}
                    {formData.grade && <span>{formData.grade}</span>}
                  </div>

                  {/* 教学目标 */}
                  {cleanTextField(formData.teachingGoals) && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        教学目标
                      </h2>
                      <div className="text-xs text-gray-600 leading-relaxed space-y-1 pl-3">
                        {cleanTextField(formData.teachingGoals).split('\n').filter((l: string) => l.trim()).map((goal: string, i: number) => (
                          <p key={i}>{i + 1}. {goal}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 教学重点 */}
                  {cleanTextField(formData.keyPoints) && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        教学重点
                      </h2>
                      <div className="text-xs text-gray-600 leading-relaxed space-y-1 pl-3">
                        {cleanTextField(formData.keyPoints).split('\n').filter((l: string) => l.trim()).map((point: string, i: number) => (
                          <p key={i}>{i + 1}. {point}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 教学过程 */}
                  {formData.teachingProcess && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        教学过程
                      </h2>
                      <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap pl-3">
                        {formData.teachingProcess}
                      </div>
                    </div>
                  )}

                  {/* 作业布置 */}
                  {formData.assignments && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        作业布置
                      </h2>
                      <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap pl-3">
                        {formData.assignments}
                      </div>
                    </div>
                  )}

                  {/* 教学总结 */}
                  {formData.summary && (
                    <div className="mb-4">
                      <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        教学总结
                      </h2>
                      <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap pl-3">
                        {formData.summary}
                      </div>
                    </div>
                  )}

                  {/* 空状态 */}
                  {!formData.title && !formData.teachingGoals && !formData.teachingProcess && (
                    <div className="text-center py-10 text-gray-300">
                      <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">开始编辑教案，预览将实时更新</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </>
        )}

        {/* ========== 历史教案区域 ========== */}
        {activeTab === 'history' && (
          <div>
            {/* 搜索和筛选栏 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="搜索教案标题..."
                    value={historyKeyword}
                    onChange={(e) => setHistoryKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleHistorySearch()}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-gray-50 transition-all placeholder:text-gray-400"
                  />
                </div>
                <select
                  value={historyStage}
                  onChange={(e) => {
                    setHistoryStage(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 transition-all"
                >
                  <option value="">全部学段</option>
                  <option value="primary">小学</option>
                  <option value="middle">初中</option>
                  <option value="high">高中</option>
                </select>
                <select
                  value={historySubject}
                  onChange={(e) => {
                    setHistorySubject(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 transition-all"
                >
                  <option value="">全部学科</option>
                  {historySubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={historyGrade}
                  onChange={(e) => {
                    setHistoryGrade(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-gray-50 transition-all"
                >
                  <option value="">全部年级</option>
                  {historyGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <Button onClick={handleHistorySearch} loading={historyLoading} className="flex items-center gap-2 px-6">
                  搜索
                </Button>
              </div>
            </div>

            {/* 历史教案列表 */}
            {historyLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500 mx-auto mb-4"></div>
                  <p className="text-gray-400 text-sm">加载教案中...</p>
                </div>
              </div>
            ) : historyLessons.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无教案</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">您还没有创建过教案，开始您的第一篇教案吧</p>
                <Button onClick={() => setActiveTab('write')}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  创建第一篇教案
                </Button>
              </div>
            ) : (
              <>
                {/* 统计信息 */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-sm text-gray-500">共 <span className="font-semibold text-gray-700">{historyTotal}</span> 篇教案</span>
                  <span className="text-xs text-gray-400">点击教案标题查看详情</span>
                </div>

                {/* 教案卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {historyLessons.map((lesson, index) => {
                    const colors = [
                      'from-blue-500 to-blue-600',
                      'from-purple-500 to-purple-600',
                      'from-green-500 to-emerald-500',
                      'from-amber-500 to-orange-500',
                      'from-pink-500 to-rose-500',
                      'from-cyan-500 to-teal-500',
                      'from-indigo-500 to-indigo-600',
                      'from-red-500 to-pink-500',
                    ];
                    const colorClass = colors[index % colors.length];

                    return (
                      <div
                        key={lesson.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group"
                      >
                        {/* 顶部彩色条 */}
                        <div className={`h-1.5 bg-gradient-to-r ${colorClass}`}></div>

                        <div className="p-5">
                          {/* 标题行 */}
                          <div className="flex items-start justify-between mb-3">
                            <h4
                              className="font-semibold text-gray-800 leading-snug cursor-pointer group-hover:text-primary-600 transition-colors line-clamp-2 flex-1"
                              onClick={() => navigate(`/lessons/${lesson.id}`)}
                            >
                              {lesson.title || '无标题教案'}
                            </h4>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0 ml-3">
                              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>

                          {/* 标签信息 */}
                          <div className="flex items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              {lesson.subject}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {lesson.grade}
                            </span>
                          </div>

                          {/* 底部信息和操作 */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {lesson.views || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString('zh-CN') : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => loadHistoryLesson(lesson)}
                                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                title="编辑"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={async () => {
                                  const data = await lessonAPI.detail(lesson.id);
                                  setPreviewLesson(data);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="删除"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 分页 */}
                {historyTotalPages > 1 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      第 <span className="font-medium text-gray-700">{historyPage}</span> / {historyTotalPages} 页
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={historyPage <= 1}
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={historyPage >= historyTotalPages}
                        onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                      >
                        下一页
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 教案预览弹窗 */}
        {previewLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewLesson(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{previewLesson.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{previewLesson.subject}</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">{previewLesson.grade}</span>
                  </div>
                </div>
                <button onClick={() => setPreviewLesson(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-5">
                {previewLesson.teachingGoals && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>教学目标
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1 pl-3">
                      {cleanTextField(Array.isArray(previewLesson.teachingGoals) ? previewLesson.teachingGoals.join('\n') : (previewLesson.teachingGoals || '')).split('\n').filter((l: string) => l.trim()).map((g: string, i: number) => (
                        <p key={i}>{i + 1}. {g}</p>
                      ))}
                    </div>
                  </div>
                )}
                {previewLesson.keyPoints && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>教学重点
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1 pl-3">
                      {cleanTextField(Array.isArray(previewLesson.keyPoints) ? previewLesson.keyPoints.join('\n') : (previewLesson.keyPoints || '')).split('\n').filter((l: string) => l.trim()).map((p: string, i: number) => (
                        <p key={i}>{i + 1}. {p}</p>
                      ))}
                    </div>
                  </div>
                )}
                {previewLesson.teachingProcess && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>教学过程
                    </h3>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap pl-3 bg-gray-50 p-4 rounded-lg">
                      {typeof previewLesson.teachingProcess === 'object' ? JSON.stringify(previewLesson.teachingProcess, null, 2) : previewLesson.teachingProcess}
                    </div>
                  </div>
                )}
                {previewLesson.assignments && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>作业布置
                    </h3>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap pl-3">{previewLesson.assignments}</div>
                  </div>
                )}
                {previewLesson.summary && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>教学总结
                    </h3>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap pl-3">{previewLesson.summary}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 同名教案确认对话框 */}
        {showOverwriteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">标题已存在</h3>
              </div>
              <p className="text-gray-600 mb-6">
                已存在名为「{formData.title}」的教案，是否覆盖现有教案？
                <br />
                <span className="text-sm text-gray-400 mt-2 block">
                  若选择「保留两者」，新教案将自动添加序号后缀以区分
                </span>
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    const newTitle = `${formData.title}_${Date.now()}`;
                    setFormData(prev => ({ ...prev, title: newTitle }));
                    setShowOverwriteModal(false);
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                  }}
                >
                  保留两者
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowOverwriteModal(false);
                  }}
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => saveLesson(true)}
                  loading={submitting}
                >
                  覆盖
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 新建教案确认弹窗 */}
        {showNewConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewConfirm(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">新建教案</h3>
                <p className="text-gray-600 mb-6">当前教案尚未保存，是否先保存？</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setShowNewConfirm(false); resetForm(); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">不保存</button>
                  <button onClick={async () => { setShowNewConfirm(false); if (formData.title && formData.subject && formData.grade) { try { const checkResult = await lessonAPI.checkTitle(formData.title); await saveLesson(checkResult.exists); } catch { await saveLesson(false); } } resetForm(); }} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">保存并新建</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateLesson;

