const db = require('../config/database');

class AdminOperationLog {
    /**
     * 记录管理员操作
     */
    static async create({ adminId, targetUserId, action, detail, ipAddress }) {
        const sql = `
            INSERT INTO admin_operation_logs (admin_id, target_user_id, action, detail, ip_address)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await db.query(sql, [adminId, targetUserId, action, detail, ipAddress]);
        return result.insertId;
    }

    /**
     * 分页查询操作日志
     */
    static async findAll({ page = 1, pageSize = 20, adminId, action } = {}) {
        let whereConditions = [];
        let params = [];
        
        if (adminId) {
            whereConditions.push('l.admin_id = ?');
            params.push(adminId);
        }
        
        if (action) {
            whereConditions.push('l.action = ?');
            params.push(action);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const countSql = `SELECT COUNT(*) as total FROM admin_operation_logs l ${whereClause}`;
        const countResult = await db.query(countSql, params);
        const total = countResult[0].total;
        
        const offset = (page - 1) * pageSize;
        const sql = `
            SELECT l.*, 
                   a.name as admin_name, 
                   t.name as target_user_name
            FROM admin_operation_logs l
            LEFT JOIN users a ON l.admin_id = a.id
            LEFT JOIN users t ON l.target_user_id = t.id
            ${whereClause}
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const logs = await db.query(sql, [...params, pageSize, offset]);
        
        return {
            logs,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }
}

module.exports = AdminOperationLog;
