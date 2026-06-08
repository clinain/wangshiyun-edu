-- 为lessons表添加缺失的字段
-- 修复错误: Unknown column 'views' in 'field list'

USE wangshiyun;

-- 添加 assignments 字段（课后作业）
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS assignments TEXT COMMENT '课后作业' AFTER teaching_process;

-- 添加 summary 字段（教学反思）
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS summary TEXT COMMENT '教学反思' AFTER assignments;

-- 添加 view_count 字段（浏览次数）
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0 COMMENT '浏览次数' AFTER summary;

-- 查看表结构确认
DESCRIBE lessons;
