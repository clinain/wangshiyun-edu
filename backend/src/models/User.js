/**
 * 用户模型
 * 提供用户数据的数据库操作方法
 */

const db = require('../config/database');

/**
 * 用户模型类
 */
class User {
    /**
     * 创建用户
     * @param {Object} userData 用户数据
     * @returns {Promise<Object>} 创建的用户信息
     */
    static async create(userData) {
        const { account, password, name, phone, email, role = 'student' } = userData;

        const sql = `
            INSERT INTO users (username, password, name, phone, email, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        try {
            // 确保所有值都不是 undefined
            const params = [
                account || null,
                password || null,
                name || null,
                phone || null,
                email || null,
                role || 'student'
            ];

            const result = await db.query(sql, params);
            return {
                id: result.insertId,
                account,
                name,
                phone,
                email,
                role
            };
        } catch (error) {
            console.error('User.create 错误:', error);
            throw error;
        }
    }

    /**
     * 根据账号查找用户
     * @param {string} account 账号
     * @returns {Promise<Object|null>} 用户信息
     */
    static async findByAccount(account) {
        const sql = `
            SELECT id, username, password, name, phone, email, role, school, avatar, created_at, updated_at
            FROM users
            WHERE username = ?
        `;

        try {
            const results = await db.query(sql, [account]);
            return results[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 根据ID查找用户
     * @param {number} id 用户ID
     * @returns {Promise<Object|null>} 用户信息
     */
    static async findById(id) {
        const sql = `
            SELECT id, username, name, phone, email, role, school, avatar, created_at, updated_at
            FROM users
            WHERE id = ?
        `;

        try {
            const results = await db.query(sql, [id]);
            return results[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新用户信息
     * @param {number} id 用户ID
     * @param {Object} userData 更新数据
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async update(id, userData) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'phone', 'email', 'school', 'avatar'];

        for (const [key, value] of Object.entries(userData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            return false;
        }

        fields.push('updated_at = NOW()');
        values.push(id);

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

        try {
            const result = await db.query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新密码
     * @param {number} id 用户ID
     * @param {string} newPassword 新密码（加密后）
     * @returns {Promise<boolean>} 是否更新成功
     */
    static async updatePassword(id, newPassword) {
        const sql = `
            UPDATE users
            SET password = ?, updated_at = NOW()
            WHERE id = ?
        `;

        try {
            const result = await db.query(sql, [newPassword, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 检查账号是否存在
     * @param {string} account 账号
     * @returns {Promise<boolean>} 是否存在
     */
    static async exists(account) {
        const sql = 'SELECT 1 FROM users WHERE username = ? LIMIT 1';

        try {
            const results = await db.query(sql, [account]);
            return results.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 删除用户
     * @param {number} id 用户ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    static async delete(id) {
        const sql = 'DELETE FROM users WHERE id = ?';

        try {
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('User.delete 错误:', error);
            throw error;
        }
    }

    /**
     * 根据手机号查找用户
     * @param {string} phone 手机号
     * @returns {Promise<Object|null>} 用户信息
     */
    static async findByPhone(phone) {
        const sql = `
            SELECT id, username, password, name, phone, email, role, school, avatar, created_at, updated_at
            FROM users
            WHERE phone = ?
        `;

        try {
            const results = await db.query(sql, [phone]);
            return results[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 获取下一个可用的用户名（纯编号）
     * @returns {Promise<string>} 下一个用户名
     */
    static async getNextUsername() {
        const startNumber = 2026001002;

        const sql = `
            SELECT username FROM users
            WHERE username = ?
        `;

        try {
            let nextNumber = startNumber;
            let username = String(nextNumber);
            let exists = true;
            let attempts = 0;
            const maxAttempts = 1000;

            while (exists && attempts < maxAttempts) {
                const results = await db.query(sql, [username]);
                exists = results.length > 0;
                if (exists) {
                    nextNumber++;
                    username = String(nextNumber);
                    attempts++;
                }
            }

            if (exists) {
                throw new Error('无法获取可用的用户名');
            }

            return username;
        } catch (error) {
            console.error('User.getNextUsername 错误:', error);
            throw error;
        }
    }
}

module.exports = User;
