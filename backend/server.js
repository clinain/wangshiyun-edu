/**
 * ============================================
 * 网师云-师范生备课辅助系统
 * 后端服务器入口文件
 * ============================================
 *
 * 功能：
 * - Express 应用初始化
 * - CORS 跨域配置
 * - JSON 请求解析
 * - 数据库连接测试
 * - 基础路由（/, /health）
 * - 错误处理
 * - 端口监听
 *
 * @version 1.0.0
 * @since 2024-01-01
 */

'use strict';

/**
 * ============================================
 * 模块导入
 * ============================================
 */

// 加载环境变量配置
require('dotenv').config();

// Express 框架
const express = require('express');

// CORS 跨域资源共享
const cors = require('cors');

// 数据库配置模块
const db = require('./src/config/database');

/**
 * ============================================
 * 应用配置
 * ============================================
 */

// 创建 Express 应用实例
const app = express();

// 服务器端口配置
const PORT = process.env.PORT || 3000;

// 环境配置
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * ============================================
 * 中间件配置
 * ============================================
 */

// CORS 跨域配置
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// JSON 请求体解析（最大 10MB）
app.use(express.json({ limit: '10mb' }));

// URL 编码解析
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 上传的文件（支持 CORS 以便 OnlyOffice 编辑器可以访问）
const path = require('path');
app.use('/uploads', (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(__dirname, 'uploads')));

/**
 * ============================================
 * 请求日志中间件
 * ============================================
 */

app.use((req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const timestamp = new Date().toISOString();

        console.log(`📝 [${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });

    next();
});

/**
 * ============================================
 * 路由配置
 * ============================================
 */

/**
 * 根路由 - API 信息
 * GET /
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '网师云 API 服务',
        version: '1.0.0',
        description: '师范生备课辅助系统后端API',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            users: '/api/users',
            lessons: '/api/lessons',
            ai: '/api/ai'
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * 健康检查路由
 * GET /health
 */
app.get('/health', async (req, res) => {
    try {
        const dbHealthy = await db.testConnection();

        const healthData = {
            status: dbHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            environment: NODE_ENV,
            services: {
                api: 'healthy',
                database: dbHealthy ? 'healthy' : 'unhealthy'
            }
        };

        res.status(dbHealthy ? 200 : 503).json(healthData);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            services: {
                api: 'healthy',
                database: 'unhealthy'
            }
        });
    }
});

/**
 * API 路由注册
 */
try {
    app.use('/api/auth', require('./src/routes/auth'));
    console.log('✅ 认证路由已加载: /api/auth');

    app.use('/api/users', require('./src/routes/users'));
    console.log('✅ 用户路由已加载: /api/users');

    app.use('/api/lessons', require('./src/routes/lessons'));
    console.log('✅ 课程路由已加载: /api/lessons');

    app.use('/api/ppt', require('./src/routes/ppt'));
    console.log('✅ PPT路由已加载: /api/ppt');

    app.use('/api/resources', require('./src/routes/resources'));
    console.log('✅ 资源路由已加载: /api/resources');

    app.use('/api', require('./src/routes/comments'));
    console.log('✅ 评论路由已加载: /api');

    app.use('/api/portfolios', require('./src/routes/portfolios'));
    console.log('✅ 作品集路由已加载: /api/portfolios');

    app.use('/api/ai', require('./src/routes/ai'));
    console.log('✅ AI路由已加载: /api/ai');

    app.use('/api/standard', require('./src/routes/standard'));
    console.log('✅ 新课标检测路由已加载: /api/standard');

    app.use('/api/onlyoffice', require('./src/routes/onlyoffice'));
    console.log('✅ ONLYOFFICE路由已加载: /api/onlyoffice');

    app.use('/api/knowledge-base', require('./src/routes/knowledgeBase'));
    console.log('✅ 知识库路由已加载: /api/knowledge-base');
} catch (error) {
    console.log('⚠️ 部分路由加载失败:', error.message);
}

/**
 * ============================================
 * 错误处理
 * ============================================
 */

/**
 * 404 错误处理
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        code: 404,
        message: '接口不存在',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

/**
 * 全局错误处理
 */
app.use((err, req, res, next) => {
    console.error('❌ 服务器错误:', err.message);

    let statusCode = err.status || err.statusCode || 500;
    let errorMessage = err.message || '服务器内部错误';

    if (NODE_ENV === 'production' && statusCode >= 500) {
        errorMessage = '服务器内部错误，请稍后重试';
    }

    res.status(statusCode).json({
        success: false,
        code: statusCode,
        message: errorMessage,
        timestamp: new Date().toISOString()
    });
});

/**
 * ============================================
 * 服务器启动
 * ============================================
 */

const startServer = async () => {
    try {
        console.log('');
        console.log('🚀 网师云-师范生备课辅助系统');
        console.log('==========================================');
        console.log('⏳ 正在启动服务器...');
        console.log('');

        // 测试数据库连接
        console.log('📦 正在连接数据库...');
        const dbConnected = await db.testConnection();

        if (dbConnected) {
            console.log('✅ 数据库连接成功');
        } else {
            console.log('⚠️ 数据库连接失败，服务将以受限模式运行');
        }

        console.log('');

        // 启动 HTTP 服务器
        app.listen(PORT, () => {
            console.log('==========================================');
            console.log('✅ 服务器启动成功！');
            console.log('==========================================');
            console.log('');
            console.log(`🌐 服务地址: http://localhost:${PORT}`);
            console.log(`💚 健康检查: http://localhost:${PORT}/health`);
            console.log(`📊 环境: ${NODE_ENV}`);
            console.log(`🔌 端口: ${PORT}`);
            console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
            console.log('');
            console.log('==========================================');
            console.log('✨ 服务器已准备就绪，等待请求中...');
            console.log('==========================================');
            console.log('');
        });

    } catch (error) {
        console.error('❌ 服务器启动失败:', error.message);
        console.log('⚠️ 服务器将继续运行以便调试...');
    }
};

/**
 * ============================================
 * 优雅关闭处理
 * ============================================
 */

const gracefulShutdown = async (signal) => {
    console.log('');
    console.log(`📤 收到 ${signal} 信号，正在关闭服务器...`);

    try {
        console.log('🔌 正在关闭数据库连接...');
        await db.closePool();
        console.log('✅ 数据库连接已关闭');
        console.log('✅ 服务已成功关闭');
        process.exit(0);
    } catch (error) {
        console.error('❌ 关闭服务时发生错误:', error.message);
        process.exit(1);
    }
};

// 监听进程信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('💥 未捕获的异常:', error.message);
    gracefulShutdown('uncaughtException');
});

// 监听未处理的 Promise 拒绝
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ 未处理的 Promise 拒绝:', reason);
});

/**
 * ============================================
 * 启动应用
 * ============================================
 */

startServer();

module.exports = app;
