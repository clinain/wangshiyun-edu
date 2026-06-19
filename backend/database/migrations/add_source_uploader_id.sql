-- 添加 source_uploader_id 字段，用于区分用户上传的资源和从其他用户下载的资源
-- source_uploader_id 为 NULL 表示用户自己上传的资源
-- source_uploader_id 有值表示从其他用户复制/下载的资源，值为原始上传者ID

ALTER TABLE resources ADD COLUMN source_uploader_id INT NULL COMMENT '原始上传者ID（NULL表示自己上传）' AFTER uploader_id;
ALTER TABLE resources ADD INDEX idx_source_uploader_id (source_uploader_id);
