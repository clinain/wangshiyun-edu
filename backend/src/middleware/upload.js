/**
 * 文件上传中间件
 * 使用 multer 处理文件上传
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '../../uploads');

// 确保上传目录存在
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 文件类型映射
// 注意：已移除 image/svg+xml，因为 SVG 可嵌入 JavaScript 代码，存在 XSS 风险
const FILE_TYPES = {
    'image/jpeg': 'images',
    'image/png': 'images',
    'image/gif': 'images',
    'image/webp': 'images',
    'image/bmp': 'images',
    'application/pdf': 'documents',
    'application/msword': 'documents',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documents',
    'application/vnd.ms-powerpoint': 'documents',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'documents',
    'application/vnd.ms-excel': 'documents',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'documents',
    'video/mp4': 'videos',
    'video/mpeg': 'videos',
    'video/webm': 'videos',
    'video/avi': 'videos',
    'video/quicktime': 'videos',
    'audio/mpeg': 'others',
    'audio/wav': 'others',
    'audio/ogg': 'others',
    'audio/mp4': 'others',
    'audio/x-m4a': 'others',
    'audio/flac': 'others',
    'audio/aac': 'others',
};

// 文件扩展名映射
const EXT_MAP = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'video/webm': '.webm',
    'video/avi': '.avi',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a',
    'audio/flac': '.flac',
    'audio/aac': '.aac',
};

// 存储配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fileType = FILE_TYPES[file.mimetype] || 'others';
        const typeDir = path.join(uploadsDir, fileType);

        // 确保类型目录存在
        if (!fs.existsSync(typeDir)) {
            fs.mkdirSync(typeDir, { recursive: true });
        }

        cb(null, typeDir);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名：时间戳-随机数-原始扩展名
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname) || (EXT_MAP[file.mimetype] || '.bin');
        const filename = `${timestamp}-${random}${ext}`;

        cb(null, filename);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = Object.keys(FILE_TYPES);

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
    }
};

// 创建 multer 实例 - 头像上传（限制 5MB）
const avatarUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 最大 5MB
        files: 1 // 最多 1 个文件
    }
});

// 创建 multer 实例 - 资源上传（限制 100MB）
const resourceUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 最大 100MB
        files: 1 // 最多 1 个文件
    }
});

// 带错误处理的上传中间件包装器
// multerInstance: multer 实例，maxSizeMB: 最大文件大小（MB），用于错误提示
const uploadWithHandler = (multerInstance, maxSizeMB) => {
    return (req, res, next) => {
        multerInstance.single('file')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        code: 400,
                        message: `文件大小超过限制（最大${maxSizeMB}MB）`
                    });
                }
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: `文件上传错误: ${err.message}`
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: err.message
                });
            }

            // 文件上传成功
            if (req.file) {
                console.log(`✅ 文件上传成功: ${req.file.originalname} -> ${req.file.filename}`);
            }

            next();
        });
    };
};

// 头像上传中间件（5MB 限制）
const uploadAvatar = uploadWithHandler(avatarUpload, 5);

// 资源上传中间件（100MB 限制）
const uploadResource = uploadWithHandler(resourceUpload, 100);

// 获取文件URL（包含子目录）
const getFileUrl = (req, filename, mimetype) => {
    const subDir = (mimetype && FILE_TYPES[mimetype]) || 'others';
    return `/uploads/${subDir}/${filename}`;
};

// 获取资源类型（返回值必须与数据库 resources.type ENUM 匹配）
const getResourceType = (mimetype) => {
    const type = FILE_TYPES[mimetype];
    if (type === 'images') return 'image';
    if (type === 'documents') return 'document';
    if (type === 'videos') return 'video';
    if (type === 'others' && mimetype.startsWith('audio/')) return 'audio';
    return 'other';
};

// 删除文件
const deleteFile = (filename) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(uploadsDir, '**', filename);

        // 遍历所有子目录查找文件
        const dirs = ['images', 'documents', 'videos', 'others'];
        let found = false;

        const checkDir = (index) => {
            if (index >= dirs.length) {
                if (!found) {
                    reject(new Error('文件不存在'));
                }
                return;
            }

            const dirPath = path.join(uploadsDir, dirs[index]);
            const filePath = path.join(dirPath, filename);

            fs.unlink(filePath, (err) => {
                if (!err) {
                    found = true;
                    resolve(filePath);
                } else {
                    checkDir(index + 1);
                }
            });
        };

        checkDir(0);
    });
};

module.exports = {
    uploadAvatar,
    uploadResource,
    getFileUrl,
    getResourceType,
    deleteFile,
    uploadsDir
};
