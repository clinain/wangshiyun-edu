/**
 * 教案路由
 * 处理教案的CRUD操作
 */

const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { auth, optionalAuth } = require('../middleware/auth');

// 公开路由（不需要认证）
router.get('/public', optionalAuth, lessonController.getPublicLessons);

// 获取支持的学段和学科列表
router.get('/subjects', lessonController.getAvailableSubjects);

// 教案生成（学科感知版本，支持全学段）
router.post('/generate-aware', auth, lessonController.generateSubjectAwareLesson);

// 教案生成（原有版本）
router.post('/generate', auth, lessonController.generateByAI);  // generate 要在 :id 前面

// 需要认证的路由
router.post('/', auth, lessonController.createLesson);
router.post('/check-title', auth, lessonController.checkTitleExists);
router.get('/', auth, lessonController.getLessonList);
router.get('/:id', optionalAuth, lessonController.getLessonDetail);
router.put('/:id', auth, lessonController.updateLesson);
router.delete('/:id', auth, lessonController.deleteLesson);
router.get('/:id/export', auth, lessonController.exportLesson);

module.exports = router;
