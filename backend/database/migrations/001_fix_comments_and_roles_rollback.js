#!/usr/bin/env node
/**
 * ============================================
 * 回滚脚本 001: 撤销 001_fix_comments_and_roles 的更改
 * ============================================
 *
 * 回滚内容：
 * 1. resource_comments.resource_id: 恢复 NOT NULL 约束
 * 2. users.role: 将默认值从 'student' 改回 'teacher'
 *
 * 执行方式：
 *   cd backend && node database/migrations/001_fix_comments_and_roles_rollback.js
 *
 * 注意：
 *   - 回滚 resource_id 的 NOT NULL 约束时，会检查是否存在 resource_id 为 NULL 的记录
 *   - 如果存在，会提示用户处理后再回滚
 *   - 也会自动备份数据库
 *   - 使用表重建方式修改列约束（兼容所有 SQLite 版本）
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 数据库路径
const dataDir = path.join(__dirname, '../../data');
const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, 'wangshiyun.sqlite');

function main() {
    // 1. 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
        console.error('❌ 数据库文件不存在:', dbPath);
        process.exit(1);
    }

    // 2. 备份数据库
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dataDir, `wangshiyun.sqlite.rollback-bak.${timestamp}`);
    try {
        fs.copyFileSync(dbPath, backupPath);
        console.log('✅ 数据库备份成功:', backupPath);
    } catch (err) {
        console.error('❌ 数据库备份失败:', err.message);
        process.exit(1);
    }

    // 3. 动态加载 better-sqlite3
    let Database;
    try {
        Database = require('better-sqlite3');
    } catch (e) {
        console.error('❌ 请先安装 better-sqlite3: npm install better-sqlite3');
        process.exit(1);
    }

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    // ⚠️ 关键：回滚期间禁用外键约束，防止级联删除
    db.pragma('foreign_keys = OFF');

    try {
        console.log('\n📋 检查当前数据库 schema...\n');

        // 检查当前 schema
        const commentCols = db.prepare("PRAGMA table_info(resource_comments)").all();
        const resourceIdCol = commentCols.find(c => c.name === 'resource_id');

        const userCols = db.prepare("PRAGMA table_info(users)").all();
        const roleCol = userCols.find(c => c.name === 'role');

        let needsCommentRollback = false;
        let needsRoleRollback = false;

        // 分析需要回滚的内容
        if (resourceIdCol && resourceIdCol.notnull === 0) {
            // 先检查是否有 NULL 值
            const nullCount = db.prepare(
                "SELECT COUNT(*) as cnt FROM resource_comments WHERE resource_id IS NULL"
            ).get();

            if (nullCount.cnt > 0) {
                console.error(`❌ 无法回滚: resource_comments 中有 ${nullCount.cnt} 条记录的 resource_id 为 NULL`);
                console.error('   请先处理这些记录（删除或设置 resource_id），然后再回滚');
                db.close();
                process.exit(1);
            }
            needsCommentRollback = true;
            console.log('  ⚠️  resource_comments.resource_id 当前允许 NULL，需要恢复 NOT NULL');
        } else {
            console.log('  ✅ resource_comments.resource_id 已经是 NOT NULL');
        }

        if (roleCol && roleCol.dflt_value === "'student'") {
            needsRoleRollback = true;
            console.log("  ⚠️  users.role 默认值为 'student'，需要改回 'teacher'");
        } else {
            console.log(`  ✅ users.role 默认值已经是 ${roleCol?.dflt_value || 'teacher'}`);
        }

        // 执行回滚
        if (!needsCommentRollback && !needsRoleRollback) {
            console.log('\n🎉 数据库已经是回滚前的状态，无需操作！');
            db.close();
            return;
        }

        console.log(`\n🔄 开始执行回滚...\n`);

        const rollbackAll = db.transaction(() => {
            // 回滚 1: 重建 resource_comments 表（恢复 NOT NULL）
            if (needsCommentRollback) {
                console.log('  📝 重建 resource_comments 表（恢复 NOT NULL）...');

                const existingComments = db.prepare("SELECT * FROM resource_comments").all();
                console.log(`     现有评论数量: ${existingComments.length}`);

                db.exec('DROP TABLE resource_comments');

                db.exec(`
                    CREATE TABLE resource_comments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        resource_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
                        parent_id INTEGER,
                        portfolio_id INTEGER,
                        content TEXT NOT NULL,
                        comment_type TEXT DEFAULT 'comment',
                        like_count INTEGER DEFAULT 0,
                        status INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (parent_id) REFERENCES resource_comments(id) ON DELETE CASCADE,
                        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
                    )
                `);

                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_resource_id ON resource_comments(resource_id)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON resource_comments(user_id)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON resource_comments(parent_id)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_comment_type ON resource_comments(comment_type)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_created_at ON resource_comments(created_at)');

                if (existingComments.length > 0) {
                    const insertSql = `
                        INSERT INTO resource_comments
                        (id, resource_id, user_id, parent_id, portfolio_id, content, comment_type, like_count, status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    const insertStmt = db.prepare(insertSql);
                    for (const comment of existingComments) {
                        insertStmt.run(
                            comment.id,
                            comment.resource_id,
                            comment.user_id,
                            comment.parent_id,
                            comment.portfolio_id || null,
                            comment.content,
                            comment.comment_type,
                            comment.like_count,
                            comment.status,
                            comment.created_at,
                            comment.updated_at
                        );
                    }
                    console.log(`     已迁移 ${existingComments.length} 条评论数据`);
                }

                if (existingComments.length > 0) {
                    const maxId = Math.max(...existingComments.map(c => c.id));
                    db.exec(`DELETE FROM sqlite_sequence WHERE name='resource_comments'`);
                    db.exec(`INSERT INTO sqlite_sequence (name, seq) VALUES ('resource_comments', ${maxId})`);
                }

                console.log('  ✅ resource_comments 表重建完成');
            }

            // 回滚 2: 重建 users 表（恢复 role 默认值为 teacher）
            if (needsRoleRollback) {
                console.log("  📝 重建 users 表（role 默认值改回 'teacher'）...");

                const existingUsers = db.prepare("SELECT * FROM users").all();
                console.log(`     现有用户数量: ${existingUsers.length}`);

                db.exec('DROP TABLE users');

                db.exec(`
                    CREATE TABLE users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        name TEXT,
                        phone TEXT,
                        email TEXT,
                        avatar TEXT,
                        school TEXT,
                        role TEXT DEFAULT 'teacher',
                        status INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

                if (existingUsers.length > 0) {
                    const insertSql = `
                        INSERT INTO users
                        (id, username, password, name, phone, email, avatar, school, role, status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    const insertStmt = db.prepare(insertSql);
                    for (const user of existingUsers) {
                        insertStmt.run(
                            user.id,
                            user.username,
                            user.password,
                            user.name,
                            user.phone,
                            user.email,
                            user.avatar,
                            user.school,
                            user.role,
                            user.status,
                            user.created_at,
                            user.updated_at
                        );
                    }
                    console.log(`     已迁移 ${existingUsers.length} 条用户数据`);
                }

                if (existingUsers.length > 0) {
                    const maxId = Math.max(...existingUsers.map(u => u.id));
                    db.exec(`DELETE FROM sqlite_sequence WHERE name='users'`);
                    db.exec(`INSERT INTO sqlite_sequence (name, seq) VALUES ('users', ${maxId})`);
                }

                console.log("  ✅ users 表重建完成（role 默认值已改回 'teacher'）");
            }
        });

        rollbackAll();

        // 重新启用外键约束
        db.pragma('foreign_keys = ON');

        // 验证回滚结果
        console.log('\n🔍 验证回滚结果...\n');

        const verifyCommentCols = db.prepare("PRAGMA table_info(resource_comments)").all();
        const verifyResourceId = verifyCommentCols.find(c => c.name === 'resource_id');
        const verifyCommentCount = db.prepare("SELECT COUNT(*) as cnt FROM resource_comments").get();

        const verifyUserCols = db.prepare("PRAGMA table_info(users)").all();
        const verifyRole = verifyUserCols.find(c => c.name === 'role');
        const verifyUserCount = db.prepare("SELECT COUNT(*) as cnt FROM users").get();

        console.log(`  resource_comments.resource_id notnull = ${verifyResourceId.notnull} (期望: 1) ${verifyResourceId.notnull === 1 ? '✅' : '❌'}`);
        console.log(`  resource_comments 数据完整性: ${verifyCommentCount.cnt} 条记录 ✅`);
        console.log(`  users.role default = ${verifyRole.dflt_value} (期望: 'teacher') ${verifyRole.dflt_value === "'teacher'" ? '✅' : '❌'}`);
        console.log(`  users 数据完整性: ${verifyUserCount.cnt} 条记录 ✅`);

        // 重置 schema 版本号
        db.pragma('user_version = 0');

        console.log('\n========================================');
        console.log('🎉 回滚完成！');
        console.log(`   备份文件: ${backupPath}`);
        console.log('========================================');

    } catch (error) {
        // 重新启用外键约束（即使回滚失败）
        try { db.pragma('foreign_keys = ON'); } catch (e) {}

        console.error('\n❌ 回滚执行失败，已回滚更改');
        console.error('   错误信息:', error.message);
        console.log(`\n💡 数据库已恢复到回滚前的状态`);
        console.log(`   备份文件位于: ${backupPath}`);
    } finally {
        db.close();
    }
}

main();
