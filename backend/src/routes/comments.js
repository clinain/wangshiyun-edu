/**
 * 评论路由
 * 处理资源和作品集评论的增删查
 */

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { auth, optionalAuth } = require('../middleware/auth');

// ===== 资源评论路由 =====
router.get('/resources/:id/comments', optionalAuth, commentController.getComments);
router.get('/resources/:id/comments/stats', optionalAuth, commentController.getCommentStats);
router.post('/resources/:id/comments', auth, commentController.createComment);

// ===== 作品集评论路由 =====
router.get('/portfolios/:id/comments', optionalAuth, commentController.getComments);
router.get('/portfolios/:id/comments/stats', optionalAuth, commentController.getCommentStats);
router.post('/portfolios/:id/comments', auth, commentController.createComment);

// ===== 通用评论操作 =====
router.get('/comments/:commentId/replies', optionalAuth, commentController.getReplies);
router.delete('/comments/:commentId', auth, commentController.deleteComment);

module.exports = router;
