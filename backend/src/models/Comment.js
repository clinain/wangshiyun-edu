/**
 * 评论模型
 * 提供资源和作品集评论的数据库操作方法
 */

const db = require('../config/database');

class Comment {
    /**
     * 创建评论
     * @param {Object} commentData 评论数据
     * @returns {Promise<Object>} 创建的评论信息
     */
    static async create(commentData) {
        const {
            resourceId = null,
            portfolioId = null,
            userId,
            parentId = null,
            content,
            commentType = 'comment'
        } = commentData;

        const sql = `
            INSERT INTO resource_comments (resource_id, portfolio_id, user_id, parent_id, content, comment_type, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
        `;

        try {
            const result = await db.query(sql, [resourceId, portfolioId, userId, parentId, content, commentType]);
            return { id: result.insertId, ...commentData, createdAt: new Date() };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 获取评论列表（支持分页，带用户信息）
     * @param {Object} filter 筛选条件 { resourceId, portfolioId }
     * @param {Object} options 分页和过滤选项
     * @returns {Promise<Object>} 评论列表和总数
     */
    static async list(filter, options = {}) {
        const { page = 1, pageSize = 20, commentType = null } = options;
        const offset = (page - 1) * pageSize;

        let whereClause = 'WHERE c.status = 1 AND c.parent_id IS NULL';
        let params = [];

        if (filter.resourceId) {
            whereClause += ' AND c.resource_id = ?';
            params.push(filter.resourceId);
        }
        if (filter.portfolioId) {
            whereClause += ' AND c.portfolio_id = ?';
            params.push(filter.portfolioId);
        }

        if (commentType && commentType !== 'all') {
            whereClause += ' AND c.comment_type = ?';
            params.push(commentType);
        }

        const countSql = `SELECT COUNT(*) as total FROM resource_comments c ${whereClause}`;
        const listSql = `
            SELECT 
                c.id,
                c.resource_id as resourceId,
                c.portfolio_id as portfolioId,
                c.user_id as userId,
                c.parent_id as parentId,
                c.content,
                c.comment_type as commentType,
                c.like_count as likeCount,
                c.created_at as createdAt,
                c.updated_at as updatedAt,
                u.name as userName,
                u.avatar as userAvatar
            FROM resource_comments c
            LEFT JOIN users u ON c.user_id = u.id
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `;

        try {
            const countResult = await db.query(countSql, params);
            const total = countResult[0]?.total || 0;

            params.push(pageSize, offset);
            const comments = await db.query(listSql, params);

            // 获取每个顶级评论的回复数和最近回复
            for (let comment of comments) {
                const replyCountSql = `SELECT COUNT(*) as count FROM resource_comments WHERE parent_id = ? AND status = 1`;
                const replyCountResult = await db.query(replyCountSql, [comment.id]);
                comment.replyCount = replyCountResult[0]?.count || 0;

                const recentRepliesSql = `
                    SELECT 
                        c.id,
                        c.content,
                        c.comment_type as commentType,
                        c.created_at as createdAt,
                        u.name as userName,
                        u.avatar as userAvatar
                    FROM resource_comments c
                    LEFT JOIN users u ON c.user_id = u.id
                    WHERE c.parent_id = ? AND c.status = 1
                    ORDER BY c.created_at ASC
                    LIMIT 3
                `;
                comment.recentReplies = await db.query(recentRepliesSql, [comment.id]);
            }

            return {
                comments,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 兼容旧接口：获取资源的评论列表
     */
    static async listByResource(resourceId, options = {}) {
        return this.list({ resourceId }, options);
    }

    /**
     * 兼容旧接口：获取作品集的评论列表
     */
    static async listByPortfolio(portfolioId, options = {}) {
        return this.list({ portfolioId }, options);
    }

    /**
     * 获取评论的回复列表
     * @param {number} parentId 父评论ID
     * @param {Object} options 分页选项
     * @returns {Promise<Object>} 回复列表
     */
    static async listReplies(parentId, options = {}) {
        const { page = 1, pageSize = 20 } = options;
        const offset = (page - 1) * pageSize;

        const countSql = `SELECT COUNT(*) as total FROM resource_comments WHERE parent_id = ? AND status = 1`;
        const listSql = `
            SELECT 
                c.id,
                c.content,
                c.comment_type as commentType,
                c.like_count as likeCount,
                c.created_at as createdAt,
                u.name as userName,
                u.avatar as userAvatar
            FROM resource_comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.parent_id = ? AND c.status = 1
            ORDER BY c.created_at ASC
            LIMIT ? OFFSET ?
        `;

        try {
            const countResult = await db.query(countSql, [parentId]);
            const total = countResult[0]?.total || 0;

            const replies = await db.query(listSql, [parentId, pageSize, offset]);

            return {
                replies,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 删除评论（软删除，将 status 设为 0）
     * @param {number} commentId 评论ID
     * @param {number} userId 操作用户ID（验证权限）
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async delete(commentId, userId) {
        const sql = `UPDATE resource_comments SET status = 0 WHERE id = ? AND user_id = ?`;
        try {
            const result = await db.query(sql, [commentId, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 获取评论统计
     * @param {Object} filter 筛选条件 { resourceId, portfolioId }
     * @returns {Promise<Object>} 评论统计信息
     */
    static async getStats(filter) {
        let whereClause = 'WHERE status = 1';
        let params = [];

        if (filter.resourceId) {
            whereClause += ' AND resource_id = ?';
            params.push(filter.resourceId);
        }
        if (filter.portfolioId) {
            whereClause += ' AND portfolio_id = ?';
            params.push(filter.portfolioId);
        }

        const sql = `
            SELECT 
                COUNT(*) as totalComments,
                SUM(CASE WHEN comment_type = 'question' THEN 1 ELSE 0 END) as totalQuestions,
                SUM(CASE WHEN comment_type = 'review' THEN 1 ELSE 0 END) as totalReviews,
                SUM(CASE WHEN comment_type = 'comment' THEN 1 ELSE 0 END) as totalDiscussions
            FROM resource_comments
            ${whereClause}
        `;

        try {
            const result = await db.query(sql, params);
            return result[0] || { totalComments: 0, totalQuestions: 0, totalReviews: 0, totalDiscussions: 0 };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Comment;
