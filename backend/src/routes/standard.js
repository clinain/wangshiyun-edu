/**
 * 新课标智能检测API路由
 * 依据：义务教育课程标准（2022年版）、普通高中课程标准（2017年版2020年修订）
 */

const express = require('express');
const router = express.Router();
const curriculumStandardService = require('../services/curriculumStandardService');
const subjectsConfig = require('../config/subjectsConfig');
const curriculumStandards = require('../config/curriculumStandards');

/**
 * 检测教案
 * POST /api/standard/analyze
 */
router.post('/analyze', async (req, res) => {
    try {
        const {
            title,
            subject,
            grade,
            teachingGoals,
            keyPoints,
            teachingProcess,
            homework,
            summary
        } = req.body;

        if (!subject) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供学科信息'
            });
        }

        const lessonPlan = {
            title: title || '',
            subject,
            grade: grade || '',
            teachingGoals: teachingGoals || '',
            keyPoints: keyPoints || '',
            teachingProcess: teachingProcess || '',
            homework: homework || '',
            summary: summary || ''
        };

        const result = curriculumStandardService.analyze(lessonPlan);

        res.json({
            success: true,
            code: 200,
            message: '检测完成',
            data: result
        });

    } catch (error) {
        console.error('新课标检测错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '检测失败: ' + error.message
        });
    }
});

/**
 * 根据学科和年级查询新课标内容
 * GET /api/standard/curriculum?subject=语文&grade=一年级
 */
router.get('/curriculum', async (req, res) => {
    try {
        const { subject, grade } = req.query;

        if (!subject) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供学科信息'
            });
        }

        // 确定学段
        let stage = 'primary';
        const middleGrades = ['七年级', '八年级', '九年级', '初一', '初二', '初三'];
        const highGrades = ['高一', '高二', '高三'];
        
        if (grade) {
            if (middleGrades.includes(grade)) {
                stage = 'middle';
            } else if (highGrades.includes(grade)) {
                stage = 'high';
            }
        }

        // 从 subjectsConfig 中获取对应学科配置
        const stageConfig = subjectsConfig[stage];
        if (!stageConfig || !stageConfig.subjects[subject]) {
            return res.json({
                success: true,
                code: 200,
                data: null,
                message: `未找到「${subject}」在${stage === 'primary' ? '小学' : stage === 'middle' ? '初中' : '高中'}阶段的新课标配置`
            });
        }

        const subjectData = stageConfig.subjects[subject];

        // 获取核心素养信息
        const coreQualities = curriculumStandards.dimensions.coreQualities.subjects[subject] || null;

        // 获取检测维度中的相关建议
        const suggestions = curriculumStandards.suggestions || {};

        res.json({
            success: true,
            code: 200,
            data: {
                subject,
                grade: grade || '未指定',
                stage: stage === 'primary' ? '小学' : stage === 'middle' ? '初中' : '高中',
                category: subjectData.category || '',
                keywords: subjectData.keywords || [],
                coreQualities: subjectData.coreQualities || [],
                coreQualityDetails: coreQualities ? {
                    keywords: coreQualities.keywords || [],
                    description: coreQualities.description || ''
                } : null,
                teachingObjectives: subjectData.teachingObjectives || {
                    knowledge: [],
                    ability: [],
                    emotion: []
                },
                teachingProcess: subjectData.teachingProcess || {
                    introduction: [],
                    newTeaching: [],
                    practice: [],
                    summary: []
                },
                assessment: subjectData.assessment || [],
                suggestions: {
                    teachingObjectives: suggestions.teachingObjectives || [],
                    teachingContent: suggestions.teachingContent || [],
                    teachingProcess: suggestions.teachingProcess || [],
                    coreQualities: suggestions.coreQualities || []
                }
            }
        });

    } catch (error) {
        console.error('查询新课标内容错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '查询失败: ' + error.message
        });
    }
});

/**
 * 获取支持的学科列表
 * GET /api/standard/subjects
 */
router.get('/subjects', async (req, res) => {
    try {
        const subjects = curriculumStandardService.getSupportedSubjects();

        res.json({
            success: true,
            code: 200,
            data: subjects
        });

    } catch (error) {
        console.error('获取学科列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学科列表失败: ' + error.message
        });
    }
});

/**
 * 获取学段信息
 * GET /api/standard/grades
 */
router.get('/grades', async (req, res) => {
    try {
        const grades = curriculumStandardService.getGradeLevels();

        res.json({
            success: true,
            code: 200,
            data: grades
        });

    } catch (error) {
        console.error('获取学段信息错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学段信息失败: ' + error.message
        });
    }
});

/**
 * 获取检测维度信息
 * GET /api/standard/dimensions
 */
router.get('/dimensions', async (req, res) => {
    try {
        const dimensions = curriculumStandardService.getDimensions();

        res.json({
            success: true,
            code: 200,
            data: dimensions
        });

    } catch (error) {
        console.error('获取检测维度错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取检测维度失败: ' + error.message
        });
    }
});

/**
 * 批量检测教案
 * POST /api/standard/batch-analyze
 */
router.post('/batch-analyze', async (req, res) => {
    try {
        const { lessonPlans } = req.body;

        if (!Array.isArray(lessonPlans) || lessonPlans.length === 0) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供有效的教案列表'
            });
        }

        if (lessonPlans.length > 20) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '单次批量检测最多支持20份教案'
            });
        }

        const results = lessonPlans.map((plan, index) => {
            try {
                const result = curriculumStandardService.analyze(plan);
                return {
                    index,
                    success: true,
                    data: result
                };
            } catch (error) {
                return {
                    index,
                    success: false,
                    error: error.message
                };
            }
        });

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            code: 200,
            message: `检测完成，成功${successCount}份，失败${results.length - successCount}份`,
            data: {
                total: results.length,
                successCount,
                failureCount: results.length - successCount,
                results
            }
        });

    } catch (error) {
        console.error('批量检测错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '批量检测失败: ' + error.message
        });
    }
});

module.exports = router;