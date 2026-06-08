/**
 * PPT记录模型
 * 提供PPT数据的数据库操作方法
 */

const db = require('../config/database');

class PPTRecord {
    /**
     * 创建PPT记录
     * @param {Object} pptData PPT数据
     * @returns {Promise<Object>} 创建的PPT信息
     */
    static async create(pptData) {
        const {
            userId,
            lessonId = null,
            title,
            contentJson,
            pageCount = 0
        } = pptData;

        const sql = `
            INSERT INTO user_ppt_records (
                user_id, lesson_id, title, content_json,
                page_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;

        try {
            const result = await db.query(sql, [
                userId || null,
                lessonId || null,
                title || null,
                contentJson || null,
                pageCount || 0
            ]);

            return {
                id: result.insertId,
                userId,
                lessonId,
                title,
                pageCount
            };
        } catch (error) {
            console.error('PPTRecord.create 错误:', error);
            throw error;
        }
    }

    /**
     * 查询用户的PPT列表
     * @param {number} userId 用户ID
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} PPT列表和分页信息
     */
    static async findByUser(userId, options = {}) {
        const { page = 1, pageSize = 10 } = options;
        const offset = (page - 1) * pageSize;

        try {
            const countSql = 'SELECT COUNT(*) as total FROM user_ppt_records WHERE user_id = ?';
            const [countResult] = await db.query(countSql, [userId]);
            const total = countResult.total;

            const listSql = `
                SELECT id, user_id, lesson_id, title, page_count, created_at, updated_at
                FROM user_ppt_records
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            const records = await db.query(listSql, [userId, pageSize, offset]);

            return {
                records,
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
            console.error('PPTRecord.findByUser 错误:', error);
            throw error;
        }
    }

    /**
     * 根据教案ID查询PPT
     * @param {number} lessonId 教案ID
     * @returns {Promise<Object[]>} PPT列表
     */
    static async findByLesson(lessonId) {
        const sql = `
            SELECT id, user_id, lesson_id, title, page_count, created_at, updated_at
            FROM user_ppt_records
            WHERE lesson_id = ?
            ORDER BY created_at DESC
        `;

        try {
            const records = await db.query(sql, [lessonId]);
            return records;
        } catch (error) {
            console.error('PPTRecord.findByLesson 错误:', error);
            throw error;
        }
    }

    /**
     * 根据教案ID查询PPT（返回单条最新记录）
     * @param {number} lessonId 教案ID
     * @returns {Promise<Object|null>} PPT信息
     */
    static async findByLessonId(lessonId) {
        const sql = `
            SELECT id, user_id, lesson_id, title, content_json, page_count, created_at, updated_at
            FROM user_ppt_records
            WHERE lesson_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        `;

        try {
            const results = await db.query(sql, [lessonId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('PPTRecord.findByLessonId 错误:', error);
            throw error;
        }
    }

    /**
     * 根据ID查询PPT
     * @param {number} id PPT记录ID
     * @returns {Promise<Object|null>} PPT信息
     */
    static async findById(id) {
        const sql = `
            SELECT id, user_id, lesson_id, title, content_json, page_count, created_at, updated_at
            FROM user_ppt_records
            WHERE id = ?
        `;

        try {
            const results = await db.query(sql, [id]);
            if (results.length === 0) {
                return null;
            }

            const record = results[0];
            return {
                id: record.id,
                userId: record.user_id,
                lessonId: record.lesson_id,
                title: record.title,
                contentJson: record.content_json,
                pageCount: record.page_count,
                createdAt: record.created_at,
                updatedAt: record.updated_at
            };
        } catch (error) {
            console.error('PPTRecord.findById 错误:', error);
            throw error;
        }
    }

    /**
     * 更新PPT记录
     * @param {number} id PPT记录ID
     * @param {Object} data 更新数据
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        const allowedFields = ['title', 'contentJson', 'pageCount'];
        const fieldMap = {
            'contentJson': 'content_json',
            'pageCount': 'page_count'
        };

        for (const [key, value] of Object.entries(data)) {
            if (allowedFields.includes(key) && value !== undefined) {
                const dbField = fieldMap[key] || key;
                fields.push(`${dbField} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            return false;
        }

        fields.push('updated_at = NOW()');
        values.push(id);

        const sql = `UPDATE user_ppt_records SET ${fields.join(', ')} WHERE id = ?`;

        try {
            const result = await db.query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('PPTRecord.update 错误:', error);
            throw error;
        }
    }

    /**
     * 删除PPT记录
     * @param {number} id PPT记录ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async delete(id) {
        const sql = 'DELETE FROM user_ppt_records WHERE id = ?';

        try {
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('PPTRecord.delete 错误:', error);
            throw error;
        }
    }

    /**
     * 根据用户ID和标题查询PPT
     * @param {number} userId 用户ID
     * @param {string} title PPT标题
     * @returns {Promise<Object|null>} PPT信息
     */
    static async findByUserAndTitle(userId, title) {
        const sql = `
            SELECT id, user_id, lesson_id, title, content_json, page_count, created_at, updated_at
            FROM user_ppt_records
            WHERE user_id = ? AND title = ?
            ORDER BY created_at DESC
            LIMIT 1
        `;

        try {
            const results = await db.query(sql, [userId, title]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('PPTRecord.findByUserAndTitle 错误:', error);
            throw error;
        }
    }
}

module.exports = PPTRecord;
