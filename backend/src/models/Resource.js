/**
 * 资源模型
 * 提供教学资源的数据库操作方法
 */

const db = require('../config/database');

class Resource {
    /**
     * 创建资源记录
     * @param {Object} resourceData 资源数据
     * @returns {Promise<Object>} 创建的资源信息
     */
    static async create(resourceData) {
        const {
            userId,
            title,
            type,
            category,
            fileUrl,
            coverUrl = null,
            description = null,
            fileSize = null,
            fileFormat = null,
            subject = null,
            grade = null,
            tags = null
        } = resourceData;

        const sql = `
            INSERT INTO resources (
                title, type, category, file_url, cover_url, description,
                file_size, file_format, subject, grade, tags, uploader_id,
                download_count, favorite_count, is_public, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, NOW())
        `;

        try {
            const result = await db.query(sql, [
                title || null,
                type || null,
                category || null,
                fileUrl || null,
                coverUrl || null,
                description || null,
                fileSize || null,
                fileFormat || null,
                subject || null,
                grade || null,
                tags || null,
                userId || null
            ]);

            return {
                id: result.insertId,
                title,
                type,
                category,
                fileUrl,
                downloadCount: 0,
                favoriteCount: 0
            };
        } catch (error) {
            console.error('Resource.create 错误:', error);
            throw error;
        }
    }

    /**
     * 分页查询资源列表
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 资源列表和分页信息
     */
    static async findAll(options = {}) {
        const {
            page = 1,
            pageSize = 10,
            type = null,
            category = null,
            keyword = null,
            subject = null,
            grade = null
        } = options;

        const offset = (page - 1) * pageSize;
        const params = [];

        let whereClause = 'WHERE is_public = 1';

        if (type) {
            // 支持新的文件类型分类：word, pdf, ppt 映射到 file_format
            const formatTypeMap = {
                'word': ['doc', 'docx'],
                'pdf': ['pdf'],
                'ppt': ['ppt', 'pptx'],
                'video': null,
                'audio': null,
                'image': null,
                'other': null
            };
            const formats = formatTypeMap[type];
            if (formats && formats.length > 0) {
                whereClause += ' AND type = ? AND file_format IN (' + formats.map(() => '?').join(',') + ')';
                params.push('document', ...formats);
            } else if (type === 'video') {
                whereClause += ' AND type = ?';
                params.push('video');
            } else if (type === 'audio') {
                whereClause += ' AND type = ?';
                params.push('audio');
            } else if (type === 'image') {
                whereClause += ' AND type = ?';
                params.push('image');
            } else {
                whereClause += ' AND type = ?';
                params.push(type);
            }
        }

        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }

        if (keyword) {
            whereClause += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (subject) {
            whereClause += ' AND subject = ?';
            params.push(subject);
        }

        if (grade) {
            whereClause += ' AND grade = ?';
            params.push(grade);
        }

        try {
            const countSql = `SELECT COUNT(*) as total FROM resources ${whereClause}`;
            const [countResult] = await db.query(countSql, params);
            const total = countResult.total;

            const listSql = `
                SELECT id, title, type, category, file_url, cover_url, description,
                       file_size, file_format, subject, grade, tags, download_count,
                       favorite_count, created_at
                FROM resources
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            const resources = await db.query(listSql, [...params, pageSize, offset]);

            const formattedResources = resources.map(resource => ({
                id: resource.id,
                title: resource.title,
                type: resource.type,
                category: resource.category,
                fileUrl: resource.file_url,
                coverUrl: resource.cover_url,
                description: resource.description,
                fileSize: resource.file_size,
                fileFormat: resource.file_format,
                subject: resource.subject,
                grade: resource.grade,
                tags: resource.tags,
                downloadCount: resource.download_count,
                favoriteCount: resource.favorite_count,
                createdAt: resource.created_at
            }));

            return {
                resources: formattedResources,
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
            console.error('Resource.findAll 错误:', error);
            throw error;
        }
    }

    /**
     * 根据ID查询资源
     * @param {number} id 资源ID
     * @returns {Promise<Object|null>} 资源信息
     */
    static async findById(id) {
        const sql = `
            SELECT id, title, type, category, file_url, cover_url, description,
                   file_size, file_format, subject, grade, tags, uploader_id,
                   download_count, favorite_count, is_public, created_at
            FROM resources
            WHERE id = ?
        `;

        try {
            const results = await db.query(sql, [id]);
            if (results.length === 0) {
                return null;
            }

            const resource = results[0];
            return {
                id: resource.id,
                title: resource.title,
                type: resource.type,
                category: resource.category,
                fileUrl: resource.file_url,
                coverUrl: resource.cover_url,
                description: resource.description,
                fileSize: resource.file_size,
                fileFormat: resource.file_format,
                subject: resource.subject,
                grade: resource.grade,
                tags: resource.tags,
                uploaderId: resource.uploader_id,
                downloadCount: resource.download_count,
                favoriteCount: resource.favorite_count,
                isPublic: resource.is_public,
                createdAt: resource.created_at
            };
        } catch (error) {
            console.error('Resource.findById 错误:', error);
            throw error;
        }
    }

    /**
     * 增加下载次数
     * @param {number} id 资源ID
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async incrementDownloads(id) {
        const sql = 'UPDATE resources SET download_count = download_count + 1 WHERE id = ?';

        try {
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Resource.incrementDownloads 错误:', error);
            throw error;
        }
    }

    /**
     * 增加收藏次数
     * @param {number} id 资源ID
     * @param {number} increment 增加量（1或-1）
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async incrementFavorites(id, increment = 1) {
        const sql = 'UPDATE resources SET favorite_count = favorite_count + ? WHERE id = ?';

        try {
            const result = await db.query(sql, [increment, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Resource.incrementFavorites 错误:', error);
            throw error;
        }
    }

    /**
     * 切换资源公开/私有状态
     * @param {number} id 资源ID
     * @param {number} userId 用户ID
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async togglePublic(id, userId) {
        const sql = 'UPDATE resources SET is_public = NOT is_public WHERE id = ? AND uploader_id = ?';
        try {
            const result = await db.query(sql, [id, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Resource.togglePublic 错误:', error);
            throw error;
        }
    }

    /**
     * 复制资源到其他用户
     * @param {number} sourceId 源资源ID
     * @param {number} targetUserId 目标用户ID
     * @returns {Promise<object|null>} 新资源对象
     */
    static async copyToUser(sourceId, targetUserId) {
        const source = await this.findById(sourceId);
        if (!source) return null;
        const sql = `
            INSERT INTO resources (title, type, category, file_url, cover_url, description,
                file_size, file_format, subject, grade, tags, uploader_id, is_public,
                download_count, favorite_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, NOW())
        `;
        try {
            const { getPool } = require('../config/database');
            const dbPool = getPool();
            const [result] = await dbPool.execute(sql, [
                source.title, source.type, source.category, source.fileUrl,
                source.coverUrl, source.description, source.fileSize,
                source.fileFormat, source.subject, source.grade, source.tags,
                targetUserId
            ]);
            return { id: result.insertId, ...source, uploaderId: targetUserId, isPublic: false };
        } catch (error) {
            console.error('Resource.copyToUser 错误:', error);
            throw error;
        }
    }

    /**
     * 删除资源
     * @param {number} id 资源ID
     * @param {number} [userId] 用户ID（可选，传入时验证权限）
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async delete(id, userId = null) {
        let sql = 'DELETE FROM resources WHERE id = ?';
        const params = [id];

        if (userId !== null) {
            sql += ' AND uploader_id = ?';
            params.push(userId);
        }

        try {
            const result = await db.query(sql, params);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Resource.delete 错误:', error);
            throw error;
        }
    }

    /**
     * 查询用户上传的资源
     * @param {number} userId 用户ID
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 资源列表和分页信息
     */
    static async findByUser(userId, options = {}) {
        const { page = 1, pageSize = 10, keyword = null } = options;
        const offset = (page - 1) * pageSize;

        let whereClause = 'WHERE uploader_id = ?';
        const params = [userId];

        if (keyword) {
            whereClause += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        try {
            const countSql = `SELECT COUNT(*) as total FROM resources ${whereClause}`;
            const [countResult] = await db.query(countSql, params);
            const total = countResult.total;

            const listSql = `
                SELECT id, title, type, category, file_url, cover_url, description,
                       file_size, file_format, subject, grade, tags, download_count,
                       favorite_count, created_at
                FROM resources
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;
            const resources = await db.query(listSql, [...params, pageSize, offset]);

            const formattedResources = resources.map(resource => ({
                id: resource.id,
                title: resource.title,
                type: resource.type,
                category: resource.category,
                fileUrl: resource.file_url,
                coverUrl: resource.cover_url,
                description: resource.description,
                fileSize: resource.file_size,
                fileFormat: resource.file_format,
                subject: resource.subject,
                grade: resource.grade,
                tags: resource.tags,
                downloadCount: resource.download_count,
                favoriteCount: resource.favorite_count,
                createdAt: resource.created_at
            }));

            return {
                resources: formattedResources,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: parseInt(total),
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        } catch (error) {
            console.error('Resource.findByUser 错误:', error);
            throw error;
        }
    }
}

module.exports = Resource;
