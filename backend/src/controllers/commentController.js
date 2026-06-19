/**
 * 评论控制器
 * 处理资源和作品集评论的增删查
 */

const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Resource = require('../models/Resource');
const Portfolio = require('../models/Portfolio');

/**
 * 获取评论列表（支持资源和作品集）
 * GET /api/resources/:id/comments 或 GET /api/portfolios/:id/comments
 */
const getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, pageSize = 20, type: commentType } = req.query;
        const isPortfolio = req.path.includes('/portfolios/');

        const filter = isPortfolio ? { portfolioId: id } : { resourceId: id };
        const result = await Comment.list(filter, {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            commentType
        });

        res.json({
            success: true,
            code: 200,
            data: result
        });
    } catch (error) {
        console.error('获取评论列表失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取评论列表失败'
        });
    }
};

/**
 * 获取评论回复列表
 * GET /api/comments/:commentId/replies
 */
const getReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { page = 1, pageSize = 20 } = req.query;

        const result = await Comment.listReplies(commentId, {
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });

        res.json({
            success: true,
            code: 200,
            data: result
        });
    } catch (error) {
        console.error('获取回复列表失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取回复列表失败'
        });
    }
};

/**
 * 发表评论（支持资源和作品集）
 * POST /api/resources/:id/comments 或 POST /api/portfolios/:id/comments
 */
const createComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { content, commentType = 'comment', parentId = null } = req.body;
        const isPortfolio = req.path.includes('/portfolios/');

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '评论内容不能为空'
            });
        }

        const validTypes = ['comment', 'question', 'review'];
        if (!validTypes.includes(commentType)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '无效的评论类型'
            });
        }

        const commentData = {
            userId,
            parentId: parentId ? parseInt(parentId) : null,
            content: content.trim(),
            commentType
        };

        if (isPortfolio) {
            commentData.portfolioId = parseInt(id);
        } else {
            commentData.resourceId = parseInt(id);
        }

        const comment = await Comment.create(commentData);

        // ===== 创建通知 =====
        try {
            let notifyUserId = null;
            let notifyTitle = '';
            let notifyContent = content.trim();
            let resourceId = null;
            let portfolioId = null;
            const senderId = userId;

            // 从数据库获取评论者的显示名
            let senderName = '用户';
            try {
                const senderUser = await require('../models/User').findById(userId);
                if (senderUser && senderUser.name) {
                    senderName = senderUser.name;
                }
            } catch (e) {
                // 查询失败时使用默认名
            }

            if (parentId) {
                // 回复评论：通知被回复的评论作者
                const parentCommentSql = `SELECT user_id, resource_id, portfolio_id FROM resource_comments WHERE id = ?`;
                const parentResults = await require('../config/database').query(parentCommentSql, [parseInt(parentId)]);
                if (parentResults.length > 0) {
                    const parentComment = parentResults[0];
                    notifyUserId = parentComment.user_id;
                    resourceId = parentComment.resource_id;
                    portfolioId = parentComment.portfolio_id;
                    notifyTitle = `${senderName} 回复了你的评论`;
                }
            } else if (isPortfolio) {
                // 作品集评论：通知作品集创建者
                const portfolio = await Portfolio.findById(parseInt(id));
                if (portfolio && portfolio.userId !== userId) {
                    notifyUserId = portfolio.userId;
                    portfolioId = parseInt(id);
                    notifyTitle = `${senderName} 评论了你的作品集「${portfolio.name}」`;
                }
            } else {
                // 资源评论：通知资源上传者
                const resource = await Resource.findById(parseInt(id));
                if (resource && resource.uploaderId !== userId) {
                    notifyUserId = resource.uploaderId;
                    resourceId = parseInt(id);
                    notifyTitle = `${senderName} 评论了你的资源「${resource.title}」`;
                }
            }

            if (notifyUserId) {
                await Notification.create({
                    userId: notifyUserId,
                    senderId,
                    type: 'comment',
                    title: notifyTitle,
                    content: notifyContent.length > 100 ? notifyContent.substring(0, 100) + '...' : notifyContent,
                    resourceId,
                    portfolioId,
                    commentId: comment.id
                });
            }
        } catch (notifyError) {
            // 通知创建失败不影响评论发表
            console.error('创建评论通知失败:', notifyError);
        }

        res.json({
            success: true,
            code: 200,
            data: comment,
            message: '评论成功'
        });
    } catch (error) {
        console.error('发表评论失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '发表评论失败'
        });
    }
};

/**
 * 删除评论
 * DELETE /api/comments/:commentId
 */
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        const deleted = await Comment.delete(parseInt(commentId), userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '评论不存在或无权删除'
            });
        }

        res.json({
            success: true,
            code: 200,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '删除评论失败'
        });
    }
};

/**
 * 获取评论统计（支持资源和作品集）
 * GET /api/resources/:id/comments/stats 或 GET /api/portfolios/:id/comments/stats
 */
const getCommentStats = async (req, res) => {
    try {
        const { id } = req.params;
        const isPortfolio = req.path.includes('/portfolios/');

        const filter = isPortfolio ? { portfolioId: id } : { resourceId: id };
        const stats = await Comment.getStats(filter);

        res.json({
            success: true,
            code: 200,
            data: stats
        });
    } catch (error) {
        console.error('获取评论统计失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取评论统计失败'
        });
    }
};

module.exports = {
    getComments,
    getReplies,
    createComment,
    deleteComment,
    getCommentStats
};
