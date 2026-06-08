/**
 * PPT路由
 * 处理PPT的生成和管理操作
 */

const express = require('express');
const router = express.Router();
const pptController = require('../controllers/pptController');
const { auth } = require('../middleware/auth');

// 所有路由都需要认证
router.use(auth);

// 禁止浏览器缓存PPT API响应
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
});

// 检查PPT标题是否已存在（放在 :id 路由前面）
router.get('/check-title', pptController.checkTitle);

// 生成PPT
router.post('/generate', pptController.generateFromLesson);

// 创建自定义PPT（不需要关联教案）
router.post('/create-custom', pptController.createCustomPPT);

// 同步PPT（根据教案更新或创建）
router.post('/sync', pptController.syncFromLesson);

// 获取PPT列表
router.get('/', pptController.getPPTList);

// 获取PPT详情
router.get('/:id', pptController.getPPTDetail);

// 导出PPT
router.get('/:id/export', pptController.exportPPT);

// 更新PPT
router.put('/:id', pptController.updatePPT);

// 删除PPT
router.delete('/:id', pptController.deletePPT);

module.exports = router;
