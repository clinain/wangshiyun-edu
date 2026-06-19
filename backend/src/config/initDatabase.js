'use strict';

const fs = require('fs');
const path = require('path');
const { getPool } = require('./database');

/**
 * 数据库初始化模块
 * 负责在服务器启动时初始化 SQLite 数据库表结构
 * 复用 database.js 的连接，避免双重连接问题
 */

const initDatabase = async () => {
    try {
        console.log('📦 开始初始化数据库...');

        // 复用 database.js 的连接
        const dbPool = getPool();
        const db = dbPool.raw;

        // 读取 SQLite 初始化脚本
        const initScriptPath = path.join(__dirname, '../../database/init_sqlite.sql');
        
        if (!fs.existsSync(initScriptPath)) {
            console.error('❌ 数据库初始化脚本不存在:', initScriptPath);
            return false;
        }

        const initSQL = fs.readFileSync(initScriptPath, 'utf-8');

        // 执行初始化脚本 - 直接执行整个文件
        let successCount = 0;
        let errorCount = 0;

        console.log('📝 开始执行SQL脚本...');

        try {
            db.exec(initSQL);
            successCount = 1; // 整个脚本算作一个成功
            console.log('✅ SQL脚本执行成功');
        } catch (error) {
            console.error('❌ SQL脚本执行失败:', error.message);
            errorCount = 1;
        }

        // 数据修复：将所有有 source_uploader_id 的副本记录设为私有
        // 这些是通过"下载资源"功能创建的副本，不应出现在"全部资源"的公开列表中
        try {
            db.exec(`UPDATE resources SET is_public = 0 WHERE source_uploader_id IS NOT NULL`);
            console.log('✅ 已将下载副本记录的 is_public 修正为 0');
        } catch (e) {
            // 如果 source_uploader_id 列不存在，忽略错误
            console.log('ℹ️ 跳过副本数据修复（source_uploader_id 列可能不存在）');
        }

        // 迁移：为已有数据库添加新字段（忽略已存在的列错误）
        const migrations = [
            "ALTER TABLE portfolios ADD COLUMN subject TEXT",
            "ALTER TABLE portfolios ADD COLUMN stage TEXT",
            "ALTER TABLE portfolios ADD COLUMN grade TEXT",
            "ALTER TABLE portfolios ADD COLUMN category TEXT",
            "ALTER TABLE resources ADD COLUMN source_uploader_id INTEGER DEFAULT NULL",
            // 统一资源中心统计字段
            "ALTER TABLE lessons ADD COLUMN download_count INTEGER DEFAULT 0",
            "ALTER TABLE lessons ADD COLUMN favorite_count INTEGER DEFAULT 0",
            "ALTER TABLE user_ppt_records ADD COLUMN view_count INTEGER DEFAULT 0",
            "ALTER TABLE user_ppt_records ADD COLUMN download_count INTEGER DEFAULT 0",
            "ALTER TABLE user_ppt_records ADD COLUMN favorite_count INTEGER DEFAULT 0",
            "ALTER TABLE portfolios ADD COLUMN download_count INTEGER DEFAULT 0",
            "ALTER TABLE portfolios ADD COLUMN favorite_count INTEGER DEFAULT 0",
        ];
        for (const sql of migrations) {
            try {
                db.exec(sql);
            } catch (e) {
                // 列已存在时忽略错误
            }
        }

        // 迁移：创建 admin_operation_logs 表（如果不存在）
        // 该表用于记录管理员操作日志，支持用户管理等功能
        const adminOperationLogsMigration = `
            CREATE TABLE IF NOT EXISTS admin_operation_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER NOT NULL,
                target_user_id INTEGER,
                action TEXT NOT NULL,
                detail TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_operation_logs(admin_id);
            CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user_id ON admin_operation_logs(target_user_id);
            CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_operation_logs(action);
            CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_operation_logs(created_at);
        `;
        try {
            db.exec(adminOperationLogsMigration);
            console.log('✅ admin_operation_logs 表迁移完成');
        } catch (e) {
            // 表已存在时忽略错误
            console.log('ℹ️ admin_operation_logs 表已存在，跳过迁移');
        }

        // 注意：不再关闭连接，因为复用了 database.js 的连接

        console.log('========================================');
        console.log(`✅ 数据库初始化完成`);
        console.log(`   成功: ${successCount} 条语句`);
        if (errorCount > 0) {
            console.log(`   失败: ${errorCount} 条语句`);
        }
        console.log('========================================');

        return true;

    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        console.error(error.stack);
        return false;
    }
};

module.exports = { initDatabase };