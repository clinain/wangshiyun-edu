/**
 * 资源路由
 * 处理教学资源的上传、管理和下载
 */

const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { auth, optionalAuth } = require('../middleware/auth');
const { uploadWithHandler } = require('../middleware/upload');

// 公开路由（无需认证）
router.get('/', optionalAuth, resourceController.getResourceList);

// 需要认证的路由
router.post('/upload', auth, uploadWithHandler, resourceController.uploadResource);
router.get('/favorites', auth, resourceController.getMyFavorites);
router.get('/my', auth, resourceController.getMyResources);

// 动态路由要放在具体路由后面
router.get('/:id', optionalAuth, resourceController.getResourceDetail);
router.get('/:id/download', optionalAuth, resourceController.downloadResource);
router.post('/:id/favorite', auth, resourceController.toggleFavorite);
router.put('/:id/public', auth, resourceController.togglePublic);
router.post('/:id/copy', auth, resourceController.copyToMyResources);
router.delete('/:id', auth, resourceController.deleteResource);

module.exports = router;
