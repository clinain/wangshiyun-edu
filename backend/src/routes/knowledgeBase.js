/**
 * 新课标知识库API路由
 * 提供知识库查询、搜索、学科详情等接口
 */

const express = require('express');
const router = express.Router();
const knowledgeBaseService = require('../services/knowledgeBaseService');

/**
 * 获取知识库概览信息
 * GET /api/knowledge-base
 */
router.get('/', async (req, res) => {
    try {
        const index = knowledgeBaseService.getIndex();
        const stats = knowledgeBaseService.getStats();

        res.json({
            success: true,
            code: 200,
            data: {
                ...index,
                stats
            }
        });
    } catch (error) {
        console.error('获取知识库概览错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取知识库概览失败: ' + error.message
        });
    }
});

/**
 * 获取知识库统计数据
 * GET /api/knowledge-base/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = knowledgeBaseService.getStats();

        res.json({
            success: true,
            code: 200,
            data: stats
        });
    } catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取统计数据失败: ' + error.message
        });
    }
});

/**
 * 获取所有学科列表
 * GET /api/knowledge-base/subjects
 */
router.get('/subjects', async (req, res) => {
    try {
        const { category } = req.query;
        let subjects;

        if (category) {
            subjects = knowledgeBaseService.getSubjectsByCategory(category);
        } else {
            subjects = knowledgeBaseService.getAllSubjects();
        }

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
 * 获取所有分类
 * GET /api/knowledge-base/categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = knowledgeBaseService.getCategories();

        res.json({
            success: true,
            code: 200,
            data: categories
        });
    } catch (error) {
        console.error('获取分类列表错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取分类列表失败: ' + error.message
        });
    }
});

/**
 * 获取学科详情
 * GET /api/knowledge-base/subjects/:id
 */
router.get('/subjects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const subject = knowledgeBaseService.getSubjectById(id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: `未找到学科: ${id}`
            });
        }

        res.json({
            success: true,
            code: 200,
            data: subject
        });
    } catch (error) {
        console.error('获取学科详情错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取学科详情失败: ' + error.message
        });
    }
});

/**
 * 获取学科的某个章节
 * GET /api/knowledge-base/subjects/:subjectId/sections/:sectionId
 */
router.get('/subjects/:subjectId/sections/:sectionId', async (req, res) => {
    try {
        const { subjectId, sectionId } = req.params;
        const section = knowledgeBaseService.getSection(subjectId, sectionId);

        if (!section) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: `未找到章节: ${sectionId}`
            });
        }

        res.json({
            success: true,
            code: 200,
            data: section
        });
    } catch (error) {
        console.error('获取章节详情错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取章节详情失败: ' + error.message
        });
    }
});

/**
 * 获取学科的核心素养详情
 * GET /api/knowledge-base/subjects/:id/competencies
 */
router.get('/subjects/:id/competencies', async (req, res) => {
    try {
        const { id } = req.params;
        const competencies = knowledgeBaseService.getCoreCompetencies(id);

        if (!competencies) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: `未找到学科核心素养: ${id}`
            });
        }

        res.json({
            success: true,
            code: 200,
            data: competencies
        });
    } catch (error) {
        console.error('获取核心素养错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取核心素养失败: ' + error.message
        });
    }
});

/**
 * 获取所有学科的核心素养概览
 * GET /api/knowledge-base/competencies-overview
 */
router.get('/competencies-overview', async (req, res) => {
    try {
        const overview = knowledgeBaseService.getCoreCompetenciesOverview();

        res.json({
            success: true,
            code: 200,
            data: overview
        });
    } catch (error) {
        console.error('获取核心素养概览错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '获取核心素养概览失败: ' + error.message
        });
    }
});

/**
 * 搜索知识库
 * GET /api/knowledge-base/search?keyword=xxx
 */
router.get('/search', async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                code: 400,
                message: '请提供搜索关键词'
            });
        }

        const results = knowledgeBaseService.search(keyword);

        res.json({
            success: true,
            code: 200,
            data: {
                keyword,
                totalResults: results.length,
                results
            }
        });
    } catch (error) {
        console.error('搜索知识库错误:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: '搜索失败: ' + error.message
        });
    }
});

module.exports = router;
