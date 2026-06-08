import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import CommentSection from '@/components/CommentSection';
import { resourceAPI, portfolioAPI } from '@/api';
import type { Resource, Portfolio } from '@/types';

const resourceTypes = ['全部', 'Word', 'PDF', 'PPT', '视频', '音频', '图片', '其他'];
const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const grades = ['全部', '小学', '初中', '高中'];

const getDisplayType = (resource: any): string => {
  const format = (resource.fileFormat || resource.file_format || '').toLowerCase();
  const type = resource.type || '';
  if (type === 'image') return '图片';
  if (type === 'video') return '视频';
  if (type === 'audio') return '音频';
  if (['doc', 'docx'].includes(format)) return 'Word';
  if (format === 'pdf') return 'PDF';
  if (['ppt', 'pptx'].includes(format)) return 'PPT';
  return '其他';
};

const getTypeColor = (displayType: string) => {
  switch (displayType) {
    case 'Word': return 'bg-blue-100 text-blue-600';
    case 'PDF': return 'bg-red-100 text-red-600';
    case 'PPT': return 'bg-orange-100 text-orange-600';
    case '视频': return 'bg-purple-100 text-purple-600';
    case '音频': return 'bg-green-100 text-green-600';
    case '图片': return 'bg-pink-100 text-pink-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getTypeIcon = (displayType: string) => {
  switch (displayType) {
    case 'Word':
      return (
        <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'PDF':
      return (
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'PPT':
      return (
        <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case '视频':
      return (
        <svg className="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case '音频':
      return (
        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    case '图片':
      return (
        <svg className="h-8 w-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
};

const fixResourceUrl = (url: string, type?: string, format?: string): string => {
  if (!url) return url;
  if (/\/uploads\/(images|documents|videos|others)\//.test(url)) return url;
  let subDir = 'others';
  if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(format || '')) subDir = 'images';
  else if (type === 'video' || ['mp4', 'webm', 'mpeg'].includes(format || '')) subDir = 'videos';
  else if (['doc', 'docx', 'pdf', 'ppt', 'pptx'].includes(format || '')) subDir = 'documents';
  return url.replace('/uploads/', `/uploads/${subDir}/`);
};

const Resources: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', category: '', subject: '', grade: '', tags: ''
  });
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const [selectedGrade, setSelectedGrade] = useState('全部');
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [previewPortfolio, setPreviewPortfolio] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, searchKeyword, selectedType, selectedSubject, selectedGrade]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const typeMap: Record<string, string> = {
        'Word': 'word', 'PDF': 'pdf', 'PPT': 'ppt',
        '视频': 'video', '音频': 'audio', '图片': 'image', '其他': 'other'
      };
      const typeFilter = selectedType === '全部' ? undefined : (typeMap[selectedType] || selectedType);
      const subjectFilter = selectedSubject === '全部' ? undefined : selectedSubject;
      const gradeFilter = selectedGrade === '全部' ? undefined : selectedGrade;

      if (activeTab === 'all') {
        const [resourcesResult, portfoliosResult] = await Promise.all([
          resourceAPI.list({
            keyword: searchKeyword || undefined,
            type: typeFilter,
            subject: subjectFilter,
            grade: gradeFilter
          }).catch(() => ({ resources: [] })),
          portfolioAPI.allPublic({ keyword: searchKeyword || undefined, pageSize: 100 }).catch(() => ({ portfolios: [] }))
        ]);
        setResources(resourcesResult.resources || []);
        setPortfolios(portfoliosResult.portfolios || []);
      } else if (activeTab === 'my') {
        const result = await resourceAPI.myResources({
          keyword: searchKeyword || undefined
        }).catch(() => ({ resources: [] }));
        setResources(result.resources || []);
        setPortfolios([]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      setResources([]);
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => setSearchKeyword(keyword);

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('确定要删除这个资源吗？此操作不可恢复。')) return;
    try {
      await resourceAPI.delete(resourceId);
      fetchData();
    } catch (err: any) {
      alert(`删除失败: ${err.response?.data?.message || err.message || '删除失败'}`);
    }
  };

  const handleTogglePublic = async (resourceId: number) => {
    try {
      await resourceAPI.togglePublic(resourceId);
      fetchData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleCopyToMy = async (resourceId: number) => {
    try {
      await resourceAPI.copyToMy(resourceId);
      alert('已复制到我的资源');
    } catch (err) {
      alert('复制失败');
    }
  };

  const handleViewPortfolio = (portfolioId: number) => {
    window.open(`/portfolios/${portfolioId}/view`, '_blank');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadForm({ title: file.name.split('.')[0], description: '', category: '', subject: '', grade: '', tags: '' });
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      Object.entries(uploadForm).forEach(([key, value]) => formData.append(key, value));
      await resourceAPI.upload(formData);
      setShowUploadModal(false);
      setUploadFile(null);
      fetchData();
    } catch (err) {
      setError((err as Error).message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('zh-CN');

  return (
    <Layout
      title="资源中心"
      subtitle="管理教学资源文件"
      breadcrumbs={[
        { label: '首页', path: '/' },
        { label: '资源中心' }
      ]}
    >
      {error && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-600 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 border-b border-gray-200 md:border-b-0 md:border-r md:pb-0">
            {(['all', 'my'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'all' ? '全部资源' : '我的资源'}
              </button>
            ))}
          </div>
          <div className="flex-1 flex gap-3">
            <input
              type="text"
              placeholder="搜索资源..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">搜索</button>
            <label className="relative inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <input type="file" className="hidden" onChange={handleFileSelect} disabled={uploading} />
              <span className="ml-2 text-sm text-gray-600">{uploading ? '上传中...' : '上传文件'}</span>
            </label>
          </div>
        </div>

        {activeTab === 'all' && (
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">类型：</span>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                {resourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            {/* 全部资源标签下的作品集 */}
            {activeTab === 'all' && portfolios.map((portfolio) => (
              <div key={`portfolio-${portfolio.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center p-4 gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-800 truncate">{portfolio.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary-100 text-primary-600 flex-shrink-0">作品集</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{portfolio.lessonIds?.length || 0} 个教案</span>
                      <span>{portfolio.pptIds?.length || 0} 个PPT</span>
                      <span>{formatDate(portfolio.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    <button onClick={() => handleViewPortfolio(portfolio.id)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">查看</button>
                    <button onClick={() => setPreviewPortfolio(portfolio)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors flex items-center gap-1" title="查看评论">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      评论
                    </button>
                    <button onClick={async () => { try { const blob = await portfolioAPI.export(portfolio.id); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${portfolio.name || '作品集'}.zip`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); } catch (e) { alert('下载失败，请重试'); } }} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1" title="下载作品集">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      下载
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* 资源列表 */}
            {resources.map((resource) => {
              const isMyResource = activeTab === 'my';
              return (
                <div key={`resource-${resource.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center p-3 md:p-4 gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getTypeIcon(getDisplayType(resource))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-800 truncate text-sm md:text-base">{resource.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getTypeColor(getDisplayType(resource))}`}>
                          {getDisplayType(resource)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 text-xs text-gray-400">
                        <span>{formatFileSize(resource.fileSize || 0)}</span>
                        <span>{formatDate(resource.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <button onClick={() => setPreviewResource(resource)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        查看
                      </button>
                      <button onClick={() => setPreviewResource(resource)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors flex items-center gap-1" title="查看评论">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        评论
                      </button>
                      {activeTab === 'all' && (
                        <button onClick={() => handleCopyToMy(resource.id)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">下载</button>
                      )}
                      {activeTab === 'my' && (
                        <button onClick={() => handleTogglePublic(resource.id)} className={`px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg transition-colors ${resource.isPublic ? 'text-gray-600 hover:bg-gray-100' : 'text-primary-600 hover:bg-primary-50'}`}>
                          {resource.isPublic ? '私有' : '公开'}
                        </button>
                      )}
                      {activeTab === 'my' && (
                        <button onClick={() => handleDeleteResource(resource.id)} className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-danger-500 hover:text-white hover:bg-danger-500 rounded-lg transition-colors">删除</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {!loading && resources.length === 0 && portfolios.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>暂无资源</p>
        </div>
      )}

      {/* 文件预览模态框 */}
      {previewResource && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4" onClick={() => setPreviewResource(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 md:p-4 border-b flex-shrink-0">
              <h3 className="font-semibold text-gray-800 truncate">{previewResource.title}</h3>
              <button onClick={() => setPreviewResource(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 min-h-0">
              {/* 左侧：预览内容 */}
              <div className="overflow-auto p-4 flex items-center justify-center flex-1 border-r border-gray-100">
                {(() => {
                  const url = fixResourceUrl(previewResource.fileUrl || previewResource.file_url || '', previewResource.type, (previewResource.fileFormat || '').toLowerCase());
                  const format = (previewResource.fileFormat || '').toLowerCase();
                  const type = previewResource.type || '';
                  if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(format)) {
                    return <img src={url} alt={previewResource.title} className="max-w-full max-h-full object-contain" />;
                  }
                  if (type === 'video' || ['mp4', 'webm', 'mpeg'].includes(format)) {
                    return <video src={url} controls className="max-w-full max-h-full">您的浏览器不支持视频播放</video>;
                  }
                  if (type === 'audio' || ['mp3', 'wav', 'ogg', 'm4a'].includes(format)) {
                    return <audio src={url} controls className="w-full">您的浏览器不支持音频播放</audio>;
                  }
                  if (format === 'pdf') {
                    return <iframe src={url} className="w-full h-full border-0" title={previewResource.title} />;
                  }
                  return (
                    <div className="text-center py-12">
                      <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 mb-4">此文件类型暂不支持在线预览</p>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors inline-block">下载文件</a>
                    </div>
                  );
                })()}
              </div>
              {/* 右侧：评论区 */}
              <div className="overflow-y-auto flex-shrink-0 w-[380px] p-4">
                <CommentSection resourceId={previewResource.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 作品集预览模态框 */}
      {previewPortfolio && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4" onClick={() => setPreviewPortfolio(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[95vh] md:h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 md:p-4 border-b flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-800">{previewPortfolio.name}</h3>
                <p className="text-sm text-gray-500">{previewPortfolio.description || '暂无描述'}</p>
              </div>
              <button onClick={() => setPreviewPortfolio(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📦 {previewPortfolio.lessonIds?.length || 0} 个教案</span>
                <span>📊 {previewPortfolio.pptIds?.length || 0} 个PPT</span>
                <span>👁️ {previewPortfolio.viewCount || 0} 次浏览</span>
              </div>
            </div>
            <div className="border-t border-gray-100 p-3 md:p-5 overflow-y-auto flex-1 min-h-[300px]">
              <CommentSection portfolioId={previewPortfolio.id} />
            </div>
          </div>
        </div>
      )}

      {/* 上传弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">上传资源</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">文件名称</label>
                <input type="text" value={uploadFile?.name || ''} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资源标题 *</label>
                <input type="text" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="请输入资源标题" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="请输入资源描述" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学科</label>
                  <select value={uploadForm.subject} onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">请选择学科</option>
                    {subjects.filter(s => s !== '全部').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <select value={uploadForm.grade} onChange={(e) => setUploadForm({ ...uploadForm, grade: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">请选择年级</option>
                    {grades.filter(g => g !== '全部').map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                <input type="text" value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="多个标签用逗号分隔" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleUploadSubmit} disabled={!uploadForm.title || uploading} className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                {uploading ? '上传中...' : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Resources;
