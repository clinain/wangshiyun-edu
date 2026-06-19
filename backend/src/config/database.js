'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const dataDir = path.join(__dirname, '../../data');
const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, 'wangshiyun.sqlite');

let db = null;

const ensureDatabase = () => {
    if (db) return db;
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    return db;
};

const normalizeSQL = (sql) => sql
    .replace(/`/g, '')
    .replace(/\bNOW\(\)/gi, "datetime('now', 'localtime')")
    .replace(/\bCURRENT_TIMESTAMP\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bAUTO_INCREMENT\b/gi, 'AUTOINCREMENT');

const isReadSQL = (sql) => /^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql);
const isInsertSQL = (sql) => /^\s*INSERT\b/i.test(sql);

const query = async (sql, params = []) => {
    const database = ensureDatabase();
    const normalizedSQL = normalizeSQL(sql);

    if (isReadSQL(normalizedSQL)) {
        return database.prepare(normalizedSQL).all(params);
    }

    const result = database.prepare(normalizedSQL).run(params);
    if (isInsertSQL(normalizedSQL)) {
        return { insertId: Number(result.lastInsertRowid), affectedRows: result.changes };
    }
    return { affectedRows: result.changes };
};

const execute = async (sql, params = []) => {
    const result = await query(sql, params);
    if (Array.isArray(result)) return [result];
    return [result];
};

const getPool = () => ({
    execute,
    query,
    raw: ensureDatabase()
});

const testConnection = async () => {
    try {
        ensureDatabase().prepare('SELECT 1 AS ok').get();
        console.log('========================================');
        console.log('✅ SQLite 数据库连接测试成功');
        console.log(`文件: ${dbPath}`);
        console.log('========================================');
        return true;
    } catch (error) {
        console.error('SQLite 数据库连接测试失败:', error.message);
        return false;
    }
};

const closePool = async () => {
    if (db) {
        db.close();
        db = null;
    }
};

module.exports = {
    query,
    testConnection,
    closePool,
    getPool,
    createPool: async () => getPool(),
    execute
};
