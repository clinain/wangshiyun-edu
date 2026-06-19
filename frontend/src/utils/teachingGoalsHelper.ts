import type { TeachingGoalsData, CoreCompetencyDimension } from '@/types';

/**
 * 判断教学目标数据是否为新格式
 */
export const isNewFormat = (data: any): data is TeachingGoalsData => {
  return data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.dimensions);
};

/**
 * 将旧版扁平数组格式转换为新格式
 */
const convertLegacyArray = (arr: any[]): TeachingGoalsData => {
  if (!arr || arr.length === 0) {
    return { version: 2, dimensions: [] };
  }

  const dimensionMap: Record<string, string[]> = {};
  const generalGoals: string[] = [];

  arr.forEach((goal) => {
    const str = typeof goal === 'string' ? goal : String(goal);
    const match = str.match(/^([^：:]+)[：:](.+)/);
    if (match) {
      const dimName = match[1].trim();
      const goalContent = match[2].trim();
      if (!dimensionMap[dimName]) {
        dimensionMap[dimName] = [];
      }
      dimensionMap[dimName].push(goalContent);
    } else {
      generalGoals.push(str);
    }
  });

  const dimensions: CoreCompetencyDimension[] = [];
  for (const [name, goals] of Object.entries(dimensionMap)) {
    dimensions.push({
      id: name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '_'),
      name,
      goals,
    });
  }

  if (generalGoals.length > 0 && dimensions.length === 0) {
    dimensions.push({
      id: 'general',
      name: '教学目标',
      goals: generalGoals,
    });
  } else if (generalGoals.length > 0) {
    dimensions.push({
      id: 'general',
      name: '综合目标',
      goals: generalGoals,
    });
  }

  return { version: 2, dimensions };
};

/**
 * 将旧版 knowledge/ability/emotion 对象格式转换为新格式
 */
const convertLegacyObject = (obj: Record<string, any>): TeachingGoalsData => {
  const dimensions: CoreCompetencyDimension[] = [];
  const mapping: Record<string, { id: string; name: string }> = {
    knowledge: { id: 'knowledge', name: '知识与技能' },
    ability: { id: 'ability', name: '过程与方法' },
    emotion: { id: 'emotion', name: '情感态度与价值观' },
  };

  for (const [key, config] of Object.entries(mapping)) {
    if (obj[key] && Array.isArray(obj[key]) && obj[key].length > 0) {
      dimensions.push({
        id: config.id,
        name: config.name,
        goals: obj[key],
      });
    }
  }

  return { version: 2, dimensions };
};

/**
 * 解析教学目标数据，统一为新格式
 * 支持所有旧格式和新格式的输入
 */
export const parseTeachingGoals = (data: any): TeachingGoalsData => {
  if (!data) return { version: 2, dimensions: [] };

  // 新格式
  if (isNewFormat(data)) return data;

  // 字符串
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return parseTeachingGoals(parsed);
    } catch {
      return {
        version: 2,
        dimensions: [
          {
            id: 'general',
            name: '教学目标',
            goals: data.split('\n').filter((l: string) => l.trim()),
          },
        ],
      };
    }
  }

  // 旧格式数组
  if (Array.isArray(data)) {
    return convertLegacyArray(data);
  }

  // 旧格式对象 knowledge/ability/emotion
  if (data.knowledge || data.ability || data.emotion) {
    return convertLegacyObject(data);
  }

  return { version: 2, dimensions: [] };
};

/**
 * 将新格式教学目标转换为纯文本（每行一条）
 */
export const teachingGoalsToText = (data: any): string => {
  const parsed = parseTeachingGoals(data);
  const lines: string[] = [];
  parsed.dimensions.forEach((dim) => {
    dim.goals.forEach((goal) => {
      lines.push(`${dim.name}：${goal}`);
    });
  });
  return lines.join('\n');
};

/**
 * 将纯文本转换为新格式教学目标
 */
export const textToTeachingGoals = (text: string): TeachingGoalsData => {
  if (!text || !text.trim()) return { version: 2, dimensions: [] };
  const lines = text.split('\n').filter((l) => l.trim());
  return convertLegacyArray(lines);
};
