/**
 * PPT 生成服务
 * 将教案数据转换为PPT结构
 */

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

        // 解析JSON字符串
        const goals = this.parseJSON(teachingGoals, []);
        const points = this.parseJSON(keyPoints, []);
        const process = this.parseJSON(teachingProcess, {});
        const assignList = typeof assignments === 'string' ? assignments : (assignments || '');
        const summaryText = typeof summary === 'string' ? summary : (summary || '');

        const pages = [];

        // 封面页
        pages.push(this.createCoverPage(title, subject, grade));

        // 目录页
        pages.push(this.createTOCPage());

        // 教学目标页
        if (goals.length > 0) {
            pages.push(this.createGoalsPage(goals));
        }

        // 教学重难点页
        if (points.length > 0) {
            pages.push(this.createKeyPointsPage(points));
        }

        // 教学过程页
        if (process.introduction) {
            pages.push(this.createProcessPage('课堂导入', process.introduction));
        }
        if (process.mainContent) {
            pages.push(this.createProcessPage('新课讲授', process.mainContent));
        }
        if (process.practice) {
            pages.push(this.createProcessPage('巩固练习', process.practice));
        }
        if (process.summary) {
            pages.push(this.createProcessPage('课堂总结', process.summary));
        }

        // 课后作业页
        if (assignList) {
            pages.push(this.createAssignmentsPage(assignList));
        }

        // 结束页
        pages.push(this.createEndPage(title));

        return {
            title,
            subject,
            grade,
            templateStyle,
            pages,
            pageCount: pages.length,
            createdAt: new Date().toISOString()
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
     * 创建封面页
     */
    static createCoverPage(title, subject, grade) {
        const now = new Date();
        return {
            type: 'cover',
            title: title || '教案PPT',
            content: {
                mainTitle: title || '教案PPT',
                subtitle: `${grade} - ${subject}`,
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
     * 创建目录页
     */
    static createTOCPage() {
        return {
            type: 'toc',
            title: '目录',
            content: {
                items: [
                    '教学目标',
                    '教学重难点',
                    '教学过程',
                    '课后作业',
                    '结束'
                ]
            },
            layout: 'toc',
            notes: '目录页，概述本次课程内容'
        };
    }

    /**
     * 创建教学目标页
     */
    static createGoalsPage(goals) {
        return {
            type: 'content',
            title: '教学目标',
            content: {
                items: goals.map((goal, index) => ({
                    number: index + 1,
                    text: goal
                })),
                layout: 'list'
            },
            layout: 'goals',
            notes: '展示本节课的教学目标'
        };
    }

    /**
     * 创建教学重难点页
     */
    static createKeyPointsPage(points) {
        return {
            type: 'content',
            title: '教学重难点',
            content: {
                items: points.map(point => ({
                    text: point
                })),
                layout: 'bullet'
            },
            layout: 'keypoints',
            notes: '强调本节课的重点和难点'
        };
    }

    /**
     * 创建教学过程页
     */
    static createProcessPage(sectionTitle, content) {
        return {
            type: 'content',
            title: sectionTitle,
            content: {
                mainContent: content,
                layout: 'text'
            },
            layout: 'process',
            notes: `${sectionTitle}的内容`
        };
    }

    /**
     * 创建课后作业页
     */
    static createAssignmentsPage(assignments) {
        return {
            type: 'content',
            title: '课后作业',
            content: {
                text: assignments,
                layout: 'text'
            },
            layout: 'assignments',
            notes: '布置课后作业'
        };
    }

    /**
     * 创建结束页
     */
    static createEndPage(title) {
        return {
            type: 'end',
            title: '谢谢观看',
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

        if (content.mainContent) {
            return `<p>${content.mainContent}</p>`;
        }

        if (content.text) {
            return `<p>${content.text}</p>`;
        }

        return JSON.stringify(content);
    }
}

module.exports = PPTService;
