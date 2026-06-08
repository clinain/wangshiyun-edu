const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wangshiyun'
};

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar VARCHAR(255),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    school VARCHAR(255),
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_phone (phone),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'`;

const createLessonsTable = `
CREATE TABLE IF NOT EXISTS lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(50),
    grade VARCHAR(20),
    teaching_goals TEXT,
    key_points TEXT,
    teaching_process TEXT,
    homework TEXT,
    summary TEXT,
    status ENUM('draft', 'completed', 'published') DEFAULT 'draft',
    view_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_subject (subject),
    INDEX idx_grade (grade),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教案表'`;

const createPPTRecordsTable = `
CREATE TABLE IF NOT EXISTS user_ppt_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lesson_id INT,
    title VARCHAR(200) NOT NULL,
    content_json LONGTEXT,
    page_count INT DEFAULT 0,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    ppt_path VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PPT记录表'`;

const createPortfoliosTable = `
CREATE TABLE IF NOT EXISTS portfolios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    cover_url VARCHAR(255),
    lesson_ids JSON,
    ppt_ids JSON,
    is_public TINYINT DEFAULT 0,
    share_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_public (is_public),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作品集表'`;

const createResourcesTable = `
CREATE TABLE IF NOT EXISTS resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uploader_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    type ENUM('document', 'video', 'audio', 'image', 'other') NOT NULL,
    category VARCHAR(50),
    file_url VARCHAR(500) NOT NULL,
    cover_url VARCHAR(255),
    description TEXT,
    file_size BIGINT,
    file_format VARCHAR(20),
    subject VARCHAR(50),
    grade VARCHAR(20),
    tags JSON,
    download_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    is_public TINYINT DEFAULT 1,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_type (type),
    INDEX idx_subject (subject),
    INDEX idx_is_public (is_public),
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源表'`;

const createFavoritesTable = `
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    resource_id INT,
    portfolio_id INT,
    favorite_type VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_favorite (user_id, favorite_type, resource_id, portfolio_id),
    INDEX idx_user_id (user_id),
    INDEX idx_resource_id (resource_id),
    INDEX idx_portfolio_id (portfolio_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表'`;

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

async function initDatabase() {
    let connection;
    try {
        console.log('正在连接数据库...');
        
        connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        console.log(`✓ 数据库 ${dbConfig.database} 创建/确认成功`);

        await connection.query(`USE ${dbConfig.database}`);
        console.log(`✓ 切换到数据库 ${dbConfig.database}`);

        const tables = [
            { name: 'users', sql: createUsersTable },
            { name: 'lessons', sql: createLessonsTable },
            { name: 'user_ppt_records', sql: createPPTRecordsTable },
            { name: 'portfolios', sql: createPortfoliosTable },
            { name: 'resources', sql: createResourcesTable },
            { name: 'user_favorites', sql: createFavoritesTable },
            { name: 'resource_comments', sql: createCommentsTable }
        ];

        for (const table of tables) {
            try {
                await connection.query(table.sql);
                console.log(`✓ 创建表 ${table.name} 成功`);
            } catch (err) {
                if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`- 表 ${table.name} 已存在，跳过`);
                } else {
                    throw err;
                }
            }
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        const checkUser = await connection.query('SELECT COUNT(*) as count FROM users WHERE username = ?', ['teacher1']);
        if (checkUser[0][0].count === 0) {
            await connection.query(
                'INSERT INTO users (username, password, name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)',
                ['teacher1', hashedPassword, '张老师', '13800138000', 'teacher1@example.com', 'teacher']
            );
            console.log('✓ 插入测试用户成功');
        } else {
            console.log('- 测试用户已存在，跳过');
        }

        console.log('\n========================================');
        console.log('数据库初始化完成！');
        console.log('测试用户: teacher1 / 123456');
        console.log('手机号登录: 13800138000 / 123456');

    } catch (error) {
        console.error('数据库初始化失败:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();