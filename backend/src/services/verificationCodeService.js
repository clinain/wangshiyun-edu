/**
 * 验证码存储服务
 * 使用内存存储验证码（生产环境建议使用 Redis）
 */

const verificationCodes = new Map();

/**
 * 存储验证码
 * @param {string} email 邮箱
 * @param {string} code 验证码
 * @param {number} expireMinutes 过期时间（分钟）
 */
const storeCode = (email, code, expireMinutes = 10) => {
    const expireTime = Date.now() + expireMinutes * 60 * 1000;
    verificationCodes.set(email, {
        code,
        expireTime
    });
    // 仅在开发环境输出验证码明文，避免生产环境日志泄露
    if (process.env.NODE_ENV === 'development') {
        console.log(`📧 验证码已存储: ${email} -> ${code} (过期时间: ${new Date(expireTime).toLocaleString()})`);
    } else {
        console.log(`📧 验证码已存储: ${email} (过期时间: ${new Date(expireTime).toLocaleString()})`);
    }
};

/**
 * 验证验证码
 * @param {string} email 邮箱
 * @param {string} code 验证码
 * @returns {boolean} 是否验证成功
 */
const verifyCode = (email, code) => {
    const stored = verificationCodes.get(email);

    if (!stored) {
        console.log(`❌ 验证码不存在: ${email}`);
        return false;
    }

    // 检查是否过期
    if (Date.now() > stored.expireTime) {
        console.log(`❌ 验证码已过期: ${email}`);
        verificationCodes.delete(email);
        return false;
    }

    // 检查验证码是否正确
    if (stored.code !== code) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`❌ 验证码错误: ${email} (期望: ${stored.code}, 实际: ${code})`);
        } else {
            console.log(`❌ 验证码错误: ${email}`);
        }
        return false;
    }

    console.log(`✅ 验证码验证成功: ${email}`);
    // 验证成功后删除验证码
    verificationCodes.delete(email);
    return true;
};

/**
 * 检查验证码是否存在且未过期
 * @param {string} email 邮箱
 * @returns {boolean} 是否存在有效验证码
 */
const hasValidCode = (email) => {
    const stored = verificationCodes.get(email);
    if (!stored) {
        return false;
    }

    if (Date.now() > stored.expireTime) {
        verificationCodes.delete(email);
        return false;
    }

    return true;
};

/**
 * 获取验证码剩余有效时间（秒）
 * @param {string} email 邮箱
 * @returns {number} 剩余秒数，-1 表示不存在或已过期
 */
const getRemainingTime = (email) => {
    const stored = verificationCodes.get(email);
    if (!stored) {
        return -1;
    }

    const remaining = Math.floor((stored.expireTime - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1;
};

/**
 * 清除过期验证码
 */
const cleanExpiredCodes = () => {
    const now = Date.now();
    let cleaned = 0;

    for (const [email, data] of verificationCodes.entries()) {
        if (now > data.expireTime) {
            verificationCodes.delete(email);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`🧹 清理了 ${cleaned} 个过期验证码`);
    }
};

// 每分钟清理一次过期验证码
setInterval(cleanExpiredCodes, 60 * 1000);

module.exports = {
    storeCode,
    verifyCode,
    hasValidCode,
    getRemainingTime,
    cleanExpiredCodes
};