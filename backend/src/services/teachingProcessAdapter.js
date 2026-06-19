// backend/src/services/teachingProcessAdapter.js

/**
 * TeachingProcessAdapter - 统一处理教案中 teachingProcess 的多种数据格式
 * 
 * 支持两种输入格式：
 * 1. 结构化JSON格式：{ introduction, mainContent, practice, summary }
 * 2. 纯文本格式：直接是一段描述教学过程的文本
 */
class TeachingProcessAdapter {
  /**
   * 标准化教学过程数据
   * @param {string|object} rawData - 原始教学过程数据
   * @returns {object} 标准化后的教学过程对象 { introduction, mainContent, practice, summary }
   */
  /**
   * 确保值为字符串类型
   * @param {*} value - 任意值
   * @returns {string} 字符串结果
   * @private
   */
  static _ensureString(value) {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  static normalize(rawData) {
    // 默认结构
    const defaultResult = {
      introduction: '',
      mainContent: '',
      practice: '',
      summary: ''
    };

    if (!rawData) {
      return defaultResult;
    }

    // 如果已经是对象，直接处理
    let data = rawData;
    if (typeof rawData === 'string') {
      // 尝试 JSON.parse
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        // JSON 解析失败，视为纯文本
        return this._extractFromPlainText(rawData);
      }
    }

    // 如果解析后是对象且包含标准字段，直接返回
    if (typeof data === 'object' && data !== null) {
      if (this._hasStandardFields(data)) {
        return {
          introduction: this._ensureString(data.introduction || ''),
          mainContent: this._ensureString(data.mainContent || ''),
          practice: this._ensureString(data.practice || ''),
          summary: this._ensureString(data.summary || '')
        };
      }

      // 对象存在但字段名不完全匹配，尝试模糊匹配
      const fuzzyMatched = this._fuzzyMatchFields(data);
      if (fuzzyMatched) {
        return fuzzyMatched;
      }

      // 无法匹配，将对象序列化后作为纯文本处理
      const textContent = typeof data === 'string' ? data : JSON.stringify(data);
      return this._extractFromPlainText(textContent);
    }

    return defaultResult;
  }

  /**
   * 转换为可读文本（用于AI Prompt）
   * @param {object} normalizedData - 标准化后的教学过程对象
   * @returns {string} 格式化的文本
   */
  static toDisplayText(normalizedData) {
    if (!normalizedData || typeof normalizedData !== 'object') {
      return '';
    }

    const sections = this.getSectionInfo();
    const parts = [];

    for (const section of sections) {
      const content = normalizedData[section.key];
      if (content && content.trim()) {
        parts.push(`【${section.name}】\n${content.trim()}`);
      }
    }

    return parts.length > 0 ? parts.join('\n\n') : '';
  }

  /**
   * 获取教学环节信息
   * @returns {Array} 环节信息数组
   */
  static getSectionInfo() {
    return [
      { key: 'introduction', name: '课堂导入', description: '创设情境，引入新课', suggestedPages: '1-2页' },
      { key: 'mainContent', name: '新课讲授', description: '讲解知识点，案例分析', suggestedPages: '4-8页' },
      { key: 'practice', name: '巩固练习', description: '练习题，即时检测', suggestedPages: '1-3页' },
      { key: 'summary', name: '课堂总结', description: '知识框架，要点回顾', suggestedPages: '1-2页' }
    ];
  }

  /**
   * 检查对象是否包含标准字段
   * @param {object} data - 待检查的对象
   * @returns {boolean}
   * @private
   */
  static _hasStandardFields(data) {
    const keys = Object.keys(data);
    // 至少包含 mainContent 字段，或者同时包含其他标准字段中的任意两个
    if (keys.includes('mainContent')) {
      return true;
    }
    const standardKeys = ['introduction', 'mainContent', 'practice', 'summary'];
    const matchCount = standardKeys.filter(k => keys.includes(k)).length;
    return matchCount >= 2;
  }

  /**
   * 模糊匹配字段名
   * @param {object} data - 待匹配的对象
   * @returns {object|null} 匹配后的标准对象，或 null
   * @private
   */
  static _fuzzyMatchFields(data) {
    const keys = Object.keys(data);

    // 字段名映射表：常见别名 -> 标准字段名
    const fieldAliases = {
      introduction: ['导入', '课堂导入', '导入环节', '引言', 'intro', 'leadIn', 'lead_in', 'open'],
      mainContent: ['新课讲授', '讲授', '正文', '主要内容', '新授', '讲授环节', 'main', 'main_content', 'body', 'lecture'],
      practice: ['巩固练习', '练习', '巩固', '练习环节', '训练', 'exercise', 'practice', 'drill'],
      summary: ['课堂总结', '总结', '小结', '总结环节', '归纳', 'conclusion', 'summary', 'wrapUp', 'wrap_up']
    };

    const result = {};
    let matchedCount = 0;

    for (const [standardKey, aliases] of Object.entries(fieldAliases)) {
      // 精确匹配
      if (data[standardKey] !== undefined) {
        result[standardKey] = this._ensureString(data[standardKey]);
        matchedCount++;
        continue;
      }

      // 别名匹配
      const matchedAlias = aliases.find(alias =>
        keys.some(k => k === alias || k.toLowerCase() === alias.toLowerCase())
      );

      if (matchedAlias) {
        const actualKey = keys.find(k => k === matchedAlias || k.toLowerCase() === matchedAlias.toLowerCase());
        result[standardKey] = this._ensureString(data[actualKey]);
        matchedCount++;
      }
    }

    // 至少匹配到2个字段才认为有效
    if (matchedCount >= 2) {
      return {
        introduction: this._ensureString(result.introduction || ''),
        mainContent: this._ensureString(result.mainContent || ''),
        practice: this._ensureString(result.practice || ''),
        summary: this._ensureString(result.summary || '')
      };
    }

    return null;
  }

  /**
   * 从纯文本中提取各教学环节内容
   * @param {string} text - 纯文本内容
   * @returns {object} 标准化后的教学过程对象
   * @private
   */
  static _extractFromPlainText(text) {
    if (!text || typeof text !== 'string') {
      return {
        introduction: '',
        mainContent: '',
        practice: '',
        summary: ''
      };
    }

    const trimmedText = text.trim();

    // 定义各环节的关键词模式
    const sectionPatterns = {
      introduction: [
        /【导入[环节]?】[\s：:]*([\s\S]*?)(?=【|$)/,
        /(?:一[、.．]\s*)?[导入引][入\s]*[新课\s]*(?:环节|部分|内容)?[\s：:]*([\s\S]*?)(?=二[、.．]|【|$)/,
        /^(?:导入|引入|引言|创设情境)[\s：:]*([\s\S]*?)(?=(?:讲授|新课|新授)|【|$)/,
        /课堂导入[\s：:]*([\s\S]*?)(?=新课讲授|【|$)/
      ],
      mainContent: [
        /【新课讲授】[\s：:]*([\s\S]*?)(?=【|$)/,
        /【讲授[环节]?】[\s：:]*([\s\S]*?)(?=【|$)/,
        /(?:二[、.．]\s*)?(?:新课|新授|讲授)[\s：:]*([\s\S]*?)(?=三[、.．]|【巩固|【练习|【|$)/,
        /新课讲授[\s：:]*([\s\S]*?)(?=巩固练习|课堂总结|【|$)/
      ],
      practice: [
        /【巩固练习】[\s：:]*([\s\S]*?)(?=【|$)/,
        /【练习[环节]?】[\s：:]*([\s\S]*?)(?=【|$)/,
        /(?:三[、.．]\s*)?(?:巩固|练习|训练)[\s：:]*([\s\S]*?)(?=四[、.．]|【总结|【|$)/,
        /巩固练习[\s：:]*([\s\S]*?)(?=课堂总结|【|$)/
      ],
      summary: [
        /【课堂总结】[\s：:]*([\s\S]*?)(?=【|$)/,
        /【总结[环节]?】[\s：:]*([\s\S]*?)(?=【|$)/,
        /(?:四[、.．]\s*)?(?:总结|小结|归纳)[\s：:]*([\s\S]*?)(?=【|$)/,
        /课堂总结[\s：:]*([\s\S]*?)(?=$)/
      ]
    };

    const result = {
      introduction: '',
      mainContent: '',
      practice: '',
      summary: ''
    };

    for (const [sectionKey, patterns] of Object.entries(sectionPatterns)) {
      for (const pattern of patterns) {
        const match = trimmedText.match(pattern);
        if (match && match[1] && match[1].trim()) {
          result[sectionKey] = match[1].trim();
          break;
        }
      }
    }

    // 如果没有提取到任何环节内容，将全文放入 mainContent
    const hasContent = Object.values(result).some(v => v.length > 0);
    if (!hasContent) {
      result.mainContent = trimmedText;
    }

    return result;
  }
}

module.exports = TeachingProcessAdapter;
