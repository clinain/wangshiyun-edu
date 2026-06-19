/**
 * 智谱AI API 配置文件
 * 
 * 配置智谱GLM-4-Flash API的连接参数和默认设置
 * 支持自定义模型参数、温度设置等
 */

const axios = require('axios');

const ZHIPU_API_URL = process.env.ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';
const ZHIPU_MODEL = process.env.ZHIPU_MODEL || 'glm-4-flash';

const aiConfig = {
  apiUrl: ZHIPU_API_URL,
  apiKey: ZHIPU_API_KEY,
  model: ZHIPU_MODEL,
  maxTokens: parseInt(process.env.ZHIPU_MAX_TOKENS) || 2000,
  temperature: parseFloat(process.env.ZHIPU_TEMPERATURE) || 0.7,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0
};

const zhipuClient = axios.create({
  baseURL: ZHIPU_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZHIPU_API_KEY}`
  },
  timeout: 300000  // 超时时间300秒（5分钟），AI生成详细PPT内容（含图片搜索）需要90-215秒
});

const generateChatCompletion = async (messages, options = {}) => {
  if (!ZHIPU_API_KEY) {
    throw new Error('智谱API密钥未配置');
  }

  try {
    const response = await zhipuClient.post('', {
      model: options.model || aiConfig.model,
      messages: messages,
      max_tokens: options.maxTokens || aiConfig.maxTokens,
      temperature: options.temperature ?? aiConfig.temperature,
      top_p: options.topP || aiConfig.topP,
      frequency_penalty: options.frequencyPenalty || aiConfig.frequencyPenalty,
      presence_penalty: options.presencePenalty || aiConfig.presencePenalty,
      stream: options.stream || false
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('智谱API错误:', error.response.status, error.response.data);
      throw new Error(`AI服务错误: ${error.response.data.error?.message || '未知错误'}`);
    } else if (error.request) {
      console.error('智谱API请求失败:', error.message);
      throw new Error('AI服务请求失败，请稍后重试');
    } else {
      throw error;
    }
  }
};

const generateLessonPlan = async (topic, grade, subject) => {
  const systemPrompt = `你是一位经验丰富的教育专家，擅长帮助教师设计优质的课程计划。
请根据提供的信息，生成一份详细、规范的教案。
教案应该包含：教学目标、教学重难点、教学过程（导入、新课讲授、巩固练习、总结作业）等部分。
回复格式要求清晰、有条理，使用Markdown格式。`;

  const userPrompt = `请为${subject}学科设计一份教案：
- 教学主题：${topic}
- 年级：${grade}
- 请确保教案符合新课程标准要求，教学过程生动有趣`;

  return generateChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);
};

const generateTeachingMaterial = async (topic, contentType) => {
  const systemPrompt = `你是一位专业的教育内容创作者，擅长根据教学主题生成各种教学材料。
可以生成的材料类型包括：教学导入案例、课堂提问设计、学生练习题、课后作业、教学反思等。
请确保内容专业、准确、适合教育教学使用。`;

  const userPrompt = `请为"${topic}"生成${contentType}内容，要求专业、实用、适合教学使用。`;

  return generateChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);
};

const analyzeStudentAnswer = async (question, studentAnswer) => {
  const systemPrompt = `你是一位资深教师，擅长评价和分析学生的答题情况。
请从准确性、完整性、思路清晰度等角度评价学生的答案。
回复应该包含：评分、优点分析、不足之处、改进建议。`;

  const userPrompt = `题目：${question}
学生答案：${studentAnswer}
请评价这个学生的答题情况。`;

  return generateChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]);
};

const getAIConfig = () => ({
  ...aiConfig,
  isConfigured: !!ZHIPU_API_KEY
});

const updateAIConfig = (newConfig) => {
  Object.assign(aiConfig, newConfig);
  return aiConfig;
};

module.exports = {
  aiConfig,
  zhipuClient,
  generateChatCompletion,
  generateLessonPlan,
  generateTeachingMaterial,
  analyzeStudentAnswer,
  getAIConfig,
  updateAIConfig
};
