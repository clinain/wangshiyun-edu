-- 迁移收藏表以支持作品集收藏
-- 执行前请备份数据

-- 添加新列
ALTER TABLE user_favorites
ADD COLUMN portfolio_id INT NULL COMMENT '作品集ID（可空）' AFTER resource_id,
ADD COLUMN favorite_type VARCHAR(20) NOT NULL DEFAULT 'resource' COMMENT '收藏类型：resource-资源，portfolio-作品集' AFTER portfolio_id,
ADD INDEX idx_portfolio_id (portfolio_id);

-- 更新现有记录的类型为 resource
UPDATE user_favorites SET favorite_type = 'resource' WHERE favorite_type = '';

-- 删除旧的唯一约束并添加新的组合唯一约束
ALTER TABLE user_favorites
DROP INDEX uk_user_resource,
ADD UNIQUE KEY uk_user_favorite (user_id, favorite_type, resource_id, portfolio_id);

-- 添加外键约束
ALTER TABLE user_favorites
ADD CONSTRAINT fk_favorite_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;
