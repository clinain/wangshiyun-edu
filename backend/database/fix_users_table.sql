-- 为users表添加缺失的字段
-- 修复错误: Unknown column 'school' in 'field list'

USE wangshiyun;

-- 添加 school 字段（学校）
ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(200) COMMENT '学校' AFTER role;

-- 添加 avatar 字段（头像）
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) COMMENT '头像URL' AFTER school;

-- 添加 status 字段（状态）
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常' AFTER avatar;

-- 查看表结构确认
DESCRIBE users;
