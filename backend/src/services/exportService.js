/**
 * 导出服务
 * 将作品集导出为ZIP文件
 */

const { ZipArchive } = require('archiver');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const Portfolio = require('../models/Portfolio');
const Lesson = require('../models/Lesson');
const PPTRecord = require('../models/PPTRecord');

class ExportService {
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
                        archiveData.push({
                            name: `lessons/${lesson.title.replace(/[\/\\?%*:|"<>]/g, '_')}.docx`,
                            content: docxBuffer
                        });
                    }
                } catch (err) {
                    console.error(`导出教案 ${lessonId} 失败:`, err.message);
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
                        const pptxBuffer = await this.generatePptx(ppt.title, content);
                        archiveData.push({
                            name: `ppt/${ppt.title.replace(/[\/\\?%*:|"<>]/g, '_')}.pptx`,
                            content: pptxBuffer
                        });
                    }
                } catch (err) {
                    console.error(`导出PPT ${pptId} 失败:`, err.message);
                }
            }
        }

        archiveData.push({
            name: 'README.md',
            content: this.generateReadme(portfolio)
        });

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = new ZipArchive('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => {
                console.log(`作品集导出成功: ${zipFilename} (${archive.pointer()} bytes)`);
                resolve(zipPath);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            archiveData.forEach(item => {
                archive.append(item.content, { name: item.name });
            });

            archive.finalize();
        });
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

        // 教学目标
        const goals = this.parseJSON(lesson.teachingGoals, []);
        if (goals.length > 0) {
            children.push(new Paragraph({ children: [new TextRun({ text: '一、教学目标', bold: true, size: 26 })], spacing: { before: 300, after: 150 } }));
            goals.forEach((goal, i) => {
                children.push(new Paragraph({ children: [new TextRun({ text: `  ${i + 1}. ${goal}`, size: 22 })], spacing: { before: 80, after: 80 } }));
            });
        }

        // 教学重难点
        const points = this.parseJSON(lesson.keyPoints, []);
        if (points.length > 0) {
            children.push(new Paragraph({ children: [new TextRun({ text: '二、教学重难点', bold: true, size: 26 })], spacing: { before: 300, after: 150 } }));
            points.forEach((point, i) => {
                children.push(new Paragraph({ children: [new TextRun({ text: `  ${i + 1}. ${point}`, size: 22 })], spacing: { before: 80, after: 80 } }));
            });
        }

        // 教学过程
        if (lesson.teachingProcess) {
            children.push(new Paragraph({ children: [new TextRun({ text: '三、教学过程', bold: true, size: 26 })], spacing: { before: 300, after: 150 } }));
            
            let processText = '';
            if (typeof lesson.teachingProcess === 'string') {
                processText = lesson.teachingProcess;
            } else if (typeof lesson.teachingProcess === 'object') {
                // 尝试解析已知结构
                const process = lesson.teachingProcess;
                if (process.introduction || process.mainContent || process.practice || process.summary) {
                    if (process.introduction) processText += `【课堂导入】\n${process.introduction}\n\n`;
                    if (process.mainContent) processText += `【新课讲授】\n${process.mainContent}\n\n`;
                    if (process.practice) processText += `【巩固练习】\n${process.practice}\n\n`;
                    if (process.summary) processText += `【课堂总结】\n${process.summary}\n\n`;
                } else {
                    // 未知结构，直接输出格式化 JSON
                    processText = JSON.stringify(process, null, 2);
                }
            }
            
            const processLines = processText.split('\n').filter(l => l.trim());
            processLines.forEach(line => {
                const isSection = line.startsWith('【') && line.endsWith('】');
                children.push(new Paragraph({
                    children: [new TextRun({ text: `  ${line}`, bold: isSection, size: isSection ? 22 : 22 })],
                    spacing: { before: isSection ? 150 : 40, after: isSection ? 80 : 40 }
                }));
            });
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
