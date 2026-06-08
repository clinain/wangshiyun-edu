# 数据库设计文档

## 概述

本系统采用 MySQL 数据库，设计支持多用户场景，每个用户拥有独立的教案、PPT等资源，公开的作品集可在资源中心被所有用户浏览。

## 表结构设计

### 1. 用户表 (users)

存储用户基本信息。

```sql
CREATE TABLE users (
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
```

### 2. 教案表 (lessons)

存储用户的教案内容。

```sql
CREATE TABLE lessons (
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
```

### 3. PPT记录表 (user_ppt_records)

存储用户的PPT内容。

```sql
CREATE TABLE user_ppt_records (
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
```

### 4. 作品集表 (portfolios)

存储用户的作品集，可设置公开或私有。

```sql
CREATE TABLE portfolios (
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
```

### 5. 资源表 (resources)

存储用户上传的教学资源。

```sql
CREATE TABLE resources (
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
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    status TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-上架',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_subject (subject),
    INDEX idx_grade (grade),
    INDEX idx_status (status),
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源表';
```

### 6. 收藏表 (user_favorites)

存储用户的收藏记录。

```sql
CREATE TABLE user_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    resource_id INT NOT NULL COMMENT '资源ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_resource (user_id, resource_id),
    INDEX idx_user_id (user_id),
    INDEX idx_resource_id (resource_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';
```

### 7. PPT模板表 (ppt_templates)

存储PPT模板配置。

```sql
CREATE TABLE ppt_templates (
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
```

### 8. 作品集访问日志表 (portfolio_access_logs)

记录作品集的访问日志，用于统计和分析。

```sql
CREATE TABLE portfolio_access_logs (
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
```

## 索引设计说明

### 为什么需要这些索引？

1. **用户相关索引** (`idx_user_id`)
   - 每个用户的资源查询
   - 用户的作品集列表
   - 用户收藏的资源
   - 数据隔离和关联查询

2. **公开属性索引** (`idx_is_public`)
   - 资源中心的公开资源筛选
   - 快速定位公开作品集

3. **分类筛选索引** (`idx_subject`, `idx_grade`, `idx_category`)
   - 按学科、年级、分类筛选资源
   - 支持多维度查询

4. **排序索引** (`idx_share_count`, `idx_created_at`)
   - 按热度排序展示
   - 按时间排序展示

5. **状态索引** (`idx_status`)
   - 快速筛选可用资源
   - 区分草稿、已完成等状态

## 权限设计

### 资源访问权限

1. **私有资源**
   - 仅创建者可见
   - 可随时修改或删除

2. **公开资源**
   - 所有登录用户可见
   - 资源中心统一展示
   - 创建者可编辑和删除

3. **作品集公开机制**
   - 用户可选择将作品集设为公开
   - 公开后出现在资源中心
   - 可随时改回私有

## 数据关联关系

```
users (1) ──────< (N) lessons
   │                   │
   │                   │
   │              (N) ─┘
   │
   ├─────< (N) user_ppt_records
   │                   │
   │              (N) ─┘
   │
   ├─────< (N) portfolios ──────> (N) lessons
   │                   │
   │              (N) ─┘
   │
   ├─────< (N) portfolios ──────> (N) user_ppt_records
   │                   │
   │              (N) ─┘
   │
   ├─────< (N) resources
   │                   │
   │              (N) ─┘
   │
   └─────< (N) user_favorites >───── resources
```

## 性能优化建议

1. **定期清理**：访问日志表定期归档或清理
2. **读写分离**：考虑主从复制分离读写压力
3. **缓存策略**：热门资源使用Redis缓存
4. **分表策略**：资源表数据量大时可按时间分表
5. **连接池**：合理配置数据库连接池参数

## SQL初始化脚本

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS wangshiyun DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE wangshiyun;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar_url VARCHAR(255),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'teacher',
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 教案表
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
    status ENUM('draft', 'completed', 'published') DEFAULT 'draft',
    view_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_subject (subject),
    INDEX idx_grade (grade),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PPT记录表
CREATE TABLE IF NOT EXISTS user_ppt_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lesson_id INT,
    template_id INT,
    title VARCHAR(200) NOT NULL,
    content_json LONGTEXT,
    page_count INT DEFAULT 0,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_template_id (template_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 作品集表
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
    INDEX idx_share_count (share_count),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 资源表
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
    view_count INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_subject (subject),
    INDEX idx_grade (grade),
    INDEX idx_status (status),
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_resource (user_id, resource_id),
    INDEX idx_user_id (user_id),
    INDEX idx_resource_id (resource_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PPT模板表
CREATE TABLE IF NOT EXISTS ppt_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    config_json LONGTEXT,
    thumbnail_url VARCHAR(255),
    category VARCHAR(50),
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 作品集访问日志表
CREATE TABLE IF NOT EXISTS portfolio_access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portfolio_id INT NOT NULL,
    visitor_id INT,
    access_type ENUM('view', 'share', 'download') DEFAULT 'view',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 更新现有表的注意事项

如果已有数据库需要迁移，请注意：

1. **resources表**：需要添加 `uploader_id` 字段关联用户
2. **数据迁移**：将现有资源分配给管理员用户或创建系统用户
3. **索引优化**：根据实际查询需求添加合适的索引
4. **备份数据**：迁移前务必备份现有数据

## 备份与恢复策略

1. **定期备份**：建议每日全量备份
2. **增量备份**：每小时记录binlog
3. **异地备份**：重要数据异地存储
4. **恢复测试**：定期测试恢复流程
