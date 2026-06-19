/**
 * 认证路由
 * 处理用户注册、登录、Token刷新等功能
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

// 注册
router.post('/register', authController.register);

// 发送注册验证码
router.post('/send-verification-code', authController.sendVerificationCodeController);

// 发送登录验证码
router.post('/send-login-code', authController.sendLoginCode);

// 登录
router.post('/login', authController.login);

// 获取当前用户信息（需要认证）
router.get('/me', auth, authController.getCurrentUser);

// 获取用户统计数据（需要认证）
router.get('/stats', auth, authController.getUserStats);

// 更新用户资料（需要认证）
router.put('/profile', auth, authController.updateProfile);

// 上传头像（需要认证）
router.post('/avatar', auth, uploadAvatar, authController.uploadAvatar);

// 修改密码（需要认证）
router.post('/change-password', auth, authController.changePassword);

// 发送重置密码验证码
router.post('/send-reset-password-code', authController.sendResetPasswordCode);

// 重置密码
router.post('/reset-password', authController.resetPassword);

// 注销账号（需要认证）
router.delete('/account', auth, authController.deleteAccount);

// 刷新Token
router.post('/refresh', auth, authController.refreshToken);

module.exports = router;
