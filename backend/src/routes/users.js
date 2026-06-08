/**
 * 用户管理路由
 * 处理用户信息的查询、更新、删除等操作
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未授权访问'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token无效或已过期'
    });
  }
};

router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: '获取用户信息成功',
    data: {
      id: 1,
      username: req.user.username || 'demo_user',
      email: req.user.email,
      role: req.user.role,
      createdAt: new Date().toISOString()
    }
  });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { username, phone, avatar } = req.body;
  
  res.json({
    success: true,
    message: '用户信息更新成功',
    data: {
      username,
      phone,
      avatar
    }
  });
});

router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '请提供完整的密码信息'
    });
  }

  res.json({
    success: true,
    message: '密码修改成功'
  });
});

router.get('/lessons', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: '获取用户课程列表成功',
    data: []
  });
});

module.exports = router;
