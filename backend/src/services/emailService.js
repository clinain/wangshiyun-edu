/**
 * 邮件发送服务
 * 使用阿里云 DirectMail API 发送邮件
 */

const AliClient = require('@alicloud/pop-core');

// DirectMail 客户端实例
let dmClient = null;

const extractFromAlias = () => {
    const explicitAlias = (process.env.ALIYUN_DM_FROM_ALIAS || '').trim();
    if (explicitAlias) {
        return explicitAlias;
    }

    const emailFrom = (process.env.EMAIL_FROM || '').trim();
    const aliasMatch = emailFrom.match(/^\s*(.*?)\s*<[^>]+>\s*$/);
    const alias = aliasMatch ? aliasMatch[1] : '';
    return alias.trim().replace(/^["']|["']$/g, '');
};

/**
 * 初始化 DirectMail 邮件服务
 */
const initEmailService = async () => {
    try {
        const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
        const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;

        if (!accessKeyId || !accessKeySecret) {
            console.error('❌ 缺少阿里云 AccessKey 配置，请检查 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET');
            return false;
        }

        dmClient = new AliClient({
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret,
            endpoint: 'https://dm.aliyuncs.com',
            apiVersion: '2015-11-23'
        });

        console.log('✅ DirectMail 邮件服务初始化成功');
        return true;
    } catch (error) {
        console.error('❌ DirectMail 邮件服务初始化失败:', error.message);
        return false;
    }
};

/**
 * 发送邮件（使用 DirectMail API）
 * @param {Object} options 邮件选项
 * @param {string} options.to 收件人邮箱
 * @param {string} options.subject 邮件主题
 * @param {string} options.html HTML 邮件内容
 * @returns {Promise<Object>} 发送结果
 */
const sendEmail = async (options) => {
    if (!dmClient) {
        const initialized = await initEmailService();
        if (!initialized || !dmClient) {
            console.error('❌ 邮件服务未就绪，无法发送邮件');
            return { success: false, error: 'DirectMail 邮件服务未初始化' };
        }
    }

    try {
        const accountName = process.env.ALIYUN_DM_ACCOUNT_NAME;
        const addressType = parseInt(process.env.ALIYUN_DM_ADDRESS_TYPE || '0', 10);
        const tagName = process.env.ALIYUN_DM_TAG_NAME || '';
        const fromAlias = extractFromAlias();

        if (!accountName) {
            return { success: false, error: '缺少 ALIYUN_DM_ACCOUNT_NAME 配置' };
        }

        const params = {
            AccountName: accountName,
            AddressType: addressType,
            ReplyToAddress: 'false',
            Subject: options.subject,
            ToAddress: options.to,
            HtmlBody: options.html
        };

        if (fromAlias) {
            params.FromAlias = fromAlias;
        }

        // 如果配置了 TagName，则添加到请求参数中
        if (tagName) {
            params.TagName = tagName;
        }

        const result = await dmClient.request('SingleSendMail', params, {
            method: 'POST'
        });

        console.log('✅ 邮件发送成功:', result.RequestId);
        return {
            success: true,
            messageId: result.RequestId,
            envId: result.EnvId
        };
    } catch (error) {
        console.error('❌ 邮件发送失败:', error.message);
        
        // 输出详细的 DirectMail API 错误信息
        if (error.code) {
            console.error('❌ 错误码:', error.code);
        }
        if (error.data) {
            console.error('❌ API 返回数据:', JSON.stringify(error.data, null, 2));
        }
        if (error.statusCode) {
            console.error('❌ HTTP 状态码:', error.statusCode);
        }
        // 输出完整的错误对象（排除循环引用）
        try {
            const errorDetail = {
                message: error.message,
                code: error.code,
                statusCode: error.statusCode,
                data: error.data,
                requestId: error.requestId || error.RequestId
            };
            console.error('❌ 完整错误详情:', JSON.stringify(errorDetail, null, 2));
        } catch (e) {
            console.error('❌ 无法序列化错误对象');
        }
        
        return { success: false, error: error.message };
    }
};

/**
 * 生成验证码邮件HTML模板
 * @param {string} code 验证码
 * @param {string} type 类型：register（注册）、login（登录）、resetPassword（重置密码）
 * @returns {string} HTML内容
 */
const getVerificationCodeHtml = (code, type = 'register') => {
    const templates = {
        register: {
            title: '网师云 - 邮箱验证',
            headerTitle: '网师云 - 邮箱验证',
            greeting: '您好！',
            message: '感谢您注册网师云师范生备课辅助系统。您的邮箱验证码是：',
            expireText: '验证码有效期为 10 分钟，请尽快完成注册。',
            ignoreText: '如果这不是您的操作，请忽略此邮件。'
        },
        login: {
            title: '网师云 - 登录验证码',
            headerTitle: '网师云 - 登录验证',
            greeting: '您好！',
            message: '您正在使用邮箱验证码登录网师云师范生备课辅助系统。您的邮箱验证码是：',
            expireText: '验证码有效期为 5 分钟，请尽快完成登录。',
            ignoreText: '如果这不是您的操作，请忽略此邮件。'
        },
        resetPassword: {
            title: '网师云 - 重置密码验证码',
            headerTitle: '网师云 - 重置密码',
            greeting: '您好！',
            message: '您正在请求重置网师云师范生备课辅助系统的登录密码。您的邮箱验证码是：',
            expireText: '验证码有效期为 10 分钟，请尽快完成密码重置。',
            ignoreText: '如果这不是您本人的操作，请立即联系客服，忽略此邮件即可。'
        }
    };

    const tpl = templates[type] || templates.register;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${tpl.headerTitle}</h1>
                </div>
                <div class="content">
                    <p>${tpl.greeting}</p>
                    <p>${tpl.message}</p>
                    <div class="code">${code}</div>
                    <p>${tpl.expireText}</p>
                    <p>${tpl.ignoreText}</p>
                </div>
                <div class="footer">
                    <p>此邮件由系统自动发送，请勿回复</p>
                    <p>网师云 © 2024</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

/**
 * 发送验证码邮件
 * @param {string} email 收件人邮箱
 * @param {string} code 验证码
 * @param {string} type 类型：register（注册）、login（登录）、resetPassword（重置密码），默认 register
 * @returns {Promise<Object>} 发送结果
 */
const sendVerificationCode = async (email, code, type = 'register') => {
    const html = getVerificationCodeHtml(code, type);

    const subjectMap = {
        register: '网师云 - 邮箱验证码',
        login: '网师云 - 登录验证码',
        resetPassword: '网师云 - 重置密码验证码'
    };

    return await sendEmail({
        to: email,
        subject: subjectMap[type] || subjectMap.register,
        html: html
    });
};

module.exports = {
    initEmailService,
    sendEmail,
    sendVerificationCode,
    extractFromAlias
};
