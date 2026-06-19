/**
 * 导出服务
 * 将作品集导出为ZIP文件
 */

const JSZip = require('jszip');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const Portfolio = require('../models/Portfolio');
const Lesson = require('../models/Lesson');
const PPTRecord = require('../models/PPTRecord');

class ExportService {
    static fieldLabels = {
        introduction: '课堂导入',
        mainContent: '新课讲授',
        newTeaching: '新课讲授',
        practice: '巩固练习',
        summary: '课堂小结',
        conclusion: '课堂小结',
        homework: '作业安排',
        assignments: '作业安排',
        stages: '教学环节',
        teacherActivities: '教师活动',
        studentActivities: '学生活动',
        teachingPoints: '教学要点',
        activities: '活动',
        content: '内容',
        description: '说明',
        stageName: '环节',
        name: '名称',
        duration: '时间',
        timeAllocation: '时间',
    };

    static getExportDir() {
        const exportDir = path.join(__dirname, '../../exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        return exportDir;
    }

    static async exportToZip(portfolioId, format = 'zip') {
        const portfolio = await Portfolio.findById(portfolioId);

        if (!portfolio) {
            throw new Error('作品集不存在');
        }

        const exportDir = this.getExportDir();
        const timestamp = Date.now();
        const zipFilename = `portfolio_${portfolioId}_${timestamp}.zip`;
        const zipPath = path.join(exportDir, zipFilename);

        const archiveData = [];

        archiveData.push({
            name: 'portfolio_info.json',
            content: JSON.stringify(portfolio, null, 2)
        });

        if (portfolio.lessonIds && portfolio.lessonIds.length > 0) {
            archiveData.push({
                name: 'lessons/README.md',
                content: '# 教案列表\n\n'
            });

            for (const lessonId of portfolio.lessonIds) {
                try {
                    const lesson = await Lesson.findById(lessonId);
                    if (lesson) {
                        const docxBuffer = await this.generateLessonDocx(lesson);
                        const safeTitle = (lesson.title || `教案_${lessonId}`).replace(/[\/\\?%*:|"<>]/g, '_');
                        archiveData.push({
                            name: `lessons/${safeTitle}.docx`,
                            content: docxBuffer
                        });
                        console.log(`  ✅ 教案: ${lesson.title} (${docxBuffer.length} bytes)`);
                    } else {
                        console.warn(`  ⚠️ 教案 ${lessonId} 已不存在，已跳过`);
                    }
                } catch (err) {
                    console.error(`  ❌ 导出教案 ${lessonId} 失败:`, err.message);
                }
            }
        }

        if (portfolio.pptIds && portfolio.pptIds.length > 0) {
            archiveData.push({
                name: 'ppt/README.md',
                content: '# PPT列表\n\n'
            });

            for (const pptId of portfolio.pptIds) {
                try {
                    const ppt = await PPTRecord.findById(pptId);
                    if (ppt) {
                        let content = {};
                        try {
                            content = JSON.parse(ppt.contentJson || '{}');
                        } catch (e) {
                            content = { pages: [] };
                        }
                        const safeTitle = (ppt.title || `PPT_${pptId}`).replace(/[\/\\?%*:|"<>]/g, '_');
                        const pptxBuffer = await this.generatePptx(ppt.title, content);
                        archiveData.push({
                            name: `ppt/${safeTitle}.pptx`,
                            content: pptxBuffer
                        });
                        console.log(`  ✅ PPT: ${ppt.title} (${pptxBuffer.length} bytes)`);
                    } else {
                        console.warn(`  ⚠️ PPT ${pptId} 已不存在，已跳过`);
                    }
                } catch (err) {
                    console.error(`  ❌ 导出PPT ${pptId} 失败:`, err.message);
                }
            }
        }

        archiveData.push({
            name: 'README.md',
            content: this.generateReadme(portfolio)
        });

        // 使用 jszip 构建 ZIP 文件
        const zip = new JSZip();

        archiveData.forEach(item => {
            zip.file(item.name, item.content);
        });

        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        fs.writeFileSync(zipPath, zipBuffer);
        console.log(`作品集导出成功: ${zipFilename} (${zipBuffer.length} bytes)`);
        return zipPath;
    }

    static async generateLessonDocx(lesson) {
        const children = [];

        // 标题
        children.push(new Paragraph({
            children: [new TextRun({ text: lesson.title, bold: true, size: 36 })],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
        }));

        // 基本信息行
        children.push(new Paragraph({
            children: [
                new TextRun({ text: '学科：', bold: true, size: 22 }),
                new TextRun({ text: lesson.subject || '未知', size: 22 }),
                new TextRun({ text: '    年级：', bold: true, size: 22 }),
                new TextRun({ text: lesson.grade || '未知', size: 22 }),
                new TextRun({ text: '    状态：', bold: true, size: 22 }),
                new TextRun({ text: lesson.status === 'published' ? '已发布' : '草稿', size: 22 }),
            ],
            spacing: { after: 200 },
        }));

        // 分隔线
        children.push(new Paragraph({ children: [new TextRun({ text: '─'.repeat(50), color: 'CCCCCC', size: 18 })], spacing: { after: 200 } }));

        const addTextLines = (lines, options = {}) => {
            lines
                .map(line => String(line).trim())
                .filter(Boolean)
                .forEach(line => {
                    const isSection = line.startsWith('【') && line.endsWith('】');
                    children.push(new Paragraph({
                        children: [new TextRun({ text: `  ${line}`, bold: isSection || options.bold, size: 22 })],
                        spacing: { before: isSection ? 150 : 40, after: isSection ? 80 : 40 }
                    }));
                });
        };

        // 教学目标
        const goals = this.formatTeachingGoalsLines(lesson.teachingGoals);
        if (goals.length > 0) {
            children.push(new Paragraph({ children: [new TextRun({ text: '一、教学目标', bold: true, size: 26 })], spacing: { before: 300, after: 150 } }));
            addTextLines(goals);
        }

        // 教学重难点
        const points = this.formatContentLines(lesson.keyPoints);
        if (points.length > 0) {
            children.push(new Paragraph({ children: [new TextRun({ text: '二、教学重难点', bold: true, size: 26 })], spacing: { before: 300, after: 150 } }));
            addTextLines(points);
        }

        // 教学过程
        if (lesson.teachingProcess) {
            children.push(new Paragraph({ children: [new TextRun({ text: '三、教学过程', bold: true, size: 26 })], spacing: { before: 300, after: 150 } }));
            addTextLines(this.formatTeachingProcessLines(lesson.teachingProcess));
        }

        // 课后作业
        if (lesson.assignments) {
            children.push(new Paragraph({ children: [new TextRun({ text: '四、课后作业', bold: true, size: 26 })], spacing: { before: 300, after: 150 } }));
            const hwLines = lesson.assignments.split('\n').filter(l => l.trim());
            hwLines.forEach(line => {
                children.push(new Paragraph({ children: [new TextRun({ text: `  ${line}`, size: 22 })], spacing: { before: 40, after: 40 } }));
            });
        }

        // 教学总结
        if (lesson.summary) {
            children.push(new Paragraph({ children: [new TextRun({ text: '五、教学总结', bold: true, size: 26 })], spacing: { before: 300, after: 150 } }));
            const sumLines = lesson.summary.split('\n').filter(l => l.trim());
            sumLines.forEach(line => {
                children.push(new Paragraph({ children: [new TextRun({ text: `  ${line}`, size: 22 })], spacing: { before: 40, after: 40 } }));
            });
        }

        // 分隔线
        children.push(new Paragraph({ children: [new TextRun({ text: '─'.repeat(50), color: 'CCCCCC', size: 18 })], spacing: { before: 300, after: 100 } }));

        // 创建信息
        children.push(new Paragraph({
            children: [new TextRun({ text: `创建时间：${lesson.createdAt || '未知'}`, size: 18, color: '999999' })],
            spacing: { before: 100 },
        }));

        const doc = new Document({ sections: [{ children }] });
        return await Packer.toBuffer(doc);
    }

    static async generatePptx(title, content) {
        const pptx = new PptxGenJS();
        pptx.title = title;
        pptx.author = '网师云';
        const pages = content.pages || [];

        pages.forEach((page, index) => {
            const slide = pptx.addSlide();
            slide.background = { color: 'FFFFFF' };

            if (page.type === 'cover') {
                // 封面页
                const mainTitle = page.content?.mainTitle || title;
                const subtitle = page.content?.subtitle || '';
                slide.addText(mainTitle, {
                    x: 0.5, y: 1.5, w: '90%', h: 1.5,
                    fontSize: 36, bold: true, color: '333333',
                    align: 'center', valign: 'middle',
                    fontFace: 'Microsoft YaHei',
                });
                if (subtitle) {
                    slide.addText(subtitle, {
                        x: 0.5, y: 3.2, w: '90%', h: 0.8,
                        fontSize: 20, color: '666666',
                        align: 'center', fontFace: 'Microsoft YaHei',
                    });
                }
                // 封面底部装饰线
                slide.addShape(pptx.ShapeType?.rect || 'rect', {
                    x: 2, y: 4.5, w: 6, h: 0.05,
                    fill: { color: 'E79191' },
                });
            } else {
                // 内容页 - 标题
                const pageTitle = page.title || `第 ${index + 1} 页`;
                slide.addText(pageTitle, {
                    x: 0.5, y: 0.3, w: '90%', h: 0.7,
                    fontSize: 24, bold: true, color: '333333',
                    fontFace: 'Microsoft YaHei',
                });
                // 标题下划线
                slide.addShape(pptx.ShapeType?.rect || 'rect', {
                    x: 0.5, y: 1.0, w: 2, h: 0.04,
                    fill: { color: 'E79191' },
                });

                // 内容
                let y = 1.3;
                const contentOptions = {
                    x: 0.8, y, w: '84%', h: 3.5,
                    fontSize: 16, color: '555555',
                    fontFace: 'Microsoft YaHei',
                    lineSpacingMultiple: 1.5,
                    valign: 'top',
                };

                if (page.content?.items && Array.isArray(page.content.items)) {
                    const textItems = page.content.items.map(item => ({
                        text: item.number ? `${item.number}. ${item.text}` : item.text,
                        options: { fontSize: 16, bullet: { code: '2022' }, breakLine: true, color: '555555' },
                    }));
                    slide.addText(textItems, contentOptions);
                } else if (page.content?.mainContent) {
                    slide.addText(page.content.mainContent, contentOptions);
                } else if (page.content?.text) {
                    slide.addText(page.content.text, contentOptions);
                }

                // 页码
                slide.addText(`${index + 1} / ${pages.length}`, {
                    x: 0.5, y: '92%', w: '90%', h: 0.4,
                    fontSize: 10, color: '999999', align: 'center',
                    fontFace: 'Microsoft YaHei',
                });
            }
        });

        return await pptx.write({ outputType: 'nodebuffer' });
    }

    static formatLessonAsMarkdown(lesson) {
        let md = `# ${lesson.title}\n\n`;

        md += `**学科**: ${lesson.subject || '未知'}\n`;
        md += `**年级**: ${lesson.grade || '未知'}\n`;
        md += `**状态**: ${lesson.status || 'draft'}\n\n`;

        if (lesson.teachingGoals) {
            const goals = this.parseJSON(lesson.teachingGoals, []);
            if (goals.length > 0) {
                md += `## 教学目标\n\n`;
                goals.forEach((goal, i) => {
                    md += `${i + 1}. ${goal}\n`;
                });
                md += '\n';
            }
        }

        if (lesson.keyPoints) {
            const points = this.parseJSON(lesson.keyPoints, []);
            if (points.length > 0) {
                md += `## 教学重难点\n\n`;
                points.forEach(point => {
                    md += `- ${point}\n`;
                });
                md += '\n';
            }
        }

        if (lesson.teachingProcess) {
            const process = this.parseJSON(lesson.teachingProcess, {});
            md += `## 教学过程\n\n`;

            if (process.introduction) {
                md += `### 课堂导入\n${process.introduction}\n\n`;
            }
            if (process.mainContent) {
                md += `### 新课讲授\n${process.mainContent}\n\n`;
            }
            if (process.practice) {
                md += `### 巩固练习\n${process.practice}\n\n`;
            }
            if (process.summary) {
                md += `### 课堂总结\n${process.summary}\n\n`;
            }
        }

        if (lesson.assignments) {
            md += `## 课后作业\n\n${lesson.assignments}\n\n`;
        }

        if (lesson.summary) {
            md += `## 教学总结\n\n${lesson.summary}\n\n`;
        }

        md += `---\n`;
        md += `*创建时间: ${lesson.createdAt}*\n`;

        return md;
    }

    static formatPPTAsHTML(title, content) {
        const pages = content.pages || [];

        let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, "Microsoft YaHei", sans-serif; background: #f5f5f5; }
        .slide { width: 100%; max-width: 800px; margin: 20px auto; background: white;
                 padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .slide-title { font-size: 28px; font-weight: bold; color: #333;
                       margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #007bff; }
        .slide-content { font-size: 16px; line-height: 1.8; color: #555; }
        .slide-content ul { margin-left: 20px; }
        .slide-content li { margin: 10px 0; }
        .page-number { text-align: center; color: #999; font-size: 14px; margin-top: 20px; }
        .cover { text-align: center; padding: 100px 40px; }
        .cover h1 { font-size: 36px; margin-bottom: 20px; }
        .cover .subtitle { font-size: 20px; color: #666; }
    </style>
</head>
<body>
`;

        pages.forEach((page, index) => {
            if (page.type === 'cover') {
                html += `    <div class="slide cover">
        <h1>${page.content && page.content.mainTitle ? page.content.mainTitle : title}</h1>
        <div class="subtitle">${page.content && page.content.subtitle ? page.content.subtitle : ''}</div>
    </div>\n`;
            } else {
                html += `    <div class="slide">
        <div class="slide-title">${page.title || '页面 ' + (index + 1)}</div>
        <div class="slide-content">\n`;

                if (page.content && page.content.items) {
                    html += `            <ul>\n`;
                    page.content.items.forEach(item => {
                        const text = item.number ? `${item.number}. ${item.text}` : item.text;
                        html += `                <li>${text}</li>\n`;
                    });
                    html += `            </ul>\n`;
                } else if (page.content && page.content.mainContent) {
                    html += `            <p>${page.content.mainContent}</p>\n`;
                } else if (page.content && page.content.text) {
                    html += `            <p>${page.content.text}</p>\n`;
                }

                html += `        </div>
        <div class="page-number">${index + 1} / ${pages.length}</div>
    </div>\n`;
            }
        });

        html += `</body>
</html>`;

        return html;
    }

    static generateReadme(portfolio) {
        let readme = `# ${portfolio.name}\n\n`;

        if (portfolio.description) {
            readme += `## 作品集简介\n\n${portfolio.description}\n\n`;
        }

        readme += `## 内容统计\n\n`;
        readme += `- 教案数量: ${portfolio.lessonIds ? portfolio.lessonIds.length : 0}\n`;
        readme += `- PPT数量: ${portfolio.pptIds ? portfolio.pptIds.length : 0}\n`;
        readme += `- 分享次数: ${portfolio.shareCount || 0}\n`;
        readme += `- 浏览次数: ${portfolio.viewCount || 0}\n\n`;

        readme += `## 目录结构\n\n`;
        readme += '```\n';
        readme += '.\n';
        readme += '├── README.md\n';
        readme += '├── portfolio_info.json    # 作品集详细信息\n';

        if (portfolio.lessonIds && portfolio.lessonIds.length > 0) {
            readme += '├── lessons/              # 教案文件夹\n';
        }
        if (portfolio.pptIds && portfolio.pptIds.length > 0) {
            readme += '├── ppt/                  # PPT文件夹\n';
        }
        readme += '```\n\n';

        readme += `---\n`;
        readme += `*由网师云-师范生备课辅助系统导出*\n`;
        readme += `*导出时间: ${new Date().toLocaleString('zh-CN')}*\n`;

        return readme;
    }

    static parseJSON(str, defaultValue) {
        if (Array.isArray(str)) return str;
        if (typeof str === 'object' && str !== null) return str;
        if (typeof str === 'string') {
            try {
                return JSON.parse(str);
            } catch (e) {
                // 如果是普通字符串，包装为数组（与前端 parseArrayField 一致）
                if (str.trim()) return [str];
                return defaultValue;
            }
        }
        return defaultValue;
    }

    static parseContent(value) {
        if (!value) return value;
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        if (!trimmed) return '';
        const candidates = [
            trimmed,
            `{"mainContent":{"stages":[{${trimmed}`,
            `{"stages":[{${trimmed}`,
            `{${trimmed}}`,
            `[{${trimmed}}]`,
        ];
        for (const candidate of candidates) {
            try {
                return JSON.parse(candidate);
            } catch {
                // 继续尝试容错包装
            }
        }
        return value;
    }

    static parseTeachingGoals(value) {
        if (!value) return { version: 2, dimensions: [] };

        const parsedValue = this.parseContent(value);
        if (parsedValue !== value) {
            return this.parseTeachingGoals(parsedValue);
        }

        if (typeof value === 'string') {
            return {
                version: 2,
                dimensions: [
                    {
                        id: 'general',
                        name: '教学目标',
                        goals: value.split('\n').map(line => line.trim()).filter(Boolean),
                    },
                ],
            };
        }

        if (Array.isArray(value)) {
            const dimensionMap = {};
            const generalGoals = [];

            value.forEach(goal => {
                const str = typeof goal === 'string' ? goal : String(goal);
                const match = str.match(/^([^：:]+)[：:](.+)/);
                if (match) {
                    const dimName = match[1].trim();
                    const goalContent = match[2].trim();
                    if (!dimensionMap[dimName]) {
                        dimensionMap[dimName] = [];
                    }
                    dimensionMap[dimName].push(goalContent);
                } else {
                    generalGoals.push(str);
                }
            });

            const dimensions = Object.entries(dimensionMap).map(([name, goals]) => ({
                id: name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '_'),
                name,
                goals,
            }));

            if (generalGoals.length > 0) {
                dimensions.push({
                    id: 'general',
                    name: dimensions.length > 0 ? '综合目标' : '教学目标',
                    goals: generalGoals,
                });
            }

            return { version: 2, dimensions };
        }

        if (typeof value === 'object') {
            if (Array.isArray(value.dimensions)) {
                return value;
            }

            const mapping = {
                knowledge: '知识与技能',
                ability: '过程与方法',
                emotion: '情感态度与价值观',
            };

            const dimensions = Object.entries(mapping)
                .filter(([key]) => Array.isArray(value[key]) && value[key].length > 0)
                .map(([key, name]) => ({
                    id: key,
                    name,
                    goals: value[key],
                }));

            if (dimensions.length > 0) {
                return { version: 2, dimensions };
            }
        }

        return { version: 2, dimensions: [] };
    }

    static formatTeachingGoalsLines(value) {
        const parsed = this.parseTeachingGoals(value);
        const lines = [];

        parsed.dimensions.forEach(dim => {
            if (dim.name) {
                lines.push(dim.name);
            }
            dim.goals.forEach((goal, index) => {
                lines.push(`${index + 1}. ${goal}`);
            });
        });

        if (lines.length > 0) {
            return lines;
        }

        return this.valueToLines(this.parseContent(value));
    }

    static formatContentLines(value) {
        return this.valueToLines(this.parseContent(value));
    }

    static valueToLines(value) {
        if (!value) return [];
        if (typeof value === 'string') {
            return value
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);
        }
        if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
        if (Array.isArray(value)) {
            return value.flatMap((item, index) => {
                const lines = this.valueToLines(this.parseContent(item));
                if (typeof item === 'object' && item !== null) return lines;
                return lines.map(line => `${index + 1}. ${line}`);
            });
        }
        if (typeof value === 'object') {
            const lines = [];
            const title = value.stageName || value.name || value.title;
            const duration = value.duration || value.timeAllocation;
            if (title || duration) {
                lines.push(`${title ? String(title) : '教学环节'}${duration ? `（${duration}）` : ''}`);
            }

            Object.entries(value).forEach(([key, childValue]) => {
                if (['stageName', 'name', 'title', 'duration', 'timeAllocation'].includes(key)) return;
                const childLines = this.valueToLines(this.parseContent(childValue));
                if (childLines.length === 0) return;
                const label = this.fieldLabels[key] || '';
                if (label) {
                    lines.push(`${label}：`);
                    lines.push(...childLines.map(line => `  ${line}`));
                } else {
                    lines.push(...childLines);
                }
            });
            return lines;
        }
        return [];
    }

    static formatTeachingProcessLines(value) {
        const parsed = this.parseContent(value);
        if (Array.isArray(parsed)) {
            return this.valueToLines({ stages: parsed });
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return this.valueToLines(parsed);
        }

        const parts = [];
        const sectionKeys = ['introduction', 'newTeaching', 'mainContent', 'stages', 'practice', 'summary', 'conclusion'];
        sectionKeys.forEach(key => {
            if (!parsed[key]) return;
            const label = this.fieldLabels[key] || '教学内容';
            const lines = this.valueToLines(this.parseContent(parsed[key]));
            if (lines.length > 0) {
                parts.push(`【${label}】`);
                parts.push(...lines);
            }
        });

        if (parts.length > 0) return parts;

        return Object.entries(parsed).flatMap(([key, childValue]) => {
            const lines = this.valueToLines(this.parseContent(childValue));
            if (lines.length === 0) return [];
            return [`【${this.fieldLabels[key] || '教学内容'}】`, ...lines];
        });
    }

    static cleanExpiredFiles(maxAge = 24 * 60 * 60 * 1000) {
        const exportDir = this.getExportDir();
        const now = Date.now();

        try {
            const files = fs.readdirSync(exportDir);
            files.forEach(file => {
                const filePath = path.join(exportDir, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                    console.log(`删除过期文件: ${file}`);
                }
            });
        } catch (err) {
            console.error('清理过期文件失败:', err.message);
        }
    }
}

module.exports = ExportService;
