/**
 * 通知控制器
 * 处理通知的查询、标记已读、删除等操作
 */

const Notification = require('../models/Notification');

/**
 * 获取当前用户的通知列表
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        const { page = 1, pageSize = 20, type } = req.query;

        const result = await Notification.findByUser(userId, {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            type
        });

        res.json({
            success: true,
            code: 200,
            data: result
        });
    } catch (error) {
        console.error('获取通知列表失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取通知列表失败'
        });
    }
};

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        const count = await Notification.getUnreadCount(userId);

        res.json({
            success: true,
            code: 200,
            data: { count }
        });
    } catch (error) {
        console.error('获取未读通知数量失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取未读通知数量失败'
        });
    }
};

/**
 * 标记单条通知为已读
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        const updated = await Notification.markAsRead(parseInt(id), userId);

        if (!updated) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '通知不存在或无权操作'
            });
        }

        res.json({
            success: true,
            code: 200,
            message: '已标记为已读'
        });
    } catch (error) {
        console.error('标记通知已读失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '标记通知已读失败'
        });
    }
};

/**
 * 标记所有通知为已读
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        await Notification.markAllAsRead(userId);

        res.json({
            success: true,
            code: 200,
            message: '已全部标记为已读'
        });
    } catch (error) {
        console.error('标记所有通知已读失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '标记所有通知已读失败'
        });
    }
};

/**
 * 删除通知
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                code: 401,
                message: '请先登录'
            });
        }

        const deleted = await Notification.delete(parseInt(id), userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: '通知不存在或无权操作'
            });
        }

        res.json({
            success: true,
            code: 200,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除通知失败:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '删除通知失败'
        });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
