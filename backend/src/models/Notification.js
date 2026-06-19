/**
 * 通知模型
 * 提供通知数据的数据库操作方法
 */

const db = require('../config/database');

const getCurrentTimestamp = () => new Date().toISOString();

class Notification {
    /**
     * 创建通知
     * @param {Object} notificationData 通知数据
     * @returns {Promise<Object>} 创建的通知信息
     */
    static async create(notificationData) {
        const {
            userId,
            senderId = null,
            type,
            title,
            content = null,
            resourceId = null,
            portfolioId = null,
            commentId = null
        } = notificationData;

        const createdAt = getCurrentTimestamp();
        const sql = `
            INSERT INTO notifications (
                user_id, sender_id, type, title, content,
                resource_id, portfolio_id, comment_id, is_read, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        `;

        try {
            const result = await db.query(sql, [
                userId,
                senderId,
                type,
                title,
                content,
                resourceId,
                portfolioId,
                commentId,
                createdAt
            ]);
            return { id: result.insertId, ...notificationData, isRead: false, createdAt };
        } catch (error) {
            console.error('Notification.create 错误:', error);
            throw error;
        }
    }

    /**
     * 获取用户的通知列表（带发送者信息）
     * @param {number} userId 用户ID
     * @param {Object} options 分页选项
     * @returns {Promise<Object>} 通知列表和分页信息
     */
    static async findByUser(userId, options = {}) {
        const { page = 1, pageSize = 20, type = null } = options;
        const offset = (page - 1) * pageSize;

        let whereClause = 'WHERE n.user_id = ?';
        const params = [userId];

        if (type) {
            whereClause += ' AND n.type = ?';
            params.push(type);
        }

        try {
            const countSql = `SELECT COUNT(*) as total FROM notifications n ${whereClause}`;
            const countResult = await db.query(countSql, params);
            const total = countResult[0]?.total || 0;

            const listSql = `
                SELECT 
                    n.id,
                    n.user_id as userId,
                    n.sender_id as senderId,
                    n.type,
                    n.title,
                    n.content,
                    n.resource_id as resourceId,
                    n.portfolio_id as portfolioId,
                    n.comment_id as commentId,
                    n.is_read as isRead,
                    n.created_at as createdAt,
                    u.name as senderName,
                    u.avatar as senderAvatar
                FROM notifications n
                LEFT JOIN users u ON n.sender_id = u.id
                ${whereClause}
                ORDER BY n.created_at DESC
                LIMIT ? OFFSET ?
            `;
            const notifications = await db.query(listSql, [...params, pageSize, offset]);

            return {
                notifications,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: parseInt(total),
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        } catch (error) {
            console.error('Notification.findByUser 错误:', error);
            throw error;
        }
    }

    /**
     * 获取用户未读通知数量
     * @param {number} userId 用户ID
     * @returns {Promise<number>} 未读通知数量
     */
    static async getUnreadCount(userId) {
        const sql = `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`;
        try {
            const result = await db.query(sql, [userId]);
            return result[0]?.count || 0;
        } catch (error) {
            console.error('Notification.getUnreadCount 错误:', error);
            throw error;
        }
    }

    /**
     * 标记单条通知为已读
     * @param {number} notificationId 通知ID
     * @param {number} userId 用户ID（验证权限）
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async markAsRead(notificationId, userId) {
        const sql = `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`;
        try {
            const result = await db.query(sql, [notificationId, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Notification.markAsRead 错误:', error);
            throw error;
        }
    }

    /**
     * 标记用户所有通知为已读
     * @param {number} userId 用户ID
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async markAllAsRead(userId) {
        const sql = `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`;
        try {
            const result = await db.query(sql, [userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Notification.markAllAsRead 错误:', error);
            throw error;
        }
    }

    /**
     * 删除单条通知
     * @param {number} notificationId 通知ID
     * @param {number} userId 用户ID（验证权限）
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async delete(notificationId, userId) {
        const sql = `DELETE FROM notifications WHERE id = ? AND user_id = ?`;
        try {
            const result = await db.query(sql, [notificationId, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Notification.delete 错误:', error);
            throw error;
        }
    }
}

module.exports = Notification;
