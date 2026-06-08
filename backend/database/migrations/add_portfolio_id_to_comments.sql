-- 为评论表添加 portfolio_id 字段，支持作品集评论
ALTER TABLE resource_comments 
ADD COLUMN portfolio_id INT DEFAULT NULL COMMENT '作品集ID（可空）' 
AFTER resource_id;

ALTER TABLE resource_comments 
ADD INDEX idx_portfolio_id (portfolio_id);

ALTER TABLE resource_comments 
ADD FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE;
