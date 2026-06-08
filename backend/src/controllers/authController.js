/**
 * 认证控制器
 * 处理用户注册、登录等认证相关操作
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'wangshiyun_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT Token
 * @param {Object} user 用户信息
 * @returns {string} JWT Token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * 注册新用户
 * POST /api/auth/register
 *
 * 请求体：{ phone, password }
 */
const register = async (req, res) => {
    try {
        const { phone, password } = req.body;

        console.log('注册请求:', { phone, password });

        // 验证必填字段
        if (!phone || !password) {
            console.log('注册失败: 缺少必填字段');
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供手机号和密码'
            });
        }

        // 验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            console.log('注册失败: 手机号格式错误', phone);
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请输入正确的手机号格式'
            });
        }

        // 验证密码长度
        if (password.length < 6 || password.length > 20) {
            console.log('注册失败: 密码长度不符合要求');
            return res.status(400).json({
                success: false,
                code: 400,
                message: '密码长度必须在6-20个字符之间'
            });
        }

        // 检查手机号是否已存在
        const existingUserByPhone = await User.findByPhone(phone);
        if (existingUserByPhone) {
            return res.status(409).json({
                success: false,
                code: 409,
                message: '该手机号已注册，请直接登录'
            });
        }

        // 自动生成用户名（纯编号）
        const username = await User.getNextUsername();

        // 使用 bcrypt 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const newUser = await User.create({
            account: username,
            password: hashedPassword,
            name: `用户${username}`,
            phone: phone,
            email: null,
            role: 'student'
        });

        // 生成 Token
        const token = generateToken(newUser);

        // 返回成功响应
        res.status(201).json({
            success: true,
            message: '用户注册成功',
            data: {
                user: {
                    id: newUser.id,
                    account: newUser.account,
                    name: newUser.name,
                    phone: newUser.phone,
                    role: newUser.role
                },
                token
            }
        });

    } catch (error) {
        console.error('❌ 注册错误:');
        console.error('请求体:', req.body);
        console.error('错误类型:', error.constructor.name);
        console.error('错误信息:', error.message);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误，注册失败',
            error: error.message
        });
    }
};

/**
 * 用户登录
 * POST /api/auth/login
 *
 * 请求体：{ login: phone|account, password }
 */
const login = async (req, res) => {
    try {
        const { login: loginId, password } = req.body;

        // 验证必填字段
        if (!loginId || !password) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供账号/手机号和密码'
            });
        }

        // 优先根据手机号查找用户
        let user = await User.findByPhone(loginId);

        // 如果手机号没找到，再根据账号查找
        if (!user) {
            user = await User.findByAccount(loginId);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '账号或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '账号或密码错误'
            });
        }

        // 生成 Token
        const token = generateToken(user);

        // 返回成功响应（不返回密码）
        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: {
                    id: user.id,
                    account: user.username,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    role: user.role,
                    school: user.school,
                    avatar: user.avatar
                },
                token
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误，登录失败'
        });
    }
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
    try {
        // 从 req.user 获取（需要认证中间件）
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未授权访问'
            });
        }

        const user = await User.findById(userId);

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
};

/**
 * 刷新 Token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未授权访问'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '用户不存在'
            });
        }

        // 生成新的 Token
        const newToken = generateToken(user);

        res.json({
            success: true,
            message: 'Token刷新成功',
            data: {
                token: newToken
            }
        });

    } catch (error) {
        console.error('刷新Token错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 获取用户统计数据
 * GET /api/auth/stats
 */
const getUserStats = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未授权访问'
            });
        }

        const db = require('../config/database');

        // 获取教案数量
        const [lessonCountResult] = await db.query('SELECT COUNT(*) as count FROM lessons WHERE user_id = ?', [userId]);
        const lessonCount = lessonCountResult?.count || 0;

        // 获取PPT数量
        const [pptCountResult] = await db.query('SELECT COUNT(*) as count FROM user_ppt_records WHERE user_id = ?', [userId]);
        const pptCount = pptCountResult?.count || 0;

        // 获取作品集数量
        const [portfolioCountResult] = await db.query('SELECT COUNT(*) as count FROM portfolios WHERE user_id = ?', [userId]);
        const portfolioCount = portfolioCountResult?.count || 0;

        // 获取收藏数量
        const [favoriteCountResult] = await db.query('SELECT COUNT(*) as count FROM user_favorites WHERE user_id = ?', [userId]);
        const favoriteCount = favoriteCountResult?.count || 0;

        res.json({
            success: true,
            message: '获取用户统计成功',
            data: {
                lessonCount,
                pptCount,
                portfolioCount,
                favoriteCount
            }
        });

    } catch (error) {
        console.error('获取用户统计错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 更新用户资料
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, email, school } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未授权访问'
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (school !== undefined) updateData.school = school;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '没有要更新的字段'
            });
        }

        const success = await User.update(userId, updateData);

        if (!success) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '用户不存在或更新失败'
            });
        }

        const updatedUser = await User.findById(userId);

        res.json({
            success: true,
            message: '更新资料成功',
            data: {
                id: updatedUser.id,
                account: updatedUser.username,
                name: updatedUser.name,
                phone: updatedUser.phone,
                email: updatedUser.email,
                role: updatedUser.role,
                school: updatedUser.school,
                avatar: updatedUser.avatar
            }
        });

    } catch (error) {
        console.error('更新用户资料错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 注销账号
 * DELETE /api/auth/account
 */
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未授权访问'
            });
        }

        const success = await User.delete(userId);

        if (!success) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '用户不存在或删除失败'
            });
        }

        res.json({
            success: true,
            message: '账号已注销'
        });

    } catch (error) {
        console.error('注销账号错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    getUserStats,
    updateProfile,
    deleteAccount,
    refreshToken
};
