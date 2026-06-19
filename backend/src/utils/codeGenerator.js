/**
 * 验证码生成工具
 */

/**
 * 生成6位数字验证码
 * @returns {string} 6位数字验证码
 */
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 生成字母数字混合验证码
 * @param {number} length 验证码长度
 * @returns {string} 验证码
 */
const generateMixedCode = (length = 6) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

module.exports = {
    generateCode,
    generateMixedCode
};