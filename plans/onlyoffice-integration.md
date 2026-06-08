# ONLYOFFICE Document Server 集成计划

## 概述

集成 ONLYOFFICE Document Server 提供完整的 PPT 编辑功能，体验接近 WPS。

## 架构

```
+------------------+     +-----------------------+     +------------------+
|   前端 React App | --> | ONLYOFFICE DocServer  | <-- |  后端 Node.js    |
|   (端口 5173)    |     | (端口 8080)           |     |  (端口 3003)     |
|                  |     | Docker 容器           |     |                  |
| - PPT 列表页     |     | - 完整 PPT 编辑       |     | - 文件存储       |
| - 编辑器 iframe  |     | - 实时协作            |     | - PPT 元数据管理 |
| - 预览页         |     | - 格式支持            |     | - API 接口       |
+------------------+     +-----------------------+     +------------------+
```

## 部署步骤

### 1. Docker 部署 ONLYOFFICE Document Server

```bash
docker run -i -t -d \
  --name onlyoffice-document-server \
  -p 8080:80 \
  -v /onlyoffice/data:/var/www/onlyoffice/Data \
  onlyoffice/documentserver:latest
```

### 2. 前端集成

使用 ONLYOFFICE Document Server API 的 JavaScript SDK:
- 安装: `npm install @ONLYOFFICE/onlyoffice-integration` 或直接引用 CDN
- 通过 iframe 嵌入编辑器
- 监听保存事件，将 PPT 数据同步到后端

### 3. 后端改造

- 新增文件存储 API（接收 ONLYOFFICE 保存的 PPTX 文件）
- PPT 记录关联实际的 PPTX 文件路径
- 提供文件下载/预览接口

## 前端集成代码示例

```jsx
// 在 PPT 编辑页面中
const OnlyOfficeEditor = ({ documentUrl, documentKey, onSave }) => {
  useEffect(() => {
    const config = {
      document: {
        fileType: 'pptx',
        key: documentKey,
        title: '演示文稿.pptx',
        url: documentUrl,
      },
      editorConfig: {
        callbackUrl: '/api/onlyoffice/callback',
        mode: 'edit',
        lang: 'zh-CN',
      },
    };
    
    const docEditor = new window.DocsAPI.DocEditor('onlyoffice-editor', config);
    
    return () => {
      docEditor.destroyEditor();
    };
  }, []);

  return <div id="onlyoffice-editor" />;
};
```

## 需要修改的文件

1. **docker-compose.yml** — 新增 ONLYOFFICE 服务
2. **frontend/src/pages/PPTEditor.tsx** — 新建 ONLYOFFICE 编辑器页面
3. **frontend/src/App.tsx** — 新增编辑器路由
4. **backend/src/routes/ppt.js** — 新增文件上传/下载接口
5. **backend/src/controllers/pptController.js** — 新增 ONLYOFFICE 回调处理
6. **database** — PPT 记录表新增 file_url 字段

## 系统要求

- Docker Desktop（已安装）
- 至少 2GB RAM 用于 ONLYOFFICE 容器
- 端口 8080 可用

## 注意事项

- ONLYOFFICE Document Server 启动较慢（约 30-60 秒）
- 需要 HTTPS 用于生产环境（本地开发可用 HTTP）
- 文件大小限制默认 10MB
