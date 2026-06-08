/**
 * 认证路由
 * 处理用户注册、登录、Token刷新等功能
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// 注册
router.post('/register', authController.register);

// 登录
router.post('/login', authController.login);

// 获取当前用户信息（需要认证）
router.get('/me', auth, authController.getCurrentUser);

// 获取用户统计数据（需要认证）
router.get('/stats', auth, authController.getUserStats);

// 更新用户资料（需要认证）
router.put('/profile', auth, authController.updateProfile);

// 注销账号（需要认证）
router.delete('/account', auth, authController.deleteAccount);

// 刷新Token
router.post('/refresh', authController.refreshToken);

module.exports = router;
