-- ============================================
-- 统一资源中心统计字段迁移
-- 给 lessons 和 user_ppt_records 添加缺失的统计字段
-- 给 portfolios 添加 download_count 和 favorite_count
-- ============================================

-- 1. 给 lessons 表添加 download_count 和 favorite_count
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0 COMMENT '下载次数' AFTER view_count;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS favorite_count INT DEFAULT 0 COMMENT '收藏次数' AFTER download_count;

-- 2. 给 user_ppt_records 表添加统计字段
ALTER TABLE user_ppt_records ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0 COMMENT '浏览次数' AFTER page_count;
ALTER TABLE user_ppt_records ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0 COMMENT '下载次数' AFTER view_count;
ALTER TABLE user_ppt_records ADD COLUMN IF NOT EXISTS favorite_count INT DEFAULT 0 COMMENT '收藏次数' AFTER download_count;

-- 3. 给 portfolios 表添加 download_count 和 favorite_count
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0 COMMENT '下载次数' AFTER view_count;
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS favorite_count INT DEFAULT 0 COMMENT '收藏次数' AFTER download_count;

-- 4. 更新 user_favorites 表支持教案和PPT收藏
ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS lesson_id INT COMMENT '教案ID（可空）' AFTER portfolio_id;
ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS ppt_id INT COMMENT 'PPT ID（可空）' AFTER lesson_id;
ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS lesson_favorite_type VARCHAR(20) DEFAULT NULL COMMENT '教案收藏类型' AFTER ppt_id;

-- 更新 UNIQUE KEY（需要先删除旧的再添加新的）
-- 注意：不同数据库版本处理方式不同，以下为 MySQL 语法
ALTER TABLE user_favorites DROP INDEX IF EXISTS uk_user_favorite;
ALTER TABLE user_favorites ADD UNIQUE KEY uk_user_favorite_v2 (user_id, favorite_type, resource_id, portfolio_id, lesson_id, ppt_id);
