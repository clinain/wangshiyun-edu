/**
 * 网师云-师范生备课辅助系统
 * 数据库配置文件
 * 
 * 使用 mysql2 连接池实现数据库操作
 * 支持连接管理、错误重试、自动重连等功能
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wangshiyun',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_MAX) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000,
    timezone: '+08:00',
    charset: 'utf8mb4'
};

const retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR']
};

/**
 * 初始化数据库（如果不存在则创建）
 */
const initDatabase = async () => {
    try {
        const tempConfig = {
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            connectTimeout: dbConfig.connectTimeout
        };

        const tempConnection = await mysql.createConnection(tempConfig);

        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        console.log(`数据库 ${dbConfig.database} 初始化成功`);

        await tempConnection.end();
    } catch (error) {
        console.error('数据库初始化失败:', error.message);
        throw error;
    }
};

/**
 * 创建数据库连接池
 * @returns {Promise<mysql.Pool>} 连接池实例
 */
const createPool = async () => {
    if (pool) {
        return pool;
    }

    try {
        await initDatabase();

        pool = mysql.createPool(dbConfig);
        
        console.log('========================================');
        console.log('数据库连接池创建成功');
        console.log(`主机: ${dbConfig.host}:${dbConfig.port}`);
        console.log(`数据库: ${dbConfig.database}`);
        console.log(`最大连接数: ${dbConfig.connectionLimit}`);
        console.log('========================================');

        pool.on('connection', (connection) => {
            console.log(`[${new Date().toISOString()}] 新建连接: ${connection.threadId}`);
        });

        pool.on('release', (connection) => {
            console.log(`[${new Date().toISOString()}] 释放连接: ${connection.threadId}`);
        });

        pool.on('error', (err) => {
            console.error('数据库连接池错误:', err.message);
            handlePoolError(err);
        });

        return pool;
    } catch (error) {
        console.error('创建连接池失败:', error.message);
        throw error;
    }
};

/**
 * 处理连接池错误
 * @param {Error} err 错误对象
 */
const handlePoolError = (err) => {
    const errorCode = err.code;
    
    if (retryConfig.retryErrors.includes(errorCode)) {
        console.warn(`检测到连接错误: ${errorCode}，准备重连...`);
        reconnect();
    }
};

/**
 * 重新连接数据库
 */
const reconnect = async () => {
    console.log('开始重新连接数据库...');
    
    try {
        if (pool) {
            await pool.end();
        }
        
        await createPool();
        console.log('数据库重新连接成功');
    } catch (error) {
        console.error('重新连接失败:', error.message);
        
        setTimeout(() => {
            reconnect();
        }, retryConfig.retryDelay * 2);
    }
};

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
const testConnection = async () => {
    let retries = 0;
    
    while (retries < retryConfig.maxRetries) {
        try {
            const currentPool = await createPool();
            const connection = await currentPool.getConnection();
            
            console.log('========================================');
            console.log('✅ 数据库连接测试成功');
            console.log(`连接ID: ${connection.threadId}`);
            console.log(`主机: ${dbConfig.host}:${dbConfig.port}`);
            console.log(`数据库: ${dbConfig.database}`);
            console.log('========================================');
            
            connection.release();
            return true;
        } catch (error) {
            retries++;
            console.error(`数据库连接测试失败 (尝试 ${retries}/${retryConfig.maxRetries}):`, error.message);
            
            if (retries < retryConfig.maxRetries) {
                console.log(`${retryConfig.retryDelay / 1000}秒后重试...`);
                await sleep(retryConfig.retryDelay);
            }
        }
    }
    
    console.error('数据库连接测试失败，已达到最大重试次数');
    return false;
};

/**
 * 执行查询操作
 * @param {string} sql SQL语句
 * @param {Array} params 参数数组
 * @returns {Promise<Array>} 查询结果
 */
const query = async (sql, params = []) => {
    let retries = 0;
    
    while (retries < retryConfig.maxRetries) {
        try {
            const currentPool = await createPool();
            
            if (process.env.NODE_ENV === 'development') {
                console.log('SQL:', sql);
                if (params.length > 0) {
                    console.log('Params:', params);
                }
            }
            
            const [results, fields] = await currentPool.execute(sql, params);
            
            return results;
        } catch (error) {
            retries++;
            
            if (process.env.NODE_ENV === 'development') {
                console.error(`查询执行失败 (尝试 ${retries}/${retryConfig.maxRetries}):`, error.message);
            }
            
            if (retryConfig.retryErrors.includes(error.code)) {
                if (retries < retryConfig.maxRetries) {
                    console.log(`等待 ${retryConfig.retryDelay / 1000}秒后重试...`);
                    await sleep(retryConfig.retryDelay);
                    continue;
                }
            }
            
            throw error;
        }
    }
    
    throw new Error('查询执行失败，已达到最大重试次数');
};

/**
 * 获取单个连接（用于事务操作）
 * @returns {Promise<mysql.PoolConnection>} 数据库连接
 */
const getConnection = async () => {
    try {
        const currentPool = await createPool();
        const connection = await currentPool.getConnection();
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`获取连接成功，连接ID: ${connection.threadId}`);
        }
        
        return connection;
    } catch (error) {
        console.error('获取连接失败:', error.message);
        throw error;
    }
};

/**
 * 执行事务操作
 * @param {Function} callback 事务回调函数，接收connection对象
 * @returns {Promise<any>} 事务执行结果
 */
const transaction = async (callback) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();
        
        const result = await callback(connection);
        
        await connection.commit();
        
        if (process.env.NODE_ENV === 'development') {
            console.log('事务提交成功');
        }
        
        return result;
    } catch (error) {
        await connection.rollback();
        
        if (process.env.NODE_ENV === 'development') {
            console.error('事务回滚成功:', error.message);
        }
        
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * 批量插入数据
 * @param {string} table 表名
 * @param {Array<string>} fields 字段数组
 * @param {Array<Array>} values 值数组（二维数组）
 * @returns {Promise<Object>} 插入结果
 */
const batchInsert = async (table, fields, values) => {
    if (!table || !fields.length || !values.length) {
        throw new Error('参数不完整');
    }
    
    const placeholders = values.map(() => 
        `(${fields.map(() => '?').join(', ')})`
    ).join(', ');
    
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${placeholders}`;
    const flatValues = values.flat();
    
    const result = await query(sql, flatValues);
    
    return {
        affectedRows: result.affectedRows,
        insertId: result.insertId,
        warningCount: result.warningCount
    };
};

/**
 * 批量更新数据
 * @param {string} table 表名
 * @param {Object} data 更新数据对象
 * @param {string} whereClause WHERE条件
 * @param {Array} whereParams WHERE参数
 * @returns {Promise<Object>} 更新结果
 */
const batchUpdate = async (table, data, whereClause, whereParams = [])=> {
    if (!table || !data || !whereClause) {
        throw new Error('参数不完整');
    }
    
    const updateFields = Object.keys(data).map(key => `${key} = ?`);
    const updateValues = [...Object.values(data), ...whereParams];
    
    const sql = `UPDATE ${table} SET ${updateFields.join(', ')} WHERE ${whereClause}`;
    
    const result = await query(sql, updateValues);
    
    return {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows,
        warningCount: result.warningCount
    };
};

/**
 * 分页查询
 * @param {string} table 表名
 * @param {Object} options 查询选项
 * @returns {Promise<Object>} 查询结果和分页信息
 */
const paginate = async (table, options = {}) => {
    const {
        fields = '*',
        where = '',
        whereParams = [],
        orderBy = 'id DESC',
        page = 1,
        pageSize = 10
    } = options;
    
    const offset = (page - 1) * pageSize;
    
    let countSql = `SELECT COUNT(*) as total FROM ${table}`;
    let dataSql = `SELECT ${fields} FROM ${table}`;
    
    if (where) {
        countSql += ` WHERE ${where}`;
        dataSql += ` WHERE ${where}`;
    }
    
    dataSql += ` ORDER BY ${orderBy} LIMIT ${pageSize} OFFSET ${offset}`;
    
    const [countResult] = await query(countSql, whereParams);
    const total = countResult.total;
    
    const data = await query(dataSql, whereParams);
    
    return {
        data,
        pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total: parseInt(total),
            totalPages: Math.ceil(total / pageSize),
            hasNext: page * pageSize < total,
            hasPrev: page > 1
        }
    };
};

/**
 * 关闭连接池
 */
const closePool = async () => {
    if (pool) {
        try {
            await pool.end();
            pool = null;
            console.log('数据库连接池已关闭');
        } catch (error) {
            console.error('关闭连接池失败:', error.message);
            throw error;
        }
    }
};

/**
 * 休眠函数
 * @param {number} ms 毫秒数
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 获取连接池状态
 * @returns {Object} 连接池状态
 */
const getPoolStatus = () => {
    if (!pool) {
        return {
            status: 'not_initialized',
            connectionCount: 0
        };
    }
    
    return {
        status: 'active',
        config: {
            host: pool.pool.config.connectionConfig.host,
            port: pool.pool.config.connectionConfig.port,
            database: pool.pool.config.connectionConfig.database
        }
    };
};

/**
 * 健康检查
 * @returns {Promise<Object>} 健康状态
 */
const healthCheck = async () => {
    try {
        const isConnected = await testConnection();
        
        return {
            status: isConnected ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'database',
            details: {
                host: dbConfig.host,
                port: dbConfig.port,
                database: dbConfig.database
            }
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'database',
            error: error.message
        };
    }
};

module.exports = {
    createPool,
    testConnection,
    query,
    getConnection,
    transaction,
    batchInsert,
    batchUpdate,
    paginate,
    closePool,
    getPoolStatus,
    healthCheck,
    getPool: () => pool
};
