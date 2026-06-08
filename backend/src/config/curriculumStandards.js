/**
 * 新课标智能检测标准配置
 * 依据：义务教育课程标准（2022年版）、普通高中课程标准（2017年版2020年修订）
 */

const curriculumStandards = {
  dimensions: {
    teachingObjectives: {
      name: '教学目标',
      weight: 25,
      subDimensions: {
        knowledge: {
          name: '知识与技能',
          weight: 10,
          criteria: [
            { keyword: '知识目标', score: 2, description: '明确知识学习目标' },
            { keyword: '技能目标', score: 2, description: '明确技能培养目标' },
            { keyword: '层次分明', score: 3, description: '目标体现层次性（了解、理解、掌握）' },
            { keyword: '具体可测', score: 3, description: '目标具体、可观察、可测量' }
          ]
        },
        process: {
          name: '过程与方法',
          weight: 8,
          criteria: [
            { keyword: '过程体验', score: 2, description: '注重学习过程体验' },
            { keyword: '方法指导', score: 2, description: '明确学习方法指导' },
            { keyword: '自主合作', score: 2, description: '体现自主、合作、探究学习' },
            { keyword: '实践应用', score: 2, description: '强调实践与应用能力' }
          ]
        },
        emotion: {
          name: '情感态度',
          weight: 7,
          criteria: [
            { keyword: '情感培养', score: 2, description: '关注情感态度培养' },
            { keyword: '价值观', score: 2, description: '渗透社会主义核心价值观' },
            { keyword: '兴趣习惯', score: 3, description: '培养学习兴趣和良好习惯' }
          ]
        }
      }
    },
    teachingContent: {
      name: '教学内容',
      weight: 20,
      subDimensions: {
        coverage: {
          name: '知识覆盖',
          weight: 10,
          criteria: [
            { keyword: '课程标准', score: 3, description: '符合课程标准要求' },
            { keyword: '教材处理', score: 3, description: '合理处理教材内容' },
            { keyword: '学科特点', score: 2, description: '体现学科本质特点' },
            { keyword: '联系生活', score: 2, description: '联系学生生活实际' }
          ]
        },
        depth: {
          name: '深度适切',
          weight: 10,
          criteria: [
            { keyword: '难度适当', score: 3, description: '符合学生认知水平' },
            { keyword: '深度挖掘', score: 3, description: '有一定思维深度和挑战性' },
            { keyword: '循序渐进', score: 2, description: '由浅入深、层层递进' },
            { keyword: '因材施教', score: 2, description: '关注个体差异' }
          ]
        }
      }
    },
    teachingProcess: {
      name: '教学过程',
      weight: 25,
      subDimensions: {
        completeness: {
          name: '环节完整',
          weight: 12,
          criteria: [
            { keyword: '导入', score: 2, description: '有吸引力的导入设计' },
            { keyword: '新授', score: 3, description: '有新知探究过程' },
            { keyword: '练习', score: 3, description: '有巩固练习环节' },
            { keyword: '小结', score: 2, description: '有课堂小结' },
            { keyword: '作业', score: 2, description: '有课后作业布置' }
          ]
        },
        interactivity: {
          name: '师生互动',
          weight: 8,
          criteria: [
            { keyword: '提问', score: 2, description: '有课堂提问设计' },
            { keyword: '活动', score: 2, description: '有学生活动' },
            { keyword: '反馈', score: 2, description: '有教学反馈' },
            { keyword: '时间', score: 2, description: '时间分配合理' }
          ]
        },
        innovation: {
          name: '教学创新',
          weight: 5,
          criteria: [
            { keyword: '信息技术', score: 2, description: '运用信息技术' },
            { keyword: '创新', score: 2, description: '有创新设计' },
            { keyword: '资源', score: 1, description: '合理利用资源' }
          ]
        }
      }
    },
    coreQualities: {
      name: '核心素养',
      weight: 15,
      subjects: {
        语文: {
          keywords: ['语言建构', '思维发展', '审美鉴赏', '文化传承', '阅读', '写作', '表达'],
          description: '语文学科核心素养'
        },
        数学: {
          keywords: ['数感', '量感', '运算能力', '推理能力', '空间观念', '数据分析', '模型', '创新'],
          description: '数学核心素养'
        },
        英语: {
          keywords: ['语言能力', '文化意识', '思维品质', '学习能力', '交际', '阅读', '表达'],
          description: '英语学科核心素养'
        },
        科学: {
          keywords: ['科学思维', '探究', '观察', '实验', '证据', '逻辑', '模型', '创新'],
          description: '科学核心素养'
        },
        道德与法治: {
          keywords: ['政治认同', '道德修养', '法治观念', '健全人格', '责任', '爱国'],
          description: '道德与法治学科核心素养'
        },
        历史: {
          keywords: ['唯物史观', '时空观念', '史料实证', '历史解释', '家国情怀'],
          description: '历史学科核心素养'
        },
        地理: {
          keywords: ['人地协调', '综合思维', '区域认知', '地理实践', '可持续发展'],
          description: '地理学科核心素养'
        },
        物理: {
          keywords: ['物理观念', '科学思维', '实验探究', '创新意识', '模型', '推理'],
          description: '物理学科核心素养'
        },
        化学: {
          keywords: ['宏观辨识', '微观探析', '变化观念', '模型认知', '实验探究', '创新'],
          description: '化学学科核心素养'
        },
        生物学: {
          keywords: ['生命观念', '科学思维', '探究实践', '社会责任', '结构', '适应'],
          description: '生物学学科核心素养'
        }
      }
    },
    academicQuality: {
      name: '学业质量',
      weight: 10,
      criteria: [
        { keyword: '掌握', score: 2, description: '知识技能掌握' },
        { keyword: '应用', score: 2, description: '知识应用能力' },
        { keyword: '表达', score: 2, description: '表达能力' },
        { keyword: '记录', score: 2, description: '记录整理能力' },
        { keyword: '习惯', score: 2, description: '学习习惯' }
      ]
    },
    evaluationSuggestions: {
      name: '评价建议',
      weight: 5,
      criteria: [
        { keyword: '评价', score: 2, description: '有评价设计' },
        { keyword: '方式', score: 2, description: '有多元评价方式' },
        { keyword: '作业', score: 1, description: '有作业设计' }
      ]
    }
  },
  suggestions: {
    teachingObjectives: [
      '教学目标应体现知识、能力、情感三维目标的整合',
      '目标描述应具体、可观测、可评价',
      '建议使用行为动词描述目标（如：说出、列出、解释等）',
      '目标应基于课程标准和学生实际制定'
    ],
    teachingContent: [
      '教学内容应紧扣课程标准和学科核心素养',
      '适当增加与生活实际的联系',
      '注意深难度适中，符合学生认知水平'
    ],
    teachingProcess: [
      '教学过程应注重师生互动和学生主体参与',
      '增加讨论、探究等开放性活动',
      '时间分配要合理各环节协调'
    ],
    coreQualities: [
      '注重学科核心素养的培养',
      '增加实践活动和探究机会'
    ],
    academicQuality: [
      '明确学业质量标准和达成路径',
      '加强知识运用和实践能力的培养'
    ],
    evaluationSuggestions: [
      '建议增加多元化的评价方式',
      '作业设计应注重实践性和探究性'
    ]
  },
  scoringRules: {
    excellentThreshold: 90,
    goodThreshold: 75,
    passThreshold: 60
  }
};

module.exports = curriculumStandards;