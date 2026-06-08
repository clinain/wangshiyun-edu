/**
 * 教案控制器
 * 处理教案的CRUD操作
 */

const Lesson = require('../models/Lesson');
const AIService = require('../services/aiService');
const { generateLessonPlan, getSubjectsList } = require('../services/lessonPlanService');

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

        res.json({
            success: true,
            message: '获取教案详情成功',
            data: lesson
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

        // 不自动保存，返回生成的内容让用户决定是否保存
        res.status(201).json({
            success: true,
            message: isMock ? '教案生成成功（使用模拟数据）' : '教案生成成功',
            data: {
                title: lessonTitle,
                subject: subject,
                grade: grade,
                teachingGoals: aiResult.teachingGoals,
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

        res.status(201).json({
            success: true,
            message: '教案生成成功',
            data: {
                ...lessonPlan,
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

        // 生成Word文档内容
        let content = `教案标题：${lesson.title}\n\n`;
        content += `学科：${lesson.subject}\n`;
        content += `年级：${lesson.grade}\n`;
        content += `创建时间：${lesson.createdAt}\n\n`;

        content += `一、教学目标\n`;
        if (lesson.teachingGoals) {
            try {
                const goals = JSON.parse(lesson.teachingGoals);
                goals.forEach((goal, index) => {
                    content += `${index + 1}. ${goal}\n`;
                });
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

        // 设置响应头
        res.setHeader('Content-Type', 'application/msword');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(lesson.title)}.doc"`);
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
