/**
 * 新课标知识库服务
 * 基于JSON数据文件提供知识库查询功能
 */

const fs = require('fs');
const path = require('path');

class KnowledgeBaseService {
    constructor() {
        this.knowledgeBaseDir = path.join(__dirname, '../../data/knowledge-base');
        this.index = null;
        this.subjects = {};
        this.loaded = false;
    }

    /**
     * 加载知识库数据
     */
    load() {
        try {
            // 加载索引文件
            const indexPath = path.join(this.knowledgeBaseDir, 'index.json');
            if (fs.existsSync(indexPath)) {
                this.index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            }

            // 加载各学科数据文件
            if (this.index && this.index.subjects) {
                for (const subject of this.index.subjects) {
                    const filePath = path.join(this.knowledgeBaseDir, `${subject.id}.json`);
                    if (fs.existsSync(filePath)) {
                        this.subjects[subject.id] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    }
                }
            }

            this.loaded = true;
            console.log(`📚 新课标知识库已加载，共 ${Object.keys(this.subjects).length} 个学科`);
        } catch (error) {
            console.error('❌ 知识库加载失败:', error.message);
            this.loaded = false;
        }
    }

    /**
     * 获取知识库索引（学科列表）
     */
    getIndex() {
        if (!this.loaded) this.load();
        return this.index;
    }

    /**
     * 获取所有学科列表
     */
    getAllSubjects() {
        if (!this.loaded) this.load();
        if (!this.index) return [];
        return this.index.subjects || [];
    }

    /**
     * 根据学科ID获取学科详情
     */
    getSubjectById(id) {
        if (!this.loaded) this.load();
        return this.subjects[id] || null;
    }

    /**
     * 根据学科名称搜索
     */
    getSubjectByName(name) {
        if (!this.loaded) this.load();
        for (const [id, subject] of Object.entries(this.subjects)) {
            if (subject.name === name || subject.fullName === name) {
                return subject;
            }
        }
        // 也从索引中搜索
        if (this.index && this.index.subjects) {
            const found = this.index.subjects.find(s => s.name === name);
            if (found && this.subjects[found.id]) {
                return this.subjects[found.id];
            }
        }
        return null;
    }

    /**
     * 按分类获取学科列表
     */
    getSubjectsByCategory(category) {
        if (!this.loaded) this.load();
        if (!this.index) return [];
        return this.index.subjects.filter(s => s.category === category);
    }

    /**
     * 获取所有分类
     */
    getCategories() {
        if (!this.loaded) this.load();
        if (!this.index) return [];
        return this.index.categories || [];
    }

    /**
     * 搜索知识库（全文搜索）
     */
    search(keyword) {
        if (!this.loaded) this.load();
        if (!keyword || keyword.trim() === '') return [];

        const results = [];
        const keywordLower = keyword.toLowerCase();

        for (const [id, subject] of Object.entries(this.subjects)) {
            const matchedSections = [];

            // 搜索sections
            if (subject.sections) {
                for (const section of subject.sections) {
                    const titleMatch = section.title && section.title.toLowerCase().includes(keywordLower);
                    const contentMatch = section.content && section.content.toLowerCase().includes(keywordLower);
                    const keywordMatch = section.keywords && section.keywords.some(k => k.toLowerCase().includes(keywordLower));

                    if (titleMatch || contentMatch || keywordMatch) {
                        matchedSections.push({
                            ...section,
                            matchType: titleMatch ? 'title' : (keywordMatch ? 'keyword' : 'content')
                        });
                    }
                }
            }

            // 搜索核心素养
            if (subject.coreCompetencies && subject.coreCompetencies.items) {
                const matchedCompetencies = subject.coreCompetencies.items.filter(item => {
                    return (item.name && item.name.toLowerCase().includes(keywordLower)) ||
                           (item.description && item.description.toLowerCase().includes(keywordLower));
                });
                if (matchedCompetencies.length > 0) {
                    matchedSections.push({
                        id: 'core-competencies',
                        title: subject.coreCompetencies.title,
                        content: matchedCompetencies.map(c => `${c.name}：${c.description}`).join('\n'),
                        matchType: 'competency'
                    });
                }
            }

            if (matchedSections.length > 0) {
                results.push({
                    id: subject.id,
                    name: subject.name,
                    fullName: subject.fullName,
                    category: subject.category,
                    matchedSections
                });
            }
        }

        return results;
    }

    /**
     * 获取学科的某个特定章节
     */
    getSection(subjectId, sectionId) {
        const subject = this.getSubjectById(subjectId);
        if (!subject || !subject.sections) return null;
        return subject.sections.find(s => s.id === sectionId) || null;
    }

    /**
     * 获取学科的核心素养详情
     */
    getCoreCompetencies(subjectId) {
        const subject = this.getSubjectById(subjectId);
        if (!subject) return null;
        return subject.coreCompetencies || null;
    }

    /**
     * 获取跨学科的核心素养概览
     */
    getCoreCompetenciesOverview() {
        if (!this.loaded) this.load();
        const overview = [];

        for (const [id, subject] of Object.entries(this.subjects)) {
            if (subject.coreCompetencies) {
                overview.push({
                    subjectId: id,
                    subjectName: subject.name,
                    category: subject.category,
                    coreCompetencies: subject.coreCompetencies
                });
            }
        }

        return overview;
    }

    /**
     * 获取统计数据
     */
    getStats() {
        if (!this.loaded) this.load();
        const stats = {
            totalSubjects: Object.keys(this.subjects).length,
            totalSections: 0,
            totalKeywords: 0,
            categories: {},
            pdfFiles: []
        };

        for (const [id, subject] of Object.entries(this.subjects)) {
            if (subject.sections) {
                stats.totalSections += subject.sections.length;
                for (const section of subject.sections) {
                    if (section.keywords) {
                        stats.totalKeywords += section.keywords.length;
                    }
                }
            }
            if (subject.category) {
                stats.categories[subject.category] = (stats.categories[subject.category] || 0) + 1;
            }
            if (subject.pdfFile) {
                stats.pdfFiles.push({
                    name: subject.fullName,
                    file: subject.pdfFile
                });
            }
        }

        return stats;
    }
}

// 创建单例
const knowledgeBaseService = new KnowledgeBaseService();

module.exports = knowledgeBaseService;
