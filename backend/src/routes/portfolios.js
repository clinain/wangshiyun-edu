/**
 * 作品集路由
 * 处理作品集的创建、管理和导出
 */

const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { auth, optionalAuth } = require('../middleware/auth');

// 公开路由（无需认证）
router.get('/public', portfolioController.getPublicPortfolios);

// 需要认证的路由 - 注意顺序：具体路由要放在参数路由前面
router.post('/check-name', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;
        const Portfolio = require('../models/Portfolio');
        const result = await Portfolio.findByUserAndName(userId, name);
        res.json({ success: true, data: { exists: !!result, portfolio: result || null } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.post('/', auth, portfolioController.createPortfolio);
router.get('/', auth, portfolioController.getPortfolioList);
router.post('/:id/share', auth, portfolioController.sharePortfolio);
router.post('/:id/favorite', auth, portfolioController.togglePortfolioFavorite);
router.get('/:id/export', auth, portfolioController.exportPortfolio);
router.get('/:id', optionalAuth, portfolioController.getPortfolioDetail);
router.put('/:id', auth, portfolioController.updatePortfolio);
router.delete('/:id', auth, portfolioController.deletePortfolio);

module.exports = router;
