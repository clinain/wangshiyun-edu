/**
 * User management routes.
 *
 * 注意：已移除空壳路由 PUT /profile 和 PUT /password，
 * 这些功能的完整实现在 authController 中：
 *   PUT  /api/auth/profile      -> authController.updateProfile
 *   POST /api/auth/change-password -> authController.changePassword
 *
 * 保留 GET /profile 和 GET /lessons 作为兼容性代理路由。
 */

const express = require('express');
const router = express.Router();
const { auth: authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在'
      });
    }
    res.json({
      success: true,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        account: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        school: user.school,
        avatar: user.avatar,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误'
    });
  }
});

router.get('/lessons', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: '获取用户课程列表成功',
    data: []
  });
});

module.exports = router;
