/**
 * 通知路由
 * 处理通知的查询、标记已读、删除等操作
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

// 所有通知路由都需要认证
router.use(auth);

// 获取通知列表
router.get('/', notificationController.getNotifications);

// 获取未读通知数量
router.get('/unread-count', notificationController.getUnreadCount);

// 标记所有通知为已读（放在 :id 路由前面）
router.put('/read-all', notificationController.markAllAsRead);

// 标记单条通知为已读
router.put('/:id/read', notificationController.markAsRead);

// 删除通知
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
