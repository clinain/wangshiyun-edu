/**
 * PDF export service.
 * Uses an installed browser renderer when available. It intentionally does not
 * bundle Chromium so the DevBox disk is not filled by a hidden dependency.
 */

'use strict';

const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

class PdfExportService {
    static async renderHTMLToPDF(html, options = {}) {
        const browserResult = await this.tryBrowserPDF(html, options);
        if (browserResult) return browserResult;

        const wkhtmlResult = await this.tryWkhtmltopdf(html, options);
        if (wkhtmlResult) return wkhtmlResult;

        const error = new Error('PDF渲染器未配置。请安装 Chromium + puppeteer，或安装 wkhtmltopdf，或配置 PUPPETEER_EXECUTABLE_PATH 环境变量。');
        error.statusCode = 503;
        error.code = 'PDF_RENDERER_NOT_CONFIGURED';
        throw error;
    }

    static async tryBrowserPDF(html, options) {
        const puppeteer = this.tryRequire('puppeteer-core') || this.tryRequire('puppeteer');
        if (!puppeteer) {
            console.warn('puppeteer 未安装，跳过浏览器PDF渲染');
            return null;
        }

        // 优先级：环境变量 > 系统浏览器 > puppeteer自带浏览器
        let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        if (!executablePath) {
            executablePath = this.findBrowserPath();
        }
        // 如果系统浏览器也没找到，尝试使用 puppeteer 自带的 Chrome
        if (!executablePath && puppeteer.executablePath) {
            try {
                const bundledPath = await puppeteer.executablePath();
                if (bundledPath) {
                    const fsSync = require('fs');
                    if (fsSync.existsSync(bundledPath)) {
                        executablePath = bundledPath;
                        console.log('使用 puppeteer 自带浏览器:', bundledPath);
                    }
                }
            } catch (e) {
                console.warn('获取 puppeteer 自带浏览器路径失败:', e.message);
            }
        }

        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--allow-file-access-from-files',
                '--disable-web-security',
            ]
        };
        if (executablePath) {
            launchOptions.executablePath = executablePath;
            console.log('使用浏览器路径:', executablePath);
        } else {
            console.warn('未找到任何可用浏览器，尝试让 puppeteer 自动选择...');
        }

        let browser;
        try {
            browser = await puppeteer.launch(launchOptions);
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0', timeout: 120000 });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
                ...options.pdf
            });
            // 验证 PDF 缓冲区有效
            if (!pdfBuffer || pdfBuffer.length === 0) {
                console.warn('浏览器生成的PDF缓冲区为空');
                return null;
            }
            // 确保是 Node.js Buffer（puppeteer 可能返回 Uint8Array）
            const pdfBuf = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
            // 检查 PDF 文件头：前5字节应为 %PDF-（37 80 68 70 45）
            const isValidPdf = pdfBuf[0] === 0x25 && pdfBuf[1] === 0x50 && pdfBuf[2] === 0x44 && pdfBuf[3] === 0x46 && pdfBuf[4] === 0x2D;
            if (!isValidPdf) {
                console.warn('浏览器生成的内容不是有效的PDF, 前5字节:', pdfBuf[0], pdfBuf[1], pdfBuf[2], pdfBuf[3], pdfBuf[4]);
                return null;
            }
            console.log('PDF渲染成功, 大小:', pdfBuf.length, 'bytes');
            return pdfBuf;
            console.log('PDF渲染成功, 大小:', pdfBuffer.length, 'bytes');
            return pdfBuffer;
        } catch (error) {
            console.warn('浏览器PDF渲染失败:', error.message);
            return null;
        } finally {
            if (browser) await browser.close().catch(() => {});
        }
    }

    /**
     * 查找系统中可用的浏览器路径（支持 Windows / macOS / Linux）
     */
    static findBrowserPath() {
        // 1. 先用 where/which 搜索 PATH 中的浏览器
        const names = process.platform === 'win32'
            ? ['chrome', 'msedge', 'chromium']
            : ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'];
        const found = this.findExecutable(names);
        if (found) return found;

        // 2. 在常见安装路径中搜索
        if (process.platform === 'win32') {
            const winPaths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Chromium\\Application\\chrome.exe',
            ].filter(Boolean);
            for (const p of winPaths) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(p)) {
                        console.log('在常见路径找到浏览器:', p);
                        return p;
                    }
                } catch {}
            }
        } else if (process.platform === 'darwin') {
            const macPaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium',
                '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            ];
            for (const p of macPaths) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(p)) {
                        console.log('在常见路径找到浏览器:', p);
                        return p;
                    }
                } catch {}
            }
        } else {
            const linuxPaths = [
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/snap/bin/chromium',
            ];
            for (const p of linuxPaths) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(p)) {
                        console.log('在常见路径找到浏览器:', p);
                        return p;
                    }
                } catch {}
            }
        }

        console.warn('未找到可用的浏览器，请安装 Chrome/Chromium 或设置 PUPPETEER_EXECUTABLE_PATH 环境变量');
        return '';
    }

    static async tryWkhtmltopdf(html) {
        const command = process.env.PDF_RENDER_COMMAND || this.findExecutable(['wkhtmltopdf']);
        if (!command) return null;

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wangshiyun-pdf-'));
        const htmlPath = path.join(tempDir, 'deck.html');
        const pdfPath = path.join(tempDir, 'deck.pdf');

        try {
            await fs.writeFile(htmlPath, html, 'utf8');
            await this.run(command, [
                '--enable-local-file-access',
                '--page-size', 'A4',
                '--orientation', 'Landscape',
                '--margin-top', '0',
                '--margin-right', '0',
                '--margin-bottom', '0',
                '--margin-left', '0',
                htmlPath,
                pdfPath
            ]);
            return await fs.readFile(pdfPath);
        } catch (error) {
            console.warn('wkhtmltopdf渲染不可用:', error.message);
            return null;
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    }

    static run(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
            let stderr = '';
            child.stderr.on('data', chunk => { stderr += chunk.toString(); });
            child.on('error', reject);
            child.on('close', code => {
                if (code === 0) resolve();
                else reject(new Error(stderr || `命令退出码: ${code}`));
            });
        });
    }

    static findExecutable(names) {
        const cmd = process.platform === 'win32' ? 'where' : 'which';
        for (const name of names) {
            const result = spawnSync(cmd, [name], { encoding: 'utf8' });
            if (result.status === 0 && result.stdout.trim()) return result.stdout.trim().split('\n')[0].trim();
        }
        return '';
    }

    static tryRequire(name) {
        try {
            return require(name);
        } catch {
            return null;
        }
    }
}

module.exports = PdfExportService;
