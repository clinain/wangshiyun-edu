import React, { useEffect, useRef } from 'react';

interface OnlyOfficeEditorProps {
  documentUrl: string;
  documentKey: string;
  title: string;
  onSave?: (data: any) => void;
  onClose?: () => void;
}

/**
 * ONLYOFFICE 编辑器组件
 * 通过 API 嵌入 ONLYOFFICE Document Server 编辑器
 */
const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({
  documentUrl,
  documentKey,
  title,
  onSave,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const initEditor = () => {
      const DocsAPI = (window as any).DocsAPI;
      if (!DocsAPI || !DocsAPI.DocEditor) {
        console.error('ONLYOFFICE API 未加载');
        return;
      }

      console.log('初始化 ONLYOFFICE 编辑器:', { documentUrl, documentKey, title });
      
      try {
        editorRef.current = new DocsAPI.DocEditor(containerRef.current, {
          document: {
            fileType: 'pptx',
            key: documentKey,
            title: title,
            url: documentUrl,
          },
          documentType: 'presentation',
          editorConfig: {
            mode: 'edit',
            lang: 'zh-CN',
            user: {
              id: 'user-1',
              name: '教师',
            },
          },
          width: '100%',
          height: '100%',
          events: {
            onReady: () => {
              console.log('ONLYOFFICE 编辑器已就绪');
            },
            onSave: (event: any) => {
              console.log('文档已保存', event);
              onSave?.(event);
            },
            onError: (event: any) => {
              console.error('ONLYOFFICE 错误:', event);
            },
          },
        });
      } catch (err) {
        console.error('初始化 ONLYOFFICE 编辑器失败:', err);
      }
    };

    // 加载 ONLYOFFICE API 脚本
    script = document.createElement('script');
    script.src = `${window.location.protocol}//${window.location.hostname}:8080/web-apps/apps/api/documents/api.js`;
    script.async = true;
    script.onload = () => {
      // 等待一小段时间确保脚本完全加载
      setTimeout(initEditor, 500);
    };
    script.onerror = () => {
      console.error('ONLYOFFICE API 脚本加载失败');
    };

    document.head.appendChild(script);

    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor?.();
        } catch (e) {}
        editorRef.current = null;
      }
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [documentUrl, documentKey, title]);

  return (
    <div className="w-full h-full" ref={containerRef} />
  );
};

export default OnlyOfficeEditor;
