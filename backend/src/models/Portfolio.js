/**
 * 作品集模型
 * 提供作品集的数据库操作方法
 */

const db = require('../config/database');

class Portfolio {
    /**
     * 创建作品集
     * @param {Object} portfolioData 作品集数据
     * @returns {Promise<Object>} 创建的作品集信息
     */
    static async create(portfolioData) {
        const {
            userId,
            name,
            description = null,
            lessonIds = null,
            pptIds = null,
            coverUrl = null,
            isPublic = false
        } = portfolioData;

        const lessonIdsJson = Array.isArray(lessonIds) ? JSON.stringify(lessonIds) : lessonIds;
        const pptIdsJson = Array.isArray(pptIds) ? JSON.stringify(pptIds) : pptIds;

        const sql = `
            INSERT INTO portfolios (
                user_id, name, description, lesson_ids, ppt_ids,
                cover_url, share_count, is_public, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())
        `;

        try {
            const result = await db.query(sql, [
                userId || null,
                name || null,
                description || null,
                lessonIdsJson || null,
                pptIdsJson || null,
                coverUrl || null,
                isPublic ? 1 : 0
            ]);

            return {
                id: result.insertId,
                userId,
                name,
                description,
                lessonIds: lessonIds || [],
                pptIds: pptIds || [],
                shareCount: 0,
                isPublic
            };
        } catch (error) {
            console.error('Portfolio.create 错误:', error);
            throw error;
        }
    }

    /**
     * 查询用户的作品集列表
     * @param {number} userId 用户ID
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 作品集列表和分页信息
     */
    static async findByUser(userId, options = {}) {
        const { page = 1, pageSize = 10, publicOnly = false } = options;
        const offset = (page - 1) * pageSize;

        let whereClause = 'WHERE user_id = ?';
        if (publicOnly) {
            whereClause = 'WHERE user_id = ? AND is_public = 1';
        }

        try {
            const countSql = `SELECT COUNT(*) as total FROM portfolios ${whereClause}`;
            const [countResult] = await db.query(countSql, [userId]);
            const total = countResult.total;

            const listSql = `
                SELECT id, user_id, name, description, lesson_ids, ppt_ids,
                       cover_url, share_count, is_public, view_count, created_at, updated_at
                FROM portfolios
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            const portfolios = await db.query(listSql, [userId, pageSize, offset]);

            // 解析JSON字段
            const parsedPortfolios = portfolios.map(p => {
                let parsedLessonIds = [];
                let parsedPptIds = [];
                
                // MySQL JSON类型会自动解析JSON字符串
                // 所以需要判断是否是数组还是字符串
                if (Array.isArray(p.lesson_ids)) {
                    parsedLessonIds = p.lesson_ids;
                } else if (typeof p.lesson_ids === 'string') {
                    try {
                        parsedLessonIds = JSON.parse(p.lesson_ids);
                    } catch (e) {
                        console.error('解析 lesson_ids 失败:', p.lesson_ids, e);
                    }
                }
                
                if (Array.isArray(p.ppt_ids)) {
                    parsedPptIds = p.ppt_ids;
                } else if (typeof p.ppt_ids === 'string') {
                    try {
                        parsedPptIds = JSON.parse(p.ppt_ids);
                    } catch (e) {
                        console.error('解析 ppt_ids 失败:', p.ppt_ids, e);
                    }
                }
                
                return {
                    ...p,
                    userId: p.user_id,
                    isPublic: p.is_public === 1,
                    lessonIds: parsedLessonIds,
                    pptIds: parsedPptIds
                };
            });

            console.log('findByUser 返回的 parsedPortfolios:', JSON.stringify(parsedPortfolios.map(p => ({
                id: p.id,
                name: p.name,
                lessonIds: p.lessonIds,
                pptIds: p.pptIds
            }))));

            return {
                portfolios: parsedPortfolios,
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
            console.error('Portfolio.findByUser 错误:', error);
            throw error;
        }
    }

    /**
     * 根据用户ID和名称查询作品集
     * @param {number} userId 用户ID
     * @param {string} name 作品集名称
     * @returns {Promise<Object|null>} 作品集对象或null
     */
    static async findByUserAndName(userId, name) {
        const sql = `
            SELECT id, user_id, name, description, lesson_ids, ppt_ids,
                   cover_url, share_count, is_public, view_count, created_at, updated_at
            FROM portfolios
            WHERE user_id = ? AND name = ?
            LIMIT 1
        `;
        try {
            const { getPool } = require('../config/database');
            const dbPool = getPool();
            const [rows] = await dbPool.execute(sql, [userId, name]);
            if (rows.length === 0) return null;
            const row = rows[0];
            return {
                ...row,
                lessonIds: row.lesson_ids ? JSON.parse(row.lesson_ids) : [],
                pptIds: row.ppt_ids ? JSON.parse(row.ppt_ids) : []
            };
        } catch (error) {
            console.error('Portfolio.findByUserAndName 错误:', error);
            throw error;
        }
    }

    /**
     * 查询公开作品集列表
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 作品集列表和分页信息
     */
    static async findPublic(options = {}) {
        const { page = 1, pageSize = 10, keyword } = options;
        const offset = (page - 1) * pageSize;

        try {
            let whereClause = 'WHERE is_public = 1';
            const params = [];
            
            if (keyword) {
                whereClause += ' AND (name LIKE ? OR description LIKE ?)';
                params.push(`%${keyword}%`, `%${keyword}%`);
            }

            const countSql = `SELECT COUNT(*) as total FROM portfolios ${whereClause}`;
            const [countResult] = await db.query(countSql, params);
            const total = countResult.total;

            const listSql = `
                SELECT id, user_id, name, description, lesson_ids, ppt_ids,
                       cover_url, share_count, view_count, is_public, created_at, updated_at
                FROM portfolios
                ${whereClause}
                ORDER BY share_count DESC, created_at DESC
                LIMIT ? OFFSET ?
            `;
            const portfolios = await db.query(listSql, [...params, pageSize, offset]);

            const parsedPortfolios = portfolios.map(p => {
                let parsedLessonIds = [];
                let parsedPptIds = [];
                
                if (Array.isArray(p.lesson_ids)) {
                    parsedLessonIds = p.lesson_ids;
                } else if (typeof p.lesson_ids === 'string') {
                    try {
                        parsedLessonIds = JSON.parse(p.lesson_ids);
                    } catch (e) {
                        console.error('解析 lesson_ids 失败:', p.lesson_ids, e);
                    }
                }
                
                if (Array.isArray(p.ppt_ids)) {
                    parsedPptIds = p.ppt_ids;
                } else if (typeof p.ppt_ids === 'string') {
                    try {
                        parsedPptIds = JSON.parse(p.ppt_ids);
                    } catch (e) {
                        console.error('解析 ppt_ids 失败:', p.ppt_ids, e);
                    }
                }
                
                return {
                    id: p.id,
                    userId: p.user_id,
                    name: p.name,
                    description: p.description,
                    lessonIds: parsedLessonIds,
                    pptIds: parsedPptIds,
                    coverUrl: p.cover_url,
                    shareCount: p.share_count,
                    viewCount: p.view_count,
                    isPublic: p.is_public === 1,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at
                };
            });

            return {
                portfolios: parsedPortfolios,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: parseInt(total),
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        } catch (error) {
            console.error('Portfolio.findPublic 错误:', error);
            throw error;
        }
    }

    /**
     * 根据ID查询作品集
     * @param {number} id 作品集ID
     * @returns {Promise<Object|null>} 作品集信息
     */
    static async findById(id) {
        const sql = `
            SELECT id, user_id, name, description, lesson_ids, ppt_ids,
                   cover_url, share_count, view_count, is_public, created_at, updated_at
            FROM portfolios
            WHERE id = ?
        `;

        try {
            const results = await db.query(sql, [id]);
            if (results.length === 0) {
                return null;
            }

            const portfolio = results[0];
            
            let parsedLessonIds = [];
            let parsedPptIds = [];
            
            if (Array.isArray(portfolio.lesson_ids)) {
                parsedLessonIds = portfolio.lesson_ids;
            } else if (typeof portfolio.lesson_ids === 'string') {
                try {
                    parsedLessonIds = JSON.parse(portfolio.lesson_ids);
                } catch (e) {
                    console.error('解析 lesson_ids 失败:', portfolio.lesson_ids, e);
                }
            }
            
            if (Array.isArray(portfolio.ppt_ids)) {
                parsedPptIds = portfolio.ppt_ids;
            } else if (typeof portfolio.ppt_ids === 'string') {
                try {
                    parsedPptIds = JSON.parse(portfolio.ppt_ids);
                } catch (e) {
                    console.error('解析 ppt_ids 失败:', portfolio.ppt_ids, e);
                }
            }
            
            return {
                id: portfolio.id,
                userId: portfolio.user_id,
                name: portfolio.name,
                description: portfolio.description,
                lessonIds: parsedLessonIds,
                pptIds: parsedPptIds,
                coverUrl: portfolio.cover_url,
                shareCount: portfolio.share_count,
                viewCount: portfolio.view_count,
                isPublic: portfolio.is_public === 1,
                createdAt: portfolio.created_at,
                updatedAt: portfolio.updated_at
            };
        } catch (error) {
            console.error('Portfolio.findById 错误:', error);
            throw error;
        }
    }

    /**
     * 更新作品集
     * @param {number} id 作品集ID
     * @param {Object} data 更新数据
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'description', 'coverUrl', 'isPublic'];
        const fieldMap = {
            'coverUrl': 'cover_url',
            'isPublic': 'is_public'
        };

        // 处理 lesson_ids 和 ppt_ids
        if (data.lessonIds !== undefined) {
            fields.push('lesson_ids = ?');
            values.push(JSON.stringify(data.lessonIds));
        }

        if (data.pptIds !== undefined) {
            fields.push('ppt_ids = ?');
            values.push(JSON.stringify(data.pptIds));
        }

        for (const [key, value] of Object.entries(data)) {
            if (allowedFields.includes(key) && value !== undefined) {
                const dbField = fieldMap[key] || key;
                if (dbField === 'is_public') {
                    fields.push(`${dbField} = ?`);
                    values.push(value ? 1 : 0);
                } else {
                    fields.push(`${dbField} = ?`);
                    values.push(value);
                }
            }
        }

        if (fields.length === 0) {
            return false;
        }

        fields.push('updated_at = NOW()');
        values.push(id);

        const sql = `UPDATE portfolios SET ${fields.join(', ')} WHERE id = ?`;

        try {
            const result = await db.query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Portfolio.update 错误:', error);
            throw error;
        }
    }

    /**
     * 删除作品集
     * @param {number} id 作品集ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async delete(id) {
        const sql = 'DELETE FROM portfolios WHERE id = ?';

        try {
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Portfolio.delete 错误:', error);
            throw error;
        }
    }

    /**
     * 增加分享次数
     * @param {number} id 作品集ID
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async incrementShareCount(id) {
        const sql = 'UPDATE portfolios SET share_count = share_count + 1 WHERE id = ?';

        try {
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Portfolio.incrementShareCount 错误:', error);
            throw error;
        }
    }

    /**
     * 增加浏览次数
     * @param {number} id 作品集ID
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async incrementViewCount(id) {
        const sql = 'UPDATE portfolios SET view_count = view_count + 1 WHERE id = ?';

        try {
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Portfolio.incrementViewCount 错误:', error);
            throw error;
        }
    }
}

module.exports = Portfolio;
