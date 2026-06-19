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
            grade = null,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        const offset = (page - 1) * pageSize;
        const params = [];

        let whereClause = 'WHERE is_public = 1 AND source_uploader_id IS NULL';

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

            // 验证排序字段，防止 SQL 注入
            const allowedSortFields = ['created_at', 'download_count', 'favorite_count', 'view_count', 'title'];
            const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
            const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            const listSql = `
                SELECT id, title, type, category, file_url, cover_url, description,
                       file_size, file_format, subject, grade, tags, download_count,
                       favorite_count, view_count, is_public, created_at
                FROM resources
                ${whereClause}
                ORDER BY ${safeSortBy} ${safeSortOrder}
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
                viewCount: resource.view_count || 0,
                isPublic: resource.is_public === 1,
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
     * 统一查询所有资源（教案、PPT、作品集、上传资源）
     * @param {Object} options 查询选项
     * @returns {Promise<Object>} 统一资源列表和分页信息
     */
    static async findAllUnified(options = {}) {
        const {
            page = 1,
            pageSize = 10,
            keyword = null,
            type = null,
            fileFormat = null,
            subject = null,
            grade = null,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        const offset = (page - 1) * pageSize;

        // 验证排序字段，防止 SQL 注入
        const allowedSortFields = ['created_at', 'download_count', 'favorite_count', 'view_count', 'title'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const typeFilter = type ? type.toLowerCase() : null;

        // 构建每个子查询的过滤条件
        const buildSubWhere = (alias, keywordColumn = 'title', descriptionColumn = null, subjectAlias = null, gradeAlias = null) => {
            const parts = [];
            const subParams = [];
            if (keyword) {
                const kwConditions = [`${alias}.${keywordColumn} LIKE ?`];
                subParams.push(`%${keyword}%`);
                if (descriptionColumn) {
                    kwConditions.push(`${alias}.${descriptionColumn} LIKE ?`);
                    subParams.push(`%${keyword}%`);
                }
                parts.push(`(${kwConditions.join(' OR ')})`);
            }
            if (subject) {
                parts.push(`${(subjectAlias || alias)}.subject = ?`);
                subParams.push(subject);
            }
            if (grade) {
                parts.push(`${(gradeAlias || alias)}.grade = ?`);
                subParams.push(grade);
            }
            return { where: parts.length > 0 ? `AND ${parts.join(' AND ')}` : '', params: subParams };
        };

        let unions = [];
        let allParams = [];

        // 教案 — 只显示用户公开的教案
        if (!typeFilter || typeFilter === 'lesson') {
            const sw = buildSubWhere('l', 'title');
            allParams.push(...sw.params);
            unions.push(`
                SELECT l.id, l.title, 'lesson' as resource_type, l.subject, l.grade,
                       l.created_at, COALESCE(l.view_count, 0) as view_count,
                       COALESCE(l.download_count, 0) as download_count,
                       COALESCE(l.favorite_count, 0) as favorite_count,
                       l.user_id as owner_id,
                       u.name as author_name,
                       NULL as file_url, NULL as file_format, NULL as file_size,
                       '' as category, COALESCE(l.teaching_goals, '') as description, '' as tags,
                       NULL as cover_url
                FROM lessons l
                LEFT JOIN users u ON l.user_id = u.id
                WHERE l.is_public = 1 ${sw.where}
            `);
        }

        // PPT — 显示用户公开的PPT记录
        if (!typeFilter || typeFilter === 'ppt') {
            const sw = buildSubWhere('p', 'title', null, 'l', 'l');
            allParams.push(...sw.params);
            unions.push(`
                SELECT p.id, p.title, 'ppt' as resource_type,
                       COALESCE(l.subject, '') as subject, COALESCE(l.grade, '') as grade,
                       p.created_at, COALESCE(p.view_count, 0) as view_count,
                       COALESCE(p.download_count, 0) as download_count,
                       COALESCE(p.favorite_count, 0) as favorite_count,
                       p.user_id as owner_id,
                       u.name as author_name,
                       NULL as file_url, NULL as file_format, NULL as file_size,
                       '' as category, '' as description, '' as tags,
                       NULL as cover_url
                FROM user_ppt_records p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN lessons l ON p.lesson_id = l.id
                WHERE p.is_public = 1 ${sw.where}
            `);
        }

        // 仅筛选PPT类型时，包含上传的 ppt/pptx 文件（排除已在 user_ppt_records 中存在的，避免重复）
        if (typeFilter === 'ppt') {
            const pptSw = buildSubWhere('r', 'title', 'description');
            allParams.push(...pptSw.params);
            unions.push(`
                SELECT r.id, r.title, 'ppt' as resource_type,
                       COALESCE(r.subject, '') as subject, COALESCE(r.grade, '') as grade,
                       r.created_at, COALESCE(r.view_count, 0) as view_count,
                       COALESCE(r.download_count, 0) as download_count,
                       COALESCE(r.favorite_count, 0) as favorite_count,
                       r.uploader_id as owner_id,
                       u.name as author_name,
                       r.file_url, r.file_format, r.file_size,
                       COALESCE(r.category, '') as category, COALESCE(r.description, '') as description,
                       COALESCE(r.tags, '') as tags,
                       r.cover_url
                FROM resources r
                LEFT JOIN users u ON r.uploader_id = u.id
                WHERE r.is_public = 1 AND r.file_format IN ('ppt', 'pptx')
                AND NOT EXISTS (SELECT 1 FROM user_ppt_records p2 WHERE p2.title = r.title AND p2.is_public = 1)
                ${pptSw.where}
            `);
        }

        // 作品集
        if (!typeFilter || typeFilter === 'portfolio') {
            const sw = buildSubWhere('pt', 'name', 'description');
            allParams.push(...sw.params);
            unions.push(`
                SELECT pt.id, pt.name as title, 'portfolio' as resource_type, pt.subject, pt.grade,
                       pt.created_at, COALESCE(pt.view_count, 0) as view_count,
                       COALESCE(pt.download_count, 0) as download_count,
                       COALESCE(pt.favorite_count, 0) as favorite_count,
                       pt.user_id as owner_id,
                       u.name as author_name,
                       NULL as file_url, NULL as file_format, NULL as file_size,
                       COALESCE(pt.category, '') as category, COALESCE(pt.description, '') as description, '' as tags,
                       pt.cover_url
                FROM portfolios pt
                LEFT JOIN users u ON pt.user_id = u.id
                WHERE pt.is_public = 1 ${sw.where}
            `);
        }

        // 上传资源
        if (!typeFilter || typeFilter === 'resource') {
            const sw = buildSubWhere('r', 'title', 'description');
            // 文件格式筛选
            let fileFormatClause = '';
            let fileFormatParams = [];
            if (fileFormat) {
                const formats = Array.isArray(fileFormat) ? fileFormat : [fileFormat];
                if (formats.length > 0) {
                    fileFormatClause = ` AND r.file_format IN (${formats.map(() => '?').join(',')})`;
                    fileFormatParams = formats;
                }
            }
            // 参数顺序必须与 SQL 占位符顺序一致：先 sw.params（keyword/subject/grade），再 fileFormatParams
            allParams.push(...sw.params, ...fileFormatParams);
            unions.push(`
                SELECT r.id, r.title, 'resource' as resource_type,
                       COALESCE(r.subject, '') as subject, COALESCE(r.grade, '') as grade,
                       r.created_at, COALESCE(r.view_count, 0) as view_count,
                       COALESCE(r.download_count, 0) as download_count,
                       COALESCE(r.favorite_count, 0) as favorite_count,
                       r.uploader_id as owner_id,
                       u.name as author_name,
                       r.file_url, r.file_format, r.file_size,
                       COALESCE(r.category, '') as category, COALESCE(r.description, '') as description,
                       COALESCE(r.tags, '') as tags,
                       r.cover_url
                FROM resources r
                LEFT JOIN users u ON r.uploader_id = u.id
                WHERE r.is_public = 1 ${sw.where}${fileFormatClause}
            `);
        }

        if (unions.length === 0) {
            return { items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
        }

        const unionSQL = unions.join(' UNION ALL ');

        try {
            // 统计总数
            const countSQL = `SELECT COUNT(*) as total FROM (${unionSQL})`;
            const [countResult] = await db.query(countSQL, allParams);
            const total = countResult.total;

            // 查询数据
            const listSQL = `
                SELECT * FROM (${unionSQL})
                ORDER BY ${safeSortBy} ${safeSortOrder}
                LIMIT ? OFFSET ?
            `;
            const items = await db.query(listSQL, [...allParams, pageSize, offset]);

            const formattedItems = items.map(item => ({
                id: item.id,
                title: item.title,
                resourceType: item.resource_type,
                subject: item.subject,
                grade: item.grade,
                createdAt: item.created_at,
                viewCount: item.view_count || 0,
                downloadCount: item.download_count || 0,
                favoriteCount: item.favorite_count || 0,
                ownerId: item.owner_id,
                authorName: item.author_name,
                fileUrl: item.file_url,
                fileFormat: item.file_format,
                fileSize: item.file_size,
                category: item.category,
                description: item.description,
                tags: item.tags,
                coverUrl: item.cover_url
            }));

            return {
                items: formattedItems,
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
            console.error('Resource.findAllUnified 错误:', error);
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
                isPublic: resource.is_public === 1,
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

        // 如果是自己的资源，不重复复制
        if (source.uploaderId === targetUserId) {
            return { id: source.id, ...source };
        }
        const sql = `
            INSERT INTO resources (title, type, category, file_url, cover_url, description,
                file_size, file_format, subject, grade, tags, uploader_id, source_uploader_id, is_public,
                download_count, favorite_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, datetime('now'))
        `;
        try {
            const result = await db.query(sql, [
                source.title, source.type, source.category, source.fileUrl,
                source.coverUrl, source.description, source.fileSize,
                source.fileFormat, source.subject, source.grade, source.tags,
                targetUserId, source.uploaderId || source.uploader_id
            ]);
            return { id: result.insertId, ...source, uploaderId: targetUserId, sourceUploaderId: source.uploaderId || source.uploader_id, isPublic: false };
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

        // 只查询用户自己上传的资源（source_uploader_id IS NULL）
        whereClause += ' AND source_uploader_id IS NULL';

        try {
            const countSql = `SELECT COUNT(*) as total FROM resources ${whereClause}`;
            const [countResult] = await db.query(countSql, params);
            const total = countResult.total;

            const listSql = `
                SELECT id, title, type, category, file_url, cover_url, description,
                       file_size, file_format, subject, grade, tags, download_count,
                       favorite_count, is_public, source_uploader_id, created_at
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
                isPublic: resource.is_public === 1,
                sourceUploaderId: resource.source_uploader_id,
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
