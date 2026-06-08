/**
 * 图片搜索服务
 * 通过 Unsplash API 搜索免费高质量图片
 * 
 * 获取 API Key: https://unsplash.com/developers (免费，50次/小时)
 * 在 .env 中配置 UNSPLASH_ACCESS_KEY
 */

const axios = require('axios');
require('dotenv').config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

class ImageSearchService {
    /**
     * 搜索图片
     * @param {string} keyword 搜索关键词
     * @param {number} count 返回图片数量
     * @returns {Promise<Array>} 图片URL列表
     */
    static async searchImages(keyword, count = 1) {
        if (!UNSPLASH_ACCESS_KEY) {
            console.log('⚠️ Unsplash API Key 未配置，使用占位图');
            return this.getPlaceholderImages(keyword, count);
        }

        try {
            const response = await axios.get(UNSPLASH_API_URL, {
                params: {
                    query: keyword,
                    per_page: count,
                    orientation: 'landscape',
                    client_id: UNSPLASH_ACCESS_KEY
                },
                timeout: 10000
            });

            return (response.data.results || []).map(photo => ({
                url: photo.urls.regular,        // 1080w
                thumb: photo.urls.thumb,        // 200w
                small: photo.urls.small,        // 400w
                description: photo.alt_description || keyword,
                photographer: photo.user?.name || 'Unknown'
            }));
        } catch (error) {
            console.warn(`⚠️ Unsplash搜索失败 (${keyword}): ${error.message}`);
            return this.getPlaceholderImages(keyword, count);
        }
    }

    /**
     * 批量搜索多页图片
     * @param {Array<{keyword: string}>} slides 带关键词的幻灯片数据
     * @returns {Promise<Array>} 每页对应的图片列表
     */
    static async batchSearch(slides) {
        const results = [];
        
        for (const slide of slides) {
            if (slide.imageKeywords && slide.imageKeywords.trim()) {
                try {
                    const images = await this.searchImages(slide.imageKeywords, 1);
                    results.push(images.length > 0 ? images[0] : null);
                } catch {
                    results.push(null);
                }
            } else {
                results.push(null);
            }
        }

        return results;
    }

    /**
     * 获取占位图（Unsplash API 不可用时的备用方案）
     * 使用 picsum.photos 提供随机高质量图片
     */
    static getPlaceholderImages(keyword, count = 1) {
        const images = [];
        // 使用 picsum.photos 作为备用图片源
        for (let i = 0; i < count; i++) {
            const seed = this.hashString(keyword + i);
            images.push({
                url: `https://picsum.photos/seed/${seed}/1080/720`,
                thumb: `https://picsum.photos/seed/${seed}/400/300`,
                small: `https://picsum.photos/seed/${seed}/400/300`,
                description: keyword,
                photographer: 'picsum'
            });
        }
        return images;
    }

    /**
     * 简单字符串哈希（用于生成稳定的占位图URL）
     */
    static hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash).toString(36);
    }
}

module.exports = ImageSearchService;
