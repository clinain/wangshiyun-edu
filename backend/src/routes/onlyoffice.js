/**
 * ONLYOFFICE 回调路由
 * 处理 ONLYOFFICE Document Server 的保存回调
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pptx');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pptx', '.ppt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 PPTX/PPT 文件'));
    }
  }
});

/**
 * ONLYOFFICE 回调接口
 * 当用户在 ONLYOFFICE 中保存文档时，ONLYOFFICE 会调用此接口
 */
router.post('/callback', auth, (req, res) => {
  try {
    const { status, url, key } = req.body;

    console.log('ONLYOFFICE 回调:', { status, key });

    if (status === 2) {
      // 文档已保存，URL 包含保存后的文件
      // 这里可以下载文件并保存到服务器
      console.log('文档保存成功，URL:', url);
      res.json({ error: 0 });
    } else if (status === 1) {
      // 文档正在编辑中
      res.json({ error: 0 });
    } else if (status === 0) {
      // 文档打开失败
      res.json({ error: 0 });
    } else {
      res.json({ error: 0 });
    }
  } catch (error) {
    console.error('ONLYOFFICE 回调错误:', error);
    res.json({ error: 1 });
  }
});

/**
 * 上传 PPTX 文件
 */
router.post('/upload', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择文件' });
    }

    // 使用 localhost 以便浏览器可以直接访问文件（OnlyOffice 编辑器在浏览器中运行）
    // 同时返回 host.docker.internal 供 OnlyOffice Docker 容器使用
    const localUrl = `http://localhost:3003/uploads/pptx/${req.file.filename}`;
    const dockerUrl = `http://host.docker.internal:3003/uploads/pptx/${req.file.filename}`;

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        url: localUrl,
        dockerUrl: dockerUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      }
    });
  } catch (error) {
    console.error('上传文件错误:', error);
    res.status(500).json({ success: false, message: '上传失败' });
  }
});

/**
 * 获取文件下载链接
 */
router.get('/download/:filename', auth, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/pptx', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('下载文件错误:', error);
    res.status(500).json({ success: false, message: '下载失败' });
  }
});

module.exports = router;
