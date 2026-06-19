/**
 * 教案模型
 * 提供教案数据的数据库操作方法
 */

const db = require('../config/database');

class Lesson {
    /**
     * 创建教案
     * @param {Object} lessonData 教案数据
     * @returns {Promise<Object>} 创建的教案信息
     */
    static async create(lessonData) {
        const {
            userId,
            title,
            subject,
            grade,
            teachingGoals = null,
            keyPoints = null,
            teachingProcess = null,
            assignments = null,
            summary = null,
            status = 'draft'
        } = lessonData;

        const sql = `
            INSERT INTO lessons (
                user_id, title, subject, grade,
                teaching_goals, key_points, teaching_process,
                homework, summary, status, view_count,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
        `;

        try {
            const result = await db.query(sql, [
                userId || null,
                title || null,
                subject || null,
                grade || null,
                teachingGoals || null,
                keyPoints || null,
                teachingProcess || null,
                assignments || null,
                summary || null,
                status || 'draft'
            ]);

            return {
                id: result.insertId,
                userId,
                title,
                subject,
                grade,
                status,
                views: 0
            };
        } catch (error) {
            console.error('Lesson.create 错误:', error);
            throw error;
        }
    }

    /**
     * 分页查询用户的教案
     * @param {number} userId 用户ID
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 教案列表和分页信息
     */
    static async findByUser(userId, options = {}) {
        const {
            page = 1,
            pageSize = 10,
            keyword = null,
            subject = null,
            status = null
        } = options;

        const offset = (page - 1) * pageSize;
        const params = [];
        let whereClause = 'WHERE user_id = ?';
        params.push(userId);

        // 关键词搜索（标题）
        if (keyword) {
            whereClause += ' AND title LIKE ?';
            params.push(`%${keyword}%`);
        }

        // 学科筛选
        if (subject) {
            whereClause += ' AND subject = ?';
            params.push(subject);
        }

        // 状态筛选
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        try {
            // 查询总数
            const countSql = `SELECT COUNT(*) as total FROM lessons ${whereClause}`;
            const [countResult] = await db.query(countSql, params);
            const total = countResult.total;

            // 查询列表
            const listSql = `
                SELECT id, user_id, title, subject, grade,
                       teaching_goals, key_points, teaching_process,
                       homework, summary, status, view_count, created_at, updated_at
                FROM lessons
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            const lessons = await db.query(listSql, [...params, pageSize, offset]);

            const mappedLessons = lessons.map(lesson => ({
                id: lesson.id,
                userId: lesson.user_id,
                title: lesson.title,
                subject: lesson.subject,
                grade: lesson.grade,
                teachingGoals: lesson.teaching_goals,
                keyPoints: lesson.key_points,
                teachingProcess: lesson.teaching_process,
                assignments: lesson.homework,
                summary: lesson.summary,
                status: lesson.status,
                views: lesson.view_count,
                createdAt: lesson.created_at,
                updatedAt: lesson.updated_at
            }));

            return {
                lessons: mappedLessons,
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
            console.error('Lesson.findByUser 错误:', error);
            throw error;
        }
    }

    /**
     * 根据ID查询教案
     * @param {number} id 教案ID
     * @returns {Promise<Object|null>} 教案信息
     */
    static async findById(id) {
        const sql = `
            SELECT id, user_id, title, subject, grade,
                   teaching_goals, key_points, teaching_process,
                   homework, summary, status, view_count,
                   created_at, updated_at
            FROM lessons
            WHERE id = ?
        `;

        try {
            const results = await db.query(sql, [id]);
            if (results.length === 0) {
                return null;
            }

            const lesson = results[0];
            return {
                id: lesson.id,
                userId: lesson.user_id,
                title: lesson.title,
                subject: lesson.subject,
                grade: lesson.grade,
                teachingGoals: lesson.teaching_goals,
                keyPoints: lesson.key_points,
                teachingProcess: lesson.teaching_process,
                assignments: lesson.homework,
                summary: lesson.summary,
                status: lesson.status,
                views: lesson.view_count,
                createdAt: lesson.created_at,
                updatedAt: lesson.updated_at
            };
        } catch (error) {
            console.error('Lesson.findById 错误:', error);
            throw error;
        }
    }

    /**
     * 更新教案
     * @param {number} id 教案ID
     * @param {Object} data 更新数据
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        const allowedFields = [
            'title', 'subject', 'grade', 'teachingGoals',
            'keyPoints', 'teachingProcess', 'assignments',
            'summary', 'status'
        ];

        // 字段映射（JS -> DB）
        const fieldMap = {
            'teachingGoals': 'teaching_goals',
            'keyPoints': 'key_points',
            'teachingProcess': 'teaching_process',
            'assignments': 'homework'
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

        const sql = `UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`;

        try {
            const result = await db.query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Lesson.update 错误:', error);
            throw error;
        }
    }

    /**
     * 删除教案
     * @param {number} id 教案ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async delete(id) {
        const sql = 'DELETE FROM lessons WHERE id = ?';

        try {
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Lesson.delete 错误:', error);
            throw error;
        }
    }

    /**
     * 增加浏览次数
     * @param {number} id 教案ID
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async incrementViews(id) {
        const sql = 'UPDATE lessons SET view_count = view_count + 1 WHERE id = ?';

        try {
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Lesson.incrementViews 错误:', error);
            throw error;
        }
    }

    /**
     * 检查用户是否存在同名教案
     * @param {number} userId 用户ID
     * @param {string} title 教案标题
     * @param {number} excludeId 排除的教案ID（用于更新时排除自身）
     * @returns {Promise<boolean>} 是否存在同名教案
     */
    static async existsByTitle(userId, title, excludeId = null) {
        let sql = 'SELECT COUNT(*) as count FROM lessons WHERE user_id = ? AND title = ?';
        const params = [userId, title];
        
        if (excludeId !== null) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }

        try {
            const [result] = await db.query(sql, params);
            return result.count > 0;
        } catch (error) {
            console.error('Lesson.existsByTitle 错误:', error);
            throw error;
        }
    }

    /**
     * 查询所有公开教案（分页）
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 教案列表和分页信息
     */
    static async findPublic(options = {}) {
        const { page = 1, pageSize = 10, subject = null, keyword = null } = options;

        const offset = (page - 1) * pageSize;
        const params = [];
        let whereClause = "WHERE status = 'published'";

        if (keyword) {
            whereClause += ' AND title LIKE ?';
            params.push(`%${keyword}%`);
        }

        if (subject) {
            whereClause += ' AND subject = ?';
            params.push(subject);
        }

        try {
            const countSql = `SELECT COUNT(*) as total FROM lessons ${whereClause}`;
            const [countResult] = await db.query(countSql, params);
            const total = countResult.total;

            const listSql = `
                SELECT id, user_id AS userId, title, subject, grade, view_count, created_at AS createdAt
                FROM lessons
                ${whereClause}
                ORDER BY view_count DESC, created_at DESC
                LIMIT ? OFFSET ?
            `;
            const lessons = await db.query(listSql, [...params, pageSize, offset]);

            return {
                lessons,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: parseInt(total),
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        } catch (error) {
            console.error('Lesson.findPublic 错误:', error);
            throw error;
        }
    }
}

module.exports = Lesson;
