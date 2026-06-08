/**
 * 收藏模型
 * 支持资源和作品集收藏
 */

const db = require('../config/database');

class Favorite {
    /**
     * 添加资源收藏
     * @param {number} userId 用户ID
     * @param {number} resourceId 资源ID
     * @returns {Promise<Object>} 收藏记录
     */
    static async createResourceFavorite(userId, resourceId) {
        const existing = await this.findResourceFavorite(userId, resourceId);
        if (existing) {
            return existing;
        }

        const sql = `
            INSERT INTO user_favorites (user_id, resource_id, favorite_type, created_at)
            VALUES (?, ?, 'resource', NOW())
        `;

        try {
            const result = await db.query(sql, [userId, resourceId]);
            return {
                id: result.insertId,
                userId,
                resourceId,
                favoriteType: 'resource'
            };
        } catch (error) {
            console.error('Favorite.createResourceFavorite 错误:', error);
            throw error;
        }
    }

    /**
     * 添加作品集收藏
     * @param {number} userId 用户ID
     * @param {number} portfolioId 作品集ID
     * @returns {Promise<Object>} 收藏记录
     */
    static async createPortfolioFavorite(userId, portfolioId) {
        const existing = await this.findPortfolioFavorite(userId, portfolioId);
        if (existing) {
            return existing;
        }

        const sql = `
            INSERT INTO user_favorites (user_id, portfolio_id, favorite_type, created_at)
            VALUES (?, ?, 'portfolio', NOW())
        `;

        try {
            const result = await db.query(sql, [userId, portfolioId]);
            return {
                id: result.insertId,
                userId,
                portfolioId,
                favoriteType: 'portfolio'
            };
        } catch (error) {
            console.error('Favorite.createPortfolioFavorite 错误:', error);
            throw error;
        }
    }

    /**
     * 取消资源收藏
     * @param {number} userId 用户ID
     * @param {number} resourceId 资源ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async deleteResourceFavorite(userId, resourceId) {
        const sql = `
            DELETE FROM user_favorites
            WHERE user_id = ? AND resource_id = ? AND favorite_type = 'resource'
        `;

        try {
            const result = await db.query(sql, [userId, resourceId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Favorite.deleteResourceFavorite 错误:', error);
            throw error;
        }
    }

    /**
     * 取消作品集收藏
     * @param {number} userId 用户ID
     * @param {number} portfolioId 作品集ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async deletePortfolioFavorite(userId, portfolioId) {
        const sql = `
            DELETE FROM user_favorites
            WHERE user_id = ? AND portfolio_id = ? AND favorite_type = 'portfolio'
        `;

        try {
            const result = await db.query(sql, [userId, portfolioId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Favorite.deletePortfolioFavorite 错误:', error);
            throw error;
        }
    }

    /**
     * 查询用户的资源收藏记录
     * @param {number} userId 用户ID
     * @param {number} resourceId 资源ID
     * @returns {Promise<Object|null>} 收藏记录
     */
    static async findResourceFavorite(userId, resourceId) {
        const sql = `
            SELECT id, user_id, resource_id, portfolio_id, favorite_type, created_at
            FROM user_favorites
            WHERE user_id = ? AND resource_id = ? AND favorite_type = 'resource'
        `;

        try {
            const results = await db.query(sql, [userId, resourceId]);
            if (results.length === 0) {
                return null;
            }

            const favorite = results[0];
            return {
                id: favorite.id,
                userId: favorite.user_id,
                resourceId: favorite.resource_id,
                favoriteType: favorite.favorite_type,
                createdAt: favorite.created_at
            };
        } catch (error) {
            console.error('Favorite.findResourceFavorite 错误:', error);
            throw error;
        }
    }

    /**
     * 查询用户的作品集收藏记录
     * @param {number} userId 用户ID
     * @param {number} portfolioId 作品集ID
     * @returns {Promise<Object|null>} 收藏记录
     */
    static async findPortfolioFavorite(userId, portfolioId) {
        const sql = `
            SELECT id, user_id, resource_id, portfolio_id, favorite_type, created_at
            FROM user_favorites
            WHERE user_id = ? AND portfolio_id = ? AND favorite_type = 'portfolio'
        `;

        try {
            const results = await db.query(sql, [userId, portfolioId]);
            if (results.length === 0) {
                return null;
            }

            const favorite = results[0];
            return {
                id: favorite.id,
                userId: favorite.user_id,
                portfolioId: favorite.portfolio_id,
                favoriteType: favorite.favorite_type,
                createdAt: favorite.created_at
            };
        } catch (error) {
            console.error('Favorite.findPortfolioFavorite 错误:', error);
            throw error;
        }
    }

    /**
     * 查询用户的所有收藏（分页）- 返回资源和作品集
     * @param {number} userId 用户ID
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 收藏列表和分页信息
     */
    static async findByUser(userId, options = {}) {
        const { page = 1, pageSize = 10, type = 'all' } = options;
        const offset = (page - 1) * pageSize;

        try {
            let whereClause = 'WHERE f.user_id = ?';
            const params = [userId];

            if (type === 'resource') {
                whereClause += " AND f.favorite_type = 'resource'";
            } else if (type === 'portfolio') {
                whereClause += " AND f.favorite_type = 'portfolio'";
            }

            const countSql = `SELECT COUNT(*) as total FROM user_favorites f ${whereClause}`;
            const [countResult] = await db.query(countSql, params);
            const total = countResult.total;

            const listSql = `
                SELECT f.id, f.user_id, f.resource_id, f.portfolio_id, f.favorite_type, f.created_at,
                       r.id as resource_id, r.title, r.type, r.category,
                       r.file_url, r.cover_url, r.description,
                       r.file_size, r.file_format, r.subject, r.grade, r.download_count, r.favorite_count as resource_favorite_count,
                       p.id as portfolio_id, p.name as portfolio_name, p.description as portfolio_description,
                       p.lesson_ids, p.ppt_ids, p.is_public as portfolio_is_public, p.share_count, p.view_count as portfolio_view_count
                FROM user_favorites f
                LEFT JOIN resources r ON f.resource_id = r.id AND f.favorite_type = 'resource'
                LEFT JOIN portfolios p ON f.portfolio_id = p.id AND f.favorite_type = 'portfolio'
                ${whereClause}
                ORDER BY f.created_at DESC
                LIMIT ? OFFSET ?
            `;

            const favorites = await db.query(listSql, [...params, pageSize, offset]);

            const items = favorites.map(fav => {
                if (fav.favorite_type === 'resource' && fav.resource_id) {
                    return {
                        favoriteId: fav.id,
                        favoriteType: 'resource',
                        favoritedAt: fav.created_at,
                        resource: {
                            id: fav.resource_id,
                            title: fav.title,
                            type: fav.type,
                            category: fav.category,
                            fileUrl: fav.file_url,
                            coverUrl: fav.cover_url,
                            description: fav.description,
                            fileSize: fav.file_size,
                            fileFormat: fav.file_format,
                            subject: fav.subject,
                            grade: fav.grade,
                            downloadCount: fav.download_count || 0,
                            favoriteCount: fav.resource_favorite_count || 0
                        }
                    };
                } else if (fav.favorite_type === 'portfolio' && fav.portfolio_id) {
                    let lessonIds = [];
                    let pptIds = [];
                    try {
                        if (fav.lesson_ids) {
                            lessonIds = typeof fav.lesson_ids === 'string' ? JSON.parse(fav.lesson_ids) : fav.lesson_ids;
                        }
                        if (fav.ppt_ids) {
                            pptIds = typeof fav.ppt_ids === 'string' ? JSON.parse(fav.ppt_ids) : fav.ppt_ids;
                        }
                    } catch (e) {
                        console.error('解析作品集IDs失败:', e);
                    }
                    return {
                        favoriteId: fav.id,
                        favoriteType: 'portfolio',
                        favoritedAt: fav.created_at,
                        portfolio: {
                            id: fav.portfolio_id,
                            name: fav.portfolio_name,
                            description: fav.portfolio_description,
                            lessonIds,
                            pptIds,
                            isPublic: fav.portfolio_is_public === 1,
                            shareCount: fav.share_count || 0,
                            viewCount: fav.portfolio_view_count || 0
                        }
                    };
                }
                return null;
            }).filter(item => item !== null);

            return {
                favorites: items,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: parseInt(total),
                    totalPages: Math.ceil(total / pageSize),
                    hasNext: page * pageSize < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Favorite.findByUser 错误:', error);
            throw error;
        }
    }

    /**
     * 检查资源是否已收藏
     * @param {number} userId 用户ID
     * @param {number} resourceId 资源ID
     * @returns {Promise<boolean>} 是否已收藏
     */
    static async isResourceFavorited(userId, resourceId) {
        const favorite = await this.findResourceFavorite(userId, resourceId);
        return favorite !== null;
    }

    /**
     * 检查作品集是否已收藏
     * @param {number} userId 用户ID
     * @param {number} portfolioId 作品集ID
     * @returns {Promise<boolean>} 是否已收藏
     */
    static async isPortfolioFavorited(userId, portfolioId) {
        const favorite = await this.findPortfolioFavorite(userId, portfolioId);
        return favorite !== null;
    }
}

module.exports = Favorite;
