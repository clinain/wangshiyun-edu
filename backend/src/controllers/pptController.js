/**
 * PPT 控制器
 * 处理PPT的生成和管理操作
 */

const PPTRecord = require('../models/PPTRecord');
const Lesson = require('../models/Lesson');
const PPTService = require('../services/pptService');
const AIService = require('../services/aiService');
const HtmlDeckService = require('../services/htmlDeckService');

const parsePPTContent = (contentJson) => {
    if (!contentJson) {
        console.log('❌ contentJson为空');
        return null;
    }
    try {
        const parsed = JSON.parse(contentJson);
        console.log('✅ 解析成功，pages长度:', parsed.pages?.length || 0);
        return parsed;
    } catch (e) {
        console.log('❌ 解析失败:', e.message);
        return contentJson;
    }
};

const ensureHtmlDeck = (pptData, theme) => {
    if (!pptData || typeof pptData !== 'object') return pptData;
    return HtmlDeckService.withHtmlDeck(pptData, theme);
};

const encodeDownloadName = (filename) => encodeURIComponent(filename).replace(/%20/g, '+');

/**
 * 从教案生成PPT
 * POST /api/ppt/generate
 */
const generateFromLesson = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { lessonId, templateId, useAI = false, theme } = req.body;

        // 验证用户登录状态
        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '用户未登录，请先登录'
            });
        }

        // 验证必填字段
        if (!lessonId) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供教案ID（lessonId）'
            });
        }

        // 验证lessonId格式
        if (isNaN(parseInt(lessonId))) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '教案ID必须是数字'
            });
        }

        const lessonIdNum = parseInt(lessonId);

        // 查询教案
        console.log(`🔍 查询教案: ${lessonIdNum}`);
        const lesson = await Lesson.findById(lessonIdNum);

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
                message: '无权访问此教案'
            });
        }

        console.log(`📝 正在生成PPT: ${lesson.title}`);

        let pptData;

        // 判断是否使用AI生成PPT
        if (useAI && AIService.isAvailable()) {
            console.log('🤖 使用AI生成PPT...');
            try {
                pptData = await AIService.generatePPTContent(lesson);
                console.log('✅ AI生成PPT成功');
            } catch (aiError) {
                console.warn(`⚠️ AI生成PPT失败，使用默认模板: ${aiError.message}`);
                // AI失败时回退到默认PPT生成
                pptData = PPTService.generatePPT(lesson);
            }
        } else {
            // 使用默认PPT服务生成
            console.log('📋 使用默认模板生成PPT...');
            pptData = PPTService.generatePPT(lesson);
        }

        pptData = ensureHtmlDeck(pptData, theme);

        // 保存PPT记录
        const pptRecord = await PPTRecord.create({
            userId,
            lessonId: lessonIdNum,
            title: pptData.title,
            contentJson: JSON.stringify(pptData),
            pageCount: pptData.pageCount
        });

        console.log(`✅ PPT生成成功，ID: ${pptRecord.id}`);

        res.status(201).json({
            success: true,
            message: 'PPT生成成功',
            data: {
                id: pptRecord.id,
                title: pptData.title,
                pageCount: pptData.pageCount,
                pages: pptData.pages,
                html: pptData.html,
                format: pptData.format,
                generatedByAI: useAI && AIService.isAvailable()
            }
        });

    } catch (error) {
        console.error('❌ 生成PPT错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: `生成PPT失败: ${error.message}`,
            errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * 同步更新PPT（根据教案）
 * POST /api/ppt/sync
 * 如果教案已有PPT记录则更新，否则创建新记录
 */
const syncFromLesson = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { lessonId, templateId, useAI = false, theme } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '用户未登录，请先登录'
            });
        }

        if (!lessonId) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供教案ID（lessonId）'
            });
        }

        const lessonIdNum = parseInt(lessonId);

        const lesson = await Lesson.findById(lessonIdNum);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '教案不存在'
            });
        }

        if (lesson.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权访问此教案'
            });
        }

        console.log(`🔄 正在同步PPT: ${lesson.title}`);

        let pptData;
        if (useAI && AIService.isAvailable()) {
            console.log('🤖 使用AI同步PPT...');
            try {
                pptData = await AIService.generatePPTContent(lesson);
            } catch (aiError) {
                console.warn(`⚠️ AI同步失败，使用默认模板: ${aiError.message}`);
                pptData = PPTService.generatePPT(lesson);
            }
        } else {
            console.log('📋 使用默认模板同步PPT...');
            pptData = PPTService.generatePPT(lesson);
        }

        // 调试：检查生成的PPT数据
        console.log('🔍 生成的PPT数据:', JSON.stringify({
            title: pptData.title,
            pageCount: pptData.pageCount,
            pagesLength: pptData.pages?.length || 0,
            hasPages: !!pptData.pages
        }));

        pptData = ensureHtmlDeck(pptData, theme);

        // 调试：检查处理后的PPT数据
        console.log('🔍 处理后的PPT数据:', JSON.stringify({
            title: pptData.title,
            pageCount: pptData.pageCount,
            pagesLength: pptData.pages?.length || 0,
            hasPages: !!pptData.pages
        }));

        // 确保 pageCount 有值
        const pageCount = pptData.pageCount || (pptData.pages ? pptData.pages.length : 0);
        console.log(`📊 PPT页数: ${pageCount}`);

        const existingPPT = await PPTRecord.findByLessonId(lessonIdNum);
        
        let pptRecord;
        if (existingPPT) {
            console.log(`📝 更新已有PPT记录: ${existingPPT.id}`);
            pptRecord = await PPTRecord.update(existingPPT.id, {
                title: pptData.title,
                contentJson: JSON.stringify(pptData),
                pageCount: pageCount
            });
            if (!pptRecord) {
                throw new Error('更新PPT记录失败');
            }
        } else {
            console.log(`🆕 创建新PPT记录`);
            pptRecord = await PPTRecord.create({
                userId,
                lessonId: lessonIdNum,
                title: pptData.title,
                contentJson: JSON.stringify(pptData),
                pageCount: pageCount
            });
        }

        console.log(`✅ PPT同步成功，ID: ${pptRecord.id}`);

        console.log('🔍 准备解析contentJson:', pptRecord.contentJson?.substring(0, 100) + '...');
        const content = ensureHtmlDeck(parsePPTContent(pptRecord.contentJson), theme);

        console.log('🔍 content数据:', JSON.stringify({
            hasContent: !!content,
            hasPages: content && !!content.pages,
            pagesLength: content && content.pages ? content.pages.length : 0,
            pageCount: content && content.pageCount
        }));

        console.log('🔍 pptRecord数据:', JSON.stringify({
            id: pptRecord.id,
            lessonId: pptRecord.lessonId,
            title: pptRecord.title,
            pageCount: pptRecord.pageCount,
            createdAt: pptRecord.createdAt,
            updatedAt: pptRecord.updatedAt
        }));

        res.json({
            success: true,
            message: 'PPT同步成功',
            data: {
                id: pptRecord.id,
                lessonId: pptRecord.lessonId,
                title: pptRecord.title,
                pageCount: pptRecord.pageCount,
                status: pptRecord.pageCount > 0 ? 'completed' : 'pending',
                content: content,
                createdAt: pptRecord.createdAt,
                updatedAt: pptRecord.updatedAt
            }
        });

    } catch (error) {
        console.error('❌ 同步PPT错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: `同步PPT失败: ${error.message}`
        });
    }
};

/**
 * 获取PPT列表
 * GET /api/ppt
 */
const getPPTList = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { page = 1, pageSize = 10 } = req.query;

        const result = await PPTRecord.findByUser(userId, {
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });

        const ppts = result.records.map(ppt => ({
            id: ppt.id,
            userId: ppt.user_id,
            lessonId: ppt.lesson_id,
            title: ppt.title,
            status: ppt.page_count > 0 ? 'completed' : 'pending',
            pageCount: ppt.page_count,
            createdAt: ppt.created_at,
            updatedAt: ppt.updated_at
        }));

        res.json({
            success: true,
            message: '获取PPT列表成功',
            data: {
                ppts,
                pagination: result.pagination
            }
        });

    } catch (error) {
        console.error('获取PPT列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取PPT详情
 * GET /api/ppt/:id
 */
const getPPTDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        console.log(`获取PPT详情: id=${id}, userId=${userId}`);

        // 验证ID格式
        const parsedId = parseInt(id);
        if (isNaN(parsedId) || parsedId <= 0) {
            console.log(`无效的PPT ID: ${id}`);
            return res.status(400).json({
                success: false,
                code: 400,
                message: '无效的PPT ID'
            });
        }

        const ppt = await PPTRecord.findById(parsedId);

        if (!ppt) {
            console.log(`PPT ${parsedId} 不存在`);
            return res.status(404).json({
                success: false,
                code: 404,
                message: 'PPT不存在'
            });
        }

        console.log(`PPT详情: id=${ppt.id}, userId=${ppt.userId}`);

        // 登录用户可以查看所有PPT
        // 未登录用户通过路由守卫处理

        // 解析content_json
        let content = ensureHtmlDeck(parsePPTContent(ppt.contentJson));
        if (content) {
            console.log('✅ PPT内容解析成功');
        } else {
            console.warn('⚠️ PPT内容为空');
        }

        res.json({
            success: true,
            message: '获取PPT详情成功',
            data: {
                id: ppt.id,
                title: ppt.title,
                lessonId: ppt.lessonId,
                content,
                pageCount: ppt.pageCount,
                createdAt: ppt.createdAt,
                updatedAt: ppt.updatedAt
            }
        });

    } catch (error) {
        console.error('获取PPT详情错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 更新PPT
 * PUT /api/ppt/:id
 */
const updatePPT = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const updateData = req.body;

        // 查询PPT
        const ppt = await PPTRecord.findById(id);

        if (!ppt) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: 'PPT不存在'
            });
        }

        // 检查权限
        if (ppt.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权修改此PPT'
            });
        }

        // 如果更新了内容，重新计算页数
        if (updateData.content) {
            const content = typeof updateData.content === 'string'
                ? JSON.parse(updateData.content)
                : updateData.content;
            const contentWithHtml = ensureHtmlDeck(content);
            updateData.contentJson = JSON.stringify(contentWithHtml);
            updateData.pageCount = contentWithHtml.pages ? contentWithHtml.pages.length : 0;
        }

        // 更新PPT
        const success = await PPTRecord.update(id, updateData);

        if (!success) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '更新失败，没有要更新的字段'
            });
        }

        // 返回更新后的PPT
        const updatedPPT = await PPTRecord.findById(id);

        res.json({
            success: true,
            message: 'PPT更新成功',
            data: updatedPPT
        });

    } catch (error) {
        console.error('更新PPT错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 删除PPT
 * DELETE /api/ppt/:id
 */
const deletePPT = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // 查询PPT
        const ppt = await PPTRecord.findById(id);

        if (!ppt) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: 'PPT不存在'
            });
        }

        // 检查权限
        if (ppt.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权删除此PPT'
            });
        }

        // 删除PPT
        const success = await PPTRecord.delete(id);

        if (!success) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '删除失败'
            });
        }

        res.json({
            success: true,
            message: 'PPT删除成功'
        });

    } catch (error) {
        console.error('删除PPT错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 导出PPT
 * GET /api/ppt/:id/export
 */
const exportPPT = async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'json' } = req.query;
        const userId = req.user?.id;

        const ppt = await PPTRecord.findById(id);

        if (!ppt) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: 'PPT不存在'
            });
        }

        // 检查权限
        if (ppt.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权导出此PPT'
            });
        }

        // 解析内容
        const content = ensureHtmlDeck(parsePPTContent(ppt.contentJson));

        if (format === 'html') {
            const html = content.html || HtmlDeckService.toHTML(content);
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeDownloadName(`${ppt.title}.html`)}`);
            res.send(html);
        } else {
            res.json({
                success: true,
                data: content
            });
        }

    } catch (error) {
        console.error('导出PPT错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '导出失败'
        });
    }
};

/**
 * 检查PPT标题是否已存在
 * GET /api/ppt/check-title
 */
const checkTitle = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '用户未登录，请先登录'
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供PPT标题'
            });
        }

        const existing = await PPTRecord.findByUserAndTitle(userId, title.trim());

        res.json({
            success: true,
            data: {
                exists: !!existing,
                pptId: existing ? existing.id : null,
                title: existing ? existing.title : null
            }
        });
    } catch (error) {
        console.error('❌ 检查PPT标题错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: `检查标题失败: ${error.message}`
        });
    }
};

module.exports = {
    generateFromLesson,
    syncFromLesson,
    checkTitle,
    getPPTList,
    getPPTDetail,
    updatePPT,
    deletePPT,
    exportPPT
};
