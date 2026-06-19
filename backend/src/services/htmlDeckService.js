'use strict';

/** 默认主题配置（蓝色 #002FA7） */
const DEFAULT_THEME = {
    name: '默认蓝',
    primaryColor: '002FA7',
    secondaryColor: '4A6CF7',
    bgColor: 'FAFAF8',
    textColor: '0A0A0A',
    accentColor: '002FA7',
    fontFamily: 'Inter,"Helvetica Neue","Noto Sans SC","Microsoft YaHei UI",sans-serif',
};

/** 主题字符串键到完整主题配置的映射（与前端 THEMES 保持一致） */
const THEME_MAP = {
    default: {
        name: '默认蓝',
        primaryColor: '1E40AF',
        secondaryColor: '3B82F6',
        bgColor: 'FFFFFF',
        textColor: '1F2937',
        accentColor: 'EFF6FF',
        fontFamily: 'Inter,"Helvetica Neue","Noto Sans SC","Microsoft YaHei UI",sans-serif',
    },
    modern: {
        name: '现代紫',
        primaryColor: '7C3AED',
        secondaryColor: 'A78BFA',
        bgColor: 'FFFFFF',
        textColor: '1F2937',
        accentColor: 'F5F3FF',
        fontFamily: 'Inter,"Helvetica Neue","Noto Sans SC","Microsoft YaHei UI",sans-serif',
    },
    academic: {
        name: '学术绿',
        primaryColor: '059669',
        secondaryColor: '34D399',
        bgColor: 'FFFFFF',
        textColor: '1F2937',
        accentColor: 'ECFDF5',
        fontFamily: 'Inter,"Helvetica Neue","Noto Sans SC","Microsoft YaHei UI",sans-serif',
    },
    warm: {
        name: '温暖橙',
        primaryColor: 'EA580C',
        secondaryColor: 'FB923C',
        bgColor: 'FFFFFF',
        textColor: '1F2937',
        accentColor: 'FFF7ED',
        fontFamily: 'Inter,"Helvetica Neue","Noto Sans SC","Microsoft YaHei UI",sans-serif',
    },
    business: {
        name: '商务灰',
        primaryColor: '374151',
        secondaryColor: '6B7280',
        bgColor: 'FFFFFF',
        textColor: '1F2937',
        accentColor: 'F9FAFB',
        fontFamily: 'Inter,"Helvetica Neue","Noto Sans SC","Microsoft YaHei UI",sans-serif',
    },
    creative: {
        name: '创意粉',
        primaryColor: 'DB2777',
        secondaryColor: 'F472B6',
        bgColor: 'FFFFFF',
        textColor: '1F2937',
        accentColor: 'FDF2F8',
        fontFamily: 'Inter,"Helvetica Neue","Noto Sans SC","Microsoft YaHei UI",sans-serif',
    },
};

class HtmlDeckService {
    static withHtmlDeck(pptData, theme) {
        const base = this.normalize(pptData);
        const resolvedTheme = this.resolveTheme(theme);
        return {
            ...base,
            format: 'html-deck',
            deckStyle: base.deckStyle || 'swiss',
            html: typeof base.html === 'string' && base.html.trim() ? base.html : this.toHTML(base, resolvedTheme)
        };
    }

    /** 合并用户主题与默认主题，确保所有字段齐全 */
    static resolveTheme(theme) {
        // 如果 theme 是字符串键，从 THEME_MAP 中查找对应配置
        if (typeof theme === 'string') {
            const mapped = THEME_MAP[theme];
            if (mapped) {
                return { ...DEFAULT_THEME, ...mapped };
            }
            return { ...DEFAULT_THEME };
        }
        if (!theme || typeof theme !== 'object') {
            return { ...DEFAULT_THEME };
        }
        return {
            ...DEFAULT_THEME,
            ...theme,
            primaryColor: theme.primaryColor || DEFAULT_THEME.primaryColor,
            secondaryColor: theme.secondaryColor || DEFAULT_THEME.secondaryColor,
            bgColor: theme.bgColor || DEFAULT_THEME.bgColor,
            textColor: theme.textColor || DEFAULT_THEME.textColor,
            accentColor: theme.accentColor || DEFAULT_THEME.accentColor,
            fontFamily: theme.fontFamily || DEFAULT_THEME.fontFamily,
        };
    }

    /** 根据主题生成对比色（白/黑） */
    static contrastColor(hex) {
        const h = String(hex || '002FA7').replace(/^#/, '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.55 ? '0A0A0A' : 'FFFFFF';
    }

    /** 根据主色生成灰色系变体 */
    static generateGreyVariants(bgHex) {
        const h = String(bgHex || 'FAFAF8').replace(/^#/, '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const mix = (base, factor) => Math.round(base + (255 - base) * factor);
        // grey-1: 略深于背景
        const g1 = `${mix(r, 0.06).toString(16).padStart(2, '0')}${mix(g, 0.06).toString(16).padStart(2, '0')}${mix(b, 0.06).toString(16).padStart(2, '0')}`;
        // grey-2: 中灰
        const g2 = `${mix(r, 0.18).toString(16).padStart(2, '0')}${mix(g, 0.18).toString(16).padStart(2, '0')}${mix(b, 0.18).toString(16).padStart(2, '0')}`;
        return { grey1: g1, grey2: g2 };
    }

    static normalize(pptData) {
        if (!pptData || typeof pptData !== 'object') {
            return { title: '未命名课件', pages: [], pageCount: 0 };
        }
        const pages = Array.isArray(pptData.pages) ? pptData.pages : [];
        return {
            ...pptData,
            title: pptData.title || '未命名课件',
            pages,
            pageCount: pptData.pageCount || pages.length
        };
    }

    static toHTML(pptData, theme) {
        const data = this.normalize(pptData);
        const rawPages = data.pages.length
            ? data.pages
            : [{ type: 'cover', title: data.title, content: { mainTitle: data.title } }];
        // 过滤掉 toc 和 section 类型的页面
        const pages = rawPages.filter(p => p.type !== 'toc' && p.type !== 'section');
        const total = pages.length;
        const slides = pages.map((page, index) => this.slide(page, index, total, data, theme)).join('\n');
        const dots = pages.map((_, index) => `<span class="dot${index === 0 ? ' active' : ''}"></span>`).join('');
        return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${this.esc(data.title)}</title>${this.css(theme)}</head><body><main id="deck">${slides}</main><div class="nav">${dots}</div><div class="hint">← / → 翻页 · Ctrl+P 导出PDF</div>${this.js(total)}</body></html>`;
    }

    static slide(page, index, total, data, theme) {
        const content = page.content || {};

        // 环节标识页 - 简洁居中布局，accent 背景色
        if (page.type === 'section') {
            const sectionNum = this.esc(content.sectionNumber || String(index + 1).padStart(2, '0'));
            const sectionName = this.esc(content.title || page.title || '环节');
            const sectionDesc = this.esc(content.description || '');
            return `<section class="slide slide-section" data-type="section"><div class="section-number">${sectionNum}</div><div class="section-name">${sectionName}</div>${sectionDesc ? `<div class="section-description">${sectionDesc}</div>` : ''}</section>`;
        }

        // 教学流程目录页 - 展示四个教学环节的流程图
        if (page.type === 'toc') {
            const tocItems = (Array.isArray(content.sections) ? content.sections : []).map((item, i) => {
                const num = this.esc(item.number || String(i + 1).padStart(2, '0'));
                const name = this.esc(item.name || item.text || '');
                const arrow = i < (content.sections.length - 1) ? '<div class="toc-arrow">→</div>' : '';
                return `<div class="toc-item"><div class="toc-number">${num}</div><div class="toc-name">${name}</div></div>${arrow}`;
            }).join('');
            return `<section class="slide slide-toc" data-type="toc"><div class="toc-title">${this.esc(page.title || '教学流程')}</div><div class="toc-flow">${tocItems}</div></section>`;
        }

        const themeClass = index === 0 ? 'accent' : page.type === 'end' ? 'ink' : '';
        const title = index === 0
            ? content.mainTitle || page.title || data.title
            : page.title || content.mainText || `第${index + 1}页`;
        const subject = [data.grade, data.subject].filter(Boolean).join(' / ') || 'AI Teaching Deck';
        return `<section class="slide ${themeClass}"><div class="canvas"><div class="chrome"><span>${this.esc(subject)}</span><span>${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div><div class="grid"><div><div class="kicker">${this.esc(page.layout || page.type || 'SLIDE')}</div><h${index === 0 ? '1' : '2'}>${this.esc(title)}</h${index === 0 ? '1' : '2'}></div>${this.body(page, index)}</div><div class="foot"><span>WangShiYun AI Deck</span><span>${this.esc(page.notes || '')}</span></div></div></section>`;
    }

    static body(page, index) {
        const content = page.content || {};
        if (index === 0) {
            return `<div class="single"><p class="lead">${this.esc(content.subtitle || content.mainContent || '')}</p></div>`;
        }
        if (Array.isArray(content.items)) {
            const cards = content.items.map((item, itemIndex) => {
                const text = typeof item === 'string' ? item : item.text || String(item);
                return `<article><b>${this.esc(item.number || itemIndex + 1)}</b><span>${this.esc(text)}</span></article>`;
            }).join('');
            return `<div class="single cards">${cards}</div>`;
        }
        if (page.type === 'end' || content.mainText) {
            return `<div class="single"><div class="statement">${this.esc(content.mainText || '感谢聆听')}</div><p class="lead">${this.esc(content.subText || page.title || '')}</p></div>`;
        }
        const text = content.mainContent || content.text || JSON.stringify(content, null, 2);
        return `<div class="content"><div class="text">${this.esc(text)}</div><aside>${this.esc(this.summary(text))}</aside></div>`;
    }

    static css(theme) {
        const t = this.resolveTheme(theme);
        const primary = t.primaryColor.replace(/^#/, '');
        const bg = t.bgColor.replace(/^#/, '');
        const fg = t.textColor.replace(/^#/, '');
        const accentOn = this.contrastColor(primary);
        const inkOn = this.contrastColor(fg);
        const { grey1, grey2 } = this.generateGreyVariants(bg);
        const grey3 = t.secondaryColor.replace(/^#/, '');

        return `<style>:root{--paper:#${bg};--ink:#${fg};--grey-1:#${grey1};--grey-2:#${grey2};--grey-3:#${grey3};--accent:#${primary};--accent-on:#${accentOn};--ink-on:#${inkOn};--sans:${t.fontFamily};--mono:"JetBrains Mono","IBM Plex Mono","Consolas",monospace}*{box-sizing:border-box;margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:var(--paper);color:var(--ink);font-family:var(--sans)}#deck{position:fixed;inset:0;display:flex;transition:transform .58s cubic-bezier(.2,0,.38,.9);will-change:transform}.slide{width:100vw;height:100vh;flex:0 0 100vw;background:var(--paper);position:relative;overflow:hidden}.slide.accent{background:var(--accent);color:var(--accent-on)}.slide.ink{background:var(--ink);color:var(--ink-on)}.canvas{width:100%;height:100%;padding:5.6vh 5vw 4.4vh;display:flex;flex-direction:column}.chrome{display:flex;justify-content:space-between;margin-bottom:48px;font-family:var(--mono);font-size:14px;letter-spacing:.16em;text-transform:uppercase;opacity:.72}.grid{flex:1;display:grid;grid-template-rows:auto 1fr;gap:4.8vh;min-height:0}.kicker{font-family:var(--mono);font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:var(--grey-3);font-weight:600}.accent .kicker,.ink .kicker{color:currentColor;opacity:.74}h1,h2{font-weight:200;letter-spacing:-.055em;line-height:.92}h1{font-size:min(9.6vw,16vh);max-width:82vw}h2{font-size:min(5.8vw,10.2vh);max-width:78vw}.lead{font-size:clamp(20px,1.6vw,30px);line-height:1.58;color:var(--grey-3);max-width:72ch;white-space:pre-wrap}.accent .lead,.ink .lead{color:currentColor;opacity:.8}.content{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,36vw);gap:5vw;align-items:start;min-height:0}.single{min-height:0}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-content:start}.cards article{border-top:2px solid var(--ink);background:var(--grey-1);padding:22px 22px 26px;min-height:128px}.cards b{display:block;font-size:clamp(32px,3.6vw,56px);font-weight:200;line-height:1;margin-bottom:10px;color:var(--accent)}.text{font-size:clamp(16px,1.3vw,22px);line-height:1.72;white-space:pre-wrap;color:var(--ink)}aside{background:var(--grey-1);border-left:3px solid var(--grey-2);padding:20px 24px;font-size:clamp(13px,1.1vw,16px);line-height:1.68;color:var(--grey-3);border-radius:4px;position:sticky;top:10vh}.statement{font-size:clamp(40px,5.2vw,80px);font-weight:200;letter-spacing:-.04em;line-height:1.06;margin-bottom:2vh}.foot{display:flex;justify-content:space-between;font-size:13px;opacity:.5;letter-spacing:.06em;margin-top:auto;padding-top:2.4vh;border-top:1px solid var(--grey-2)}.nav{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10}.dot{width:10px;height:10px;border-radius:50%;background:var(--grey-2);transition:background .3s,transform .3s}.dot.active{background:var(--accent);transform:scale(1.25)}.hint{position:fixed;top:16px;right:20px;font-size:12px;opacity:.35;z-index:10;font-family:var(--mono);letter-spacing:.08em}.slide-toc{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;width:100%;height:100vh;padding:5.6vh 5vw 4.4vh}.slide-toc .toc-title{font-size:2em;font-weight:bold;margin-bottom:40px;color:var(--ink)}.slide-toc .toc-flow{display:flex;align-items:center;gap:20px;flex-wrap:wrap;justify-content:center}.slide-toc .toc-item{display:flex;flex-direction:column;align-items:center;padding:20px 30px;background:var(--grey-1);border-radius:12px;min-width:150px;transition:transform .2s}.slide-toc .toc-item:hover{transform:translateY(-4px)}.slide-toc .toc-item .toc-number{font-size:2em;font-weight:bold;color:var(--accent);margin-bottom:8px}.slide-toc .toc-item .toc-name{font-size:1.2em;color:var(--ink);font-weight:500}.slide-toc .toc-arrow{font-size:2em;color:var(--accent)}.slide-section{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:var(--accent);color:var(--accent-on)}.slide-section .section-number{font-size:4em;font-weight:bold;opacity:.8;margin-bottom:20px}.slide-section .section-name{font-size:2.5em;font-weight:bold;margin-bottom:15px}.slide-section .section-description{font-size:1.3em;opacity:.9;max-width:600px}@media print{.nav,.hint{display:none}.slide{break-after:page}}</style>`;
    }

    static js(total) {
        return `<script>(()=>{const deck=document.getElementById('deck');const dots=[...document.querySelectorAll('.dot')];let current=0;const total=${total};const go=next=>{current=Math.max(0,Math.min(total-1,next));deck.style.transform='translateX('+(-current*100)+'vw)';dots.forEach((dot,index)=>dot.classList.toggle('active',index===current))};window.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='PageDown'||event.key===' ')go(current+1);if(event.key==='ArrowLeft'||event.key==='PageUp')go(current-1);if(event.key==='Home')go(0);if(event.key==='End')go(total-1)});window.addEventListener('message',event=>{if(event.data&&event.data.type==='deck-keydown'){if(event.data.key==='ArrowRight'||event.data.key==='PageDown'||event.data.key===' ')go(current+1);if(event.data.key==='ArrowLeft'||event.data.key==='PageUp')go(current-1);if(event.data.key==='Home')go(0);if(event.data.key==='End')go(total-1)}});window.addEventListener('wheel',event=>{if(Math.abs(event.deltaY)<30)return;go(current+(event.deltaY>0?1:-1))},{passive:true})})();</script>`;
    }

    static summary(value) {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        return text.length > 96 ? `${text.slice(0, 96)}...` : text || '本页内容由 AI 根据教案结构生成。';
    }

    static esc(value) {
        return String(value ?? '')
            .replace(/&/g, '\x26amp;')
            .replace(/</g, '\x26lt;')
            .replace(/>/g, '\x26gt;')
            .replace(/"/g, '\x26quot;')
            .replace(/'/g, '\x26#39;');
    }
}

module.exports = HtmlDeckService;
