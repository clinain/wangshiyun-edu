/**
 * 作品集控制器
 * 处理作品集的创建、管理和导出
 */

const Portfolio = require('../models/Portfolio');
const Lesson = require('../models/Lesson');
const PPTRecord = require('../models/PPTRecord');
const ExportService = require('../services/exportService');

/**
 * 获取公开作品集列表
 * GET /api/portfolios/public
 */
const getPublicPortfolios = async (req, res) => {
    try {
        const { page = 1, pageSize = 10 } = req.query;

        const result = await Portfolio.findPublic({
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });

        res.json({
            success: true,
            message: '获取公开作品集列表成功',
            data: {
                portfolios: result.portfolios,
                pagination: result.pagination
            }
        });

    } catch (error) {
        console.error('获取公开作品集列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 创建作品集
 * POST /api/portfolios
 */
const createPortfolio = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, description, lessonIds, pptIds, coverUrl, isPublic } = req.body;

        // 验证必填字段
        if (!name) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供作品集名称'
            });
        }

        // 验证教案ID列表
        let validLessonIds = [];
        if (lessonIds && lessonIds.length > 0) {
            for (const lessonId of lessonIds) {
                const lesson = await Lesson.findById(lessonId);
                console.log(`验证教案 ${lessonId}:`, lesson ? `userId=${lesson.userId}, 当前用户=${userId}` : '未找到');
                if (lesson && lesson.userId === userId) {
                    validLessonIds.push(lessonId);
                }
            }
        }

        // 验证PPT ID列表
        let validPptIds = [];
        if (pptIds && pptIds.length > 0) {
            for (const pptId of pptIds) {
                const ppt = await PPTRecord.findById(pptId);
                console.log(`验证PPT ${pptId}:`, ppt ? `userId=${ppt.userId}, 当前用户=${userId}` : '未找到');
                if (ppt && ppt.userId === userId) {
                    validPptIds.push(pptId);
                }
            }
        }

        console.log(`创建作品集: name=${name}, validLessonIds=${JSON.stringify(validLessonIds)}, validPptIds=${JSON.stringify(validPptIds)}`);

        // 创建作品集
        const portfolio = await Portfolio.create({
            userId,
            name,
            description,
            lessonIds: validLessonIds,
            pptIds: validPptIds,
            coverUrl,
            isPublic: isPublic || false
        });

        console.log(`✅ 作品集创建成功: ${name}`);

        res.status(201).json({
            success: true,
            message: '作品集创建成功',
            data: portfolio
        });

    } catch (error) {
        console.error('创建作品集错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: `创建失败: ${error.message}`
        });
    }
};

/**
 * 获取作品集列表
 * GET /api/portfolios
 */
const getPortfolioList = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { page = 1, pageSize = 10 } = req.query;

        const result = await Portfolio.findByUser(userId, {
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });

        res.json({
            success: true,
            message: '获取作品集列表成功',
            data: {
                portfolios: result.portfolios,
                pagination: result.pagination
            }
        });

    } catch (error) {
        console.error('获取作品集列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取作品集详情
 * GET /api/portfolios/:id
 */
const getPortfolioDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const portfolio = await Portfolio.findById(id);

        if (!portfolio) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '作品集不存在'
            });
        }

        // 检查访问权限
        if (!portfolio.isPublic && portfolio.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权访问此作品集'
            });
        }

        // 增加浏览次数
        await Portfolio.incrementViewCount(id);

        // 获取教案详情
        const lessons = [];
        if (portfolio.lessonIds && portfolio.lessonIds.length > 0) {
            for (const lessonId of portfolio.lessonIds) {
                const lesson = await Lesson.findById(lessonId);
                if (lesson) {
                    lessons.push({
                        id: lesson.id,
                        title: lesson.title,
                        subject: lesson.subject,
                        grade: lesson.grade,
                        status: lesson.status
                    });
                }
            }
        }

        // 获取PPT详情
        const pptList = [];
        if (portfolio.pptIds && portfolio.pptIds.length > 0) {
            for (const pptId of portfolio.pptIds) {
                const ppt = await PPTRecord.findById(pptId);
                if (ppt) {
                    pptList.push({
                        id: ppt.id,
                        title: ppt.title,
                        pageCount: ppt.pageCount
                    });
                }
            }
        }

        res.json({
            success: true,
            message: '获取作品集详情成功',
            data: {
                ...portfolio,
                lessons,
                pptList
            }
        });

    } catch (error) {
        console.error('获取作品集详情错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 更新作品集
 * PUT /api/portfolios/:id
 */
const updatePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const updateData = req.body;

        const portfolio = await Portfolio.findById(id);

        if (!portfolio) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '作品集不存在'
            });
        }

        // 检查权限
        if (portfolio.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权修改此作品集'
            });
        }

        // 验证并更新教案ID
        if (updateData.lessonIds !== undefined) {
            let validLessonIds = [];
            for (const lessonId of updateData.lessonIds) {
                const lesson = await Lesson.findById(lessonId);
                if (lesson && lesson.userId === userId) {
                    validLessonIds.push(lessonId);
                }
            }
            updateData.lessonIds = validLessonIds;
        }

        // 验证并更新PPT ID
        if (updateData.pptIds !== undefined) {
            let validPptIds = [];
            for (const pptId of updateData.pptIds) {
                const ppt = await PPTRecord.findById(pptId);
                if (ppt && ppt.userId === userId) {
                    validPptIds.push(pptId);
                }
            }
            updateData.pptIds = validPptIds;
        }

        // 更新作品集
        const success = await Portfolio.update(id, updateData);

        if (!success) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '更新失败，没有要更新的字段'
            });
        }

        // 返回更新后的作品集
        const updatedPortfolio = await Portfolio.findById(id);

        res.json({
            success: true,
            message: '作品集更新成功',
            data: updatedPortfolio
        });

    } catch (error) {
        console.error('更新作品集错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 删除作品集
 * DELETE /api/portfolios/:id
 */
const deletePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const portfolio = await Portfolio.findById(id);

        if (!portfolio) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '作品集不存在'
            });
        }

        // 检查权限
        if (portfolio.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权删除此作品集'
            });
        }

        // 删除作品集
        const success = await Portfolio.delete(id);

        if (!success) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '删除失败'
            });
        }

        res.json({
            success: true,
            message: '作品集删除成功'
        });

    } catch (error) {
        console.error('删除作品集错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 分享作品集
 * POST /api/portfolios/:id/share
 */
const sharePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const portfolio = await Portfolio.findById(id);

        if (!portfolio) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '作品集不存在'
            });
        }

        // 检查权限
        if (portfolio.userId !== userId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权分享此作品集'
            });
        }

        // 增加分享次数
        await Portfolio.incrementShareCount(id);

        // 生成分享链接
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const shareUrl = `${baseUrl}/portfolios/${id}/view`;

        res.json({
            success: true,
            message: '分享成功',
            data: {
                shareUrl,
                shareCount: portfolio.shareCount + 1
            }
        });

    } catch (error) {
        console.error('分享作品集错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '分享失败'
        });
    }
};

/**
 * 收藏/取消收藏作品集
 * POST /api/portfolios/:id/favorite
 */
const togglePortfolioFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        const portfolio = await Portfolio.findById(id);

        if (!portfolio) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '作品集不存在'
            });
        }

        const Favorite = require('../models/Favorite');
        const isFavorited = await Favorite.isPortfolioFavorited(userId, id);

        if (isFavorited) {
            await Favorite.deletePortfolioFavorite(userId, id);
            res.json({
                success: true,
                message: '已取消收藏',
                data: { isFavorited: false }
            });
        } else {
            await Favorite.createPortfolioFavorite(userId, id);
            res.json({
                success: true,
                message: '收藏成功',
                data: { isFavorited: true }
            });
        }

    } catch (error) {
        console.error('收藏作品集错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '操作失败'
        });
    }
};

/**
 * 导出作品集
 * GET /api/portfolios/:id/export
 */
const exportPortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const portfolio = await Portfolio.findById(id);

        if (!portfolio) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '作品集不存在'
            });
        }

        // 检查权限：作品集所有者或公开作品集均可下载
        if (portfolio.userId !== userId && !portfolio.isPublic) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权导出此作品集'
            });
        }

        console.log(`📦 正在导出作品集: ${portfolio.name}`);

        // 导出为ZIP
        const zipPath = await ExportService.exportToZip(id);

        // 发送文件
        res.download(zipPath, `${portfolio.name}.zip`, (err) => {
            if (err) {
                console.error('发送文件失败:', err);
            }
        });

    } catch (error) {
        console.error('导出作品集错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: `导出失败: ${error.message}`
        });
    }
};

module.exports = {
    getPublicPortfolios,
    createPortfolio,
    getPortfolioList,
    getPortfolioDetail,
    updatePortfolio,
    deletePortfolio,
    sharePortfolio,
    togglePortfolioFavorite,
    exportPortfolio
};
