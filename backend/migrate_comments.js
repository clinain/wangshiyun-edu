/**
 * 评论表迁移脚本
 * 运行: node migrate_comments.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wangshiyun'
};

const createCommentsTable = `
CREATE TABLE IF NOT EXISTS resource_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    content TEXT NOT NULL,
    comment_type ENUM('comment', 'question', 'review') DEFAULT 'comment',
    like_count INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_resource_id (resource_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_comment_type (comment_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES resource_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源评论表'`;

async function migrate() {
    let connection;
    try {
        console.log('正在连接数据库...');
        connection = await mysql.createConnection(dbConfig);
        console.log('连接成功');

        await connection.query(createCommentsTable);
        console.log('✓ resource_comments 表创建/确认成功');

        console.log('\n迁移完成！');
    } catch (error) {
        console.error('迁移失败:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrate();
