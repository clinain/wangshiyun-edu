/**
 * 新课标智能检测服务
 * 依据：义务教育课程标准（2022年版）、普通高中课程标准（2017年版2020年修订）
 */

const curriculumStandards = require('../config/curriculumStandards');
const subjectsConfig = require('../config/subjectsConfig');

class CurriculumStandardService {
  /**
   * 检测教案是否符合新课标要求
   * @param {Object} lessonPlan - 教案内容
   * @returns {Object} 检测结果
   */
  static analyze(lessonPlan) {
    const {
      title = '',
      subject = '',
      grade = '',
      teachingGoals = '',
      keyPoints = '',
      teachingProcess = '',
      homework = '',
      summary = ''
    } = lessonPlan;

    const content = `${title} ${teachingGoals} ${keyPoints} ${teachingProcess} ${homework} ${summary}`;

    const result = {
      totalScore: 0,
      totalMaxScore: 100,
      level: '',
      dimensions: {},
      missingItems: [],
      excellentItems: [],
      suggestions: [],
      subject,
      grade,
      analyzedAt: new Date().toISOString()
    };

    const teachingObjectivesResult = this.analyzeTeachingObjectives(content, teachingGoals);
    result.dimensions.teachingObjectives = teachingObjectivesResult;
    result.totalScore += this.calculateDimensionScore(teachingObjectivesResult);

    const contentAnalysis = this.analyzeTeachingContent(content, teachingProcess, keyPoints);
    result.dimensions.teachingContent = contentAnalysis;
    result.totalScore += this.calculateDimensionScore(contentAnalysis);

    const processAnalysis = this.analyzeTeachingProcess(content, teachingProcess);
    result.dimensions.teachingProcess = processAnalysis;
    result.totalScore += this.calculateDimensionScore(processAnalysis);

    const qualityAnalysis = this.analyzeCoreQualities(content, subject, teachingGoals, keyPoints);
    result.dimensions.coreQualities = qualityAnalysis;
    result.totalScore += this.calculateDimensionScore(qualityAnalysis);

    const academicAnalysis = this.analyzeAcademicQuality(content, teachingGoals, summary);
    result.dimensions.academicQuality = academicAnalysis;
    result.totalScore += this.calculateDimensionScore(academicAnalysis);

    const evaluationAnalysis = this.analyzeEvaluationSuggestions(content, teachingProcess);
    result.dimensions.evaluationSuggestions = evaluationAnalysis;
    result.totalScore += this.calculateDimensionScore(evaluationAnalysis);

    result.level = this.getLevel(result.totalScore);
    result.missingItems = this.getMissingItems(result.dimensions);
    result.excellentItems = this.getExcellentItems(content, result.dimensions);
    result.suggestions = this.generateSuggestions(result.dimensions, subject);

    return result;
  }

  /**
   * 分析教学目标维度
   */
  static analyzeTeachingObjectives(content, teachingGoals) {
    const dimension = curriculumStandards.dimensions.teachingObjectives;
    const subDimensions = {};

    const knowledgeAnalysis = this.analyzeSubDimension(content, teachingGoals, dimension.subDimensions.knowledge);
    subDimensions.knowledge = knowledgeAnalysis;

    const processAnalysis = this.analyzeSubDimension(content, teachingGoals, dimension.subDimensions.process);
    subDimensions.process = processAnalysis;

    const emotionAnalysis = this.analyzeSubDimension(content, teachingGoals, dimension.subDimensions.emotion);
    subDimensions.emotion = emotionAnalysis;

    return {
      name: dimension.name,
      weight: dimension.weight,
      score: this.calculateSubDimensionsScore(subDimensions),
      maxScore: dimension.weight,
      subDimensions: subDimensions
    };
  }

  /**
   * 分析教学内容维度
   */
  static analyzeTeachingContent(content, teachingProcess, keyPoints) {
    const dimension = curriculumStandards.dimensions.teachingContent;
    const subDimensions = {};

    const coverageAnalysis = this.analyzeSubDimension(content, keyPoints, dimension.subDimensions.coverage);
    subDimensions.coverage = coverageAnalysis;

    const depthAnalysis = this.analyzeSubDimension(content, teachingProcess, dimension.subDimensions.depth);
    subDimensions.depth = depthAnalysis;

    return {
      name: dimension.name,
      weight: dimension.weight,
      score: this.calculateSubDimensionsScore(subDimensions),
      maxScore: dimension.weight,
      subDimensions: subDimensions
    };
  }

  /**
   * 分析教学过程维度
   */
  static analyzeTeachingProcess(content, teachingProcess) {
    const dimension = curriculumStandards.dimensions.teachingProcess;
    const subDimensions = {};

    const completenessAnalysis = this.analyzeSubDimension(content, teachingProcess, dimension.subDimensions.completeness);
    subDimensions.completeness = completenessAnalysis;

    if (dimension.subDimensions.interactivity) {
      const interactivityAnalysis = this.analyzeSubDimension(content, teachingProcess, dimension.subDimensions.interactivity);
      subDimensions.interactivity = interactivityAnalysis;
    }

    if (dimension.subDimensions.innovation) {
      const innovationAnalysis = this.analyzeSubDimension(content, teachingProcess, dimension.subDimensions.innovation);
      subDimensions.innovation = innovationAnalysis;
    }

    return {
      name: dimension.name,
      weight: dimension.weight,
      score: this.calculateSubDimensionsScore(subDimensions),
      maxScore: dimension.weight,
      subDimensions: subDimensions
    };
  }

  /**
   * 分析核心素养维度
   */
  static analyzeCoreQualities(content, subject, teachingGoals, keyPoints) {
    const dimension = curriculumStandards.dimensions.coreQualities;
    const subjectConfig = dimension.subjects[subject] || dimension.subjects['科学'];

    const keywords = subjectConfig.keywords || [];
    let matchedKeywords = [];
    let score = 0;
    const maxScore = dimension.weight;

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const fullContent = (content + teachingGoals + keyPoints).toLowerCase();
      if (fullContent.includes(keywordLower)) {
        score += Math.round(maxScore / keywords.length);
        matchedKeywords.push({
          keyword,
          matched: true
        });
      } else {
        matchedKeywords.push({
          keyword,
          matched: false
        });
      }
    });

    return {
      name: dimension.name,
      weight: dimension.weight,
      score: Math.min(score, maxScore),
      maxScore: maxScore,
      matchedKeywords,
      subjectSpecific: subjectConfig.description || subjectConfig.name
    };
  }

  /**
   * 分析学业质量维度
   */
  static analyzeAcademicQuality(content, teachingGoals, summary) {
    const dimension = curriculumStandards.dimensions.academicQuality;
    const analysis = this.analyzeSubDimension(content, teachingGoals + summary, {
      name: dimension.name,
      weight: dimension.weight,
      criteria: dimension.criteria
    });

    return {
      name: dimension.name,
      weight: dimension.weight,
      score: analysis.score,
      maxScore: dimension.weight,
      details: analysis.details
    };
  }

  /**
   * 分析评价建议维度
   */
  static analyzeEvaluationSuggestions(content, teachingProcess) {
    const dimension = curriculumStandards.dimensions.evaluationSuggestions;
    const subDimensions = {};

    const analysis = this.analyzeSubDimension(content, teachingProcess, {
      name: dimension.name,
      weight: dimension.weight,
      criteria: dimension.criteria
    });

    return {
      name: dimension.name,
      weight: dimension.weight,
      score: analysis.score,
      maxScore: dimension.weight,
      details: analysis.details
    };
  }

  /**
   * 分析子维度
   */
  static analyzeSubDimension(fullContent, specificContent, config) {
    const details = [];
    let score = 0;

    config.criteria.forEach(criterion => {
      const contentToCheck = specificContent || fullContent;
      const keywords = [criterion.keyword, ...(criterion.alternativeKeywords || [])];
      const matched = this.containsAnyKeyword(contentToCheck, keywords);

      if (matched) {
        score += criterion.score;
        details.push({
          criterion: criterion.keyword,
          description: criterion.description,
          score: criterion.score,
          matched: true
        });
      } else {
        details.push({
          criterion: criterion.keyword,
          description: criterion.description,
          score: 0,
          matched: false
        });
      }
    });

    return {
      name: config.name,
      weight: config.weight,
      score,
      maxScore: config.weight,
      details
    };
  }

  /**
   * 计算子维度总分
   */
  static calculateSubDimensionsScore(subDimensions) {
    let totalScore = 0;
    for (const key in subDimensions) {
      totalScore += subDimensions[key].score || 0;
    }
    return totalScore;
  }

  /**
   * 计算维度得分
   */
  static calculateDimensionScore(dimension) {
    return dimension.score || 0;
  }

  /**
   * 检查内容是否包含关键词
   */
  static containsAnyKeyword(content, keywords) {
    if (!content || !keywords || keywords.length === 0) {
      return false;
    }

    const lowerContent = content.toLowerCase();

    for (const keyword of keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取评级
   */
  static getLevel(score) {
    const rules = curriculumStandards.scoringRules;
    if (score >= rules.excellentThreshold) {
      return { grade: '优秀', color: '#52c41a', description: '教案符合新课标要求，质量很高' };
    } else if (score >= rules.goodThreshold) {
      return { grade: '良好', color: '#1890ff', description: '教案符合新课标要求，可以进一步优化' };
    } else if (score >= rules.passThreshold) {
      return { grade: '合格', color: '#faad14', description: '教案基本符合新课标要求，需要改进' };
    } else {
      return { grade: '不合格', color: '#ff4d4f', description: '教案不符合新课标要求，需要重新设计' };
    }
  }

  /**
   * 获取缺失项
   */
  static getMissingItems(dimensions) {
    const missingItems = [];

    for (const dimKey in dimensions) {
      const dimension = dimensions[dimKey];

      if (dimension.subDimensions) {
        for (const subKey in dimension.subDimensions) {
          const subDim = dimension.subDimensions[subKey];
          subDim.details?.forEach(detail => {
            if (!detail.matched) {
              missingItems.push({
                dimension: dimension.name,
                subDimension: subDim.name,
                item: detail.criterion,
                description: detail.description,
                suggestedScore: detail.score
              });
            }
          });
        }
      }

      if (dimension.details) {
        dimension.details.forEach(detail => {
          if (!detail.matched) {
            missingItems.push({
              dimension: dimension.name,
              subDimension: dimension.name,
              item: detail.criterion,
              description: detail.description,
              suggestedScore: detail.score
            });
          }
        });
      }

      if (dimension.matchedKeywords) {
        dimension.matchedKeywords.forEach(keyword => {
          if (!keyword.matched) {
            missingItems.push({
              dimension: dimension.name,
              subDimension: '核心素养',
              item: keyword.keyword,
              description: `建议在教学中体现${keyword.keyword}`,
              suggestedScore: 0
            });
          }
        });
      }
    }

    return missingItems;
  }

  /**
   * 获取优秀项
   */
  static getExcellentItems(content, dimensions) {
    const excellentItems = [];

    for (const dimKey in dimensions) {
      const dimension = dimensions[dimKey];

      if (dimension.subDimensions) {
        for (const subKey in dimension.subDimensions) {
          const subDim = dimension.subDimensions[subKey];
          if (subDim.maxScore > 0) {
            const matchRate = subDim.score / subDim.maxScore;
            if (matchRate >= 0.8) {
              excellentItems.push({
                dimension: dimension.name,
                subDimension: subDim.name,
                item: subDim.name,
                description: `${subDim.name}设计合理，得分率${Math.round(matchRate * 100)}%`
              });
            }
          }
        }
      }

      if (dimension.matchedKeywords) {
        dimension.matchedKeywords.forEach(keyword => {
          if (keyword.matched) {
            excellentItems.push({
              dimension: dimension.name,
              subDimension: '核心素养',
              item: keyword.keyword,
              description: `较好地体现了${keyword.keyword}`
            });
          }
        });
      }

      if (dimension.details) {
        dimension.details.forEach(detail => {
          if (detail.matched && detail.score > 0) {
            excellentItems.push({
              dimension: dimension.name,
              subDimension: dimension.name,
              item: detail.criterion,
              description: `${detail.description}（+${detail.score}分）`
            });
          }
        });
      }
    }

    return excellentItems;
  }

  /**
   * 生成改进建议
   */
  static generateSuggestions(dimensions, subject) {
    const suggestions = [];

    if (dimensions.teachingObjectives && dimensions.teachingObjectives.score < dimensions.teachingObjectives.maxScore * 0.7) {
      suggestions.push(...curriculumStandards.suggestions.teachingObjectives);
    }

    if (dimensions.teachingContent && dimensions.teachingContent.score < dimensions.teachingContent.maxScore * 0.7) {
      suggestions.push(...curriculumStandards.suggestions.teachingContent);
    }

    if (dimensions.teachingProcess && dimensions.teachingProcess.score < dimensions.teachingProcess.maxScore * 0.7) {
      suggestions.push(...curriculumStandards.suggestions.teachingProcess);
    }

    if (dimensions.coreQualities) {
      const qualityMatchCount = dimensions.coreQualities.matchedKeywords?.filter(k => k.matched).length || 0;
      const totalQualities = dimensions.coreQualities.matchedKeywords?.length || 1;
      if (qualityMatchCount < totalQualities * 0.7) {
        suggestions.push(...curriculumStandards.suggestions.coreQualities);
      }
    }

    if (dimensions.academicQuality && dimensions.academicQuality.score < dimensions.academicQuality.maxScore * 0.7) {
      suggestions.push(...curriculumStandards.suggestions.academicQuality);
    }

    if (dimensions.evaluationSuggestions && dimensions.evaluationSuggestions.score < dimensions.evaluationSuggestions.maxScore * 0.7) {
      suggestions.push(...curriculumStandards.suggestions.evaluationSuggestions);
    }

    const uniqueSuggestions = [...new Set(suggestions)];

    return uniqueSuggestions.slice(0, 5);
  }

  /**
   * 获取支持的学科列表
   */
  static getSupportedSubjects() {
    const subjects = [];
    const dimension = curriculumStandards.dimensions.coreQualities;

    for (const subject in dimension.subjects) {
      subjects.push({
        name: subject,
        qualities: dimension.subjects[subject].qualities,
        keywords: dimension.subjects[subject].keywords
      });
    }

    return subjects;
  }

  /**
   * 获取学段信息
   */
  static getGradeLevels() {
    return curriculumStandards.gradeMapping;
  }

  /**
   * 获取检测维度信息
   */
  static getDimensions() {
    const dims = curriculumStandards.dimensions;
    return [
      { key: 'teachingObjectives', name: dims.teachingObjectives.name, weight: dims.teachingObjectives.weight },
      { key: 'teachingContent', name: dims.teachingContent.name, weight: dims.teachingContent.weight },
      { key: 'teachingProcess', name: dims.teachingProcess.name, weight: dims.teachingProcess.weight },
      { key: 'coreQualities', name: dims.coreQualities.name, weight: dims.coreQualities.weight },
      { key: 'academicQuality', name: dims.academicQuality.name, weight: dims.academicQuality.weight },
      { key: 'evaluationSuggestions', name: dims.evaluationSuggestions.name, weight: dims.evaluationSuggestions.weight }
    ];
  }
}

module.exports = CurriculumStandardService;