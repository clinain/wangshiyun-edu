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
const FILE_TYPES = {
    'image/jpeg': 'images',
    'image/png': 'images',
    'image/gif': 'images',
    'image/webp': 'images',
    'application/pdf': 'documents',
    'application/msword': 'documents',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documents',
    'application/vnd.ms-powerpoint': 'documents',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'documents',
    'video/mp4': 'videos',
    'video/mpeg': 'videos',
    'video/webm': 'videos'
};

// 文件扩展名映射
const EXT_MAP = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'video/webm': '.webm'
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

// 创建 multer 实例
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 最大 50MB
        files: 1 // 最多 1 个文件
    }
});

// 单文件上传中间件
const uploadSingle = upload.single('file');

// 带错误处理的上传中间件
const uploadWithHandler = (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '文件大小超过限制（最大50MB）'
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

// 获取文件URL（包含子目录）
const getFileUrl = (req, filename, mimetype) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const subDir = (mimetype && FILE_TYPES[mimetype]) || 'others';
    return `${protocol}://${host}/uploads/${subDir}/${filename}`;
};

// 获取资源类型（返回值必须与数据库 resources.type ENUM 匹配）
const getResourceType = (mimetype) => {
    const type = FILE_TYPES[mimetype];
    if (type === 'images') return 'image';
    if (type === 'documents') return 'document';
    if (type === 'videos') return 'video';
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
    uploadWithHandler,
    getFileUrl,
    getResourceType,
    deleteFile,
    uploadsDir
};
