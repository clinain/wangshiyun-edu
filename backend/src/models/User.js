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
            SELECT id, username, password, name, phone, email, role, school, avatar, created_at, updated_at
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

        const allowedFields = ['name', 'phone', 'email', 'school', 'avatar', 'password'];

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
     * 根据邮箱查找用户
     * @param {string} email 邮箱
     * @returns {Promise<Object|null>} 用户信息
     */
    static async findByEmail(email) {
        const sql = `
            SELECT id, username, password, name, phone, email, role, school, avatar, created_at, updated_at
            FROM users
            WHERE email = ?
        `;

        try {
            const results = await db.query(sql, [email]);
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

    /**
     * 安全查询：根据ID查询用户（排除密码字段）
     */
    static async findByIdSafe(id) {
        const sql = `
            SELECT id, username, name, phone, email, role, school, avatar,
                   status, created_at, updated_at
            FROM users WHERE id = ?
        `;
        const results = await db.query(sql, [id]);
        return results[0] || null;
    }

    /**
     * 分页查询用户列表（排除密码）
     */
    static async findAll({ page = 1, pageSize = 20, keyword, role, status } = {}) {
        let whereConditions = [];
        let params = [];
        
        if (keyword) {
            whereConditions.push('(username LIKE ? OR name LIKE ? OR email LIKE ? OR phone LIKE ?)');
            const keywordParam = `%${keyword}%`;
            params.push(keywordParam, keywordParam, keywordParam, keywordParam);
        }
        
        if (role) {
            whereConditions.push('role = ?');
            params.push(role);
        }
        
        if (status !== undefined && status !== null) {
            whereConditions.push('status = ?');
            params.push(status);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        const countResult = await db.query(countSql, params);
        const total = countResult[0].total;
        
        const offset = (page - 1) * pageSize;
        const sql = `
            SELECT id, username, name, phone, email, role, school, avatar,
                   status, created_at, updated_at
            FROM users ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        const users = await db.query(sql, [...params, pageSize, offset]);
        
        return {
            users,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }

    /**
     * 统计各角色用户数量
     */
    static async countByRole() {
        const sql = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as studentCount,
                SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teacherCount,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminCount,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as activeCount
            FROM users
        `;
        const results = await db.query(sql);
        return results[0];
    }

    /**
     * 更新用户状态
     */
    static async updateStatus(id, status) {
        const sql = 'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        await db.query(sql, [status, id]);
        return true;
    }

    /**
     * 更新用户角色
     */
    static async updateRole(id, role) {
        const sql = 'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        await db.query(sql, [role, id]);
        return true;
    }

    /**
     * 删除用户（根据ID）
     */
    static async deleteById(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        await db.query(sql, [id]);
        return true;
    }
}

module.exports = User;
