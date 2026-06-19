/**
 * JWT 认证中间件
 * 验证请求中的 JWT Token
 */

const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/auth');

/**
 * 认证中间件
 * 验证 Token 并将用户信息附加到 req.user
 */
const auth = (req, res, next) => {
    try {
        // 从 Authorization header 获取 Token
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未提供认证Token'
            });
        }

        // 检查格式：Bearer <token>
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                code: 401,
                message: 'Token格式错误，应为：Bearer <token>'
            });
        }

        const token = parts[1];

        // 验证 Token
        const decoded = jwt.verify(token, getJwtSecret());

        // 将用户信息附加到请求对象
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                code: 401,
                message: 'Token已过期，请重新登录'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '无效的Token'
            });
        }

        return res.status(401).json({
            success: false,
            code: 401,
            message: '认证失败'
        });
    }
};

/**
 * 可选的认证中间件
 * 如果有 Token 则验证，没有则继续（req.user 为 undefined）
 */
const optionalAuth = (req, res, next) => {
    try {
        // 支持从 Authorization header 或 query 参数获取 token
        // query 参数方式用于 iframe 加载等无法设置自定义 header 的场景
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }

        // 如果 header 中没有 token，尝试从 query 参数获取
        if (!token && req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            req.user = undefined;
            return next();
        }

        const decoded = jwt.verify(token, getJwtSecret());

        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };

        next();
    } catch (error) {
        // Token 无效，继续但不带用户信息
        req.user = undefined;
        next();
    }
};

/**
 * 角色验证中间件
 * 需要配合 auth 中间件使用
 * @param {string[]} roles 允许的角色数组
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未认证'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '权限不足，需要特定角色'
            });
        }

        next();
    };
};

module.exports = {
    auth,
    optionalAuth,
    requireRole
};
