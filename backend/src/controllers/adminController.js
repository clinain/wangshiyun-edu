const User = require('../models/User');
const AdminOperationLog = require('../models/AdminOperationLog');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * 获取客户端IP地址
 */
const getClientIp = (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
};

/**
 * 生成随机临时密码
 */
const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

/**
 * 获取用户列表（分页+搜索+筛选）
 */
const getUsers = async (req, res) => {
    try {
        const { page = 1, pageSize = 20, keyword, role, status } = req.query;
        
        const result = await User.findAll({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            keyword,
            role,
            status: status !== undefined ? parseInt(status) : undefined
        });
        
        // 获取统计数据
        const stats = await User.countByRole();
        
        // 记录操作日志
        await AdminOperationLog.create({
            adminId: req.user.id,
            targetUserId: null,
            action: 'view_list',
            detail: `查看用户列表，搜索条件：keyword=${keyword || '无'}, role=${role || '全部'}, status=${status || '全部'}`,
            ipAddress: getClientIp(req)
        });
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ message: '获取用户列表失败' });
    }
};

/**
 * 获取用户详情
 */
const getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 安全查询用户（排除密码）
        const user = await User.findByIdSafe(id);
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 记录操作日志
        await AdminOperationLog.create({
            adminId: req.user.id,
            targetUserId: parseInt(id),
            action: 'view_detail',
            detail: `查看用户详情：${user.name || user.username}`,
            ipAddress: getClientIp(req)
        });
        
        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('获取用户详情失败:', error);
        res.status(500).json({ message: '获取用户详情失败' });
    }
};

/**
 * 启用/禁用用户
 */
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // 验证状态值
        if (status !== 0 && status !== 1) {
            return res.status(400).json({ message: '状态值无效，必须为 0 或 1' });
        }
        
        // 不能禁用自己的账号
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: '不能禁用自己的账号' });
        }
        
        // 检查目标用户是否存在
        const targetUser = await User.findByIdSafe(id);
        if (!targetUser) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 更新状态
        await User.updateStatus(id, status);
        
        // 记录操作日志
        await AdminOperationLog.create({
            adminId: req.user.id,
            targetUserId: parseInt(id),
            action: status === 1 ? 'enable_user' : 'disable_user',
            detail: `${status === 1 ? '启用' : '禁用'}用户：${targetUser.name || targetUser.username}`,
            ipAddress: getClientIp(req)
        });
        
        res.json({
            success: true,
            message: `${status === 1 ? '启用' : '禁用'}成功`
        });
    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).json({ message: '更新用户状态失败' });
    }
};

/**
 * 修改用户角色
 */
const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        // 验证角色值 - 只允许 student 和 admin
        const validRoles = ['student', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: '角色值无效，必须为 student 或 admin' });
        }
        
        // 不能修改自己的角色
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: '不能修改自己的角色' });
        }
        
        // 检查目标用户是否存在
        const targetUser = await User.findByIdSafe(id);
        if (!targetUser) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 更新角色
        await User.updateRole(id, role);
        
        // 记录操作日志
        await AdminOperationLog.create({
            adminId: req.user.id,
            targetUserId: parseInt(id),
            action: 'change_role',
            detail: `将用户 ${targetUser.name || targetUser.username} 的角色从 ${targetUser.role} 修改为 ${role}`,
            ipAddress: getClientIp(req)
        });
        
        res.json({
            success: true,
            message: '角色修改成功'
        });
    } catch (error) {
        console.error('修改用户角色失败:', error);
        res.status(500).json({ message: '修改用户角色失败' });
    }
};

/**
 * 重置用户密码
 */
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 检查目标用户是否存在
        const targetUser = await User.findByIdSafe(id);
        if (!targetUser) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 生成随机临时密码
        const tempPassword = generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // 更新密码
        await User.updatePassword(id, hashedPassword);
        
        // 记录操作日志
        await AdminOperationLog.create({
            adminId: req.user.id,
            targetUserId: parseInt(id),
            action: 'reset_password',
            detail: `重置用户 ${targetUser.name || targetUser.username} 的密码`,
            ipAddress: getClientIp(req)
        });
        
        res.json({
            success: true,
            message: '密码重置成功',
            data: { temporaryPassword: tempPassword }
        });
    } catch (error) {
        console.error('重置密码失败:', error);
        res.status(500).json({ message: '重置密码失败' });
    }
};

/**
 * 删除用户
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 不能删除自己
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: '不能删除自己的账号' });
        }
        
        // 检查目标用户是否存在
        const targetUser = await User.findByIdSafe(id);
        if (!targetUser) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 删除用户
        await User.deleteById(id);
        
        // 记录操作日志
        await AdminOperationLog.create({
            adminId: req.user.id,
            targetUserId: parseInt(id),
            action: 'delete_user',
            detail: `删除用户：${targetUser.name || targetUser.username} (${targetUser.email || targetUser.phone})`,
            ipAddress: getClientIp(req)
        });
        
        res.json({
            success: true,
            message: '用户删除成功'
        });
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({ message: '删除用户失败' });
    }
};

/**
 * 获取系统统计
 */
const getStats = async (req, res) => {
    try {
        const stats = await User.countByRole();
        
        res.json({
            success: true,
            data: {
                totalUsers: stats.total,
                studentCount: stats.studentCount || 0,
                teacherCount: stats.teacherCount || 0,
                adminCount: stats.adminCount || 0,
                activeUsers: stats.activeCount || 0
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ message: '获取统计数据失败' });
    }
};

/**
 * 获取操作日志
 */
const getLogs = async (req, res) => {
    try {
        const { page = 1, pageSize = 20, adminId, action } = req.query;
        
        const result = await AdminOperationLog.findAll({
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            adminId: adminId ? parseInt(adminId) : undefined,
            action
        });
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('获取操作日志失败:', error);
        res.status(500).json({ message: '获取操作日志失败' });
    }
};

module.exports = {
    getUsers,
    getUserDetail,
    toggleUserStatus,
    changeUserRole,
    resetPassword,
    deleteUser,
    getStats,
    getLogs
};
