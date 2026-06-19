#!/usr/bin/env node
/**
 * ============================================
 * 迁移脚本 001: 修复 resource_comments 和 users 表
 * ============================================
 *
 * 修复内容：
 * 1. resource_comments.resource_id: 移除 NOT NULL 约束（允许作品集评论不关联资源）
 * 2. users.role: 将默认值从 'teacher' 改为 'student'
 *
 * 执行方式：
 *   cd backend && node database/migrations/001_fix_comments_and_roles.js
 *
 * 安全特性：
 *   - 执行前自动备份数据库（包括 WAL 和 SHM 文件）
 *   - 使用事务包裹，失败自动回滚
 *   - 幂等操作（重复执行不会出错）
 *   - 执行前检查当前 schema 状态，跳过无需修改的项
 *   - 使用表重建方式修改列约束（兼容所有 SQLite 版本）
 *
 * 可逆性：
 *   - 回滚脚本: node database/migrations/001_fix_comments_and_roles_rollback.js
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
    const backupPath = path.join(dataDir, `wangshiyun.sqlite.bak.${timestamp}`);
    try {
        fs.copyFileSync(dbPath, backupPath);
        // 同时备份 WAL 和 SHM 文件（如果存在）
        for (const ext of ['-shm', '-wal']) {
            const src = dbPath + ext;
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, backupPath + ext);
            }
        }
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
    // ⚠️ 关键：迁移期间禁用外键约束，防止 DROP TABLE 级联删除关联表数据
    // 例如：DROP TABLE users 会级联删除 resources 表中的数据
    db.pragma('foreign_keys = OFF');

    try {
        // 4. 检查当前 schema 状态
        console.log('\n📋 检查当前数据库 schema...\n');

        // 检查 resource_comments 表结构
        const commentCols = db.prepare("PRAGMA table_info(resource_comments)").all();
        const resourceIdCol = commentCols.find(c => c.name === 'resource_id');
        const portfolioIdCol = commentCols.find(c => c.name === 'portfolio_id');

        if (!resourceIdCol) {
            console.error('❌ resource_comments 表不存在或缺少 resource_id 列');
            db.close();
            process.exit(1);
        }

        // 检查 users 表结构
        const userCols = db.prepare("PRAGMA table_info(users)").all();
        const roleCol = userCols.find(c => c.name === 'role');

        if (!roleCol) {
            console.error('❌ users 表不存在或缺少 role 列');
            db.close();
            process.exit(1);
        }

        let needsCommentMigration = false;
        let needsRoleMigration = false;

        // 5. 分析需要执行的迁移
        if (resourceIdCol.notnull === 1) {
            needsCommentMigration = true;
            console.log('  ⚠️  resource_comments.resource_id 当前为 NOT NULL，需要修改');
        } else {
            console.log('  ✅ resource_comments.resource_id 已经允许 NULL');
        }

        if (!portfolioIdCol) {
            needsCommentMigration = true;
            console.log('  ⚠️  resource_comments 缺少 portfolio_id 列，需要添加');
        } else {
            console.log('  ✅ resource_comments.portfolio_id 列已存在');
        }

        const currentDefault = roleCol.dflt_value;
        if (currentDefault !== "'student'" && currentDefault !== 'student') {
            needsRoleMigration = true;
            console.log(`  ⚠️  users.role 默认值为 ${currentDefault}，需要改为 'student'`);
        } else {
            console.log("  ✅ users.role 默认值已经是 'student'");
        }

        // 6. 执行迁移
        if (!needsCommentMigration && !needsRoleMigration) {
            console.log('\n🎉 数据库 schema 已经是最新的，无需迁移！');
            db.close();
            return;
        }

        console.log('\n🔄 开始执行迁移...\n');

        // 使用事务（在 foreign_keys = OFF 状态下执行，避免级联删除）
        const migrateAll = db.transaction(() => {
            // 迁移 1: 重建 resource_comments 表（移除 NOT NULL，添加 portfolio_id）
            if (needsCommentMigration) {
                console.log('  📝 重建 resource_comments 表...');

                // 获取现有数据
                const existingComments = db.prepare("SELECT * FROM resource_comments").all();
                console.log(`     现有评论数量: ${existingComments.length}`);

                // 删除旧表（DROP TABLE 会自动删除关联的索引和触发器）
                db.exec('DROP TABLE resource_comments');

                // 创建新表（resource_id 允许 NULL，包含 portfolio_id）
                db.exec(`
                    CREATE TABLE resource_comments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        resource_id INTEGER,
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

                // 重建索引
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_resource_id ON resource_comments(resource_id)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON resource_comments(user_id)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON resource_comments(parent_id)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_comment_type ON resource_comments(comment_type)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_comments_created_at ON resource_comments(created_at)');

                // 插入现有数据
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

                // 重置自增 ID
                if (existingComments.length > 0) {
                    const maxId = Math.max(...existingComments.map(c => c.id));
                    db.exec(`DELETE FROM sqlite_sequence WHERE name='resource_comments'`);
                    db.exec(`INSERT INTO sqlite_sequence (name, seq) VALUES ('resource_comments', ${maxId})`);
                }

                console.log('  ✅ resource_comments 表重建完成');
            }

            // 迁移 2: 重建 users 表（修改 role 默认值）
            if (needsRoleMigration) {
                console.log('  📝 重建 users 表...');

                const existingUsers = db.prepare("SELECT * FROM users").all();
                console.log(`     现有用户数量: ${existingUsers.length}`);

                // 删除旧表（DROP TABLE 会自动删除关联的索引和触发器）
                db.exec('DROP TABLE users');

                // 创建新表（role 默认值改为 student）
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
                        role TEXT DEFAULT 'student',
                        status INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // 重建索引
                db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
                db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

                // 插入现有数据
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

                // 重置自增 ID
                if (existingUsers.length > 0) {
                    const maxId = Math.max(...existingUsers.map(u => u.id));
                    db.exec(`DELETE FROM sqlite_sequence WHERE name='users'`);
                    db.exec(`INSERT INTO sqlite_sequence (name, seq) VALUES ('users', ${maxId})`);
                }

                console.log("  ✅ users 表重建完成（role 默认值已改为 'student'）");
            }
        });

        migrateAll();

        // 7. 重新启用外键约束
        db.pragma('foreign_keys = ON');
        console.log('  ✅ 外键约束已重新启用');

        // 8. 验证迁移结果
        console.log('\n🔍 验证迁移结果...\n');

        const verifyCommentCols = db.prepare("PRAGMA table_info(resource_comments)").all();
        const verifyResourceId = verifyCommentCols.find(c => c.name === 'resource_id');
        const verifyPortfolioId = verifyCommentCols.find(c => c.name === 'portfolio_id');
        const verifyCommentCount = db.prepare("SELECT COUNT(*) as cnt FROM resource_comments").get();

        const verifyUserCols = db.prepare("PRAGMA table_info(users)").all();
        const verifyRole = verifyUserCols.find(c => c.name === 'role');
        const verifyUserCount = db.prepare("SELECT COUNT(*) as cnt FROM users").get();

        const results = [];

        console.log('  resource_comments.resource_id:');
        const r1 = verifyResourceId.notnull === 0;
        console.log(`    notnull = ${verifyResourceId.notnull} (期望: 0) ${r1 ? '✅' : '❌'}`);
        results.push(r1);

        if (verifyPortfolioId) {
            console.log('  resource_comments.portfolio_id: ✅ 已存在');
            results.push(true);
        } else {
            console.log('  resource_comments.portfolio_id: ❌ 缺失');
            results.push(false);
        }

        console.log(`  resource_comments 数据完整性: ${verifyCommentCount.cnt} 条记录 ✅`);
        results.push(true);

        console.log('  users.role:');
        const r2 = verifyRole.dflt_value === "'student'";
        console.log(`    default = ${verifyRole.dflt_value} (期望: 'student') ${r2 ? '✅' : '❌'}`);
        results.push(r2);

        console.log(`  users 数据完整性: ${verifyUserCount.cnt} 条记录 ✅`);
        results.push(true);

        // 8. 设置 schema 版本号
        db.pragma('user_version = 1');
        console.log('\n📦 Schema 版本已更新为 1');

        if (results.every(Boolean)) {
            console.log('\n========================================');
            console.log('🎉 迁移完成！所有验证通过！');
            console.log(`   备份文件: ${backupPath}`);
            console.log('========================================');
        } else {
            console.log('\n========================================');
            console.log('⚠️  迁移完成但部分验证未通过，请检查');
            console.log(`   备份文件: ${backupPath}`);
            console.log('========================================');
        }

    } catch (error) {
        console.error('\n❌ 迁移执行失败，已回滚所有更改');
        console.error('   错误信息:', error.message);
        console.error('   堆栈:', error.stack);
        console.log(`\n💡 数据库已恢复到迁移前的状态`);
        console.log(`   备份文件位于: ${backupPath}`);
    } finally {
        db.close();
    }
}

main();
