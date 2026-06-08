-- ============================================
-- 评论表 (resource_comments)
-- 支持用户对资源进行提问、点评、交流
-- ============================================

CREATE TABLE IF NOT EXISTS resource_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_id INT NOT NULL COMMENT '资源ID',
    user_id INT NOT NULL COMMENT '评论用户ID',
    parent_id INT DEFAULT NULL COMMENT '父评论ID（用于回复）',
    content TEXT NOT NULL COMMENT '评论内容',
    comment_type ENUM('comment', 'question', 'review') DEFAULT 'comment' COMMENT '评论类型：comment-普通评论，question-提问，review-点评',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    status TINYINT DEFAULT 1 COMMENT '状态：0-隐藏，1-正常',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_resource_id (resource_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_comment_type (comment_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES resource_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源评论表';
