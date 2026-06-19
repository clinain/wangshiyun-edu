-- 为 lessons 和 user_ppt_records 表添加 is_public 字段
-- 支持用户控制教案和PPT是否在资源中心公开显示

-- 1. 给 lessons 表添加 is_public 字段
ALTER TABLE lessons ADD COLUMN is_public INTEGER DEFAULT 0 COMMENT '是否公开（1=公开，0=私有）';

-- 2. 给 user_ppt_records 表添加 is_public 字段
ALTER TABLE user_ppt_records ADD COLUMN is_public INTEGER DEFAULT 0 COMMENT '是否公开（1=公开，0=私有）';

-- 3. 添加索引
CREATE INDEX IF NOT EXISTS idx_lessons_is_public ON lessons(is_public);
CREATE INDEX IF NOT EXISTS idx_ppt_is_public ON user_ppt_records(is_public);
