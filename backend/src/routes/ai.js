/**
 * AI智能助手路由
 * 提供教案生成、教学材料生成、学生答题分析、模型切换等功能
 */

const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');
const { auth } = require('../middleware/auth');

router.use(auth);

/**
 * 获取AI服务状态和配置信息
 */
router.get('/status', (req, res) => {
  const serviceInfo = AIService.getServiceInfo();
  
  res.json({
    success: true,
    message: '获取AI配置状态成功',
    data: {
      currentProvider: serviceInfo.currentProvider,
      currentProviderInfo: serviceInfo.currentProviderInfo,
      availableProviders: serviceInfo.availableProviders,
      allProviders: serviceInfo.allProviders,
      status: serviceInfo.status
    }
  });
});

/**
 * 获取所有可用的AI提供商列表
 */
router.get('/providers', (req, res) => {
  const providers = AIService.getProviders();
  
  res.json({
    success: true,
    message: '获取AI提供商列表成功',
    data: providers
  });
});

/**
 * 切换AI提供商（运行时切换）
 */
router.post('/switch-provider', (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({
        success: false,
        message: '请提供要切换的提供商ID'
      });
    }

    const success = AIService.setPrimaryProvider(provider);
    
    if (success) {
      const serviceInfo = AIService.getServiceInfo();
      res.json({
        success: true,
        message: `已成功切换到${provider}`,
        data: {
          currentProvider: serviceInfo.currentProvider,
          currentProviderInfo: serviceInfo.currentProviderInfo
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: '无效的提供商ID'
      });
    }
  } catch (error) {
    console.error('切换AI提供商错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '切换提供商失败'
    });
  }
});

/**
 * 测试AI服务连通性
 */
router.post('/test', async (req, res) => {
  try {
    const { provider } = req.body;
    
    const systemPrompt = '你是一个AI助手，只需要回答"测试成功"即可。';
    const userPrompt = '请回复"测试成功"';
    
    const result = await AIService.callAPI(systemPrompt, userPrompt, { 
      provider: provider,
      enableFailover: false
    });
    
    res.json({
      success: true,
      message: 'AI服务测试成功',
      data: {
        provider: provider || AIService.getCurrentProvider(),
        response: result
      }
    });
  } catch (error) {
    console.error('AI服务测试错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI服务测试失败'
    });
  }
});

/**
 * 测试所有可用的AI提供商
 */
router.post('/test-all', async (req, res) => {
  try {
    const providers = AIService.getAvailableProviders();
    const results = [];
    
    const systemPrompt = '你是一个AI助手，只需要回答"OK"即可。';
    const userPrompt = '请回复"OK"';
    
    for (const provider of providers) {
      try {
        const result = await AIService.callAPI(systemPrompt, userPrompt, { 
          provider: provider,
          enableFailover: false
        });
        
        results.push({
          provider: provider,
          success: true,
          response: result.substring(0, 50) + (result.length > 50 ? '...' : '')
        });
      } catch (error) {
        results.push({
          provider: provider,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: '测试完成',
      data: results
    });
  } catch (error) {
    console.error('测试所有AI提供商错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '测试失败'
    });
  }
});

/**
 * AI聊天对话
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages, options } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的对话消息'
      });
    }

    // 提取system和user消息
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '你是一位有帮助的助手。';
    const userMessages = messages.filter(m => m.role !== 'system');
    const userPrompt = userMessages.map(m => m.content).join('\n');

    const result = await AIService.callAPI(systemPrompt, userPrompt, options);
    
    res.json({
      success: true,
      message: 'AI回复成功',
      data: {
        content: result,
        provider: AIService.getCurrentProvider()
      }
    });
  } catch (error) {
    console.error('AI对话错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI服务调用失败'
    });
  }
});

/**
 * 生成教案
 */
router.post('/lesson-plan', async (req, res) => {
  try {
    const { topic, grade, subject, options } = req.body;
    
    if (!topic || !grade || !subject) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的教案生成参数（topic, grade, subject）'
      });
    }

    const result = await AIService.generateLesson(subject, grade, topic, options);
    
    res.json({
      success: true,
      message: '教案生成成功',
      data: result
    });
  } catch (error) {
    console.error('教案生成错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '教案生成失败'
    });
  }
});

/**
 * 生成教学材料
 */
router.post('/teaching-material', async (req, res) => {
  try {
    const { topic, contentType, options } = req.body;
    
    if (!topic || !contentType) {
      return res.status(400).json({
        success: false,
        message: '请提供教学材料类型和主题'
      });
    }

    const validTypes = ['导入', '目标', '提问', '练习', '反思'];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `contentType必须是以下之一: ${validTypes.join(', ')}`
      });
    }

    const result = await AIService.getMockTeachingMaterial(contentType, topic);
    
    res.json({
      success: true,
      message: '教学材料生成成功',
      data: result
    });
  } catch (error) {
    console.error('教学材料生成错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '教学材料生成失败'
    });
  }
});

/**
 * 答题分析
 */
router.post('/analyze-answer', async (req, res) => {
  try {
    const { question, studentAnswer, options } = req.body;
    
    if (!question || !studentAnswer) {
      return res.status(400).json({
        success: false,
        message: '请提供题目和学生答案'
      });
    }

    const systemPrompt = '你是一位教育专家，擅长分析学生答题情况。请分析以下学生答案，指出正确与否，给出正确答案，并提供改进建议。';
    const userPrompt = `题目：${question}\n学生答案：${studentAnswer}\n请分析这个答案，给出评价和建议。`;
    
    const result = await AIService.callAPI(systemPrompt, userPrompt, options);
    
    res.json({
      success: true,
      message: '答题分析完成',
      data: {
        analysis: result,
        provider: AIService.getCurrentProvider()
      }
    });
  } catch (error) {
    console.error('答题分析错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '答题分析失败'
    });
  }
});

/**
 * 批量生成教学材料
 */
router.post('/batch-generate', async (req, res) => {
  try {
    const { topic, subject, grade, materials, options } = req.body;
    
    if (!topic || !materials || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        message: '请提供主题和材料类型列表'
      });
    }

    const results = [];
    for (const materialType of materials) {
      try {
        const result = await AIService.getMockTeachingMaterial(materialType, topic);
        results.push({
          type: materialType,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          type: materialType,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: '批量生成完成',
      data: results
    });
  } catch (error) {
    console.error('批量生成错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '批量生成失败'
    });
  }
});

module.exports = router;
