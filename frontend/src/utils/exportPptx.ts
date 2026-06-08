import PptxGenJS from 'pptxgenjs';

interface ExportPage {
  type: string;
  title: string;
  mainContent: string;
  notes: string;
}

/** 模板主题配置 */
interface ThemeConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

const THEMES: Record<string, ThemeConfig> = {
  default: {
    name: '默认蓝',
    primaryColor: '1E40AF',
    secondaryColor: '3B82F6',
    bgColor: 'FFFFFF',
    textColor: '1F2937',
    accentColor: 'EFF6FF',
    fontFamily: 'Microsoft YaHei',
  },
  modern: {
    name: '现代紫',
    primaryColor: '7C3AED',
    secondaryColor: 'A78BFA',
    bgColor: 'FFFFFF',
    textColor: '1F2937',
    accentColor: 'F5F3FF',
    fontFamily: 'Microsoft YaHei',
  },
  academic: {
    name: '学术绿',
    primaryColor: '059669',
    secondaryColor: '34D399',
    bgColor: 'FFFFFF',
    textColor: '1F2937',
    accentColor: 'ECFDF5',
    fontFamily: 'Microsoft YaHei',
  },
  warm: {
    name: '温暖橙',
    primaryColor: 'EA580C',
    secondaryColor: 'FB923C',
    bgColor: 'FFFFFF',
    textColor: '1F2937',
    accentColor: 'FFF7ED',
    fontFamily: 'Microsoft YaHei',
  },
  business: {
    name: '商务灰',
    primaryColor: '374151',
    secondaryColor: '6B7280',
    bgColor: 'FFFFFF',
    textColor: '1F2937',
    accentColor: 'F9FAFB',
    fontFamily: 'Microsoft YaHei',
  },
  creative: {
    name: '创意粉',
    primaryColor: 'DB2777',
    secondaryColor: 'F472B6',
    bgColor: 'FFFFFF',
    textColor: '1F2937',
    accentColor: 'FDF2F8',
    fontFamily: 'Microsoft YaHei',
  },
};

/**
 * 将编辑器页面数据导出为 PPTX 文件
 * 参考飞象老师的模板化生成方式
 */
export const exportToPptx = (title: string, pages: ExportPage[], template: string = 'default') => {
  const pptx = new PptxGenJS();
  const theme = THEMES[template] || THEMES.default;

  // 设置演示文稿属性
  pptx.title = title || '未命名PPT';
  pptx.author = 'AI教学助手';
  pptx.subject = '教学课件';

  // 设置幻灯片尺寸为16:9
  pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 });
  pptx.layout = 'CUSTOM';

  pages.forEach((page, index) => {
    const slide = pptx.addSlide();

    switch (page.type) {
      case 'cover':
        renderCoverSlide(slide, pptx, theme, page, index);
        break;
      case 'toc':
        renderTocSlide(slide, pptx, theme, page, index);
        break;
      case 'content':
        renderContentSlide(slide, pptx, theme, page, index);
        break;
      case 'end':
        renderEndSlide(slide, pptx, theme, page, index);
        break;
      default:
        renderContentSlide(slide, pptx, theme, page, index);
    }

    // 添加备注
    if (page.notes) {
      slide.addNotes(page.notes);
    }
  });

  // 生成并下载文件
  const fileName = `${title || '未命名PPT'}.pptx`;
  pptx.writeFile({ fileName }).catch((err) => {
    console.error('生成PPTX失败:', err);
  });
};

/** 渲染封面页 */
function renderCoverSlide(slide: any, pptx: PptxGenJS, theme: ThemeConfig, page: ExportPage, index: number) {
  // 背景
  slide.background = { color: theme.primaryColor };

  // 装饰圆形
  slide.addShape('ellipse', {
    x: -2, y: -2, w: 6, h: 6,
    fill: { color: theme.secondaryColor, transparency: 70 },
  });
  slide.addShape('ellipse', {
    x: 10, y: 4, w: 5, h: 5,
    fill: { color: theme.secondaryColor, transparency: 80 },
  });

  // 顶部装饰线
  slide.addShape('rect', {
    x: 5.5, y: 2, w: 2.33, h: 0.06,
    fill: { color: 'FFFFFF', transparency: 40 },
  });

  // 主标题
  slide.addText(page.title || '幻灯片标题', {
    x: 1, y: 2.3, w: 11.33, h: 1.5,
    fontSize: 40, fontFace: theme.fontFamily,
    color: 'FFFFFF', bold: true, align: 'center',
  });

  // 底部装饰线
  slide.addShape('rect', {
    x: 5.5, y: 4, w: 2.33, h: 0.06,
    fill: { color: 'FFFFFF', transparency: 40 },
  });

  // 副标题
  if (page.mainContent) {
    slide.addText(page.mainContent, {
      x: 1, y: 4.3, w: 11.33, h: 0.8,
      fontSize: 18, fontFace: theme.fontFamily,
      color: 'FFFFFF', align: 'center',
    });
  }

  // 底部信息
  slide.addText('AI教学助手', {
    x: 1, y: 6.5, w: 11.33, h: 0.5,
    fontSize: 12, fontFace: theme.fontFamily,
    color: 'FFFFFF', align: 'center',
  });
}

/** 渲染目录页 */
function renderTocSlide(slide: any, pptx: PptxGenJS, theme: ThemeConfig, page: ExportPage, index: number) {
  slide.background = { color: theme.bgColor };

  // 左侧装饰条
  slide.addShape('rect', {
    x: 0, y: 0, w: 0.15, h: 7.5,
    fill: { color: theme.primaryColor },
  });

  // 标题
  slide.addText(page.title || '目录', {
    x: 0.8, y: 0.4, w: 11.73, h: 1,
    fontSize: 28, fontFace: theme.fontFamily,
    color: theme.primaryColor, bold: true,
  });

  // 装饰线
  slide.addShape('rect', {
    x: 0.8, y: 1.3, w: 2, h: 0.05,
    fill: { color: theme.secondaryColor },
  });

  // 目录项
  const items = (page.mainContent || '').split('\n').filter(Boolean);
  items.forEach((item, i) => {
    const y = 1.8 + i * 1.0;

    // 编号圆形
    slide.addShape('ellipse', {
      x: 1.2, y: y + 0.05, w: 0.5, h: 0.5,
      fill: { color: theme.primaryColor },
    });
    slide.addText(`${i + 1}`, {
      x: 1.2, y: y + 0.05, w: 0.5, h: 0.5,
      fontSize: 14, fontFace: theme.fontFamily,
      color: 'FFFFFF', bold: true, align: 'center', valign: 'middle',
    });

    // 章节标题
    slide.addText(item, {
      x: 2, y: y, w: 8, h: 0.6,
      fontSize: 16, fontFace: theme.fontFamily,
      color: theme.textColor, valign: 'middle',
    });

    // 装饰线
    slide.addShape('rect', {
      x: 2, y: y + 0.65, w: 8, h: 0.02,
      fill: { color: theme.secondaryColor, transparency: 60 },
    });
  });
}

/** 渲染内容页 */
function renderContentSlide(slide: any, pptx: PptxGenJS, theme: ThemeConfig, page: ExportPage, index: number) {
  slide.background = { color: theme.bgColor };

  // 顶部色块
  slide.addShape('rect', {
    x: 0, y: 0, w: 13.33, h: 1.3,
    fill: { color: theme.accentColor },
  });

  // 左侧装饰条
  slide.addShape('rect', {
    x: 0, y: 0, w: 0.12, h: 1.3,
    fill: { color: theme.primaryColor },
  });

  // 标题
  slide.addText(page.title || '页面标题', {
    x: 0.8, y: 0.2, w: 11.73, h: 0.9,
    fontSize: 26, fontFace: theme.fontFamily,
    color: theme.primaryColor, bold: true,
  });

  // 底部装饰线
  slide.addShape('rect', {
    x: 0, y: 1.3, w: 13.33, h: 0.06,
    fill: { color: theme.secondaryColor },
  });

  // 内容
  if (page.mainContent) {
    const lines = page.mainContent.split('\n');
    const contentItems = lines.filter((l: string) => l.trim());

    if (contentItems.length <= 1) {
      // 单段内容
      slide.addText(page.mainContent, {
        x: 0.8, y: 1.7, w: 11.73, h: 5,
        fontSize: 16, fontFace: theme.fontFamily,
        color: theme.textColor, valign: 'top',
        lineSpacingMultiple: 1.8,
      });
    } else {
      // 多行内容 - 使用列表样式
      contentItems.forEach((item: string, i: number) => {
        const y = 1.8 + i * 0.7;
        if (y < 6.5) {
          // 圆点标记
          slide.addShape('ellipse', {
            x: 1, y: y + 0.12, w: 0.2, h: 0.2,
            fill: { color: theme.secondaryColor },
          });
          // 内容文本
          slide.addText(item.trim(), {
            x: 1.4, y: y, w: 10.5, h: 0.5,
            fontSize: 15, fontFace: theme.fontFamily,
            color: theme.textColor, valign: 'middle',
          });
        }
      });
    }
  }

  // 页码
  slide.addText(`${index + 1}`, {
    x: 12, y: 6.8, w: 1, h: 0.5,
    fontSize: 10, fontFace: theme.fontFamily,
    color: '9CA3AF', align: 'center',
  });

  // 底部装饰
  slide.addShape('rect', {
    x: 0, y: 7.2, w: 13.33, h: 0.3,
    fill: { color: theme.primaryColor, transparency: 90 },
  });
}

/** 渲染结束页 */
function renderEndSlide(slide: any, pptx: PptxGenJS, theme: ThemeConfig, page: ExportPage, index: number) {
  slide.background = { color: theme.primaryColor };

  // 装饰圆形
  slide.addShape('ellipse', {
    x: 5, y: 1.5, w: 3.33, h: 3.33,
    fill: { color: theme.secondaryColor, transparency: 70 },
  });

  // 顶部装饰线
  slide.addShape('rect', {
    x: 5.5, y: 2.5, w: 2.33, h: 0.06,
    fill: { color: 'FFFFFF', transparency: 40 },
  });

  // 主标题
  slide.addText(page.title || '谢谢观看', {
    x: 1, y: 2.8, w: 11.33, h: 1.5,
    fontSize: 40, fontFace: theme.fontFamily,
    color: 'FFFFFF', bold: true, align: 'center',
  });

  // 装饰线
  slide.addShape('rect', {
    x: 5.5, y: 4.5, w: 2.33, h: 0.06,
    fill: { color: 'FFFFFF', transparency: 40 },
  });

  // Thank You
  slide.addText('Thank You', {
    x: 1, y: 4.8, w: 11.33, h: 0.8,
    fontSize: 20, fontFace: theme.fontFamily,
    color: 'FFFFFF', align: 'center',
  });

  // 底部信息
  slide.addText('AI教学助手', {
    x: 1, y: 6.5, w: 11.33, h: 0.5,
    fontSize: 12, fontFace: theme.fontFamily,
    color: 'FFFFFF', align: 'center',
  });
}

/** 获取所有可用模板 */
export const getTemplates = () => {
  return Object.entries(THEMES).map(([key, value]) => ({
    id: key,
    name: value.name,
    primaryColor: value.primaryColor,
  }));
};
