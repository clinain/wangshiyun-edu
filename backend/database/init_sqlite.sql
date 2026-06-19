-- ============================================
-- 网师云-师范生备课辅助系统
-- SQLite 数据库初始化脚本
-- ============================================

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    avatar TEXT,
    school TEXT,
    role TEXT DEFAULT 'student',
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. 教案表 (lessons)
-- ============================================
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    subject TEXT,
    grade TEXT,
    teaching_goals TEXT,
    key_points TEXT,
    teaching_process TEXT,
    homework TEXT,
    summary TEXT,
    status TEXT DEFAULT 'draft',
    is_public INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject);
CREATE INDEX IF NOT EXISTS idx_lessons_grade ON lessons(grade);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);

-- ============================================
-- 3. PPT记录表 (user_ppt_records)
-- ============================================
CREATE TABLE IF NOT EXISTS user_ppt_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_id INTEGER,
    template_id INTEGER,
    title TEXT NOT NULL,
    content_json TEXT,
    page_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ppt_user_id ON user_ppt_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ppt_lesson_id ON user_ppt_records(lesson_id);
CREATE INDEX IF NOT EXISTS idx_ppt_status ON user_ppt_records(status);

-- ============================================
-- 4. 作品集表 (portfolios)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    stage TEXT,
    grade TEXT,
    category TEXT,
    cover_url TEXT,
    lesson_ids TEXT,
    ppt_ids TEXT,
    is_public INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_public ON portfolios(is_public);
CREATE INDEX IF NOT EXISTS idx_portfolios_subject ON portfolios(subject);
CREATE INDEX IF NOT EXISTS idx_portfolios_stage ON portfolios(stage);
CREATE INDEX IF NOT EXISTS idx_portfolios_grade ON portfolios(grade);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios(category);

-- ============================================
-- 5. 资源表 (resources)
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uploader_id INTEGER NOT NULL,
    source_uploader_id INTEGER DEFAULT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    file_url TEXT NOT NULL,
    cover_url TEXT,
    description TEXT,
    file_size INTEGER,
    file_format TEXT,
    subject TEXT,
    grade TEXT,
    tags TEXT,
    download_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 1,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resources_uploader_id ON resources(uploader_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_grade ON resources(grade);
CREATE INDEX IF NOT EXISTS idx_resources_is_public ON resources(is_public);
CREATE INDEX IF NOT EXISTS idx_resources_source_uploader_id ON resources(source_uploader_id);

-- ============================================
-- 6. 收藏表 (user_favorites)
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resource_id INTEGER,
    portfolio_id INTEGER,
    favorite_type TEXT NOT NULL DEFAULT 'resource',
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    UNIQUE(user_id, favorite_type, resource_id, portfolio_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_resource_id ON user_favorites(resource_id);
CREATE INDEX IF NOT EXISTS idx_favorites_portfolio_id ON user_favorites(portfolio_id);

-- ============================================
-- 7. PPT模板表 (ppt_templates)
-- ============================================
CREATE TABLE IF NOT EXISTS ppt_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    config_json TEXT,
    thumbnail_url TEXT,
    category TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON ppt_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_status ON ppt_templates(status);

-- ============================================
-- 8. 作品集访问日志表 (portfolio_access_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER NOT NULL,
    visitor_id INTEGER,
    access_type TEXT DEFAULT 'view',
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_access_logs_portfolio_id ON portfolio_access_logs(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_visitor_id ON portfolio_access_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON portfolio_access_logs(created_at);

-- ============================================
-- 9. 评论表 (resource_comments)
-- ============================================
CREATE TABLE IF NOT EXISTS resource_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER,
    user_id INTEGER NOT NULL,
    parent_id INTEGER,
    portfolio_id INTEGER,
    content TEXT NOT NULL,
    comment_type TEXT DEFAULT 'comment',
    like_count INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES resource_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_resource_id ON resource_comments(resource_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON resource_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON resource_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_comment_type ON resource_comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON resource_comments(created_at);

-- ============================================
-- 10. 通知表 (notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sender_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    resource_id INTEGER,
    portfolio_id INTEGER,
    comment_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES resource_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);