-- 为 portfolios 表添加 stage（学段）字段
-- 支持小学、初中、高中、其他等教育阶段标签

-- MySQL 版本
ALTER TABLE portfolios ADD COLUMN stage VARCHAR(50) COMMENT '学段（教育阶段）' AFTER subject;

-- 添加索引
CREATE INDEX idx_portfolios_stage ON portfolios(stage);
