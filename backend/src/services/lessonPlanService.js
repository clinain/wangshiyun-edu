/**
 * 全学段学科感知教案生成服务
 * 根据学科特点、学段特征和年级要求生成个性化教案
 */

const { getSubjectConfig, getStageByGrade, subjectsConfig } = require('../config/subjectsConfig');
const { generateChatCompletion, aiConfig } = require('../config/aiConfig');

const LESSON_PLAN_PROMPT_TEMPLATE = `你是一位经验丰富的教育专家，精通各学科教学。请根据提供的信息，生成一份详细的教案。

## 基本要求
1. 教案输出格式为JSON
2. 教案内容要符合新课程标准要求
3. 要体现学科核心素养
4. 教学过程要生动有趣，注重师生互动

## 教案JSON结构
{
  "basicInfo": {
    "title": "教案标题",
    "subject": "学科",
    "grade": "年级",
    "teachingType": "授课类型（新授课/复习课/习题课等）",
    "duration": "课时时长（如45分钟）"
  },
  "teachingObjectives": {
    "knowledge": ["知识与技能目标列表"],
    "ability": ["过程与方法目标列表"],
    "emotion": ["情感态度与价值观目标列表"]
  },
  "teachingKeyPoints": {
    "key": ["教学重点"],
    "difficult": ["教学难点"]
  },
  "teachingPreparation": ["教学准备，如PPT、教具、实验材料等"],
  "teachingProcess": {
    "introduction": {
      "duration": "导入时长",
      "activities": ["导入环节的具体活动"]
    },
    "newTeaching": {
      "duration": "新授时长",
      "stages": [
        {
          "stageName": "环节名称",
          "duration": "环节时长",
          "teacherActivities": ["教师活动"],
          "studentActivities": ["学生活动"],
          "teachingPoints": ["教学要点"],
          "timeAllocation": "时间分配"
        }
      ]
    },
    "practice": {
      "duration": "练习时长",
      "activities": ["练习活动的具体内容"]
    },
    "summary": {
      "duration": "总结时长",
      "activities": ["总结环节的活动"]
    }
  },
  "teachingReflection": {
    "expectedHighlights": ["预期教学亮点"],
    "possibleProblems": ["可能出现的问题"],
    "suggestions": ["教学建议"]
  },
  "homework": ["作业内容"]
}

## 输出要求
1. 只输出JSON格式的教案，不要包含其他解释性文字
2. JSON必须符合上述结构，可以根据学科特点适当调整内容
3. 确保教案内容专业、准确、可操作`;

const generateSubjectAwarePrompt = (topic, grade, subject, additionalRequirements = {}) => {
  // 首先尝试用年级名称查找
  let stage = getStageByGrade(grade);
  
  // 如果没找到，尝试用常见年级名称变体
  if (!stage) {
    // 常见的年级名称映射
    const gradeMappings = {
      '一年级': 'primary',
      '二年级': 'primary',
      '三年级': 'primary',
      '四年级': 'primary',
      '五年级': 'primary',
      '六年级': 'primary',
      '初一': 'middle',
      '初二': 'middle',
      '初三': 'middle',
      '七年级': 'middle',
      '八年级': 'middle',
      '九年级': 'middle',
      '高一': 'high',
      '高二': 'high',
      '高三': 'high'
    };
    
    stage = gradeMappings[grade];
    if (!stage) {
      // 尝试提取数字
      const gradeNum = typeof grade === 'string' ? parseInt(grade.replace(/[^0-9]/g, '')) : grade;
      if (gradeNum >= 1 && gradeNum <= 6) stage = 'primary';
      else if (gradeNum >= 7 && gradeNum <= 9) stage = 'middle';
      else if (gradeNum >= 10 && gradeNum <= 12) stage = 'high';
      else stage = 'middle'; // 默认初中
    }
  }

  let subjectConfig = getSubjectConfig(subject, stage);

  if (!subjectConfig) {
    console.log(`未找到 ${stage} 阶段的 ${subject} 配置，尝试其他阶段...`);
    // 尝试其他阶段查找
    const stages = ['middle', 'primary', 'high'];
    for (const tryStage of stages) {
      if (tryStage !== stage) {
        const config = getSubjectConfig(subject, tryStage);
        if (config) {
          console.log(`在 ${tryStage} 阶段找到 ${subject} 配置，使用该配置`);
          subjectConfig = config;
          stage = tryStage;
          break;
        }
      }
    }
    if (!subjectConfig) {
      throw new Error(`未找到学科配置：${subject}（${grade}）`);
    }
  }

  let prompt = `请为${subject}学科设计一份教案。

## 学科信息
- 学科：${subject}
- 学段：${stage === 'primary' ? '小学' : stage === 'middle' ? '初中' : '高中'}
- 年级：${grade}
- 教学主题：${topic}

## 学科核心素养要求
${subjectConfig.coreQualities.map(q => `- ${q}`).join('\n')}

## 本学科教学特点
- 类别：${subjectConfig.category}
- 关键词：${subjectConfig.keywords.join('、')}

## 教学目标参考
### 知识与技能
${subjectConfig.teachingObjectives.knowledge.map((k, i) => `${i + 1}. ${k}`).join('\n')}

### 过程与方法
${subjectConfig.teachingObjectives.ability.map((a, i) => `${i + 1}. ${a}`).join('\n')}

### 情感态度与价值观
${subjectConfig.teachingObjectives.emotion.map((e, i) => `${i + 1}. ${e}`).join('\n')}

## 教学过程参考
### 导入环节
${subjectConfig.teachingProcess.introduction.map((t, i) => `${i + 1}. ${t}`).join('\n')}

### 新课讲授
${subjectConfig.teachingProcess.newTeaching.map((t, i) => `${i + 1}. ${t}`).join('\n')}

### 练习环节
${subjectConfig.teachingProcess.practice.map((p, i) => `${i + 1}. ${p}`).join('\n')}

### 总结环节
${subjectConfig.teachingProcess.summary.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 评价方式
${subjectConfig.assessment.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

  if (additionalRequirements.chapter) {
    prompt += `\n\n## 章节信息\n${additionalRequirements.chapter}`;
  }

  if (additionalRequirements.teachingHours) {
    prompt += `\n\n## 课时安排\n本课建议用${additionalRequirements.teachingHours}课时完成`;
  }

  if (additionalRequirements.studentLevel) {
    prompt += `\n\n## 学生水平\n${additionalRequirements.studentLevel}`;
  }

  if (additionalRequirements.customRequirements) {
    prompt += `\n\n## 自定义要求\n${additionalRequirements.customRequirements}`;
  }

  return prompt;
};

const parseJSONResponse = (text) => {
  let jsonStr = text.trim();

  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  // 尝试直接解析
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.log('首次JSON解析失败，尝试修复...');
  }

  // 修复常见JSON格式问题
  try {
    // 1. 移除行尾的JavaScript注释
    jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
    
    // 2. 移除尾部逗号（数组和对象末尾的多余逗号）
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
    
    // 3. 在缺少逗号的地方添加逗号
    // 匹配：值结尾（字符串、数字、布尔、null、]、}）后紧跟换行和属性名
    jsonStr = jsonStr.replace(/("(?:[^"\\]|\\.)*"|true|false|null|\d+(?:\.\d+)?|\]|})\s*\n\s*("(?:[^"\\]|\\.)*")/g, '$1,\n$2');
    
    return JSON.parse(jsonStr);
  } catch (error2) {
    console.log('标准修复失败，尝试截断修复...');
  }

  // 尝试修复截断的JSON（AI返回被max_tokens截断的情况）
  try {
    // 移除最后不完整的字符串值
    // 匹配未闭合的字符串：以 " 开头但没有结尾 "
    jsonStr = jsonStr.replace(/:\s*"[^"]*$/, ':""');
    // 匹配数组中未闭合的字符串
    jsonStr = jsonStr.replace(/\[\s*"[^"]*$/, '[""]');
    jsonStr = jsonStr.replace(/,\s*"[^"]*$/, ',""');
    
    // 逐层闭合未关闭的括号和数组
    let openBraces = 0, openBrackets = 0;
    let inString = false, escaped = false;
    for (let i = 0; i < jsonStr.length; i++) {
      const ch = jsonStr[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openBraces++;
      else if (ch === '}') openBraces--;
      else if (ch === '[') openBrackets++;
      else if (ch === ']') openBrackets--;
    }
    
    // 闭合剩余的数组和对象
    while (openBrackets > 0) { jsonStr += ']'; openBrackets--; }
    while (openBraces > 0) { jsonStr += '}'; openBraces--; }
    
    // 再次清理尾部逗号
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
    
    return JSON.parse(jsonStr);
  } catch (error3) {
    console.error('截断修复后解析仍然失败:', error3.message);
    console.log('原始响应:', text.substring(0, 500));
    throw new Error('教案格式解析失败');
  }
};

const generateLessonPlan = async (topic, grade, subject, options = {}) => {
  try {
    const prompt = generateSubjectAwarePrompt(topic, grade, subject, options);

    const systemPrompt = LESSON_PLAN_PROMPT_TEMPLATE;

    const response = await generateChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.7,
      maxTokens: 8000
    });

    const assistantMessage = response.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('AI未返回有效响应');
    }

    const lessonPlan = parseJSONResponse(assistantMessage);

    return {
      success: true,
      data: {
        ...lessonPlan,
        metadata: {
          generatedAt: new Date().toISOString(),
          subject,
          grade,
          topic,
          stage: getStageByGrade(grade),
          model: aiConfig.model
        }
      }
    };
  } catch (error) {
    console.error('教案生成失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const generateLessonPlanBatch = async (topics, grade, subject, options = {}) => {
  const results = [];

  for (const topic of topics) {
    const result = await generateLessonPlan(topic, grade, subject, options);
    results.push({
      topic,
      ...result
    });

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
};

const getSubjectsList = (stage) => {
  const stageConfig = subjectsConfig[stage];
  if (!stageConfig) return [];

  return Object.entries(stageConfig.subjects).map(([name, config]) => ({
    name,
    category: config.category,
    keywords: config.keywords
  }));
};

const validateLessonPlan = (lessonPlan) => {
  const required = ['basicInfo', 'teachingObjectives', 'teachingKeyPoints', 'teachingProcess'];

  for (const field of required) {
    if (!lessonPlan[field]) {
      return { valid: false, missing: field };
    }
  }

  return { valid: true };
};

module.exports = {
  generateLessonPlan,
  generateLessonPlanBatch,
  getSubjectsList,
  validateLessonPlan,
  generateSubjectAwarePrompt
};
