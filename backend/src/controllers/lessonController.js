/**
 * 教案控制器
 * 处理教案的CRUD操作
 */

const Lesson = require('../models/Lesson');
const AIService = require('../services/aiService');
const { generateLessonPlan, getSubjectsList } = require('../services/lessonPlanService');
const PdfExportService = require('../services/pdfExportService');
const ExportService = require('../services/exportService');

// ==================== 教学目标数据格式转换工具 ====================

/**
 * 将旧版扁平数组格式转换为新格式
 * @param {string[]} goalsArray 旧格式教学目标数组
 * @returns {Object} 新格式教学目标
 */
const convertLegacyArrayGoals = (goalsArray) => {
  if (!goalsArray || goalsArray.length === 0) {
    return { version: 2, dimensions: [] };
  }

  const dimensionMap = {};
  const generalGoals = [];

  goalsArray.forEach(goal => {
    const str = typeof goal === 'string' ? goal : String(goal);
    const match = str.match(/^([^：:]+)[：:](.+)/);
    if (match) {
      const dimName = match[1].trim();
      const goalContent = match[2].trim();
      if (!dimensionMap[dimName]) {
        dimensionMap[dimName] = [];
      }
      dimensionMap[dimName].push(goalContent);
    } else {
      generalGoals.push(str);
    }
  });

  const dimensions = [];
  for (const [name, goals] of Object.entries(dimensionMap)) {
    dimensions.push({
      id: name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '_'),
      name,
      goals
    });
  }

  if (generalGoals.length > 0 && dimensions.length === 0) {
    dimensions.push({
      id: 'general',
      name: '教学目标',
      goals: generalGoals
    });
  } else if (generalGoals.length > 0) {
    dimensions.push({
      id: 'general',
      name: '综合目标',
      goals: generalGoals
    });
  }

  return { version: 2, dimensions };
};

/**
 * 将旧版 knowledge/ability/emotion 对象格式转换为新格式
 * @param {Object} obj 旧格式教学目标对象
 * @returns {Object} 新格式教学目标
 */
const convertLegacyObjectGoals = (obj) => {
  const dimensions = [];
  const mapping = {
    knowledge: { id: 'knowledge', name: '知识与技能' },
    ability: { id: 'ability', name: '过程与方法' },
    emotion: { id: 'emotion', name: '情感态度与价值观' }
  };

  for (const [key, config] of Object.entries(mapping)) {
    if (obj[key] && Array.isArray(obj[key]) && obj[key].length > 0) {
      dimensions.push({
        id: config.id,
        name: config.name,
        goals: obj[key]
      });
    }
  }

  return { version: 2, dimensions };
};

/**
 * 格式化教学目标数据用于存储
 * 支持新旧两种格式输入，统一存储为新格式
 * @param {*} teachingGoals 教学目标数据
 * @returns {string|null} JSON字符串
 */
const formatTeachingGoalsForStorage = (teachingGoals) => {
  if (!teachingGoals) return null;

  // 如果已经是新格式（对象且有dimensions字段）
  if (typeof teachingGoals === 'object' && !Array.isArray(teachingGoals) && teachingGoals.dimensions) {
    return JSON.stringify(teachingGoals);
  }

  // 如果是字符串
  if (typeof teachingGoals === 'string') {
    try {
      const parsed = JSON.parse(teachingGoals);
      if (Array.isArray(parsed)) {
        return JSON.stringify(convertLegacyArrayGoals(parsed));
      }
      if (parsed && parsed.dimensions) {
        return JSON.stringify(parsed);
      }
      if (parsed && (parsed.knowledge || parsed.ability || parsed.emotion)) {
        return JSON.stringify(convertLegacyObjectGoals(parsed));
      }
    } catch {
      return JSON.stringify({
        version: 2,
        dimensions: [{
          id: 'general',
          name: '教学目标',
          goals: teachingGoals.split('\n').filter(l => l.trim())
        }]
      });
    }
  }

  if (Array.isArray(teachingGoals)) {
    return JSON.stringify(convertLegacyArrayGoals(teachingGoals));
  }

  return JSON.stringify(teachingGoals);
};

/**
 * 格式化教学目标数据用于前端展示
 * 确保返回的数据格式统一为新格式
 * @param {*} teachingGoals 教学目标数据
 * @returns {Object} 新格式教学目标对象
 */
const formatTeachingGoalsForDisplay = (teachingGoals) => {
  if (!teachingGoals) return { version: 2, dimensions: [] };

  let data = teachingGoals;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return {
        version: 2,
        dimensions: [{
          id: 'general',
          name: '教学目标',
          goals: data.split('\n').filter(l => l.trim())
        }]
      };
    }
  }

  if (data && typeof data === 'object' && data.dimensions) {
    return data;
  }

  if (Array.isArray(data)) {
    return convertLegacyArrayGoals(data);
  }

  if (data && typeof data === 'object' && (data.knowledge || data.ability || data.emotion)) {
    return convertLegacyObjectGoals(data);
  }

  return { version: 2, dimensions: [] };
};

/**
 * 创建教案
 * POST /api/lessons
 */
const createLesson = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            title,
            subject,
            grade,
            teachingGoals,
            keyPoints,
            teachingProcess,
            assignments,
            summary,
            overwrite = false
        } = req.body;

        // 验证必填字段
        if (!title || !subject || !grade) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供完整的教案信息（title, subject, grade）'
            });
        }

        // 验证标题长度
        if (title.length > 200) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '教案标题不能超过200个字符'
            });
        }

        // 检查是否存在同名教案
        const exists = await Lesson.existsByTitle(userId, title);
        if (exists && !overwrite) {
            return res.status(409).json({
                success: false,
                code: 409,
                message: '已存在同名教案',
                hint: '请修改标题或使用overwrite参数覆盖现有教案'
            });
        }

        // 如果需要覆盖，先删除同名教案
        if (exists && overwrite) {
            const existingLessons = await Lesson.findByUser(userId, { keyword: title });
            for (const lesson of existingLessons.lessons) {
                if (lesson.title === title) {
                    await Lesson.delete(lesson.id);
                }
            }
        }

        // 创建教案
        const lesson = await Lesson.create({
            userId,
            title,
            subject,
            grade,
            teachingGoals,
            keyPoints,
            teachingProcess,
            assignments,
            summary,
            status: 'draft'
        });

        res.status(201).json({
            success: true,
            message: exists && overwrite ? '教案覆盖成功' : '教案创建成功',
            data: lesson
        });

    } catch (error) {
        console.error('创建教案错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误，创建教案失败'
        });
    }
};

/**
 * 检查标题是否已存在
 * POST /api/lessons/check-title
 */
const checkTitleExists = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, excludeId } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供标题'
            });
        }

        const exists = await Lesson.existsByTitle(userId, title, excludeId);

        res.json({
            success: true,
            data: {
                exists,
                message: exists ? '标题已存在' : '标题可用'
            }
        });

    } catch (error) {
        console.error('检查标题错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取教案列表（当前用户的）
 * GET /api/lessons
 */
const getLessonList = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { page = 1, pageSize = 10, keyword, subject, status } = req.query;

        const result = await Lesson.findByUser(userId, {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            keyword,
            subject,
            status
        });

        res.json({
            success: true,
            message: '获取教案列表成功',
            data: {
                lessons: result.lessons,
                pagination: result.pagination
            }
        });

    } catch (error) {
        console.error('获取教案列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取教案详情
 * GET /api/lessons/:id
 */
const getLessonDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        console.log(`获取教案详情: id=${id}, userId=${userId}`);

        const lesson = await Lesson.findById(id);

        if (!lesson) {
            console.log(`教案 ${id} 不存在`);
            return res.status(404).json({
                success: false,
                code: 404,
                message: '教案不存在'
            });
        }

        console.log(`教案详情: id=${lesson.id}, userId=${lesson.userId}, status=${lesson.status}, grade=${lesson.grade}, subject=${lesson.subject}`);

        // 增加浏览次数
        await Lesson.incrementViews(id);

        // 登录用户可以查看所有教案
        // 未登录用户通过路由守卫处理

        // 格式化教学目标为统一的新格式
        const formattedLesson = {
            ...lesson,
            teachingGoals: formatTeachingGoalsForDisplay(lesson.teachingGoals)
        };

        res.json({
            success: true,
            message: '获取教案详情成功',
            data: formattedLesson
        });

    } catch (error) {
        console.error('获取教案详情错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 更新教案
 * PUT /api/lessons/:id
 */
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const updateData = req.body;

        // 查询教案
        const lesson = await Lesson.findById(id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '教案不存在'
            });
        }

        // 检查权限
        if (lesson.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权修改此教案'
            });
        }

        // 验证标题长度
        if (updateData.title && updateData.title.length > 200) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '教案标题不能超过200个字符'
            });
        }

        // 更新教案
        const success = await Lesson.update(id, updateData);

        if (!success) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '更新失败，没有要更新的字段'
            });
        }

        // 返回更新后的教案
        const updatedLesson = await Lesson.findById(id);

        res.json({
            success: true,
            message: '教案更新成功',
            data: updatedLesson
        });

    } catch (error) {
        console.error('更新教案错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误，更新教案失败'
        });
    }
};

/**
 * 删除教案
 * DELETE /api/lessons/:id
 */
const deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // 查询教案
        const lesson = await Lesson.findById(id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '教案不存在'
            });
        }

        // 检查权限
        if (lesson.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权删除此教案'
            });
        }

        // 删除教案
        const success = await Lesson.delete(id);

        if (!success) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '删除失败'
            });
        }

        res.json({
            success: true,
            message: '教案删除成功',
            data: {}
        });

    } catch (error) {
        console.error('删除教案错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误，删除教案失败'
        });
    }
};

/**
 * 获取公开教案列表
 * GET /api/lessons/public
 */
const getPublicLessons = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, subject, keyword } = req.query;

        const result = await Lesson.findPublic({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            subject,
            keyword
        });

        res.json({
            success: true,
            message: '获取公开教案列表成功',
            data: result.lessons,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('获取公开教案列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * AI 生成教案
 * POST /api/lessons/generate
 */
const generateByAI = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { subject, grade, topic, title } = req.body;

        // 验证必填字段
        if (!subject || !grade || !topic) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供完整的参数（subject, grade, topic）'
            });
        }

        // 验证主题长度
        if (topic.length > 100) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '主题不能超过100个字符'
            });
        }

        console.log(`📝 AI正在生成教案: ${subject} - ${grade} - ${topic}`);

        // 调用 AI 服务生成教案
        const aiResult = await AIService.generateLesson(subject, grade, topic);

        // 检查是否使用模拟数据
        const isMock = !AIService.isAvailable();

        // 构建教案标题
        const lessonTitle = title || `${grade}${subject} - ${topic}教案`;

        // 自动保存到数据库（统一转换为新格式存储）
        const teachingGoals = formatTeachingGoalsForStorage(aiResult.teachingGoals);
        const keyPoints = JSON.stringify(aiResult.keyPoints || []);
        const teachingProcess = JSON.stringify(aiResult.teachingProcess || {});

        const lesson = await Lesson.create({
            userId,
            title: lessonTitle,
            subject,
            grade,
            teachingGoals,
            keyPoints,
            teachingProcess,
            assignments: aiResult.assignments || '',
            summary: aiResult.summary || '',
            status: 'draft'
        });

        console.log(`✅ 教案已自动保存，ID: ${lesson.id}`);

        // 返回格式化后的教学目标
        const displayGoals = formatTeachingGoalsForDisplay(aiResult.teachingGoals);

        res.status(201).json({
            success: true,
            message: isMock ? '教案生成并保存成功（使用模拟数据）' : '教案生成并保存成功',
            data: {
                id: lesson.id,
                title: lessonTitle,
                subject: subject,
                grade: grade,
                teachingGoals: displayGoals,
                keyPoints: aiResult.keyPoints,
                teachingProcess: aiResult.teachingProcess,
                assignments: aiResult.assignments,
                summary: aiResult.summary,
                status: 'draft',
                isMockData: isMock
            }
        });

    } catch (error) {
        console.error('AI生成教案错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: `生成教案失败: ${error.message}`,
            hint: error.message.includes('API')
                ? '请检查API配置'
                : '请稍后重试'
        });
    }
};

/**
 * 学科感知AI生成教案（全学段）
 * POST /api/lessons/generate-aware
 *
 * 支持小学、初中、高中各学科的核心素养和教学特点
 */
const generateSubjectAwareLesson = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            subject,
            grade,
            topic,
            title,
            chapter,
            teachingHours,
            studentLevel,
            customRequirements
        } = req.body;

        if (!subject || !grade || !topic) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供完整的参数（subject, grade, topic）'
            });
        }

        if (topic.length > 200) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '主题不能超过200个字符'
            });
        }

        console.log(`📝 全学段学科感知AI正在生成教案: ${subject} - ${grade} - ${topic}`);

        const options = {};
        if (chapter) options.chapter = chapter;
        if (teachingHours) options.teachingHours = teachingHours;
        if (studentLevel) options.studentLevel = studentLevel;
        if (customRequirements) options.customRequirements = customRequirements;

        const result = await generateLessonPlan(topic, grade, subject, options);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: `生成教案失败: ${result.error}`,
                hint: '请稍后重试或联系管理员'
            });
        }

        const lessonTitle = title || `${grade}${subject} - ${topic}教案`;
        const lessonPlan = result.data;

        // 统一转换教学目标为新格式存储
        const teachingGoals = formatTeachingGoalsForStorage(lessonPlan.teachingGoals);
        const keyPointsObj = lessonPlan.teachingKeyPoints || {};
        const keyPointsList = [
            ...(keyPointsObj.key || []),
            ...(keyPointsObj.difficult || [])
        ];

        const keyPoints = JSON.stringify(keyPointsList);
        const teachingProcess = JSON.stringify(lessonPlan.teachingProcess || {});
        const assignments = Array.isArray(lessonPlan.homework)
            ? lessonPlan.homework.join('\n')
            : (lessonPlan.homework || '');

        // 自动保存到数据库
        const lesson = await Lesson.create({
            userId,
            title: lessonTitle,
            subject,
            grade,
            teachingGoals,
            keyPoints,
            teachingProcess,
            assignments,
            summary: '',
            status: 'draft'
        });

        console.log(`✅ 教案已自动保存，ID: ${lesson.id}`);

        // 返回格式化后的教学目标给前端
        const displayGoals = formatTeachingGoalsForDisplay(lessonPlan.teachingGoals);

        res.status(201).json({
            success: true,
            message: '教案生成并保存成功',
            data: {
                id: lesson.id,
                ...lessonPlan,
                teachingGoals: displayGoals,
                title: lessonTitle,
                subject: subject,
                grade: grade,
                status: 'draft',
                metadata: lessonPlan.metadata
            }
        });

    } catch (error) {
        console.error('学科感知教案生成错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: `生成教案失败: ${error.message}`
        });
    }
};

/**
 * 获取支持的学段和学科列表
 * GET /api/lessons/subjects
 */
const getAvailableSubjects = async (req, res) => {
    try {
        const { stage } = req.query;

        let subjects;
        if (stage) {
            subjects = getSubjectsList(stage);
        } else {
            subjects = {
                primary: getSubjectsList('primary'),
                middle: getSubjectsList('middle'),
                high: getSubjectsList('high')
            };
        }

        res.json({
            success: true,
            data: subjects
        });

    } catch (error) {
        console.error('获取学科列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学科列表失败'
        });
    }
};

/**
 * 导出教案为Word文档
 * GET /api/lessons/:id/export
 */
const exportLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const format = (req.query.format || 'docx').toLowerCase();
        const userId = req.user?.id;

        const lesson = await Lesson.findById(id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '教案不存在'
            });
        }

        // 验证权限
        if (lesson.userId !== userId && lesson.status !== 'published') {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权导出此教案'
            });
        }

        const safeTitle = (lesson.title || '教案').replace(/[\/\\?%*:|"<>]/g, '_');

        // ==================== PDF 导出 ====================
        if (format === 'pdf') {
            try {
                // 生成 HTML 内容
                const html = generateLessonHTML(lesson);
                // 使用 pdfExportService 将 HTML 渲染为 PDF
                const pdfBuffer = await PdfExportService.renderHTMLToPDF(html);
                if (!pdfBuffer) {
                    return res.status(500).json({
                        success: false,
                        code: 500,
                        message: 'PDF 渲染失败，请检查服务端是否已安装 Chromium 浏览器'
                    });
                }
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.pdf"`);
                res.setHeader('Content-Length', pdfBuffer.length);
                return res.send(pdfBuffer);
            } catch (pdfErr) {
                console.error('PDF导出错误:', pdfErr.message);
                return res.status(pdfErr.statusCode || 500).json({
                    success: false,
                    code: pdfErr.statusCode || 500,
                    message: pdfErr.message || 'PDF导出失败',
                    errorCode: pdfErr.code
                });
            }
        }

        // ==================== DOCX 导出 ====================
        if (format === 'docx') {
            const docxBuffer = await ExportService.generateLessonDocx(lesson);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.docx"`);
            res.setHeader('Content-Length', docxBuffer.length);
            return res.send(docxBuffer);
        }

        // ==================== 默认：纯文本回退 ====================
        let content = `教案标题：${lesson.title}\n\n`;
        content += `学科：${lesson.subject}\n`;
        content += `年级：${lesson.grade}\n`;
        content += `创建时间：${lesson.createdAt}\n\n`;

        content += `一、教学目标\n`;
        if (lesson.teachingGoals) {
            try {
                const goalsData = formatTeachingGoalsForDisplay(lesson.teachingGoals);
                if (goalsData && goalsData.dimensions && goalsData.dimensions.length > 0) {
                    goalsData.dimensions.forEach((dim) => {
                        content += `\n【${dim.name}】\n`;
                        dim.goals.forEach((goal, goalIndex) => {
                            content += `  ${goalIndex + 1}. ${goal}\n`;
                        });
                    });
                } else {
                    content += `${lesson.teachingGoals}\n`;
                }
            } catch {
                content += `${lesson.teachingGoals}\n`;
            }
        }
        content += `\n`;

        content += `二、教学重点\n`;
        if (lesson.keyPoints) {
            try {
                const points = JSON.parse(lesson.keyPoints);
                points.forEach((point, index) => {
                    content += `${index + 1}. ${point}\n`;
                });
            } catch {
                content += `${lesson.keyPoints}\n`;
            }
        }
        content += `\n`;

        content += `三、教学过程\n`;
        content += `${lesson.teachingProcess || '未填写'}\n\n`;

        content += `四、作业布置\n`;
        content += `${lesson.assignments || '未填写'}\n\n`;

        content += `五、教学总结\n`;
        content += `${lesson.summary || '未填写'}\n\n`;

        content += `\n---\n网师云 - 师范生备课辅助系统\n`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.txt"`);
        res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
        res.send(content);

    } catch (error) {
        console.error('导出教案错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '导出失败'
        });
    }
};

/**
 * 将教案数据转换为 HTML 页面，供 PDF 渲染使用
 */
function generateLessonHTML(lesson) {
    // 教学目标
    let goalsHTML = '';
    if (lesson.teachingGoals) {
        try {
            const goalsData = formatTeachingGoalsForDisplay(lesson.teachingGoals);
            if (goalsData && goalsData.dimensions && goalsData.dimensions.length > 0) {
                goalsData.dimensions.forEach((dim) => {
                    goalsHTML += `<div class="goal-group">`;
                    goalsHTML += `<div class="goal-title">${escapeHTML(dim.name)}</div>`;
                    dim.goals.forEach((goal, i) => {
                        goalsHTML += `<div class="goal-item"><span class="badge">${i + 1}</span> ${escapeHTML(goal)}</div>`;
                    });
                    goalsHTML += `</div>`;
                });
            } else {
                goalsHTML = `<div class="goal-item">${escapeHTML(String(lesson.teachingGoals))}</div>`;
            }
        } catch {
            goalsHTML = `<div class="goal-item">${escapeHTML(String(lesson.teachingGoals))}</div>`;
        }
    }

    // 教学重点
    let keyPointsHTML = '';
    if (lesson.keyPoints) {
        try {
            const points = JSON.parse(lesson.keyPoints);
            points.forEach((point, i) => {
                keyPointsHTML += `<div class="goal-item"><span class="badge green">${i + 1}</span> ${escapeHTML(point)}</div>`;
            });
        } catch {
            keyPointsHTML = `<div class="goal-item">${escapeHTML(String(lesson.keyPoints))}</div>`;
        }
    }

    // 教学过程
    let processHTML = '';
    if (lesson.teachingProcess) {
        try {
            const processObj = JSON.parse(lesson.teachingProcess);
            if (typeof processObj === 'object' && processObj !== null) {
                const stageMap = {
                    introduction: '课堂导入',
                    mainContent: '新课讲授',
                    practice: '巩固练习',
                    summary: '课堂总结'
                };
                for (const [key, label] of Object.entries(stageMap)) {
                    if (processObj[key]) {
                        processHTML += `<div class="process-stage"><strong>${label}：</strong>${formatProcessContent(processObj[key])}</div>`;
                    }
                }
                // 兜底：如果有未识别的 key
                const knownKeys = Object.keys(stageMap);
                const extraKeys = Object.keys(processObj).filter(k => !knownKeys.includes(k));
                if (extraKeys.length > 0) {
                    extraKeys.forEach(k => {
                        processHTML += `<div class="process-stage"><strong>${escapeHTML(k)}：</strong>${formatProcessContent(processObj[k])}</div>`;
                    });
                }
            } else {
                processHTML = `<div class="process-stage">${formatProcessContent(lesson.teachingProcess)}</div>`;
            }
        } catch {
            processHTML = `<div class="process-stage">${formatProcessContent(lesson.teachingProcess)}</div>`;
        }
    }

    const safeTitle = escapeHTML(lesson.title || '教案');
    const subject = escapeHTML(lesson.subject || '');
    const grade = escapeHTML(lesson.grade || '');
    const createdAt = escapeHTML(lesson.createdAt || '');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  @font-face {
    font-family: "WangshiyunCJK";
    src: url("file:///home/devbox/apps/wangshiyun-edu/backend/assets/fonts/NotoSansCJKsc-Regular.otf") format("opentype");
    font-weight: 400;
    font-style: normal;
  }
  @page { size: A4 portrait; margin: 20mm 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "WangshiyunCJK", "Noto Sans CJK SC", "Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Helvetica Neue", sans-serif;
    font-size: 14px; line-height: 1.8; color: #333;
    padding: 0 12px;
  }
  h1 { text-align: center; font-size: 24px; margin: 24px 0 8px; color: #1a1a1a; }
  .meta { text-align: center; color: #888; font-size: 13px; margin-bottom: 24px; }
  .meta span { margin: 0 12px; }
  .meta .tag { background: #f0e4e8; color: #a9446a; padding: 2px 10px; border-radius: 4px; }
  h2 { font-size: 17px; color: #1a1a1a; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
  h2::before { content: "○ "; color: #a9446a; }
  .goal-group { margin-bottom: 10px; }
  .goal-title { font-weight: bold; color: #a9446a; margin-bottom: 4px; }
  .goal-item { padding: 3px 0; padding-left: 4px; }
  .badge { display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center;
           border-radius: 50%; background: #f0e4e8; color: #a9446a; font-size: 12px; font-weight: bold; margin-right: 6px; }
  .badge.green { background: #e6f7e6; color: #2d8a2d; }
  .process-stage { margin-bottom: 12px; padding: 8px 10px; background: #fafafa; border-radius: 6px; border-left: 3px solid #a9446a; }
  .footer { text-align: center; color: #aaa; font-size: 12px; margin-top: 36px; padding-top: 12px; border-top: 1px solid #eee; }
</style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <div class="meta">
    <span class="tag">${subject}</span>
    <span class="tag">${grade}</span>
    <span>创建时间：${createdAt}</span>
  </div>

  <h2>教学目标</h2>
  <div>${goalsHTML || '<div class="goal-item">暂无</div>'}</div>

  <h2>教学重点</h2>
  <div>${keyPointsHTML || '<div class="goal-item">暂无</div>'}</div>

  <h2>教学过程</h2>
  <div>${processHTML || '<div class="process-stage">暂无</div>'}</div>

  <h2>作业布置</h2>
  <div class="process-stage">${lesson.assignments ? formatProcessContent(lesson.assignments) : '<span style="color:#999">暂无</span>'}</div>

  <h2>教学总结</h2>
  <div class="process-stage">${lesson.summary ? formatProcessContent(lesson.summary) : '<span style="color:#999">暂无</span>'}</div>

  <div class="footer">网师云 - 师范生备课辅助系统</div>
</body>
</html>`;
}

/** 转义 HTML 特殊字符，防止 XSS */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

/** 将教学过程中的字符串或数组格式化为 HTML */
function formatProcessContent(content) {
    if (!content) return '';
    if (Array.isArray(content)) {
        return content.map(item => {
            if (typeof item === 'object' && item !== null) {
                const parts = [];
                if (item.duration) parts.push(`<strong>[${escapeHTML(item.duration)}]</strong>`);
                if (item.activity || item.activities || item.description || item.content || item.text) {
                    const text = item.activity || item.activities || item.description || item.content || item.text;
                    parts.push(formatProcessContent(text));
                }
                // 递归处理子项
                const known = new Set(['duration', 'activity', 'activities', 'description', 'content', 'text']);
                Object.keys(item).filter(k => !known.has(k)).forEach(k => {
                    parts.push(`<strong>${escapeHTML(k)}：</strong>${formatProcessContent(item[k])}`);
                });
                return `<div style="margin-bottom:6px">${parts.join(' ')}</div>`;
            }
            return `<div style="margin-bottom:6px">${escapeHTML(String(item))}</div>`;
        }).join('');
    }
    if (typeof content === 'object' && content !== null) {
        return Object.entries(content).map(([k, v]) =>
            `<div><strong>${escapeHTML(k)}：</strong>${formatProcessContent(v)}</div>`
        ).join('');
    }
    // 字符串：保留换行
    return String(content).split('\n').map(line => escapeHTML(line)).join('<br>');
}

module.exports = {
    createLesson,
    checkTitleExists,
    getLessonList,
    getLessonDetail,
    updateLesson,
    deleteLesson,
    getPublicLessons,
    generateByAI,
    generateSubjectAwareLesson,
    getAvailableSubjects,
    exportLesson
};
