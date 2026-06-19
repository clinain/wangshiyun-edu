/**
 * PPT 生成服务
 * 将教案数据转换为PPT结构
 * 按照教学过程设计来生成模板化PPT
 */

const TeachingProcessAdapter = require('./teachingProcessAdapter');

class PPTService {
    /**
     * 生成 PPT 结构
     * @param {Object} lessonData 教案数据
     * @param {string} templateStyle 模板风格 (default, modern, academic)
     * @returns {Object} PPT数据
     */
    static generatePPT(lessonData, templateStyle = 'default') {
        const {
            title,
            subject,
            grade,
            teachingGoals,
            keyPoints,
            teachingProcess,
            assignments,
            summary
        } = lessonData;

        const pages = [];

        // 1. 封面页
        pages.push(this.createCoverPage(lessonData));

        // 2. 使用 TeachingProcessAdapter 标准化教学过程
        const teachingProcessData = TeachingProcessAdapter.normalize(teachingProcess);
        const sectionInfo = TeachingProcessAdapter.getSectionInfo();

        // 确保教学过程数据的所有字段都是字符串类型
        const ensureString = (value) => {
          if (typeof value === 'string') return value;
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        };

        const safeTeachingProcessData = {
          introduction: ensureString(teachingProcessData.introduction),
          mainContent: ensureString(teachingProcessData.mainContent),
          practice: ensureString(teachingProcessData.practice),
          summary: ensureString(teachingProcessData.summary)
        };

        // 3. 课堂导入环节
        pages.push(...this.createIntroductionPages(safeTeachingProcessData));

        // 4. 新课讲授环节
        pages.push(...this.createMainContentPages(safeTeachingProcessData));

        // 5. 巩固练习环节
        pages.push(...this.createPracticePages(safeTeachingProcessData));

        // 6. 课堂总结环节
        pages.push(...this.createSummaryPages(safeTeachingProcessData));

        // 7. 结束页
        pages.push(this.createEndPage(lessonData));

        return {
            title: title || '教学课件',
            subject: subject || '',
            grade: grade || '',
            templateStyle,
            pages,
            pageCount: pages.length,
            createdAt: new Date().toISOString(),
            generatedByAI: false
        };
    }

    /**
     * 解析 JSON 字符串
     */
    static parseJSON(str, defaultValue) {
        if (Array.isArray(str)) return str;
        if (typeof str === 'object' && str !== null) return str;
        if (typeof str === 'string') {
            try {
                return JSON.parse(str);
            } catch {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    /**
     * 将文本按段落或要点拆分为多个部分
     * @param {string} text 文本内容
     * @param {number} maxItemsPerPage 每页最大条目数
     * @returns {Array<string>} 拆分后的段落数组
     */
    static splitTextIntoItems(text, maxItemsPerPage = 4) {
        if (!text || typeof text !== 'string') return [];

        const trimmed = text.trim();
        if (!trimmed) return [];

        let items = [];

        // 1. 尝试按编号列表拆分（1. 2. 3. 或 一、二、三、）
        const numberedPattern = /(?:^|\n)\s*(?:\d+[.、．）)]\s*|第[一二三四五六七八九十]+[步点部、．]\s*)(.+)/g;
        const numberedItems = [];
        let match;
        while ((match = numberedPattern.exec(trimmed)) !== null) {
            numberedItems.push(match[1].trim());
        }
        if (numberedItems.length >= 2) {
            items = numberedItems;
        }

        // 2. 尝试按换行符拆分
        if (items.length === 0) {
            const lines = trimmed.split(/\n+/).filter(line => line.trim().length > 0);
            if (lines.length >= 2) {
                const hasLongLines = lines.some(line => line.trim().length > 10);
                if (hasLongLines) {
                    items = lines.map(line => line.trim());
                }
            }
        }

        // 3. 尝试按分号拆分（保留完整语义）
        if (items.length === 0) {
            const semicolonItems = trimmed.split(/[；;]/).filter(item => item.trim().length > 0);
            if (semicolonItems.length >= 2) {
                items = semicolonItems.map(item => item.trim());
            }
        }

        // 4. 对于纯文本教学内容，按句号拆分但合并过短的片段
        if (items.length === 0) {
            const sentenceItems = trimmed.split(/[。]/).filter(item => item.trim().length > 0);
            if (sentenceItems.length >= 2) {
                const merged = [];
                let buffer = '';
                for (const item of sentenceItems) {
                    const trimmedItem = item.trim();
                    if (buffer.length + trimmedItem.length < 15 && buffer.length > 0) {
                        buffer += '。' + trimmedItem;
                    } else if (buffer.length > 0) {
                        merged.push(buffer);
                        buffer = trimmedItem;
                    } else {
                        buffer = trimmedItem;
                    }
                }
                if (buffer.length > 0) {
                    merged.push(buffer);
                }
                if (merged.length >= 2) {
                    items = merged;
                }
            }
        }

        // 5. 如果文本较长但无法拆分，按最大长度截断并保留语义
        if (items.length === 0 && trimmed.length > 200) {
            const chunkSize = 200;
            const chunks = [];
            for (let i = 0; i < trimmed.length; i += chunkSize) {
                let end = Math.min(i + chunkSize, trimmed.length);
                if (end < trimmed.length) {
                    const searchArea = trimmed.substring(end - 30, end);
                    const lastPunct = Math.max(
                        searchArea.lastIndexOf('，'),
                        searchArea.lastIndexOf('；'),
                        searchArea.lastIndexOf('。'),
                        searchArea.lastIndexOf('、')
                    );
                    if (lastPunct > 0) {
                        end = end - 30 + lastPunct + 1;
                    }
                }
                chunks.push(trimmed.substring(i, end).trim());
                if (end >= trimmed.length) break;
                i = end - 1;
            }
            if (chunks.length > 0) {
                items = chunks;
            }
        }

        // 无法拆分时，返回原文作为单个条目
        if (items.length === 0) {
            items = [trimmed];
        }

        // 合并过短的条目，保留更完整的描述
        const mergedItems = [];
        let currentText = '';
        for (const item of items) {
            if (currentText.length + item.length < 80 && currentText.length > 0) {
                currentText += '；' + item;
            } else {
                if (currentText) mergedItems.push(currentText);
                currentText = item;
            }
        }
        if (currentText) mergedItems.push(currentText);
        return mergedItems.length > 0 ? mergedItems : items;
    }

    /**
     * 将条目数组按每页最大数量分组
     * @param {Array<string>} items 条目数组
     * @param {number} maxItemsPerPage 每页最大条目数
     * @returns {Array<Array<string>>} 分组后的数组
     */
    static groupItemsForPages(items, maxItemsPerPage = 4) {
        const groups = [];
        for (let i = 0; i < items.length; i += maxItemsPerPage) {
            groups.push(items.slice(i, i + maxItemsPerPage));
        }
        return groups.length > 0 ? groups : [[]];
    }

    /**
     * 创建封面页
     * @param {Object} lessonData 教案数据
     */
    static createCoverPage(lessonData) {
        const { title, subject, grade } = lessonData;
        const now = new Date();
        return {
            type: 'cover',
            title: title || '教案PPT',
            section: null,
            content: {
                mainTitle: title || '教案PPT',
                subtitle: `${grade || ''} - ${subject || ''}`.replace(/^ - $/, ''),
                school: '',
                date: now.toLocaleDateString('zh-CN'),
                time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                fullDateTime: now.toLocaleString('zh-CN')
            },
            layout: 'cover',
            notes: '这是封面页，展示课程基本信息'
        };
    }

    /**
     * 创建教学流程目录页
     * 展示四个教学环节的流程图
     * @param {Object} lessonData 教案数据
     */
    static createTOCPage(lessonData) {
        const sectionInfo = TeachingProcessAdapter.getSectionInfo();
        return {
            type: 'toc',
            title: '教学流程',
            section: null,
            content: {
                mainTitle: '教学流程',
                sections: sectionInfo.map((section, index) => ({
                    number: index + 1,
                    key: section.key,
                    name: section.name,
                    description: section.description
                }))
            },
            layout: 'toc',
            notes: '教学流程目录页，概述本节课的四个教学环节'
        };
    }

    /**
     * 创建环节标识页
     * 显示环节序号、名称和描述
     * @param {number} sectionIndex 环节索引 (0-3)
     * @param {string} sectionName 环节名称
     * @param {string} sectionDescription 环节描述
     */
    static createSectionPage(sectionIndex, sectionName, sectionDescription) {
        const sectionInfo = TeachingProcessAdapter.getSectionInfo();
        const sectionKey = sectionInfo[sectionIndex] ? sectionInfo[sectionIndex].key : '';
        return {
            type: 'section',
            title: sectionName,
            section: sectionKey,
            content: {
                sectionNumber: sectionIndex + 1,
                sectionName: sectionName,
                description: sectionDescription || ''
            },
            layout: 'section',
            notes: `${sectionName}环节标识页`
        };
    }

    /**
     * 创建课堂导入环节的内容页
     * @param {Object} teachingProcess 标准化后的教学过程数据
     * @returns {Array} 页面数组（1-2页）
     */
    static createIntroductionPages(teachingProcess) {
        const content = teachingProcess.introduction || '';
        if (!content.trim()) {
            // 没有导入内容时，创建一个占位页
            return [{
                type: 'content',
                title: '课堂导入',
                section: 'introduction',
                content: {
                    mainContent: '（请在此处添加课堂导入内容）',
                    layout: 'text'
                },
                layout: 'process',
                notes: '课堂导入环节内容'
            }];
        }

        const items = this.splitTextIntoItems(content);
        const groups = this.groupItemsForPages(items);

        return pagesToUse.map((group, index) => ({
            type: 'content',
            title: index === 0 ? '课堂导入' : `课堂导入（续）`,
            section: 'introduction',
            content: {
                items: group.map((item, i) => ({
                    number: index * 4 + i + 1,
                    text: item
                })),
                layout: 'list'
            },
            layout: 'process',
            notes: '课堂导入环节内容'
        }));
    }

    /**
     * 创建新课讲授环节的内容页
     * @param {Object} teachingProcess 标准化后的教学过程数据
     * @returns {Array} 页面数组（2-4页）
     */
    static createMainContentPages(teachingProcess) {
        const content = teachingProcess.mainContent || '';
        if (!content.trim()) {
            return [{
                type: 'content',
                title: '新课讲授',
                section: 'mainContent',
                content: {
                    mainContent: '（请在此处添加新课讲授内容）',
                    layout: 'text'
                },
                layout: 'process',
                notes: '新课讲授环节内容'
            }];
        }

        const items = this.splitTextIntoItems(content);
        const groups = this.groupItemsForPages(items);

        return pagesToUse.map((group, index) => ({
            type: 'content',
            title: index === 0 ? '新课讲授' : `新课讲授（续${index}）`,
            section: 'mainContent',
            content: {
                items: group.map((item, i) => ({
                    number: index * 4 + i + 1,
                    text: item
                })),
                layout: 'list'
            },
            layout: 'process',
            notes: '新课讲授环节内容'
        }));
    }

    /**
     * 创建巩固练习环节的内容页
     * @param {Object} teachingProcess 标准化后的教学过程数据
     * @returns {Array} 页面数组（1-2页）
     */
    static createPracticePages(teachingProcess) {
        const content = teachingProcess.practice || '';
        if (!content.trim()) {
            return [{
                type: 'content',
                title: '巩固练习',
                section: 'practice',
                content: {
                    mainContent: '（请在此处添加巩固练习内容）',
                    layout: 'text'
                },
                layout: 'process',
                notes: '巩固练习环节内容'
            }];
        }

        const items = this.splitTextIntoItems(content);
        const groups = this.groupItemsForPages(items);

        return pagesToUse.map((group, index) => ({
            type: 'content',
            title: index === 0 ? '巩固练习' : '巩固练习（续）',
            section: 'practice',
            content: {
                items: group.map((item, i) => ({
                    number: index * 4 + i + 1,
                    text: item
                })),
                layout: 'list'
            },
            layout: 'process',
            notes: '巩固练习环节内容'
        }));
    }

    /**
     * 创建课堂总结环节的内容页
     * @param {Object} teachingProcess 标准化后的教学过程数据
     * @returns {Array} 页面数组（1页）
     */
    static createSummaryPages(teachingProcess) {
        const content = teachingProcess.summary || '';
        if (!content.trim()) {
            return [{
                type: 'content',
                title: '课堂总结',
                section: 'summary',
                content: {
                    mainContent: '（请在此处添加课堂总结内容）',
                    layout: 'text'
                },
                layout: 'process',
                notes: '课堂总结环节内容'
            }];
        }

        // 总结内容支持多页，最多显示10条
        const items = this.splitTextIntoItems(content);
        const displayItems = items.slice(0, 10);

        return [{
            type: 'content',
            title: '课堂总结',
            section: 'summary',
            content: {
                items: displayItems.map((item, i) => ({
                    number: i + 1,
                    text: item
                })),
                layout: 'list'
            },
            layout: 'process',
            notes: '课堂总结环节内容'
        }];
    }

    /**
     * 创建结束页
     * @param {Object} lessonData 教案数据
     */
    static createEndPage(lessonData) {
        const { title } = lessonData;
        return {
            type: 'end',
            title: '谢谢观看',
            section: null,
            content: {
                mainText: '感谢聆听',
                subText: title || '课程结束'
            },
            layout: 'end',
            notes: '结束页'
        };
    }

    /**
     * 导出为不同格式
     */
    static exportToJSON(pptData) {
        return JSON.stringify(pptData, null, 2);
    }

    static exportToHTML(pptData) {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${pptData.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .slide { page-break-after: always; margin-bottom: 30px; border: 1px solid #ddd; padding: 20px; }
        .slide-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
        .slide-content { font-size: 16px; line-height: 1.6; }
    </style>
</head>
<body>
    ${pptData.pages.map(page => `
    <div class="slide">
        <div class="slide-title">${page.title}</div>
        <div class="slide-content">${this.renderContent(page.content)}</div>
    </div>
    `).join('\n')}
</body>
</html>`;
    }

    /**
     * 渲染内容为HTML
     */
    static renderContent(content) {
        if (!content) return '';

        if (content.items) {
            return `<ul>${content.items.map(item =>
                `<li>${item.number ? item.number + '. ' : ''}${item.text}</li>`
            ).join('')}</ul>`;
        }

        if (content.sections) {
            return `<ol>${content.sections.map(section =>
                `<li><strong>${section.name}</strong> - ${section.description}</li>`
            ).join('')}</ol>`;
        }

        if (content.mainContent) {
            return `<p>${content.mainContent}</p>`;
        }

        if (content.text) {
            return `<p>${content.text}</p>`;
        }

        if (content.sectionName) {
            return `<h3>${content.sectionName}</h3><p>${content.description || ''}</p>`;
        }

        return JSON.stringify(content);
    }
}

module.exports = PPTService;
