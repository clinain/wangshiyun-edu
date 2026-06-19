-- 管理员功能数据库迁移脚本

-- 1. 补充 users 表的 school 字段（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(200) COMMENT '学校' AFTER avatar;

-- 2. 创建管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL COMMENT '操作管理员ID',
    target_user_id INT COMMENT '目标用户ID',
    action VARCHAR(50) NOT NULL COMMENT '操作类型：view_list, view_detail, disable_user, enable_user, reset_password, change_role, delete_user',
    detail TEXT COMMENT '操作详情',
    ip_address VARCHAR(50) COMMENT '操作IP',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_target_user_id (target_user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
