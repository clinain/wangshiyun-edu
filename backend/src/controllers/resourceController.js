/**
 * 资源控制器
 * 处理教学资源的上传、管理和下载
 */

const Resource = require('../models/Resource');
const Favorite = require('../models/Favorite');
const { getFileUrl, getResourceType } = require('../middleware/upload');

const normalizeDownloadUrl = (fileUrl) => {
    if (!fileUrl) return '';

    try {
        const parsed = new URL(fileUrl);
        if (parsed.pathname.startsWith('/uploads/')) {
            return parsed.pathname;
        }
    } catch (error) {
        if (fileUrl.startsWith('/uploads/')) {
            return fileUrl;
        }
    }

    return fileUrl;
};

/**
 * 上传资源
 * POST /api/resources/upload
 */
const uploadResource = async (req, res) => {
    try {
        const userId = req.user?.id;

        // 检查是否有文件
        if (!req.file) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请选择要上传的文件'
            });
        }

        const { title, description, category, subject, grade, tags } = req.body;

        // 验证必填字段
        if (!title) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供资源标题'
            });
        }

        // 检查同名资源是否已存在
        const db = require('../config/database');
        const existingResource = db.query(
            'SELECT id FROM resources WHERE title = ? AND uploader_id = ? LIMIT 1',
            [title, userId]
        );
        if (existingResource && existingResource.length > 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '已存在同名资源，请修改标题后重新上传'
            });
        }

        // 获取文件信息
        const file = req.file;
        const fileUrl = getFileUrl(req, file.filename, file.mimetype);
        const resourceType = getResourceType(file.mimetype);

        // 将 MIME 类型简化为简短格式名（数据库 file_format VARCHAR(20)）
        const FORMAT_MAP = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-powerpoint': 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            'video/mp4': 'mp4',
            'video/mpeg': 'mpeg',
            'video/webm': 'webm',
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'audio/ogg': 'ogg',
            'audio/mp4': 'm4a',
            'audio/x-m4a': 'm4a',
            'audio/flac': 'flac',
            'audio/aac': 'aac',
        };
        const fileFormat = FORMAT_MAP[file.mimetype] || file.mimetype.substring(0, 20);

        // 创建资源记录
        const resource = await Resource.create({
            userId,
            title,
            type: resourceType,
            category: category || resourceType,
            fileUrl,
            coverUrl: resourceType === 'image' ? fileUrl : null,
            description,
            fileSize: file.size,
            fileFormat,
            subject,
            grade,
            tags
        });

        console.log(`✅ 资源上传成功: ${title}`);

        res.status(201).json({
            success: true,
            message: '资源上传成功',
            data: {
                id: resource.id,
                title,
                type: resourceType,
                fileUrl,
                fileSize: file.size,
                fileFormat: file.mimetype
            }
        });

    } catch (error) {
        console.error('上传资源错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: `上传失败: ${error.message}`
        });
    }
};

/**
 * 获取资源列表
 * GET /api/resources
 */
const getResourceList = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, type, category, keyword, subject, grade, sortBy, sortOrder } = req.query;
        const userId = req.user?.id;

        const result = await Resource.findAll({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            type,
            category,
            keyword,
            subject,
            grade,
            sortBy,
            sortOrder
        });

        const resources = await Promise.all(result.resources.map(async (resource) => {
            const isFavorite = userId ? await Favorite.isResourceFavorited(userId, resource.id) : false;
            const fileName = resource.fileUrl ? resource.fileUrl.split('/').pop() : '';
            
            return {
                id: resource.id,
                title: resource.title,
                type: resource.type,
                category: resource.category,
                fileUrl: resource.fileUrl || resource.file_url,
                coverUrl: resource.coverUrl || resource.cover_url,
                description: resource.description,
                fileSize: resource.fileSize || resource.file_size,
                fileFormat: resource.fileFormat || resource.file_format,
                subject: resource.subject,
                grade: resource.grade,
                tags: resource.tags,
                downloadCount: resource.downloadCount || resource.download_count || 0,
                favoriteCount: resource.favoriteCount || resource.favorite_count || 0,
                viewCount: resource.viewCount || resource.view_count || 0,
                isPublic: resource.isPublic,
                isFavorite,
                fileName,
                createdAt: resource.createdAt || resource.created_at
            };
        }));

        res.json({
            success: true,
            message: '获取资源列表成功',
            data: { resources },
            pagination: result.pagination
        });

    } catch (error) {
        console.error('获取资源列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取资源详情
 * GET /api/resources/:id
 */
const getResourceDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findById(id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '资源不存在'
            });
        }

        // 检查是否公开
        if (!resource.isPublic) {
            const userId = req.user?.id;
            if (userId !== resource.uploaderId) {
                return res.status(403).json({
                    success: false,
                    code: 403,
                    message: '无权访问此资源'
                });
            }
        }

        res.json({
            success: true,
            message: '获取资源详情成功',
            data: resource
        });

    } catch (error) {
        console.error('获取资源详情错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 下载资源
 * GET /api/resources/:id/download
 * 流式传输文件，支持断点续传
 */
const downloadResource = async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findById(id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '资源不存在'
            });
        }

        const userId = req.user?.id;
        if (!resource.isPublic && userId !== resource.uploaderId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权下载此资源'
            });
        }

        // 增加下载次数
        await Resource.incrementDownloads(id);

        // 获取文件的物理路径
        const fs = require('fs');
        const path = require('path');
        const filePath = normalizeDownloadUrl(resource.fileUrl);

        // 构建绝对路径
        const absolutePath = path.join(__dirname, '../..', filePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '文件不存在'
            });
        }

        // 获取文件统计信息
        const stat = fs.statSync(absolutePath);

        // 根据文件扩展名设置 Content-Type
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain; charset=utf-8',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mpeg': 'video/mpeg',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.flac': 'audio/flac',
            '.aac': 'audio/aac',
            '.json': 'application/json',
        };

        const ext = path.extname(absolutePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // 从原始文件名或标题生成下载文件名
        const downloadName = resource.title
            ? `${resource.title}${ext}`
            : path.basename(absolutePath);

        // 设置响应头
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
        res.setHeader('Accept-Ranges', 'bytes');

        // 流式传输文件
        const stream = fs.createReadStream(absolutePath);
        stream.pipe(res);

    } catch (error) {
        console.error('下载资源错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '下载失败'
        });
    }
};

/**
 * 预览资源
 * GET /api/resources/:id/preview
 * 流式传输文件，支持在线预览（Content-Disposition: inline）
 */
const previewResource = async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findById(id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '资源不存在'
            });
        }

        const userId = req.user?.id;
        if (!resource.isPublic && userId !== resource.uploaderId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权预览此资源'
            });
        }

        // 获取文件的物理路径
        const fs = require('fs');
        const path = require('path');
        const filePath = normalizeDownloadUrl(resource.fileUrl);
        const absolutePath = path.join(__dirname, '../..', filePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '文件不存在'
            });
        }

        // 获取文件统计信息
        const stat = fs.statSync(absolutePath);

        // 根据文件扩展名设置 Content-Type
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain; charset=utf-8',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.bmp': 'image/bmp',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mpeg': 'video/mpeg',
            '.avi': 'video/avi',
            '.mov': 'video/quicktime',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.flac': 'audio/flac',
            '.aac': 'audio/aac',
            '.json': 'application/json',
        };

        const ext = path.extname(absolutePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // 设置响应头 - inline 用于在线预览
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Accept-Ranges', 'bytes');
        // 允许 iframe 嵌入
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        // 禁止缓存敏感文件
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        // 流式传输文件
        const stream = fs.createReadStream(absolutePath);
        stream.pipe(res);

    } catch (error) {
        console.error('预览资源错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '预览失败'
        });
    }
};

/**
 * 预览文本资源（返回纯文本内容）
 * GET /api/resources/:id/preview-text
 */
const previewTextResource = async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findById(id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '资源不存在'
            });
        }

        const userId = req.user?.id;
        if (!resource.isPublic && userId !== resource.uploaderId) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权预览此资源'
            });
        }

        // 获取文件的物理路径
        const fs = require('fs');
        const path = require('path');
        const filePath = normalizeDownloadUrl(resource.fileUrl);
        const absolutePath = path.join(__dirname, '../..', filePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '文件不存在'
            });
        }

        // 读取文本内容（限制最大 1MB）
        const content = fs.readFileSync(absolutePath, 'utf-8').substring(0, 1024 * 1024);

        res.json({
            success: true,
            data: {
                content,
                title: resource.title,
                fileFormat: resource.fileFormat
            }
        });

    } catch (error) {
        console.error('预览文本资源错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '预览失败'
        });
    }
};

/**
 * 收藏/取消收藏资源
 * POST /api/resources/:id/favorite
 */
const toggleFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const resource = await Resource.findById(id);

        if (!resource) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '资源不存在'
            });
        }

        // 检查是否已收藏
        const isFavorited = await Favorite.isResourceFavorited(userId, id);

        if (isFavorited) {
            // 取消收藏
            await Favorite.deleteResourceFavorite(userId, id);
            await Resource.incrementFavorites(id, -1);

            res.json({
                success: true,
                message: '取消收藏成功',
                data: {
                    isFavorited: false
                }
            });
        } else {
            // 添加收藏
            await Favorite.createResourceFavorite(userId, id);
            await Resource.incrementFavorites(id, 1);

            res.json({
                success: true,
                message: '收藏成功',
                data: {
                    isFavorited: true
                }
            });
        }

    } catch (error) {
        console.error('收藏资源错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '操作失败'
        });
    }
};

/**
 * 获取我的收藏列表
 * GET /api/resources/favorites
 */
const getMyFavorites = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { page = 1, pageSize = 10, type = 'all' } = req.query;

        const result = await Favorite.findByUser(userId, {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            type
        });

        const items = result.favorites.map(item => {
            if (item.favoriteType === 'resource' && item.resource) {
                const resource = item.resource;
                const fileName = resource.fileUrl ? resource.fileUrl.split('/').pop() : '';
                return {
                    favoriteType: 'resource',
                    favoriteId: item.favoriteId,
                    favoritedAt: item.favoritedAt,
                    id: resource.id,
                    title: resource.title,
                    type: resource.type,
                    category: resource.category,
                    fileUrl: resource.fileUrl,
                    coverUrl: resource.coverUrl,
                    description: resource.description,
                    fileSize: resource.fileSize,
                    fileFormat: resource.fileFormat,
                    subject: resource.subject,
                    grade: resource.grade,
                    downloadCount: resource.downloadCount || 0,
                    favoriteCount: resource.favoriteCount || 0,
                    isFavorite: true,
                    fileName,
                    createdAt: resource.createdAt || item.favoritedAt
                };
            } else if (item.favoriteType === 'portfolio' && item.portfolio) {
                const portfolio = item.portfolio;
                return {
                    favoriteType: 'portfolio',
                    favoriteId: item.favoriteId,
                    favoritedAt: item.favoritedAt,
                    id: portfolio.id,
                    name: portfolio.name,
                    description: portfolio.description,
                    lessonIds: portfolio.lessonIds || [],
                    pptIds: portfolio.pptIds || [],
                    isPublic: portfolio.isPublic,
                    shareCount: portfolio.shareCount || 0,
                    viewCount: portfolio.viewCount || 0,
                    isFavorite: true,
                    createdAt: item.favoritedAt
                };
            }
            return null;
        }).filter(item => item !== null);

        res.json({
            success: true,
            message: '获取收藏列表成功',
            data: items,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('获取收藏列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取我上传的资源列表
 * GET /api/resources/my
 */
const getMyResources = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { page = 1, pageSize = 10, keyword } = req.query;

        const result = await Resource.findByUser(userId, {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            keyword
        });

        const resources = result.resources.map(resource => {
            const fileName = resource.fileUrl ? resource.fileUrl.split('/').pop() : '';
            
            return {
                id: resource.id,
                title: resource.title,
                type: resource.type,
                category: resource.category,
                fileUrl: resource.fileUrl || resource.file_url,
                coverUrl: resource.coverUrl || resource.cover_url,
                description: resource.description,
                fileSize: resource.fileSize || resource.file_size,
                fileFormat: resource.fileFormat || resource.file_format,
                subject: resource.subject,
                grade: resource.grade,
                tags: resource.tags,
                downloadCount: resource.downloadCount || resource.download_count || 0,
                favoriteCount: resource.favoriteCount || resource.favorite_count || 0,
                isPublic: resource.isPublic,
                isFavorite: false,
                fileName,
                createdAt: resource.createdAt || resource.created_at
            };
        });

        // 只查询用户创建的作品集
        const db = require('../config/database');
        const portfolios = await db.query(`
            SELECT p.*, u.name as author_name
            FROM portfolios p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ? AND p.is_public = 1
            ORDER BY p.created_at DESC
        `, [userId]);

        // JSON 解析和字段名转换（snake_case -> camelCase）
        const processedPortfolios = portfolios.map(p => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            description: p.description,
            subject: p.subject,
            grade: p.grade,
            category: p.category,
            coverUrl: p.cover_url,
            lessonIds: (() => {
                try { return p.lesson_ids ? JSON.parse(p.lesson_ids) : []; }
                catch { return []; }
            })(),
            pptIds: (() => {
                try { return p.ppt_ids ? JSON.parse(p.ppt_ids) : []; }
                catch { return []; }
            })(),
            isPublic: p.is_public === 1,
            shareCount: p.share_count,
            viewCount: p.view_count,
            authorName: p.author_name,
            createdAt: p.created_at,
            updatedAt: p.updated_at
        }));

        // 如果有关键词筛选，对作品集也做简单过滤
        const filteredPortfolios = keyword
            ? processedPortfolios.filter(p =>
                (p.name && p.name.includes(keyword)) ||
                (p.description && p.description.includes(keyword))
              )
            : processedPortfolios;

        res.json({
            success: true,
            message: '获取我的资源列表成功',
            data: { resources, portfolios: filteredPortfolios },
            pagination: result.pagination
        });

    } catch (error) {
        console.error('获取我的资源列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 删除资源
 * DELETE /api/resources/:id
 */
const deleteResource = async (req, res) => {
    try {
        const userId = req.user?.id;
        const resourceId = parseInt(req.params.id);

        console.log(`删除资源: userId=${userId}, resourceId=${resourceId}`);

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        if (!resourceId || isNaN(resourceId)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '无效的资源ID'
            });
        }

        const result = await Resource.delete(resourceId, userId);

        console.log(`删除结果: ${result}`);

        if (!result) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '资源不存在或无权删除'
            });
        }

        res.json({
            success: true,
            code: 200,
            message: '删除成功'
        });

    } catch (error) {
        console.error('删除资源错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 切换资源公开/私有状态
 * PUT /api/resources/:id/public
 */
const togglePublic = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未登录' });
        }
        const success = await Resource.togglePublic(parseInt(id), userId);
        if (!success) {
            return res.status(404).json({ success: false, message: '资源不存在或无权操作' });
        }
        res.json({ success: true, message: '切换成功' });
    } catch (error) {
        console.error('切换公开状态错误:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

/**
 * 复制资源到我的资源
 * POST /api/resources/:id/copy
 */
const copyToMyResources = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: '未登录' });
        }
        const newResource = await Resource.copyToUser(parseInt(id), userId);
        if (!newResource) {
            return res.status(404).json({ success: false, message: '资源不存在' });
        }
        res.status(201).json({ success: true, message: '已复制到我的资源', data: newResource });
    } catch (error) {
        console.error('复制资源错误:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

/**
 * 统一获取所有资源列表（教案、PPT、作品集、上传资源）
 * GET /api/resources/all
 */
const getAllResources = async (req, res) => {
    try {
        const { page = 1, pageSize = 20, keyword, type, fileFormat, subject, grade, sortBy, sortOrder } = req.query;

        // 解析 fileFormat：支持逗号分隔的多值（如 "doc,docx"）
        const parsedFileFormat = fileFormat ? fileFormat.split(',').map(f => f.trim().toLowerCase()).filter(Boolean) : null;

        const result = await Resource.findAllUnified({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            keyword,
            type,
            fileFormat: parsedFileFormat,
            subject,
            grade,
            sortBy,
            sortOrder
        });

        res.json({
            success: true,
            message: '获取统一资源列表成功',
            data: { items: result.items },
            pagination: result.pagination
        });

    } catch (error) {
        console.error('获取统一资源列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

module.exports = {
    uploadResource,
    getResourceList,
    getResourceDetail,
    downloadResource,
    previewResource,
    previewTextResource,
    toggleFavorite,
    togglePublic,
    copyToMyResources,
    getMyFavorites,
    getMyResources,
    deleteResource,
    getAllResources
};
