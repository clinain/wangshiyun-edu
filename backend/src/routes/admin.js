const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, requireRole } = require('../middleware/auth');

// 所有管理员路由都需要认证和 admin 角色
router.use(auth);
router.use(requireRole('admin'));

// 用户管理
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.put('/users/:id/role', adminController.changeUserRole);
router.post('/users/:id/reset-password', adminController.resetPassword);
router.delete('/users/:id', adminController.deleteUser);

// 系统统计
router.get('/stats', adminController.getStats);

// 操作日志
router.get('/logs', adminController.getLogs);

module.exports = router;
