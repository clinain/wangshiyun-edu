/**
 * AI 服务
 * 集成多个免费大模型API，支持模型切换和智能备用机制
 * 支持的模型：智谱GLM-4-Flash、阿里云DashScope、腾讯混元、百度文心一言、豆包API、零一万物、火山引擎
 */

const axios = require('axios');

// 主AI提供商配置（优先使用）
const PRIMARY_PROVIDER = process.env.AI_PRIMARY_PROVIDER || 'zhipu';

// 智谱GLM配置
const ZHIPU_API_URL = process.env.ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';
const ZHIPU_MODEL = process.env.ZHIPU_MODEL || 'glm-4-flash';
const ZHIPU_MAX_TOKENS = parseInt(process.env.ZHIPU_MAX_TOKENS) || 8000;

// 阿里云DashScope配置
const DASHSCOPE_API_URL = process.env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL || 'qwen-plus';
const DASHSCOPE_MAX_TOKENS = parseInt(process.env.DASHSCOPE_MAX_TOKENS) || 8000;

// 腾讯混元配置
const TENCENT_API_URL = process.env.TENCENT_API_URL || 'https://api.tencent.com/v1/chat/completions';
const TENCENT_API_KEY = process.env.TENCENT_API_KEY || '';
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';
const TENCENT_MODEL = process.env.TENCENT_MODEL || 'hunyuan-lite';
const TENCENT_MAX_TOKENS = parseInt(process.env.TENCENT_MAX_TOKENS) || 8000;

// 百度文心一言配置
const BAIDU_API_URL = process.env.BAIDU_API_URL || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';
const BAIDU_API_KEY = process.env.BAIDU_API_KEY || '';
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';
const BAIDU_MODEL = process.env.BAIDU_MODEL || 'ernie-3.5-turbo';
const BAIDU_MAX_TOKENS = parseInt(process.env.BAIDU_MAX_TOKENS) || 8000;

// 豆包API配置
const DOUBAO_API_URL = process.env.DOUBAO_API_URL || 'https://api.doubao.com/v1/chat/completions';
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || '';
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || 'doubao-3';
const DOUBAO_MAX_TOKENS = parseInt(process.env.DOUBAO_MAX_TOKENS) || 8000;

// 零一万物配置
const YI_API_URL = process.env.YI_API_URL || 'https://api.lingyiwanwu.com/v1/chat/completions';
const YI_API_KEY = process.env.YI_API_KEY || '';
const YI_MODEL = process.env.YI_MODEL || 'yi-34b-chat';
const YI_MAX_TOKENS = parseInt(process.env.YI_MAX_TOKENS) || 8000;

// 火山引擎配置（支持ARK平台API Key直连和传统AK/SK两种认证方式）
const VOLCENGINE_API_URL = process.env.VOLCENGINE_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const VOLCENGINE_API_KEY = process.env.VOLCENGINE_API_KEY || '';
const VOLCENGINE_SECRET_KEY = process.env.VOLCENGINE_SECRET_KEY || '';
const VOLCENGINE_MODEL = process.env.VOLCENGINE_MODEL || 'doubao-1-5-pro-32k-250115';
const VOLCENGINE_MAX_TOKENS = parseInt(process.env.VOLCENGINE_MAX_TOKENS) || 8000;
const VOLCENGINE_AUTH_TYPE = process.env.VOLCENGINE_AUTH_TYPE || 'bearer'; // 'bearer' 或 'aksk'

// 默认配置
const AI_CONFIG = {
    maxTokens: 8000,
    temperature: 0.7,
    topP: 0.9,
    timeout: 120000,  // 超时时间120秒
    maxRetries: 2    // 最大重试次数
};

// API状态监控
const API_STATUS = {
    zhipu: { available: true, lastSuccess: null, errorCount: 0 },
    dashscope: { available: true, lastSuccess: null, errorCount: 0 },
    tencent: { available: true, lastSuccess: null, errorCount: 0 },
    baidu: { available: true, lastSuccess: null, errorCount: 0 },
    doubao: { available: true, lastSuccess: null, errorCount: 0 },
    yi: { available: true, lastSuccess: null, errorCount: 0 },
    volcengine: { available: true, lastSuccess: null, errorCount: 0 }
};

class AIService {
    /**
     * 获取所有可用的AI提供商列表
     */
    static getProviders() {
        return [
            { id: 'zhipu', name: '智谱GLM-4-Flash', model: ZHIPU_MODEL, available: this.isZhipuAvailable() },
            { id: 'dashscope', name: '阿里云DashScope', model: DASHSCOPE_MODEL, available: this.isDashScopeAvailable() },
            { id: 'tencent', name: '腾讯混元', model: TENCENT_MODEL, available: this.isTencentAvailable() },
            { id: 'baidu', name: '百度文心一言', model: BAIDU_MODEL, available: this.isBaiduAvailable() },
            { id: 'doubao', name: '豆包', model: DOUBAO_MODEL, available: this.isDoubaoAvailable() },
            { id: 'yi', name: '零一万物', model: YI_MODEL, available: this.isYiAvailable() },
            { id: 'volcengine', name: '火山引擎', model: VOLCENGINE_MODEL, available: this.isVolcEngineAvailable() }
        ];
    }

    /**
     * 获取主AI提供商
     */
    static getPrimaryProvider() {
        return PRIMARY_PROVIDER;
    }

    /**
     * 设置主AI提供商（运行时切换）
     */
    static setPrimaryProvider(provider) {
        if (['zhipu', 'dashscope', 'tencent', 'baidu', 'doubao', 'yi', 'volcengine'].includes(provider)) {
            // 注意：这只是运行时设置，重启后会恢复为环境变量配置
            this._runtimeProvider = provider;
            console.log(`✅ 已切换AI提供商为: ${provider}`);
            return true;
        }
        return false;
    }

    /**
     * 获取当前使用的提供商（优先使用运行时设置）
     */
    static getCurrentProvider() {
        return this._runtimeProvider || PRIMARY_PROVIDER;
    }

    /**
     * 检查所有API是否可用
     */
    static isAvailable() {
        return this.getAvailableProviders().length > 0;
    }

    /**
     * 获取所有可用的提供商ID列表
     */
    static getAvailableProviders() {
        const providers = [];
        if (this.isZhipuAvailable()) providers.push('zhipu');
        if (this.isDashScopeAvailable()) providers.push('dashscope');
        if (this.isTencentAvailable()) providers.push('tencent');
        if (this.isBaiduAvailable()) providers.push('baidu');
        if (this.isDoubaoAvailable()) providers.push('doubao');
        if (this.isYiAvailable()) providers.push('yi');
        if (this.isVolcEngineAvailable()) providers.push('volcengine');
        return providers;
    }

    // ========== 各个API的可用性检查 ==========

    static isZhipuAvailable() {
        return !!ZHIPU_API_KEY && ZHIPU_API_KEY !== '' && API_STATUS.zhipu.available;
    }

    static isDashScopeAvailable() {
        return !!DASHSCOPE_API_KEY && DASHSCOPE_API_KEY !== '' && API_STATUS.dashscope.available;
    }

    static isTencentAvailable() {
        return !!TENCENT_API_KEY && TENCENT_API_KEY !== '' && !!TENCENT_SECRET_KEY && TENCENT_SECRET_KEY !== '' && API_STATUS.tencent.available;
    }

    static isBaiduAvailable() {
        return !!BAIDU_API_KEY && BAIDU_API_KEY !== '' && !!BAIDU_SECRET_KEY && BAIDU_SECRET_KEY !== '' && API_STATUS.baidu.available;
    }

    static isDoubaoAvailable() {
        return !!DOUBAO_API_KEY && DOUBAO_API_KEY !== '' && API_STATUS.doubao.available;
    }

    static isYiAvailable() {
        return !!YI_API_KEY && YI_API_KEY !== '' && API_STATUS.yi.available;
    }

    static isVolcEngineAvailable() {
        // 支持两种认证方式：
        // 1. bearer 模式：只需 API Key（ARK平台格式 ark-xxxx-xxxx）
        // 2. aksk 模式：需要 API Key + Secret Key
        if (VOLCENGINE_AUTH_TYPE === 'bearer') {
            return !!VOLCENGINE_API_KEY && VOLCENGINE_API_KEY !== '' && API_STATUS.volcengine.available;
        }
        return !!VOLCENGINE_API_KEY && VOLCENGINE_API_KEY !== '' && !!VOLCENGINE_SECRET_KEY && VOLCENGINE_SECRET_KEY !== '' && API_STATUS.volcengine.available;
    }

    /**
     * 更新API状态
     */
    static updateStatus(provider, success, errorMessage = '') {
        if (API_STATUS[provider]) {
            if (success) {
                API_STATUS[provider].available = true;
                API_STATUS[provider].lastSuccess = new Date();
                API_STATUS[provider].errorCount = 0;
            } else {
                API_STATUS[provider].errorCount++;
                // 连续3次失败则标记为不可用，30秒后自动恢复
                if (API_STATUS[provider].errorCount >= 3) {
                    API_STATUS[provider].available = false;
                    setTimeout(() => {
                        API_STATUS[provider].available = true;
                        API_STATUS[provider].errorCount = 0;
                        console.log(`🔄 ${provider} API已自动恢复可用`);
                    }, 30000);
                }
            }
        }
    }

    /**
     * 智能路由调用AI API
     * 支持自动故障转移和负载均衡
     * @param {string} systemPrompt 系统提示
     * @param {string} userPrompt 用户提示
     * @param {object} options 选项（provider: 指定提供商，enableFailover: 是否启用故障转移）
     * @returns {Promise<string>} AI 回复内容
     */
    static async callAPI(systemPrompt, userPrompt, options = {}) {
        const availableProviders = this.getAvailableProviders();
        
        if (availableProviders.length === 0) {
            throw new Error('没有可用的AI服务，请配置至少一个API密钥');
        }

        // 获取提供商列表（优先使用指定的，否则使用智能路由）
        let providersToTry;
        if (options.provider && availableProviders.includes(options.provider)) {
            providersToTry = [options.provider];
        } else {
            // 智能排序：优先使用主提供商，然后根据成功率排序
            providersToTry = this.getSmartProviderOrder(availableProviders);
        }

        const enableFailover = options.enableFailover !== false;
        let lastError = null;

        for (let i = 0; i < providersToTry.length; i++) {
            const provider = providersToTry[i];
            
            try {
                console.log(`🔄 正在调用 ${provider} API...`);
                
                let result;
                switch (provider) {
                    case 'zhipu':
                        result = await this.callZhipuAPI(systemPrompt, userPrompt);
                        break;
                    case 'dashscope':
                        result = await this.callDashScopeAPI(systemPrompt, userPrompt);
                        break;
                    case 'tencent':
                        result = await this.callTencentAPI(systemPrompt, userPrompt);
                        break;
                    case 'baidu':
                        result = await this.callBaiduAPI(systemPrompt, userPrompt);
                        break;
                    case 'doubao':
                        result = await this.callDoubaoAPI(systemPrompt, userPrompt);
                        break;
                    case 'yi':
                        result = await this.callYiAPI(systemPrompt, userPrompt);
                        break;
                    case 'volcengine':
                        result = await this.callVolcEngineAPI(systemPrompt, userPrompt);
                        break;
                    default:
                        throw new Error(`未知的AI提供商: ${provider}`);
                }

                this.updateStatus(provider, true);
                console.log(`✅ ${provider} API调用成功`);
                return result;

            } catch (error) {
                this.updateStatus(provider, false, error.message);
                lastError = error;
                
                if (enableFailover && i < providersToTry.length - 1) {
                    console.warn(`⚠️ ${provider} API调用失败，尝试下一个提供商: ${error.message}`);
                } else {
                    break;
                }
            }
        }

        throw lastError || new Error('所有AI服务调用失败');
    }

    /**
     * 智能排序提供商（基于优先级和健康状态）
     */
    static getSmartProviderOrder(availableProviders) {
        const currentProvider = this.getCurrentProvider();
        
        // 创建带有权重的列表
        const weightedProviders = availableProviders.map(provider => {
            let weight = 1;
            
            // 主提供商权重最高
            if (provider === currentProvider) {
                weight += 10;
            }
            
            // 健康状态加分（最近成功的优先）
            if (API_STATUS[provider].lastSuccess) {
                const minutesAgo = (Date.now() - API_STATUS[provider].lastSuccess.getTime()) / 60000;
                if (minutesAgo < 5) weight += 5;
                else if (minutesAgo < 30) weight += 3;
            }
            
            // 错误次数减分
            weight -= API_STATUS[provider].errorCount * 2;
            
            return { provider, weight };
        });

        // 按权重排序
        weightedProviders.sort((a, b) => b.weight - a.weight);
        
        return weightedProviders.map(p => p.provider);
    }

    // ========== 各个API的调用实现 ==========

    /**
     * 调用智谱GLM-4-Flash API
     */
    static async callZhipuAPI(systemPrompt, userPrompt) {
        if (!this.isZhipuAvailable()) {
            throw new Error('智谱API未配置或不可用');
        }

        const response = await axios.post(
            ZHIPU_API_URL,
            {
                model: ZHIPU_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: ZHIPU_MAX_TOKENS,
                temperature: AI_CONFIG.temperature,
                top_p: AI_CONFIG.topP
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ZHIPU_API_KEY}`
                },
                timeout: AI_CONFIG.timeout
            }
        );

        return response.data.choices[0].message.content;
    }

    /**
     * 调用阿里云DashScope API
     */
    static async callDashScopeAPI(systemPrompt, userPrompt) {
        if (!this.isDashScopeAvailable()) {
            throw new Error('阿里云API未配置或不可用');
        }

        const response = await axios.post(
            DASHSCOPE_API_URL,
            {
                model: DASHSCOPE_MODEL,
                input: {
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                },
                parameters: {
                    max_tokens: DASHSCOPE_MAX_TOKENS,
                    temperature: AI_CONFIG.temperature
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
                },
                timeout: AI_CONFIG.timeout
            }
        );

        return response.data.output?.text || response.data.output?.choices?.[0]?.message?.content || '';
    }

    /**
     * 调用腾讯混元API
     */
    static async callTencentAPI(systemPrompt, userPrompt) {
        if (!this.isTencentAvailable()) {
            throw new Error('腾讯混元API未配置或不可用');
        }

        const response = await axios.post(
            TENCENT_API_URL,
            {
                model: TENCENT_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: TENCENT_MAX_TOKENS,
                temperature: AI_CONFIG.temperature
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TENCENT_API_KEY}`,
                    'X-Tencent-Secret': TENCENT_SECRET_KEY
                },
                timeout: AI_CONFIG.timeout
            }
        );

        return response.data.choices[0]?.message?.content || '';
    }

    /**
     * 调用百度文心一言API
     */
    static async callBaiduAPI(systemPrompt, userPrompt) {
        if (!this.isBaiduAvailable()) {
            throw new Error('百度文心一言API未配置或不可用');
        }

        // 先获取access_token
        let accessToken;
        try {
            const tokenResponse = await axios.post(
                'https://aip.baidubce.com/oauth/2.0/token',
                `grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`,
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );
            accessToken = tokenResponse.data.access_token;
        } catch (error) {
            throw new Error(`获取百度Access Token失败: ${error.message}`);
        }

        const response = await axios.post(
            `${BAIDU_API_URL}?access_token=${accessToken}`,
            {
                model: BAIDU_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: BAIDU_MAX_TOKENS,
                temperature: AI_CONFIG.temperature
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: AI_CONFIG.timeout
            }
        );

        return response.data.result?.content || response.data.choices?.[0]?.message?.content || '';
    }

    /**
     * 调用豆包API
     */
    static async callDoubaoAPI(systemPrompt, userPrompt) {
        if (!this.isDoubaoAvailable()) {
            throw new Error('豆包API未配置或不可用');
        }

        const response = await axios.post(
            DOUBAO_API_URL,
            {
                model: DOUBAO_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: DOUBAO_MAX_TOKENS,
                temperature: AI_CONFIG.temperature
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DOUBAO_API_KEY}`
                },
                timeout: AI_CONFIG.timeout
            }
        );

        return response.data.choices[0]?.message?.content || '';
    }

    /**
     * 调用零一万物API
     */
    static async callYiAPI(systemPrompt, userPrompt) {
        if (!this.isYiAvailable()) {
            throw new Error('零一万物API未配置或不可用');
        }

        const response = await axios.post(
            YI_API_URL,
            {
                model: YI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: YI_MAX_TOKENS,
                temperature: AI_CONFIG.temperature
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${YI_API_KEY}`
                },
                timeout: AI_CONFIG.timeout
            }
        );

        return response.data.choices[0]?.message?.content || '';
    }

    /**
     * 调用火山引擎API（支持ARK平台API Key直连和传统AK/SK两种认证方式）
     */
    static async callVolcEngineAPI(systemPrompt, userPrompt) {
        if (!this.isVolcEngineAvailable()) {
            throw new Error('火山引擎API未配置或不可用');
        }

        try {
            let authHeader;
            if (VOLCENGINE_AUTH_TYPE === 'aksk' && VOLCENGINE_SECRET_KEY) {
                // 传统AK/SK认证：API-Key:Secret-Key 进行Base64编码
                const authToken = Buffer.from(`${VOLCENGINE_API_KEY}:${VOLCENGINE_SECRET_KEY}`).toString('base64');
                authHeader = `Bearer ${authToken}`;
            } else {
                // ARK平台Bearer认证：直接使用API Key作为Token
                authHeader = `Bearer ${VOLCENGINE_API_KEY}`;
            }

            // 使用流式调用（stream=True），避免长文本生成超时
            const response = await axios.post(
                VOLCENGINE_API_URL,
                {
                    model: VOLCENGINE_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: VOLCENGINE_MAX_TOKENS,
                    temperature: AI_CONFIG.temperature,
                    stream: true
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    },
                    timeout: 1800000, // 30分钟超时（官方规范：非流式≥1800s）
                    responseType: 'stream'
                }
            );

            // 拼接流式分片内容
            let fullContent = '';
            const stream = response.data;

            return new Promise((resolve, reject) => {
                let buffer = '';
                
                stream.on('data', (chunk) => {
                    buffer += chunk.toString();
                    // SSE 格式：每个事件以 \n\n 分隔
                    const lines = buffer.split('\n');
                    // 保留最后一个可能不完整的行
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data:')) continue;
                        const data = trimmed.slice(5).trim();
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta?.content;
                            if (delta) {
                                fullContent += delta;
                            }
                        } catch {
                            // 忽略无法解析的行
                        }
                    }
                });

                stream.on('end', () => {
                    // 处理缓冲区剩余数据
                    if (buffer.trim()) {
                        const lines = buffer.split('\n');
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith('data:')) continue;
                            const data = trimmed.slice(5).trim();
                            if (data === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(data);
                                const delta = parsed.choices?.[0]?.delta?.content;
                                if (delta) fullContent += delta;
                            } catch {}
                        }
                    }
                    resolve(fullContent || '');
                });

                stream.on('error', (err) => {
                    reject(err);
                });
            });
        } catch (error) {
            const statusCode = error.response?.status;
            const errorMessage = error.response?.data?.message || error.message;
            
            if (statusCode === 401) {
                throw new Error(`火山引擎API认证失败(401)。请检查：1. API Key是否正确（当前认证方式: ${VOLCENGINE_AUTH_TYPE}） 2. API Key是否在火山引擎控制台有效 3. 是否需要先创建推理接入点(Endpoint)。详细错误: ${errorMessage}`);
            } else if (statusCode === 404) {
                throw new Error(`火山引擎API端点不存在(404)。请检查API URL是否正确。详细错误: ${errorMessage}`);
            } else {
                throw new Error(`火山引擎API调用失败: ${errorMessage}`);
            }
        }
    }

    /**
     * 获取当前使用的AI服务信息
     */
    static getServiceInfo() {
        const providers = this.getProviders();
        const availableProviders = this.getAvailableProviders();
        const currentProvider = this.getCurrentProvider();
        
        return {
            currentProvider: currentProvider,
            currentProviderInfo: providers.find(p => p.id === currentProvider),
            availableProviders: availableProviders,
            allProviders: providers,
            status: API_STATUS
        };
    }

    /**
     * 生成教案
     * @param {string} subject 学科
     * @param {string} grade 年级
     * @param {string} topic 主题
     * @param {object} options 选项
     * @returns {Promise<Object>} 教案数据
     */
    static async generateLesson(subject, grade, topic, options = {}) {
        // 如果没有可用的AI提供商，直接返回模拟数据
        if (!this.isAvailable()) {
            console.log('⚠️ AI服务未配置API密钥，使用模拟数据');
            return this.getMockLesson(subject, grade, topic);
        }

        const systemPrompt = `你是一位资深的教育专家，拥有30年一线教学经验，擅长设计高质量、详细完整的课程计划。

请根据提供的信息，生成一份极其详细、完整、丰富的教案。教案要像一篇完整的教学设计文档，内容要详尽、深入、有血有肉。

【教案要求】
1. 教学目标（至少5-8个，详细阐述知识与技能、过程与方法、情感态度价值观三维目标）
2. 教学重难点（至少3-5个，要具体说明重点和难点）
3. 教学过程（极其详细，每个环节都要有具体内容、时间分配、教师活动、学生活动、设计意图）
   - 导入环节：设计有趣的情境或问题，激发学生兴趣
   - 新课讲授：详细讲解知识点，包含例题、分析、互动
   - 巩固练习：设计多样化的练习题目
   - 课堂小结：引导学生梳理知识体系
4. 作业布置：设计分层作业，照顾不同层次学生
5. 教学反思：提供教学建议和注意事项

【格式要求】
请用JSON格式返回，包含以下字段（每个字段的内容都要详细、完整、有深度）：
- teachingGoals: 教学目标数组（每个目标都要详细描述，至少100字）
- keyPoints: 教学重难点数组（每个要点都要详细说明）
- teachingProcess: 教学过程对象，详细描述每个环节（每个环节至少200字）
- assignments: 课后作业（详细说明作业内容和要求）
- summary: 教学总结（至少100字的教学反思和建议）`;

        const userPrompt = `请为${subject}学科设计一份详细完整的教案：
- 教学主题：${topic}
- 年级：${grade}
- 请确保教案符合新课程标准要求，教学过程生动有趣、详尽完整

【重要提醒】
- 教学目标的每个要点都要详细展开，描述具体的学生学习效果
- 教学过程要包含具体的教学环节、时间分配（用括号标注如[5分钟]）
- 要有具体的师生互动设计
- 例题和练习题目要具体
- 内容要像一份真正的教学设计文档那样详尽`;

        try {
            // 设置最大等待时间，超过后使用模拟数据
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('AI调用超时')), AI_CONFIG.timeout);
            });

            const aiResponse = await Promise.race([
                this.callAPI(systemPrompt, userPrompt, options),
                timeoutPromise
            ]);

            let lessonData;
            try {
                lessonData = JSON.parse(aiResponse);
            } catch {
                lessonData = this.parseLessonFromText(aiResponse);
            }

            // 验证数据完整性
            if (!lessonData.teachingGoals || !lessonData.keyPoints) {
                throw new Error('AI返回的数据不完整');
            }

            return {
                title: topic,
                subject,
                grade,
                ...lessonData,
                generatedAt: new Date().toISOString(),
                generatedBy: this.getCurrentProvider()
            };
        } catch (error) {
            console.error('AI生成教案失败:', error.message);
            console.log('📋 使用模拟数据作为备用方案');
            return this.getMockLesson(subject, grade, topic);
        }
    }

    /**
     * 生成PPT内容（AI智能设计版）
     * 调用AI大模型分析教案，提取适合课堂展示的知识点生成PPT
     * @param {object} lessonData 教案数据
     * @param {object} options 选项
     * @returns {Promise<Object>} PPT数据
     */
    static async generatePPTContent(lessonData, options = {}) {
        const {
            title,
            subject,
            grade,
            teachingGoals,
            keyPoints,
            teachingProcess,
            assignments,
            summary
        } = lessonData;

        // 解析教案数据
        const goals = this.parseJSON(teachingGoals, []);
        const points = this.parseJSON(keyPoints, []);
        const process = this.parseJSON(teachingProcess, {});
        const assignList = typeof assignments === 'string' ? assignments : (assignments || '');
        const summaryText = typeof summary === 'string' ? summary : (summary || '');

        // 如果AI不可用，回退到模板生成
        if (!this.isAvailable()) {
            console.log('⚠️ AI服务不可用，使用模板生成PPT');
            const PPTService = require('./pptService');
            return PPTService.generatePPT(lessonData);
        }

        const systemPrompt = `你是一位资深的教学设计师和PPT视觉设计专家，专门为课堂教学设计高质量的演示文稿。

你的核心任务：从教案中提取适合课堂展示的内容，生成PPT幻灯片结构。每个幻灯片都应该像课堂上实际使用的投影课件一样——内容详实、重点突出、适合学生观看。

【设计原则】
1. 这是学生在课堂上看到的投影课件，不是教师的教案！
2. 呈现学生需要掌握的知识内容，每个知识点要详细展开
3. 每页幻灯片标题简短有力（不超过15个字）
4. 每页内容要充实详细，使用要点式呈现（每页4-8个要点，每个要点可以包含详细说明，50-80字）
5. 核心知识点要深入讲解，包括定义、原理、例子、应用等方面
6. 案例要具体完整，包含背景、过程、结论
7. 适当使用对比、分类、流程等方式组织内容
8. 每个知识点都要体现"是什么-为什么-怎么用"的完整逻辑

【严格禁止】以下内容绝对不能作为独立的幻灯片页面出现：
- 禁止出现"教学目标"页面
- 禁止出现"教学重点"或"教学难点"页面
- 禁止出现"教学方法"页面
- 禁止出现"教师活动"或"学生活动"页面
- 禁止出现"教学准备"页面
- 禁止出现"课后作业"页面
- 禁止出现"教学反思"页面
这些信息仅供你设计内容时参考，你应该将它们转化为具体的课堂展示内容。例如：将"教学目标"转化为具体的知识点讲解页面，将"教学重点"转化为详细的内容页。

【幻灯片类型】
- cover: 封面页（课程标题+年级学科）
- content: 内容页（核心知识点、关键概念、重要公式等）
- example: 案例页（典型例题、关键案例、实际应用）
- thinking: 思考页（思考题、讨论题、探究问题）
- summary: 总结页（知识框架、要点回顾、思维导图式总结）
- practice: 练习页（课堂练习、即时检测）
- end: 结束页（谢谢/思考延伸）

请用严格的JSON格式返回，包含以下结构：
{
  "slides": [
    {
      "type": "cover|content|example|thinking|summary|practice|end",
      "title": "幻灯片标题（简短有力）",
      "points": ["要点1", "要点2", ...],
      "notes": "演讲者备注（教师课堂引导语或讲解思路）",
      "imageKeywords": "用于搜索配图的英文关键词（2-3个词，如 organic chemistry molecular）"
    }
  ]
}

【图片关键词要求】
- 每个页面的imageKeywords字段用于自动搜索配图
- 使用英文关键词，2-3个词，简洁准确
- cover页：使用学科相关的主题图片关键词（如 chemistry laboratory）
- content/example页：使用与知识点相关的具体图片关键词
- thinking页：使用引发思考的图片关键词（如 question thinking）
- summary/practice/end页：可以留空字符串""
- 关键词要与该页内容高度相关

【重要提醒】
- slides数组中的第一个元素必须是type为"cover"的封面页
- 最后一个元素必须是type为"end"的结束页
- 每个页面的points数组中，每个要点要精炼、适合投影展示
- 每个页面必须包含imageKeywords字段
- 只输出JSON，不要输出任何其他文字`;

        const userPrompt = `请根据以下${subject}（${grade}）教案，设计一份课堂展示PPT：

【课程信息】
- 课题：${title}
- 学科：${subject}
- 年级：${grade}

${goals.length > 0 ? `【教学目标】\n${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : ''}

${points.length > 0 ? `【教学重难点】\n${points.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

${process.introduction ? `【课堂导入】\n${process.introduction}` : ''}
${process.mainContent ? `【新课讲授】\n${process.mainContent}` : ''}
${process.practice ? `【巩固练习】\n${process.practice}` : ''}
${process.summary ? `【课堂总结】\n${process.summary}` : ''}
${assignList ? `【课后作业】\n${assignList}` : ''}
${summaryText ? `【教学总结】\n${summaryText}` : ''}

【设计要求】
1. 提取教案中的核心知识点，每个知识点要详细展开讲解（包括定义、原理、特点、应用场景等）
2. 不要包含教学方法、教师活动、学生活动等教学设计信息
3. 关键概念和公式要突出展示，附带详细解释
4. 如果有典型案例，要单独成页展示，包含完整的分析过程
5. 设计1-2个引导思考的问题页
6. 总结页要用清晰的结构回顾本节课核心内容
7. 内容要充实，每个幻灯片的知识点要有深度，不要只列标题
8. 确保PPT内容足够详细，学生仅通过PPT就能理解本节课的核心知识`;

        try {
            console.log('🤖 正在调用AI设计PPT内容...');
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('AI生成PPT超时')), AI_CONFIG.timeout);
            });

            // PPT生成：优先使用火山引擎模型，失败自动切换到智谱模型
            let aiResponse = null;
            let lastAIError = null;

            // 优先尝试火山引擎
            if (this.isVolcEngineAvailable()) {
                try {
                    console.log('🌋 优先使用火山引擎生成PPT...');
                    aiResponse = await Promise.race([
                        this.callAPI(systemPrompt, userPrompt, { ...options, provider: 'volcengine' }),
                        timeoutPromise
                    ]);
                } catch (err) {
                    lastAIError = err;
                    console.warn(`⚠️ 火山引擎调用失败: ${err.message}，尝试切换到智谱模型...`);
                }
            }

            // 火山引擎失败或不可用时，切换到智谱模型
            if (!aiResponse && this.isZhipuAvailable()) {
                try {
                    console.log('🔄 使用智谱模型作为备用生成PPT...');
                    // 重新创建超时Promise（避免上次已reject）
                    const timeoutPromise2 = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('AI生成PPT超时')), AI_CONFIG.timeout);
                    });
                    aiResponse = await Promise.race([
                        this.callAPI(systemPrompt, userPrompt, { ...options, provider: 'zhipu' }),
                        timeoutPromise2
                    ]);
                } catch (err) {
                    lastAIError = err;
                    console.warn(`⚠️ 智谱模型调用也失败: ${err.message}`);
                }
            }

            // 如果两个AI模型都失败，抛出错误（外层catch会回退到模板）
            if (!aiResponse) {
                throw lastAIError || new Error('所有AI模型均不可用');
            }

            console.log('✅ AI返回PPT设计结果');

            // 解析AI返回的JSON
            let pptDesign;
            try {
                // 尝试直接解析JSON
                pptDesign = JSON.parse(aiResponse);
            } catch {
                // 尝试从文本中提取JSON
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    pptDesign = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('AI返回的内容无法解析为JSON');
                }
            }

            if (!pptDesign.slides || !Array.isArray(pptDesign.slides) || pptDesign.slides.length === 0) {
                throw new Error('AI返回的PPT结构无效');
            }

            // 将AI设计的slides转换为系统PPT格式
            const pages = pptDesign.slides.map((slide, index) => {
                const page = {
                    type: slide.type || 'content',
                    title: slide.title || `页面 ${index + 1}`,
                    content: {},
                    notes: slide.notes || '',
                    pageNumber: index + 1,
                    imageKeywords: slide.imageKeywords || '',
                    imageUrl: null
                };

                switch (slide.type) {
                    case 'cover':
                        page.layout = 'cover';
                        page.content = {
                            mainTitle: title || slide.title,
                            subtitle: `${grade} - ${subject}`,
                            school: '',
                            date: new Date().toLocaleDateString('zh-CN'),
                            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                            fullDateTime: new Date().toLocaleString('zh-CN')
                        };
                        break;
                    case 'end':
                        page.layout = 'end';
                        page.content = {
                            mainText: '感谢聆听',
                            subText: '欢迎交流讨论'
                        };
                        break;
                    case 'content':
                    case 'example':
                    case 'thinking':
                    case 'summary':
                    case 'practice':
                    default:
                        page.layout = slide.type;
                        page.content = {
                            items: (slide.points || []).map((point, i) => ({
                                number: i + 1,
                                text: point
                            })),
                            layout: 'list'
                        };
                        break;
                }

                return page;
            });

            const pptData = {
                title,
                subject,
                grade,
                templateStyle: 'ai',
                pages,
                pageCount: pages.length,
                generatedByAI: true,
                aiProvider: this.getCurrentProvider(),
                createdAt: new Date().toISOString()
            };

            console.log(`📊 AI生成PPT完成: ${pages.length} 页，开始搜索配图...`);

            // 自动搜索配图
            try {
                const ImageSearchService = require('./imageSearchService');
                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i];
                    if (page.imageKeywords && page.imageKeywords.trim()) {
                        try {
                            const images = await ImageSearchService.searchImages(page.imageKeywords, 1);
                            if (images.length > 0) {
                                page.imageUrl = images[0].url;
                                console.log(`🖼️ 第${i + 1}页配图: ${page.imageKeywords} → ${images[0].url.substring(0, 60)}...`);
                            }
                        } catch (imgErr) {
                            console.warn(`⚠️ 第${i + 1}页配图搜索失败: ${imgErr.message}`);
                        }
                    }
                }
                console.log('✅ 配图搜索完成');
            } catch (imgServiceError) {
                console.warn(`⚠️ 图片搜索服务异常: ${imgServiceError.message}`);
            }

            return pptData;

        } catch (error) {
            console.error(`❌ AI生成PPT失败: ${error.message}`);
            console.log('📋 回退到模板生成PPT...');
            
            // AI失败时回退到模板生成
            const PPTService = require('./pptService');
            const fallbackData = PPTService.generatePPT(lessonData);
            fallbackData.generatedByAI = false;
            fallbackData.fallbackReason = error.message;
            return fallbackData;
        }
    }

    /**
     * 解析JSON字符串
     */
    static parseJSON(str, defaultValue) {
        if (Array.isArray(str)) return str;
        if (typeof str === 'object' && str !== null) return str;
        if (typeof str === 'string') {
            try {
                return JSON.parse(str);
            } catch {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    /**
     * 获取默认PPT结构（备用方案）
     */
    static getDefaultPPT(title, subject, grade, teachingGoals, keyPoints, teachingProcess, assignments, summary) {
        const goals = this.parseJSON(teachingGoals, []);
        const points = this.parseJSON(keyPoints, []);
        const process = this.parseJSON(teachingProcess, {});
        const assignList = typeof assignments === 'string' ? assignments : (assignments || '');
        const summaryText = typeof summary === 'string' ? summary : (summary || '');

        const pages = [];
        let pageNumber = 1;

        // 封面页
        pages.push({
            pageNumber: pageNumber++,
            title: title || '教案PPT',
            content: [`${grade} - ${subject}`, new Date().toLocaleDateString('zh-CN')],
            notes: '封面页展示课程基本信息'
        });

        // 目录页
        pages.push({
            pageNumber: pageNumber++,
            title: '目录',
            content: ['1. 教学目标', '2. 教学重难点', '3. 课堂导入', '4. 新课讲授', '5. 巩固练习', '6. 课堂总结', '7. 课后作业'],
            notes: '本页展示课程大纲'
        });

        // 教学目标页
        if (goals.length > 0) {
            pages.push({
                pageNumber: pageNumber++,
                title: '教学目标',
                content: goals.slice(0, 5),
                notes: '引导学生明确本节课学习目标'
            });
        }

        // 教学重难点页
        if (points.length > 0) {
            pages.push({
                pageNumber: pageNumber++,
                title: '教学重难点',
                content: points.slice(0, 5),
                notes: '明确本节课的重点和难点内容'
            });
        }

        // 课堂导入页
        if (process.introduction) {
            pages.push({
                pageNumber: pageNumber++,
                title: '课堂导入',
                content: [process.introduction],
                notes: '通过有趣的方式引入本节课内容'
            });
        }

        // 新课讲授页
        if (process.mainContent) {
            pages.push({
                pageNumber: pageNumber++,
                title: '新课讲授',
                content: [process.mainContent],
                notes: '详细讲解本节课的核心内容'
            });
        }

        // 巩固练习页
        if (process.practice) {
            pages.push({
                pageNumber: pageNumber++,
                title: '巩固练习',
                content: [process.practice],
                notes: '通过练习巩固所学知识'
            });
        }

        // 课堂总结页
        if (process.summary) {
            pages.push({
                pageNumber: pageNumber++,
                title: '课堂总结',
                content: [process.summary],
                notes: '总结本节课的重点内容'
            });
        } else if (summaryText) {
            pages.push({
                pageNumber: pageNumber++,
                title: '课堂总结',
                content: [summaryText],
                notes: '总结本节课的重点内容'
            });
        }

        // 课后作业页
        if (assignList) {
            pages.push({
                pageNumber: pageNumber++,
                title: '课后作业',
                content: [assignList],
                notes: '布置课后作业，加强练习'
            });
        }

        // 结束页
        pages.push({
            pageNumber: pageNumber++,
            title: '谢谢观看',
            content: ['感谢聆听', title || '课程结束'],
            notes: '结束页'
        });

        return {
            title: title || '教案PPT',
            subject,
            grade,
            pages,
            pageCount: pages.length,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * 从文本中解析教案
     */
    static parseLessonFromText(text) {
        const result = {
            teachingGoals: [],
            keyPoints: [],
            teachingProcess: {},
            assignments: '',
            summary: ''
        };

        const goalMatch = text.match(/教学目标[\s\S]*?(?=教学重难点|教学过程|作业|总结|$)/);
        if (goalMatch) {
            const goals = goalMatch[0].split(/\n\d+\./).filter(g => g.trim());
            result.teachingGoals = goals.map(g => g.trim()).slice(0, 5);
        }

        const keyMatch = text.match(/教学重难点[\s\S]*?(?=教学目标|教学过程|作业|总结|$)/);
        if (keyMatch) {
            const points = keyMatch[0].split(/\n\d+\./).filter(p => p.trim());
            result.keyPoints = points.map(p => p.trim()).slice(0, 5);
        }

        const processMatch = text.match(/教学过程[\s\S]*?(?=教学目标|教学重难点|作业|总结|$)/);
        if (processMatch) {
            result.teachingProcess = {
                introduction: '',
                mainContent: processMatch[0].substring(4).trim().substring(0, 500) + '...',
                practice: '',
                summary: ''
            };
        }

        const assignMatch = text.match(/作业[\s\S]*?(?=教学目标|教学重难点|教学过程|总结|$)/);
        if (assignMatch) {
            result.assignments = assignMatch[0].substring(2).trim();
        }

        const summaryMatch = text.match(/总结[\s\S]*$/);
        if (summaryMatch) {
            result.summary = summaryMatch[0].substring(2).trim();
        }

        return result;
    }

    /**
     * 获取模拟教案数据
     */
    static getMockLesson(subject, grade, topic) {
        return {
            teachingGoals: [
                `知识与技能：理解${topic}的基本概念和定义，掌握${topic}的核心原理和应用方法`,
                `过程与方法：通过观察、实验、讨论等方式，培养学生探究${topic}的能力`,
                `情感态度与价值观：激发学生对${subject}学科的兴趣，培养科学探究精神`,
                `能力目标：能够运用${topic}知识解决实际问题`,
                `思维目标：培养学生的逻辑思维和创新思维能力`
            ],
            keyPoints: [
                `重点：${topic}的定义、性质和基本应用`,
                `重点：${topic}与相关知识的联系与区别`,
                `难点：${topic}的深层原理和复杂应用`,
                `难点：如何引导学生理解${topic}的抽象概念`
            ],
            teachingProcess: {
                introduction: `【导入环节】[5分钟]\n通过生活中的${topic}实例引入，展示相关图片或视频，提问："同学们，你们在生活中见过${topic}吗？它有什么特点？"引导学生思考，激发学习兴趣。`,
                mainContent: `【新课讲授】[25分钟]\n1. 讲解${topic}的定义：详细阐述${topic}的概念，结合具体例子帮助理解。\n2. 分析${topic}的性质：逐一介绍${topic}的主要性质，通过例题演示应用方法。\n3. 探究${topic}的应用：展示${topic}在实际生活和学习中的应用场景。\n4. 师生互动：通过提问、小组讨论等方式加深理解。`,
                practice: `【巩固练习】[10分钟]\n1. 基础练习：课本练习题1-5题\n2. 拓展练习：思考${topic}在生活中的实际应用\n3. 小组活动：分组讨论${topic}的特点和应用`,
                summary: `【课堂小结】[5分钟]\n引导学生回顾本节课内容，总结${topic}的重点知识，强调学习要点。`
            },
            assignments: `【课后作业】\n1. 完成课本PXX页习题1-10\n2. 思考：${topic}在生活中有哪些应用？举例说明\n3. 预习下节课内容`,
            summary: `【教学反思】\n本节课通过生活实例引入，激发了学生的学习兴趣。教学过程中注重师生互动，学生参与度较高。但部分学生对${topic}的抽象概念理解有困难，需要在后续教学中加强直观演示和实例讲解。`
        };
    }

    /**
     * 获取模拟教学材料
     */
    static getMockTeachingMaterial(type, topic) {
        const materials = {
            '导入': `[课堂导入设计 - ${topic}]\n\n【导入方式】情境导入\n【导入时间】3-5分钟\n\n【导入过程】\n1. 播放相关视频/图片，引起学生兴趣\n2. 提出问题："同学们，你们见过这种现象吗？"`,
            '目标': `[教学目标设计 - ${topic}]\n\n【知识目标】\n1. 理解${topic}的基本概念\n2. 掌握${topic}的核心原理\n\n【能力目标】\n1. 能够运用${topic}解决实际问题\n2. 培养分析和归纳能力`,
            '提问': `[课堂提问设计 - ${topic}]\n\n【基础问题】\n1. ${topic}的定义是什么？\n2. ${topic}的基本特征有哪些？\n\n【深层次问题】\n1. ${topic}与之前学过的知识有什么联系？\n2. 如何将${topic}应用到实际生活中？`,
            '练习': `[课堂练习设计 - ${topic}]\n\n【选择题】(2题)\n1. 下列关于${topic}的说法正确的是...\n2. ${topic}的主要特点是...\n\n【填空题】(3题)\n1. ${topic}的第一要素是___。`,
            '反思': `[教学反思设计 - ${topic}]\n\n1. 本节课中，哪些教学设计最能激发学生的学习兴趣？\n2. 学生对${topic}的哪些内容最感兴趣？`
        };

        return materials[type] || `这是${topic}的${type}内容（模拟数据）`;
    }
}

module.exports = AIService;