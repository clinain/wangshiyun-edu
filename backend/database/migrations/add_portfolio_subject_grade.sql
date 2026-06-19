-- 为 portfolios 表添加 subject、grade、category 字段
-- 使作品集支持与资源中心相同的分类和检索方式

-- MySQL 版本
ALTER TABLE portfolios ADD COLUMN subject VARCHAR(50) COMMENT '学科' AFTER description;
ALTER TABLE portfolios ADD COLUMN grade VARCHAR(50) COMMENT '年级' AFTER subject;
ALTER TABLE portfolios ADD COLUMN category VARCHAR(100) COMMENT '分类' AFTER grade;

-- 添加索引
CREATE INDEX idx_portfolios_subject ON portfolios(subject);
CREATE INDEX idx_portfolios_grade ON portfolios(grade);
CREATE INDEX idx_portfolios_category ON portfolios(category);
