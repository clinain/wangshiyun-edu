-- ============================================
-- 网师云-师范生备课辅助系统
-- 数据库初始化脚本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS wangshiyun DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE wangshiyun;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    name VARCHAR(100) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    role ENUM('student', 'teacher', 'admin') DEFAULT 'teacher' COMMENT '角色',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 2. 教案表 (lessons)
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '所属用户ID',
    title VARCHAR(200) NOT NULL COMMENT '教案标题',
    subject VARCHAR(50) COMMENT '学科',
    grade VARCHAR(20) COMMENT '年级',
    teaching_goals TEXT COMMENT '教学目标',
    key_points TEXT COMMENT '教学重点',
    teaching_process TEXT COMMENT '教学过程',
    homework TEXT COMMENT '课后作业',
    status ENUM('draft', 'completed', 'published') DEFAULT 'draft' COMMENT '状态',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_subject (subject),
    INDEX idx_grade (grade),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教案表';

-- ============================================
-- 3. PPT记录表 (user_ppt_records)
-- ============================================
CREATE TABLE IF NOT EXISTS user_ppt_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '所属用户ID',
    lesson_id INT COMMENT '关联教案ID',
    template_id INT COMMENT '使用的模板ID',
    title VARCHAR(200) NOT NULL COMMENT 'PPT标题',
    content_json LONGTEXT COMMENT 'PPT内容JSON结构',
    page_count INT DEFAULT 0 COMMENT '页数',
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending' COMMENT '生成状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_template_id (template_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PPT记录表';

-- ============================================
-- 4. 作品集表 (portfolios)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '所属用户ID',
    name VARCHAR(200) NOT NULL COMMENT '作品集名称',
    description TEXT COMMENT '作品集描述',
    cover_url VARCHAR(255) COMMENT '封面图片URL',
    lesson_ids JSON COMMENT '包含的教案ID列表',
    ppt_ids JSON COMMENT '包含的PPT ID列表',
    is_public TINYINT DEFAULT 0 COMMENT '是否公开：0-私有，1-公开',
    share_count INT DEFAULT 0 COMMENT '分享次数',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_public (is_public),
    INDEX idx_share_count (share_count),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作品集表';

-- ============================================
-- 5. 资源表 (resources)
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uploader_id INT NOT NULL COMMENT '上传用户ID',
    title VARCHAR(200) NOT NULL COMMENT '资源标题',
    type ENUM('document', 'video', 'audio', 'image', 'other') NOT NULL COMMENT '资源类型',
    category VARCHAR(50) COMMENT '资源分类',
    file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
    cover_url VARCHAR(255) COMMENT '封面URL',
    description TEXT COMMENT '资源描述',
    file_size BIGINT COMMENT '文件大小（字节）',
    file_format VARCHAR(20) COMMENT '文件格式',
    subject VARCHAR(50) COMMENT '所属学科',
    grade VARCHAR(20) COMMENT '适用年级',
    tags JSON COMMENT '标签列表',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    favorite_count INT DEFAULT 0 COMMENT '收藏次数',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    is_public TINYINT DEFAULT 1 COMMENT '是否公开：0-私有，1-公开',
    status TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-上架',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_subject (subject),
    INDEX idx_grade (grade),
    INDEX idx_is_public (is_public),
    INDEX idx_status (status),
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源表';

-- ============================================
-- 6. 收藏表 (user_favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    resource_id INT COMMENT '资源ID（可空）',
    portfolio_id INT COMMENT '作品集ID（可空）',
    favorite_type VARCHAR(20) NOT NULL COMMENT '收藏类型：resource-资源，portfolio-作品集',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_favorite (user_id, favorite_type, resource_id, portfolio_id),
    INDEX idx_user_id (user_id),
    INDEX idx_resource_id (resource_id),
    INDEX idx_portfolio_id (portfolio_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表（支持资源和作品集）';

-- ============================================
-- 7. PPT模板表 (ppt_templates)
-- ============================================
CREATE TABLE IF NOT EXISTS ppt_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    description TEXT COMMENT '模板描述',
    config_json LONGTEXT COMMENT '模板配置JSON',
    thumbnail_url VARCHAR(255) COMMENT '缩略图URL',
    category VARCHAR(50) COMMENT '模板分类',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PPT模板表';

-- ============================================
-- 8. 作品集访问日志表 (portfolio_access_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL COMMENT '作品集ID',
    visitor_id INT COMMENT '访问者ID（可为空表示游客）',
    access_type ENUM('view', 'share', 'download') DEFAULT 'view' COMMENT '访问类型',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作品集访问日志表';

-- ============================================
-- 测试数据（可选）
-- ============================================

-- 插入测试用户（密码都是123456的MD5值）
INSERT INTO users (username, password, name, email, role) VALUES
('teacher1', 'e10adc3949ba59abbe56e057f20f883e', '张老师', 'teacher1@example.com', 'teacher'),
('teacher2', 'e10adc3949ba59abbe56e057f20f883e', '李老师', 'teacher2@example.com', 'teacher'),
('admin', 'e10adc3949ba59abbe56e057f20f883e', '管理员', 'admin@example.com', 'admin');

-- 插入测试教案
INSERT INTO lessons (user_id, title, subject, grade, teaching_goals, status) VALUES
(1, '《荷塘月色》教案', '语文', '高一', '理解散文意境，品味语言之美', 'completed'),
(1, '《春》教案', '语文', '初一', '感受春天生机勃勃的景象', 'completed'),
(2, '《背影》教案', '语文', '初二', '体会父子深情', 'draft');

-- 插入测试PPT
INSERT INTO user_ppt_records (user_id, lesson_id, title, content_json, page_count, status) VALUES
(1, 1, '荷塘月色PPT', '{"pages":[]}', 10, 'completed'),
(1, 2, '春PPT', '{"pages":[]}', 8, 'completed'),
(2, 3, '背影PPT', '{"pages":[]}', 12, 'pending');

-- 插入测试作品集
INSERT INTO portfolios (user_id, name, description, lesson_ids, ppt_ids, is_public) VALUES
(1, '高一语文公开课集', '包含荷塘月色等经典课文教案和PPT', '[1]', '[1]', 1),
(1, '个人教案集', '私有教案集合', '[2]', '[2]', 0),
(2, '初二语文教案集', '适合初二语文教学', '[3]', '[3]', 1);

-- 插入测试资源
INSERT INTO resources (uploader_id, title, type, category, file_url, subject, grade, is_public) VALUES
(1, '高中语文知识点汇总', 'document', '课件', '/uploads/doc1.pdf', '语文', '高一', 1),
(2, '初中语文教学视频', 'video', '视频', '/uploads/video1.mp4', '语文', '初一', 1),
(1, '教学素材包', 'other', '素材', '/uploads/material.zip', '通用', '通用', 0);

-- 插入测试模板
INSERT INTO ppt_templates (name, description, category) VALUES
('简约风格模板', '适合正式场合的简洁设计', '简约'),
('活泼风格模板', '色彩鲜艳，适合学生课堂', '活泼'),
('古典风格模板', '适合语文古文教学', '古典');

COMMIT;
