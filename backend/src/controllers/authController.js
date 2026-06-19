/**
 * 认证控制器
 * 处理用户注册、登录等认证相关操作
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret, getJwtExpiresIn } = require('../config/auth');
const { sendVerificationCode } = require('../services/emailService');
const { storeCode, verifyCode, hasValidCode, getRemainingTime } = require('../services/verificationCodeService');
const { generateCode } = require('../utils/codeGenerator');

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
        getJwtSecret(),
        { expiresIn: getJwtExpiresIn() }
    );
};

/**
 * 发送邮箱验证码
 * POST /api/auth/send-verification-code
 */
const sendVerificationCodeController = async (req, res) => {
    try {
        const { email } = req.body;

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请输入正确的邮箱格式'
            });
        }

        // 检查邮箱是否已注册
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                code: 409,
                message: '该邮箱已注册，请直接登录'
            });
        }

        // 检查是否已有有效验证码（防止频繁发送）
        if (hasValidCode(email)) {
            const remainingTime = getRemainingTime(email);
            return res.status(429).json({
                success: false,
                code: 429,
                message: `验证码已发送，请等待 ${remainingTime} 秒后再试`
            });
        }

        // 生成验证码
        const code = generateCode();

        // 存储验证码（10分钟有效）
        storeCode(email, code, 10);

        // 发送验证码邮件
        const emailResult = await sendVerificationCode(email, code);

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: '验证码发送失败，请稍后重试'
            });
        }

        res.json({
            success: true,
            message: '验证码已发送到您的邮箱',
            data: {
                email,
                // 开发环境返回验证码，生产环境不返回
                code: process.env.NODE_ENV === 'development' ? code : undefined
            }
        });

    } catch (error) {
        console.error('发送验证码错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 发送登录验证码
 * POST /api/auth/send-login-code
 */
const sendLoginCode = async (req, res) => {
    try {
        const { email } = req.body;

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请输入正确的邮箱格式'
            });
        }

        // 检查邮箱是否已注册
        const existingUser = await User.findByEmail(email);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '该邮箱未注册，请先注册'
            });
        }

        // 检查是否已有有效验证码（防止频繁发送）
        if (hasValidCode(email)) {
            const remainingTime = getRemainingTime(email);
            return res.status(429).json({
                success: false,
                code: 429,
                message: `验证码已发送，请等待 ${remainingTime} 秒后再试`
            });
        }

        // 生成验证码
        const code = generateCode();

        // 存储验证码（5分钟有效）
        storeCode(email, code, 5);

        // 发送验证码邮件（登录类型）
        const emailResult = await sendVerificationCode(email, code, 'login');

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: '验证码发送失败，请稍后重试'
            });
        }

        res.json({
            success: true,
            message: '验证码已发送到您的邮箱',
            data: {
                email,
                // 开发环境返回验证码，生产环境不返回
                code: process.env.NODE_ENV === 'development' ? code : undefined
            }
        });

    } catch (error) {
        console.error('发送登录验证码错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 注册新用户
 * POST /api/auth/register
 *
 * 请求体：{ email, password, verificationCode }
 */
const register = async (req, res) => {
    try {
        const { email, password, verificationCode } = req.body;

        console.log('注册请求:', { email });

        // 验证必填字段
        if (!email || !password || !verificationCode) {
            console.log('注册失败: 缺少必填字段');
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供邮箱、密码和验证码'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('注册失败: 邮箱格式错误', email);
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请输入正确的邮箱格式'
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

        // 验证验证码
        if (!verifyCode(email, verificationCode)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '验证码错误或已过期'
            });
        }

        // 检查邮箱是否已存在
        const existingUserByEmail = await User.findByEmail(email);
        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                code: 409,
                message: '该邮箱已注册，请直接登录'
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
            phone: null,
            email: email,
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
                    email: newUser.email,
                    role: newUser.role
                },
                token
            }
        });

    } catch (error) {
        console.error('❌ 注册错误:');
        console.error('请求体:', { email: req.body?.email });
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
 * 请求体：{ login: email|phone|account, password }
 */
const login = async (req, res) => {
    try {
        const { login: loginId, password, verificationCode } = req.body;

        // 验证必填字段
        if (!loginId) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供邮箱/手机号/账号'
            });
        }

        // 验证登录方式：邮箱+验证码 或 密码登录
        const isPhone = /^1[3-9]\d{9}$/.test(loginId);
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId);

        if (isEmail && verificationCode) {
            // 邮箱验证码登录 - 不需要密码
        } else if (password) {
            // 密码登录
        } else {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供密码或验证码进行登录'
            });
        }

        let user = null;

        // 根据登录ID的类型查找用户
        if (isPhone) {
            // 手机号登录
            user = await User.findByPhone(loginId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    code: 404,
                    message: '该手机号未注册，请先注册'
                });
            }
        } else if (isEmail) {
            // 邮箱登录
            user = await User.findByEmail(loginId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    code: 404,
                    message: '该邮箱未注册，请先注册'
                });
            }
        } else {
            // 账号登录
            user = await User.findByAccount(loginId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    code: 401,
                    message: '账号或密码错误'
                });
            }
        }

        // 验证登录凭证
        if (isEmail && verificationCode) {
            // 邮箱验证码登录 - 验证验证码
            if (!verifyCode(loginId, verificationCode)) {
                return res.status(401).json({
                    success: false,
                    code: 401,
                    message: '验证码错误或已过期'
                });
            }
        } else {
            // 密码登录 - 验证密码
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    code: 401,
                    message: '账号或密码错误'
                });
            }
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

        // 如果提供了新邮箱，检查是否已被其他用户注册
        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '请输入正确的邮箱格式'
                });
            }
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    success: false,
                    code: 409,
                    message: '该邮箱已被其他用户注册'
                });
            }
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
 * 上传头像
 * POST /api/auth/avatar
 */
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未授权'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请上传头像文件'
            });
        }

        // 构建头像URL
        const avatarUrl = `/uploads/images/${req.file.filename}`;

        // 更新用户头像
        const success = await User.update(userId, { avatar: avatarUrl });

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
            message: '头像上传成功',
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
        console.error('上传头像错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 修改密码
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { oldPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '未授权访问'
            });
        }

        // 验证必填字段
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供旧密码和新密码'
            });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '新密码不能与旧密码相同'
            });
        }

        // 验证新密码长度
        if (newPassword.length < 6 || newPassword.length > 20) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '新密码长度必须在6-20个字符之间'
            });
        }

        // 获取用户信息
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '用户不存在'
            });
        }

        // 验证旧密码
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '旧密码不正确'
            });
        }

        // 使用 bcrypt 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        const success = await User.update(userId, { password: hashedPassword });

        if (!success) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: '密码更新失败'
            });
        }

        res.json({
            success: true,
            message: '密码修改成功',
            data: {}
        });

    } catch (error) {
        console.error('修改密码错误:', error);
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

/**
 * 发送重置密码验证码
 * POST /api/auth/send-reset-password-code
 */
const sendResetPasswordCode = async (req, res) => {
    try {
        const { email } = req.body;

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请输入正确的邮箱格式'
            });
        }

        // 检查邮箱是否已注册
        const existingUser = await User.findByEmail(email);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '该邮箱未注册，请先注册'
            });
        }

        // 检查是否已有有效验证码（防止频繁发送）
        if (hasValidCode(`reset:${email}`)) {
            const remainingTime = getRemainingTime(`reset:${email}`);
            return res.status(429).json({
                success: false,
                code: 429,
                message: `验证码已发送，请等待 ${remainingTime} 秒后再试`
            });
        }

        // 生成验证码
        const code = generateCode();

        // 存储验证码（10分钟有效），使用 reset: 前缀区分
        storeCode(`reset:${email}`, code, 10);

        // 发送验证码邮件（重置密码类型）
        const emailResult = await sendVerificationCode(email, code, 'resetPassword');

        if (!emailResult.success) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: '验证码发送失败，请稍后重试'
            });
        }

        res.json({
            success: true,
            message: '验证码已发送到您的邮箱',
            data: {
                email,
                code: process.env.NODE_ENV === 'development' ? code : undefined
            }
        });

    } catch (error) {
        console.error('发送重置密码验证码错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '服务器内部错误'
        });
    }
};

/**
 * 重置密码
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { email, verificationCode, newPassword } = req.body;

        // 验证必填字段
        if (!email || !verificationCode || !newPassword) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供邮箱、验证码和新密码'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请输入正确的邮箱格式'
            });
        }

        // 验证新密码长度
        if (newPassword.length < 6 || newPassword.length > 20) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '新密码长度必须在6-20个字符之间'
            });
        }

        // 检查邮箱是否已注册
        const existingUser = await User.findByEmail(email);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '该邮箱未注册，请先注册'
            });
        }

        // 验证验证码（使用 reset: 前缀）
        const isValid = verifyCode(`reset:${email}`, verificationCode);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '验证码无效或已过期'
            });
        }

        // 使用 bcrypt 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        const success = await User.update(existingUser.id, { password: hashedPassword });

        if (!success) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: '密码重置失败'
            });
        }

        res.json({
            success: true,
            message: '密码重置成功，请使用新密码登录',
            data: {}
        });

    } catch (error) {
        console.error('重置密码错误:', error);
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
    uploadAvatar,
    changePassword,
    deleteAccount,
    refreshToken,
    sendVerificationCodeController,
    sendLoginCode,
    sendResetPasswordCode,
    resetPassword
};
