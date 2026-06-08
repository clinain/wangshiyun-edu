/**
 * 评论控制器
 * 处理资源和作品集评论的增删查
 */

const Comment = require('../models/Comment');

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
